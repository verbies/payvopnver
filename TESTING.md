# Testing

## Unit tests — `npm test`

Run with Node's built-in test runner (no test framework to install). 158 tests at the time of writing.

| File | Covers |
| --- | --- |
| `amount.test.ts` | Input styles, negatives, exact cents, refusal to round, spreadsheet doubles |
| `date.test.ts` | Accepted formats, day/month order evidence, leading zeros, serial dates, 1900/1904 systems |
| `csv.test.ts` | Quoting, delimiters, encodings, malformed files, file-type and size checks |
| `xlsx.test.ts` | Strings, numbers, dates, sparse rows, multiple sheets, hostile XML, the sample workbook end to end |
| `detect.test.ts` | Header detection, confident vs. uncertain columns, saved mappings |
| `validation.test.ts` | Missing/duplicate/invalid values, signs, dates, voids, exclusions, message privacy |
| `generate.test.ts` | Quoting, padding, fixed width, truncation rules, character rules, inputs, limits, self-check |
| `layouts.test.ts` | **Every file in `/layouts`**: valid definition, recorded source, byte-exact output, sensitivity to a one-character change |
| `billing.test.ts` | Stripe subscription → plan mapping, grace period, emails, pricing configuration |
| `theme.test.ts` | Contrast math, built-in theme passes every check and matches the CSS, 300 generated themes all pass |

A layout whose output drifts from its expected file fails `npm test`, and CI runs `npm test`
before `npm run build`, so a broken layout cannot be released.

## End-to-end tests — `npm run test:e2e`

Playwright drives the real converter in Chromium (`tests/e2e/convert.spec.ts`):

1. CSV → choose bank → resolve date order, void and account-number issues → confirm totals →
   download → compare with the layout's expected file byte for byte.
2. XLSX with real date cells and an un-evaluated formula.
3. Confirmation is withdrawn when anything changes.
4. Free-plan limit keeps the file loaded and offers the upgrade in a new tab.
5. Unsupported file types; Clear file.
6. An unidentified column is asked for, not guessed.

Every test also fails if any network request contains values from the fixture.

First run: `npx playwright install chromium`. To test a deployed copy: `E2E_BASE_URL=https://… npm run test:e2e`.

## What is not covered by automated tests yet

Sign-up and sign-in, saved layouts and clients against a real database, Stripe checkout and
webhooks end to end, and the admin area. The pure logic behind billing and themes is unit-tested;
the wiring is not. Suggested next tests once the app runs: a Playwright sign-up → save layout →
reload flow using the embedded database, and a webhook test using Stripe's CLI fixtures.

## Sample data

Everything in `/fixtures` and in layout fixtures is fictional ("Northwind Supply Co.", account
`000123456789`). Never add real customer data to the repository, a fixture or a support ticket.
