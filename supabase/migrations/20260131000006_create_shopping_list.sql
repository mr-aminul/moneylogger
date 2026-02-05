-- Shopping list / checklist: items you need to buy (e.g. eggs, milk)
create table public.shopping_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  completed boolean not null default false,
  due_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.shopping_list enable row level security;

create policy "Users can manage own shopping_list"
  on public.shopping_list for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index shopping_list_user_id_idx on public.shopping_list(user_id);
create index shopping_list_completed_due_idx on public.shopping_list(user_id, completed, due_date);
