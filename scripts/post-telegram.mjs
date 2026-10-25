// Робот Telegram-каналу: публікує добрі новини з data/news.json у канал Соняха.
// Не більше 3 новин на день, по одній за запуск, лише з 8:00 до 21:00 за Києвом.
// Запуск: node scripts/post-telegram.mjs          (потрібні TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID)
//         node scripts/post-telegram.mjs --dry    (лише показати, що було б опубліковано)
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);
const NEWS_FILE = new URL('data/news.json', ROOT);
const POSTED_FILE = new URL('data/telegram-posted.json', ROOT);
const DRY = process.argv.includes('--dry');
const SITE = 'https://sonyakh.pp.ua';
const MAX_PER_DAY = 3;
const HOURS = [8, 21];

const TOPIC_LABELS = { rebuild: 'Відбудова', people: 'Люди', sport: 'Спорт', animals: 'Тварини', science: 'Наука' };
const TOPIC_EMOJI = { rebuild: '🏗', people: '💛', sport: '🏆', animals: '🐾', science: '🔬' };

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const kyiv = (date = new Date()) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
};

export function formatPost(n) {
  const lines = [
    `🌻 <b>Добра новина</b> · ${TOPIC_EMOJI[n.topic] || '✨'} ${esc(TOPIC_LABELS[n.topic] || '')}`,
    '',
    `<b>${esc(n.title)}</b>`
  ];
  if (n.text) lines.push(esc(n.text));
  if (n.sourceUrl) lines.push('', `Джерело: <a href="${esc(n.sourceUrl)}">${esc(n.source || 'читати')}</a>`);
  lines.push('', `Більше тепла — у Соняху: ${SITE}`);
  return lines.join('\n');
}

async function main() {
  const news = JSON.parse(await readFile(NEWS_FILE, 'utf8'));
  let posted = { items: [] };
  try { posted = JSON.parse(await readFile(POSTED_FILE, 'utf8')); } catch { /* перший запуск */ }

  const now = kyiv();
  const postedIds = new Set(posted.items.map((i) => i.id));
  const today = posted.items.filter((i) => i.date === now.date).length;

  // Лише свіжі справжні новини (сьогодні або вчора), які ще не публікували
  const yesterday = kyiv(new Date(Date.now() - 86400000)).date;
  const candidate = news
    .filter((n) => !String(n.id).startsWith('sample-') && !postedIds.has(n.id) && (n.date === now.date || n.date === yesterday))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];

  if (!candidate) { console.log('Немає нових добрих новин для каналу'); return; }
  if (DRY) {
    console.log(`Було б опубліковано (сьогодні вже ${today} з ${MAX_PER_DAY}):\n\n${formatPost(candidate)}`);
    return;
  }
  if (today >= MAX_PER_DAY) { console.log(`Сьогодні вже ${today} новини в каналі, досить`); return; }
  // Ручний запуск на GitHub (FORCE_POST=true) публікує одразу, незалежно від години
  if (process.env.FORCE_POST !== 'true' && (now.hour < HOURS[0] || now.hour >= HOURS[1])) { console.log(`Зараз ${now.hour}:00 за Києвом, публікуємо з ${HOURS[0]} до ${HOURS[1]}`); return; }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) { console.log('Немає TELEGRAM_BOT_TOKEN або TELEGRAM_CHAT_ID: канал ще не налаштовано'); return; }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chat,
      text: formatPost(candidate),
      parse_mode: 'HTML',
      link_preview_options: { url: candidate.sourceUrl || SITE, prefer_small_media: true }
    })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram: ${data.description}`);

  posted.items.push({ id: candidate.id, date: now.date });
  posted.items = posted.items.slice(-500);
  await writeFile(POSTED_FILE, JSON.stringify(posted, null, 1) + '\n');
  console.log(`✓ Опубліковано в каналі: ${candidate.title}`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  await main();
}
