@AGENTS.md

# Kunty Tracker

A private household finance tracker for two people (Josh & Kiki). Installable
PWA with an iOS Human-Interface-Guidelines look. Tracks transactions, a
monthly/annual dashboard, mortgage + offset account, credit-card balances,
budgets, and recurring bills.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** — note the AGENTS.md
  warning: this Next.js version has breaking changes vs. training data; check
  `node_modules/next/dist/docs/` before writing framework code.
- **Supabase** (Postgres + hosted auth + RLS) — the only backend.
- **Tailwind CSS v4** with a custom iOS design-token system in
  `src/app/globals.css` (`--ios-*` colors, light/dark, safe-area insets).
- **Recharts** for charts, **lucide-react** for icons, **clsx** for classes.
- TypeScript throughout.

## Commands

- `npm run dev` — dev server (Turbopack) on :3000
- `npm run build` — production build (also runs `tsc`)
- `npm run lint` — ESLint
- `npx tsc --noEmit` — typecheck only

Before considering a change done, run **all three**: `tsc --noEmit`, `lint`,
and `build`. Lint currently emits ~14 **warnings** (all
`react-hooks/set-state-in-effect` from data-fetch-on-mount hooks) —
intentionally downgraded to warnings in `eslint.config.mjs`. **Zero errors is
the bar**; do not try to "fix" those warnings.

## Architecture

Single responsive codebase (Tailwind breakpoints), not separate mobile/desktop
apps. `md:` is the mobile↔desktop breakpoint.

- `src/app/*/page.tsx` — one route per feature (dashboard, transactions,
  mortgage, credit-cards, budgets, recurring, settings, login, more, voice).
- `src/components/<feature>/` — feature UI; `src/components/ui/` — iOS
  primitives (Card, Sheet, Button, SegmentedControl, ListRow, PageHeader,
  EmptyState, CategoryIcon); `src/components/nav/` — AppShell (auth guard +
  layout), Sidebar (desktop), TabBar/TopBar/MicFAB (mobile), ProfileSwitcher.
- `src/lib/queries/*.ts` — one module per table area. Each exposes a
  `use…()` hook (fetch on mount via `useEffect(refresh)`) plus
  `create/update/delete` functions. This is the standard data pattern —
  follow it for new tables.
- `src/lib/aggregate.ts` — **all derived numbers live here as pure functions**
  (monthly balance series, category breakdowns, insights, CC balance series,
  budget progress, upcoming bills, offset/mortgage helpers). Keep it pure and
  unit-testable; do not push aggregation into components or SQL views.
- `src/lib/types.ts` — shared TS interfaces mirroring the DB schema.
- `src/lib/format.ts` — money/date/axis formatting (`formatMoney`,
  `formatMoneyCompact`, `formatAxisTick`, `monthKey`, `monthLabel`).
- `src/lib/auth-context.tsx` / `profile-context.tsx` — session + Josh/Kiki
  active-profile (persisted in localStorage).
- `src/lib/supabase/` — `client.ts` (browser, anon key), `admin.ts`
  (service-role, server-only), `config.ts` (`isSupabaseConfigured()`).

## Data model & conventions

- Migrations in `supabase/migrations/` (`0001` schema, `0002` category seed,
  `0003` recurring-bill frequency). **Apply them manually in the Supabase SQL
  editor** — there is no automated migration runner. When you write a
  migration, hand the SQL to the user; never assume it's been applied.
- **RLS**: shared-household model — any authenticated user reads/writes
  everything (only two users ever exist). `api_tokens` is service-role only.
- **Categories are data, not code** — names/icons/colors live in the DB and the
  app reads them dynamically. Renaming a category is a DB update, not a code
  change. Each has `treat_as`: `expense` | `income` | `offset` (offset, e.g.
  Refunds, *reduces* expense totals).
- **Person vs. account**: `transactions.person_id` is who logged/incurred the
  expense; `payment_method` is credit/debit. (A `payment_accounts` refactor to
  separate "who logged it" from "which card was charged" is planned but not
  yet built.)
- **Credit cards**: current-month spend and carry-over are *derived* from
  transactions + `cc_payments`, not stored. `opening_cc_balances` seeds the
  first month. See `buildCcSeries`.
- **Mortgage**: `mortgage_payments` mirrors the spreadsheet's "LIV" tab. The
  offset account is tracked via the `offset_*` columns on the same rows,
  surfaced through the Offset panel/history on the Mortgage tab. HOI is a
  fixed monthly charge. Don't alter the closing-principal calc engine when
  touching adjacent fields.

## Working with real data / Supabase from this environment

- Credentials live in `.env.local` (gitignored; template in
  `.env.local.example`). The app needs `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Node scripts hitting Supabase must run from the repo root** (to resolve
  `@supabase/supabase-js`) with `NODE_USE_ENV_PROXY=1` and env sourced:
  `set -a; source .env.local; set +a; NODE_USE_ENV_PROXY=1 node scripts/x.mjs`.
  Plain `node` fetch does not honor the sandbox proxy without that flag.
- **The sandboxed Chromium cannot reach `*.supabase.co` directly.** To
  screenshot the app with live data, dump DB rows to JSON and serve them to the
  browser via Playwright request interception against the supabase host, with
  an injected fake session in `localStorage` (key
  `sb-<project-ref>-auth-token`). See prior screenshot scripts for the pattern.
- `scripts/` holds the Excel import pipeline: `parse-tracker.py` (xlsx →
  import.json, validates against the sheet's own pivot tables),
  `import-tracker.mjs` (wipe + insert), `validate-import.mjs` (re-check live DB
  vs. sheet). Source workbooks in `data/*.xlsx` are gitignored — only tooling
  is committed, never financial data.

## Spreadsheet import gotchas (the source of truth is the user's xlsx)

- The sheet dates each month's **salary in the *previous* calendar month**;
  the app groups by real date, so income must be re-dated to its tab month
  (see `scripts/fix-income-dates.mjs`). Monthly totals must reconcile against
  the "Overview" and "Balances" sheets and the per-tab pivot columns (H+).
- Blank transaction dates are carried forward from the nearest dated row above.
- LIV dates are DD.MM.YYYY text.

## Conventions to match

- iOS styling via `--ios-*` tokens and the `ui/` primitives — don't hand-roll
  buttons/cards/sheets. Money always through `formatMoney` (AED).
- Modals/forms use the `Sheet` primitive (bottom sheet on mobile, centered on
  desktop). New form inputs copy the existing rounded-xl bordered style.
- Commit per phase with descriptive messages; run tsc/lint/build first.
