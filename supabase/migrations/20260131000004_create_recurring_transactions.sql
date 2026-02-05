-- Recurring transactions: subscriptions, rent, salary, etc.
create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  amount numeric not null check (amount >= 0),
  category text not null,
  type text not null check (type in ('expense', 'income')) default 'expense',
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')) default 'monthly',
  next_date date not null,
  note text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recurring_transactions enable row level security;

create policy "Users can manage own recurring_transactions"
  on public.recurring_transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index recurring_transactions_user_id_idx on public.recurring_transactions(user_id);
create index recurring_transactions_next_date_idx on public.recurring_transactions(user_id, next_date);
