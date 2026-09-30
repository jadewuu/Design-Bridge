# Design Bridge 使用指南

Design Bridge 将 Chrome 中的 Figma 设计选区通过本机 MCP 提供给 AI 开发工具，用于讲解设计或在已有项目中实现 UI。

## 1. 准备

- Chrome、Figma Web 和目标文件的访问权限。读取设计可用 view-only；修改设计需要编辑权限。
- Node.js 22、24 或 26+。运行 `node --version` 检查。
- 已能正常使用的 Codex CLI 或 Claude Code。Claude Code 的公司模型继续由 CC Switch 配置；Design Bridge 不配置模型或 API Key。

从 [Releases](https://github.com/jadewuu/Design-Bridge/releases) 下载 `Design-Bridge-*.tar.gz`，解压到长期保留的位置，例如 `~/Tools/Design-Bridge`。安装配置会引用此目录的绝对路径，之后不要移动。

## 2. 安装 Chrome 扩展

1. 打开 `chrome://extensions`，开启“开发者模式”，点击“加载未打包的扩展程序”，选择安装包中的 `chrome-extension` 文件夹。
2. 若已安装其他会修改 Figma 网页的设计读取扩展，先停用它。刷新已打开的 Figma 页面。
3. 在 Figma 打开 Design Bridge 面板，在 **Preferences → Agent integration** 开启 MCP；浏览器询问时允许访问本机 `127.0.0.1`。

扩展重新加载后，也要刷新 Figma 页面。扩展卡片显示 `Service Worker（无效）` 只表示后台暂未运行；如有加载错误，请打开卡片中的“错误”详情。

## 3. 连接 AI 工具

在安装包根目录运行：

```sh
node install.mjs codex
node install.mjs claude
```

只使用其中一个工具，就只运行对应命令。完成后重启 AI 客户端或开启新会话。检查配置：

```sh
codex mcp get design-bridge
claude mcp get design-bridge
```

安装前想查看改动，可运行 `node install.mjs codex --print` 或 `node install.mjs claude --print`。安装脚本仅注册 `design-bridge` MCP 并复制设计转代码 skill，不改动现有模型配置。

### Trae、WorkBuddy 等其他本地 MCP 客户端

这类客户端可手动添加 **stdio MCP**，配置如下；把两个路径换成本机的绝对路径，合并进现有 MCP 配置：

```json
{
  "mcpServers": {
    "design-bridge": {
      "command": "/绝对路径/node",
      "args": ["/绝对路径/Design-Bridge/mcp/dist/cli.mjs"]
    }
  }
}
```

Trae 在“设置 → MCP → 手动添加/原始配置”中添加；WorkBuddy 在“插件 → MCP 服务器 → 配置 MCP”中添加。两者的实际接入尚未验收。Chrome、MCP 与 AI 客户端须运行在同一台电脑。需要固定工作流程时，可将包内 `skills/design-bridge-figma-design-to-code` 放入该客户端支持的 skill 目录。

## 4. 读取设计并在项目中使用

1. 在 Figma 选中目标 Frame 或其他需要读取的节点。多个文件同时连接时，点击目标文件面板中的 **MCP 徽标**，或向 AI 提供目标文件链接。
2. 在 AI 客户端打开已有项目，发送：

> 使用 Design Bridge 读取当前 Figma 选区，先讲解结构和样式，再在本项目实现 UI。复用项目现有组件、主题和路由，运行项目检查并预览。

只需讲解时可说“使用 Design Bridge 读取当前 Figma 选区，讲解结构和样式”。AI 应先调用 `list_design_sessions`，确认文件后用精确 `sessionId` 调用 `get_code`。读取过程中扩展可能切到目标 Figma 标签，以保证后台导出稳定。

## 常见问题

| 现象                     | 处理                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| `sessions: []`           | 确认 Figma 文件已打开、面板中的 MCP 已开启、浏览器已允许本机连接；重新加载扩展后刷新 Figma 页面。 |
| 安装提示 Node 版本不支持 | 切换到 Node.js 22、24 或 26+，重新运行安装命令。                                                  |
| 多个 Figma 文件读错目标  | 点击目标文件的 MCP 徽标，或给 AI 目标文件链接，让它先核对 `sessionId`。                           |
| Figma 改版后读取失败     | 安装维护者提供的新完整安装包，重新加载扩展并刷新 Figma。                                          |

## 数据与更新

本机桥接仅监听 `127.0.0.1`；读取的设计数据会交给你使用的 AI 客户端和它配置的模型服务。请按公司现有设计数据使用要求选择模型。核心读取使用包内规则，不请求原项目的在线规则或插件目录；可选代码转换插件仅支持用户主动填写插件 URL。完整包包含运行依赖，原项目停用、更新或改变收费不会影响已安装版本的核心读取，但 Figma 改版仍可能需要重新适配和发布。

从源码更新安装包：`pnpm install --frozen-lockfile && pnpm internal:build`。开源组件的版权与许可见 [NOTICE.md](NOTICE.md) 和 [LICENSE](../LICENSE)。
