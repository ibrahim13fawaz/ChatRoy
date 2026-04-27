# 💬 ChatVibe — تطبيق الدردشة الاجتماعية

تطبيق دردشة احترافي يعمل بالكامل على GitHub Pages مع Firebase كـ Backend.

---

## 🚀 خطوات الإعداد

### 1. إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. أنشئ مشروعاً جديداً
3. فعّل:
   - **Authentication** → Email/Password + Google + Facebook
   - **Realtime Database** → ابدأ في وضع اختبار
   - **Storage** (اختياري)

### 2. تعديل firebase-config.js

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "https://...-default-rtdb.firebaseio.com",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

// أضف UIDs الأدمن هنا
const ADMIN_UIDS = [
  "uid_من_firebase_console"
];
```

### 3. إعداد قواعد Firebase

انسخ محتوى `firebase-rules.json` إلى:
Firebase Console → Realtime Database → Rules

### 4. نشر على GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/chatapp.git
git push -u origin main
```

ثم في إعدادات المستودع:
Settings → Pages → Source: main / root

---

## 🔐 كيف تحصل على UID الأدمن

1. سجّل حساباً في التطبيق
2. اذهب إلى Firebase Console → Authentication → Users
3. انسخ الـ UID وأضفه في `firebase-config.js` داخل مصفوفة `ADMIN_UIDS`

الأدمن يحصل تلقائياً على:
- جميع الشارات بأعلى مستوى
- Level 100
- دخول أسطوري في الغرف
- لون ذهبي خاص
- كل صلاحيات الإدارة

---

## 📱 الميزات

| الميزة | التفاصيل |
|--------|----------|
| 🔐 تسجيل | Email + Google + Facebook |
| 💬 غرف | عامة + خاصة |
| 👥 أصدقاء | بحث + طلبات + دردشة خاصة |
| 📊 مستويات | 0-100 مع XP يومي |
| 🏅 شارات | أصدقاء + دخول + نشاط + خاصة |
| 🛡 أدمن | صلاحيات كاملة + شارات ماكسيموم |
| 🌙 تصميم | Dark Mode + Mobile First |

---

## 🎨 نظام الشارات

### شارات الأصدقاء
- 🥉 برونزي: 5 أصدقاء
- 🥈 فضي: 20 صديق
- 🥇 ذهبي: 50 صديق
- 💎 ماسي: 100 صديق

### شارات الحضور اليومي
- 🥉 برونزي: 7 أيام
- 🥈 فضي: 30 يوم
- 🥇 ذهبي: 100 يوم
- 💎 ماسي: 365 يوم

### شارات الغرفة
- 🥉 برونزي: 100 رسالة
- 🥈 فضي: 500 رسالة
- 🥇 ذهبي: 2000 رسالة
- 💎 ماسي: 10,000 رسالة

### شارات خاصة
- 👑 أسطوري: Level 100
- 🌟 مؤسس: أول 100 مستخدم
- 🛡 أدمن: مشرف النظام
- 💎 ماسي: ماكسيموم

---

## 🏆 نظام XP اليومي (حد 900/يوم)

| النشاط | النقاط |
|--------|--------|
| دخول يومي | +50 |
| إضافة صديق | +5 (حد 5) |
| تواجد | +1/دقيقة (حد 300) |
| إرسال رسالة | +1 (حد 200) |

---

## 📁 هيكل المشروع

```
/
├── index.html          — الصفحة الرئيسية
├── style.css           — التصميم الكامل
├── firebase-config.js  — إعدادات Firebase ⚠️
├── firebase-rules.json — قواعد الأمان
├── scripts/
│   ├── utils.js        — مساعدات + شارات + مستويات
│   ├── auth.js         — نظام التسجيل
│   ├── profile.js      — الملف الشخصي + Wizard
│   ├── rooms.js        — الغرف
│   ├── friends.js      — الأصدقاء
│   ├── chat.js         — الدردشة
│   └── app.js          — المتحكم الرئيسي
└── README.md
```
