# Architecture

## The shape of the system

```
 CUSTOMER'S BROWSER                                   OUR SERVER                 STRIPE / EMAIL
 ───────────────────                                  ──────────                 ──────────────
 check export (CSV/XLSX)
        │  read in memory
        ▼
 INPUT ADAPTER   src/engine/csv.ts, xlsx.ts           pages + converter code
        ▼        → RawTable                           bank layout definitions ──┐
 DETECTION       src/engine/detect.ts                 sign-in (better-auth)     │ sent to the
        ▼        → Mapping (column names)             plan status               │ browser
 NORMALIZE       src/engine/normalize.ts              saved layout settings  ◄──┘
        ▼        → NormalizedCheck[] + issues         anonymous event counts
 BANK FORMAT     src/engine/generate.ts                                          checkout, portal,
        ▼        → exact file text + self-check       /api/stripe/webhook  ◄──── webhooks
 download (Blob)                                      transactional email  ────► Resend
        │
        ▼  the customer uploads it to their bank themselves
```

Nothing crosses from the left column to the middle column except: a sign-in, saved layout
*settings*, and anonymous events made of fixed names and codes.

## Stack

- **Next.js (App Router) + React + TypeScript**, Tailwind CSS v4 for styling.
- **PostgreSQL** through Drizzle ORM. In development with no `DATABASE_URL`, an embedded
  PostgreSQL (PGlite) is used so there is nothing to install.
- **better-auth** for accounts (email + password, email verification, password reset, sessions,
  sign-in rate limiting).
- **Stripe** Checkout + Customer Portal + webhooks for subscriptions.
- **Resend** for transactional email (plain `fetch`, no SDK).
- No queues, no microservices, no object storage, no third-party analytics or scripts.

## The conversion engine (`src/engine`)

Pure TypeScript with one dependency (JSZip, to open `.xlsx`, loaded only when needed). It has no
access to the network, the DOM or storage — an ESLint rule enforces that — so it can be tested in
Node and trusted in the browser.

| Module | Job |
| --- | --- |
| `csv.ts` | Decode bytes, detect the delimiter, strict RFC 4180 parsing. Malformed quoting is an error, not a guess. |
| `xlsx.ts`, `xml.ts` | Read cell *values* from a workbook. Formulas are never evaluated, macros and external links never opened, dates converted by integer math. |
| `detect.ts` | Find the header row and map columns to fields. Only confident matches are applied; the rest are offered as suggestions. `SavedMapping` is the storable form (column names only). |
| `date.ts` | `CivilDate` {y, m, d}. JavaScript `Date` is never used for check dates, so timezones cannot shift them. Day/month order is used only if the data proves it or the person chose it. |
| `amount.ts` | Money as integer cents in a `bigint`. Nothing rounds. |
| `normalize.ts` | Rows → `NormalizedCheck[]`, reporting every missing, malformed, duplicate or ambiguous value by row number. |
| `layout.ts` | The `LayoutDefinition` schema and its validator. |
| `generate.ts` | Checks + layout → exact file text. Applies length, character and quoting rules; then re-reads its own output and compares the record count and amount total with the control totals before releasing it. |
| `issues.ts` | Every message the engine can produce. Messages never contain cell values. |
| `pipeline.ts` | `readSourceFile` and `convert`, the two entry points the UI uses. |

Design rules, enforced by tests:

1. **Never guess.** Low-confidence columns, ambiguous dates, unmarked voids and unknown rows stop
   the conversion and ask the person.
2. **Never alter.** Amounts are not rounded, names are not shortened (unless a layout documents
   truncation, with a warning), characters are not transliterated.
3. **Deterministic.** Same input, mapping, layout and typed values → byte-identical output.

### Adding another accounting system

Input adapters produce a `RawTable`. To support a new export shape, extend the synonym lists or
add a signature in `detectColumns` (see the QuickBooks-style rule there). To support a new file
type, add a reader that returns `RawTable` and register its extension in `pipeline.ts`.

## Bank layouts

A layout is data: `LayoutDefinition` describes delimiter or fixed widths, field order, date and
amount formats, padding, header/trailer records, void handling and any values the person types at
conversion time (such as an account number). Adding a bank never changes converter code.

Layouts live in two places that are kept in step:

- **`/layouts/<bank>/<layout>.v<N>.json`** — in the repository, each with a fixture (synthetic
  input + exact expected output). `npm test` runs every one; a mismatch fails the build.
- **The database** — what the running app serves. `npm run db:seed` copies new files in; the
  admin area can also create and edit drafts, test them and publish them.

Versions are append-only. A published version is never edited; a format change is a new version.

## Accounts, plans and limits

`src/config/plans.ts` is the single source for prices and limits. `entitlementFor()` turns a
subscription row into what the person may use, and runs only on the server (`getViewer()` in
`src/server/session.ts`). Server actions re-check limits for everything stored on the server
(saved layouts, clients, custom layouts, payee-match layouts).

The Free plan's 10-check limit is enforced in the converter UI. Because conversion happens in the
browser, a determined person could bypass it; that is an accepted trade-off of the privacy design.

## Data stored on the server

See `src/server/db/schema.ts`. In short: users, sessions, subscription status, bank layouts,
saved layout settings, client names, a conversion log (timestamp + layout label only), anonymous
event counts, support messages, bank requests, feedback, themes. There is no table for check data.

## Request flow notes

- `src/proxy.ts` sets a per-request Content-Security-Policy with a nonce. Pages are therefore
  rendered per request rather than statically; for this product's size that is the right trade.
- All database reads for pages go through `src/server/queries.ts`; all writes go through server
  actions in `src/server/actions/`.
- `/api/events` accepts only an allow-listed event shape; `/api/stripe/webhook` only signed Stripe
  events; `/api/auth/*` belongs to better-auth.
