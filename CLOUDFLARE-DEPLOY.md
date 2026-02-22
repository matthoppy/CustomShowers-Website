# 🚀 Cloudflare Pages Deployment Guide - BFS Website

Deploy to Cloudflare Pages with unlimited bandwidth for FREE!

---

## Why Cloudflare Pages?

- ✅ **Unlimited bandwidth** (vs 100GB on Netlify)
- ✅ **Free forever** for static sites
- ✅ **Global CDN** - Lightning fast worldwide
- ✅ **Automatic HTTPS**
- ✅ **Preview deployments** for every commit
- ✅ **Custom domains** included

---

## Prerequisites

1. **Cloudflare account** (free): https://dash.cloudflare.com/sign-up
2. **Supabase CLI installed** and **Edge Functions deployed** (see below)

---

## Step 1: Deploy Supabase Edge Functions (5 minutes)

### Install Supabase CLI (if not installed)

```bash
npm install -g supabase
```

### Login and Link

```bash
supabase login
supabase link --project-ref plprhxtkpwklrgqaoxyj
```

### Deploy Edge Functions

```bash
./deploy-supabase.sh
```

This will:
- Set all secrets (Resend, Stripe, Supabase)
- Deploy all 4 Edge Functions

**Expected output:**
```
✅ Secrets set
✅ Edge Functions deployed!
```

---

## Step 2: Configure Stripe Webhook (2 minutes)

1. **Go to Stripe Dashboard:** https://dashboard.stripe.com/test/webhooks

2. **Click "Add endpoint"**

3. **Configure webhook:**
   - **Endpoint URL**: `https://plprhxtkpwklrgqaoxyj.supabase.co/functions/v1/stripe-webhook`
   - **Events to send**: Select `checkout.session.completed`
   - Click **"Add endpoint"**

4. **Get webhook secret:**
   - Click on your new webhook
   - Click **"Reveal"** next to "Signing secret"
   - Copy the secret (starts with `whsec_`)

5. **Set in Supabase:**
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

---

## Step 3: Deploy to Cloudflare Pages (3 minutes)

### Option A: Via Cloudflare Dashboard (Recommended - Easiest!)

1. **Go to Cloudflare Dashboard:** https://dash.cloudflare.com

2. **Navigate to Pages:**
   - Click **"Workers & Pages"** in the left sidebar
   - Click **"Create application"**
   - Click **"Pages"** tab
   - Click **"Connect to Git"**

3. **Connect GitHub:**
   - Click **"Connect GitHub"**
   - Authorize Cloudflare
   - Select repository: **`matthoppy/BFS-Website`**
   - Click **"Begin setup"**

4. **Configure build:**
   - **Project name**: `bfs-website` (or your preferred name)
   - **Production branch**: `claude/add-project-preview-kHbt6`
   - **Framework preset**: Select **"Vite"** (auto-detected)
   - **Build command**: `npm run build` (auto-filled)
   - **Build output directory**: `dist` (auto-filled)

5. **Add Environment Variables:**

   Click **"Add variable"** and add these 2:

   **Variable 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://plprhxtkpwklrgqaoxyj.supabase.co`

   **Variable 2:**
   - Name: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscHJoeHRrcHdrbHJncWFveHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDI5NDgsImV4cCI6MjA4MjAxODk0OH0.b0mZfY7zBzyhD6bqU4HdHXqSNUsejO1Ij5FaJ5fJCbo`

6. **Click "Save and Deploy"**

7. **Wait 2-3 minutes...** ☕

8. **Your site is live!** 🎉
   - URL will be: `https://bfs-website.pages.dev` (or your chosen name)
   - Click the URL to visit your site!

### Option B: Via Wrangler CLI (Advanced)

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
npm run build
wrangler pages deploy dist --project-name=bfs-website
```

---

## Step 4: Test Your Deployment (5 minutes)

### Test Customer Journey

1. **Visit your Cloudflare Pages URL**: `https://bfs-website.pages.dev`

2. **Go to Designer**: Click "Design Your Shower" or visit `/designer`
   - Select template: "Alcove"
   - Glass type: "Clear"
   - Hardware: "Chrome"
   - Handle: "8 inch Circular"
   - Measurements: 2000mm for all fields
   - Click **"Request Final Quote"**

3. **Enter your email** and submit

4. **Check email** (arrives in ~1 minute)
   - Should receive quote email from Bespoke Frameless Showers
   - Click the link in email

5. **Accept quote and pay:**
   - Click **"Accept & Pay Now"**
   - Enter test card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - Click **"Pay"**

6. **Check email again** - Order confirmation should arrive

### Test Admin Portal

1. **Go to**: `https://bfs-website.pages.dev/admin/login`
   - Email: `admin@bfs.co.uk`
   - Password: `admin123`

2. **Dashboard** should show:
   - 1 Total Customer
   - Your quote (if not accepted) or order (if accepted)
   - Recent quotes list

3. **Test features:**
   - Click **"Quotes"** - see your quote
   - Click **"Orders"** - see your order
   - Edit order status to "In Production"
   - Add admin note: "Test order - looks great!"

---

## ✅ Success Checklist

- [ ] Supabase Edge Functions deployed
- [ ] Stripe webhook configured
- [ ] Site deployed to Cloudflare Pages
- [ ] Received quote email
- [ ] Completed test payment with Stripe
- [ ] Received order confirmation email
- [ ] Logged into admin portal
- [ ] Can view and manage quotes/orders

---

## 🎯 What You Get with Cloudflare Pages

### Free Tier Includes:
- ✅ **Unlimited bandwidth** (biggest advantage!)
- ✅ Unlimited requests
- ✅ 500 builds/month
- ✅ Custom domains (unlimited)
- ✅ Automatic HTTPS
- ✅ Global CDN (300+ cities)
- ✅ DDoS protection
- ✅ Preview deployments
- ✅ Automatic deployments on Git push

### Performance:
- **Global edge network** - Site loads from nearest location to your customer
- **HTTP/3 support** - Latest protocol for fastest performance
- **Brotli compression** - Smaller file sizes
- **Smart caching** - Assets cached globally

---

## 🔧 Troubleshooting

### Build Failed

**Check build logs** in Cloudflare dashboard:
- Workers & Pages → Your project → Deployments → Click failed deployment
- Look for error messages

**Common fixes:**
```bash
# Clear and rebuild locally first
rm -rf node_modules package-lock.json dist
npm install
npm run build

# If builds locally, retry Cloudflare deployment
```

### Site Deployed but Shows Errors

**Check browser console** (F12):
- Look for CORS or API errors
- Verify environment variables are set correctly

**Verify Supabase connection:**
- Go to Settings → Environment variables
- Confirm both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set

### Emails Not Sending

1. **Check Resend logs**: https://resend.com/emails
2. **Check Supabase function logs**:
   ```bash
   supabase functions logs send-quote-email
   ```
3. **Verify API key**:
   ```bash
   supabase secrets list
   ```

### Payments Not Working

1. **Check Stripe webhook**:
   - Dashboard → Developers → Webhooks
   - Verify endpoint URL is correct
   - Check "Events" tab for webhook deliveries

2. **Check webhook logs** in Stripe

3. **Verify webhook secret is set**:
   ```bash
   supabase secrets list
   ```

---

## 🚀 Custom Domain Setup (Optional)

When you're ready to use your own domain:

1. **Go to Cloudflare Pages project settings**

2. **Click "Custom domains"**

3. **Click "Set up a custom domain"**

4. **Enter your domain** (e.g., `customshowers.uk`)

5. **Follow DNS instructions**:
   - If domain is on Cloudflare: Automatic setup
   - If domain elsewhere: Add CNAME record

6. **SSL certificate** auto-provisions (takes ~5 minutes)

---

## 📊 Monitoring & Analytics

### Built-in Analytics (Free)

1. **Go to your project** in Cloudflare Pages

2. **Click "Analytics" tab**

3. **See metrics:**
   - Page views
   - Unique visitors
   - Top pages
   - Geographic distribution
   - No cookie consent needed (privacy-first)

### Enable Web Analytics (Optional - Free)

1. **Workers & Pages** → Your project

2. **Settings** → **Analytics**

3. **Click "Enable Web Analytics"**

4. Get detailed insights without tracking cookies

---

## 🎉 You're Live!

Your BFS Website is now deployed on Cloudflare's global network!

**Your site:** `https://bfs-website.pages.dev` (or your custom URL)

### What Happens Next:

✅ **Auto-deployments**: Every push to GitHub automatically deploys
✅ **Preview URLs**: Pull requests get their own preview URL
✅ **Rollbacks**: Easy rollback to previous deployments if needed
✅ **Zero maintenance**: Cloudflare handles everything

---

## 📋 Quick Reference

### Your Deployment URLs

- **Production**: `https://bfs-website.pages.dev`
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Supabase Dashboard**: https://plprhxtkpwklrgqaoxyj.supabase.co
- **Stripe Dashboard**: https://dashboard.stripe.com/test
- **Resend Dashboard**: https://resend.com/emails

### Test Credentials

**Stripe Test Card:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

**Admin Login:**
- Email: `admin@bfs.co.uk`
- Password: `admin123`

---

## 🎊 Next Steps

1. ✅ Test the complete customer journey
2. ✅ Test admin features
3. ✅ Share the URL with stakeholders
4. ✅ Gather feedback
5. ✅ Make any needed adjustments
6. ✅ Add custom domain (when ready)
7. ✅ Switch to Stripe live mode (for production)

**Need help?** Check `DEPLOYMENT.md` for more troubleshooting or ask! 🚀
