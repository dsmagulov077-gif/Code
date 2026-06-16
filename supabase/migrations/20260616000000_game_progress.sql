-- Таблица прогресса игры: одна строка на пользователя.
-- Применяется командой: npm run db:push

create table if not exists public.game_progress (
  user_id      uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  coins        integer not null default 0,
  total_damage integer not null default 0,
  owned_weapons text[]  not null default '{}',
  updated_at   timestamptz not null default now()
);

alter table public.game_progress enable row level security;

create policy "read own progress"
  on public.game_progress for select
  using (auth.uid() = user_id);

create policy "upsert own progress"
  on public.game_progress for insert
  with check (auth.uid() = user_id);

create policy "update own progress"
  on public.game_progress for update
  using (auth.uid() = user_id);
