-- Сонях: таблиці для подяк, порад від батьків і запропонованих новин.
-- Вставити цілком у Supabase › SQL Editor › New query і натиснути Run. Можна запускати повторно.
--
-- Правила безпеки (Row Level Security):
--   • будь-хто може ДОДАТИ подяку, пораду чи новину, але лише як «не схвалену»;
--   • читати можна тільки СХВАЛЕНІ подяки й поради;
--   • змінювати чи видаляти записи з сайту не можна. Схвалюєш ти в таблиці Supabase.

-- ---------- Подяки ----------
create table if not exists public.thanks (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  to_whom     text not null check (char_length(to_whom) between 1 and 60),
  text        text not null check (char_length(text) between 1 and 300),
  name        text not null default '' check (char_length(name) <= 60),
  approved    boolean not null default false,
  warm        integer not null default 0
);

-- ---------- Поради від мам і тат ----------
create table if not exists public.tips (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  text        text not null check (char_length(text) between 1 and 400),
  age         text not null default '' check (age in ('', 'baby', 'preschool', 'school', 'teen')),
  who         text not null default '' check (char_length(who) <= 60),
  approved    boolean not null default false
);

-- ---------- Запропоновані добрі новини ----------
create table if not exists public.news_suggestions (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  title       text not null check (char_length(title) between 1 and 140),
  link        text not null default '' check (char_length(link) <= 300),
  reviewed    boolean not null default false
);

alter table public.thanks enable row level security;
alter table public.tips enable row level security;
alter table public.news_suggestions enable row level security;

-- Додавати: лише нове й несхвалене
drop policy if exists "Будь-хто може додати подяку" on public.thanks;
create policy "Будь-хто може додати подяку" on public.thanks
  for insert to anon, authenticated with check (approved = false and warm = 0);

drop policy if exists "Будь-хто може додати пораду" on public.tips;
create policy "Будь-хто може додати пораду" on public.tips
  for insert to anon, authenticated with check (approved = false);

drop policy if exists "Будь-хто може запропонувати новину" on public.news_suggestions;
create policy "Будь-хто може запропонувати новину" on public.news_suggestions
  for insert to anon, authenticated with check (reviewed = false);

-- Читати: лише схвалене (запропоновані новини бачиш тільки ти в Supabase)
drop policy if exists "Усі бачать схвалені подяки" on public.thanks;
create policy "Усі бачать схвалені подяки" on public.thanks
  for select to anon, authenticated using (approved = true);

drop policy if exists "Усі бачать схвалені поради" on public.tips;
create policy "Усі бачать схвалені поради" on public.tips
  for select to anon, authenticated using (approved = true);

-- Кнопка «Тепло»: +1 до схваленої подяки (більше нічого змінити не можна)
create or replace function public.warm_thanks(thanks_id bigint)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.thanks set warm = warm + 1
  where id = thanks_id and approved = true
  returning warm;
$$;
revoke all on function public.warm_thanks(bigint) from public;
grant execute on function public.warm_thanks(bigint) to anon, authenticated;
