// ═══════════════════════════════════════
//  AUTH.JS — Authentication System
// ═══════════════════════════════════════

const AuthModule = (() => {

  let _onLoginSuccess = null;

  function init(onLoginSuccess) {
    _onLoginSuccess = onLoginSuccess;
    _bindTabs();
    _bindForms();
    _bindSocial();
  }

  /* ── Tab switching ── */
  function _bindTabs() {
    document.querySelectorAll('.auth-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab;
        document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
        document.getElementById('form-' + target).classList.remove('hidden');
        _clearError();
      });
    });
  }

  /* ── Email/Password ── */
  function _bindForms() {
    // Login
    document.getElementById('btn-login').addEventListener('click', async () => {
      const email = document.getElementById('login-email').value.trim();
      const pass  = document.getElementById('login-pass').value;
      if (!email || !pass) return _showError('يرجى ملء جميع الحقول');
      _setLoading('btn-login', true);
      try {
        await auth.signInWithEmailAndPassword(email, pass);
      } catch(e) {
        _showError(_authError(e.code));
      }
      _setLoading('btn-login', false);
    });

    // Register
    document.getElementById('btn-register').addEventListener('click', async () => {
      const email = document.getElementById('reg-email').value.trim();
      const pass  = document.getElementById('reg-pass').value;
      const pass2 = document.getElementById('reg-pass2').value;
      if (!email || !pass) return _showError('يرجى ملء جميع الحقول');
      if (pass !== pass2) return _showError('كلمتا المرور غير متطابقتين');
      if (pass.length < 6) return _showError('كلمة المرور 6 أحرف على الأقل');
      _setLoading('btn-register', true);
      try {
        await auth.createUserWithEmailAndPassword(email, pass);
      } catch(e) {
        _showError(_authError(e.code));
      }
      _setLoading('btn-register', false);
    });
  }

  /* ── Social Login ── */
  function _bindSocial() {
    document.getElementById('btn-google').addEventListener('click', async () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      try {
        await auth.signInWithPopup(provider);
      } catch(e) {
        _showError(_authError(e.code));
      }
    });

    document.getElementById('btn-facebook').addEventListener('click', async () => {
      const provider = new firebase.auth.FacebookAuthProvider();
      try {
        await auth.signInWithPopup(provider);
      } catch(e) {
        _showError(_authError(e.code));
      }
    });
  }

  /* ── Error helpers ── */
  function _authError(code) {
    const map = {
      'auth/user-not-found': 'البريد الإلكتروني غير مسجل',
      'auth/wrong-password': 'كلمة المرور غير صحيحة',
      'auth/email-already-in-use': 'البريد مستخدم بالفعل',
      'auth/invalid-email': 'بريد إلكتروني غير صالح',
      'auth/too-many-requests': 'محاولات كثيرة، حاول لاحقاً',
      'auth/popup-closed-by-user': 'تم إغلاق نافذة تسجيل الدخول',
      'auth/network-request-failed': 'خطأ في الاتصال بالإنترنت',
    };
    return map[code] || 'حدث خطأ، حاول مجدداً';
  }

  function _showError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.add('show');
  }
  function _clearError() {
    document.getElementById('auth-error').classList.remove('show');
  }

  function _setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    btn.disabled = loading;
    btn.textContent = loading ? '...' : (btnId === 'btn-login' ? 'دخول' : 'إنشاء حساب');
  }

  return { init };
})();
