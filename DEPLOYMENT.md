# Deployment

The app is a standard Next.js server application plus a PostgreSQL database. The suggested setup
keeps fixed costs near zero at small scale: **Vercel** (hosting), **Neon** or **Supabase**
(PostgreSQL), **Resend** (email), **Stripe** (billing). Any Node 20+ host and any PostgreSQL 14+
work the same way. These are suggestions, not the result of a comparison.

## 1. Database

1. Create a PostgreSQL database and copy its connection string (use the *pooled* string on
   serverless hosts).
2. Set `DATABASE_URL`.
3. Create the tables and load the bank layouts:
   ```bash
   DATABASE_URL="postgres://…" npm run db:setup
   ```
   `db:setup` is safe to run on every deploy: migrations apply once each, and the seed only adds
   layouts that aren't there yet.

### Schema changes

Tables are defined twice on purpose: `src/server/db/schema.ts` (what the code uses) and plain SQL
in `/drizzle` (what is applied). To change the schema, edit `schema.ts` and add a new file such
as `drizzle/0002_add_something.sql` with the matching `ALTER TABLE`. Never edit a migration that
has already been applied.

## 2. Environment variables

Everything is documented in `.env.example`. Required in production:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public URL, e.g. `https://yourdomain.com` |
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Session signing secret: `openssl rand -base64 32` |

Needed for the features they name:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY`, `EMAIL_FROM` | Sending email. Without them sign-up cannot be completed in production. |
| `SUPPORT_INBOX` | Where contact messages and bank requests are forwarded |
| `ADMIN_EMAILS` | Comma-separated admin accounts |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | Billing — see `BILLING.md` |
| `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_LEGAL_NAME` | Shown on the site |
| `NEXT_PUBLIC_LEGAL_REVIEWED` | Set to `true` only after a lawyer has reviewed the legal pages |

## 3. Deploy on Vercel

1. Push the repository to GitHub and import it in Vercel.
2. Add the environment variables above (Production and Preview).
3. Set the build command to:
   ```
   npm run db:setup && npm run build
   ```
4. Deploy, then add your domain and set `NEXT_PUBLIC_APP_URL` to it.
5. In Resend, verify your sending domain (SPF/DKIM records) and use an address on it for `EMAIL_FROM`.
6. Follow `BILLING.md` for Stripe.
7. Sign up with an address listed in `ADMIN_EMAILS`, confirm it, and open `/admin`.

### Other hosts

```bash
npm ci && npm run db:setup && npm run build && npm start      # listens on PORT (default 3000)
```

Put it behind HTTPS. The app sends HSTS and a strict Content-Security-Policy; if you add a CDN or
proxy, make sure it passes response headers through unchanged and forwards `X-Forwarded-For`
(used, hashed, for rate limiting).

## 4. After deploying

- Open `/admin` → Overview and work through "System health and launch readiness".
- Run `E2E_BASE_URL=https://yourdomain.com npm run test:e2e` once.
- Check response headers on a page (`curl -I`) for `content-security-policy`.
- Set up an uptime check on `/` and `/convert`.

## Backups

The database holds accounts, saved layouts and bank layouts. Turn on your provider's automatic
backups. There is no customer financial data to back up or to lose.
