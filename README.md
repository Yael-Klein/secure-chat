# 🔒 SecureMsg - אפליקציית הודעות מאובטחת

אפליקציית הודעות מאובטחת עם תקשורת מוצפנת בין לקוחות מרובים. נבנה עם React (לקוח) ו-Node.js (שרת).

## ✨ תכונות

- **אימות מאובטח**: אימות username/password עם bcrypt hashing
- **הצפנה End-to-End**: RSA-OAEP להחלפת מפתחות ו-AES-GCM להצפנת הודעות
- **שידור הודעות**: Long polling לעדכונים בזמן אמת (ללא WebSockets)
- **אחסון מוצפן**: הודעות נשמרות מוצפנות בבסיס נתונים JSON
- **אבטחה**: JWT tokens, rate limiting, CORS, Helmet security headers
- **HTTPS/TLS**: תמיכה בהצפנת תעבורה
- **Scalability**: תוכנן לטפל ב-10,000+ חיבורים בו-זמנית

## Project Structure

```
secure-chat/
├── src/                    # React client application
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities (crypto, API client)
│   └── pages/             # Page components
├── server/                # Node.js server
│   ├── utils/             # Server utilities (crypto, database, logger)
│   ├── middleware/        # Express middleware
│   ├── scripts/           # Utility scripts (seed)
│   └── index.js           # Server entry point
└── README.md
```

## 🚀 Setup and Run Instructions

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)

### Step 1: Install Dependencies

**Client (root directory):**
```bash
npm install
```

**Server:**
```bash
cd server
npm install
```

### Step 2: Generate SSL Certificates (Optional - for HTTPS)

To enable HTTPS in development:

```bash
cd server
npm run generate-cert
```

This creates self-signed SSL certificates in `server/certs/` valid for 1 year.

**Note:** Browsers will show a security warning for self-signed certificates. Click "Advanced" → "Proceed to localhost".

### Step 3: Seed Database (Optional)

Create test users:

```bash
cd server
npm run seed
```

This creates 3 test users:
- `david` / `password123`
- `yael` / `password123`
- `moshe` / `password123`

### Step 4: Start the Server

**HTTP mode (development):**
```bash
cd server
npm start
```

**HTTPS mode (recommended):**
```bash
cd server
HTTPS_ENABLED=true npm start
```

The server will run on:
- HTTP: `http://localhost:3001`
- HTTPS: `https://localhost:3001`

### Step 5: Start the Client

Open a **new terminal** (keep server running):

```bash
npm run dev
```

The client will run on `http://localhost:5173` (or `https://localhost:5173` if server uses HTTPS).

### Step 6: Access the Application

1. Open your browser
2. Navigate to `http://localhost:5173` (or `https://localhost:5173`)
3. If you see a security warning (for HTTPS), click "Advanced" → "Proceed to localhost"
4. Register a new user or login with test credentials

**For detailed step-by-step guide, see [GETTING_STARTED.md](GETTING_STARTED.md)**

---

## 📚 Additional Documentation

- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Detailed step-by-step setup guide
- **[server/README.md](server/README.md)** - Server documentation (API endpoints, configuration)
- **[README_CLIENT.md](README_CLIENT.md)** - Client documentation (components, hooks, security)

## 🔐 אבטחה

### מה מוצפן?

- ✅ **תעבורה** - HTTPS/TLS (אם מופעל)
- ✅ **הודעות** - RSA + AES (end-to-end)
- ✅ **סיסמאות** - bcrypt hashing
- ✅ **מפתחות פרטיים** - IndexedDB (מאובטח יותר מ-localStorage)

### איך להפעיל HTTPS?

1. צור תעודות SSL:
   ```bash
   cd server
   npm run generate-cert
   ```

2. הפעל עם HTTPS:
   ```bash
   $env:HTTPS_ENABLED="true"
   npm start
   ```

3. בדפדפן: לחץ "Advanced" → "Proceed to localhost"

## 🔧 Design Choices

### Encryption Algorithms

#### Asymmetric Encryption: RSA-OAEP (2048-bit)
- **Purpose**: Encrypting AES keys for secure key exchange
- **Algorithm**: RSA-OAEP with SHA-256
- **Key Size**: 2048 bits
- **Library**: Web Crypto API (client), node-forge (server)
- **Why**: Industry-standard for secure key exchange, provides forward secrecy

#### Symmetric Encryption: AES-GCM (256-bit)
- **Purpose**: Encrypting message content
- **Algorithm**: AES-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits
- **Library**: Web Crypto API (client)
- **Why**: Fast, authenticated encryption, prevents tampering

#### Hybrid Encryption Approach
- **How it works**:
  1. Generate random AES key for each message
  2. Encrypt message content with AES key
  3. Encrypt AES key with recipient's RSA public key
  4. Send both encrypted content and encrypted key
- **Benefits**: Combines speed of symmetric encryption with security of asymmetric encryption

### Authentication & Security

#### Password Hashing: bcrypt
- **Library**: `bcrypt` (Node.js)
- **Rounds**: 10 (configurable)
- **Why**: Industry-standard, slow by design (resistant to brute force)

#### Token Authentication: JWT
- **Library**: `jsonwebtoken`
- **Expiry**: 7 days
- **Storage**: localStorage (client), database sessions (server)
- **Why**: Stateless, scalable, widely supported

#### Private Key Storage: IndexedDB
- **Why not localStorage**: IndexedDB is more secure against XSS attacks
- **Migration**: Automatic migration from localStorage for existing users
- **Why**: Better security isolation, not accessible via simple XSS

### Frameworks & Libraries

#### Client-Side (React)
- **React 18+**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **React Router DOM**: Client-side routing
- **TanStack Query**: Data fetching and caching
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn-ui**: UI component library
- **Web Crypto API**: Cryptographic operations (native browser API)

#### Server-Side (Node.js)
- **Express.js**: Web framework
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token generation/verification
- **node-forge**: Cryptographic utilities (RSA key operations)
- **helmet**: Security headers middleware
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: Rate limiting middleware
- **winston**: Logging library

### Database

#### JSON File Storage
- **Format**: JSON file (`database.json`)
- **Structure**: Users, Messages, Sessions
- **Encryption**: Messages encrypted at rest
- **Why**: Simple for development, easy to migrate to proper database
- **Limitation**: Not suitable for production at scale

### Communication

#### Long Polling (No WebSockets)
- **Method**: HTTP GET requests with extended timeout (up to 30 seconds)
- **Endpoint**: `/api/messages/poll`
- **Why**: Requirement specified no WebSockets
- **Benefits**: Works through firewalls, simpler implementation
- **Limitations**: Less efficient than WebSockets, higher latency

#### HTTPS/TLS
- **Support**: Optional (can run in HTTP or HTTPS mode)
- **Certificates**: Self-signed for development, real certificates for production
- **Why**: Encrypts all traffic between client and server

---

## ⚖️ Trade-offs and Limitations

### Current Limitations

#### 1. JSON File Database
- **Issue**: File-based storage doesn't scale well for production
- **Impact**: 
  - Single file can become bottleneck with many concurrent writes
  - No indexing or query optimization
  - Risk of data corruption with concurrent access
- **Solution**: Migrate to PostgreSQL/MongoDB for production with proper indexing

#### 2. Single Server Architecture
- **Issue**: No clustering or load balancing
- **Impact**: 
  - Single point of failure
  - Limited horizontal scaling
- **Solution**: Use PM2 cluster mode, Kubernetes, or load balancer with multiple instances

#### 3. Long Polling vs WebSockets
- **Issue**: Long polling is less efficient than WebSockets
- **Impact**:
  - Higher latency (up to 30 seconds)
  - More HTTP overhead
  - Less real-time feel
- **Trade-off**: Required by specification (no WebSockets allowed)
- **Mitigation**: 30-second polling window reduces request frequency

#### 4. Self-Signed Certificates (Development)
- **Issue**: Browsers show security warnings
- **Impact**: Poor user experience, requires manual acceptance
- **Solution**: Use real certificates (Let's Encrypt) in production

#### 5. No Message Queue
- **Issue**: Long polling doesn't guarantee message delivery
- **Impact**: 
  - Messages might be lost if client disconnects during polling
  - No retry mechanism
- **Solution**: Implement message queue (Redis/RabbitMQ) for reliability

#### 6. Client-Side Key Generation
- **Issue**: If private key is lost, messages cannot be decrypted
- **Impact**: Permanent data loss
- **Mitigation**: IndexedDB storage reduces risk, but not foolproof
- **Future**: Consider key backup/recovery mechanism

### Performance Considerations

#### 10,000 Concurrent Connections
The server is designed to handle **10,000+ concurrent connections** through:

- **Node.js Event Loop**: Non-blocking I/O allows handling many connections efficiently
- **Long Polling**: Reduces request frequency (30-second intervals instead of constant polling)
- **Asynchronous Operations**: All database and crypto operations are async
- **No Blocking Operations**: Server remains responsive under load

**Important**: This means 10,000 different clients (browsers, devices, network connections), NOT 10,000 users in the same browser. Each browser tab/window is typically one connection.

**Testing**: 
- Test with multiple browser tabs/windows (each is one connection)
- For large-scale testing, use load testing tools (Apache Bench, Artillery, k6)
- Use multiple devices/browsers simultaneously

#### Database Bottleneck
- **Issue**: JSON file may become bottleneck at high scale
- **Impact**: Slower response times with many concurrent users
- **Solution**: Migrate to proper database (PostgreSQL/MongoDB) with indexing

### Security Trade-offs

#### IndexedDB vs Server-Side Key Storage
- **Current**: Private keys stored in IndexedDB (client-side)
- **Trade-off**: 
  - ✅ Better than localStorage (more secure)
  - ❌ Still vulnerable to XSS if application is compromised
  - ❌ Keys lost if browser data is cleared
- **Alternative**: Server-side key escrow (but reduces end-to-end security)

#### Rate Limiting
- **Current**: 5 requests/15min for auth, 1000 requests/15min for general API
- **Trade-off**: 
  - ✅ Prevents brute force attacks
  - ❌ May block legitimate users under heavy load
- **Mitigation**: Separate limits for polling endpoints (3000/15min)

### Scalability Trade-offs

#### Stateless vs Stateful
- **Current**: Mostly stateless (JWT tokens)
- **Trade-off**: 
  - ✅ Easy to scale horizontally
  - ❌ Session management in database (slight overhead)
- **Future**: Consider Redis for session storage at scale

---

## 🚀 Production Deployment

1. הגדר `NODE_ENV=production`
2. הגדר `JWT_SECRET` חזק
3. הפעל HTTPS עם תעודות אמיתיות
4. השתמש ב-PM2 או process manager
5. העבר למסד נתונים אמיתי (PostgreSQL/MongoDB)
6. הגדר monitoring ו-alerting

---

## 📝 License

ISC
