import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const source = fileURLToPath(new URL('../internal/install.mjs', import.meta.url))

test('local installer preserves paths with spaces and configures only MCP', () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'design-bridge install ')))
  try {
    mkdirSync(join(directory, 'mcp/dist'), { recursive: true })
    mkdirSync(join(directory, 'skills/design-bridge-figma-design-to-code'), { recursive: true })
    writeFileSync(join(directory, 'mcp/dist/cli.mjs'), '')
    cpSync(source, join(directory, 'install.mjs'))
    for (const [client, prefix] of [
      ['codex', ['mcp', 'add', 'design-bridge', '--']],
      ['claude', ['mcp', 'add', '--transport', 'stdio', '--scope', 'user', 'design-bridge', '--']]
    ]) {
      const result = spawnSync(
        process.execPath,
        [join(directory, 'install.mjs'), client, '--print'],
        { encoding: 'utf8' }
      )
      assert.equal(result.status, 0, result.stderr)
      const plan = JSON.parse(result.stdout)
      assert.equal(plan.command, client)
      assert.deepEqual(plan.args, [
        ...prefix,
        process.execPath,
        join(directory, 'mcp/dist/cli.mjs')
      ])
      assert.equal(plan.skillSource, join(directory, 'skills/design-bridge-figma-design-to-code'))
    }
    const invalid = spawnSync(
      process.execPath,
      [join(directory, 'install.mjs'), 'unsupported', '--print'],
      { encoding: 'utf8' }
    )
    assert.equal(invalid.status, 1)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('installer copies the skill after CLI success and preserves company settings', () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'design-bridge-client-')))
  try {
    const configDirectory = join(directory, 'company-config')
    const skillDirectory = join(directory, 'skills/design-bridge-figma-design-to-code')
    mkdirSync(configDirectory)
    mkdirSync(skillDirectory, { recursive: true })
    mkdirSync(join(directory, 'mcp/dist'), { recursive: true })
    mkdirSync(join(directory, 'bin'))
    cpSync(source, join(directory, 'install.mjs'))
    writeFileSync(join(directory, 'mcp/dist/cli.mjs'), '')
    writeFileSync(join(skillDirectory, 'SKILL.md'), 'fixture skill')
    const settings =
      '{"model":"company-model","env":{"ANTHROPIC_BASE_URL":"https://company.example"}}'
    writeFileSync(join(configDirectory, 'settings.json'), settings)
    const cli = join(directory, 'bin/claude')
    writeFileSync(
      cli,
      `#!/usr/bin/env node\nrequire('node:fs').writeFileSync(require('node:path').join(process.env.CLAUDE_CONFIG_DIR, 'args.json'), JSON.stringify(process.argv.slice(2)))\n`,
      { mode: 0o755 }
    )
    const environment = {
      ...process.env,
      PATH: `${join(directory, 'bin')}:${process.env.PATH}`,
      CLAUDE_CONFIG_DIR: configDirectory
    }
    const result = spawnSync(process.execPath, [join(directory, 'install.mjs'), 'claude'], {
      encoding: 'utf8',
      env: environment
    })
    assert.equal(result.status, 0, result.stderr)
    assert.equal(readFileSync(join(configDirectory, 'settings.json'), 'utf8'), settings)
    assert.equal(
      readFileSync(
        join(configDirectory, 'skills/design-bridge-figma-design-to-code/SKILL.md'),
        'utf8'
      ),
      'fixture skill'
    )
    assert.deepEqual(JSON.parse(readFileSync(join(configDirectory, 'args.json'), 'utf8')), [
      'mcp',
      'add',
      '--transport',
      'stdio',
      '--scope',
      'user',
      'design-bridge',
      '--',
      process.execPath,
      join(directory, 'mcp/dist/cli.mjs')
    ])
    rmSync(join(configDirectory, 'skills'), { recursive: true })
    writeFileSync(cli, '#!/usr/bin/env node\nprocess.exit(1)\n', { mode: 0o755 })
    const failed = spawnSync(process.execPath, [join(directory, 'install.mjs'), 'claude'], {
      encoding: 'utf8',
      env: environment
    })
    assert.equal(failed.status, 1)
    assert.equal(existsSync(join(configDirectory, 'skills')), false)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
