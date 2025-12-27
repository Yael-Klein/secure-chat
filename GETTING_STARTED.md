# 🚀 מדריך התחלה מהירה - SecureMsg

## 📋 דרישות מוקדמות

- **Node.js** 18+ ([הורדה](https://nodejs.org/))
- **npm** (מגיע עם Node.js)

---

## 🎯 שלב 1: התקנת תלויות

### Client (תיקייה ראשית):
```bash
npm install
```

### Server (תיקיית server):
```bash
cd server
npm install
cd ..
```

---

## 🔐 שלב 2: יצירת תעודות SSL (אופציונלי - רק ל-HTTPS)

אם אתה רוצה HTTPS (מומלץ):

```bash
cd server
npm run generate-cert
cd ..
```

**מה זה עושה?**
- יוצר תעודות SSL self-signed ב-`server/certs/`
- תעודות תקפות לשנה

**הערה:** הדפדפן יציג אזהרה (זה נורמלי). לחץ "Advanced" → "Proceed to localhost".

---

## 🗄️ שלב 3: יצירת משתמשים לדוגמה (אופציונלי)

```bash
cd server
npm run seed
cd ..
```

**מה זה עושה?**
- יוצר 3 משתמשים:
  - `david` / `password123`
  - `yael` / `password123`
  - `moshe` / `password123`

**הערה:** אתה יכול גם ליצור משתמשים דרך האפליקציה.

---

## 🖥️ שלב 4: הפעלת השרת

### אופציה A: HTTP (פיתוח)
```bash
cd server
npm start
```

**תראה:**
```
🌐 HTTP Server running on port 3001
```

### אופציה B: HTTPS (מומלץ)
```bash
cd server
$env:HTTPS_ENABLED="true"
npm start
```

**תראה:**
```
🔒 HTTPS Server running on port 3001
```

**הערה:** ודא שיצרת תעודות SSL בשלב 2!

---

## 💻 שלב 5: הפעלת הלקוח

פתח **Terminal חדש** (השאר את השרת רץ):

```bash
npm run dev
```

**תראה:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🌐 שלב 6: פתיחת האפליקציה

1. פתח את הדפדפן
2. לך ל-`http://localhost:5173` (או `https://localhost:5173` אם השרת ב-HTTPS)

### אם אתה רואה אזהרת אבטחה:
- לחץ על **"Advanced"** (מתקדם)
- לחץ על **"Proceed to localhost (unsafe)"**
- זה נורמלי עם תעודות self-signed

---

## 👤 שלב 7: רישום/התחברות

### אופציה A: התחברות עם משתמש קיים
אם הרצת `npm run seed`:
- **Username:** `david`
- **Password:** `password123`

### אופציה B: רישום משתמש חדש
1. לחץ על **"Register"** (רישום)
2. מלא:
   - Username (מינימום 3 תווים)
   - Password (מינימום 8 תווים)
   - Confirm Password
3. לחץ **"Register"**

**מה קורה?**
- נוצר זוג מפתחות RSA
- המפתח הציבורי נשלח לשרת
- המפתח הפרטי נשמר ב-IndexedDB (מאובטח)

---

## 💬 שלב 8: שליחת הודעות

### Broadcast (שידור לכל):
1. אל תבחר משתמש מהרשימה
2. כתוב הודעה
3. לחץ "Send"
4. ההודעה תישלח לכל המשתמשים המחוברים

### Direct Message (הודעה ישירה):
1. בחר משתמש מהרשימה בצד
2. כתוב הודעה
3. לחץ "Send"
4. רק אתה והמשתמש הנבחר תראו את ההודעה

---

## ✅ בדיקה שהכל עובד

### 1. בדוק שהשרת רץ:
- בקונסול של השרת תראה: `🌐 HTTP Server` או `🔒 HTTPS Server`

### 2. בדוק שהלקוח רץ:
- בדפדפן תראה את האפליקציה

### 3. בדוק התחברות:
- התחבר עם משתמש קיים או צור חדש
- תראה את רשימת המשתמשים

### 4. בדוק שליחת הודעות:
- שלח הודעה
- פתח דפדפן/טאב נוסף עם משתמש אחר
- תראה את ההודעה

---

## 🔧 פתרון בעיות

### השרת לא מתחיל:
```bash
# בדוק שהפורט לא תפוס
netstat -ano | findstr :3001

# או שנה פורט:
cd server
$env:PORT=3002
npm start
```

### הלקוח לא מתחבר לשרת:
- ודא שהשרת רץ
- בדוק את `API_BASE_URL` ב-`src/lib/api.ts`
- בדוק CORS בשרת

### שגיאת SSL:
- אם אתה רואה `ERR_CERT_AUTHORITY_INVALID`:
  - לחץ "Advanced" → "Proceed to localhost"
  - זה נורמלי עם תעודות self-signed

### "Invalid credentials":
- ודא שהסיסמה נכונה
- נסה עם משתמשים מ-seed: `david` / `password123`

---

## 📊 מבנה הפרויקט המלא

```
secure-chat/
├── src/                    # React Client
│   ├── components/         # רכיבי UI
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   └── pages/             # דפים
├── server/                # Node.js Server
│   ├── utils/             # Server utilities
│   ├── middleware/       # Express middleware
│   ├── scripts/           # Scripts
│   └── certs/             # SSL certificates
├── GETTING_STARTED.md     # קובץ זה
├── README_CLIENT.md       # תיעוד לקוח
└── server/README.md       # תיעוד שרת
```

---

## 🎓 משתמשים לדוגמה

אחרי הרצת `npm run seed`:

| Username | Password |
|----------|----------|
| `david` | `password123` |
| `yael` | `password123` |
| `moshe` | `password123` |

---

## 🔐 HTTPS Setup (אופציונלי)

### יצירת תעודות:
```bash
cd server
npm run generate-cert
```

### הפעלת HTTPS:
```bash
cd server
$env:HTTPS_ENABLED="true"
npm start
```

### עדכון הלקוח:
הלקוח כבר מוגדר להשתמש ב-HTTPS אם השרת רץ ב-HTTPS.

---

## 📝 סיכום - פקודות מהירות

### Terminal 1 (Server):
```bash
cd server
npm install
npm run generate-cert      # רק ל-HTTPS
npm run seed              # אופציונלי
$env:HTTPS_ENABLED="true" # רק ל-HTTPS
npm start
```

### Terminal 2 (Client):
```bash
npm install
npm run dev
```

---

## 🎉 זה הכל!

עכשיו אתה יכול:
- ✅ ליצור משתמשים
- ✅ להתחבר
- ✅ לשלוח הודעות מוצפנות
- ✅ לראות הודעות מ-users אחרים

**הכל מוצפן end-to-end! 🔒**

---

**צריך עזרה?** ראה:
- `server/README.md` - תיעוד השרת
- `README_CLIENT.md` - תיעוד הלקוח

