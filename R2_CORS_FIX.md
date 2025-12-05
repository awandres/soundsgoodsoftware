# Fix R2 CORS Error

## Problem
Browser is blocking uploads to R2 because CORS (Cross-Origin Resource Sharing) isn't configured.

## Solution: Configure CORS on Your R2 Bucket

### Option 1: Using Cloudflare Dashboard (Recommended)

**Unfortunately**, Cloudflare's R2 dashboard doesn't have a CORS configuration UI yet. You need to use the API.

### Option 2: Using Cloudflare API (Required)

I'll provide you with a script to configure CORS automatically.

---

## Quick Fix Script

Run this command to configure CORS for your bucket:

```bash
curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/r2/buckets/soundsgood-uploads/cors" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "corsRules": [
      {
        "allowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
        "allowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "allowedHeaders": ["*"],
        "exposeHeaders": ["ETag"],
        "maxAgeSeconds": 3600
      }
    ]
  }'
```

**Replace:**
- `{ACCOUNT_ID}` - Your R2 account ID
- `{API_TOKEN}` - You need a Cloudflare API token (from cloudflare.com/profile/api-tokens)

---

## OR: Easier Alternative - Use Server-Side Upload

Instead of uploading directly from the browser to R2, we can route uploads through your Next.js server. This avoids CORS entirely.

**Would you like me to implement server-side uploads instead?** It's simpler and will work immediately without CORS configuration.

The trade-off:
- ✅ **Server-side**: No CORS issues, works immediately, but uses your server bandwidth
- ✅ **Direct to R2**: Faster, no server bandwidth, but requires CORS setup

Let me know which approach you prefer!




