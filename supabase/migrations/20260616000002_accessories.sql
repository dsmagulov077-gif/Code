-- Добавляем таблицы аксессуаров: куплено и надето.
alter table public.game_progress
  add column if not exists owned_accessories    text[] not null default '{}',
  add column if not exists equipped_accessories text[] not null default '{}';
