-- Seed the category list observed in the household's existing tracker.
-- Editable later from Settings; this just avoids an empty picker on first run.
-- Idempotent: safe to re-run (e.g. after the historical import script).

insert into categories (name, treat_as, color, icon, sort_order) values
  ('Salary',       'income',  '#34C759', 'wallet',        0),
  ('Investments',  'income',  '#30B0C7', 'trending-up',   1),
  ('Instashop',    'expense', '#FF9500', 'shopping-cart', 10),
  ('Zomato',       'expense', '#FF3B30', 'utensils',      11),
  ('Bills',        'expense', '#5856D6', 'receipt',       12),
  ('Taxi',         'expense', '#FFCC00', 'car',           13),
  ('Shopping',     'expense', '#FF2D55', 'shopping-bag',  14),
  ('Lifestyle',    'expense', '#AF52DE', 'sparkles',      15),
  ('Travel',       'expense', '#007AFF', 'plane',         16),
  ('Maintenance',  'expense', '#8E8E93', 'wrench',        17),
  ('Mortgage',     'expense', '#5856D6', 'landmark',      18),
  ('Offset',       'expense', '#30B0C7', 'arrow-left-right', 19),
  ('Refunds',      'offset',  '#34C759', 'undo-2',        20)
on conflict (name) do nothing;
