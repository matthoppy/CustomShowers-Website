# 🚀 Quick Deploy Guide - Custom Showers Website

Everything you need to deploy in 5 minutes!

---

## Prerequisites

1. **Install Supabase CLI** (if not installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link to your project**:
   ```bash
   supabase link --project-ref plprhxtkpwklrgqaoxyj
   ```

---

## Step 1: Deploy Supabase (2 minutes)

Run the deployment script:

```bash
./deploy-supabase.sh
```

This sets all secrets and deploys 4 Edge Functions.

**Expected output:**
```
✅ Secrets set
✅ Edge Functions deployed!
```

---

## Step 2: Configure Stripe Webhook (1 minute)

1. Go to: https://dashboard.stripe.com/test/webhooks

2. Click **"Add endpoint"**

3. Enter:
   - **Endpoint URL**: `https://plprhxtkpwklrgqaoxyj.supabase.co/functions/v1/stripe-webhook`
   - **Events**: Select `checkout.session.completed`

4. Click **"Add endpoint"**

5. Click on your new webhook → Click **"Reveal"** next to Signing secret

6. Copy the secret (starts with `whsec_`) and run:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

---

## Step 3: Deploy to Netlify (2 minutes)

### Option A: Netlify Dashboard (Easiest)

1. Go to: https://app.netlify.com

2. Click **"Add new site"** → **"Import an existing project"**

3. Connect to **GitHub** → Select **`matthoppy/CustomShowers-Website`**

4. Branch: `claude/add-project-preview-kHbt6`

5. Build settings (auto-detected):
   - Build command: `npm run build`
   - Publish directory: `dist`

6. Click **"Show advanced"** → **"New variable"** (add these 2):

   **Variable 1:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://plprhxtkpwklrgqaoxyj.supabase.co`

   **Variable 2:**
   - Key: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscHJoeHRrcHdrbHJncWFveHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDI5NDgsImV4cCI6MjA4MjAxODk0OH0.b0mZfY7zBzyhD6bqU4HdHXqSNUsejO1Ij5FaJ5fJCbo`

7. Click **"Deploy site"**

8. Wait 2-3 minutes... ☕

9. Your site is live at: `https://your-site-name.netlify.app` 🎉

### Option B: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

## 🧪 Test Your Deployment

### Test Customer Flow (5 minutes)

1. **Go to Designer**: `https://your-site.netlify.app/designer`
   - Select a shower template (e.g., "Alcove")
   - Choose glass type (e.g., "Clear")
   - Choose hardware finish (e.g., "Chrome")
   - Choose handle (e.g., "8 inch Circular")
   - Enter measurements (e.g., all 2000mm)
   - Click **"Request Final Quote"**

2. **Enter your email** and submit

3. **Check your email** - you should receive a quote email within 1 minute

4. **Click the link** in the email

5. **Click "Accept & Pay Now"**

6. **Enter test card**:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - Name: Your name
   - Click **"Pay"**

7. **Check email again** - you should receive order confirmation

### Test Admin Portal (2 minutes)

1. **Go to**: `https://your-site.netlify.app/admin/login`
   - Email: `admin@bfs.co.uk`
   - Password: `admin123`

2. **Dashboard** - should show:
   - 1 customer
   - 1 quote (or 0 if you accepted it)
   - 1 order (if you completed payment)

3. **Click "Quotes"** - see your quote

4. **Click "Orders"** - see your order

5. **Test editing**:
   - Click on an order
   - Change status to "In Production"
   - Add a note: "Test order"
   - Should save successfully

---

## ✅ Success Checklist

- [ ] Edge Functions deployed to Supabase
- [ ] Stripe webhook configured
- [ ] Site deployed to Netlify
- [ ] Received quote email
- [ ] Completed test payment
- [ ] Received order confirmation email
- [ ] Logged into admin portal
- [ ] Can view quotes and orders

---

## 🆘 Troubleshooting

**No email received?**
- Check spam folder
- Check Resend Dashboard → Logs: https://resend.com/emails
- Check Supabase logs: `supabase functions logs send-quote-email`

**Payment not working?**
- Verify Stripe webhook is configured
- Check Stripe Dashboard → Events
- Check webhook signing secret is set

**Build errors?**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Need more help?**
- See `DEPLOYMENT.md` for detailed troubleshooting
- Check Netlify deploy logs
- Check Supabase function logs

---

## 🎉 You're Live!

Share your site URL and start testing!

**Useful Links:**
- Your site: `https://your-site-name.netlify.app`
- Netlify dashboard: https://app.netlify.com
- Supabase dashboard: https://plprhxtkpwklrgqaoxyj.supabase.co
- Stripe dashboard: https://dashboard.stripe.com/test
- Resend dashboard: https://resend.com/emails

**Next Steps:**
1. Test all workflows thoroughly
2. Gather feedback
3. Make any needed changes
4. Prepare for production launch (see security checklist in DEPLOYMENT.md)
