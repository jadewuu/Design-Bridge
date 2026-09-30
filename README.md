# Design Bridge

**Language:** English | [简体中文](README.zh-Hans.md)

Read Figma selections in Chrome through a local MCP bridge and use them with Codex, Claude Code, or another local MCP client to implement UI in an existing project.

## Get started

1. Download the kit from [Releases](https://github.com/jadewuu/Design-Bridge/releases) and extract it to a permanent directory. Use Node.js 22, 24, or 26+.
2. In `chrome://extensions`, enable Developer mode, load the kit's `chrome-extension` directory, and refresh Figma. Enable **Preferences → Agent integration → MCP** in the Design Bridge panel.
3. In the kit directory, run `node install.mjs codex` or `node install.mjs claude`. Restart the client or open a new session.
4. Select a Figma node and ask the agent: “Use Design Bridge to explain this selection, then implement it in this project using its existing components and theme.”

For troubleshooting and other MCP clients, see the [full guide](internal/README.md) or [中文安装与使用指南](internal/README.zh-Hans.md). Build a new kit from source with `pnpm install --frozen-lockfile && pnpm internal:build`.

Third-party copyright and license information: [NOTICE.md](internal/NOTICE.md) and [LICENSE](LICENSE).
