// ═══════════════════════════════════════
//  ROOMS.JS — Rooms System
// ═══════════════════════════════════════

const RoomsModule = (() => {

  let _currentUser = null;
  let _userData    = null;
  let _roomsListener = null;

  const PUBLIC_ROOM_ID = '__public__';

  function init(user, userData) {
    _currentUser = user;
    _userData    = userData;
    _ensurePublicRoom();
    _bindCreateRoom();
    listenRooms();
  }

  /* ── Ensure public room exists ── */
  async function _ensurePublicRoom() {
    const snap = await db.ref(`rooms/${PUBLIC_ROOM_ID}`).once('value');
    if (!snap.exists()) {
      await db.ref(`rooms/${PUBLIC_ROOM_ID}`).set({
        name: 'الغرفة العامة',
        avatar: '🌍',
        ownerId: 'system',
        admins: {},
        bannedUsers: {},
        usersOnline: 0,
        isPublic: true,
        createdAt: Date.now(),
      });
    }
  }

  /* ── Listen all rooms ── */
  function listenRooms() {
    const list = document.getElementById('rooms-list');
    list.innerHTML = '<div class="spinner"></div>';

    if (_roomsListener) db.ref('rooms').off('value', _roomsListener);

    _roomsListener = db.ref('rooms').on('value', snap => {
      list.innerHTML = '';
      const rooms = [];
      snap.forEach(child => rooms.push({ id: child.key, ...child.val() }));

      // Public first
      const publicRoom = rooms.find(r => r.id === PUBLIC_ROOM_ID);
      const privateRooms = rooms.filter(r => r.id !== PUBLIC_ROOM_ID);

      if (publicRoom) list.appendChild(_buildRoomCard(publicRoom));
      privateRooms.forEach(r => list.appendChild(_buildRoomCard(r)));

      if (!rooms.length) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">🏠</div><p>لا توجد غرف بعد</p></div>';
      }
    });
  }

  function _buildRoomCard(room) {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.innerHTML = `
      ${room.isPublic ? '<span class="public-room-badge">عام</span>' : ''}
      <div class="room-avatar">${sanitize(room.avatar || '🏠')}</div>
      <div class="room-info">
        <div class="room-name">${sanitize(room.name)}</div>
        <div class="room-online">${room.usersOnline || 0} متواجد</div>
      </div>`;
    card.addEventListener('click', () => ChatModule.openRoom(room.id, room));
    return card;
  }

  /* ── Create Room ── */
  function _bindCreateRoom() {
    document.getElementById('btn-create-room').addEventListener('click', () => {
      openModal('modal-create-room');
    });
    document.getElementById('btn-save-room').addEventListener('click', _createRoom);
  }

  async function _createRoom() {
    const name   = document.getElementById('room-name-input').value.trim();
    const avatar = document.getElementById('room-avatar-input').value.trim() || '🏠';
    if (!name) return showToast('أدخل اسم الغرفة');

    const btn = document.getElementById('btn-save-room');
    btn.disabled = true;

    try {
      const roomRef = db.ref('rooms').push();
      await roomRef.set({
        name,
        avatar,
        ownerId: _currentUser.uid,
        admins: {},
        bannedUsers: {},
        usersOnline: 0,
        isPublic: false,
        createdAt: Date.now(),
      });
      showToast('تم إنشاء الغرفة ✓');
      closeModal('modal-create-room');
      document.getElementById('room-name-input').value = '';
      document.getElementById('room-avatar-input').value = '';
    } catch(e) {
      showToast('خطأ في الإنشاء');
    }
    btn.disabled = false;
  }

  /* ── Ban / Kick user ── */
  async function banUser(roomId, targetUid) {
    await db.ref(`rooms/${roomId}/bannedUsers/${targetUid}`).set(true);
    await db.ref(`rooms/${roomId}/usersOnline/${targetUid}`).remove();
    showToast('تم حظر المستخدم');
  }

  async function kickUser(roomId, targetUid) {
    await db.ref(`rooms/${roomId}/usersOnline/${targetUid}`).remove();
    showToast('تم طرد المستخدم');
  }

  /* ── Assign admin ── */
  async function assignAdmin(roomId, targetUid) {
    await db.ref(`rooms/${roomId}/admins/${targetUid}`).set(true);
    showToast('تم تعيين أدمن ✓');
  }

  /* ── Check if user can enter room ── */
  async function canEnterRoom(roomId, uid) {
    const snap = await db.ref(`rooms/${roomId}/bannedUsers/${uid}`).once('value');
    return !snap.exists();
  }

  function destroy() {
    if (_roomsListener) db.ref('rooms').off('value', _roomsListener);
  }

  return {
    init, listenRooms, banUser, kickUser, assignAdmin, canEnterRoom,
    PUBLIC_ROOM_ID,
  };
})();
