import type { AgentIntegrationConfig } from '@/mcp/config'

const installer = 'node "/ABSOLUTE/PATH/Design-Bridge/install.mjs"'

export const AGENT_INTEGRATIONS_BY_ID = {
  codex: {
    id: 'codex',
    name: 'Codex',
    actions: [
      { id: 'plugin-cli', label: 'Local installer', kind: 'command', value: `${installer} codex` }
    ]
  },
  claude: {
    id: 'claude',
    name: 'Claude Code',
    actions: [
      { id: 'plugin-cli', label: 'Local installer', kind: 'command', value: `${installer} claude` }
    ]
  }
} satisfies Record<'codex' | 'claude', AgentIntegrationConfig>

export const AGENT_INTEGRATIONS = Object.values(AGENT_INTEGRATIONS_BY_ID)

export const MCP_SERVERS_CONFIG_SNIPPET = JSON.stringify(
  {
    mcpServers: {
      'design-bridge': {
        command: '/ABSOLUTE/PATH/node',
        args: ['/ABSOLUTE/PATH/Design-Bridge/mcp/dist/cli.mjs']
      }
    }
  },
  null,
  2
)
