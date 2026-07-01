# Kunty Tracker

Household finance tracker for Josh & Kiki — mortgage, income/spend dashboard,
transactions, credit card tracking, budgets, recurring bills, and voice
capture. iOS-styled, installable as a PWA, backed by Supabase.

## Status

**Phase 1 (this commit): schema + app scaffold.**

- Database schema (`supabase/migrations/0001_init.sql`)
- Next.js 16 + Tailwind v4 app shell, iOS design system, responsive nav
  (sidebar on desktop, bottom tab bar + floating mic button on mobile)
- Supabase auth (magic link) + profile switcher (Josh/Kiki, no real per-user
  auth needed — this just tags entries)
- All tabs exist as routes with placeholder content; real functionality
  (dashboard charts, transaction entry, mortgage tables, budgets, recurring
  bills, voice parsing, historical Excel import) lands in later phases.

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

## Tech

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4, iOS Human Interface Guidelines-inspired design system
  (`src/app/globals.css` for tokens, `src/components/ui` for primitives)
- Supabase (Postgres + Auth), accessed directly from the browser client
  (`src/lib/supabase/client.ts`) — no custom backend server needed
- PWA manifest + icons for "Add to Home Screen" on iOS
