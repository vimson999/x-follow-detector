document.addEventListener('DOMContentLoaded', () => {
  const userList = document.getElementById('user-list');
  const emptyState = document.getElementById('empty-state');
  const countBadge = document.getElementById('count-badge');
  const clearBtn = document.getElementById('clear-btn');

  // 渲染函数
  const renderList = () => {
    chrome.storage.local.get(['oneWayUsers'], (result) => {
      const users = result.oneWayUsers || {};
      const userArray = Object.values(users).sort((a, b) => b.detectedAt - a.detectedAt);

      countBadge.textContent = userArray.length;

      if (userArray.length === 0) {
        userList.style.display = 'none';
        emptyState.style.display = 'flex';
        userList.innerHTML = '';
        return;
      }

      emptyState.style.display = 'none';
      userList.style.display = 'block';
      userList.innerHTML = '';
      
      userArray.forEach(user => {
        const li = document.createElement('li');
        li.className = 'user-item';
        
        const handleClean = user.handle.replace('@', '');
        const profileUrl = `https://x.com/${handleClean}`;

        li.innerHTML = `
          <img src="${user.avatar}" class="avatar" alt="${user.name}">
          <div class="info">
            <div class="name">${user.name}</div>
            <div class="handle">${user.handle}</div>
          </div>
          <div class="actions">
            <a href="${profileUrl}" target="_blank" class="action-btn view-btn">查看</a>
            <button class="action-btn delete-btn" data-handle="${user.handle}">🗑️</button>
          </div>
        `;
        userList.appendChild(li);
      });

      // 绑定单项删除事件
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = (e) => {
          const handle = e.currentTarget.dataset.handle;
          removeUser(handle);
        };
      });
    });
  };

  // 删除单个人
  const removeUser = (handle) => {
    chrome.storage.local.get(['oneWayUsers'], (result) => {
      const users = result.oneWayUsers || {};
      delete users[handle];
      chrome.storage.local.set({ oneWayUsers: users }, renderList);
    });
  };

  // 初始加载
  renderList();

  // 清空列表
  clearBtn.addEventListener('click', () => {
    if (confirm('确定要重置本地列表吗？')) {
      chrome.storage.local.remove('oneWayUsers', renderList);
    }
  });
});