# 🌿 Pages for You

A personalized 30-day journal generator. Answer 5 questions, pay $12, receive a beautiful PDF journal written just for you by Claude.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill in:
- `STRIPE_SECRET_KEY` — from your Stripe dashboard (same account as My Inner Mind)
- `ANTHROPIC_API_KEY` — your Anthropic API key
- `RESEND_API_KEY` — from resend.com (same account)

### 3. Create a Stripe product
In your Stripe dashboard, this is handled dynamically via `price_data` — no need to create a product manually.

### 4. Deploy to Vercel
```bash
# Push to GitHub, then connect to Vercel
# Add all env variables in Vercel dashboard
# Set NEXT_PUBLIC_URL to your Vercel URL
```

## How it works
1. User answers 5 questions about where they are in life
2. They enter email + pay $12 via Stripe
3. On success, Claude generates a full personalized 30-day journal
4. PDF is generated and emailed via Resend
5. Download link shown on screen

## Files
- `src/App.jsx` — full frontend (landing, questions, payment, generating, done)
- `api/create-checkout.js` — Stripe checkout session
- `api/generate-journal.js` — Claude generation + email delivery
