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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();
