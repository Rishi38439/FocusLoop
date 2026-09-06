# trakloop

A modern activity and momentum tracking full-stack application built with Next.js, featuring real-time analytics, production-grade authentication with secure password storage, session management, and a beautiful dark-themed interface.

## Features

### Authentication & Security
- **Secure Password Hashing**: Passwords are never stored in plain text. Hashed on the backend using `bcryptjs` (12 rounds) with unique cryptographic salts.
- **Cryptographic Session Security**: Session tokens are cryptographically signed with HMAC-SHA256 and verified via Next.js authentication middleware.
- **Database Hardening**: MongoDB stores only the SHA-256 hash of session tokens with automatic TTL expiration and revocation support. Sensitive fields (`passwordHash`, `jwtSecret`) are never exposed.
- **Brute-Force & Rate Limiting**: Intelligent rate limiting for register and login endpoints with exponential backoff and `Retry-After` headers.
- **NoSQL Injection & CSRF Protection**: Strict Zod schema validation, origin verification, and HttpOnly/SameSite secure cookies.

### Activity Tracking
- **Comprehensive Logging**: Track activities with names, durations, timestamps, and optional notes.
- **User-Isolated Storage**: Each user's data is fully isolated to their authenticated account.
- **Real-time Analytics**: Instant activity logging and immediate reflection in visual charts.

### Analytics & Visualization
- **Interactive Charts**: Dynamic visualizations showing activity trends and patterns over time.
- **Statistical Insights**: Comprehensive metrics including total activities, duration averages, and frequency analysis.
- **Time-based Analysis**: View activities by weekly, monthly, or yearly time ranges.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB with official driver
- **Authentication**: bcryptjs, crypto HMAC signatures, HttpOnly cookies, Next.js Middleware
- **Validation**: Zod schema validation
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm package manager
- MongoDB instance (local or MongoDB Atlas)

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Configure environment variables in `.env.local`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=trakloop

# Generate with: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
JWT_SECRET=<your-random-32-byte-secret>
SESSION_SECRET=<your-random-32-byte-secret>
APP_URL=http://localhost:3000
SMS_PROVIDER=console
```

### Installation & Running

1. Install dependencies:
```bash
pnpm install
```

2. Run type check:
```bash
pnpm typecheck
```

3. Start development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

- `POST /api/auth/register` - Create account with validated name, email, and strong password
- `POST /api/auth/login` - Authenticate with credentials and receive HttpOnly session cookie
- `POST /api/auth/register-phone` - Send OTP for phone registration
- `POST /api/auth/verify-phone-otp` - Verify OTP and create the phone account
- `POST /api/auth/login-phone` - Send OTP for phone login
- `POST /api/auth/verify-login` - Verify OTP and phone login code
- `POST /api/auth/regenerate-code` - Regenerate a login code after OTP confirmation
- `POST /api/auth/logout` - Invalidate session in database and clear session cookie
- `GET  /api/auth/me` - Retrieve authenticated user profile (`id`, `name`, `email`)
- `POST /api/activity-log` - Log activity (Protected via middleware & session)
- `POST /api/activity-delete` - Delete activity (Protected via middleware & session)

## Build & Production

```bash
pnpm build
pnpm start
```

For Netlify, configure the production variables listed in [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md), especially `APP_URL=https://trackloop.netlify.app`, then redeploy the site. The deployed build must include the origin-validation changes in `proxy.ts` and `lib/auth.ts`.

## License

MIT
