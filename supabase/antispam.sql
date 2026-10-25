-- Сонях, захист від спаму (шар 2): правила на самому сервері, які не оминути навіть напряму.
-- Вставити цілком у Supabase › SQL Editor › New query і натиснути Run. Можна запускати повторно.
--   • не більше 20 нових записів на хвилину в кожну таблицю (від усіх разом);
--   • той самий текст двічі за добу не приймається;
--   • без посилань у подяках, порадах і заголовках новин;
--   • «Тепло» не більше 5 разів на хвилину для однієї подяки.

create or replace function public.sonyakh_antispam()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  body text;
  recent integer;
  dupes integer;
begin
  body := case tg_table_name
    when 'thanks' then new.text
    when 'tips' then new.text
    else new.title
  end;

  -- Посилання — головна ознака спаму
  if body ~* '(https?://|www\.|\m[a-z0-9-]+\.(com|net|org|ru|ua|info|xyz|top|io|me|ly)\M|t\.me/)' then
    raise exception 'links are not allowed' using errcode = '22023';
  end if;

  -- Забагато записів за останню хвилину: схоже на атаку бота
  execute format('select count(*) from public.%I where created_at > now() - interval ''1 minute''', tg_table_name)
    into recent;
  if recent >= 20 then
    raise exception 'too many submissions, try later' using errcode = '22023';
  end if;

  -- Той самий текст уже надсилали протягом доби
  execute format(
    'select count(*) from public.%I where created_at > now() - interval ''1 day'' and lower(%I) = lower($1)',
    tg_table_name, case tg_table_name when 'news_suggestions' then 'title' else 'text' end
  ) into dupes using body;
  if dupes > 0 then
    raise exception 'duplicate submission' using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists sonyakh_antispam on public.thanks;
create trigger sonyakh_antispam before insert on public.thanks
  for each row execute function public.sonyakh_antispam();

drop trigger if exists sonyakh_antispam on public.tips;
create trigger sonyakh_antispam before insert on public.tips
  for each row execute function public.sonyakh_antispam();

drop trigger if exists sonyakh_antispam on public.news_suggestions;
create trigger sonyakh_antispam before insert on public.news_suggestions
  for each row execute function public.sonyakh_antispam();

-- «Тепло» з обмеженням частоти
create table if not exists public.warm_events (
  thanks_id  bigint not null,
  at         timestamptz not null default now()
);
create index if not exists warm_events_recent on public.warm_events (thanks_id, at);
alter table public.warm_events enable row level security;  -- з сайту ця таблиця недоступна

create or replace function public.warm_thanks(thanks_id bigint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  result integer;
begin
  if (select count(*) from public.warm_events w
      where w.thanks_id = warm_thanks.thanks_id and w.at > now() - interval '1 minute') >= 5 then
    select warm into result from public.thanks where id = warm_thanks.thanks_id and approved = true;
    return result;
  end if;
  update public.thanks set warm = warm + 1
    where id = warm_thanks.thanks_id and approved = true
    returning warm into result;
  if result is not null then
    insert into public.warm_events (thanks_id) values (warm_thanks.thanks_id);
    delete from public.warm_events where at < now() - interval '1 day';
  end if;
  return result;
end;
$$;
revoke all on function public.warm_thanks(bigint) from public;
grant execute on function public.warm_thanks(bigint) to anon, authenticated;
