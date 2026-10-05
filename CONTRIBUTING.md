# Contributing

## Principles (in priority order)

1. **Correctness over features.** If the converter cannot be sure, it stops and asks.
2. **Privacy over data collection.** Nothing from a customer's file leaves their browser.
3. **Simplicity over cleverness.** One person has to be able to run this.

## Before you open a pull request

```bash
npm run check       # typecheck, lint, unit tests (includes every bank layout)
npm run test:e2e    # if you touched the converter
```

## Rules that are easy to break by accident

- **`src/engine` stays pure.** No network, DOM, storage, React or server imports. Lint enforces it.
- **Money is `bigint` cents.** Never `number`, never `parseFloat`, never rounding.
- **Check dates are `CivilDate`.** Never `new Date(string)`.
- **Engine messages never include cell values.** Row numbers and field names only.
- **The converter reports usage only through `track()`.** Don't add fields to it that could hold
  free text. Don't add third-party scripts; the Content-Security-Policy will block them anyway.
- **Never store** check files, check numbers, payees, amounts or account numbers — not in the
  database, `localStorage`, cookies, logs or analytics.
- **Published layout versions are immutable.** A change is a new version with its own fixture.
- **Every server action starts with `requireViewer()` or `requireAdmin()`** and scopes its queries
  by `userId`.
- **Prices and limits come from `src/config/plans.ts`.** Don't write "$12" or "10 checks" in a component.
- **Colors come from tokens.** No hex values in components.

## Conventions

- TypeScript strict mode; no `any` without a comment explaining why.
- Database reads for pages go in `src/server/queries.ts`; writes go in `src/server/actions/`.
- User-facing text: plain verbs, sentence case, say what happened and what to do next. Errors
  reassure about the file ("it has not been uploaded or changed") where relevant.
- A schema change needs both `schema.ts` and a new SQL file in `/drizzle`.
- New help answers go in `src/content/help.ts`.
