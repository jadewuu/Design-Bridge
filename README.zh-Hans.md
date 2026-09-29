# Design Bridge

通过 Chrome 读取 Figma 选区，交给 Codex、Claude Code 等本地 MCP 客户端，在已有项目中实现 UI。

## 快速开始

1. 从私密仓库的 [Releases](https://github.com/jadewuu/Design-Bridge/releases) 下载安装包，解压到长期保留的位置。使用 Node.js 22、24 或 26+。
2. 在 `chrome://extensions` 开启开发者模式，点击“加载未打包的扩展程序”，选择包内 `chrome-extension` 文件夹。刷新 Figma，并在 Design Bridge 面板的 **Preferences → Agent integration** 开启 MCP。
3. 在安装包目录运行 `node install.mjs codex` 或 `node install.mjs claude`，重启客户端或开启新会话。
4. 在 Figma 选中节点，让 AI“使用 Design Bridge 讲解当前选区的结构和样式，再复用本项目组件与主题实现 UI”。

完整步骤、排障和其他 MCP 客户端配置见[安装与使用指南](internal/README.zh-Hans.md)。在源码目录运行 `pnpm install --frozen-lockfile && pnpm internal:build` 可生成安装包。

开源组件的版权与许可见 [NOTICE.md](internal/NOTICE.md) 和 [LICENSE](LICENSE)。
