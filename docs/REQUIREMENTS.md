# ByeByeBot 技术规格与实现文档 (v1.0.2)

## 1. 项目概述

### 1.1 核心价值
针对 X (Twitter) 用户在管理关注列表时的痛点，提供一种**非侵入式、高可读性**的视觉辅助工具，快速识别单向关注关系。

### 1.2 设计原则
*   **严谨性 (Rigorous)**：不误报、不漏报、不干扰正常功能。
*   **优雅性 (Elegant)**：UI 融入原生风格，交互细腻流畅。
*   **性能 (Performance)**：最小化 DOM 操作，按需触发。

## 2. 技术架构 (Implementation Details)

### 2.1 核心机制
*   **Manifest V3**：使用 `content_scripts` 注入。
*   **Scope Restriction**：通过 `manifest.json` (`matches`) 和 `content.js` (`window.location`) 双重校验，确保仅在 `https://x.com/*/following` 页面激活。

### 2.2 DOM 嗅探与选择器策略
为了应对 X 的动态类名混淆，本项目完全依赖稳定的 `data-testid` 属性：

| 组件 | 选择器 | 备注 |
| :--- | :--- | :--- |
| **检测范围** | `[data-testid="primaryColumn"]` | 排除侧边栏 (Sidebar) 干扰 |
| **用户卡片** | `[data-testid="UserCell"]` | 列表中的单个用户单元 |
| **互关标记** | `[data-testid="userFollowIndicator"]` | 存在即为互关，缺失即为单向 |
| **头像容器** | `[data-testid^="UserAvatar-Container-"]` | 用于精确挂载 Badge |

### 2.3 状态管理与样式捍卫
由于 X 使用 React 构建，DOM 经常被重绘（Re-render），特别是在 `hover` 交互时。
*   **MutationObserver**：监听无限滚动加载的新节点。
*   **Event Listeners (`mouseleave`)**：主动监听用户鼠标移出卡片的行为，强制执行 `restoreStyles()`，防止原生 CSS 覆盖插件样式。
*   **Data Attributes**：使用 `data-byebyebot-checked` 标记已处理节点，避免 Observer 死循环。

### 2.4 UI/UX 设计系统
*   **Glassmorphism Badge**：位于头像下方，使用线性渐变与微阴影。
*   **Inset Shadow**：使用 `box-shadow: inset` 替代 `border`，杜绝 Layout Shift (布局偏移)。
*   **Micro-Animations**：CSS `cubic-bezier` 实现弹性入场动画。

## 3. 已知问题与解决方案 (Bug History)

*   **[Fixed] Bug 1: 徽章遮挡按钮** -> 移至头像区域。
*   **[Fixed] Bug 2: 样式 Hover 丢失** -> 引入 `mouseleave` 事件强制恢复。
*   **[Fixed] Bug 3: 徽章遮挡名字** -> 移至头像正下方 (`bottom: -10px`)。
*   **[Fixed] Bug 4: 侧边栏误伤** -> 增加 `primaryColumn` 作用域限制。

## 4. 未来规划
*   [ ] 增加配置面板（允许用户自定义颜色）。
*   [ ] 支持批量取关功能（需慎重评估风控风险）。