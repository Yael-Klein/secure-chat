# 🔒 SecureMsg Server - תיעוד השרת

## 📋 סקירה כללית

שרת Node.js מאובטח לתקשורת מוצפנת בין לקוחות מרובים. השרת מספק API לרישום, התחברות, וניהול הודעות מוצפנות.

---

## 🏗️ מבנה הפרויקט

```
server/
├── index.js              # נקודת הכניסה הראשית - Express server
├── config.js             # הגדרות השרת
├── package.json           # תלויות השרת
├── database.json          # מסד נתונים JSON (לא ב-Git)
├── certs/                 # תעודות SSL (לא ב-Git)
│   ├── key.pem           # מפתח פרטי
│   └── cert.pem          # תעודה
├── logs/                  # לוגים
│   ├── error.log         # שגיאות
│   └── combined.log      # כל הלוגים
├── middleware/
│   └── auth.js           # Middleware לאימות JWT
├── utils/
│   ├── crypto.js         # פונקציות קריפטוגרפיה (node-forge)
│   ├── database.js       # ניהול מסד נתונים JSON
│   └── logger.js          # Winston logger
└── scripts/
    ├── seed.js           # סקריפט ליצירת משתמשים לדוגמה
    └── generate-dev-cert.js  # יצירת תעודות SSL לפיתוח
```

---

## 🚀 התקנה והפעלה

### התקנת תלויות:
```bash
cd server
npm install
```

### יצירת תיקיית לוגים:
```bash
mkdir logs
```

### הפעלת השרת:

**Development (HTTP):**
```bash
npm start
```

**Production (HTTPS):**
```bash
HTTPS_ENABLED=true npm start
```

**עם auto-reload:**
```bash
npm run dev
```

---

## ⚙️ הגדרות (config.js)

| משתנה | ברירת מחדל | תיאור |
|--------|-------------|-------|
| `PORT` | 3001 | פורט השרת |
| `JWT_SECRET` | (ברירת מחדל) | מפתח סודי ל-JWT (חובה בפרודקשן!) |
| `JWT_EXPIRY` | 7d | תוקף טוקן |
| `BCRYPT_ROUNDS` | 10 | מספר סיבובים ל-hashing סיסמאות |
| `HTTPS_ENABLED` | false | הפעלת HTTPS |
| `HTTPS_KEY_PATH` | ./certs/key.pem | נתיב למפתח פרטי |
| `HTTPS_CERT_PATH` | ./certs/cert.pem | נתיב לתעודה |

---

## 🔌 API Endpoints

### Authentication

#### `POST /api/register`
רישום משתמש חדש

**Request:**
```json
{
  "username": "david",
  "password": "password123",
  "publicKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "david",
    "publicKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8..."
  }
}
```

#### `POST /api/login`
התחברות משתמש

**Request:**
```json
{
  "username": "david",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "david",
    "publicKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8..."
  }
}
```

**Rate Limiting:** 5 ניסיונות ל-15 דקות

#### `POST /api/logout`
יציאה (דורש אימות)

**Headers:**
```
Authorization: Bearer <token>
```

---

### Users

#### `GET /api/users`
קבלת רשימת כל המשתמשים (דורש אימות)

**Response:**
```json
[
  {
    "id": "uuid",
    "username": "david",
    "publicKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8..."
  }
]
```

#### `GET /api/users/:id`
קבלת משתמש לפי ID (דורש אימות)

#### `PUT /api/users/me/public-key`
עדכון מפתח ציבורי של המשתמש המחובר (דורש אימות)

**Request:**
```json
{
  "publicKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8..."
}
```

---

### Messages

#### `POST /api/messages`
שליחת הודעה מוצפנת (דורש אימות)

**Request:**
```json
{
  "senderId": "uuid",
  "senderUsername": "david",
  "recipientId": "uuid" | null,  // null = broadcast
  "encryptedContent": "base64...",
  "encryptedKey": "base64...",
  "iv": "base64..."
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "1"
}
```

#### `GET /api/messages`
קבלת היסטוריית הודעות (דורש אימות)

**Query Parameters:**
- `limit` (optional): מספר הודעות (ברירת מחדל: 50)

#### `GET /api/messages/poll`
Long polling להודעות חדשות (דורש אימות)

**Query Parameters:**
- `since` (optional): ID של ההודעה האחרונה שקיבלת

**Response:**
```json
[
  {
    "id": "1",
    "senderId": "uuid",
    "senderUsername": "david",
    "recipientId": "uuid" | null,
    "encryptedContent": "base64...",
    "encryptedKey": "base64...",
    "iv": "base64...",
    "timestamp": "2025-12-27T..."
  }
]
```

---

## 🔐 אבטחה

### Features:
- ✅ **JWT Authentication** - אימות מבוסס טוקנים
- ✅ **bcrypt Password Hashing** - הצפנת סיסמאות (10 rounds)
- ✅ **Rate Limiting** - הגבלת בקשות (1000/15 דקות, 5/15 דקות ל-auth)
- ✅ **Helmet** - Security headers
- ✅ **CORS** - הגבלת מקורות
- ✅ **HTTPS/TLS** - תמיכה בהצפנת תעבורה
- ✅ **Input Validation** - בדיקת קלט
- ✅ **Error Handling** - טיפול בשגיאות ללא חשיפת פרטים

### Rate Limiting:
- **Authentication endpoints:** 5 ניסיונות ל-15 דקות
- **Polling endpoints:** 3000 בקשות ל-15 דקות
- **כל השאר:** 1000 בקשות ל-15 דקות

---

## 📊 מסד נתונים

### מבנה (database.json):

```json
{
  "users": [
    {
      "id": "uuid",
      "username": "david",
      "passwordHash": "$2b$10$...",
      "publicKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8...",
      "createdAt": "2025-12-27T..."
    }
  ],
  "messages": [
    {
      "id": "1",
      "senderId": "uuid",
      "senderUsername": "david",
      "recipientId": "uuid" | null,
      "encryptedContent": "base64...",
      "encryptedKey": "base64...",
      "iv": "base64...",
      "timestamp": "2025-12-27T..."
    }
  ],
  "sessions": [
    {
      "token": "jwt-token",
      "userId": "uuid",
      "username": "david",
      "createdAt": "2025-12-27T..."
    }
  ]
}
```

**הערות:**
- כל ההודעות מוצפנות (encrypted at rest)
- הסיסמאות מוצפנות עם bcrypt
- המפתחות הפרטיים לא נשמרים בשרת

---

## 🔧 Scripts

### Seed Database:
```bash
npm run seed
```

יוצר משתמשים לדוגמה:
- `david` / `password123`
- `yael` / `password123`
- `moshe` / `password123`

### Generate SSL Certificates:
```bash
npm run generate-cert
```

יוצר תעודות SSL self-signed ב-`server/certs/`

---

## 📝 Logging

הלוגים נשמרים ב-`logs/`:
- `error.log` - שגיאות בלבד
- `combined.log` - כל הלוגים

**Format:** JSON עם timestamp, level, message, ו-metadata

---

## 🚨 Troubleshooting

### Port already in use:
```bash
PORT=3002 npm start
```

### Certificate errors:
- ודא שהתעודות קיימות: `server/certs/key.pem` ו-`server/certs/cert.pem`
- הרץ: `npm run generate-cert`

### Database errors:
- ודא ש-`database.json` קיים (נוצר אוטומטית)
- בדוק הרשאות כתיבה

### CORS errors:
- ודא ש-`CLIENT_URL` תואם לכתובת הלקוח
- ברירת מחדל: `http://localhost:8080` או `https://localhost:8080`

---

## 🔄 Production Deployment

1. הגדר `NODE_ENV=production`
2. הגדר `JWT_SECRET` חזק (משתנה סביבה)
3. הפעל HTTPS עם תעודות אמיתיות
4. השתמש ב-PM2 או process manager אחר
5. העבר למסד נתונים אמיתי (PostgreSQL/MongoDB)
6. הגדר monitoring ו-alerting
7. הגדר firewall rules

---

## 📚 תלויות עיקריות

- `express` - Web framework
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT tokens
- `helmet` - Security headers
- `cors` - CORS support
- `express-rate-limit` - Rate limiting
- `winston` - Logging
- `node-forge` - Cryptographic utilities

---

**גרסה:** 1.0.0  
**תאריך עדכון:** 2025-12-27

