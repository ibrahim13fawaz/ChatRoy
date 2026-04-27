// 🔥 Firebase Configuration
// ⚠️ استبدل هذه القيم بقيم مشروعك من Firebase Console

const firebaseConfig = {
  apiKey: "AIzaSyCXA1x9fJe6zPFo7yiK1kSRsoR89aSff5k",
  authDomain: "itchat-web-8c4ed.firebaseapp.com",
  databaseURL: "https://itchat-web-8c4ed-default-rtdb.firebaseio.com",
  projectId: "itchat-web-8c4ed",
  storageBucket: "itchat-web-8c4ed.firebasestorage.app",
  messagingSenderId: "787261764804",
  appId: "1:787261764804:web:68cfdba7878669c7dbc591",
  measurementId: "G-G8S46BLQ0Y"
};

// Admin UIDs — أضف UIDs الأدمن هنا
const ADMIN_UIDS = [
37KCQRcgyjYPFZdj14uNJpCiKZk2
];

// ─────────────────────────────────────────
// Safe Firebase init — never throws
// ─────────────────────────────────────────
let auth, db, storage;
let FIREBASE_READY = false;

(function safeInit() {
  try {
    const configured = firebaseConfig.apiKey &&
                       !firebaseConfig.apiKey.startsWith('YOUR_') &&
                       firebaseConfig.databaseURL &&
                       !firebaseConfig.databaseURL.includes('YOUR_PROJECT-default');

    if (!configured) {
      _showSetupBanner();
      return;
    }

    firebase.initializeApp(firebaseConfig);
    auth    = firebase.auth();
    db      = firebase.database();
    storage = firebase.storage();
    FIREBASE_READY = true;
  } catch(err) {
    console.error('Firebase init failed:', err.message);
    _showSetupBanner();
  }
})();

function _showSetupBanner() {
  // Show banner after DOM is ready
  function _render() {
    const b = document.createElement('div');
    b.id = 'firebase-banner';
    b.innerHTML =
      '<span>⚙️ أضف بيانات Firebase في </span>' +
      '<code>firebase-config.js</code>' +
      '<span> لتفعيل تسجيل الدخول</span>';
    b.style.cssText = [
      'position:fixed','top:0','left:0','right:0','z-index:9999',
      'background:linear-gradient(135deg,#7C4DFF,#A040FF)',
      'color:#fff','font-family:Cairo,sans-serif',
      'padding:10px 16px','text-align:center',
      'font-size:13px','font-weight:600',
      'box-shadow:0 4px 20px rgba(0,0,0,.5)',
    ].join(';');
    b.querySelector('code').style.cssText =
      'background:rgba(255,255,255,.25);padding:2px 6px;border-radius:4px;font-family:monospace';
    document.body.prepend(b);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _render);
  } else {
    _render();
  }
}
