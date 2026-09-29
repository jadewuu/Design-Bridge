import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const kit = resolve(process.argv[2] || join(root, 'dist/Design-Bridge'))
const sdk = join(kit, 'mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client')
const { Client } = await import(pathToFileURL(join(sdk, 'index.js')).href)
const { StdioClientTransport } = await import(pathToFileURL(join(sdk, 'stdio.js')).href)
const directory = await mkdtemp(join(tmpdir(), 'design-bridge-package-'))
const env = {
  PATH: process.env.PATH,
  DESIGN_BRIDGE_MCP_RUNTIME_DIR: directory,
  DESIGN_BRIDGE_MCP_LOG_DIR: directory,
  DESIGN_BRIDGE_MCP_ASSET_DIR: join(directory, 'assets'),
  TEMPAD_MCP_ALLOWED_EXTENSION_ORIGINS: 'chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
}
const hub = spawn(process.execPath, [join(kit, 'mcp/dist/hub.mjs')], {
  env,
  stdio: ['ignore', 'ignore', 'pipe']
})
let stderr = ''
hub.stderr.on('data', (data) => {
  stderr += data
})
const client = new Client({ name: 'design-bridge-package-check', version: '1.0.0' })
try {
  let ready = false
  for (let attempt = 0; attempt < 200; attempt++) {
    if (hub.exitCode !== null) throw new Error(`Packaged Hub exited: ${stderr}`)
    try {
      const identity = JSON.parse(await readFile(join(directory, 'hub-runtime.json'), 'utf8'))
      if (identity.processId === hub.pid) {
        ready = true
        break
      }
    } catch {
      /* Hub is still starting. */
    }
    await delay(25)
  }
  assert.ok(ready, `Packaged Hub did not start: ${stderr}`)
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(kit, 'mcp/dist/cli.mjs')],
    env,
    stderr: 'pipe'
  })
  transport.stderr.on('data', (data) => {
    stderr += data
  })
  await client.connect(transport, { timeout: 5000 })
  assert.equal(client.getServerVersion().name, 'design-bridge')
  const tools = await client.listTools()
  for (const name of ['get_code', 'get_structure', 'get_screenshot', 'list_design_sessions']) {
    assert.ok(
      tools.tools.some((tool) => tool.name === name),
      `Missing ${name}`
    )
  }
  const result = await client.callTool({ name: 'list_design_sessions', arguments: {} })
  assert.notEqual(result.isError, true)
  const manifest = JSON.parse(await readFile(join(kit, 'chrome-extension/manifest.json'), 'utf8'))
  assert.equal(manifest.name, 'Design Bridge')
  assert.equal(manifest.update_url, undefined)
  const rules = JSON.parse(await readFile(join(kit, 'chrome-extension/rules/figma.json'), 'utf8'))
  assert.equal(
    rules.some((rule) => rule.condition.requestDomains?.includes('ecomfe.github.io')),
    false
  )
  console.log(
    `Packaged MCP initialized; ${tools.tools.length} tools; sessions call passed; local extension rules verified.`
  )
} finally {
  await client.close()
  if (hub.exitCode === null && hub.signalCode === null) {
    const exited = once(hub, 'exit')
    hub.kill('SIGTERM')
    await exited
  }
  await rm(directory, { recursive: true, force: true })
}
