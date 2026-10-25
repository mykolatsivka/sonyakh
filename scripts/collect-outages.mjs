// Робот, який збирає графіки відключень з сайтів обленерго і складає їх у data/outages.json.
// Запуск: node scripts/collect-outages.mjs   (потрібен Node 20 або новіший)
// Нічого не обходить: якщо сайт не віддає дані звичайному запиту, область лишається з попередніми даними.
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);
const OUT = new URL('data/outages.json', ROOT);
const USER_AGENT = 'Sonyakh/1.0 (free outage schedule viewer for Ukrainians)';
const TZ = 'Europe/Kyiv';

const kyivDate = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date);

async function get(url, type = 'text') {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'uk' },
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return type === 'json' ? res.json() : res.text();
}

// Зливає сусідні проміжки одного типу: [8:00–9:00] + [9:00–10:00] = [8:00–10:00]
function merge(intervals) {
  const sorted = intervals.slice().sort((a, b) => a.from - b.from);
  const out = [];
  for (const it of sorted) {
    const last = out[out.length - 1];
    if (last && last.type === it.type && last.to === it.from) last.to = it.to;
    else out.push({ ...it });
  }
  return out;
}

// ---------- ДТЕК: графік вбудований у сторінку як DisconSchedule.fact ----------
const DTEK_SLOTS = {
  no: [{ from: 0, to: 60, type: 'off' }],
  first: [{ from: 0, to: 30, type: 'off' }],
  second: [{ from: 30, to: 60, type: 'off' }],
  maybe: [{ from: 0, to: 60, type: 'maybe' }],
  mfirst: [{ from: 0, to: 30, type: 'maybe' }],
  msecond: [{ from: 30, to: 60, type: 'maybe' }]
};

async function collectDtek({ site }) {
  return parseDtekHtml(await get(`https://www.${site}.com.ua/ua/shutdowns`));
}

export function parseDtekHtml(html) {
  const match = html.match(/DisconSchedule\.fact\s*=\s*(\{[\s\S]*?\})\s*<\/script>/);
  if (!match) throw new Error('сайт не віддав графік (можливо, захист від роботів)');
  const fact = JSON.parse(match[1]);
  const days = [];
  const data = Array.isArray(fact.data) ? {} : fact.data || {};
  for (const [ts, groups] of Object.entries(data)) {
    const day = { date: kyivDate(new Date(Number(ts) * 1000)), groups: {} };
    for (const [key, hours] of Object.entries(groups)) {
      const label = key.replace(/^GPV/, '');
      const intervals = [];
      for (const [hour, value] of Object.entries(hours)) {
        const start = (Number(hour) - 1) * 60;
        for (const slot of DTEK_SLOTS[value] || []) {
          intervals.push({ from: start + slot.from, to: start + slot.to, type: slot.type });
        }
      }
      day.groups[label] = merge(intervals);
    }
    days.push(day);
  }
  return { days, sourceUpdated: fact.update || null };
}

// ---------- Львівобленерго: відкритий API з текстом графіка ----------
export function parseLoeText(html) {
  const text = html.replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ');
  const dateMatch = text.match(/на\s+(\d{2})\.(\d{2})\.(\d{4})/);
  if (!dateMatch) return null;
  const date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
  const updated = text.match(/станом на\s+(\d{2}:\d{2}\s+\d{2}\.\d{2}\.\d{4})/);
  const groups = {};
  for (const line of text.split('\n')) {
    const g = line.match(/Група\s+(\d+\.\d+)\.?\s*(.*)/);
    if (!g) continue;
    const intervals = [...g[2].matchAll(/з\s+(\d{1,2}):(\d{2})\s+до\s+(\d{1,2}):(\d{2})/g)].map((m) => ({
      from: Number(m[1]) * 60 + Number(m[2]),
      to: Number(m[3]) * 60 + Number(m[4]),
      type: 'off'
    }));
    groups[g[1]] = merge(intervals);
  }
  if (!Object.keys(groups).length) return null;
  return { date, groups, updated: updated ? updated[1] : null };
}

async function collectLoe() {
  const json = await get('https://api.loe.lviv.ua/api/menus?page=1&type=photo-grafic', 'json');
  const items = (json['hydra:member'] || [])[0]?.menuItems || [];
  const days = [];
  let sourceUpdated = null;
  for (const name of ['Today', 'Tomorrow']) {
    const item = items.find((i) => i.name === name);
    const parsed = item && item.rawHtml ? parseLoeText(item.rawHtml) : null;
    if (!parsed) continue;
    days.push({ date: parsed.date, groups: parsed.groups });
    sourceUpdated = sourceUpdated || parsed.updated;
  }
  return { days, sourceUpdated };
}

const COLLECTORS = { dtek: collectDtek, loe: collectLoe };

// ---------- Головний цикл (лише коли файл запущено напряму) ----------
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) await main();

async function main() {
const regions = JSON.parse(await readFile(new URL('data/regions.json', ROOT), 'utf8'));
let previous = { regions: {} };
try { previous = JSON.parse(await readFile(OUT, 'utf8')); } catch { /* перший запуск */ }

const now = new Date().toISOString();
const result = { updatedAt: previous.updatedAt || now, regions: {} };
let changed = false;

for (const region of regions) {
  if (!region.source) continue;
  const before = previous.regions?.[region.id];
  try {
    const { days, sourceUpdated } = await COLLECTORS[region.source.type](region.source);
    const entry = { status: 'ok', sourceUpdated, days, updatedAt: before?.updatedAt || now };
    if (JSON.stringify({ ...entry, updatedAt: 0 }) !== JSON.stringify({ ...before, updatedAt: 0 })) {
      entry.updatedAt = now;
      changed = true;
    }
    result.regions[region.id] = entry;
    console.log(`✓ ${region.name}: днів ${days.length}`);
  } catch (error) {
    // Лишаємо попередні дані, щоб людина бачила хоч щось
    const entry = { ...(before || { days: [], sourceUpdated: null, updatedAt: null }), status: 'stale' };
    if (before?.status !== 'stale') changed = true;
    result.regions[region.id] = entry;
    console.log(`✗ ${region.name}: ${error.message}`);
  }
}

if (changed || !previous.updatedAt) {
  result.updatedAt = now;
  await writeFile(OUT, JSON.stringify(result, null, 1) + '\n');
  console.log('Записано data/outages.json');
} else {
  console.log('Змін немає');
}
}
