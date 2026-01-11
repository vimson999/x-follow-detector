# ByeByeBot 👋

> **X (Twitter) 单向关注检测器**  
> *An elegant, non-intrusive Chrome Extension to detect non-followers.*

ByeByeBot 是一个追求**极致美感**与**严谨工程**的浏览器插件。它能在你的 X (Twitter) “正在关注”列表中，自动识别并优雅地标记出那些没有回关你的人。

![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ 核心特性

*   **🎯 精准定位**：仅在 `/following` 页面运行，零误伤，零资源浪费。
*   **💎 优雅 UI**：
    *   **Pixel Perfect**：使用 `inset shadow` 实现内描边，不破坏原页面布局。
    *   **Micro-Interaction**：支持悬停光晕与弹性入场动画。
    *   **Smart Badge**：在头像下方悬挂精致的 "👋 Bye" 标签，不遮挡任何文字或按钮。
*   **🛡️ 样式捍卫者**：内置事件监听机制，确保标记不会因鼠标悬停或 X 的页面重绘而丢失。
*   **⚡ 高性能**：基于 `MutationObserver` 与 `WeakMap` 思想（DOM 标记），支持无限滚动，极低内存占用。

## 🌟 新增功能 (v1.1.0)

### 🚀 一键关注助手 (Smart Follow)
*   **场景**：在帖子详情页浏览评论。
*   **功能**：每条评论右下角新增 **`[➕ 关注]`** 按钮。
*   **智能交互**：
    1.  **一键直达**：点击按钮，插件后台自动触发 X 原生菜单完成关注。
    2.  **状态感知**：如果系统检测到您已关注该用户，按钮会自动变为绿色的 **`[已关注]`**，避免重复操作。
    3.  **零干扰**：无需离开当前阅读视线，无需等待弹窗。

## 🚀 安装指南

由于本项目尚未上架 Chrome Web Store (待定)，请使用开发者模式安装：

1.  **下载/克隆** 本仓库到本地。
2.  打开 Chrome 浏览器，访问 `chrome://extensions/`。
3.  开启右上角的 **"开发者模式" (Developer mode)**。
4.  点击 **"加载已解压的扩展程序" (Load unpacked)**。
5.  选择本项目的根目录。

## 📖 使用方法

1.  进入 X (Twitter) 的 **关注列表** 页面：[https://x.com/following](https://x.com/following)。
2.  浏览列表，插件会自动运行。
3.  **单向关注者**（即你关注了他，但他没回关你）将会：
    *   卡片出现红色内发光边框。
    *   头像下方出现 "👋 Bye" 标签。

## 🛠️ 技术栈与架构

*   **Manifest V3**：符合最新的 Chrome 扩展标准。
*   **Vanilla JS (ES6+)**：无框架依赖，极致轻量。
*   **CSS Variables**: 易于维护的主题系统。
*   **JSDoc**: 完整的类型注释与文档。

### 目录结构

```text
/byebyebot
├── manifest.json       # 核心配置 (权限控制)
├── content.js          # 业务逻辑 (Observer, DOM操作, 事件监听)
├── content.css         # 样式系统 (Glassmorphism, Animations)
├── icons/              # 资源文件
└── docs/               # 详细技术文档
```

## 📄 License

MIT License © 2026 ByeByeBot Contributors