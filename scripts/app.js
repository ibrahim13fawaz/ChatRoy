// ═══════════════════════════════════════
//  APP.JS — Main Router & State Manager
// ═══════════════════════════════════════

/* ── Screen Manager ── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = '';
  });
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('open'));
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => { modal.style.display = ''; }, 300);
}

// Close modal on backdrop click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

/* ── Bottom Nav ── */
function initBottomNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('tab-' + tab).classList.add('active');
    });
  });
}

/* ── Global State ── */
let _appUser     = null;
let _appUserData = null;
let _presenceInterval = null;
let _userDataListener = null;

/* ── Auth State Machine ── */
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    // Logged out
    _cleanup();
    showScreen('screen-auth');
    return;
  }

  _appUser = user;

  // Check if user has profile
  const snap = await db.ref(`users/${user.uid}`).once('value');

  if (!snap.exists()) {
    // First time — show setup
    ProfileModule.showSetup(user);
    // Watch for profile creation
    db.ref(`users/${user.uid}`).on('value', profileSnap => {
      if (profileSnap.exists()) {
        db.ref(`users/${user.uid}`).off('value');
        _bootApp(user, profileSnap.val());
      }
    });
  } else {
    _bootApp(user, snap.val());
  }
});

async function _bootApp(user, userData) {
  _appUser     = user;
  _appUserData = userData;

  // Update userData live
  if (_userDataListener) db.ref(`users/${user.uid}`).off('value', _userDataListener);
  _userDataListener = db.ref(`users/${user.uid}`).on('value', snap => {
    _appUserData = snap.val();
    if (!_appUserData) return;
    ProfileModule.renderProfileTab(user, _appUserData);
  });

  // Init modules
  ChatModule.init(user, userData);
  RoomsModule.init(user, userData);
  FriendsModule.init(user, userData);
  FriendsModule.listenRequestCount(user.uid);

  // Render profile
  ProfileModule.renderProfileTab(user, userData);

  // Daily login XP
  await ProfileModule.checkDailyLogin(user.uid);

  // Presence tracking
  _presenceInterval = ProfileModule.startPresenceTracking(user.uid);

  // Init nav
  initBottomNav();

  // Show main app
  showScreen('screen-app');
}

function _cleanup() {
  if (_presenceInterval) clearInterval(_presenceInterval);
  if (_userDataListener && _appUser) {
    db.ref(`users/${_appUser.uid}`).off('value', _userDataListener);
  }
  RoomsModule.destroy?.();
  FriendsModule.destroy?.();
  _appUser = null;
  _appUserData = null;
}

/* ── Init Auth Module ── */
AuthModule.init();

/* ── Firebase Rules reminder in console ── */
console.info(`
%c ChatVibe — Firebase Rules Required!
%c Make sure you set Realtime Database rules in Firebase Console.
See firebase-rules.json for the recommended rules.
`, 'color:#7C4DFF;font-weight:bold;font-size:14px', 'color:#9090C0;font-size:12px');
