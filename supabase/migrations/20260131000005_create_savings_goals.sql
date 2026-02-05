-- Savings goals / wishlist: "I want to buy this" with target amount and progress
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  target_amount numeric not null check (target_amount > 0),
  target_date date,
  current_amount numeric not null check (current_amount >= 0) default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.savings_goals enable row level security;

create policy "Users can manage own savings_goals"
  on public.savings_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index savings_goals_user_id_idx on public.savings_goals(user_id);
