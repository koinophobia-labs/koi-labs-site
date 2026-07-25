This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Stripe payment collection

Payment collection uses Stripe-hosted Checkout and is available only for accepted CRM proposals. Configure encrypted test-mode `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` variables before deploying.

The private founder CRM uses staged Google authentication with an exact
administrator allowlist. See
[`docs/CRM_GOOGLE_AUTH.md`](docs/CRM_GOOGLE_AUTH.md) for the security boundary,
Google Cloud setup, Vercel variables, preview gate, and post-verification legacy
secret cleanup.

Register `https://koinophobialabs.com/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, and `charge.refunded`.

The webhook verifies Stripe's signature against the raw request body. Migration `006_stripe_payments.sql` stores Checkout attempts, payment state, proposal and lead summaries, and processed webhook event IDs. Verify the deposit and balance workflow in Stripe test mode before adding live-mode keys.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
