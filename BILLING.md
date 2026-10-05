# Billing

Subscriptions use Stripe Checkout (to subscribe), the Stripe Customer Portal (to change plan,
update a card, download invoices or cancel) and webhooks (to tell this app what happened). The app
never sees a card number.

## Where prices live

`src/config/plans.ts` holds plan names, prices, features and limits — the pricing page, emails
and enforcement all read from it. The matching Stripe price IDs come from environment variables.
The current values ($12/month or $99/year Business, $29/month Bookkeeper, 10-check Free limit) are
the plan's proposals, not tested prices.

To change a price: edit `plans.ts`, run `npm run stripe:setup` again (it creates the new price and
prints its ID), update the environment variable, and redeploy. Existing subscribers stay on their
old price until you migrate them in Stripe.

## Stripe setup, step by step

Do this once in **test mode**, try it, then repeat with **live** keys.

1. Create a Stripe account and complete business verification.
2. Copy the secret key (Developers → API keys) and run:
   ```bash
   STRIPE_SECRET_KEY=sk_test_… NEXT_PUBLIC_APP_URL=https://yourdomain.com npm run stripe:setup
   ```
   This creates the two products, their prices, and a Customer Portal configuration that allows
   plan switching, card updates, invoice history and cancel-at-period-end. It prints:
   ```
   STRIPE_PRICE_BUSINESS_MONTHLY=price_…
   STRIPE_PRICE_BUSINESS_YEARLY=price_…
   STRIPE_PRICE_BOOKKEEPER_MONTHLY=price_…
   ```
3. Add a webhook endpoint (Developers → Webhooks → Add endpoint):
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`,
     `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.paid`,
     `invoice.payment_failed`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and the three `STRIPE_PRICE_*` variables in your
   host and redeploy.
5. In Stripe → Settings → Billing, turn on failed-payment retries and the emails you want Stripe
   to send. Decide whether to enable Stripe Tax (not configured here; ask your accountant).

Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook` prints a webhook
secret for `.env.local`; pay with card `4242 4242 4242 4242`.

Until these variables are set, the pricing page works but choosing a paid plan says paid plans
aren't open yet. Nothing is simulated.

## How it flows

1. **Subscribe** — `checkoutAction` (signed-in only) creates a Stripe customer, records it, and
   redirects to Checkout. If the person already has a subscription they are sent to the portal instead.
2. **Webhook** — `/api/stripe/webhook` verifies the signature, ignores events it has already
   handled, fetches the current subscription from Stripe and stores plan, interval, status, period
   end and cancel-at-period-end (`syncSubscription`, unit-tested in `tests/unit/billing.test.ts`).
3. **Entitlement** — on each request `entitlementFor()` turns that row into limits. The browser is
   never asked what plan someone is on.

| Stripe status | What the customer gets |
| --- | --- |
| `active`, `trialing` | Their plan |
| `past_due` | Their plan for `PAST_DUE_GRACE_DAYS` (7) with a banner, then Free until payment succeeds |
| `unpaid` | Free, with a banner |
| `incomplete` | Free, with a prompt to finish payment |
| `canceled`, `incomplete_expired`, `paused` | Free |

Cancelling takes effect at period end. Downgrading never deletes anything: layouts and clients the
new plan doesn't cover are **locked** and unlock on resubscribing.

Emails sent by this app: subscription started, payment failed, subscription canceled. Receipts and
invoices are Stripe's.

## Refunds

Issue refunds in the Stripe dashboard. The published policy (`/refund-policy`, a draft) promises a
full refund within 14 days of a first payment or yearly renewal — change the page if you choose a
different policy.

## Deleting an account

Deleting an account cancels its Stripe subscription immediately, then removes the account. Stripe
keeps its own payment records.

## Trials

Not offered today. To add one, pass `subscription_data.trial_period_days` in `startCheckout`
(`src/server/billing/stripe.ts`); `trialing` is already handled everywhere.
