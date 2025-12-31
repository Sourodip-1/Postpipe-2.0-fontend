# Authentication CLI (`create-postpipe-auth`) 🔐

The `create-postpipe-auth` tool is the robust solution for adding a production-ready authentication system to your Next.js application.

## Installation

```bash
npx create-postpipe-auth
```

## What It Generates

This tool scans your project and installs a complete auth suite.

### Backend (`src/lib/auth/`)

- **Server Actions**: Secure, server-side logic for Login, Signup, Verification, and Password Reset.
- **Zod Schemas**: Validation schemas for all inputs.
- **Session Management**: JWT-based stateless session handling.
- **Utilities**: Helpers for password hashing and token generation.

### Database

- **User Model**: A Mongoose schema (`lib/models/User.ts`) pre-configured with fields for:
  - Email/Password
  - Verification Status
  - Role Management
  - OAuth Profiles (extensible)

### Frontend Pages

The tool creates fully styled (Tailwind/Shadcn) pages in your `app` directory:

- `/login` - `LoginPage.tsx`
- `/signup` - `SignupPage.tsx`
- `/verify-email` - `VerifyEmailPage.tsx`
- `/reset-password` - `ResetPasswordPage.tsx`
- `/forgot-password` - `ForgotPasswordPage.tsx`

## Configuration Requirements

After running the tool, you must ensure your `.env` file has the following:

```env
# Database
DATABASE_URI=mongodb+srv://...

# Security
JWT_SECRET=your_super_secret_key_at_least_32_chars

# Email (Resend)
RESEND_API_KEY=re_123...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Customization

The generated code is **yours**. There is no hidden "auth library" black box. You can modify the `User` model, change the Zod schemas, or restyle the pages as you see fit.
