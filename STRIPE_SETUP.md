# BeanBuilt Pro setup

Core plans and tracking work without Stripe. Checkout, AI refreshes, grocery lists, and exports remain locked until billing is configured and Stripe verifies an active membership.

## Enable subscriptions

1. Apply the new additive database migration using `npx prisma migrate deploy` against the intended database. Do this before adding the Stripe environment variables. Do not use `prisma migrate reset`.
2. In Stripe, create a recurring **USD $12.00 monthly** price with an interval count of 1. Copy its `price_...` ID.
3. Add these server-only variables in Vercel:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXTAUTH_URL` (canonical HTTPS application origin)
   - `OPENAI_API_KEY` (required for AI refreshes)
4. Configure a Stripe webhook to `https://YOUR-DOMAIN/api/billing/webhook` for `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`. Use that endpoint's signing secret.
5. Enable Stripe's customer portal with subscription cancellation, invoice history, and payment method updates.
6. Redeploy. Verify test-mode signup, return from Checkout, Pro access, duplicate Checkout attempts, invoice failure, cancellation, and repeated webhook delivery before switching to live keys and a live price.
7. Remove the landing page's "coming soon" copy only after live checkout is verified. Configuration alone does not claim a completed production payment test.

## Behavior and limits

- No publishable key is needed for hosted Checkout or the customer portal. Never put secret keys in `NEXT_PUBLIC_` variables or source control.
- The server checks that the configured price is exactly $12 USD per month before creating Checkout. It derives the customer from the authenticated account and reuses open Checkout sessions.
- Pro access checks current Stripe subscription status and the configured price, not browser state or the success URL. Active and trialing memberships receive access; past-due, canceled, unpaid, and incomplete memberships do not.
- Webhooks verify the raw payload signature, read current Stripe state, and only update an already-linked customer. Webhook database status is informational; it cannot grant access by itself.
- AI generation is limited to three requests per rolling 24 hours, reserved transactionally before generation. Failed attempts count. A combined refresh can generate both plans. Refreshes replace the active plans and restart their completion tracking.
- Grocery quantities are preserved per recipe instead of adding incompatible units. Calendar exports use all-day events starting on the selected Monday. JSON exports contain plans only, with no account credentials.
- Profile, latest weight, and saved plans are stored on the server. Meal/workout completion and weight history remain browser-local and are cleared on sign-out. New weeks created locally must be saved before server exports can include them.

## Verification

Run `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npm audit`. Automated billing tests use mocked accounts and signed synthetic Stripe events; they do not create charges or replace a Stripe test-mode end-to-end test.

References: [Stripe subscription Checkout](https://docs.stripe.com/payments/checkout/build-subscriptions), [subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks), [billing test guide](https://docs.stripe.com/billing/testing).
