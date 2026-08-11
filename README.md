# Custom Showers Website

A complete e-commerce platform for custom frameless glass shower enclosures with 3D design preview, automatic quote generation, payment processing, and order management.

## Features

### Customer-Facing Features
- **Interactive 3D Shower Designer**: Template-based design tool with real-time 3D previews
- **7 Pre-Configured Templates**: Common shower layouts with customizable options
- **Smart Hardware Selection**: Automatic hinge selection based on door size and weight
- **Instant Quote Generation**: Real-time pricing calculations with itemized breakdown
- **Email Quote Delivery**: Professional quote emails with unique review links
- **Secure Payment Processing**: Stripe integration for safe online payments (GBP)
- **Order Tracking**: Customers receive confirmation emails with order status

### Admin Features
- **Dashboard**: Overview of customers, quotes, orders, and revenue
- **Quote Management**: Review, edit pricing, and send quotes to customers
- **Order Management**: Track orders from payment to delivery
- **Status Management**: Update order status (pending, in production, ready, shipped, delivered)
- **Customer Database**: Automatic customer record creation
- **Admin Notes**: Internal notes for quotes and orders

### Technical Features
- Automatic 10mm glass thickness (simplified from multi-thickness)
- Geneva → Vienna → Bellagio hinge selection based on door weight
- Smart seal selection based on door opening and hinge type
- VAT calculation (20% UK rate)
- Auto-generated order numbers (CS-YYYYMMDD-XXXX)
- Auto-generated quote numbers (Q-YYYYMMDD-XXXX)
- Responsive design for mobile and desktop
- Real-time inventory and pricing calculations

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **3D Rendering**: React Three Fiber (@react-three/fiber, @react-three/drei)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Session-based admin auth
- **Payments**: Stripe (UK/GBP)
- **Email**: Resend via Supabase Edge Functions
- **Routing**: React Router
- **State Management**: React Context API
- **Deployment**: Netlify (frontend) + Supabase (backend)

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── admin/         # Admin-specific components
│   │   ├── designer/      # Design tool components
│   │   └── ui/            # shadcn/ui components
│   ├── contexts/          # React contexts (Admin, Design)
│   ├── lib/               # Utility libraries
│   │   ├── constants.ts   # Glass, hardware, pricing constants
│   │   ├── quoteCalculator.ts  # Quote generation logic
│   │   ├── designService.ts    # Design/quote persistence
│   │   ├── emailService.ts     # Email sending service
│   │   ├── stripeService.ts    # Stripe payment service
│   │   └── adminAuth.ts        # Admin authentication
│   ├── pages/             # Route pages
│   │   ├── Index.tsx      # Homepage
│   │   ├── Designer.tsx   # Design tool page
│   │   ├── QuoteView.tsx  # Customer quote view
│   │   ├── Admin*.tsx     # Admin pages
│   │   └── NotFound.tsx   # 404 page
│   └── integrations/
│       └── supabase/      # Supabase client
├── supabase/
│   ├── migrations/        # Database migrations
│   └── functions/         # Edge Functions
│       ├── send-quote-email/
│       ├── send-order-confirmation/
│       ├── create-checkout-session/
│       └── stripe-webhook/
├── public/                # Static assets
└── netlify.toml          # Netlify configuration
```

## Shower configurator

The configurator lives in `src/configurator/` and is self-contained. It captures
a design and emails the measurements to the glazier — there is no pricing in the
customer-facing flow.

```
src/configurator/
├── types.ts        # The chain model: panels joined by 90°/180° junctions
├── geometry.ts     # Traces the run in plan space; derives front vs return
├── spec.ts         # Cut sizes, hinge selection, warnings (uses lib/showerCalculations)
├── tenant.ts       # Per-glazier branding, hardware catalog, destination email
├── submit.ts       # Rasterises the drawings and posts to the worker
├── views/          # PlanView (top-down) and ElevationView (front, unfolded)
└── steps/          # Shape → Sizes → Hardware → Review
```

Fabrication rules stay in `src/lib/showerCalculations.ts` — deductions, hinge and
handle placement, support requirements.

### Embedding on another site

The configurator builds as a second entry point (`embed.html`) so it can be
dropped into any website:

```html
<div id="glass-configurator" data-tenant="custom-showers"></div>
<script src="https://customshowers.uk/embed.js" async></script>
```

Optional attributes: `data-theme` (`light` | `dark`) and `data-height` (initial
px before the first resize message). The loader injects a sandboxed iframe and
grows it to fit via `postMessage`.

### Deploying the configurator

The enquiry handler is a Cloudflare Worker, alongside the existing
`customshowers-contact` worker that the site's quote form posts to. The site
does not use Supabase for this.

```bash
cd design-worker
npx wrangler deploy
```

Then set the secrets in the dashboard (Workers & Pages → customshowers-design →
Settings → Variables and Secrets):

| Secret | |
|---|---|
| `RESEND_API_KEY` | required — the same key the contact worker uses |
| `TURNSTILE_SECRET_KEY` | required — pairs with the site key in `tenant.ts` |
| `BUSINESS_EMAIL` | optional, defaults to `sales@customshowers.uk` |
| `FROM_EMAIL` | optional, defaults to `noreply@customshowers.uk` |

The worker must be live before the Send button works. Send one real test
enquiry to yourself and check both emails arrive with the two PNGs attached.

If the worker's URL differs from `customshowers-design.workers.dev`, update
`enquiryEndpoint` in `src/configurator/tenant.ts`.

> **Rotate the old keys.** Earlier versions of `deploy-supabase.sh`,
> `deploy-commands.sh`, `DEPLOYMENT.md` and `SUPER-SIMPLE-DEPLOY.md` contained
> a live Supabase service-role key, a Resend API key and a Stripe secret key.
> They have been removed from those files, but they remain in git history and
> should be considered compromised.

### Adding a glazier

Add an entry to `TENANTS` in `src/configurator/tenant.ts` with their branding,
the finishes and handles they stock, their destination email and the endpoint
to post to. Then add the same email to `TENANT_INBOXES` in
`design-worker/worker.js` — destinations are allow-listed server-side so the
public endpoint cannot be pointed at an arbitrary inbox.

One Turnstile site key covers every embed. The widget runs inside `embed.html`,
which is served from your own domain, so the hostname it reports is yours no
matter whose site the iframe is on. Worth confirming with one real submission
from a customer domain after deploying.

### Spam handling

Four layers, in order of how much they are trusted:

| Layer | Behaviour |
|---|---|
| Honeypot field | Silently dropped — off-screen, aria-hidden and untabbable, so no person can fill it |
| Turnstile | Verified server-side; runs in `interaction-only` mode so most customers never see a challenge |
| Completion time | **Flagged, not dropped** — subject gets `[Possible spam]` and the customer copy is suppressed |
| Rate limit | 5 per IP per 10 minutes; returns 429 |

Only the honeypot drops an enquiry, because it is the only signal a human
cannot trip. Everything else lets the enquiry through so a false positive
never costs a real job — a lost lead leaves no trace, a junk email costs
seconds.

The rate limiter is in-memory per isolate, so it is a burst brake rather than a
hard quota. Move it to a shared store or a Cloudflare WAF rule in front of the
function if abuse becomes real.

## Prerequisites

- Node.js 18+ and npm
- Supabase account (https://supabase.com)
- Stripe account (https://stripe.com)
- Resend account (https://resend.dev)
- Git

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Supabase
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here

# These are set in Supabase Edge Functions, not in .env:
# RESEND_API_KEY=re_xxxxxxxxxxxxx
# STRIPE_SECRET_KEY=sk_xxxxxxxxxxxxx
# STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Installation

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/matthoppy/CustomShowers-Website.git
cd CustomShowers-Website
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Copy your project URL and anon key to `.env`
3. Run the database migrations:

```bash
# Option 1: Use Supabase CLI
supabase db push

# Option 2: Run in Supabase Dashboard
# Go to SQL Editor and run: supabase/COMPLETE_SETUP.sql
```

4. Create admin user (email: admin@bfs.co.uk, password: admin123):
   - Already included in migrations
   - **IMPORTANT**: Change this password in production!

### 3. Deploy Supabase Edge Functions

```bash
# Deploy all functions
supabase functions deploy send-quote-email
supabase functions deploy send-order-confirmation
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook

# Set environment secrets
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
supabase secrets set STRIPE_SECRET_KEY=sk_xxxxxxxxxxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
supabase secrets set SUPABASE_URL=https://yourproject.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourproject.supabase.co/functions/v1/stripe-webhook`
3. Select event: `checkout.session.completed`
4. Copy the webhook signing secret
5. Update Supabase secrets: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx`

### 5. Configure Resend

1. Sign up at https://resend.com
2. Verify your domain (or use onboarding@resend.dev for testing)
3. Create API key
4. Update Supabase secrets: `supabase secrets set RESEND_API_KEY=re_xxx`

### 6. Run Development Server

```bash
npm run dev
```

Open http://localhost:8080 in your browser.

## Deployment

### Frontend (Netlify)

1. Push code to GitHub
2. Connect repository to Netlify
3. Configure build settings (already in `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Deploy!

### Backend (Supabase)

Already deployed via Supabase CLI (see step 3 above).

## Usage

### For Customers

1. **Design**: Visit `/designer` and select a shower template
2. **Configure**: Choose glass type, hardware finish, handle type
3. **Measure**: Enter precise measurements with rake indicators
4. **Quote**: Click "Request Final Quote" and enter contact details
5. **Review**: Receive email with quote link
6. **Pay**: Click "Accept & Pay Now" on quote page
7. **Confirm**: Receive order confirmation email

### For Admins

1. **Login**: Visit `/admin/login` (admin@bfs.co.uk / admin123)
2. **Dashboard**: View statistics and recent quotes
3. **Quotes**: Review pending quotes, adjust pricing if needed
4. **Send Quote**: Click "Send to Customer" to email quote
5. **Orders**: View paid orders, update status
6. **Track**: Add admin notes and manage order workflow

## Database Schema

### Main Tables

- **customers**: Customer contact information
- **designs**: Shower design configurations
- **quotes**: Quote pricing and status
- **orders**: Paid orders with fulfillment tracking
- **admin_users**: Admin account management

### Key Features

- Auto-generated UUIDs for all IDs
- Automatic timestamps (created_at, updated_at)
- Row Level Security (RLS) policies
- Cascading deletes for data integrity

## Pricing Configuration

Edit `src/lib/constants.ts` to update:

- Glass pricing per m² by type
- Hardware costs (hinges, handles, seals)
- Installation/labour rates
- Markup percentages
- VAT rate

## Customization

### Adding New Shower Templates

1. Add template definition to `src/lib/constants.ts`
2. Create 3D model component in `src/components/designer/templates/`
3. Update `TemplateSelector.tsx` to include new template

### Changing Hardware Options

Update `src/lib/constants.ts`:
- `HINGE_OPTIONS`: Add new hinge types with specs
- `HANDLE_OPTIONS`: Add new handle styles
- `SEAL_OPTIONS`: Add new seal types

### Email Templates

Edit email HTML in:
- `supabase/functions/send-quote-email/index.ts`
- `supabase/functions/send-order-confirmation/index.ts`

## Testing

### Test Payment (Stripe Test Mode)

Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC will work.

### Test Email Sending

Resend provides test mode. Check Dashboard → Logs to see sent emails.

## Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# If React Three Fiber issues
npm install three @react-three/fiber@^8.15.0 @react-three/drei@^9.88.0 --legacy-peer-deps
```

### Database Connection Issues

1. Check Supabase project status
2. Verify environment variables
3. Check RLS policies are enabled
4. Ensure migrations ran successfully

### Edge Functions Not Working

```bash
# View logs
supabase functions logs send-quote-email

# Test locally
supabase functions serve send-quote-email
```

### Stripe Webhook Issues

1. Check webhook endpoint URL is correct
2. Verify webhook secret matches
3. Check selected events include `checkout.session.completed`
4. View webhook logs in Stripe Dashboard

## Security Notes

⚠️ **IMPORTANT FOR PRODUCTION**:

1. **Change Admin Password**: Update in Supabase database
2. **Use bcrypt**: Hash passwords properly (current demo uses plain text)
3. **Environment Variables**: Never commit `.env` file
4. **Stripe Keys**: Use live keys for production, test keys for development
5. **Email Domain**: Verify your domain in Resend for production emails
6. **RLS Policies**: Review and test Row Level Security policies

## Future Enhancements

Placeholder features ready for implementation:

- [ ] DXF file generation for glass suppliers
- [ ] Hardware specification PDF generation
- [ ] Installation instruction sheets
- [ ] Customer account management
- [ ] Order status email notifications
- [ ] Admin notifications for new orders
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/matthoppy/CustomShowers-Website/issues)
- Email: sales@customshowers.uk

## License

Copyright © 2024 Custom Showers. All rights reserved.

## Credits

Built with:
- [React](https://react.dev/)
- [Supabase](https://supabase.com/)
- [Stripe](https://stripe.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [Tailwind CSS](https://tailwindcss.com/)
