# Email Verification Setup Guide

This guide walks through setting up and integrating the email verification system using Inbound.

## 📋 Prerequisites

- Inbound account (sign up at https://inbound.new)
- Verified sending domain
- Convex deployed with updated schema

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Get Inbound API Key

1. Go to https://inbound.new/logs
2. Click on your profile → API Keys
3. Create a new API key
4. Copy the API key

### Step 2: Add Environment Variables

Add to `.env.local` (development) and production environment:

```env
INBOUND_API_KEY=your_api_key_here
INBOUND_WEBHOOK_URL=https://yourdomain.com/api/email/verify-webhook
```

### Step 3: Update Sender Email

Edit `src/lib/email.ts`:

```typescript
// Replace line 31 and 120:
from: 'ZapDev <noreply@yourdomain.com>'

// With your verified domain:
from: 'ZapDev <noreply@your-verified-domain.com>'
```

### Step 4: Deploy Convex Schema

```bash
bun run convex:deploy
```

This creates the `emailVerifications` table.

### Step 5: Test Locally

```bash
# Terminal 1: Start Convex
bun run convex:dev

# Terminal 2: Start Next.js
bun run dev
```

---

## 🔧 Full Integration Steps

### 1. Integrate with Sign-Up Flow

Update `src/lib/auth-adapter-convex.ts` to send verification emails on sign-up:

```typescript
import { generateVerificationToken, sendVerificationEmail } from "@/lib/email";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

// In createUser method, after user creation:
async createUser(user: {
  email: string;
  name?: string;
  image?: string;
  emailVerified?: boolean;
}) {
  try {
    // Create user with emailVerified = false
    const userId = await fetchMutation(api.users.createOrUpdate, {
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: false, // Always start unverified
    });

    // Generate verification token
    const token = generateVerificationToken();
    
    // Store verification token
    await fetchMutation(api.emailVerifications.create, {
      userId,
      email: user.email,
      token,
    });

    // Send verification email
    try {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        token,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't block user creation if email fails
    }

    return this.getUser(userId);
  } catch (error) {
    console.error("Failed to create user:", error);
    throw error;
  }
}
```

### 2. (Optional) Enforce Email Verification

Update `src/middleware.ts` to require verified email for certain routes:

```typescript
// After session validation, add:
const user = await fetchQuery(api.users.getById, { userId: session.userId });

// Require verification for dashboard and projects
if (!user?.emailVerified && (
  pathname.startsWith("/dashboard") || 
  pathname.startsWith("/projects")
)) {
  const verifyUrl = new URL("/email-verification-required", request.url);
  verifyUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(verifyUrl);
}
```

Create the verification required page at `src/app/email-verification-required/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MailCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EmailVerificationRequired() {
  const [sending, setSending] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleResend = async () => {
    setSending(true);
    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@email.com" }), // Get from session/user
      });

      if (response.ok) {
        toast.success("Verification email sent!");
      } else {
        toast.error("Failed to send email");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <MailCheck className="w-16 h-16 mx-auto mb-4 text-primary" />
        <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please verify your email address to access this feature. Check your inbox for the verification link.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={handleResend} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Resend Verification Email"
            )}
          </Button>
          <Button variant="outline" onClick={() => router.push("/sign-out")}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 3. Add Success Message After Sign-Up

Update sign-up flow to show verification message:

```typescript
// In auth popup or sign-up page, after successful sign-up:
toast.info("Account created! Please check your email to verify your address.", {
  duration: 5000,
});
```

---

## 🧪 Testing

### Test Email Sending

```typescript
// Test script: test-email.ts
import { sendVerificationEmail, generateVerificationToken } from "./src/lib/email";

const token = generateVerificationToken();
await sendVerificationEmail({
  email: "your-test-email@example.com",
  name: "Test User",
  token,
});

console.log("Test email sent!");
console.log("Verification URL:", `http://localhost:3000/verify-email?token=${token}`);
```

Run: `bun run test-email.ts`

### Test Verification Flow

1. Sign up with a new email
2. Check inbox for verification email
3. Click verification link
4. Verify redirect to dashboard
5. Check that user.emailVerified = true in Convex

### Test Resend Flow

1. Request new verification email from API
2. Check inbox for second email
3. Old token should still work (no invalidation by default)
4. Optional: Add token invalidation on resend

---

## 📧 Email Customization

### Customize Email Template

Edit `src/lib/email.ts` to customize:
- Subject line
- Email body HTML
- Email body text
- Logo/branding
- Colors
- CTA button text

### Add Your Logo

```typescript
// In email HTML:
<img src="https://yourdomain.com/logo.png" alt="ZapDev" style="width: 120px;" />
```

### Customize Colors

Current: Purple gradient (#6C47FF)
Update in email HTML template in `sendVerificationEmail()` function.

---

## 🔒 Security Considerations

### Token Expiration

Tokens expire after 24 hours (default). Adjust in `convex/emailVerifications.ts`:

```typescript
const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
// Change to: Date.now() + 1 * 60 * 60 * 1000; // 1 hour
```

### Rate Limiting

The resend verification endpoint uses strict rate limiting:
- 3 requests per 5 minutes per IP
- Defined in `src/app/api/resend-verification/route.ts`

### Token Security

- Tokens are 32-character random strings (nanoid)
- Stored in Convex database only
- Not logged or exposed in URLs (except verification link)
- One-time use recommended (mark as verified after use)

---

## 🐛 Troubleshooting

### Email Not Sending

**Check:**
1. `INBOUND_API_KEY` is set correctly
2. Sender domain is verified in Inbound dashboard
3. Check Inbound logs: https://inbound.new/logs
4. Check console for error messages

**Common Issues:**
- Unverified sending domain → Verify in Inbound dashboard
- Invalid API key → Regenerate in Inbound dashboard
- Rate limit exceeded → Wait and retry

### Verification Link Not Working

**Check:**
1. Token exists in `emailVerifications` table
2. Token hasn't expired (check `expiresAt` field)
3. Token hasn't been used already (check `verified` field)
4. URL is correctly formatted

### Database Errors

**Check:**
1. Convex schema is deployed: `bun run convex:deploy`
2. `emailVerifications` table exists in Convex dashboard
3. Indexes are created (automatic with schema deployment)

---

## 📊 Monitoring

### Track Verification Rates

Query Convex to see verification rates:

```typescript
// In Convex dashboard or custom query:
const total = await db.query("emailVerifications").collect();
const verified = total.filter(v => v.verified);
const rate = (verified.length / total.length) * 100;
console.log(`Verification rate: ${rate}%`);
```

### Monitor Email Sending

- Check Inbound dashboard for delivery rates
- Monitor bounces and failures
- Track click rates on verification links

### Set Up Alerts

- Alert on high failure rate
- Alert on low verification rate
- Monitor for abuse (too many resend requests)

---

## 🔄 Migration from Existing System

If you have existing users without email verification:

### Option 1: Grandfather Existing Users

Mark all existing users as verified:

```typescript
// Run once in Convex dashboard or migration script
const users = await db.query("users").collect();
for (const user of users) {
  await db.patch(user._id, { emailVerified: true });
}
```

### Option 2: Force Re-verification

Send verification emails to all unverified users:

```typescript
// Migration script
const users = await db
  .query("users")
  .filter(q => q.eq(q.field("emailVerified"), false))
  .collect();

for (const user of users) {
  const token = generateVerificationToken();
  await createEmailVerification({ userId: user._id, email: user.email, token });
  await sendVerificationEmail({ email: user.email, name: user.name, token });
}
```

---

## 🎯 Best Practices

1. **Don't block sign-up on email failure** - Let users create accounts even if email fails
2. **Show clear instructions** - Tell users to check spam folder
3. **Allow resending** - Users may not receive first email
4. **Set reasonable expiration** - 24 hours is standard
5. **Monitor and alert** - Track verification rates and issues
6. **Test thoroughly** - Test with multiple email providers
7. **Have fallback** - Support team should be able to manually verify

---

## 📞 Support

- **Inbound Support**: support@inbound.new
- **Inbound Docs**: https://docs.inbound.new
- **GitHub Issues**: (your repo issues link)

---

**Last Updated**: November 11, 2025
**Status**: Ready for integration
**Estimated Setup Time**: 30-60 minutes
