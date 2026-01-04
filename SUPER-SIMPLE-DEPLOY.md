# 🎯 SUPER SIMPLE DEPLOYMENT GUIDE - BFS Website
## Follow these exact steps - no technical knowledge required!

---

## ⚠️ BEFORE YOU START

**You will need:**
1. Your computer (Mac or Windows)
2. GitHub account (you already have this ✅)
3. Terminal/Command Prompt on your computer
4. 30 minutes of uninterrupted time

**What we're going to do:**
1. Install tools on your computer (5 minutes)
2. Deploy backend (Supabase) (10 minutes)
3. Set up Stripe (5 minutes)
4. Deploy frontend (Cloudflare) (10 minutes)

Let's go! 🚀

---

# PART 1: SET UP YOUR COMPUTER (5 minutes)

## Step 1.1: Open Terminal

**On Mac:**
- Press `Command (⌘) + Space`
- Type "Terminal"
- Press Enter
- A black/white window will open

**On Windows:**
- Press `Windows key`
- Type "Command Prompt" or "PowerShell"
- Press Enter
- A black/blue window will open

**✅ You should now see a window with text and a blinking cursor**

---

## Step 1.2: Install Node.js (if you don't have it)

**Check if you have Node.js:**

Type this and press Enter:
```bash
node --version
```

**If you see a version number (like v18.0.0 or v20.0.0):**
- ✅ You have Node.js! Skip to Step 1.3

**If you see "command not found" or an error:**
- Go to: https://nodejs.org
- Download the LTS version (the big green button)
- Install it (just click Next, Next, Next)
- Close and reopen your Terminal
- Try `node --version` again

---

## Step 1.3: Install Supabase CLI

Copy and paste this into Terminal, then press Enter:

```bash
npm install -g supabase
```

**What you'll see:**
- Lots of text scrolling
- Takes 1-2 minutes
- Eventually stops

**✅ When it stops and you see the cursor again, you're done!**

**Test it worked:**
```bash
supabase --version
```

You should see a version number like `1.123.4`

---

## Step 1.4: Download Your Project Code

**Create a folder for your project:**

```bash
cd ~
mkdir bfs-project
cd bfs-project
```

**Download the code from GitHub:**

```bash
git clone https://github.com/matthoppy/BFS-Website.git
cd BFS-Website
git checkout claude/add-project-preview-kHbt6
```

**What you'll see:**
- "Cloning into 'BFS-Website'..."
- Some progress bars
- "Checking out files..."
- Done!

**✅ You now have the code on your computer!**

---

# PART 2: DEPLOY TO SUPABASE (10 minutes)

## Step 2.1: Login to Supabase

Type this and press Enter:

```bash
supabase login
```

**What happens:**
1. A browser window will open
2. You'll see "Supabase CLI" asking for permission
3. Click **"Authorize"** or **"Allow"**
4. Browser says "You can close this window"
5. Go back to Terminal

**✅ Terminal should say: "You are now logged in"**

---

## Step 2.2: Link to Your Project

Copy and paste this EXACTLY:

```bash
supabase link --project-ref plprhxtkpwklrgqaoxyj
```

**What you'll see:**
- "Enter your database password:"

**Type:** The password you use to login to Supabase dashboard

**Press Enter**

**✅ Should say: "Linked to project successfully"**

❌ **If it says "Invalid credentials":**
- You entered wrong password
- Try again with correct password

---

## Step 2.3: Set Environment Secrets

**Now we're going to tell Supabase your API keys.**

**Secret 1: Resend (for emails)**

```bash
supabase secrets set RESEND_API_KEY=re_ZzBMdDwN_4N7M8FDLcReeuSRpuYr3LT5A
```

Press Enter. Wait for: ✅ "Secret set successfully"

---

**Secret 2: Stripe (for payments)**

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_51Sj5nLDO87gISe57a8Z9VgNT4z5BB0WdVzwx1dqCOmizTT9FYnwplNMbIoleL3gaWhe3yRB21xpIMn83sT6GCEjS00fHGX5Sh6
```

Press Enter. Wait for: ✅ "Secret set successfully"

---

**Secret 3: Supabase URL**

```bash
supabase secrets set SUPABASE_URL=https://plprhxtkpwklrgqaoxyj.supabase.co
```

Press Enter. Wait for: ✅ "Secret set successfully"

---

**Secret 4: Supabase Service Key**

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sb_secret_YIv8mLlf4v3nPrdcUHBKVQ_vuwWj22D
```

Press Enter. Wait for: ✅ "Secret set successfully"

---

**✅ All 4 secrets are now set!**

---

## Step 2.4: Deploy Edge Functions

**These are the backend functions that handle emails and payments.**

**Deploy function 1:**
```bash
supabase functions deploy send-quote-email
```

Wait... You'll see lots of text. Eventually: ✅ "Deployed successfully"

---

**Deploy function 2:**
```bash
supabase functions deploy send-order-confirmation
```

Wait... ✅ "Deployed successfully"

---

**Deploy function 3:**
```bash
supabase functions deploy create-checkout-session
```

Wait... ✅ "Deployed successfully"

---

**Deploy function 4:**
```bash
supabase functions deploy stripe-webhook
```

Wait... ✅ "Deployed successfully"

---

**🎉 ALL 4 FUNCTIONS ARE DEPLOYED!**

You can leave Terminal open. We'll come back to it.

---

# PART 3: CONFIGURE STRIPE (5 minutes)

## Step 3.1: Open Stripe Dashboard

1. Go to: **https://dashboard.stripe.com/test/webhooks**
2. Login with your Stripe account

**✅ You should see "Webhooks" at the top of the page**

---

## Step 3.2: Add Webhook Endpoint

1. Click the blue button: **"+ Add endpoint"** (top right)

2. A form appears. Fill it in:

   **Endpoint URL:** (Copy and paste this EXACTLY)
   ```
   https://plprhxtkpwklrgqaoxyj.supabase.co/functions/v1/stripe-webhook
   ```

3. **Description:** (Optional, but you can type)
   ```
   BFS Website Payment Webhook
   ```

4. **Events to send:**
   - Click **"+ Select events"**
   - In the search box, type: `checkout.session.completed`
   - Click the checkbox next to `checkout.session.completed`
   - Click **"Add events"** button at bottom

5. Click **"Add endpoint"** button at the very bottom

**✅ Your webhook is created!**

---

## Step 3.3: Get Webhook Secret

**You should now see your webhook in the list.**

1. Click on the webhook you just created

2. You'll see a section called **"Signing secret"**

3. Click **"Reveal"** button next to the hidden secret

4. You'll see something like: `whsec_aBc123XyZ...`

5. Click **"Copy"** button next to it

**✅ You copied the webhook secret!**

---

## Step 3.4: Set Webhook Secret in Supabase

**Go back to Terminal**

Type this, but REPLACE `whsec_YOUR_SECRET` with what you just copied:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

**Example (yours will be different):**
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_aBc123XyZ456PqR789
```

Press Enter. Wait for: ✅ "Secret set successfully"

---

**🎉 STRIPE IS CONFIGURED!**

---

# PART 4: DEPLOY TO CLOUDFLARE (10 minutes)

## Step 4.1: Sign Up for Cloudflare (if you don't have account)

1. Go to: **https://dash.cloudflare.com/sign-up**
2. Enter your email and create password
3. Verify your email
4. Login to dashboard

**✅ You should see Cloudflare dashboard**

---

## Step 4.2: Create New Pages Project

1. In the left sidebar, click: **"Workers & Pages"**

2. Click the blue button: **"Create application"**

3. Click the **"Pages"** tab at the top

4. Click: **"Connect to Git"**

**✅ You should see "Connect your Git provider"**

---

## Step 4.3: Connect GitHub

1. Click the **"GitHub"** button

2. A popup appears asking for permission

3. Click **"Authorize Cloudflare Pages"** (the green button)

4. You might need to enter your GitHub password

5. The popup closes

**✅ You're back at Cloudflare, now showing "Select a repository"**

---

## Step 4.4: Select Your Repository

1. In the search box, type: `BFS`

2. You should see: **`matthoppy/BFS-Website`**

3. Click on it

4. Click **"Begin setup"** button at the bottom

**✅ You should see "Set up builds and deployments"**

---

## Step 4.5: Configure Build Settings

**You'll see a form with several fields:**

**1. Project name:**
- Type: `bfs-website` (or whatever you want)

**2. Production branch:**
- It might say `main`
- Change it to: `claude/add-project-preview-kHbt6`
- (Type it exactly like that)

**3. Framework preset:**
- Click the dropdown
- Select: **"Vite"**
- (The Build command and Build output directory will auto-fill)

**4. Build command:** (Should auto-fill with)
- `npm run build`

**5. Build output directory:** (Should auto-fill with)
- `dist`

**✅ Don't click "Save and Deploy" yet! We need to add environment variables first!**

---

## Step 4.6: Add Environment Variables

**Scroll down to "Environment variables" section**

**Click "Add variable" button**

**Variable 1:**
- **Variable name:** Type exactly: `VITE_SUPABASE_URL`
- **Value:** Copy and paste exactly:
  ```
  https://plprhxtkpwklrgqaoxyj.supabase.co
  ```

**Click "Add variable" button again**

**Variable 2:**
- **Variable name:** Type exactly: `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Value:** Copy and paste exactly (this is LONG):
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscHJoeHRrcHdrbHJncWFveHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDI5NDgsImV4cCI6MjA4MjAxODk0OH0.b0mZfY7zBzyhD6bqU4HdHXqSNUsejO1Ij5FaJ5fJCbo
  ```

**✅ You should now see 2 variables listed**

---

## Step 4.7: Deploy!

**Now you're ready!**

1. Scroll to the bottom

2. Click the big button: **"Save and Deploy"**

**What happens:**
- You'll see "Deploying your site..."
- A progress bar appears
- Lots of build logs scroll by
- Takes 2-3 minutes (be patient!)

**✅ When done, you'll see: "Success! Your site is live" with a URL!**

---

## Step 4.8: Get Your Site URL

**You'll see something like:**
```
https://bfs-website.pages.dev
```

**Or:**
```
https://bfs-website-abc.pages.dev
```

**Click on it!** Your site should load! 🎉

---

# PART 5: TEST EVERYTHING (10 minutes)

## Test 5.1: Test Customer Journey

**1. Go to your site:** `https://your-site.pages.dev`

**2. Click: "Design Your Shower"** (or go to `/designer`)

**3. Select options:**
- Template: Click "Alcove" (first one)
- Glass: Keep "Clear" selected
- Hardware: Keep "Chrome" selected
- Handle: Keep "8 inch Circular" selected

**4. Enter measurements:**
- Each box: Type `2000`
- All boxes should say 2000

**5. Click big blue button:** "Request Final Quote"

**6. Enter your details:**
- Name: Your name
- Email: **YOUR REAL EMAIL** (you'll get the quote here)
- Phone: Any number
- Click "Submit"

**✅ Should see: "Quote request submitted successfully!"**

---

## Test 5.2: Check Your Email

**Within 1-2 minutes, check your email**

**You should receive:**
- Email from "Bespoke Frameless Showers"
- Subject: "Your Quote Q-YYYYMMDD-XXXX"
- Has a blue "View Your Quote" button

**✅ Did you get the email?**
- ✅ YES - Great! Continue to Test 5.3
- ❌ NO - Check spam folder. Still no? See Troubleshooting below

---

## Test 5.3: Accept Quote and Pay

**1. Open the email**

**2. Click:** "View Your Quote" button

**3. Review the quote** (should show your design and pricing)

**4. Click:** "Accept & Pay Now" (big blue button)

**5. You'll be redirected to Stripe payment page**

**6. Enter test card details:**
- **Card number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., `12/25`)
- **CVC:** Any 3 digits (e.g., `123`)
- **Name:** Your name
- **Country:** United Kingdom
- **Postal code:** Any (e.g., `SW1A 1AA`)

**7. Click:** "Pay" button

**✅ Should redirect back to quote page with "Payment Successful!" message**

---

## Test 5.4: Check Order Confirmation Email

**Check your email again**

**You should receive a second email:**
- Subject: "Order Confirmed BFS-YYYYMMDD-XXXX - Thank You!"
- Has your order number
- Says "Thank you for your payment!"

**✅ Did you get it?**
- ✅ YES - Perfect! Your payment system works!
- ❌ NO - Check spam. See Troubleshooting

---

## Test 5.5: Test Admin Portal

**1. Go to:** `https://your-site.pages.dev/admin/login`

**2. Enter credentials:**
- Email: `admin@bfs.co.uk`
- Password: `admin123`

**3. Click:** "Login"

**✅ Should see admin dashboard with:**
- "1" under Total Customers
- "1" under Active Orders (or Pending Quotes)
- Your test quote/order in the list

---

## Test 5.6: View Your Order

**1. Click:** "Orders" in the top navigation

**2. You should see:** Your test order in the list

**3. Click:** "View" button

**✅ Should see:**
- Full order details
- Customer information (your email)
- Payment status: "Paid"
- Order status: "Pending"

**4. Try changing status:**
- Click the "Update Status" dropdown
- Select: "In Production"
- Should save automatically

**5. Add a note:**
- In "Admin Notes" box, type: "Test order completed successfully!"
- Click "Save Notes"

**✅ If all this worked, EVERYTHING IS WORKING!**

---

# 🎉 SUCCESS! YOU'RE LIVE!

Your BFS Website is fully deployed and working!

**Your site:** `https://your-site-name.pages.dev`

**What works:**
- ✅ Customers can design showers
- ✅ Customers receive quote emails
- ✅ Customers can pay with Stripe
- ✅ Customers receive order confirmations
- ✅ Admin can manage quotes
- ✅ Admin can manage orders
- ✅ All completely free!

---

# 🆘 TROUBLESHOOTING

## Problem: No email received

**Check 1: Spam folder**
- Look in spam/junk

**Check 2: Resend Dashboard**
1. Go to: https://resend.com/emails
2. Login
3. Check "Emails" tab
4. Do you see your email there?
   - ✅ YES: Email was sent, check spam again
   - ❌ NO: Edge function might have issue

**Check 3: Supabase Function Logs**
```bash
supabase functions logs send-quote-email
```
Look for errors

---

## Problem: Payment fails

**Check 1: Stripe Dashboard**
1. Go to: https://dashboard.stripe.com/test/payments
2. Do you see a payment attempt?
   - ✅ YES: Payment went through
   - ❌ NO: Check webhook

**Check 2: Stripe Webhook**
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click your webhook
3. Click "Events" tab
4. Do you see events?
   - ✅ YES: Webhook is receiving events
   - ❌ NO: Webhook not set up correctly

---

## Problem: Site won't load

**Check 1: Deployment Status**
1. Go to: https://dash.cloudflare.com
2. Click "Workers & Pages"
3. Click your project
4. Is status "Deployed" or "Failed"?
   - Failed: Click on deployment, check error logs

**Check 2: Environment Variables**
1. In Cloudflare project, click "Settings"
2. Click "Environment variables"
3. Confirm both variables are set

---

## Problem: Can't login to admin

**Make sure:**
- Email is exactly: `admin@bfs.co.uk`
- Password is exactly: `admin123`
- No extra spaces

**Check database:**
- Go to: https://plprhxtkpwklrgqaoxyj.supabase.co
- Click "Table Editor"
- Click "admin_users"
- Is there a user with email `admin@bfs.co.uk`?
  - ✅ YES: Password might be wrong
  - ❌ NO: Run migrations again

---

## Still stuck?

**Collect this information:**
1. What step failed?
2. What error message did you see?
3. Screenshot if possible

**Check:**
- DEPLOYMENT.md (detailed guide)
- README.md (full documentation)

---

# 📝 NEXT STEPS

**Now that it's working:**

1. **Test thoroughly** - Try different shower designs

2. **Share with others** - Get feedback

3. **Add custom domain** (optional):
   - In Cloudflare Pages → Settings → Custom domains

4. **Monitor traffic**:
   - Cloudflare Pages → Analytics

5. **Make changes**:
   - Edit code locally
   - Push to GitHub
   - Cloudflare auto-deploys!

6. **When ready for production:**
   - Switch Stripe to live mode
   - Change admin password
   - Verify domain in Resend

---

**🎊 CONGRATULATIONS! YOU DID IT!**

You now have a fully working e-commerce website for custom shower enclosures!
