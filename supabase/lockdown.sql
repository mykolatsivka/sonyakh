-- Сонях, шар 3: закрити прямий запис у базу. Відтепер подяки, поради й новини
-- потрапляють у базу ТІЛЬКИ через функцію з перевіркою Cloudflare «я не робот».
-- Вставити цілком у Supabase › SQL Editor › New query і натиснути Run.
-- Повернути як було: ще раз запустити supabase/schema.sql.

-- Видаляємо всі правила, що дозволяють ДОДАВАТИ записи, незалежно від їхньої назви
do $$
declare
  p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('thanks', 'tips', 'news_suggestions')
      and cmd in ('INSERT', 'ALL')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- Перевірка: має повернути 0 рядків (жодного правила на додавання не лишилось)
select tablename, policyname, cmd from pg_policies
where schemaname = 'public'
  and tablename in ('thanks', 'tips', 'news_suggestions')
  and cmd in ('INSERT', 'ALL');
