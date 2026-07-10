# Nice-to-Have / Future Features

Running backlog of optional enhancements — not blocking, revisit when there's
appetite. Add to this list rather than losing ideas in chat.

## Backlog

- [ ] **"Log for the other person" override** — profiles are currently
  auto-detected and locked to the logged-in user (Josh logs as Josh, Kiki as
  Kiki). Add an optional way to log an entry on the other person's behalf
  (e.g. Josh records an expense Kiki incurred) without unlocking the whole
  profile system.

- [ ] **LLM API for natural-language questions** — let the user ask questions
  about their finances in plain English (e.g. "how much did we spend on food
  last month?", "are we over budget on anything?") and get answers computed
  from the data. Would wire a Claude API call over the aggregate layer.

- [ ] **Net-worth snapshot** — a single view netting all the components the
  app already tracks (savings/assets, mortgage principal/liability, offset
  balance/asset, credit-card debt/liability) into one "you're worth X, up Y
  this month" figure. All inputs already exist in the aggregate layer. Picking
  this up once Goals is done.

- [ ] **"Who owes whom" settle-up between Josh & Kiki** — running tracker of
  who's covered more shared spend, with a settle-up action. person_id already
  records who incurred each expense.

- [ ] **Data export / monthly report** — CSV export or monthly PDF summary for
  records/taxes.

- [ ] **Receipt photos on transactions** — attach an image per transaction via
  Supabase Storage; pairs well with the foreign-currency travel flow.
