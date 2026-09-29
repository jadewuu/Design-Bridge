import { spawnSync } from 'node:child_process'
import console from 'node:console'
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const [client, flag] = process.argv.slice(2)
const kit = dirname(fileURLToPath(import.meta.url))
const entry = join(kit, 'mcp/dist/cli.mjs')
const skillSource = join(kit, 'skills/design-bridge-figma-design-to-code')
const major = Number(process.versions.node.split('.')[0])

try {
  if (!['codex', 'claude'].includes(client) || (flag && flag !== '--print')) {
    throw new Error('Usage: node install.mjs <codex|claude> [--print]')
  }
  if (major !== 22 && major !== 24 && major < 26) {
    throw new Error('Use Node.js 22, 24, or 26+.')
  }
  if (!existsSync(entry) || !existsSync(skillSource)) {
    throw new Error('Extract the complete Design Bridge kit before running this installer.')
  }
  const args =
    client === 'codex'
      ? ['mcp', 'add', 'design-bridge', '--', process.execPath, entry]
      : [
          'mcp',
          'add',
          '--transport',
          'stdio',
          '--scope',
          'user',
          'design-bridge',
          '--',
          process.execPath,
          entry
        ]
  const configDirectory =
    client === 'codex'
      ? process.env.CODEX_HOME || join(homedir(), '.codex')
      : process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')
  const skillDestination = join(configDirectory, 'skills/design-bridge-figma-design-to-code')
  if (flag === '--print') {
    console.log(JSON.stringify({ command: client, args, skillSource, skillDestination }, null, 2))
  } else {
    const result = spawnSync(client, args, { stdio: 'inherit' })
    if (result.error) throw result.error
    if (result.status !== 0) throw new Error(`${client} MCP setup failed (exit ${result.status}).`)
    mkdirSync(dirname(skillDestination), { recursive: true })
    cpSync(skillSource, skillDestination, { recursive: true })
    console.log(
      `Design Bridge configured. Skill installed at ${skillDestination}. Restart your agent.`
    )
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
