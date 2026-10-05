# Security and privacy

## The guarantee

> A customer's check file — and the check numbers, payees, amounts, dates and account numbers in
> it — is never sent to our servers or to anyone else.

## How it is enforced (not just promised)

| Layer | Mechanism | Where |
| --- | --- | --- |
| No way in | The server has no endpoint that accepts a file. The contact and bank-request forms take text only and have no attachment field. | `src/app/api/`, `src/server/actions/support.ts` |
| Browser policy | `Content-Security-Policy: connect-src 'self'` and nonce-only scripts: the browser refuses connections to any third party and blocks third-party scripts. | `src/proxy.ts` |
| Engine purity | ESLint forbids `fetch`, `XMLHttpRequest`, `WebSocket`, storage APIs, DOM and server imports inside `src/engine`. | `eslint.config.mjs` |
| One analytics door | The converter may report usage only through `track()`, whose type allows an event name, bank/layout slugs and codes. The server re-validates with a strict allow-list and rejects any other field. | `src/lib/track.ts`, `src/app/api/events/route.ts` |
| Messages without data | Engine messages name rows and fields, never values. A unit test feeds marker values through and asserts none appear. | `src/engine/issues.ts`, `tests/unit/validation.test.ts` |
| No persistence | The parsed file lives in React refs. Only the theme, a preview theme and the last-used layout ID are written to `localStorage`. "Clear file" drops everything. | `src/components/converter/index.tsx` |
| Account numbers | Typed per conversion, held in memory, never saved. Saved mappings are validated to contain only column names and short settings. | `parseSavedMapping` in `src/engine/detect.ts` |
| Tested | The end-to-end tests fail if any network request made during a conversion contains a payee, check number, amount or account number from the fixture. | `tests/e2e/convert.spec.ts` |
| No error reporting service | Client errors are not sent anywhere. Server logs record event types and codes, never request bodies. | `src/app/error.tsx` |

**If you ever add** a client-side error reporter, session replay, chat widget, third-party
analytics or an "upload your file so we can debug" feature, this guarantee is broken. Don't, or
change the privacy and security pages first.

## What the server does store

Email, name, password hash, sessions (with IP address and browser type, for account security),
plan status and Stripe customer ID, saved layout settings, client names, a conversion log
(timestamp + layout label), anonymous event counts, support messages, bank requests, feedback.

## Security review (performed while building)

| Area | Finding |
| --- | --- |
| Accidental file upload | None possible: no upload endpoint; converter network use limited to `track()`. |
| Sensitive logging | Server logs use fixed messages plus codes/IDs. Email bodies are logged only in development when no provider is configured. |
| XSS | React escapes all output. `dangerouslySetInnerHTML` is used in three places with non-user content: the theme bootstrap script (static), saved theme CSS (validated as hex colors only), FAQ JSON-LD (static text, `<` escaped). Admin-written bank content is rendered as text, never HTML. Spreadsheet content is rendered as text. |
| CSRF | Mutations use Next.js server actions (same-origin enforced) or better-auth (origin-checked). `/api/events` checks `Origin`. The Stripe webhook is authenticated by signature. |
| Authentication | Delegated to better-auth: hashed passwords, email verification required, HttpOnly SameSite cookies (Secure in production), sessions revoked on password reset, rate-limited sign-in. No tokens in `localStorage`. |
| Authorization | Every server action calls `requireViewer()` or `requireAdmin()` and scopes queries by `userId`. Admin routes return 404 to non-admins. Plan limits are checked on the server for server-stored features. |
| Stripe webhooks | Signature verified on the raw body; events de-duplicated by ID; subscription state re-fetched from Stripe; unknown prices never grant a plan. |
| Secrets | Only in environment variables read by `src/config/env.ts`. `NEXT_PUBLIC_*` values are non-secret by design. Production refuses to start without `DATABASE_URL` and `BETTER_AUTH_SECRET`. |
| SQL injection | All queries go through Drizzle with bound parameters. The migration runner executes only files from `/drizzle`. |
| Open redirects | Post-login destinations pass `safeNextPath()` (same-site paths only). External links built from stored URLs require `http(s)`. |
| Headers | CSP (nonce, `strict-dynamic`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`), HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, Referrer-Policy, Permissions-Policy, COOP. |
| CORS | No CORS headers are sent; the API is same-origin only. |
| Rate limiting | Sign-in, sign-up, password reset (better-auth); contact, bank request, feedback, events, checkout, portal, account deletion, layout and client writes, admin actions (`src/server/rate-limit.ts`, stored in PostgreSQL, keyed by a salted hash). |
| File handling | Extension, size (15 MB) and content checks; zip-bomb guard; DOCTYPE rejected in workbook XML; formulas never evaluated; nothing executed. |
| CSV/formula injection | Values starting with `=`, `+`, `-` or `@` in free-text fields block the download until the person explicitly accepts them. |
| Dependencies | **Not audited** — the registry was unreachable while building. Run `npm audit` after the first install. |

## Not verified yet

The items above were verified by reading the code, and — for the engine and converter — by tests.
Authentication, the CSP header and the webhook have not been exercised against the real
libraries. Before launch, complete the security items in `LAUNCH_CHECKLIST.md`.

## Reporting a problem

Email the address in `NEXT_PUBLIC_SUPPORT_EMAIL`.
