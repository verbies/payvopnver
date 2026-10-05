# Bank layouts

## The rule

**Never publish a bank format that isn't traceable to the bank's own written specification.**
The software enforces part of this: a layout for a real (non-sample) bank cannot be published
without a source URL and a verified date, and no layout can be published unless its regression
test passes. The rest is on you: read the specification, don't guess.

## What ships today

| Bank | Status | Notes |
| --- | --- | --- |
| Example Community Bank, Example National Bank, Example Trust Bank, Example Credit Union | Published, marked **Sample** | Fictional banks with made-up formats, so the product can be tried and tested. Hidden from search engines. **Unpublish them before launch** (Admin → Banks). |
| Rockland Trust — issue file | **Draft, hidden** | Built from a machine reading of the bank's public guide. Not verified by a person. |
| Huntington Bank — delimited, with and without payee verification | **Draft, hidden** | Same. The layout file's notes list open questions (void handling in particular). |

The two real-bank drafts exist to save you typing, not to be trusted. Open each bank's guide
(the URL is in the layout file and in Admin → Layouts), check every field, resolve the questions
in the notes, then publish.

## Anatomy of a layout file

`layouts/<bank-slug>/<layout-slug>.v<version>.json`, plus one `bank.json` per bank folder.

```jsonc
{
  "bank": "first-national",            // folder name
  "layout": "payee-match",
  "name": "Positive Pay — payee match",
  "kind": "payee",                     // "standard" or "payee" (payee = Business plan and up)
  "summary": "One line shown in the picker.",
  "version": 1,
  "status": "draft",                   // draft | published | retired
  "effectiveDate": "2026-10-05",
  "source": { "url": "https://bank.example/positive-pay-spec.pdf", "document": "Issue File Specifications", "verifiedOn": "2026-10-05" },
  "notes": "Anything the next person should know.",
  "definition": { /* see src/engine/layout.ts — every option is documented there */ },
  "fixture": {
    "input": "Check Number,Check Date,Payee,Amount\r\n...",     // synthetic CSV
    "inputFileName": "fixture.csv",
    "mapping": { "hasHeader": true, "columns": { "checkNumber": "Check Number", "date": "Check Date", "payee": "Payee", "amount": "Amount", "memo": null, "type": null, "voidFlag": null }, "dateOrder": "MDY", "amountSign": "asIs", "voidRule": { "kind": "none" }, "typeInclude": null },
    "inputs": { "accountNumber": "000123456789" },                // made-up values
    "today": "2026-10-05",
    "excludedRows": [],
    "expected": "000123456789,10021,1200.00,10/01/2026,I\r\n"    // the exact file, line endings included
  }
}
```

### Definition options at a glance

- `format`: `delimited` (with `delimiter`, `quoting`: `never` / `minimal` / `always`) or `fixed`.
- `lineEnding` (`CRLF`/`LF`), `finalNewline`, `charset` (`ascii` rejects anything else — it never transliterates), `fileExtension`.
- `header`: `null`, `"names"` (a row of field names) or `{ "fields": [...] }`; `trailer`: `null` or `{ "fields": [...] }`.
- `fields[]`: `source` is one of `checkNumber`, `date` (`dateFormat`: `YYYY`/`YY`, `MM`/`M`, `DD`/`D` plus `/ - .`), `amount` (`amountStyle`: `decimal` → `1200.00`, `implied` → `120000`), `payee`, `memo`, `voidIndicator` (`issuedValue`/`voidValue`), `input` (`inputKey`), `literal` (`value`), `filler`; header/trailer also allow `recordCount`, `totalAmount`, `fileDate`.
- Per field: `width`, `align`, `pad`, `maxLength`, `overflow` (`error` by default; `truncate` only if the bank's spec says to cut), `required`, `transform: "uppercase"`, `characters`, `numericOnly`.
- `voids.handling`: `include` (needs a `voidIndicator` field), `omit`, or `reject`; `voids.requireAmount` if the bank needs a void's original amount.
- `inputs[]`: values typed at conversion time and never saved (account numbers). Always `sensitive: true`.
- `maxRecords` if the bank documents a limit.

## Add a new bank (the repository way — recommended)

1. Create `layouts/<bank-slug>/bank.json`:
   ```json
   { "slug": "first-national", "name": "First National Bank", "demo": false, "website": "https://…", "about": "One sentence in your own words." }
   ```
2. Create `layouts/<bank-slug>/<layout-slug>.v1.json` (copy the closest example file). Set `"status": "draft"`.
3. Write the **definition** with the bank's specification open beside you.
4. Write the **fixture**: a small synthetic input, and the `expected` output typed by hand from the
   specification — not copied from the converter. That independence is what makes the test meaningful.
   Use `\r\n` in the JSON string wherever the file uses Windows line endings.
5. Run `npm test`. Each layout gets four tests: valid definition, source recorded, exact output, and
   a check that a one-character difference is detected.
6. When it passes and you've verified it against the bank, set `"status": "published"`, fill in
   `source.url` and `source.verifiedOn`, commit, and deploy. `npm run db:seed` (part of `db:setup`)
   adds it to the database. Real banks are created as **draft** banks: publish the bank and write
   its page content in Admin → Banks.

## Add or edit in the admin area (no code)

Admin → Banks → Add a bank → Add a layout → edit the definition, source and fixture → **Run test
now** → **Save draft** → **Publish this version**. Then use **Export as a layout file** and commit
the downloaded JSON into `/layouts` so the automated tests cover it too.

## When a bank changes its format

Never edit a published version. Either:

- **Repository:** copy `payee-match.v1.json` to `payee-match.v2.json`, set `"version": 2`, make the
  change, update the fixture, run `npm test`, deploy; or
- **Admin:** open the layout → **Start a new version** → edit → test → publish.

Customers automatically get the newest published version. Retire the old one once the new one is
live. If the seed finds a stored version that differs from its file, it stops and tells you to
create a new version rather than overwriting.

## Create a regression test for an existing layout

The fixture *is* the regression test. To add cases (voids, long payees, a different date range),
either extend the fixture's input and expected output, or add a second version-independent test in
`tests/unit/` using the helpers in `tests/unit/helpers.ts`.

## Bank page content

Admin → Banks → (bank): search title and description, what the bank requires, QuickBooks export
steps, warnings, questions and answers, and links to the bank's official documentation. Write in
your own words; link to the bank's guide rather than copying it. Every bank page automatically
carries a "not affiliated" statement.
