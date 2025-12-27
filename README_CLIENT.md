# 💻 SecureMsg Client - תיעוד הלקוח

## 📋 סקירה כללית

אפליקציית React מאובטחת לתקשורת מוצפנת. הלקוח מספק ממשק משתמש לרישום, התחברות, ושליחת הודעות מוצפנות.

---

## 🏗️ מבנה הפרויקט

```
src/
├── main.tsx              # נקודת הכניסה
├── App.tsx               # רכיב ראשי + routing
├── pages/
│   ├── Index.tsx         # דף ראשי (auth + chat)
│   └── NotFound.tsx      # דף 404
├── components/
│   ├── AuthForm.tsx      # טופס רישום/התחברות
│   ├── ChatView.tsx      # תצוגת צ'אט ראשית
│   ├── ChatHeader.tsx    # כותרת צ'אט
│   ├── MessageList.tsx  # רשימת הודעות
│   ├── MessageInput.tsx # שדה קלט הודעות
│   ├── UserList.tsx      # רשימת משתמשים
│   └── ui/               # רכיבי UI (shadcn-ui)
├── hooks/
│   ├── useAuth.ts        # ניהול אימות
│   ├── useMessages.ts    # ניהול הודעות
│   └── useUsers.ts       # ניהול משתמשים
└── lib/
    ├── api.ts            # API client
    ├── crypto.ts         # פונקציות קריפטוגרפיה (Web Crypto API)
    └── storage.ts        # ניהול IndexedDB (מפתחות פרטיים)
```

---

## 🚀 התקנה והפעלה

### התקנת תלויות:
```bash
npm install
```

### הפעלת הלקוח:
```bash
npm run dev
```

הלקוח יעבוד על `http://localhost:5173` (או `https://localhost:5173` אם השרת רץ ב-HTTPS)

### Build לפרודקשן:
```bash
npm run build
```

---

## 🔐 אבטחה

### Features:
- ✅ **RSA-OAEP (2048-bit)** - הצפנה אסימטרית למפתחות AES
- ✅ **AES-GCM (256-bit)** - הצפנה סימטרית לתוכן הודעות
- ✅ **IndexedDB Storage** - אחסון מאובטח של מפתחות פרטיים
- ✅ **JWT Authentication** - אימות מבוסס טוקנים
- ✅ **End-to-End Encryption** - הודעות מוצפנות end-to-end

### איפה נשמרים המפתחות?

| מפתח | איפה נשמר | הערות |
|------|-----------|-------|
| **RSA Private Key** | IndexedDB | רק בדפדפן, לא נשלח לשרת |
| **RSA Public Key** | localStorage + Server | נשלח לשרת לרישום |
| **JWT Token** | localStorage | לאימות בקשות |
| **User Info** | localStorage | פרטי משתמש |

---

## 🔑 ניהול מפתחות

### יצירת מפתחות:
- **רישום:** מפתחות נוצרים אוטומטית
- **התחברות:** אם אין מפתחות, נוצרים אוטומטית

### אחסון:
- **מפתח פרטי:** IndexedDB (מאובטח יותר מ-localStorage)
- **Migration:** אוטומטי מ-localStorage ל-IndexedDB

---

## 💬 שליחת הודעות

### Direct Message (הודעה ישירה):
1. בוחרים משתמש מהרשימה
2. כותבים הודעה
3. ההודעה מוצפנת עם מפתח AES
4. מפתח ה-AES מוצפן פעמיים:
   - פעם אחת עם המפתח הציבורי של הנמען
   - פעם אחת עם המפתח הציבורי של השולח
5. נשלחות 2 הודעות לשרת (אחת לכל אחד)

### Broadcast (שידור לכל):
1. לא בוחרים משתמש
2. כותבים הודעה
3. ההודעה מוצפנת עם מפתח AES
4. מפתח ה-AES מוצפן לכל משתמש פעיל
5. נשלחת הודעה לכל משתמש (מוצפנת עם המפתח הציבורי שלו)

---

## 📡 API Client (src/lib/api.ts)

### פונקציות עיקריות:

```typescript
// Authentication
register(username, password, publicKey)
login(username, password)
logout()
verifyToken(token)

// Users
getUsers()
getUserById(id)
updatePublicKey(publicKey)

// Messages
sendMessage(message)
pollMessages(since)
getMessageHistory(limit)
```

### Base URL:
- **HTTP:** `http://localhost:3001/api`
- **HTTPS:** `https://localhost:3001/api`

ניתן להגדיר דרך משתנה סביבה:
```bash
VITE_API_URL=https://localhost:3001/api npm run dev
```

---

## 🎨 UI Components

### shadcn-ui:
הפרויקט משתמש ב-[shadcn-ui](https://ui.shadcn.com/) לרכיבי UI:
- Button, Input, Card, Dialog, וכו'
- כל הרכיבים ב-`src/components/ui/`

### Styling:
- **Tailwind CSS** - Styling
- **CSS Variables** - Themes
- **Responsive Design** - Mobile-friendly

---

## 🔄 State Management

### Hooks:

#### `useAuth`
- ניהול אימות (login, register, logout)
- שמירת session
- ניהול מפתחות פרטיים

#### `useMessages`
- שליחת הודעות מוצפנות
- קבלת הודעות (long polling)
- פענוח הודעות
- Caching של מפתחות ציבוריים

#### `useUsers`
- רשימת משתמשים
- עדכון אוטומטי כל 30 שניות

---

## 📱 Features

### Authentication:
- ✅ רישום משתמש חדש
- ✅ התחברות
- ✅ יציאה
- ✅ שמירת session (auto-login)

### Messaging:
- ✅ הודעות ישירות (direct messages)
- ✅ שידור לכל (broadcast)
- ✅ היסטוריית הודעות
- ✅ Real-time updates (long polling)

### Security:
- ✅ הצפנה end-to-end
- ✅ מפתחות פרטיים ב-IndexedDB
- ✅ Caching של מפתחות ציבוריים

---

## 🚨 Troubleshooting

### "Failed to fetch":
- ודא שהשרת רץ
- בדוק את `API_BASE_URL` ב-`src/lib/api.ts`
- בדוק CORS בשרת

### "Private key not found":
- זה אמור להיפתר אוטומטית (יצירת מפתחות חדשים)
- אם לא, נסה להתחבר שוב

### "ERR_CERT_AUTHORITY_INVALID":
- זה נורמלי עם תעודות self-signed
- לחץ "Advanced" → "Proceed to localhost"

---

## 📚 תלויות עיקריות

- `react` - UI framework
- `react-router-dom` - Routing
- `@tanstack/react-query` - Data fetching
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `shadcn-ui` - UI components

---

## 🔧 Environment Variables

### `.env` (אופציונלי):
```env
VITE_API_URL=https://localhost:3001/api
```

---

**גרסה:** 1.0.0  
**תאריך עדכון:** 2025-12-27

