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

// Дата й час за Києвом у вигляді «26.10.2026 14:28»
function kyivStamp(date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}`;
}

const SUBGROUPS = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'];
const toMin = (h, m) => Number(h) * 60 + Number(m);
const decodeHtml = (s) => s
  .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, '–')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&amp;/g, '&');
const stripTags = (html) => decodeHtml(html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, ''));
// Усі проміжки «08:00 – 12:00» у тексті
const timeRanges = (text) => [...text.matchAll(/(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/g)]
  .map((m) => ({ from: toMin(m[1], m[2]), to: toMin(m[3], m[4]), type: 'off' }))
  .filter((i) => i.to > i.from && i.to <= 1440);

// ---------- Запоріжжяобленерго: новини «ГПВ на 26 жовтня» з переліком підчерг ----------
const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

export function parseZoeHtml(html, now = new Date()) {
  const [curYear, curMonth] = kyivDate(now).split('-').map(Number);
  const days = new Map();
  let sourceUpdated = null;
  // Новини йдуть від найновішої, тож для кожної дати беремо першу знайдену
  for (const m of html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/g)) {
    const title = stripTags((m[1].match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || '');
    if (!/ГПВ/i.test(title) || /промисл|бізнес|ГОП|ГАВ/i.test(title)) continue;
    const dm = title.toLowerCase().match(/на\s+(\d{1,2})\s+([а-яіїєґ']+)/);
    const month = dm ? MONTHS.indexOf(dm[2]) + 1 : 0;
    if (!month) continue;
    // Січневий графік, опублікований у грудні, належить наступному року
    const year = month < curMonth - 6 ? curYear + 1 : month > curMonth + 6 ? curYear - 1 : curYear;
    const date = `${year}-${String(month).padStart(2, '0')}-${String(dm[1]).padStart(2, '0')}`;
    if (days.has(date)) continue;

    const body = stripTags(m[1].replace(/<h2[\s\S]*?<\/h2>/, ''));
    const groups = Object.fromEntries(SUBGROUPS.map((g) => [g, []]));
    let found = 0;
    for (const line of body.split('\n')) {
      const g = line.match(/^\s*(\d\.\d)\s*[:.]?\s*(.*)$/);
      if (!g || !groups[g[1]]) continue;
      groups[g[1]] = merge(groups[g[1]].concat(timeRanges(g[2])));
      found++;
    }
    // Без переліку підчерг беремо новину лише тоді, коли в ній прямо сказано, що відключень не буде
    if (!found && !/не\s+застосов|скасова|не\s+буде/i.test(body)) continue;
    days.set(date, { date, groups });
    if (!sourceUpdated) {
      const t = title.match(/оновлено\s+(\d{1,2}:\d{2})/i);
      sourceUpdated = t ? `${date.split('-').reverse().join('.')} ${t[1]}` : null;
    }
  }
  return { days: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)), sourceUpdated };
}

async function collectZoe() {
  return parseZoeHtml(await get('https://www.zoe.com.ua/outage/'));
}

// ---------- Миколаївобленерго: відкритий API сайту off.energy.mk.ua ----------
const MK_TYPES = { OFF: 'off', SURE_OFF: 'off', PROBABLY_OFF: 'maybe' };

export function parseMkSchedule(active, queues, series) {
  const slot = Object.fromEntries(series.map((s) => {
    const [h1, m1] = s.start.split(':');
    const [h2, m2] = s.end.split(':');
    const to = toMin(h2, m2) || 1440;
    return [s.id, { from: toMin(h1, m1), to }];
  }));
  const queueName = Object.fromEntries(queues.map((q) => [q.id, q.name]));
  const byDate = new Map();
  let latest = null;
  for (const schedule of active) {
    const date = kyivDate(new Date(schedule.from));
    const day = byDate.get(date) || { date, groups: Object.fromEntries(queues.map((q) => [q.name, []])) };
    // Як на сайті обленерго: «точно вимкнуть» важливіше за «можливо»
    const cells = new Map();
    for (const s of schedule.series || []) {
      const name = queueName[s.outage_queue_id];
      const type = MK_TYPES[s.type];
      if (!name || !type || !slot[s.time_series_id]) continue;
      const key = `${name}|${s.time_series_id}`;
      if (cells.get(key) !== 'off') cells.set(key, type);
      if (!latest || s.updated_at > latest) latest = s.updated_at;
    }
    for (const [key, type] of cells) {
      const [name, id] = key.split('|');
      day.groups[name].push({ ...slot[id], type });
    }
    byDate.set(date, day);
  }
  const days = [...byDate.values()].map((d) => ({
    date: d.date,
    groups: Object.fromEntries(Object.entries(d.groups).map(([g, list]) => [g, merge(list)]))
  }));
  return { days, sourceUpdated: latest ? kyivStamp(new Date(latest)) : null };
}

async function collectMk() {
  const base = 'https://off.energy.mk.ua/api';
  // Тип 3 — графіки погодинних відключень (ГПВ) з підчергами 1.1–6.2
  const [active, queues, series] = await Promise.all([
    get(`${base}/v2/schedule/active`, 'json'),
    get(`${base}/outage-queue/by-type/3`, 'json'),
    get(`${base}/schedule/time-series`, 'json')
  ]);
  return parseMkSchedule(active, queues.filter((q) => !q.deleted), series);
}

// ---------- Чернівціобленерго: таблиця на 48 півгодин для груп 1–12 ----------
const CV_CELLS = { 'в': 'off', 'мз': 'maybe' };

export function parseCvHtml(html) {
  const days = [];
  // Кожен блок графіка починається з дати, далі рядки груп id="inf1"…"inf12"
  const blocks = html.split(/<div id="gsv"/).slice(1);
  for (const block of blocks) {
    const dm = block.match(/<p>\s*(\d{2})\.(\d{2})\.(\d{4})/);
    if (!dm) continue;
    const groups = {};
    for (const row of block.matchAll(/<div id="inf(\d+)"[^>]*>([\s\S]*?)<\/div>/g)) {
      const cells = [...row[2].matchAll(/<(\w+)[^>]*>([^<]*)<\/\1>/g)].map((c) => c[2].trim().toLowerCase());
      if (cells.length !== 48) continue;
      groups[row[1]] = merge(cells.flatMap((c, i) => CV_CELLS[c] ? [{ from: i * 30, to: i * 30 + 30, type: CV_CELLS[c] }] : []));
    }
    if (Object.keys(groups).length) days.push({ date: `${dm[3]}-${dm[2]}-${dm[1]}`, groups });
  }
  return { days, sourceUpdated: null };
}

async function collectCv() {
  return parseCvHtml(await get('https://oblenergo.cv.ua/shutdowns/'));
}

// ---------- Рівнеобленерго: таблиця «дата × підчерга» ----------
export function parseRoeHtml(html) {
  const start = html.indexOf('fetched-data-container');
  if (start < 0) throw new Error('таблицю графіка не знайдено');
  const table = html.slice(start, html.indexOf('</table>', start));
  const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) =>
    [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => stripTags(c[1]).trim()));
  const header = rows.find((r) => r[0] === 'Підчерга');
  if (!header) throw new Error('у таблиці немає рядка з підчергами');
  const labels = header.slice(1);
  const days = [];
  for (const r of rows) {
    const dm = r[0].match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!dm || r.length !== labels.length + 1) continue;
    const cells = r.slice(1);
    // «Очікується» — графік на цей день ще не оголосили, тож не показуємо його зовсім
    if (cells.some((c) => /очіку/i.test(c))) continue;
    const parsed = cells.map((c) => ({ text: c, list: timeRanges(c) }));
    // Незрозумілий текст замість годин: краще не показати день, ніж показати неправду
    if (parsed.some((p) => !p.list.length && p.text && !/^[-–—\s]*$|відсут|не\s+застосов/i.test(p.text))) continue;
    days.push({ date: `${dm[3]}-${dm[2]}-${dm[1]}`, groups: Object.fromEntries(labels.map((g, i) => [g, merge(parsed[i].list)])) });
  }
  const upd = stripTags(html).match(/Оновлено:\s*(\d{2}\.\d{2}\.\d{4}\s+\d{1,2}:\d{2})/);
  return { days, sourceUpdated: upd ? upd[1] : null };
}

async function collectRoe() {
  return parseRoeHtml(await get('https://www.roe.vsei.ua/disconnections'));
}

const COLLECTORS = { dtek: collectDtek, loe: collectLoe, zoe: collectZoe, mk: collectMk, cv: collectCv, roe: collectRoe };

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
    const collected = await COLLECTORS[region.source.type](region.source);
    // Минулі дні людині не потрібні
    const days = collected.days.filter((d) => d.date >= kyivDate(new Date()));
    const { sourceUpdated } = collected;
    const entry = { status: 'ok', sourceUpdated, days, updatedAt: before?.updatedAt || now };
    if (JSON.stringify({ ...entry, updatedAt: 0 }) !== JSON.stringify({ ...before, updatedAt: 0 })) {
      entry.updatedAt = now;
      changed = true;
    }
    result.regions[region.id] = entry;
    console.log(`✓ ${region.name}: днів ${days.length}`);
  } catch (error) {
    // Лишаємо попередні дані, щоб людина бачила хоч щось
    const reason = error.cause?.code ? `${error.message} (${error.cause.code})` : error.message;
    const entry = { ...(before || { days: [], sourceUpdated: null, updatedAt: null }), status: 'stale', error: reason };
    // Причину збою зберігаємо у файлі: журнали GitHub без входу в акаунт не видно
    if (before?.status !== 'stale' || before?.error !== reason) changed = true;
    result.regions[region.id] = entry;
    console.log(`✗ ${region.name}: ${reason}`);
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
