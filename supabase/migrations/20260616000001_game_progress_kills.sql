-- Добавляем счётчик убийств и максимальное HP бадди.
-- Применяется командой: npm run db:push

alter table public.game_progress
  add column if not exists kills   integer not null default 0,
  add column if not exists max_hp  integer not null default 100;
