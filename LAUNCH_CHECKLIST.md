# Launch checklist, manual setup, limitations

## A. Things only you can do (manual configuration)

1. **Install and fix first-run issues.** `npm install && npm run check && npm run dev`. This build
   was written without access to the package registry (see README), so expect some type errors
   against real library versions, most likely in `src/server/auth.ts`, `src/server/db/index.ts`,
   `src/proxy.ts` and the Stripe webhook. Then run `npm run test:e2e` and `npm audit`.
2. **Name and domain.** Pick them, set `site.name` and `NEXT_PUBLIC_APP_URL`.
3. **Logo and icons.** Replace `src/components/site/logo.tsx` and `src/app/icon.svg`.
4. **Business entity.** Form the company (LLC or similar) and set `NEXT_PUBLIC_LEGAL_NAME`.
5. **Database, hosting, email.** `DEPLOYMENT.md`.
6. **Stripe.** `BILLING.md`. Decide on Stripe Tax with your accountant.
7. **Legal review.** Have a lawyer review `/terms`, `/privacy`, `/refund-policy`, `/cookies` and
   the trademark notice; fill in the governing-law section of the terms; then set
   `NEXT_PUBLIC_LEGAL_REVIEWED=true`.
8. **Real bank layouts.** Verify the Rockland Trust and Huntington drafts against the banks' guides
   (or replace them), write their page content, publish. Add more from published specifications.
9. **Unpublish the four sample banks** once at least one real bank is live.
10. **Verify the QuickBooks export instructions** in `src/content/help.ts` against a live copy of
    QuickBooks Desktop and Online. They are written from general knowledge, not checked.
11. **Insurance.** Get an errors-and-omissions quote once you have paying customers.

## B. Security and privacy checklist

- [ ] `BETTER_AUTH_SECRET` is a fresh random value, different in every environment
- [ ] `npm audit` shows no high or critical issues
- [ ] `curl -I https://yourdomain.com/convert` shows `content-security-policy` with `connect-src 'self'`
- [ ] In browser dev tools → Network, converting a file sends no request containing file contents (only small `/api/events` posts with names and codes)
- [ ] Sign-up, email confirmation, password reset and account deletion work end to end
- [ ] A non-admin account gets a 404 at `/admin`
- [ ] A Free account cannot save a second layout, a payee-match layout or a custom layout
- [ ] Stripe webhook rejects a request with a bad signature (returns 400)
- [ ] Database backups are on; the database is not publicly writable
- [ ] Production logs contain no email bodies or request bodies
- [ ] No third-party script, analytics, chat widget or error reporter has been added
- [ ] The privacy and security pages still describe exactly what the software does

## C. Production launch checklist

- [ ] `npm run check` and `npm run test:e2e` pass in CI
- [ ] Admin → Overview → every "System health and launch readiness" line is green
- [ ] At least one real, verified bank layout is published; sample banks are unpublished
- [ ] Legal pages reviewed; draft notice gone
- [ ] Test-mode purchase, plan change, failed payment and cancellation all behave as `BILLING.md` describes; then switch to live keys
- [ ] Transactional emails arrive (and not in spam) from your own domain
- [ ] `robots.txt` and `sitemap.xml` load; site added to Google Search Console
- [ ] Uptime monitor on `/` and `/convert`
- [ ] Support inbox monitored; `SUPPORT_INBOX` set
- [ ] You have converted one real file of your own for a real bank and the bank accepted it
- [ ] Phase 0 from the business plan done: you tried the existing competitors by hand

## D. Known limitations

- **Not yet run as a whole.** See README. The engine and converter are tested; the server side is not.
- **Only sample bank formats are live.** Two real-bank drafts are included, unverified.
- **Free-plan limit is advisory.** Conversion is client-side, so the 10-check limit can be bypassed by a technical user. Accepted by design.
- **File types:** `.csv` and `.xlsx` only. No `.xls`, `.txt`/`.tsv`, PDF or password-protected workbooks.
- **Dates:** two-digit years are read as 20YY. Eight-digit dates without separators (`20261001`) are not accepted as input.
- **Amounts:** US formatting only (`1,200.00`). European formatting (`1.200,00`) is rejected rather than guessed.
- **One sheet at a time** from a workbook; the person chooses which.
- **Large files** are parsed on the main thread. Files up to tens of thousands of rows are fine; the page may pause briefly on very large ones. A Web Worker is the natural next step if customers hit this.
- **Voids:** many accounting packages zero a check's amount when it is voided. Formats that need a void's original amount can't be satisfied from such an export; the converter says so and stops.
- **Check Detail-style reports** with split lines work, but the extra lines produce a "rows left out" warning each time. A dedicated adapter could tidy this once real exports are in hand.
- **Header and trailer records** for bank layouts are edited as JSON in the layout editor, not through form fields.
- **Email address changes** are handled by support, not self-service.
- **Rate limiting** keys on the forwarded IP address; behind an unusual proxy, confirm `X-Forwarded-For` is set correctly.
- **Pages render per request** (needed for the nonce-based Content-Security-Policy), so there is no static caching of marketing pages. Fine at this scale.
- **History** is deliberately thin: date and layout only.
- **No automated tests yet** for sign-in, saved layouts against a database, Stripe end to end, or the admin area.

## E. Do not build until customers ask

- Direct QuickBooks (or Xero, Sage) API connection — brings app review and a yearly security assessment, and gives up the "nothing to authorize" position
- Bank logins or automatic upload to bank portals
- Storing customers' files or conversion contents "for convenience"
- ACH or other payment-file formats (a possible second product, later)
- Team accounts, roles and shared workspaces beyond the Bookkeeper plan
- More than 10 clients per bookkeeper, or per-client billing
- A desktop or mobile app; PWA/offline install
- An email-marketing system, SMS, referral schemes or any outbound automation
- Scheduled or recurring conversions
- AI-assisted column guessing — it conflicts with "never guess"
- A public API
- Free trials of paid plans (the Free plan already serves as the trial)
