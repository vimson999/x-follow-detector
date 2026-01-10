/**
 * @fileoverview ByeByeBot - X (Twitter) 单向关注检测器
 * @description 自动识别并高亮关注列表中未回关的用户。
 * @version 1.0.2
 * @author ByeByeBot Contributors
 * @license MIT
 */

/**
 * 核心配置常量
 * @constant
 */
const CONFIG = {
  /**
   * DOM 选择器
   */
  SELECTORS: {
    // 限定在主内容列 (primaryColumn) 查找，排除右侧边栏
    USER_CELL: '[data-testid="primaryColumn"] [data-testid="UserCell"]',
    FOLLOW_INDICATOR: '[data-testid="userFollowIndicator"]',
    // 新增：头像容器选择器 (用于精准定位 Badge)
    AVATAR_CONTAINER: '[data-testid^="UserAvatar-Container-"]',
  },
  /**
   * 应用的 CSS 类名
   */
  CLASSES: {
    TARGET: 'byebyebot-target',
    BADGE: 'byebyebot-badge',
  },
  /**
   * 性能相关配置
   */
  ATTRIBUTES: {
    CHECKED: 'data-byebyebot-checked',
  },
  TIMEOUT_DELAY: 1000,
};

/**
 * 主逻辑函数：执行单次检测
 * @returns {void}
 */
function runByeByeBot() {
  // 严谨校验：只在 /following 路径下运行
  if (!window.location.pathname.endsWith('/following')) {
    return;
  }

  const userCells = document.querySelectorAll(CONFIG.SELECTORS.USER_CELL);

  userCells.forEach((cell) => {
    // 类型断言：确保操作的是 HTMLElement
    if (!(cell instanceof HTMLElement)) return;

    // 检查是否已经是已知的“互相关注”或“已处理”
    // 注意：如果是单向关注，我们需要持续监控它的样式，所以不能简单 return
    const isChecked = cell.getAttribute(CONFIG.ATTRIBUTES.CHECKED) === 'true';
    
    // 核心判断：寻找“关注了你”的标记
    const followsYou = cell.querySelector(CONFIG.SELECTORS.FOLLOW_INDICATOR);

    if (!followsYou) {
      // --- 单向关注处理逻辑 ---
      
      // 1. 标记状态
      cell.setAttribute(CONFIG.ATTRIBUTES.CHECKED, 'true');
      
      // 2. 渲染样式 (如果缺失)
      renderOneWayWarning(cell);

      // 3. 事件监听 (修复 Bug 3: 鼠标移出后样式丢失)
      // 只有未绑定过事件时才绑定，避免重复绑定
      if (!cell.dataset.byebyebotEventBound) {
        cell.addEventListener('mouseleave', () => {
          // 鼠标移出时，强制检查并恢复样式
          restoreStyles(cell);
        });
        // 标记已绑定
        cell.dataset.byebyebotEventBound = 'true';
      }

    } else {
      // 互相关注，标记忽略
      cell.setAttribute(CONFIG.ATTRIBUTES.CHECKED, 'true');
    }
  });
}

/**
 * 渲染逻辑：为单向关注的用户卡片添加视觉提醒
 * @param {HTMLElement} cell - 目标用户卡片的 DOM 节点
 * @returns {void}
 */
function renderOneWayWarning(cell) {
  restoreStyles(cell);
  injectBadge(cell);
}

/**
 * 样式恢复函数 (独立出来，供初始渲染和事件回调使用)
 */
function restoreStyles(cell) {
  if (!cell.classList.contains(CONFIG.CLASSES.TARGET)) {
    cell.classList.add(CONFIG.CLASSES.TARGET);
  }
}

/**
 * Badge 注入逻辑 (修复 Bug 3: 移至头像下方)
 */
function injectBadge(cell) {
  // 寻找头像容器
  const avatarContainer = cell.querySelector(CONFIG.SELECTORS.AVATAR_CONTAINER);
  
  // 如果找不到头像容器（极端情况），回退到 cell append
  const targetContainer = avatarContainer || cell;
  
  // 检查 Badge 是否已存在
  if (!targetContainer.querySelector(`.${CONFIG.CLASSES.BADGE}`)) {
    const badge = document.createElement('div');
    badge.textContent = '👋 Bye';
    badge.className = CONFIG.CLASSES.BADGE;
    
    // 插入到容器中
    targetContainer.append(badge);
    
    // 如果是插入到 Avatar 容器，需要确保容器是 relative 定位
    if (avatarContainer) {
      // 多数情况下 X 的 Avatar 容器已经是 relative 或 absolute，
      // 但为了保险，我们在 CSS 里强制一下 badge 的定位参考系
      // 这里不需要改 JS style，靠 CSS 处理
    }
  }
}

// --- 初始化与生命周期管理 ---

// 1. 初始执行 (处理页面已存在的元素)
// 使用 debounce 或简单的延迟确保 SPA 路由跳转完成后再执行
window.addEventListener('popstate', () => {
  setTimeout(runByeByeBot, CONFIG.TIMEOUT_DELAY);
});

/**
 * 启动 MutationObserver 监听 DOM 变化
 * 仅在文档就绪时执行
 */
function initObserver() {
  const observer = new MutationObserver((mutations) => {
    // 性能优化：只有当有新节点增加时才触发检测
    const hasNewNodes = mutations.some((m) => m.addedNodes.length > 0);
    // 或者当 class 属性发生变化时 (虽然这可能导致高频触发，但配合 runByeByeBot 内部检查是安全的)
    // 这里我们主要关注节点增加。样式恢复主要靠 mouseleave。
    
    if (hasNewNodes) {
      runByeByeBot();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log(
    '%c👋 ByeByeBot Initialized (v1.0.2)',
    'color: #ff4d4d; font-weight: bold; font-size: 14px;'
  );
}

// 2. 启动监听
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initObserver);
} else {
  initObserver();
}