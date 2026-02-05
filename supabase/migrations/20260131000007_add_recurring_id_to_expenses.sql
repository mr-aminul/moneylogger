-- Link an expense to an upcoming (recurring) item when user confirms "this is for that"
alter table public.expenses
  add column if not exists recurring_transaction_id uuid references public.recurring_transactions(id) on delete set null;

create index if not exists expenses_recurring_transaction_id_idx on public.expenses(recurring_transaction_id);

comment on column public.expenses.recurring_transaction_id is 'When set, this expense is recorded against this upcoming (recurring) item so we do not double-reserve.';
