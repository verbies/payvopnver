# Name, logo and colors

Branding is deliberately not locked in. Three places control it.

## Product name

`src/config/site.ts` → `name`. Every page, email and page title reads it from there. The legal
entity name and support address come from `NEXT_PUBLIC_LEGAL_NAME` and `NEXT_PUBLIC_SUPPORT_EMAIL`.

## Logo

`src/components/site/logo.tsx` holds a temporary mark and text. Replace the `<svg>` with your
artwork (or an image) and the text with your wordmark; every header, footer and auth page uses
that one component. Replace `src/app/icon.svg` for the browser tab icon.

Icons throughout the product come from the `lucide-react` set; swap individual imports if you
draw your own.

## Colors

Every color is a design token: a CSS variable defined once in `src/app/globals.css`, with a light
value in the `@theme` block and a dark value under `[data-theme="dark"]`. Components use only
tokens (`bg-surface`, `text-muted`, `border-border`, `bg-primary`…); none hard-codes a color.

| Token | Used for |
| --- | --- |
| `background`, `surface`, `raised` | Page, cards, subtle fills |
| `text`, `muted`, `border` | Text, secondary text, lines |
| `primary`, `primary-fg` | Main buttons and highlights, and the text on them |
| `secondary` | Links and focus rings |
| `accent` | Occasional emphasis |
| `success`, `warning`, `danger`, `info` | Status |

**To change the theme by hand:** edit the hex values in both blocks of `globals.css`, and mirror
them in `DEFAULT_THEME` in `src/lib/theme/tokens.ts`. `npm test` checks that the two match and
that every text/background pairing still meets WCAG contrast.

Fonts are IBM Plex Sans, Plex Sans Condensed (headings) and Plex Mono (file previews), self-hosted
from npm packages. Change the `--font-*` tokens and the imports at the top of `src/app/layout.tsx`.

## Light, dark and system

The switcher is in the header (quick toggle), the footer and Settings (light / dark / system). The
choice is stored on the device and applied before first paint, so there is no flash.

## The theme generator — `/admin/theme`

For trying visual directions without touching code (admins only).

1. **Generate theme** — creates a coordinated light + dark palette. Each candidate is checked
   against 18 contrast requirements per mode; anything that fails is discarded before you see it.
2. Look at the **light and dark previews** (buttons, cards, table, form, validation states, drop
   zone), the **token table** and the **contrast checks**.
3. **Generate another** as often as you like; earlier ones stay in "Generated this session".
4. **Apply** — previews the palette across the whole site *in your browser only*.
5. **Reset** — back to the built-in theme on your device.
6. **Save** — stores the palette under a name. **Make live** switches every visitor to it
   immediately (only palettes that pass every check can go live); "Built-in theme → Make live"
   switches back.
7. **Export CSS** — copies the two token blocks. Paste them over the color tokens in
   `globals.css` (and update `DEFAULT_THEME`) to make a palette the permanent default.

A generated palette is a starting point for your brand work, not a replacement for it.
