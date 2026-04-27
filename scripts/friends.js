// ═══════════════════════════════════════
//  FRIENDS.JS — Friends System
// ═══════════════════════════════════════

const FriendsModule = (() => {

  let _currentUser = null;
  let _userData    = null;
  let _activeSubTab = 'friends';
  let _listeners = [];

  function init(user, userData) {
    _currentUser = user;
    _userData    = userData;
    _bindSubTabs();
    _bindSearch();
    loadFriends();
  }

  /* ── Sub-tabs ── */
  function _bindSubTabs() {
    document.querySelectorAll('.friends-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.friends-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _activeSubTab = btn.dataset.tab;
        if (_activeSubTab === 'friends') loadFriends();
        else if (_activeSubTab === 'requests') loadRequests();
        else if (_activeSubTab === 'search') _showSearch();
      });
    });
  }

  /* ── Search ── */
  function _bindSearch() {
    const input = document.getElementById('friends-search-input');
    let searchTimeout;
    input.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      const q = input.value.trim();
      if (q.length < 2) {
        if (_activeSubTab === 'search') _renderSearchResults([]);
        return;
      }
      searchTimeout = setTimeout(() => _doSearch(q), 400);
    });
  }

  function _showSearch() {
    const input = document.getElementById('friends-search-input');
    input.focus();
    _renderSearchResults([]);
  }

  async function _doSearch(query) {
    const list = document.getElementById('friends-list');
    list.innerHTML = '<div class="spinner"></div>';

    try {
      const snap = await db.ref('users')
        .orderByChild('usernameLower')
        .startAt(query.toLowerCase())
        .endAt(query.toLowerCase() + '\uf8ff')
        .limitToFirst(20)
        .once('value');

      const results = [];
      snap.forEach(child => {
        if (child.key !== _currentUser.uid) {
          results.push({ uid: child.key, ...child.val() });
        }
      });
      _renderSearchResults(results);
    } catch(e) {
      list.innerHTML = '<div class="empty-state"><p>خطأ في البحث</p></div>';
    }
  }

  function _renderSearchResults(results) {
    const list = document.getElementById('friends-list');
    if (!results.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>ابحث عن أصدقاء بالاسم</p></div>';
      return;
    }
    list.innerHTML = '';
    results.forEach(u => {
      const isFriend = _userData.friends && _userData.friends[u.uid];
      const hasSent = _userData.requests && _userData.requests[u.uid] === 'sent';
      const card = document.createElement('div');
      card.className = 'friend-card';
      card.innerHTML = `
        <div class="friend-avatar">
          <div class="avi">${sanitize(u.avatar || '👤')}</div>
          <div class="friend-status ${u.online ? 'online' : ''}"></div>
        </div>
        <div class="friend-info">
          <div class="friend-name">${sanitize(u.username)}</div>
          <div class="friend-meta">${sanitize(u.country || '')} • #${u.id6||''}</div>
        </div>
        <div class="friend-actions">
          ${isFriend
            ? `<button class="btn-chat">💬</button>`
            : hasSent
            ? `<button class="btn-reject" disabled>مُرسل</button>`
            : `<button class="btn-add">➕</button>`}
        </div>`;

      const avi = card.querySelector('.avi');
      avi.addEventListener('click', () => ProfileModule.viewUserProfile(u.uid, _currentUser.uid));

      const addBtn = card.querySelector('.btn-add');
      if (addBtn) {
        addBtn.addEventListener('click', async () => {
          await sendRequest(_currentUser.uid, u.uid);
          addBtn.disabled = true;
          addBtn.textContent = 'مُرسل';
          showToast('تم إرسال طلب الصداقة ✓');
        });
      }
      const chatBtn = card.querySelector('.btn-chat');
      if (chatBtn) chatBtn.addEventListener('click', () => ChatModule.openPrivateChat(u.uid, u));

      list.appendChild(card);
    });
  }

  /* ── Load Friends List ── */
  function loadFriends() {
    const list = document.getElementById('friends-list');
    list.innerHTML = '<div class="spinner"></div>';

    if (!_userData.friends || !Object.keys(_userData.friends).length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><p>لا أصدقاء بعد<br>ابحث لإضافة أصدقاء</p></div>';
      return;
    }

    const uids = Object.keys(_userData.friends);
    list.innerHTML = '';
    uids.forEach(async uid => {
      const snap = await db.ref(`users/${uid}`).once('value');
      const u = snap.val();
      if (!u) return;
      const card = _buildFriendCard(uid, u, 'friend');
      list.appendChild(card);
    });
  }

  /* ── Load Requests ── */
  function loadRequests() {
    const list = document.getElementById('friends-list');
    list.innerHTML = '';

    db.ref(`users/${_currentUser.uid}/requests`).once('value').then(snap => {
      const reqs = snap.val() || {};
      const incoming = Object.entries(reqs).filter(([,v]) => v === 'received');

      if (!incoming.length) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">📩</div><p>لا طلبات صداقة</p></div>';
        return;
      }
      incoming.forEach(async ([uid]) => {
        const uSnap = await db.ref(`users/${uid}`).once('value');
        const u = uSnap.val();
        if (!u) return;
        const card = _buildFriendCard(uid, u, 'request');
        list.appendChild(card);
      });
    });
  }

  function _buildFriendCard(uid, u, type) {
    const card = document.createElement('div');
    card.className = 'friend-card';

    let actions = '';
    if (type === 'friend') {
      actions = `<button class="btn-chat">💬</button>`;
    } else {
      actions = `<button class="btn-accept">✓ قبول</button><button class="btn-reject">✕</button>`;
    }

    card.innerHTML = `
      <div class="friend-avatar">
        <div class="avi">${sanitize(u.avatar || '👤')}</div>
        <div class="friend-status ${u.online ? 'online' : ''}"></div>
      </div>
      <div class="friend-info">
        <div class="friend-name">${sanitize(u.username)}</div>
        <div class="friend-meta">${u.online ? '🟢 متصل' : '⚫ ' + formatLastSeen(u.lastSeen)}</div>
      </div>
      <div class="friend-actions">${actions}</div>`;

    const avi = card.querySelector('.avi');
    avi.addEventListener('click', () => ProfileModule.viewUserProfile(uid, _currentUser.uid));

    if (type === 'friend') {
      card.querySelector('.btn-chat').addEventListener('click', () => ChatModule.openPrivateChat(uid, u));
    } else {
      card.querySelector('.btn-accept').addEventListener('click', async () => {
        await acceptRequest(_currentUser.uid, uid);
        card.remove();
        showToast('تمت إضافة الصديق ✓');
        _updateFriendsBadge();
      });
      card.querySelector('.btn-reject').addEventListener('click', async () => {
        await rejectRequest(_currentUser.uid, uid);
        card.remove();
      });
    }
    return card;
  }

  /* ── Request logic ── */
  async function sendRequest(fromUid, toUid) {
    const updates = {};
    updates[`users/${fromUid}/requests/${toUid}`] = 'sent';
    updates[`users/${toUid}/requests/${fromUid}`]  = 'received';
    await db.ref().update(updates);

    // Notification badge
    const snap = await db.ref(`users/${toUid}/requestCount`).once('value');
    const cnt = (snap.val() || 0) + 1;
    await db.ref(`users/${toUid}/requestCount`).set(cnt);
  }

  async function acceptRequest(myUid, fromUid) {
    const updates = {};
    updates[`users/${myUid}/friends/${fromUid}`]  = true;
    updates[`users/${fromUid}/friends/${myUid}`]  = true;
    updates[`users/${myUid}/requests/${fromUid}`] = null;
    updates[`users/${fromUid}/requests/${myUid}`] = null;
    await db.ref().update(updates);

    // XP: +5 per friend (cap 5/day)
    const snap = await db.ref(`users/${myUid}`).once('value');
    const u = snap.val();
    const todayKey = new Date().toDateString();
    const friendXPToday = u.friendXPToday === todayKey ? (u.friendXPCount || 0) : 0;
    if (friendXPToday < 5) {
      await db.ref(`users/${myUid}`).update({
        xp: Math.min((u.xp||0)+5, 100*XP_PER_LEVEL),
        level: getLevelFromXP(Math.min((u.xp||0)+5, 100*XP_PER_LEVEL)),
        friendXPToday: todayKey,
        friendXPCount: friendXPToday+1,
      });
    }
  }

  async function rejectRequest(myUid, fromUid) {
    await db.ref(`users/${myUid}/requests/${fromUid}`).remove();
    await db.ref(`users/${fromUid}/requests/${myUid}`).remove();
  }

  /* ── Requests badge count ── */
  function listenRequestCount(uid) {
    const ref = db.ref(`users/${uid}/requests`);
    const listener = ref.on('value', snap => {
      const reqs = snap.val() || {};
      const cnt = Object.values(reqs).filter(v => v === 'received').length;
      const badge = document.getElementById('friends-badge');
      if (cnt > 0) {
        badge.textContent = cnt;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    });
    _listeners.push({ ref, listener, event: 'value' });
  }

  async function _updateFriendsBadge() {
    const snap = await db.ref(`users/${_currentUser.uid}/requests`).once('value');
    const reqs = snap.val() || {};
    const cnt = Object.values(reqs).filter(v => v === 'received').length;
    const badge = document.getElementById('friends-badge');
    if (cnt > 0) { badge.textContent = cnt; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
  }

  function destroy() {
    _listeners.forEach(({ ref, listener, event }) => ref.off(event, listener));
    _listeners = [];
  }

  return { init, sendRequest, acceptRequest, rejectRequest, loadFriends, listenRequestCount, destroy };
})();
