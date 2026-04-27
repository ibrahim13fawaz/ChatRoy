// ═══════════════════════════════════════
//  CHAT.JS — Room & Private Chat
// ═══════════════════════════════════════

const ChatModule = (() => {

  let _currentUser = null;
  let _userData    = null;
  let _currentRoom = null;
  let _currentRoomData = null;
  let _privatePeer = null;
  let _privatePeerData = null;
  let _chatId = null;

  let _msgsListener = null;
  let _membersListener = null;
  let _typingListener = null;
  let _emojiOpen = false;

  /* ── Init ── */
  function init(user, userData) {
    _currentUser = user;
    _userData    = userData;
  }

  /* ══════════════════════════════
     ROOM CHAT
  ══════════════════════════════ */
  async function openRoom(roomId, roomData) {
    // Check ban
    const canEnter = await RoomsModule.canEnterRoom(roomId, _currentUser.uid);
    if (!canEnter) return showToast('🚫 أنت محظور من هذه الغرفة');

    _currentRoom = roomId;
    _currentRoomData = roomData;
    _cleanup();

    showScreen('screen-room');

    // Header
    document.getElementById('room-header-name').textContent = roomData.name;
    document.getElementById('room-header-avi').textContent = roomData.avatar || '🏠';

    // Mark user online in room
    const onlineRef = db.ref(`rooms/${roomId}/usersOnline/${_currentUser.uid}`);
    onlineRef.set(true);
    onlineRef.onDisconnect().remove();
    db.ref(`rooms/${roomId}/usersOnline`).on('value', snap => {
      document.getElementById('room-online-count').textContent =
        (Object.keys(snap.val() || {}).length) + ' متواجد';
    });

    // Send join notification
    const adminFlag = isAdmin(_currentUser.uid);
    const myRole = _getMyRole(roomId, roomData);
    _sendSystemMsg(roomId,
      adminFlag || myRole === 'admin' || myRole === 'owner'
        ? { text: `🔥 دخول أسطوري: ${_userData.username}`, legendary: true }
        : { text: `🚪 دخل: ${_userData.username}`, legendary: false }
    );

    // Load messages
    _listenRoomMessages(roomId);

    // Members panel
    _listenRoomMembers(roomId, roomData);

    // Input
    _bindRoomInput(roomId);

    // Back button
    document.getElementById('btn-room-back').onclick = () => {
      onlineRef.remove();
      _cleanup();
      showScreen('screen-app');
    };

    // Members toggle
    document.getElementById('btn-room-members').onclick = () => {
      document.getElementById('members-panel').classList.toggle('open');
    };
  }

  function _sendSystemMsg(roomId, { text, legendary }) {
    db.ref(`messages/${roomId}`).push({
      type: 'system',
      text,
      legendary: !!legendary,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    });
  }

  function _listenRoomMessages(roomId) {
    const msgsEl = document.getElementById('chat-messages');
    msgsEl.innerHTML = '';

    const ref = db.ref(`messages/${roomId}`).orderByChild('timestamp').limitToLast(100);
    _msgsListener = ref.on('child_added', snap => {
      const msg = snap.val();
      if (!msg) return;
      const el = _buildMessage(snap.key, msg, roomId);
      msgsEl.appendChild(el);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    });
  }

  function _buildMessage(msgId, msg, roomId) {
    if (msg.type === 'system') {
      const div = document.createElement('div');
      div.className = 'sys-msg' + (msg.legendary ? ' legendary' : '');
      div.textContent = msg.text;
      return div;
    }

    const isOwn = msg.senderId === _currentUser.uid;
    const adminSender = isAdmin(msg.senderId);
    const row = document.createElement('div');
    row.className = 'msg-row' + (isOwn ? ' own' : '') + (adminSender ? ' is-admin' : '');
    row.dataset.msgId = msgId;

    const avi = document.createElement('div');
    avi.className = 'msg-avatar';
    avi.textContent = msg.senderAvatar || '👤';
    avi.addEventListener('click', () => ProfileModule.viewUserProfile(msg.senderId, _currentUser.uid));

    const content = document.createElement('div');
    content.className = 'msg-content';
    content.innerHTML = `
      <div class="msg-sender ${adminSender ? 'admin-name' : ''}">${sanitize(msg.senderName || '')}</div>
      <div class="msg-bubble">${sanitize(msg.text)}</div>
      <div class="msg-time">${formatTime(msg.timestamp)}</div>`;

    // Long press / right-click context menu
    const bubble = content.querySelector('.msg-bubble');
    bubble.addEventListener('contextmenu', e => {
      e.preventDefault();
      _showCtxMenu(e, msgId, msg, roomId);
    });
    let longPress;
    bubble.addEventListener('touchstart', () => {
      longPress = setTimeout(() => _showCtxMenu(null, msgId, msg, roomId), 600);
    });
    bubble.addEventListener('touchend', () => clearTimeout(longPress));

    row.appendChild(isOwn ? content : avi);
    row.appendChild(isOwn ? avi : content);
    return row;
  }

  /* ── Context menu ── */
  function _showCtxMenu(e, msgId, msg, roomId) {
    _removeCtxMenu();
    const menu = document.createElement('div');
    menu.className = 'ctx-menu';
    menu.id = 'ctx-menu';

    const myRole = _getMyRole(roomId, _currentRoomData);
    const canDelete = msg.senderId === _currentUser.uid || myRole !== 'member' || isAdmin(_currentUser.uid);
    const canBan = (myRole === 'owner' || myRole === 'admin' || isAdmin(_currentUser.uid))
                    && msg.senderId !== _currentUser.uid;

    if (canDelete) {
      const del = document.createElement('div');
      del.className = 'ctx-item danger';
      del.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg> حذف الرسالة`;
      del.onclick = async () => {
        await db.ref(`messages/${roomId}/${msgId}`).remove();
        _removeCtxMenu();
      };
      menu.appendChild(del);
    }

    if (canBan && msg.senderId) {
      const kick = document.createElement('div');
      kick.className = 'ctx-item';
      kick.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg> طرد`;
      kick.onclick = async () => {
        await RoomsModule.kickUser(roomId, msg.senderId);
        _removeCtxMenu();
      };
      const ban = document.createElement('div');
      ban.className = 'ctx-item danger';
      ban.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> حظر`;
      ban.onclick = async () => {
        await RoomsModule.banUser(roomId, msg.senderId);
        _removeCtxMenu();
      };
      menu.appendChild(kick);
      menu.appendChild(ban);

      // Assign admin (owner only)
      if (myRole === 'owner' || isAdmin(_currentUser.uid)) {
        const adminBtn = document.createElement('div');
        adminBtn.className = 'ctx-item';
        adminBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> تعيين أدمن`;
        adminBtn.onclick = async () => {
          await RoomsModule.assignAdmin(roomId, msg.senderId);
          _removeCtxMenu();
        };
        menu.appendChild(adminBtn);
      }
    }

    if (!menu.children.length) return;

    if (e) {
      menu.style.position = 'fixed';
      menu.style.top = Math.min(e.clientY, window.innerHeight - 200) + 'px';
      menu.style.right = '12px';
    } else {
      menu.style.position = 'fixed';
      menu.style.top = '50%';
      menu.style.right = '12px';
    }

    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', _removeCtxMenu, { once: true }), 100);
  }

  function _removeCtxMenu() {
    const m = document.getElementById('ctx-menu');
    if (m) m.remove();
  }

  /* ── Room Members ── */
  function _listenRoomMembers(roomId, roomData) {
    const panel = document.getElementById('members-panel');
    panel.innerHTML = '<div style="font-size:13px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;">المتواجدون</div>';

    const ref = db.ref(`rooms/${roomId}/usersOnline`);
    _membersListener = ref.on('value', async snap => {
      panel.innerHTML = '<div style="font-size:13px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;">المتواجدون</div>';
      const uids = Object.keys(snap.val() || {});
      for (const uid of uids) {
        const uSnap = await db.ref(`users/${uid}`).once('value');
        const u = uSnap.val();
        if (!u) continue;
        const role = uid === roomData.ownerId ? 'owner'
                   : (roomData.admins && roomData.admins[uid]) ? 'admin' : 'member';
        const row = document.createElement('div');
        row.className = 'member-row';
        row.innerHTML = `
          <div class="member-avi">${sanitize(u.avatar||'👤')}</div>
          <div class="member-name">${sanitize(u.username)}</div>
          <div class="member-role ${role}">${role === 'owner' ? '👑' : role === 'admin' ? '🛡' : ''}</div>`;
        row.addEventListener('click', () => ProfileModule.viewUserProfile(uid, _currentUser.uid));
        panel.appendChild(row);
      }
    });
  }

  /* ── Send room message ── */
  function _bindRoomInput(roomId) {
    const input = document.getElementById('room-chat-input');
    const sendBtn = document.getElementById('btn-send-room');
    const emojiBtn = document.getElementById('btn-emoji-room');
    const picker = document.getElementById('emoji-picker-room');

    sendBtn.onclick = () => _sendRoomMsg(roomId, input);
    input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); _sendRoomMsg(roomId, input); } };

    emojiBtn.onclick = (e) => {
      e.stopPropagation();
      _emojiOpen = !_emojiOpen;
      picker.classList.toggle('hidden', !_emojiOpen);
    };

    // Build emoji picker
    picker.innerHTML = '';
    EMOJI_LIST.forEach(em => {
      const span = document.createElement('span');
      span.textContent = em;
      span.onclick = () => { input.value += em; input.focus(); };
      picker.appendChild(span);
    });

    document.addEventListener('click', () => {
      _emojiOpen = false;
      picker.classList.add('hidden');
    });
  }

  async function _sendRoomMsg(roomId, input) {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    const adminSender = isAdmin(_currentUser.uid);
    await db.ref(`messages/${roomId}`).push({
      senderId: _currentUser.uid,
      senderName: _userData.username,
      senderAvatar: _userData.avatar || '👤',
      text,
      type: 'text',
      isAdmin: adminSender,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    });

    // XP for messages (cap 200/day)
    const snap = await db.ref(`users/${_currentUser.uid}`).once('value');
    const u = snap.val();
    const todayKey = new Date().toDateString();
    const msgXPToday = u.msgXPToday === todayKey ? (u.msgXPCount || 0) : 0;
    if (msgXPToday < 200) {
      const newXP = Math.min((u.xp||0)+1, 100*XP_PER_LEVEL);
      await db.ref(`users/${_currentUser.uid}`).update({
        xp: newXP, level: getLevelFromXP(newXP),
        totalMessages: (u.totalMessages||0)+1,
        msgXPToday: todayKey,
        msgXPCount: msgXPToday+1,
      });
    } else {
      await db.ref(`users/${_currentUser.uid}/totalMessages`)
        .set((u.totalMessages||0)+1);
    }
  }

  /* ══════════════════════════════
     PRIVATE CHAT
  ══════════════════════════════ */
  async function openPrivateChat(peerUid, peerData) {
    _privatePeer = peerUid;
    _privatePeerData = peerData || {};
    _chatId = getChatId(_currentUser.uid, peerUid);
    _cleanupPrivate();

    // If peerData is missing, fetch it
    if (!peerData || !peerData.username) {
      const snap = await db.ref(`users/${peerUid}`).once('value');
      _privatePeerData = snap.val() || {};
    }

    showScreen('screen-private');

    document.getElementById('private-header-name').textContent = _privatePeerData.username || '...';
    document.getElementById('private-header-avi').textContent = _privatePeerData.avatar || '👤';

    _listenPrivateMessages();
    _bindPrivateInput();

    document.getElementById('btn-private-back').onclick = () => {
      _cleanupPrivate();
      showScreen('screen-app');
    };
  }

  function _listenPrivateMessages() {
    const msgsEl = document.getElementById('private-messages');
    msgsEl.innerHTML = '';

    const ref = db.ref(`privateChats/${_chatId}`).orderByChild('timestamp').limitToLast(100);
    _msgsListener = ref.on('child_added', snap => {
      const msg = snap.val();
      if (!msg) return;
      const isOwn = msg.senderId === _currentUser.uid;
      const row = document.createElement('div');
      row.className = 'msg-row' + (isOwn ? ' own' : '');
      row.innerHTML = `
        <div class="msg-avatar">${sanitize(isOwn ? (_userData.avatar||'👤') : (_privatePeerData.avatar||'👤'))}</div>
        <div class="msg-content">
          <div class="msg-bubble">${sanitize(msg.text)}</div>
          <div class="msg-time">${formatTime(msg.timestamp)}${isOwn && msg.seen ? ' ✔✔' : ''}</div>
        </div>`;
      msgsEl.appendChild(row);
      msgsEl.scrollTop = msgsEl.scrollHeight;

      // Mark as seen
      if (!isOwn && !msg.seen) {
        db.ref(`privateChats/${_chatId}/${snap.key}/seen`).set(true);
      }
    });

    // Typing indicator listener
    _typingListener = db.ref(`typing/${_chatId}/${_privatePeer}`).on('value', snap => {
      document.getElementById('typing-indicator').classList.toggle('hidden', !snap.val());
    });
  }

  function _bindPrivateInput() {
    const input = document.getElementById('private-chat-input');
    const sendBtn = document.getElementById('btn-send-private');
    const emojiBtn = document.getElementById('btn-emoji-private');
    const picker = document.getElementById('emoji-picker-private');

    let typingTimeout;
    input.oninput = () => {
      db.ref(`typing/${_chatId}/${_currentUser.uid}`).set(true);
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        db.ref(`typing/${_chatId}/${_currentUser.uid}`).set(false);
      }, 2000);
    };

    sendBtn.onclick = () => _sendPrivateMsg(input);
    input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); _sendPrivateMsg(input); } };

    emojiBtn.onclick = (e) => {
      e.stopPropagation();
      picker.classList.toggle('hidden');
    };

    picker.innerHTML = '';
    EMOJI_LIST.forEach(em => {
      const span = document.createElement('span');
      span.textContent = em;
      span.onclick = () => { input.value += em; input.focus(); };
      picker.appendChild(span);
    });

    document.addEventListener('click', () => picker.classList.add('hidden'));
  }

  async function _sendPrivateMsg(input) {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    db.ref(`typing/${_chatId}/${_currentUser.uid}`).set(false);

    await db.ref(`privateChats/${_chatId}`).push({
      senderId: _currentUser.uid,
      senderName: _userData.username,
      text,
      seen: false,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    });
  }

  /* ── Helpers ── */
  function _getMyRole(roomId, roomData) {
    if (!roomData) return 'member';
    if (roomData.ownerId === _currentUser.uid) return 'owner';
    if (roomData.admins && roomData.admins[_currentUser.uid]) return 'admin';
    return 'member';
  }

  function _cleanup() {
    if (_msgsListener) {
      db.ref(`messages/${_currentRoom}`).off('child_added', _msgsListener);
      _msgsListener = null;
    }
    if (_membersListener) {
      db.ref(`rooms/${_currentRoom}/usersOnline`).off('value', _membersListener);
      _membersListener = null;
    }
    _emojiOpen = false;
    _removeCtxMenu();
  }

  function _cleanupPrivate() {
    if (_msgsListener && _chatId) {
      db.ref(`privateChats/${_chatId}`).off('child_added', _msgsListener);
      _msgsListener = null;
    }
    if (_typingListener && _chatId) {
      db.ref(`typing/${_chatId}/${_privatePeer}`).off('value', _typingListener);
      _typingListener = null;
      db.ref(`typing/${_chatId}/${_currentUser.uid}`).set(false);
    }
  }

  return { init, openRoom, openPrivateChat };
})();
