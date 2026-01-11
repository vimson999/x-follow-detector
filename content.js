/**
 * @fileoverview ByeByeBot - X (Twitter) 增强助手
 * @description 包含“单向关注检测”、“评论区智能关注”与“数据采集”三大核心模块。
 * @version 1.3.0
 * @author ByeByeBot Contributors
 * @license MIT
 */

/**
 * 全局配置与常量
 */
const CONFIG = {
  SELECTORS: {
    // Following 列表相关
    USER_CELL: '[data-testid="primaryColumn"] [data-testid="UserCell"]',
    FOLLOW_INDICATOR: '[data-testid="userFollowIndicator"]',
    AVATAR_CONTAINER: '[data-testid^="UserAvatar-Container-"]',
    USER_NAME: '[data-testid="User-Name"]',
    
    // 评论区相关
    TWEET_ARTICLE: 'article[data-testid="tweet"]',
    ACTION_BAR: '[role="group"]', // 评论底部的操作栏
    CARET_BTN: '[data-testid="caret"]', // 那个"更多"的三个点按钮
    DROPDOWN: '[data-testid="Dropdown"]', // 点击后弹出的菜单
    MENU_ITEM: '[role="menuitem"]',
  },
  CLASSES: {
    TARGET: 'byebyebot-target',
    BADGE: 'byebyebot-badge',
    FOLLOW_BTN: 'byebyebot-follow-btn', // 一键关注按钮
    BTN_WRAPPER: 'byebyebot-btn-wrapper',
  },
  ATTRIBUTES: {
    CHECKED: 'data-byebyebot-checked',
    BTN_INJECTED: 'data-byebyebot-btn-injected', // 标记是否已注入过按钮容器
    STATUS_CHECKED: 'data-byebyebot-status-checked', // 标记是否已检测过关注状态
  },
  TIMEOUT_DELAY: 1000,
};

// --- 模块 1: 单向关注检测 (Following 列表) ---

function runFollowingDetector() {
  // 放宽匹配规则：只要路径里包含 '/following' 就运行
  // 同时排除 '/followers' (虽然 followers 里包含 following 字样吗？不，是 distinct 的)
  // 还要排除 Verified Followers 等其他 tab? 通常 following 就在 path 结尾或中间
  if (!window.location.pathname.includes('/following')) return;

  const userCells = document.querySelectorAll(CONFIG.SELECTORS.USER_CELL);
  userCells.forEach((cell) => {
    if (!(cell instanceof HTMLElement)) return;
    
    // 状态维护：鼠标移出恢复样式
    if (!cell.dataset.byebyebotEventBound) {
      cell.addEventListener('mouseleave', () => restoreStyles(cell));
      cell.dataset.byebyebotEventBound = 'true';
    }

    const followsYou = cell.querySelector(CONFIG.SELECTORS.FOLLOW_INDICATOR);
    if (!followsYou) {
      cell.setAttribute(CONFIG.ATTRIBUTES.CHECKED, 'true');
      restoreStyles(cell);
      injectBadge(cell);
      
      // 数据采集：存入 Storage
      saveOneWayUser(cell);
    } else {
      cell.setAttribute(CONFIG.ATTRIBUTES.CHECKED, 'true');
    }
  });
}

function restoreStyles(cell) {
  if (cell.getAttribute(CONFIG.ATTRIBUTES.CHECKED) === 'true' && 
      !cell.querySelector(CONFIG.SELECTORS.FOLLOW_INDICATOR)) {
    if (!cell.classList.contains(CONFIG.CLASSES.TARGET)) {
      cell.classList.add(CONFIG.CLASSES.TARGET);
    }
  }
}

function injectBadge(cell) {
  const avatarContainer = cell.querySelector(CONFIG.SELECTORS.AVATAR_CONTAINER);
  const targetContainer = avatarContainer || cell;
  
  if (!targetContainer.querySelector(`.${CONFIG.CLASSES.BADGE}`)) {
    const badge = document.createElement('div');
    badge.textContent = '👋 Bye';
    badge.className = CONFIG.CLASSES.BADGE;
    targetContainer.append(badge);
  }
}

/**
 * 采集并存储单向关注用户信息
 */
function saveOneWayUser(cell) {
  try {
    // 1. 提取头像
    const img = cell.querySelector('img');
    const avatar = img ? img.src : '';

    // 2. 提取 Handle (@username) 和 昵称
    const textContent = cell.innerText;
    const handleMatch = textContent.match(/@(\w+)/);
    const handle = handleMatch ? handleMatch[0] : ''; // @vimson999
    
    // 首席专家修复方案 v3: 基于 dir="ltr" 的结构化提取
    // X 的昵称和推文内容通常都在 dir="ltr" 的容器里
    const ltrNodes = cell.querySelectorAll('div[dir="ltr"]');
    let name = 'Unknown';
    
    for (const node of ltrNodes) {
      // 获取纯文本，忽略隐藏的辅助文本
      const text = node.innerText.trim();
      
      // 过滤条件：
      // 1. 不为空
      // 2. 不包含 @ (那是 Handle)
      // 3. 不是 "关注了你" 或 "正在关注" 等状态文本 (虽然这些通常不在 dir=ltr 里，但防一手)
      if (text && !text.includes('@') && text !== '关注了你' && text !== '正在关注') {
        // 还要过滤掉只是单纯 emoji 的情况吗？不，有些人的名字就是 emoji。
        // 但要注意，X 的 emoji img 标签 alt 属性会被 innerText 读取吗？
        // 通常 innerText 会忽略 img，除非 img 有 alt 且 CSS 没隐藏。
        // 在您提供的 DOM 里，img 有 alt="🔆"，innerText 可能会读出来。
        // 我们尝试只读取该节点下所有 span 的内容拼接？
        
        // 简单策略：取第一行
        name = text.split('\n')[0];
        
        // 如果抓到的是空的或者非常短的奇怪字符，继续找下一个？
        if (name.length > 0) break;
      }
    }
    
    // 兜底：如果没找到，尝试用 Handle 去掉 @
    if (name === 'Unknown' && handle) {
        name = handle.substring(1); 
    }

    if (!handle) return; 

    const userData = {
      id: handle, 
      name: name,
      handle: handle,
      avatar: avatar,
      detectedAt: Date.now()
    };

    // 3. 存入 Storage (增量更新)
    // 检查 chrome.storage 是否可用 (防止上下文丢失报错)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['oneWayUsers'], (result) => {
        const users = result.oneWayUsers || {};
        if (!users[handle] || users[handle].avatar !== avatar) {
          users[handle] = userData;
          chrome.storage.local.set({ oneWayUsers: users });
        }
      });
    }

  } catch (err) {
    console.error('Failed to save user:', err);
  }
}


// --- 模块 2: 评论区智能关注 (Status 详情页) ---

function runCommentMonitor() {
  if (!window.location.pathname.includes('/status/')) return;

  const tweets = document.querySelectorAll(CONFIG.SELECTORS.TWEET_ARTICLE);

  tweets.forEach(tweet => {
    if (tweet.getAttribute(CONFIG.ATTRIBUTES.BTN_INJECTED) === 'true') return;
    
    const actionBar = tweet.querySelector(CONFIG.SELECTORS.ACTION_BAR);
    if (!actionBar) return;

    const wrapper = document.createElement('div');
    wrapper.className = CONFIG.CLASSES.BTN_WRAPPER;
    wrapper.style.display = 'none'; 
    wrapper.style.alignItems = 'center';

    const btn = createFollowButton(tweet, wrapper);
    wrapper.appendChild(btn);
    actionBar.appendChild(wrapper);

    tweet.setAttribute(CONFIG.ATTRIBUTES.BTN_INJECTED, 'true');

    // 绑定 Hover 事件
    tweet.addEventListener('mouseenter', () => {
      if (tweet.getAttribute(CONFIG.ATTRIBUTES.STATUS_CHECKED) === 'true') return;
      
      const timer = setTimeout(() => {
        checkFollowStatus(tweet, wrapper, btn);
      }, 300);
      
      tweet.dataset.hoverTimer = timer;
    });

    tweet.addEventListener('mouseleave', () => {
      if (tweet.dataset.hoverTimer) {
        clearTimeout(Number(tweet.dataset.hoverTimer));
        delete tweet.dataset.hoverTimer;
      }
    });
  });
}

function createFollowButton(tweetElement, wrapper) {
  const btn = document.createElement('div');
  btn.className = CONFIG.CLASSES.FOLLOW_BTN;
  btn.role = "button";
  btn.innerHTML = `<span class="icon">➕</span><span class="text">关注</span>`;
  
  btn.onclick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await executeFollowAction(tweetElement, btn);
  };
  
  return btn;
}

/**
 * 探测关注状态
 */
async function checkFollowStatus(tweetElement, wrapper, btn) {
  tweetElement.setAttribute(CONFIG.ATTRIBUTES.STATUS_CHECKED, 'true');

  try {
    const caretBtn = tweetElement.querySelector(CONFIG.SELECTORS.CARET_BTN);
    if (!caretBtn) return;

    caretBtn.click();
    await new Promise(r => setTimeout(r, 50)); 

    const menus = document.querySelectorAll('[role="menu"]');
    const currentMenu = menus[menus.length - 1];
    
    if (!currentMenu) return;

    const menuItems = currentMenu.querySelectorAll(CONFIG.SELECTORS.MENU_ITEM);
    let isFollowing = false;
    let canFollow = false;

    for (const item of menuItems) {
      const text = item.innerText;
      if (text.includes('取消关注 @')) {
        isFollowing = true;
        break;
      }
      if (text.includes('关注 @')) {
        canFollow = true;
        break;
      }
    }

    caretBtn.click(); // 关闭菜单

    wrapper.style.display = 'flex';
    wrapper.style.animation = 'byebyebot-fade-in 0.3s ease';

    if (isFollowing) {
      btn.classList.add('followed');
      btn.innerHTML = `<span class="text">已关注</span>`;
    } else if (canFollow) {
      btn.classList.remove('followed');
      btn.innerHTML = `<span class="icon">➕</span><span class="text">关注</span>`;
    } else {
      wrapper.style.display = 'none'; 
    }

  } catch (err) {
    console.error('Status check failed:', err);
  }
}

/**
 * 执行关注动作
 */
async function executeFollowAction(tweetElement, btn) {
  btn.classList.add('loading');
  btn.innerHTML = `<span class="text">...</span>`;

  try {
    const caretBtn = tweetElement.querySelector(CONFIG.SELECTORS.CARET_BTN);
    caretBtn.click();
    await new Promise(r => setTimeout(r, 100)); 

    const menus = document.querySelectorAll('[role="menu"]');
    const currentMenu = menus[menus.length - 1];
    const menuItems = currentMenu.querySelectorAll(CONFIG.SELECTORS.MENU_ITEM);

    let success = false;
    for (const item of menuItems) {
      if (item.innerText.includes('关注 @')) {
        item.click(); 
        success = true;
        break;
      }
    }

    if (success) {
      btn.classList.remove('loading');
      btn.classList.add('followed');
      btn.innerHTML = `<span class="text">已关注</span>`;
    } else {
      caretBtn.click(); 
      btn.classList.remove('loading');
      btn.innerHTML = `<span class="text">Failed</span>`;
    }

  } catch (err) {
    btn.classList.remove('loading');
    btn.innerHTML = `<span class="text">Err</span>`;
  }
}


// --- 主调度器 ---

let pollingInterval;
let lastUrl = window.location.href; // 记录当前 URL

function startPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  
  let attempts = 0;
  // 增加轮询次数到 30次 (15秒)，覆盖更慢的加载
  const maxAttempts = 30; 
  
  // 立即执行
  runFollowingDetector();
  runCommentMonitor();

  pollingInterval = setInterval(() => {
    attempts++;
    runFollowingDetector();
    runCommentMonitor();

    if (attempts >= maxAttempts) {
      clearInterval(pollingInterval);
    }
  }, 500);
}

function init() {
  const observer = new MutationObserver((mutations) => {
    // 1. URL 变化检测 (SPA 导航的核心修复)
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log('URL Changed, restarting detector...');
      startPolling(); // URL 变了，强制重启轮询
    }

    // 2. DOM 变动检测
    // 只要在目标页面，且有节点增加，就尝试运行
    const isTargetPage = window.location.pathname.includes('/following') || window.location.pathname.includes('/status/');
    if (isTargetPage) {
      // 这里的运行开销很小，因为它内部有 check 逻辑
      runFollowingDetector();
      runCommentMonitor();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // 初始启动
  startPolling();

  // 辅助监听
  window.addEventListener('popstate', startPolling);
  
  // 滚动监听 (保留)
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(() => {
        if (window.location.pathname.includes('/status/')) runCommentMonitor();
        if (window.location.pathname.includes('/following')) runFollowingDetector();
        scrollTimeout = null;
      }, 200);
    }
  });
  
  // 移除无效的 history hack，保持代码纯净
  
  console.log('%c👋 ByeByeBot Enhanced (v1.3.4)', 'color: #ff4d4d; font-weight: bold;');
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
