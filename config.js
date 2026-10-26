// Налаштування Соняха. Змінюй тут, код чіпати не треба.
window.SONYAKH_CONFIG = {
  // Твоє ім'я для екрана «Підтримати автора»
  authorName: 'Цівка Микола',

  // Посилання на банку (наприклад, https://send.monobank.ua/jar/...).
  // Поки порожнє, кнопка показує «Посилання з'явиться незабаром».
  donateUrl: 'https://send.monobank.ua/jar/9UaUS32dTC',

  // Сервер Supabase для подяк, порад від батьків і запропонованих новин.
  // Обидва значення публічні: доступ обмежують правила бази (supabase/schema.sql).
  // Якщо змінюєш адресу, онови її також у connect-src в index.html.
  supabaseUrl: 'https://fgehezlyxczdxjmsiyfj.supabase.co',
  supabaseKey: 'sb_publishable_4fbrLrar5vQvV2T88WVFHQ_w2flPMGo',

  // Публічний ключ сайту Cloudflare Turnstile (перевірка «я не робот»).
  // Якщо порожній: записи йдуть у Supabase напряму, без перевірки.
  turnstileSiteKey: '0x4AAAAAAFlLB59Sp8H1t2xI',

  // Назва серверної функції в Supabase, яка перевіряє Turnstile (код: supabase/functions/submit)
  submitFunction: 'smooth-task',

  // Код сайту в GoatCounter (статистика відвідувань без cookies), наприклад 'sonyakh'.
  // Якщо порожній: статистика вимкнена. Код також прописаний у CSP в index.html.
  goatcounterCode: 'sonyakh',

  // Telegram-канал з добрими новинами (без @). Порожній — посилання на канал не показуються.
  telegramChannel: 'sonyakh56'
};
