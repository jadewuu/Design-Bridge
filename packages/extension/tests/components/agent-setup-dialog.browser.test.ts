import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { defineComponent, h, nextTick } from 'vue'

import AgentSetupDialog from '@/components/AgentSetupDialog.vue'

import { mount, unmountAll } from './mount'

const tokens = {
  '--spacer-1': '4px',
  '--spacer-2': '8px',
  '--spacer-3': '16px',
  '--spacer-4': '24px',
  '--spacer-5': '32px',
  '--radius-medium': '5px',
  '--color-bg': 'rgb(255, 255, 255)',
  '--color-bg-selected': 'rgb(230, 240, 255)',
  '--color-bg-transparent-hover': 'rgba(0, 0, 0, 0.05)',
  '--color-border': 'rgb(230, 230, 230)',
  '--color-border-selected': 'rgb(12, 140, 233)',
  '--color-icon': 'rgb(0, 0, 0)',
  '--color-icon-hover': 'rgb(0, 0, 0)',
  '--color-text': 'rgb(0, 0, 0)',
  '--color-text-secondary': 'rgb(128, 128, 128)',
  '--text-mono-medium-font-family': 'Roboto Mono, monospace',
  '--text-mono-medium-font-size': '11px',
  '--font-weight-default': '450',
  '--text-mono-medium-letter-spacing': '0.055px',
  '--text-mono-medium-line-height': '16px'
} as const

function mountDialog(): HTMLElement {
  return mount(
    defineComponent(
      () => () =>
        h(AgentSetupDialog, {
          modelValue: true,
          'onUpdate:modelValue': () => undefined
        })
    ),
    { tag: 'tempad', tokens }
  )
}

function getCode(host: HTMLElement): string[] {
  return Array.from(host.querySelectorAll('code'), ({ textContent }) => textContent ?? '')
}

afterEach(unmountAll)

describe('AgentSetupDialog internal distribution', () => {
  it('installs the bundled Codex runtime without downloading upstream releases', async () => {
    const host = mountDialog()
    await nextTick()
    expect(getCode(host)).toEqual(['node "/ABSOLUTE/PATH/Design-Bridge/install.mjs" codex'])
    expect(host.querySelector('[aria-label="Copy command"]')).not.toBeNull()
    expect(host.textContent).toContain('Design Bridge')
    expect(host.querySelectorAll('[role="tab"]')).toHaveLength(3)
  })

  it('offers Claude the same local kit and preserves its model setup', async () => {
    const host = mountDialog()
    await page.getByRole('tab', { name: 'Claude Code' }).click()
    expect(getCode(host)).toEqual(['node "/ABSOLUTE/PATH/Design-Bridge/install.mjs" claude'])
    expect(host.textContent).toContain('CC Switch')
  })

  it('provides a local MCP config when configuring manually', async () => {
    const host = mountDialog()
    await page.getByRole('tab', { name: 'Other agents' }).click()
    expect(JSON.parse(getCode(host)[0]!)).toEqual({
      mcpServers: {
        'design-bridge': {
          command: '/ABSOLUTE/PATH/node',
          args: ['/ABSOLUTE/PATH/Design-Bridge/mcp/dist/cli.mjs']
        }
      }
    })
  })
})
