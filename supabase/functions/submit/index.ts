// Сонях, захист від ботів (шар 3): серверна функція Supabase «submit».
// Сайт надсилає сюди подяки, поради й новини разом із токеном Cloudflare Turnstile.
// Функція перевіряє токен у Cloudflare і лише тоді записує дані в базу.
// Секрет Turnstile зберігається в Supabase › Edge Functions › Secrets як TURNSTILE_SECRET.
const ALLOWED_ORIGINS = [
  'https://sonyakh.pp.ua',
  'https://www.sonyakh.pp.ua',
  'https://mykolatsivka.github.io',
  'http://localhost:8330'
];
const MAX_ITEMS = 10;

// Тип запису → таблиця і поля, які дозволено заповнити
const TABLES: Record<string, { table: string; fields: string[] }> = {
  thanks: { table: 'thanks', fields: ['to_whom', 'text', 'name'] },
  tips: { table: 'tips', fields: ['text', 'age', 'who'] },
  news: { table: 'news_suggestions', fields: ['title', 'link'] }
};

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin'
  };
}

// Службовий ключ для запису в базу: у нових проєктах — SUPABASE_SECRET_KEYS (JSON), у старих — SUPABASE_SERVICE_ROLE_KEY
function serviceKey(): string {
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
    const first = keys.default ?? Object.values(keys)[0];
    if (typeof first === 'string' && first) return first;
  } catch { /* немає нових ключів */ }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
}

async function turnstileOk(token: string, ip: string | null): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET');
  if (!secret || !token) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const data = await res.json();
  return data.success === true;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '';
  const cors = corsHeaders(origin);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: 'origin not allowed' }, 403);

  let payload: { token?: string; items?: { type: string; data: Record<string, unknown> }[] };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'bad json' }, 400);
  }

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null;
  if (!(await turnstileOk(String(payload.token ?? ''), ip))) return json({ error: 'bot check failed' }, 403);

  const items = Array.isArray(payload.items) ? payload.items.slice(0, MAX_ITEMS) : [];
  const key = serviceKey();
  if (!key) return json({ error: 'no service key in function environment' }, 500);

  // Для кожного запису: ok (збережено), rejected (сервер ніколи не прийме) або retry (спробувати пізніше)
  const results: string[] = [];
  const errors: string[] = [];
  for (const item of items) {
    const spec = TABLES[item?.type];
    if (!spec || typeof item.data !== 'object' || item.data === null) {
      results.push('rejected');
      continue;
    }
    const row: Record<string, string> = {};
    for (const f of spec.fields) row[f] = String(item.data[f] ?? '');
    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/${spec.table}`, {
      method: 'POST',
      headers: {
        apikey: key,
        ...(key.startsWith('sb_') ? {} : { Authorization: `Bearer ${key}` }),
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(row)
    });
    if (res.ok) {
      results.push('ok');
      continue;
    }
    const err = await res.json().catch(() => ({}));
    errors.push(`${res.status} ${err.code ?? ''} ${err.message ?? ''}`.trim());
    results.push(/^(22|23)/.test(err.code ?? '') ? 'rejected' : 'retry');
  }
  return json(errors.length ? { results, errors } : { results });
});
