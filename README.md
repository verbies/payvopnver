# PositivePay Converter

A web app that turns an accounting-software check export (QuickBooks and others) into the exact
Positive Pay file a bank requires.

**The one rule everything else follows:** a customer's check file is read, validated and converted
inside their own browser. It is never uploaded. The server handles sign-in, billing, saved layout
settings and bank layout definitions — nothing from a check file.

```
Open → Drop file → Select bank → Validate → Confirm totals → Download
```

## Status of this build — read this first

This codebase was written in an environment that could not reach the npm registry, so **the full
Next.js app has not yet been installed or run**. What that means precisely:

| Part | State |
| --- | --- |
| Conversion engine (`src/engine`) — parsing, detection, validation, output | **Executed.** 158 unit tests pass, including a regression test for every bank layout. |
| Converter screen, layout builder, theme generator, onboarding, pricing | **Executed in a real browser** (Chromium) with the framework's server pieces stubbed. The 6 end-to-end tests in `tests/e2e` pass against that build, including a byte-for-byte check of the downloaded file. |
| Every page | **Rendered** with sample data and checked for errors and for phone-width overflow. |
| Database, sign-in, email, Stripe, admin saves, middleware/CSP | **Written carefully but never executed.** Expect a short round of fixes on first `npm install` (mostly type errors against the real library versions). |

First thing to do on a machine with normal internet access:

```bash
npm install
npm run check        # typecheck + lint + unit tests
npm run dev          # http://localhost:3000
npm run test:e2e     # browser tests against the real app
```

Fix anything `npm run check` reports before going further. See `LAUNCH_CHECKLIST.md`.

## Run it locally

Requirements: Node.js 20.11 or newer. Nothing else.

```bash
npm install
cp .env.example .env.local     # optional for a first look
npm run dev
```

With no `DATABASE_URL`, the app uses an embedded PostgreSQL stored in `./.data`, creates its tables
and loads the sample bank layouts on first start. Emails (such as the sign-up confirmation link)
are printed in the terminal instead of being sent.

To become an admin: put your email in `ADMIN_EMAILS` in `.env.local` before you sign up, or run
`npm run admin:grant -- you@example.com` afterwards. The admin area is at `/admin`.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build / run it |
| `npm test` | Unit tests, including every bank layout's regression test |
| `npm run test:e2e` | Browser tests of the whole conversion flow |
| `npm run typecheck` / `npm run lint` | Static checks |
| `npm run check` | Typecheck, lint and unit tests together |
| `npm run db:migrate` | Apply SQL migrations in `/drizzle` |
| `npm run db:seed` | Copy the layouts in `/layouts` into the database |
| `npm run db:setup` | Both of the above (run on every deploy) |
| `npm run admin:grant -- email` | Make an existing account an admin |
| `npm run stripe:setup` | Create Stripe products, prices and portal settings |
| `npm run layouts:index` | Rebuild `layouts/index.ts` (runs automatically) |

## Where things are

```
layouts/                 Bank layouts as JSON, one file per version, each with a test fixture
fixtures/                Synthetic sample exports (never real data)
drizzle/                 SQL migrations
src/engine/              The conversion engine. Pure TypeScript; runs in the browser
src/layouts/             Layout file types and the fixture runner
src/components/converter The converter screen
src/components/layout-editor  Layout builder (customers and admin)
src/app/(site)/          Public pages         src/app/(auth)/  Sign-in pages
src/app/(app)/           Signed-in pages      src/app/admin/   Admin area
src/server/              Database, auth, billing, email, queries, server actions
src/config/              site.ts (name), plans.ts (prices and limits), env.ts
tests/unit, tests/e2e    Tests
```

## Documentation

| File | Covers |
| --- | --- |
| `ARCHITECTURE.md` | How the pieces fit and why |
| `SECURITY.md` | The privacy guarantee, how it's enforced, and the security review |
| `BANK_LAYOUTS.md` | Adding a bank, a layout, a new version and its regression test |
| `TESTING.md` | What the tests cover and how to run them |
| `DEPLOYMENT.md` | Environment variables, database, hosting |
| `BILLING.md` | Stripe setup and how subscriptions flow |
| `THEMING.md` | Changing the name, logo and colors; the theme generator |
| `CONTRIBUTING.md` | Conventions for changes |
| `LAUNCH_CHECKLIST.md` | Manual setup, launch checklist, known limitations, what not to build yet |

## Not affiliated

QuickBooks is a registered trademark of Intuit Inc. This product is not affiliated with Intuit or
with any bank. Nothing in this repository is legal advice; the legal pages are drafts for a lawyer
to review.
