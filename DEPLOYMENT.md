# SoundsGood Software - Deployment Guide

This guide covers deploying the application and ensuring all features work in production.

---

## Environment Variables

### Required for Production

Add these to your Vercel project settings (Settings → Environment Variables):

```bash
# Database
DATABASE_URL="postgresql://..."          # Your Neon connection string

# Authentication
BETTER_AUTH_SECRET="..."                  # Generate: openssl rand -base64 32
BETTER_AUTH_URL="https://yourdomain.com"  # Production domain (no trailing slash)

# App URL (used for invitation links)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxx"          # From resend.com dashboard

# File Storage (Cloudflare R2)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="soundsgood-uploads"
R2_PUBLIC_URL="https://your-bucket.r2.dev"
```

### Optional

```bash
# Custom email "from" address (requires verified domain in Resend)
EMAIL_FROM="SoundsGood Software <noreply@soundsgoodapps.com>"
```

---

## Email Setup (Resend)

For invitation emails to work in production:

### 1. Create Resend Account
1. Go to [resend.com](https://resend.com) and sign up
2. Navigate to API Keys section
3. Create a new API key
4. Add it to Vercel as `RESEND_API_KEY`

### 2. Verify Your Domain (Recommended)
Without domain verification, you can only send emails to yourself (for testing).

1. In Resend dashboard, go to Domains
2. Click "Add Domain"
3. Add your domain (e.g., `soundsgoodapps.com`)
4. Add the DNS records Resend provides:
   - SPF record (TXT)
   - DKIM records (TXT)
5. Wait for verification (usually a few minutes)

### 3. Test Email Sending
After setup, test by sending an invitation from the admin panel:
- If domain is verified: Email will be delivered to any address
- If not verified: Email only works for addresses on your Resend account

---

## Invitation Flow

The invitation flow works as follows:

1. **Admin creates invitation** (`/api/invitations` POST)
   - Invitation saved to database with token
   - Email sent via Resend with invite link

2. **Recipient clicks link** (`/accept-invite?token=xxx`)
   - Token validated against database
   - User creates account with email/password
   - User assigned to organization and project

3. **User signs in**
   - Redirected to dashboard
   - Can view roadmap, project status, upload photos, etc.

### Invitation Link Format
```
https://yourdomain.com/accept-invite?token=<secure-token>
```

The `NEXT_PUBLIC_APP_URL` env var determines the base URL.

---

## Pre-Deployment Checklist

### Vercel Settings
- [ ] Framework Preset: Next.js
- [ ] Root Directory: `apps/web`
- [ ] Build Command: `pnpm build` (uses Turborepo)
- [ ] Install Command: `pnpm install`

### Environment Variables
- [ ] `DATABASE_URL` - Neon PostgreSQL connection string
- [ ] `BETTER_AUTH_SECRET` - Random 32+ character secret
- [ ] `BETTER_AUTH_URL` - Production domain
- [ ] `NEXT_PUBLIC_APP_URL` - Production domain
- [ ] `RESEND_API_KEY` - From Resend dashboard
- [ ] `R2_*` variables - Cloudflare R2 credentials

### Email
- [ ] Resend account created
- [ ] API key generated and added to Vercel
- [ ] Domain verified in Resend (for sending to any email)

### Database
- [ ] Neon project created
- [ ] Schema pushed (`pnpm db:push`)
- [ ] Admin user created
- [ ] Demo user created (optional)

### R2 Storage
- [ ] Bucket created in Cloudflare
- [ ] CORS configured for production domain
- [ ] Public access enabled (or signed URLs configured)

---

## Testing on Production

### Test Invitation Flow
1. Log in as admin
2. Go to Clients page
3. Create a new invitation with a test email
4. Check that email is received
5. Click invite link and complete signup
6. Verify user can access their portal

### Test with Real Client (Vetted Trainers)
1. Create invitation for Youseff's email
2. Select "Vetted Trainers" project
3. Set brand colors if needed
4. Preview email
5. Send invitation

---

## Troubleshooting

### Emails Not Sending
1. Check `RESEND_API_KEY` is set in Vercel
2. Check Resend dashboard for delivery logs
3. If sending to external addresses fails, verify your domain

### Invitation Links Don't Work
1. Check `NEXT_PUBLIC_APP_URL` matches your production domain
2. Ensure no trailing slash in the URL
3. Check token hasn't expired (7 day expiry)

### Auth Issues
1. Verify `BETTER_AUTH_URL` matches production domain exactly
2. Check `BETTER_AUTH_SECRET` is set
3. Clear cookies and try again

### CORS Errors on Uploads
1. Add production domain to R2 bucket CORS settings
2. Include both `https://yourdomain.com` and `https://www.yourdomain.com`

---

## Quick Commands

```bash
# Deploy (automatic via Vercel Git integration)
git push origin main

# Check build logs
vercel logs

# Run database migrations
pnpm dotenv -e apps/web/.env.local -- drizzle-kit push

# View database
pnpm dotenv -e apps/web/.env.local -- drizzle-kit studio
```

---

*Last updated: December 5, 2024*

