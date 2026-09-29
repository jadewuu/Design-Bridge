import { afterEach, describe, expect, it, vi } from 'vitest'

import { createGetCodeCacheContext } from '@/mcp/tools/code/cache'
import { collectNodeData } from '@/mcp/tools/code/collect'
import { createSnapshot, createTree } from '@/tests/mcp/tools/code/test-helpers'
import { formatNodeStyleForMcp } from '@/utils/variable-output'

vi.mock('@/utils/figma-style/style-resolver', () => ({
  resolveStylesFromNodeData: vi.fn((style) => style)
}))

vi.mock('@/utils/variable-output', () => ({
  formatNodeStyleForMcp: vi.fn((style) => style)
}))

vi.mock('@/mcp/tools/code/assets', () => ({
  hasMediaFills: vi.fn(() => false),
  replaceMediaUrlsWithAssets: vi.fn((style) => Promise.resolve(style))
}))

vi.mock('@/mcp/tools/code/styles', () => ({
  preprocessStyles: vi.fn((style) => style),
  stripInertShadows: vi.fn()
}))

describe('mcp/code collectNodeData operation counts', () => {
  afterEach(() => vi.useRealTimers())

  it('overlaps slow CSS reads within a bounded batch and preserves source order', async () => {
    vi.useFakeTimers()
    let active = 0
    let peak = 0
    const snapshots = Array.from({ length: 6 }, (_, index) => {
      const snapshot = createSnapshot({ id: `node-${index}` })
      snapshot.node = {
        ...snapshot.node,
        getCSSAsync: () => {
          active++
          peak = Math.max(peak, active)
          return new Promise<Record<string, string>>((resolve) => {
            setTimeout(
              () => {
                active--
                resolve({ display: `block-${index}` })
              },
              (6 - index) * 100
            )
          })
        }
      } as SceneNode
      return snapshot
    })

    const pending = collectNodeData(
      createTree(snapshots),
      { cssUnit: 'px', rootFontSize: 16, scale: 1 },
      new Map(),
      createGetCodeCacheContext(new Map())
    )
    await vi.runAllTimersAsync()
    const result = await pending

    expect(peak).toBe(4)
    expect([...result.styles]).toEqual([
      ['node-0', { display: 'block-0' }],
      ['node-1', { display: 'block-1' }],
      ['node-2', { display: 'block-2' }],
      ['node-3', { display: 'block-3' }],
      ['node-4', { display: 'block-4' }],
      ['node-5', { display: 'block-5' }]
    ])
  })

  it('keeps successful node styles when one CSS read rejects', async () => {
    const snapshots = ['first', 'failed', 'last'].map((id) => {
      const snapshot = createSnapshot({ id })
      snapshot.node = {
        ...snapshot.node,
        getCSSAsync: async () => {
          if (id === 'failed') throw new Error('Figma CSS unavailable')
          return { display: id }
        }
      } as SceneNode
      return snapshot
    })
    const result = await collectNodeData(
      createTree(snapshots),
      { cssUnit: 'px', rootFontSize: 16, scale: 1 },
      new Map(),
      createGetCodeCacheContext(new Map())
    )

    expect([...result.styles]).toEqual([
      ['first', { display: 'first' }],
      ['last', { display: 'last' }]
    ])
  })

  it('reads CSS exactly once for every collected node and skips omitted descendants', async () => {
    const snapshots = Array.from({ length: 6 }, (_, index) =>
      createSnapshot({ id: `node-${index}`, type: index === 2 ? 'TEXT' : 'FRAME' })
    )
    const cssReaders = snapshots.map((snapshot, index) => {
      const getCSSAsync = vi.fn().mockResolvedValue({ display: `block-${index}` })
      snapshot.node = {
        id: snapshot.id,
        type: snapshot.type,
        visible: true,
        getCSSAsync,
        ...(snapshot.type === 'TEXT'
          ? { getStyledTextSegments: vi.fn(() => [{ characters: 'copy' }]) }
          : {})
      } as unknown as SceneNode
      return getCSSAsync
    })
    const tree = createTree(snapshots)
    const cache = createGetCodeCacheContext(new Map(), { metrics: true })
    const nodeVariableIds = new Map(
      snapshots.map((snapshot, index) => [snapshot.id, new Set([`var-${index}`])])
    )

    const result = await collectNodeData(
      tree,
      { cssUnit: 'px', rootFontSize: 16, scale: 1 },
      new Map(),
      cache,
      new Set(['node-1', 'node-4']),
      nodeVariableIds
    )

    expect(cssReaders.map((read) => read.mock.calls.length)).toEqual([1, 0, 1, 1, 0, 1])
    expect(result.styles.size).toBe(4)
    expect(result.textSegments.get('node-2')).toEqual([{ characters: 'copy' }])
    expect(
      vi.mocked(formatNodeStyleForMcp).mock.calls.map(([, node, , ids]) => [node.id, ids])
    ).toEqual([
      ['node-0', new Set(['var-0'])],
      ['node-2', new Set(['var-2'])],
      ['node-3', new Set(['var-3'])],
      ['node-5', new Set(['var-5'])]
    ])
    expect(cache.metrics).toMatchObject({
      nodeSemanticHits: 0,
      nodeSemanticMisses: 4
    })
  })
})
