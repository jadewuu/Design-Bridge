import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const kit = join(root, 'dist/Design-Bridge')

function pnpm(...args) {
  const result = spawnSync('corepack', ['pnpm', ...args], { cwd: root, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`pnpm ${args.join(' ')} failed`)
}

pnpm('--filter', '@tempad-dev/shared', 'build')
pnpm('build:mcp')
pnpm('build:ext')
rmSync(kit, { recursive: true, force: true })
mkdirSync(kit, { recursive: true })
pnpm('--filter', '@tempad-dev/mcp', 'deploy', '--prod', '--legacy', join(kit, 'mcp'))
// pnpm 12's automatic install prunes source dev tools when deploy uses --prod.
pnpm('install', '--frozen-lockfile', '--offline')
cpSync(join(root, 'packages/extension/.output/chrome-mv3'), join(kit, 'chrome-extension'), {
  recursive: true
})
for (const name of ['install.mjs', 'README.md', 'README.zh-Hans.md', 'NOTICE.md']) {
  cpSync(join(root, 'internal', name), join(kit, name))
}
cpSync(join(root, 'LICENSE'), join(kit, 'LICENSE'))
cpSync(join(root, 'LICENSE'), join(kit, 'mcp/LICENSE'))
for (const name of ['README.md', 'README.zh-Hans.md']) {
  cpSync(join(root, 'internal', name), join(kit, 'mcp', name))
}
cpSync(join(root, 'internal/NOTICE.md'), join(kit, 'chrome-extension/NOTICE.md'))
cpSync(join(root, 'LICENSE'), join(kit, 'chrome-extension/LICENSE'))

const skill = join(kit, 'skills/design-bridge-figma-design-to-code')
mkdirSync(dirname(skill), { recursive: true })
cpSync(join(root, 'agent-plugin/src/skills/figma-design-to-code'), skill, { recursive: true })
function adaptSkill(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) adaptSkill(path)
    else if (/\.(md|yaml)$/.test(entry.name)) {
      writeFileSync(
        path,
        readFileSync(path, 'utf8')
          .replaceAll('TemPad Dev', 'Design Bridge')
          .replaceAll('TemPad', 'Design Bridge')
          .replaceAll('name: figma-design-to-code', 'name: design-bridge-figma-design-to-code')
          .replaceAll('$figma-design-to-code', '$design-bridge-figma-design-to-code')
      )
    }
  }
}
adaptSkill(skill)
mkdirSync(join(skill, 'assets'), { recursive: true })
cpSync(join(root, 'packages/extension/public/icon.svg'), join(skill, 'assets/icon.svg'))
cpSync(join(root, 'LICENSE'), join(skill, 'LICENSE'))

const deployedPackage = join(kit, 'mcp/package.json')
const metadata = JSON.parse(readFileSync(deployedPackage, 'utf8'))
metadata.name = '@design-bridge/mcp'
metadata.private = true
delete metadata.publishConfig
delete metadata.repository
metadata.description = 'Local Figma MCP bridge for Design Bridge.'
writeFileSync(deployedPackage, `${JSON.stringify(metadata, null, 2)}\n`)
writeFileSync(
  join(kit, 'release.json'),
  `${JSON.stringify(
    {
      name: 'Design Bridge',
      version: '0.1.4-pilot',
      upstreamCommit: '9f345f3baf47e6659f8f5ac020883a3f18fc23f2',
      extensionVersion: JSON.parse(
        readFileSync(join(kit, 'chrome-extension/manifest.json'), 'utf8')
      ).version,
      mcpVersion: metadata.version,
      ports: [6221, 7432, 8128]
    },
    null,
    2
  )}\n`
)
console.log(`Design Bridge kit: ${kit}`)
