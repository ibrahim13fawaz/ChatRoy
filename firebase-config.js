// 🔥 Firebase Configuration
// ⚠️ استبدل هذه القيم بقيم مشروعك من Firebase Console

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB0k_out0dMDdDrl32WSXNdgUUcnBmynNI",
  authDomain: "chatroy-ccc7f.firebaseapp.com",
  databaseURL: "https://chatroy-ccc7f-default-rtdb.firebaseio.com",
  projectId: "chatroy-ccc7f",
  storageBucket: "chatroy-ccc7f.firebasestorage.app",
  messagingSenderId: "248997365308",
  appId: "1:248997365308:web:9eaffee7dd0a72c9cde539",
  measurementId: "G-TPS4B8PBZL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

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
