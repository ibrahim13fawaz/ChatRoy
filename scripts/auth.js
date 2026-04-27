// ═══════════════════════════════════════
//  AUTH.JS — Authentication System
// ═══════════════════════════════════════

const AuthModule = (() => {

  function init() {
    _bindTabs();
    _bindForms();
    _bindSocial();
  }

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

  function _bindForms() {
    document.getElementById('btn-login').addEventListener('click', async () => {
      if (!FIREBASE_READY) return _showError('أضف بيانات Firebase أولاً في firebase-config.js');
      const email = document.getElementById('login-email').value.trim();
      const pass  = document.getElementById('login-pass').value;
      if (!email || !pass) return _showError('يرجى ملء جميع الحقول');
      _setLoading('btn-login', true, 'دخول');
      try {
        await auth.signInWithEmailAndPassword(email, pass);
      } catch(e) {
        _showError(_authError(e.code));
        _setLoading('btn-login', false, 'دخول');
      }
    });

    document.getElementById('btn-register').addEventListener('click', async () => {
      if (!FIREBASE_READY) return _showError('أضف بيانات Firebase أولاً في firebase-config.js');
      const email = document.getElementById('reg-email').value.trim();
      const pass  = document.getElementById('reg-pass').value;
      const pass2 = document.getElementById('reg-pass2').value;
      if (!email || !pass) return _showError('يرجى ملء جميع الحقول');
      if (pass !== pass2) return _showError('كلمتا المرور غير متطابقتين');
      if (pass.length < 6) return _showError('كلمة المرور 6 أحرف على الأقل');
      _setLoading('btn-register', true, 'إنشاء حساب');
      try {
        await auth.createUserWithEmailAndPassword(email, pass);
      } catch(e) {
        _showError(_authError(e.code));
        _setLoading('btn-register', false, 'إنشاء حساب');
      }
    });
  }

  function _bindSocial() {
    document.getElementById('btn-google').addEventListener('click', async () => {
      if (!FIREBASE_READY) return _showError('أضف بيانات Firebase أولاً في firebase-config.js');
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
      } catch(e) {
        _showError(_authError(e.code));
      }
    });

    document.getElementById('btn-facebook').addEventListener('click', async () => {
      if (!FIREBASE_READY) return _showError('أضف بيانات Firebase أولاً في firebase-config.js');
      try {
        const provider = new firebase.auth.FacebookAuthProvider();
        await auth.signInWithPopup(provider);
      } catch(e) {
        _showError(_authError(e.code));
      }
    });
  }

  function _authError(code) {
    const map = {
      'auth/user-not-found':        'البريد الإلكتروني غير مسجل',
      'auth/wrong-password':        'كلمة المرور غير صحيحة',
      'auth/invalid-credential':    'البريد أو كلمة المرور غير صحيحة',
      'auth/email-already-in-use':  'البريد مستخدم بالفعل',
      'auth/invalid-email':         'بريد إلكتروني غير صالح',
      'auth/too-many-requests':     'محاولات كثيرة، حاول لاحقاً',
      'auth/popup-closed-by-user':  'تم إغلاق نافذة تسجيل الدخول',
      'auth/network-request-failed':'خطأ في الاتصال بالإنترنت',
      'auth/popup-blocked':         'السماح بالنوافذ المنبثقة في المتصفح',
    };
    return map[code] || ('حدث خطأ: ' + code);
  }

  function _showError(msg) {
    const el = document.getElementById('auth-error');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 4000);
  }

  function _clearError() {
    const el = document.getElementById('auth-error');
    if (el) el.classList.remove('show');
  }

  function _setLoading(btnId, loading, label) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? '...' : label;
  }

  return { init };
})();
