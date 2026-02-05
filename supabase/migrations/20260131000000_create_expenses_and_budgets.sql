-- Expenses: one row per expense, scoped by user
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  amount numeric not null check (amount >= 0),
  category text not null,
  date date not null,
  note text default '',
  created_at timestamptz not null default now()
);

-- Budgets: one row per (user, category), amount is the budget limit
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, category)
);

-- RLS
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;

create policy "Users can manage own expenses"
  on public.expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own budgets"
  on public.budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes for common filters
create index expenses_user_id_date_idx on public.expenses(user_id, date desc);
create index budgets_user_id_idx on public.budgets(user_id);
