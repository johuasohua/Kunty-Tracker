# Kunty Tracker

Household finance tracker for Josh & Kiki — mortgage, income/spend dashboard,
transactions, credit card tracking, budgets, recurring bills, and voice
capture. iOS-styled, installable as a PWA, backed by Supabase.

## Status

**All core phases complete** — dashboard (balance, category cards grid,
monthly review), transactions (search + filters), mortgage + offset ledger,
credit cards, budgets (incl. per-person and history-based suggestions),
recurring bills, voice capture with batch parsing, category management in
Settings, and the historical Excel import pipeline.

Logging a transaction in the **Mortgage** or **Offset** category also
populates the mortgage payment ledger automatically (offset deposits update
the latest period; mortgage payments open the next period — edit the P/I
split on the Mortgage tab afterwards).

## Setup

### 1. Create a Supabase project

Recommended backend for this app: **Supabase** (hosted Postgres + auth +
REST/realtime API). Free tier is plenty for a 2-user household app.

Tradeoffs to be aware of:
- Free tier projects pause after a week of inactivity (auto-resumes on next
  request, ~a few seconds of cold-start latency) — fine for a household app.
- All data lives in one Postgres database; Row Level Security is used to
  gate access to "authenticated household members" rather than per-user
  silos, since both of you should see all data.
- You are trusting Supabase (a third party) with your household financial
  data. It's encrypted at rest and in transit, but worth knowing.

Steps:
1. Create a project at [supabase.com](https://supabase.com).
2. In **Authentication → Providers**, ensure **Email** (magic link / OTP) is
   enabled. In **Authentication → URL Configuration**, add your dev URL
   (`http://localhost:3000`) and your production URL as allowed redirects.
3. In **Authentication → Users**, invite/add the two email addresses you and
   your wife will sign in with (or just sign in from the app — magic link
   creates the account on first use).
4. Run the SQL in `supabase/migrations/0001_init.sql` via the Supabase SQL
   Editor (or `supabase db push` if you have the Supabase CLI linked to the
   project).
5. Copy `.env.local.example` to `.env.local` and fill in the three values
   from **Project Settings → API**.

### 2. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with a magic
link, then set your active profile (Josh/Kiki) from Settings.

### 3. Historical data import

Once the schema is live, drop your existing tracker workbook at
`data/Kiki___Josh_Exp_tracker.xlsx` (already git-ignored) and run the import
script — added in a later phase — to seed mortgage history, transactions,
categories, budgets, and recurring bills.

## Deploying to Vercel

1. **Import the repo** in Vercel (framework preset: Next.js — no custom
   config needed).
2. **Environment variables** (Project → Settings → Environment Variables),
   same three as `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; never referenced by client
     code — keep it out of `NEXT_PUBLIC_*`)
3. **Supabase redirect URLs** — without this, magic-link sign-in silently
   redirects to localhost. In the Supabase dashboard, open
   **Authentication → URL Configuration** and set:
   - **Site URL**: `https://<your-app>.vercel.app`
   - **Additional Redirect URLs**:
     - `https://<your-app>.vercel.app/**`
     - `http://localhost:3000/**` (keep local dev working)
     - `https://*-<your-team>.vercel.app/**` if you want preview deploys to
       sign in too.

   The app requests `emailRedirectTo: window.location.origin`, so it works
   on any domain you allow here — a custom domain later just needs adding to
   this list.
4. **Database**: make sure every file in `supabase/migrations/` has been run
   (in order) in the Supabase SQL editor of the production project.
5. Sign in once from the deployed URL, add the app to your home screen, and
   set the active profile in Settings.

## Tech

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4, iOS Human Interface Guidelines-inspired design system
  (`src/app/globals.css` for tokens, `src/components/ui` for primitives)
- Supabase (Postgres + Auth), accessed directly from the browser client
  (`src/lib/supabase/client.ts`) — no custom backend server needed
- PWA manifest + icons for "Add to Home Screen" on iOS
