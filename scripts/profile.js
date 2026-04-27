// ═══════════════════════════════════════
//  PROFILE.JS — Setup Wizard + Profile Tab
// ═══════════════════════════════════════

const ProfileModule = (() => {

  let _currentUser = null;
  let _userData    = null;
  let _setup = { gender: null, avatar: null, country: null, username: null };

  /* ══════════════════════════════
     SETUP WIZARD (first-time)
  ══════════════════════════════ */
  function showSetup(user) {
    _currentUser = user;
    showScreen('screen-setup');
    _initSetupStep1();
  }

  function _initSetupStep1() {
    _showSetupStep('setup-step-1');
    // Gender cards
    document.querySelectorAll('.gender-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.gender-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        _setup.gender = card.dataset.gender;
      });
    });
    document.getElementById('btn-setup-next1').addEventListener('click', () => {
      if (!_setup.gender) return showToast('اختر جنسك أولاً');
      _initSetupStep2();
    });
  }

  function _initSetupStep2() {
    _showSetupStep('setup-step-2');
    // Fill country select
    const sel = document.getElementById('setup-country');
    sel.innerHTML = '<option value="">اختر دولتك</option>';
    COUNTRIES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      sel.appendChild(opt);
    });
    document.getElementById('btn-setup-next2').addEventListener('click', () => {
      _setup.country = sel.value;
      if (!_setup.country) return showToast('اختر دولتك');
      _initSetupStep3();
    });
    document.getElementById('btn-setup-back2').addEventListener('click', () => _initSetupStep1());
  }

  function _initSetupStep3() {
    _showSetupStep('setup-step-3');
    const grid = document.getElementById('avatar-grid');
    grid.innerHTML = '';
    const list = _setup.gender === 'male' ? MALE_AVATARS : FEMALE_AVATARS;
    list.forEach(emoji => {
      const div = document.createElement('div');
      div.className = 'avatar-opt';
      div.textContent = emoji;
      div.addEventListener('click', () => {
        document.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
        div.classList.add('selected');
        _setup.avatar = emoji;
      });
      grid.appendChild(div);
    });
    document.getElementById('btn-setup-next3').addEventListener('click', () => {
      if (!_setup.avatar) return showToast('اختر صورة أولاً');
      _initSetupStep4();
    });
    document.getElementById('btn-setup-back3').addEventListener('click', () => _initSetupStep2());
  }

  function _initSetupStep4() {
    _showSetupStep('setup-step-4');
    const input = document.getElementById('setup-username');
    const btn = document.getElementById('btn-setup-finish');

    btn.addEventListener('click', async () => {
      const uname = input.value.trim();
      if (!uname || uname.length < 3) return showToast('اليوزرنيم 3 أحرف على الأقل');
      if (uname.length > 20) return showToast('اليوزرنيم 20 حرف كحد أقصى');
      if (!/^[\u0600-\u06FFa-zA-Z0-9_]+$/.test(uname)) return showToast('أحرف وأرقام و _ فقط');

      btn.disabled = true;
      btn.textContent = 'جارٍ الحفظ...';

      try {
        // Check unique username
        const snap = await db.ref('usernames').child(uname.toLowerCase()).once('value');
        if (snap.exists()) {
          showToast('اليوزرنيم مستخدم، جرب آخر');
          btn.disabled = false; btn.textContent = 'إنهاء الإعداد';
          return;
        }

        const uid = _currentUser.uid;
        const id6 = genUID6();
        const now = Date.now();
        const userData = {
          username: uname,
          usernameLower: uname.toLowerCase(),
          avatar: _setup.avatar,
          gender: _setup.gender,
          country: _setup.country,
          bio: '',
          level: 0,
          xp: 0,
          loginDays: 0,
          lastLoginDate: '',
          totalMessages: 0,
          online: true,
          lastSeen: now,
          createdAt: now,
          id6: id6,
          canChangeUsername: true,
          friends: {},
          requests: {},
          badges: [],
        };

        // If admin, give all badges
        if (isAdmin(uid)) {
          userData.badges = getAdminBadges();
          userData.xp = 100 * XP_PER_LEVEL;
          userData.level = 100;
        }

        const updates = {};
        updates[`users/${uid}`] = userData;
        updates[`usernames/${uname.toLowerCase()}`] = uid;
        await db.ref().update(updates);

        showToast('مرحباً بك! 🎉');
      } catch(e) {
        showToast('حدث خطأ، حاول مجدداً');
        btn.disabled = false; btn.textContent = 'إنهاء الإعداد';
      }
    });

    document.getElementById('btn-setup-back4').addEventListener('click', () => _initSetupStep3());
  }

  function _showSetupStep(id) {
    document.querySelectorAll('.setup-step').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  /* ══════════════════════════════
     PROFILE TAB
  ══════════════════════════════ */
  function renderProfileTab(user, userData) {
    _currentUser = user;
    _userData    = userData;

    const admin = isAdmin(user.uid);
    const level = admin ? 100 : getLevelFromXP(userData.xp || 0);
    const progress = admin ? 100 : getLevelProgress(userData.xp || 0);
    const badges = admin ? getAdminBadges() : (userData.badges || []);

    // Avatar
    document.getElementById('profile-avi').textContent = userData.avatar || '👤';

    // Level badge (small)
    document.getElementById('profile-lvl-badge').innerHTML = levelBadgeSVG(level);

    // Info
    document.getElementById('profile-username').textContent = userData.username || 'مستخدم';
    document.getElementById('profile-id').textContent = '#' + (userData.id6 || '000000');
    document.getElementById('profile-country').textContent =
      (userData.gender === 'male' ? '👦 ' : '👧 ') + (userData.country || '');
    document.getElementById('profile-bio-text').textContent = userData.bio || 'لا توجد نبذة بعد...';

    // Level bar
    document.getElementById('profile-level-label').textContent = `المستوى ${level}`;
    document.getElementById('profile-xp-label').textContent =
      admin ? 'MAX' : `${(userData.xp||0) % XP_PER_LEVEL} / ${XP_PER_LEVEL} XP`;
    document.getElementById('profile-level-bar').style.width = progress + '%';

    // Stats
    document.getElementById('stat-friends').textContent = Object.keys(userData.friends||{}).length;
    document.getElementById('stat-messages').textContent = userData.totalMessages || 0;
    document.getElementById('stat-days').textContent = userData.loginDays || 0;

    // Badges
    const grid = document.getElementById('badges-grid');
    grid.innerHTML = '';
    const allBadgeKeys = Object.keys(BADGE_DEFS);
    allBadgeKeys.forEach(key => {
      const earned = badges.includes(key);
      const def = BADGE_DEFS[key];
      const item = document.createElement('div');
      item.className = 'badge-item' + (earned ? '' : ' locked');
      item.innerHTML = buildBadgeSVG(key) +
        `<span class="badge-name">${def.name}</span>`;
      item.title = def.name;
      grid.appendChild(item);
    });

    // Admin special label
    const nameEl = document.getElementById('profile-username');
    if (admin) {
      nameEl.style.background = 'linear-gradient(135deg, #FFD040, #FF8000)';
      nameEl.style.webkitBackgroundClip = 'text';
      nameEl.style.webkitTextFillColor = 'transparent';
    }

    // Edit bio
    document.getElementById('btn-edit-bio').onclick = () => _showEditBio();

    // Change username
    document.getElementById('btn-change-username').onclick = () => {
      if (!userData.canChangeUsername) return showToast('يمكنك تغيير اليوزر مرة واحدة فقط');
      _showChangeUsername();
    };

    // Logout
    document.getElementById('btn-logout').onclick = () => {
      auth.signOut();
    };
  }

  function _showEditBio() {
    const modal = document.getElementById('modal-edit-bio');
    const textarea = document.getElementById('bio-input');
    textarea.value = _userData.bio || '';
    openModal('modal-edit-bio');

    document.getElementById('btn-save-bio').onclick = async () => {
      const bio = textarea.value.trim().slice(0, 150);
      await db.ref(`users/${_currentUser.uid}/bio`).set(bio);
      showToast('تم حفظ النبذة ✓');
      closeModal('modal-edit-bio');
    };
  }

  function _showChangeUsername() {
    openModal('modal-change-username');
    const input = document.getElementById('new-username-input');
    input.value = '';

    document.getElementById('btn-save-username').onclick = async () => {
      const uname = input.value.trim();
      if (!uname || uname.length < 3) return showToast('اليوزرنيم 3 أحرف على الأقل');
      if (uname.toLowerCase() === _userData.username.toLowerCase()) return showToast('نفس الاسم الحالي');

      const snap = await db.ref('usernames').child(uname.toLowerCase()).once('value');
      if (snap.exists()) return showToast('الاسم مستخدم');

      const updates = {};
      updates[`users/${_currentUser.uid}/username`] = uname;
      updates[`users/${_currentUser.uid}/usernameLower`] = uname.toLowerCase();
      updates[`users/${_currentUser.uid}/canChangeUsername`] = false;
      updates[`usernames/${_userData.username.toLowerCase()}`] = null;
      updates[`usernames/${uname.toLowerCase()}`] = _currentUser.uid;

      await db.ref().update(updates);
      showToast('تم تغيير الاسم ✓');
      closeModal('modal-change-username');
    };
  }

  /* ══════════════════════════════
     VIEW OTHER USER PROFILE (modal)
  ══════════════════════════════ */
  async function viewUserProfile(uid, currentUserUid) {
    const snap = await db.ref(`users/${uid}`).once('value');
    const u = snap.val();
    if (!u) return;

    const admin = isAdmin(uid);
    const level = admin ? 100 : getLevelFromXP(u.xp || 0);
    const badges = admin ? getAdminBadges() : (u.badges || []);

    document.getElementById('view-profile-avi').textContent = u.avatar || '👤';
    document.getElementById('view-profile-name').textContent = u.username;
    document.getElementById('view-profile-id').textContent = '#' + (u.id6 || '000000');
    document.getElementById('view-profile-level').textContent = `المستوى ${level}`;
    document.getElementById('view-profile-country').textContent =
      (u.gender === 'male' ? '👦 ' : '👧 ') + (u.country || '');
    document.getElementById('view-profile-bio').textContent = u.bio || '...';

    // Online status
    const onlineEl = document.getElementById('view-profile-online');
    if (u.online) {
      onlineEl.textContent = '🟢 متصل الآن';
      onlineEl.style.color = 'var(--online)';
    } else {
      onlineEl.textContent = '⚫ ' + formatLastSeen(u.lastSeen);
      onlineEl.style.color = 'var(--text-secondary)';
    }

    // Badges
    const badgeRow = document.getElementById('view-profile-badges');
    badgeRow.innerHTML = '';
    badges.slice(0, 6).forEach(key => {
      const div = document.createElement('div');
      div.innerHTML = buildBadgeSVG(key);
      div.title = BADGE_DEFS[key]?.name || '';
      badgeRow.appendChild(div);
    });

    // Friend / message actions
    const actionsEl = document.getElementById('view-profile-actions');
    actionsEl.innerHTML = '';

    if (uid !== currentUserUid) {
      const myFriendsSnap = await db.ref(`users/${currentUserUid}/friends/${uid}`).once('value');
      const isFriend = myFriendsSnap.exists();

      if (isFriend) {
        const chatBtn = document.createElement('button');
        chatBtn.className = 'btn-primary';
        chatBtn.style.marginTop = '12px';
        chatBtn.textContent = '💬 مراسلة';
        chatBtn.onclick = () => {
          closeModal('modal-view-profile');
          ChatModule.openPrivateChat(uid, u);
        };
        actionsEl.appendChild(chatBtn);
      } else {
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-primary';
        addBtn.style.marginTop = '12px';
        addBtn.textContent = '➕ إضافة صديق';
        addBtn.onclick = async () => {
          await FriendsModule.sendRequest(currentUserUid, uid);
          showToast('تم إرسال طلب الصداقة');
          closeModal('modal-view-profile');
        };
        actionsEl.appendChild(addBtn);
      }
    }

    openModal('modal-view-profile');
  }

  /* ── Daily login XP ── */
  async function checkDailyLogin(uid) {
    const snap = await db.ref(`users/${uid}`).once('value');
    const u = snap.val();
    if (!u) return;

    const today = new Date().toDateString();
    if (u.lastLoginDate === today) return;

    const newXP = Math.min((u.xp || 0) + 50, 100 * XP_PER_LEVEL);
    const newDays = (u.loginDays || 0) + 1;

    await db.ref(`users/${uid}`).update({
      xp: newXP,
      loginDays: newDays,
      lastLoginDate: today,
      level: getLevelFromXP(newXP),
    });

    showToast('🎁 +50 XP دخول يومي!');
  }

  /* ── Presence tracking (XP per minute) ── */
  function startPresenceTracking(uid) {
    // Set online
    const presenceRef = db.ref(`users/${uid}/online`);
    const lastSeenRef = db.ref(`users/${uid}/lastSeen`);
    presenceRef.set(true);

    // On disconnect
    presenceRef.onDisconnect().set(false);
    lastSeenRef.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);

    // XP per minute presence
    let minuteXP = 0;
    const interval = setInterval(async () => {
      const snap = await db.ref(`users/${uid}`).once('value');
      const u = snap.val();
      if (!u) return;

      const todayKey = new Date().toDateString();
      const presenceToday = u.presenceXPToday === todayKey ? (u.presenceXPCount || 0) : 0;
      if (presenceToday >= 300) return; // daily cap

      const newXP = Math.min((u.xp || 0) + 1, 100 * XP_PER_LEVEL);
      await db.ref(`users/${uid}`).update({
        xp: newXP,
        level: getLevelFromXP(newXP),
        presenceXPToday: todayKey,
        presenceXPCount: presenceToday + 1,
      });
    }, 60000); // every minute

    return interval;
  }

  return { showSetup, renderProfileTab, viewUserProfile, checkDailyLogin, startPresenceTracking };
})();
