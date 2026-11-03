# Сонях — інструкції для Claude

Сайт: https://sonyakh.pp.ua (GitHub Pages, гілка `main`). Автор: Микола Цівка.
Спілкування з автором — українською, простими словами (автор не програміст).

## Як доставляти зміни (правило автора)

Завжди так, без додаткових питань:
1. Перед роботою підтягнути свіжий `main` (робот постійно комітить туди новини й графіки).
2. Зробити зміни в робочій гілці сесії, закомітити, запушити.
3. Створити PR у `main` з описом українською.
4. **Самому злити PR** (merge), не чекаючи автора, і дати йому посилання.
5. Якщо PR конфліктує з `main` (найчастіше `data/news.json` або `data/outages.json`) — підтягнути `main`, розв'язати, потім зливати.

Пушити напряму в `main` без PR — не можна.

## Що де лежить

- `index.html`, `styles.css`, `app.js` — увесь застосунок (PWA, маршрути `#/shelter`, `#/news`, `#/power`, `#/thanks`, `#/kids`, `#/game`, `#/color`, `#/diff`, `#/tales`, `#/support`).
- `config.js` — налаштування: банка, Supabase, Turnstile, GoatCounter, Telegram-канал.
- `sw.js` — service worker. **Після змін у коді чи вигляді збільшити `VERSION`** (`sonyakh-vN` → `sonyakh-vN+1`), інакше телефони не оновляться. Для змін лише в `data/*.json` не потрібно.
- `data/news.json` — дошка добрих новин; `data/outages.json` — графіки світла; `data/thanks.json`, `data/tips.json` — подяки й поради.
- `scripts/collect-news.mjs` — робот новин (щогодини о :20, `.github/workflows/news.yml`), потім `post-telegram.mjs` публікує в Telegram.
- `scripts/good-news-keywords.mjs` — безкоштовний відбір новин: `BAD` (стоп-слова), `BAD_URL` (рубрики сайтів), `GOOD` (слова з вагою і темою), `SPORT_ANCHORS`.
  Якщо автор скаржиться на погану новину — додати слово/фразу в `BAD` або рубрику в `BAD_URL`, перевірити `node scripts/collect-news.mjs --dry` і прибрати таку новину з `data/news.json`.
- `scripts/collect-outages.mjs` — робот графіків (кожні 15 хв, Львівобленерго і ДТЕК).
- `supabase/` — схема бази, антиспам, серверна функція `submit` (Turnstile).

## Перевірка

- Локально: `python -m http.server 8321` → http://localhost:8321 (демо графіка: `?demo#/power`).
- Новини без запису: `node scripts/collect-news.mjs --dry` (потрібен `npm ci`).

## Ніколи

- Не додавати в код паролі, `service_role`/secret ключі Supabase, токени.
- Не обходити захист сайтів ДТЕК від роботів.
