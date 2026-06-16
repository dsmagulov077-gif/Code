-- Система персонажей: купленные и активный бадди.
alter table public.game_progress
  add column if not exists owned_buddies text[] not null default '{"default"}',
  add column if not exists active_buddy  text   not null default 'default';
