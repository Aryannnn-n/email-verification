# Email Verification Module

A production-grade Node.js email verification service with SMTP checking, DNS MX lookup, typo detection, and a beautiful web UI. Deployed on **Vercel** with **Neon PostgreSQL** for persistence.

## ✨ Features

- **Email Syntax Validation** — RFC-compliant regex with detailed error reasons
- **DNS MX Record Lookup** — Resolves and prioritizes mail exchange servers
- **SMTP Mailbox Verification** — Uses `RCPT TO` to check if a mailbox exists
- **"Did You Mean?" Typo Detection** — Levenshtein distance algorithm for common domain typos
- **Neon PostgreSQL Integration** — Stores verification history & analytics
- **Vercel Serverless API** — Production-ready REST endpoints
- **Stunning Web UI** — Glassmorphic dark-theme interface with animations

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start local dev server
npm run dev
```

## 📡 API Endpoints

### `POST /api/verify`
Verify an email address.

```json
// Request
{ "email": "user@gmail.com" }

// Response
{
  "email": "user@gmail.com",
  "result": "valid",
  "resultcode": 1,
  "subresult": "mailbox_exists",
  "domain": "gmail.com",
  "mxRecords": ["gmail-smtp-in.l.google.com"],
  "didyoumean": null,
  "executiontime": 1.23,
  "error": null,
  "timestamp": "2026-05-28T10:30:00.000Z"
}
```

### `GET /api/history`
Fetch recent verification results.

### `GET /api/history?stats=true`
Get aggregate statistics.

## 🧪 Testing

```bash
npm test              # Run all tests with coverage
npm run test:watch    # Watch mode
```

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add environment variable: `DATABASE_URL` = your Neon connection string
4. Deploy!

## 🗄️ Database Setup (Neon)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Set as `DATABASE_URL` environment variable
4. Tables are auto-created on first request

## 📁 Project Structure

```
├── api/                  # Vercel serverless functions
│   ├── verify.js         # POST /api/verify
│   └── history.js        # GET /api/history
├── src/
│   ├── index.js          # Main verifyEmail() function
│   ├── validators.js     # Email syntax validation
│   ├── dns-lookup.js     # DNS MX record resolution
│   ├── smtp-checker.js   # SMTP RCPT TO verification
│   ├── typo-detector.js  # Levenshtein "Did You Mean?"
│   └── database.js       # Neon PostgreSQL integration
├── tests/
│   └── email-verification.test.js  # 40+ test cases
├── public/
│   └── index.html        # Web UI
├── vercel.json           # Vercel deployment config
└── package.json
```
