-- Сонях, шар 3: ЗАПУСКАТИ ЛИШЕ ПІСЛЯ того, як функція «submit» з Turnstile запрацювала.
-- Забороняє додавати записи напряму з сайту: відтепер вони потрапляють у базу тільки
-- через функцію, яка спершу перевіряє, що це людина, а не бот.
-- Повернути як було: ще раз запустити supabase/schema.sql.

drop policy if exists "Будь-хто може додати подяку" on public.thanks;
drop policy if exists "Будь-хто може додати пораду" on public.tips;
drop policy if exists "Будь-хто може запропонувати новину" on public.news_suggestions;
