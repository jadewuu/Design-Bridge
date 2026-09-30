# Design Bridge internal guide

Design Bridge exposes the current Figma selection in Chrome to local coding agents through MCP. For step-by-step installation and project usage, see the [Chinese guide](README.zh-Hans.md).

1. Download `Design-Bridge-*.tar.gz` from [Releases](https://github.com/jadewuu/Design-Bridge/releases), extract it to a permanent directory, and use Node.js 22, 24, or 26+.
2. In `chrome://extensions`, enable Developer mode and load the kit's `chrome-extension` directory. Refresh open Figma tabs, then enable **Preferences → Agent integration → MCP** in the Design Bridge panel and allow `127.0.0.1` access.
3. Run `node install.mjs codex` and/or `node install.mjs claude` from the kit directory. Restart the client or open a new session. Existing model and company gateway settings remain in the client.
4. Select a Figma node and ask the agent to use Design Bridge to explain its structure and style or implement it in the current project. The agent should call `list_design_sessions`, then `get_code` with the exact `sessionId`.

Other local stdio MCP clients can use the JSON configuration in the Chinese guide. Trae and WorkBuddy setup is documented but not yet verified end to end. The optional code transform plugin installer accepts direct plugin URLs only. The kit bundles its runtime dependencies and Figma rules; updates to the original project do not change an installed kit. Figma web changes may require a new internal build.

Build from source with `pnpm install --frozen-lockfile && pnpm internal:build`. See [NOTICE.md](NOTICE.md) and [LICENSE](../LICENSE) for third-party copyright and license information.
