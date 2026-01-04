# BFS Website - Deployment Guide

Complete step-by-step guide to deploy the BFS Website to production.

## ✅ What You Have

- ✅ Supabase project: `https://plprhxtkpwklrgqaoxyj.supabase.co`
- ✅ Database migrations: Already run
- ✅ Stripe test account with API keys
- ✅ All keys collected

---

## 🚀 Step 1: Deploy Supabase Edge Functions

### Set Your Resend API Key First

```bash
# Replace with your actual Resend API key
supabase secrets set RESEND_API_KEY=re_your_actual_key_here
```

### Run the Deployment Script

```bash
./deploy-supabase.sh
```

This will:
- Set all Stripe secrets
- Set Supabase URL and service role key
- Deploy all 4 Edge Functions:
  - `send-quote-email`
  - `send-order-confirmation`
  - `create-checkout-session`
  - `stripe-webhook`

**Expected output:**
```
✅ Secrets set
✅ Edge Functions deployed!
```

---

## 🔌 Step 2: Configure Stripe Webhook

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/test/webhooks

2. **Click "Add endpoint"**

3. **Enter webhook URL:**
   ```
   https://plprhxtkpwklrgqaoxyj.supabase.co/functions/v1/stripe-webhook
   ```

4. **Select events to listen to:**
   - Click "Select events"
   - Search for and select: `checkout.session.completed`
   - Click "Add events"

5. **Click "Add endpoint"**

6. **Copy the Webhook Signing Secret:**
   - Click on the webhook you just created
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_`)

7. **Set the webhook secret in Supabase:**
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_copied_secret
   ```

---

## 🌐 Step 3: Deploy to Netlify

### Option A: Via Netlify Dashboard (Recommended)

1. **Go to Netlify:** https://app.netlify.com

2. **Click "Add new site" → "Import an existing project"**

3. **Connect to GitHub:**
   - Select your GitHub account
   - Choose repository: `matthoppy/BFS-Website`
   - Branch: `claude/add-project-preview-kHbt6`

4. **Build settings** (auto-detected from netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click "Show advanced" → "New variable"

5. **Add Environment Variables:**

   Click "New variable" twice and add:

   **Variable 1:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://plprhxtkpwklrgqaoxyj.supabase.co`

   **Variable 2:**
   - Key: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscHJoeHRrcHdrbHJncWFveHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDI5NDgsImV4cCI6MjA4MjAxODk0OH0.b0mZfY7zBzyhD6bqU4HdHXqSNUsejO1Ij5FaJ5fJCbo`

6. **Click "Deploy site"**

7. **Wait for deployment** (2-3 minutes)

8. **Get your site URL** (e.g., `https://your-site-name.netlify.app`)

### Option B: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

---

## ✅ Step 4: Verify Deployment

### Test the Customer Journey

1. **Visit your Netlify URL**

2. **Go to Designer:** `https://your-site.netlify.app/designer`
   - Select a shower template
   - Configure options
   - Enter measurements
   - Click "Request Final Quote"
   - Enter your email

3. **Check email:**
   - Should receive quote email
   - Click the link in the email

4. **Test payment:**
   - Click "Accept & Pay Now"
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry, any CVC

5. **Check order confirmation:**
   - Should receive order confirmation email

### Test the Admin Portal

1. **Go to Admin Login:** `https://your-site.netlify.app/admin/login`
   - Email: `admin@bfs.co.uk`
   - Password: `admin123`

2. **Check Dashboard:**
   - Should see your test quote
   - Should see test order (if you completed payment)

3. **Test Quote Management:**
   - Go to Quotes
   - Click on your quote
   - Try editing pricing
   - Click "Send to Customer" (sends another email)

4. **Test Order Management:**
   - Go to Orders
   - Click on your order
   - Update status
   - Add admin notes

---

## 🔧 Troubleshooting

### Edge Functions Not Working

Check logs:
```bash
supabase functions logs send-quote-email
supabase functions logs stripe-webhook
```

### Emails Not Sending

1. Check Resend Dashboard → Logs
2. Verify API key is set: `supabase secrets list`
3. Check Edge Function logs

### Payment Not Working

1. Check Stripe webhook is configured correctly
2. View Stripe Dashboard → Developers → Events
3. Check webhook logs in Stripe
4. Verify webhook secret is set in Supabase

### Build Errors

```bash
# Clear and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 🔐 Security Checklist for Production

Before going live:

- [ ] Change admin password in Supabase database
- [ ] Use bcrypt for password hashing (currently plain text)
- [ ] Switch Stripe to live mode keys
- [ ] Verify domain in Resend for production emails
- [ ] Review all Row Level Security policies
- [ ] Add proper error logging
- [ ] Set up monitoring

---

## 📋 Quick Reference

### Your Keys (for reference)

**Supabase:**
- URL: `https://plprhxtkpwklrgqaoxyj.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (set in Netlify)

**Stripe Test Mode:**
- Publishable Key: `pk_test_51Sj5nLDO87gISe57M9lyk4SHWtMRtqgfWanPPYa7mnuI5hr4r10W4EX0zjl8tUJQ4SUJ7NgyT7Lc5Nq9Vq2gN7Yd00QtlGFe6G`
- Secret Key: Set in Supabase secrets ✅

**Test Card:**
- Card Number: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

### Useful Links

- **Netlify Dashboard:** https://app.netlify.com
- **Supabase Dashboard:** https://plprhxtkpwklrgqaoxyj.supabase.co
- **Stripe Dashboard:** https://dashboard.stripe.com/test
- **Resend Dashboard:** https://resend.com/emails

---

## 🎉 Next Steps After Deployment

1. Share the URL with stakeholders
2. Test all workflows thoroughly
3. Gather feedback
4. Implement any changes
5. Prepare for production launch

**Need help?** Check the main README.md for more details!
