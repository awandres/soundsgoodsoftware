# Cloudflare R2 Setup Guide

## Step 1: Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2 Object Storage** in the left sidebar
3. Click **Create bucket**
4. Bucket name: `soundsgood-uploads` (or your preference)
5. Location: Choose closest to your users (e.g., North America)
6. Click **Create bucket**

## Step 2: Create API Token

1. In the R2 section (left sidebar), click **Manage R2 API Tokens**
2. Click **Create API token** button (blue button in top right)
3. You'll see the "Create API token" form:

   **Token name:** `soundsgood-app-token` (or any name you prefer)

   **Permissions:** Select **Admin Read & Write** (from the dropdown)

   - This is the option that gives you full read/write access
   - Other options are "Admin Read only" or custom permissions

   **Specify bucket(s):** Choose one:

   - **Apply to all buckets in this account** (recommended for simplicity)
   - OR **Apply to specific buckets only** → Select `soundsgood-uploads`

   **TTL (Time to Live):** Leave as default (Forever) or set an expiration

4. Click **Create API Token**

5. **IMPORTANT - SAVE THESE NOW** (you won't see them again!):

   You'll see a screen with:

   - **Access Key ID** - Copy this (looks like: `abc123def456...`)
   - **Secret Access Key** - Copy this (looks like: `xyz789abc...`)
   - You'll also see a section showing the **endpoint URL for S3 clients**

   The endpoint format is: `https://<account_id>.r2.cloudflarestorage.com`

   Your **Account ID** is also shown on this screen (you'll need it for the env vars)

## Step 3: Enable Public Access (Recommended for Photos)

To make uploaded photos publicly accessible (so they display on your site):

1. In R2 dashboard, click on your **soundsgood-uploads** bucket name
2. Click the **Settings** tab (at the top of the page)
3. Scroll down to the **Public access** section
4. Click the **Allow Access** button
   - This enables the R2.dev subdomain (free and easiest option)
   - You'll get a URL like: `https://pub-abc123xyz789.r2.dev`
5. **Copy the Public bucket URL** - you'll use this as `R2_PUBLIC_URL`

**Alternative:** If you want to use a custom domain instead of R2.dev, click **Connect Domain** and follow the wizard (requires DNS configuration).

## Step 4: Configure CORS (Required for Browser Uploads)

⚠️ **CRITICAL**: This step is required for uploads to work from the browser!

1. In R2 dashboard, click on your **soundsgood-uploads** bucket name
2. Click the **Settings** tab
3. Scroll down to find **CORS Policy** section
4. Click **Add CORS policy** (or Edit if one exists)
5. Paste this JSON configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://yourdomain.com"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

6. Click **Save**

**Note:** Replace `https://yourdomain.com` with your production domain when you deploy. For development, `http://localhost:3000` is what matters.

## Step 5: Add to Environment Variables

Edit the file: `/apps/web/.env.local` and update the R2 section with your credentials:

```bash
# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"                    # From Step 2 (shown when you created the token)
R2_ACCESS_KEY_ID="your-access-key-id"              # From Step 2 (Access Key ID)
R2_SECRET_ACCESS_KEY="your-secret-access-key"      # From Step 2 (Secret Access Key)
R2_BUCKET_NAME="soundsgood-uploads"                # Your bucket name
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"  # Replace 'your-account-id'
R2_PUBLIC_URL="https://pub-abc123xyz.r2.dev"       # From Step 3 (Public bucket URL)
```

**Example with actual values:**

```bash
R2_ACCOUNT_ID="a1b2c3d4e5f6g7h8"
R2_ACCESS_KEY_ID="abc123def456ghi789jkl012"
R2_SECRET_ACCESS_KEY="XyZ789SecretKeyHere123456"
R2_BUCKET_NAME="soundsgood-uploads"
R2_ENDPOINT="https://a1b2c3d4e5f6g7h8.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://pub-12345abcdef67890.r2.dev"
```

## Step 6: Restart the Dev Server

After adding your credentials, restart the server to pick up the new environment variables:

```bash
# Kill the current server (Ctrl+C in the terminal)
# Or use this command:
cd /Users/alexwandres/claudecode/soundsgoodsoftware
pnpm dev --filter @soundsgood/web
```

The server will start on: **http://localhost:3000**

## Step 7: Test Photo Upload! 🎉

1. Go to **http://localhost:3000/login**
2. Login with: `client@vettedtrainers.com` / `client123`
3. Click **Photos** in the sidebar
4. **Drag & drop** an image file
5. Select a category (Trainer, Facility, etc.)
6. Watch it upload to R2!
7. The photo should appear in your gallery immediately

---

## ✅ All Set!

Everything is already built and ready to go. Once you add those 6 environment variables, configure CORS, and restart, photo uploads will work automatically!

**Need help?** The code is already in place:

- Upload API: `/apps/web/src/app/api/upload/route.ts`
- Photos API: `/apps/web/src/app/api/photos/route.ts`
- R2 Client: `/apps/web/src/lib/r2.ts`
- Upload UI: `/apps/web/src/app/(portal)/photos/page.tsx`

---

## Troubleshooting

### "Failed to upload" or CORS errors in browser console

1. Make sure you completed **Step 4** (CORS configuration)
2. Verify `http://localhost:3000` is in your CORS AllowedOrigins
3. Try opening your browser's Network tab to see the actual error

### "Access Denied" or 403 errors

1. Check your API token has **Admin Read & Write** permission
2. Verify the bucket name in your `.env.local` matches exactly
3. Make sure the token applies to your bucket (not a different one)

### Images don't display after upload

1. Make sure you completed **Step 3** (Enable Public Access)
2. Verify `R2_PUBLIC_URL` is set correctly in `.env.local`
3. The URL should look like `https://pub-xxxxx.r2.dev`
