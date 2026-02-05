-- Add transaction type: expense (default) or income
alter table public.expenses
  add column if not exists type text not null default 'expense' check (type in ('expense', 'income'));

-- Backfill existing rows
update public.expenses set type = 'expense' where type is null;
