(() => {
  'use strict';

  const CONFIG = window.SONYAKH_CONFIG || {};
  const app = document.getElementById('app');
  const menu = document.getElementById('menu');

  // ---------- Сховище на телефоні ----------
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem('sonyakh:' + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('sonyakh:' + key, JSON.stringify(value)); } catch (e) { /* приватний режим */ }
    },
    del(key) {
      try { localStorage.removeItem('sonyakh:' + key); } catch (e) { /* ігноруємо */ }
    }
  };
  const session = {
    get(key) { try { return sessionStorage.getItem('sonyakh:' + key); } catch (e) { return null; } },
    set(key, value) { try { sessionStorage.setItem('sonyakh:' + key, value); } catch (e) { /* ігноруємо */ } },
    del(key) { try { sessionStorage.removeItem('sonyakh:' + key); } catch (e) { /* ігноруємо */ } }
  };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  // ---------- Іконки ----------
  const stroke = (paths, size = 20, color = 'currentColor', width = 2) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const icon = {
    back: () => stroke('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    menu: () => stroke('<path d="M4 7h16M4 12h16M4 17h10"/>'),
    arrow: (color = 'currentColor', size = 20) => stroke('<path d="M5 12h14M13 6l6 6-6 6"/>', size, color),
    shield: () => stroke('<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/>', 14, 'currentColor', 2.4),
    clock: () => stroke('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 14, 'currentColor', 2.2),
    check: (color = 'currentColor', size = 16) => stroke('<path d="M20 6L9 17l-5-5"/>', size, color, 2.4),
    heart: (color = 'currentColor', size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" aria-hidden="true"><path d="M12 21s-8.5-5.1-8.5-11.2A4.8 4.8 0 0 1 12 7a4.8 4.8 0 0 1 8.5 2.8C20.5 15.9 12 21 12 21z"/></svg>`,
    heartLine: () => stroke('<path d="M12 20s-8-4.8-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.2 12 20 12 20z"/>', 26, 'var(--sky)'),
    grid: () => stroke('<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>', 26, 'var(--sky)'),
    kids: () => stroke('<path d="M12 3c-4 3-6 6-6 9a6 6 0 0 0 12 0c0-3-2-6-6-9z"/><path d="M9 14a3 3 0 0 0 3 3"/>', 26, 'var(--sky)'),
    sun: (color = 'var(--sky)', size = 26) => stroke('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', size, color),
    bag: () => stroke('<rect x="4" y="7" width="16" height="13" rx="3"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 12h16"/>', 28),
    bolt: () => stroke('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', 28),
    person: () => stroke('<circle cx="12" cy="8" r="4"/><path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7"/>', 28),
    pulse: () => stroke('<path d="M3 12h4l3-8 4 16 3-8h4"/>', 28),
    phone: () => stroke('<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>', 16),
    compass: () => stroke('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>', 26, 'var(--blue)'),
    share: () => stroke('<path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/>', 26, 'var(--blue)'),
    plusSquare: () => stroke('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>', 26, 'var(--blue)'),
    download: () => stroke('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', 26, 'var(--blue)'),
    okBig: () => stroke('<path d="M20 6L9 17l-5-5"/>', 26, 'var(--blue)', 2.2),
    dots: () => '<svg width="26" height="26" viewBox="0 0 24 24" fill="var(--blue)" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
    wifi: () => stroke('<path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/>', 16),
    server: () => stroke('<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>', 22),
    star: () => '<svg width="16" height="16" viewBox="0 0 24 24" fill="#FFB300" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z"/></svg>',
    gridPlus: () => stroke('<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><path d="M17 13v8M13 17h8"/>', 22)
  };

  const petals = '<g fill="PETAL"><ellipse cx="16" cy="7.5" rx="2.6" ry="4"/><ellipse cx="16" cy="24.5" rx="2.6" ry="4"/><ellipse cx="7.5" cy="16" rx="4" ry="2.6"/><ellipse cx="24.5" cy="16" rx="4" ry="2.6"/><ellipse cx="10" cy="10" rx="2.6" ry="4" transform="rotate(-45 10 10)"/><ellipse cx="22" cy="22" rx="2.6" ry="4" transform="rotate(-45 22 22)"/><ellipse cx="22" cy="10" rx="2.6" ry="4" transform="rotate(45 22 10)"/><ellipse cx="10" cy="22" rx="2.6" ry="4" transform="rotate(45 10 22)"/></g>';
  // dark: темний квадрат з жовтими пелюстками; light: жовтий квадрат з білими
  const logo = (size, dark = false, label = '') => {
    const bg = dark ? '#12203A' : '#FFCF33';
    const petal = dark ? '#FFCF33' : '#FFFFFF';
    const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
    return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" ${a11y}><rect width="32" height="32" rx="${dark ? 10 : 9}" fill="${bg}"/>${petals.replace('PETAL', petal)}<circle cx="16" cy="16" r="5" fill="#7A4A12"/></svg>`;
  };

  // ---------- Пристрій і встановлення ----------
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isIOSNotSafari = isIOS && /CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/.test(ua);
  const detectedDevice = isIOS ? 'iphone' : isAndroid ? 'android' : 'desktop';
  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    if (currentRoute === '/welcome' || currentRoute === '/install') render();
  });
  window.addEventListener('appinstalled', () => {
    store.set('installed', true);
    installPrompt = null;
    if (currentRoute === '/welcome') render();
  });

  // ---------- Дані ----------
  const cache = {};
  async function loadJSON(path) {
    if (cache[path]) return cache[path];
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(res.status);
      cache[path] = await res.json();
    } catch (e) {
      cache[path] = [];
    }
    return cache[path];
  }
  // Пропускаємо тільки https-посилання або відносні шляхи сайту (./images/...),
  // щоб у даних не могло опинитись небезпечне javascript:-посилання
  const safeUrl = (url) => {
    const value = String(url || '').trim();
    if (/^https:\/\//i.test(value)) return value;
    if (/^\.{0,2}\/[^/]/.test(value) && !/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
    return '';
  };
  const getNews = async () => (await loadJSON('./data/news.json'))
    .map((n) => ({ ...n, image: safeUrl(n.image), sourceUrl: safeUrl(n.sourceUrl) }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const getThanks = async () => (await getApproved('thanks',
    'thanks?select=id,to_whom,text,name,warm&approved=eq.true&order=created_at.desc&limit=60', './data/thanks.json'))
    .map((t) => (t.to_whom ? { id: 's' + t.id, sid: t.id, to: t.to_whom, text: t.text, who: t.name, warm: t.warm } : t));
  const getTips = async () => (await getApproved('tips',
    'tips?select=id,text,age,who&approved=eq.true&order=created_at.desc&limit=60', './data/tips.json'));
  // Свої записи показуємо, поки їх не схвалили; після схвалення вони вже є в загальному списку
  const notYetPublished = (mine, published) => mine.filter((m) => !published.some((p) => p.text === m.text));

  const NEWS_TOPICS = [
    { id: 'all', label: 'Усі' },
    { id: 'rebuild', label: 'Відбудова' },
    { id: 'people', label: 'Люди' },
    { id: 'sport', label: 'Спорт' },
    { id: 'animals', label: 'Тварини' },
    { id: 'science', label: 'Наука' }
  ];
  const topicLabel = (id) => (NEWS_TOPICS.find((t) => t.id === id) || { label: '' }).label;
  const TINTS = ['#E8EEFB', '#FFE9A3', '#DDF2E5', '#FDE2D8'];

  // Малюнки до новин без фото: по два на кожну тему, у стилі Соняха
  const NEWS_ART = {
    rebuild: ['#E3EEFF', [
      '<circle cx="62" cy="52" r="22" fill="#FFCF33"/><rect y="150" width="320" height="30" fill="#CFE0FA"/><path d="M108 94L160 54l52 40z" fill="#FF8A5C"/><rect x="118" y="92" width="84" height="58" rx="4" fill="#FFCF33"/><rect x="150" y="116" width="20" height="34" rx="4" fill="#7A4A12"/><rect x="128" y="104" width="14" height="14" rx="2" fill="#fff"/><rect x="178" y="104" width="14" height="14" rx="2" fill="#fff"/><path d="M246 150V40M206 44h88M282 44v26" stroke="#12203A" stroke-width="5" stroke-linecap="round"/><rect x="273" y="70" width="18" height="13" rx="2" fill="#1F4FB8"/>',
      '<circle cx="262" cy="46" r="20" fill="#FFCF33"/><rect y="128" width="320" height="52" fill="#9DB7F2"/><path d="M20 128Q160 30 300 128" stroke="#12203A" stroke-width="7" fill="none"/><path d="M60 117v-34M100 117V66M140 117V58M180 117V58M220 117V66M260 117V83" stroke="#12203A" stroke-width="3"/><rect x="14" y="114" width="292" height="10" rx="3" fill="#FF8A5C"/><rect x="120" y="102" width="34" height="14" rx="5" fill="#1F4FB8"/><circle cx="128" cy="117" r="3.5" fill="#12203A"/><circle cx="146" cy="117" r="3.5" fill="#12203A"/><path d="M40 150q10-6 20 0t20 0M200 160q10-6 20 0t20 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>'
    ]],
    people: ['#FDE2D8', [
      '<path d="M140 150C92 118 76 92 76 72a28 28 0 0 1 64-14 28 28 0 0 1 64 14c0 20-16 46-64 78z" fill="#F2545B"/><path d="M214 132c-22-15-30-27-30-37a13 13 0 0 1 30-6 13 13 0 0 1 30 6c0 10-8 22-30 37z" fill="#FFB300"/><ellipse cx="102" cy="72" rx="9" ry="6" fill="#fff" opacity=".7"/><path d="M252 40l4 12 12 4-12 4-4 12-4-12-12-4 12-4zM56 30l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#FFB300"/>',
      '<path d="M100 98q6 40-8 70M160 86q-4 44 4 82M222 100q10 36-4 68" stroke="#4A5873" stroke-width="2" fill="none"/><ellipse cx="100" cy="66" rx="28" ry="34" fill="#1F4FB8"/><ellipse cx="160" cy="54" rx="30" ry="36" fill="#FFCF33"/><ellipse cx="222" cy="68" rx="28" ry="34" fill="#F2545B"/><ellipse cx="90" cy="54" rx="6" ry="10" fill="#fff" opacity=".5"/><ellipse cx="150" cy="40" rx="6" ry="10" fill="#fff" opacity=".6"/><ellipse cx="212" cy="56" rx="6" ry="10" fill="#fff" opacity=".5"/>'
    ]],
    sport: ['#FFF1C2', [
      '<path d="M122 40h76v26a38 38 0 0 1-76 0z" fill="#FFB300"/><path d="M122 50h-18a20 20 0 0 0 22 30M198 50h18a20 20 0 0 1-22 30" stroke="#FFB300" stroke-width="7" fill="none"/><rect x="152" y="100" width="16" height="22" fill="#E0A000"/><rect x="128" y="120" width="64" height="16" rx="4" fill="#7A4A12"/><rect x="118" y="134" width="84" height="12" rx="4" fill="#5A360C"/><path d="M160 50l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#fff"/><path d="M60 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4zM262 96l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FFB300"/>',
      '<path d="M128 18l26 66h-24L104 18z" fill="#1F4FB8"/><path d="M192 18l-26 66h24l26-66z" fill="#FFCF33"/><circle cx="160" cy="112" r="42" fill="#FFB300"/><circle cx="160" cy="112" r="31" fill="#FFCF33"/><path d="M160 92l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" fill="#E0A000"/>'
    ]],
    animals: ['#DDF2E5', [
      '<ellipse cx="114" cy="80" rx="22" ry="38" fill="#A86A3B" transform="rotate(20 114 80)"/><ellipse cx="206" cy="80" rx="22" ry="38" fill="#A86A3B" transform="rotate(-20 206 80)"/><circle cx="160" cy="98" r="56" fill="#E8B07A"/><ellipse cx="160" cy="122" rx="30" ry="22" fill="#F6D7B0"/><circle cx="138" cy="88" r="7" fill="#12203A"/><circle cx="182" cy="88" r="7" fill="#12203A"/><circle cx="140" cy="86" r="2" fill="#fff"/><circle cx="184" cy="86" r="2" fill="#fff"/><ellipse cx="160" cy="110" rx="10" ry="7" fill="#12203A"/><path d="M160 117v8M148 126q12 10 24 0" stroke="#12203A" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M154 132q6 16 12 0" fill="#F2545B"/>',
      '<path d="M112 70l10-44 34 30zM208 70l-10-44-34 30z" fill="#FF9F43"/><path d="M120 62l6-24 18 16zM200 62l-6-24-18 16z" fill="#FDE2D8"/><circle cx="160" cy="100" r="58" fill="#FFB86B"/><ellipse cx="138" cy="92" rx="8" ry="10" fill="#3BA776"/><ellipse cx="182" cy="92" rx="8" ry="10" fill="#3BA776"/><ellipse cx="138" cy="92" rx="3" ry="8" fill="#12203A"/><ellipse cx="182" cy="92" rx="3" ry="8" fill="#12203A"/><path d="M154 112h12l-6 7z" fill="#F2545B"/><path d="M160 119q-6 8-14 4M160 119q6 8 14 4M96 108h36M96 118h36M188 108h36M188 118h36" stroke="#7A4A12" stroke-width="2" fill="none" stroke-linecap="round"/>'
    ]],
    science: ['#EDE4FF', [
      '<path d="M160 22c26 20 34 58 26 96h-52c-8-38 0-76 26-96z" fill="#fff"/><circle cx="160" cy="70" r="13" fill="#1F4FB8"/><circle cx="160" cy="70" r="7" fill="#9DB7F2"/><path d="M134 104l-18 28h22zM186 104l18 28h-22z" fill="#F2545B"/><path d="M146 120q14 40 28 0" fill="#FFB300"/><path d="M152 120q8 22 16 0" fill="#FFCF33"/><path d="M62 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3zM252 70l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM86 120l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#6B4FD8"/>',
      '<g fill="none" stroke="#6B4FD8" stroke-width="5"><ellipse cx="160" cy="90" rx="74" ry="26"/><ellipse cx="160" cy="90" rx="74" ry="26" transform="rotate(60 160 90)"/><ellipse cx="160" cy="90" rx="74" ry="26" transform="rotate(-60 160 90)"/></g><circle cx="160" cy="90" r="14" fill="#FFCF33"/><circle cx="234" cy="90" r="7" fill="#F2545B"/><circle cx="123" cy="26" r="7" fill="#1F4FB8"/><circle cx="123" cy="154" r="7" fill="#3BA776"/>'
    ]]
  };
  // Сердечко з іскорками для стіни подяк
  const heartArt = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#FDE2D8"/><path d="M20 33C11 27.5 8 22.5 8 18.5A5.5 5.5 0 0 1 20 16a5.5 5.5 0 0 1 12 2.5c0 4-3 9-12 14.5z" fill="#F2545B"/><ellipse cx="13.5" cy="18" rx="2" ry="1.3" fill="#fff" opacity=".7"/><path d="M32 4.5l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#FFB300"/><circle cx="8" cy="9" r="1.3" fill="#FFB300"/></svg>`;
  // Telegram-канал
  const tgUrl = () => (CONFIG.telegramChannel ? `https://t.me/${encodeURIComponent(CONFIG.telegramChannel)}` : '');
  const tgArt = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#2AABEE"/><path d="M9.5 19.3l18.6-7.2c.9-.3 1.6.2 1.3 1.6l-3.2 15c-.2 1-.9 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8 8.8-7.9c.4-.3-.1-.5-.6-.2l-10.8 6.8-4.7-1.5c-1-.3-1-1 .2-1.5z" fill="#fff"/></svg>`;

  function newsArt(topic, seed = '') {
    const [bg, variants] = NEWS_ART[topic] || NEWS_ART.people;
    let h = 0;
    for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return `<svg class="news-art" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="320" height="180" fill="${bg}"/><circle cx="20" cy="160" r="46" fill="#fff" opacity=".35"/><circle cx="300" cy="12" r="38" fill="#fff" opacity=".35"/>${variants[h % variants.length]}</svg>`;
  }

  const RECIPIENTS = [
    { id: 'energy', label: 'Енергетикам' },
    { id: 'dsns', label: 'Рятувальникам' },
    { id: 'med', label: 'Медикам' },
    { id: 'zsu', label: 'ЗСУ' },
    { id: 'teach', label: 'Вчителям' },
    { id: 'vol', label: 'Волонтерам' },
    { id: 'city', label: 'Комунальникам' },
    { id: 'near', label: 'Сусідам' },
    { id: 'other', label: 'Іншим' }
  ];

  const BAG = [
    { id: 'water', label: 'Вода' },
    { id: 'docs', label: 'Документи' },
    { id: 'meds', label: 'Ліки' },
    { id: 'power', label: 'Павербанк' },
    { id: 'light', label: 'Ліхтарик' },
    { id: 'charger', label: 'Зарядка' }
  ];

  const relDate = (iso) => {
    if (!iso) return '';
    const day = 24 * 3600 * 1000;
    const then = new Date(iso + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((today - then) / day);
    if (diff <= 0) return 'Сьогодні';
    if (diff === 1) return 'Вчора';
    if (diff < 5) return `${diff} дні тому`;
    return then.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
  };

  // ---------- Сервер (Supabase) ----------
  const SB_URL = String(CONFIG.supabaseUrl || '').replace(/\/$/, '');
  const sbHeaders = { apikey: CONFIG.supabaseKey || '', 'Content-Type': 'application/json' };
  const sbReady = () => !!(SB_URL && CONFIG.supabaseKey);
  async function sbGet(path) {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbHeaders });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  }

  // Схвалені записи з сервера; без інтернету показуємо останні збережені на телефоні
  async function getApproved(key, path, fallbackFile) {
    if (sbReady() && navigator.onLine) {
      try {
        const rows = await sbGet(path);
        store.set('cache:' + key, rows);
        return rows;
      } catch (e) { /* сервер недоступний: беремо збережене */ }
    }
    return store.get('cache:' + key, null) || (await loadJSON(fallbackFile));
  }

  // ---------- Пастка для ботів (шар 1) ----------
  // Невидиме поле: людина його не бачить, а боти заповнюють усі поля підряд
  const trapField = () => `<div class="trap" aria-hidden="true"><label>Сайт<input name="website" tabindex="-1" autocomplete="off"></label></div>`;
  const formOpenedAt = new WeakMap();
  // Людина пише хоча б кілька секунд; бот надсилає форму миттєво
  function isBot(form) {
    const trap = form.querySelector('input[name="website"]');
    if (trap && trap.value) return true;
    const opened = formOpenedAt.get(form);
    return !opened || Date.now() - opened < 3000;
  }
  // Час відкриття форми рахуємо з першого дотику до неї
  document.addEventListener('focusin', (event) => {
    const form = event.target.closest && event.target.closest('form');
    if (form && !formOpenedAt.has(form)) formOpenedAt.set(form, Date.now());
  });

  // ---------- Перевірка «я не робот» Cloudflare Turnstile (шар 3) ----------
  // Скрипт Cloudflare завантажуємо лише тоді, коли є що відправити
  let turnstileLoading = null;
  let turnstileWidget = null;
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    if (!turnstileLoading) {
      turnstileLoading = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async = true;
        s.onload = resolve;
        s.onerror = () => { turnstileLoading = null; reject(new Error('turnstile load')); };
        document.head.appendChild(s);
      });
    }
    return turnstileLoading;
  }
  // Зазвичай перевірка непомітна; кнопку «я не робот» Cloudflare покаже, лише якщо засумнівається
  async function turnstileToken() {
    await loadTurnstile();
    let box = document.getElementById('turnstile-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'turnstile-box';
      document.body.appendChild(box);
    }
    if (turnstileWidget !== null) window.turnstile.remove(turnstileWidget);
    return new Promise((resolve, reject) => {
      turnstileWidget = window.turnstile.render(box, {
        sitekey: CONFIG.turnstileSiteKey,
        appearance: 'interaction-only',
        language: 'uk',
        callback: resolve,
        'error-callback': () => reject(new Error('turnstile')),
        'timeout-callback': () => reject(new Error('turnstile timeout'))
      });
    });
  }

  // Без перевірки: напряму в таблиці (поки Turnstile не налаштовано)
  async function sendDirect(items) {
    const left = [];
    for (const item of items) {
      const [table, body] = OUTBOX_TABLES[item.type](item.payload);
      try {
        const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers: { ...sbHeaders, Prefer: 'return=minimal' },
          body: JSON.stringify(body)
        });
        // 4xx (крім 429) означає, що сервер такий запис ніколи не прийме: не повторюємо
        if (!res.ok && (res.status >= 500 || res.status === 429)) left.push(item);
      } catch (e) {
        left.push(item);
      }
    }
    return left;
  }

  // З перевіркою: усе разом через функцію «submit», яка спершу питає Cloudflare
  async function sendWithBotCheck(items) {
    if (!items.length) return [];
    const batch = items.slice(0, 10);
    try {
      const token = await turnstileToken();
      const res = await fetch(`${SB_URL}/functions/v1/${CONFIG.submitFunction || 'submit'}`, {
        method: 'POST',
        headers: sbHeaders,
        body: JSON.stringify({ token, items: batch.map((i) => ({ type: i.type, data: OUTBOX_TABLES[i.type](i.payload)[1] })) })
      });
      if (!res.ok) return items;
      const { results = [] } = await res.json();
      const left = batch.filter((_, n) => results[n] === 'retry' || results[n] === undefined);
      return [...left, ...items.slice(10)];
    } catch (e) {
      return items;
    } finally {
      if (turnstileWidget !== null && window.turnstile) { window.turnstile.remove(turnstileWidget); turnstileWidget = null; }
    }
  }

  // ---------- Черга відправлення (працює офлайн) ----------
  // Що куди йде: тип у черзі → таблиця Supabase і поля
  const OUTBOX_TABLES = {
    thanks: (p) => ['thanks', { to_whom: p.to, text: p.text, name: p.name || '' }],
    tips: (p) => ['tips', { text: p.text, age: p.age || '', who: p.who || '' }],
    news: (p) => ['news_suggestions', { title: p.title, link: p.link || '' }]
  };
  let flushing = false;
  const outbox = {
    add(type, payload) {
      const items = store.get('outbox', []);
      items.push({ type, payload, createdAt: new Date().toISOString() });
      store.set('outbox', items);
      outbox.flush();
    },
    async flush() {
      if (!sbReady() || !navigator.onLine || flushing) return;
      flushing = true;
      const snapshot = store.get('outbox', []).filter((item) => OUTBOX_TABLES[item.type]);
      const left = CONFIG.turnstileSiteKey ? await sendWithBotCheck(snapshot) : await sendDirect(snapshot);
      // Поки ми відправляли, могли додатися нові записи (вони в кінці черги): не губимо їх
      const addedMeanwhile = store.get('outbox', []).slice(snapshot.length);
      store.set('outbox', [...left, ...addedMeanwhile]);
      flushing = false;
      if (addedMeanwhile.length) outbox.flush();
    }
  };

  // ---------- Спільні шматки розмітки ----------
  // Повертає на попередній екран; якщо його немає (відкрили напряму), іде на href
  const backBtn = (href, label = 'Назад') =>
    `<a class="icon-btn" href="${href}" data-back aria-label="${label}">${icon.back()}</a>`;
  const offlinePill = () =>
    `<span class="pill pill--offline" data-offline hidden>${icon.wifi()} Немає інтернету, показуємо збережене</span>`;

  // ---------- Екрани ----------
  const screens = {};

  screens['/welcome'] = () => {
    const device = welcomeDevice || detectedDevice;
    const installed = store.get('installed', false);
    const deviceText = {
      iphone: 'Бачимо, що у тебе iPhone',
      android: 'Бачимо, що у тебе Android',
      desktop: 'Схоже, ти з комп\'ютера'
    }[device];

    let steps = '';
    if (device === 'iphone') {
      steps = `
        <ol class="steps">
          <li><span class="steps__n">1</span><span class="steps__text">${isIOSNotSafari && !welcomeDevice ? 'Скопіюй адресу і відкрий її в <strong>Safari</strong>' : 'Відкрий цю сторінку в <strong>Safari</strong>'}</span>${icon.compass()}</li>
          <li><span class="steps__n">2</span><span class="steps__text">Натисни <strong>«Поділитися»</strong> внизу екрана</span>${icon.share()}</li>
          <li><span class="steps__n">3</span><span class="steps__text">Обери <strong>«На екран „Дім“»</strong> і натисни «Додати»</span>${icon.plusSquare()}</li>
        </ol>`;
    } else if (device === 'android') {
      steps = `
        <ol class="steps">
          <li><span class="steps__n">1</span><span class="steps__text">Натисни кнопку <strong>«Встановити Сонях»</strong> нижче</span>${icon.download()}</li>
          <li><span class="steps__n">2</span><span class="steps__text">У віконці підтверди: <strong>«Встановити»</strong></span>${icon.okBig()}</li>
          <li><span class="steps__n">3</span><span class="steps__text">Кнопки немає? Меню <strong>⋮</strong> у Chrome, далі «Додати на головний екран»</span>${icon.dots()}</li>
        </ol>
        <button class="btn btn--dark btn--block" data-action="install" ${installPrompt ? '' : 'aria-disabled="true"'}>Встановити Сонях</button>
        ${installPrompt ? '' : '<p class="small muted center">Якщо кнопка не спрацьовує, скористайся кроком 3.</p>'}`;
    } else {
      steps = `
        <div class="card card--pad stack stack--sm">
          <p>Сонях створений для телефона. Відкрий цю адресу на смартфоні, щоб встановити його і користуватися без інтернету.</p>
          <p class="small muted">${esc(location.href.replace(/#.*$/, ''))}</p>
        </div>
        ${installPrompt ? '<button class="btn btn--dark btn--block" data-action="install">Встановити на комп\'ютер</button>' : ''}`;
    }

    const switches = ['iphone', 'android']
      .filter((d) => d !== device)
      .map((d) => `<button class="btn btn--ghost" data-action="welcome-device" data-device="${d}">${d === 'iphone' ? 'У мене iPhone' : 'У мене Android'}</button>`)
      .join('');

    return `
      <div class="page">
        <section class="stack center" style="align-items: center; padding-top: 12px; gap: 14px">
          ${logo(80, false, 'Логотип Сонях')}
          <h1 class="h1" style="font-size: 26px">Привіт! Це Сонях</h1>
          <p class="muted">Перед початком встанови його на телефон. Займе хвилину, і Сонях працюватиме навіть в укритті без зв'язку.</p>
        </section>
        ${installed ? `<div class="notice center">Готово! Тепер відкривай Сонях з іконки на екрані.</div>` : ''}
        <span class="pill" style="align-self: center">${icon.phone()} ${deviceText}</span>
        ${steps}
        <div class="stack stack--xs" style="align-items: center">${switches}</div>
        <section class="callout stack stack--xs" style="margin-top: auto">
          <strong>Готово? Відкривай Сонях з іконки</strong>
          <span class="small" style="color: #33415C">Цей екран більше не з'явиться: Сонях запам'ятає, що ти його встановив.</span>
        </section>
        <button class="btn btn--ghost" data-action="skip-welcome" style="color: var(--muted)">Продовжити в браузері (без офлайну)</button>
      </div>`;
  };
  let welcomeDevice = null;

  screens['/'] = async () => {
    const [news, thanks, power] = await Promise.all([getNews(), getThanks(), powerLine()]);
    const top = news[0];
    const dateText = new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
    const date = dateText.charAt(0).toUpperCase() + dateText.slice(1);

    const newsBlock = top ? `
      <a class="card news-card" href="#/news" style="text-decoration: none; color: inherit">
        <div class="news-card__img">${top.image ? `<img src="${esc(top.image)}" alt="">` : newsArt(top.topic, top.id)}</div>
        <div class="news-card__body">
          <span class="eyebrow">${esc(topicLabel(top.topic))}</span>
          <h3 class="news-card__title">${esc(top.title)}</h3>
          <p class="muted" style="font-size: 15px">${esc(top.text)}</p>
        </div>
      </a>` : '<p class="muted">Скоро тут з\'явиться перша добра новина.</p>';

    const thanksBlock = thanks.length ? thanks.slice(0, 2).map((t) => `
      <div class="card thanks-card">
        <span class="thanks-card__to">${esc(t.to)}</span>
        <p style="font-size: 15px">${esc(t.text)}</p>
        <span class="small muted">${esc(t.who)}</span>
      </div>`).join('') : `
      <a class="card power-card" href="#/thanks">
        ${heartArt(52)}
        <span class="stack stack--xs" style="flex: 1; min-width: 0">
          <strong style="font-size: 17px">Будь першим, хто подякує</strong>
          <span class="small muted" style="font-size: 14px">Тепле слово енергетикам, медикам чи сусідам</span>
        </span>
        ${icon.arrow('var(--blue)')}
      </a>`;

    return `
      <div class="page">
        <header class="topbar">
          <a class="brand" href="#/">${logo(34, true)} Сонях</a>
          <button class="icon-btn" data-action="menu" aria-label="Меню">${icon.menu()}</button>
        </header>
        ${offlinePill()}
        <section class="stack stack--xs">
          <p class="muted" style="font-size: 15px">${esc(date)}</p>
          <h1 class="h1">Привіт. Ми поруч,<br>навіть коли важко.</h1>
        </section>

        <a class="hero" href="#/shelter">
          <div class="row-center">
            <span class="pill">${icon.shield()} Працює без інтернету</span>
            ${icon.arrow('var(--yellow)', 28)}
          </div>
          <span class="hero__title">Я в укритті</span>
          <span class="hero__text">Подихати, відволіктися, перевірити валізу. Усе на одному екрані.</span>
        </a>

        <a class="card power-card" href="#/power">
          ${bulbArt(52)}
          <span class="stack stack--xs" style="flex: 1; min-width: 0">
            <strong style="font-size: 17px">Графік світла</strong>
            <span class="small muted" style="font-size: 14px">${esc(power)}</span>
          </span>
          ${icon.arrow('var(--blue)')}
        </a>

        <section class="stack">
          <div class="row-between">
            <h2 class="h2">Добра новина дня</h2>
            <a href="#/news" style="font-size: 14px; font-weight: 600">Усі новини</a>
          </div>
          ${newsBlock}
          ${tgUrl() ? `<a class="tg-link" href="${esc(tgUrl())}" target="_blank" rel="noopener">${tgArt(32)}<span>Добрі новини щодня в Telegram</span>${icon.arrow('var(--blue)')}</a>` : ''}
        </section>

        <section class="stack">
          <div class="row-between">
            <h2 class="h2">Стіна подяк</h2>
            <a href="#/thanks" style="font-size: 14px; font-weight: 600">Подякувати</a>
          </div>
          ${thanksBlock}
        </section>

        <section class="grid-2">
          <a class="tile" href="#/article/bag">${articleArt.bag}Тривожна валіза і план дій</a>
          <a class="tile" href="#/article/blackout">${articleArt.blackout}Що робити під час блекауту</a>
          <a class="tile" href="#/article/kids">${articleArt.kids}Як заспокоїти дитину</a>
          <a class="tile" href="#/article/anxiety">${articleArt.anxiety}Коли тривожно: швидка допомога собі</a>
        </section>

        <footer class="footer">
          <a class="btn btn--outline btn--block" href="#/support" style="min-height: 48px; font-size: 15px">${icon.heart('#E0A800')} Підтримати автора</a>
          <p class="small muted">Про тривоги дізнавайтеся з офіційних джерел. «Сонях» не замінює сирену і застосунок «Повітряна тривога».</p>
        </footer>
      </div>`;
  };

  screens['/shelter'] = () => {
    if (!session.get('shelterStart')) session.set('shelterStart', String(Date.now()));
    const checked = store.get('bag', {});
    const done = BAG.filter((b) => checked[b.id]).length;
    return `
      <div class="page page--night">
        <header class="topbar">
          ${backBtn('#/', 'На головну')}
          <span class="pill pill--night" style="align-self: center">${icon.clock()} В укритті: <span data-minutes>0 хв</span></span>
        </header>

        <section class="stack stack--xs">
          <h1 class="h1" style="font-size: 26px; line-height: 1.2">Ти в укритті.<br><span class="accent">Ти молодець.</span></h1>
          <p style="color: var(--night-muted)">Найважливіше вже зроблено. Тепер можна трохи видихнути.</p>
          <span class="pill pill--ok" style="margin-top: 8px">${icon.check()} Немає інтернету? Тут усе працює</span>
        </section>

        <section class="night-card breath" data-breath>
          <div class="breath__ring">
            <div class="breath__ball"><div class="breath__core"></div></div>
            <span class="breath__word" data-breath-word aria-live="polite"></span>
          </div>
          <p class="center" style="font-size: 15px; color: var(--night-muted)">4 секунди вдих, 4 секунди видих.<br>Слідкуй за колом.</p>
          <button class="btn btn--yellow btn--block" data-action="breath" style="font-size: 17px">Почати дихати</button>
        </section>

        <section class="grid-2">
          <a class="night-tile" href="#/game">${icon.grid()} Знайди пару</a>
          <a class="night-tile" href="#/kids">${icon.kids()} Для дітей</a>
          <a class="night-tile" href="#/news">${icon.sun()} Добра новина</a>
          <a class="night-tile" href="#/thanks">${icon.heartLine()} Подякувати комусь</a>
        </section>

        <section class="bag">
          <div class="row-center">
            <h2 class="h2">Чи все з тобою?</h2>
            <span class="pill pill--count" data-bag-count>${done} з ${BAG.length}</span>
          </div>
          <div class="grid-2" style="gap: 8px">
            ${BAG.map((b) => `
              <label class="check">
                <input type="checkbox" data-bag="${b.id}" ${checked[b.id] ? 'checked' : ''}>
                ${b.label}
              </label>`).join('')}
          </div>
          <a class="link-row" href="#/article/bag">Повний чекліст і план дій ${icon.arrow('var(--yellow)')}</a>
        </section>

        <button class="btn btn--night btn--block" data-action="all-clear">${icon.check('var(--mint)', 20)} Відбій, я виходжу з укриття</button>
      </div>`;
  };
  screens['/shelter'].mount = (root) => {
    const minutesEl = root.querySelector('[data-minutes]');
    const tick = () => {
      const start = Number(session.get('shelterStart')) || Date.now();
      minutesEl.textContent = Math.floor((Date.now() - start) / 60000) + ' хв';
    };
    tick();
    const timer = setInterval(tick, 15000);

    const breath = root.querySelector('[data-breath]');
    const word = root.querySelector('[data-breath-word]');
    const btn = root.querySelector('[data-action="breath"]');
    let wordTimer = null;
    const stopBreath = () => {
      clearInterval(wordTimer);
      wordTimer = null;
      breath.classList.remove('is-on');
      word.textContent = '';
      btn.textContent = 'Почати дихати';
    };
    btn.addEventListener('click', () => {
      if (wordTimer) return stopBreath();
      let inhale = true;
      word.textContent = 'Вдих';
      breath.classList.add('is-on');
      btn.textContent = 'Зупинити';
      wordTimer = setInterval(() => {
        inhale = !inhale;
        word.textContent = inhale ? 'Вдих' : 'Видих';
      }, 4000);
    });

    root.querySelectorAll('[data-bag]').forEach((box) => {
      box.addEventListener('change', () => {
        const state = store.get('bag', {});
        state[box.dataset.bag] = box.checked;
        store.set('bag', state);
        const done = BAG.filter((b) => state[b.id]).length;
        root.querySelector('[data-bag-count]').textContent = `${done} з ${BAG.length}`;
      });
    });

    root.querySelector('[data-action="all-clear"]').addEventListener('click', () => {
      session.del('shelterStart');
      location.hash = '#/';
    });

    return () => { clearInterval(timer); clearInterval(wordTimer); };
  };

  screens['/game'] = () => `
    <div class="page page--night">
      <header class="topbar">
        <div class="topbar__left">${backBtn('#/shelter', 'Назад в укриття')}<h1 class="h1 h1--sm">Знайди пару</h1></div>
      </header>
      <p style="color: var(--night-muted)">Відкривай по дві картки. Знайди всі пари, не поспішай.</p>
      <span class="pill pill--night">Ходи: <span data-moves>0</span></span>
      <div class="memory" data-memory></div>
      <p class="notice center" data-win hidden>Молодець! Усі пари знайдено.</p>
      <button class="btn btn--yellow btn--block" data-action="restart">Почати знову</button>
    </div>`;
  screens['/game'].mount = (root) => {
    const board = root.querySelector('[data-memory]');
    const movesEl = root.querySelector('[data-moves]');
    const win = root.querySelector('[data-win]');
    const faces = ['🌻', '🐱', '🐶', '🍎', '⭐', '🎈'];
    let open = [];
    let moves = 0;
    let lock = false;
    let timeout = null;

    const deal = () => {
      const deck = faces.concat(faces)
        .map((f) => ({ f, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .map((c) => c.f);
      board.innerHTML = deck.map((f, i) =>
        `<button class="memory__card" data-i="${i}" data-face="${f}" aria-label="Картка ${i + 1}">${f}</button>`).join('');
      open = []; moves = 0; lock = false;
      movesEl.textContent = '0';
      win.hidden = true;
    };

    board.addEventListener('click', (event) => {
      const card = event.target.closest('.memory__card');
      if (!card || lock || card.classList.contains('is-open') || card.classList.contains('is-done')) return;
      card.classList.add('is-open');
      card.setAttribute('aria-label', card.dataset.face);
      open.push(card);
      if (open.length < 2) return;
      moves += 1;
      movesEl.textContent = String(moves);
      const [a, b] = open;
      if (a.dataset.face === b.dataset.face) {
        a.classList.add('is-done'); b.classList.add('is-done');
        open = [];
        if (board.querySelectorAll('.is-done').length === faces.length * 2) win.hidden = false;
      } else {
        lock = true;
        timeout = setTimeout(() => {
          [a, b].forEach((c, n) => { c.classList.remove('is-open'); c.setAttribute('aria-label', 'Картка ' + (Number(c.dataset.i) + 1)); });
          open = []; lock = false;
        }, 800);
      }
    });
    root.querySelector('[data-action="restart"]').addEventListener('click', deal);
    deal();
    return () => clearTimeout(timeout);
  };

  screens['/kids'] = () => `
    <div class="page page--night">
      <header class="topbar">
        <div class="topbar__left">${backBtn('#/shelter', 'Назад в укриття')}<h1 class="h1 h1--sm">Бульбашки</h1></div>
      </header>
      <p style="color: var(--night-muted)">Лови бульбашки пальчиком! А ще можна разом рахувати їх уголос.</p>
      <span class="pill pill--night">Лопнуто: <span data-popped>0</span></span>
      <div class="bubbles" data-bubbles aria-label="Поле з бульбашками"></div>
      <p class="center" style="color: var(--night-muted)">Порада для дорослих: дихайте разом з дитиною повільно, наче надуваєте велику бульбашку.</p>
    </div>`;
  screens['/kids'].mount = (root) => {
    const field = root.querySelector('[data-bubbles]');
    const counter = root.querySelector('[data-popped]');
    let popped = 0;
    const spawn = () => {
      const b = document.createElement('button');
      b.className = 'bubble';
      b.setAttribute('aria-label', 'Бульбашка');
      const size = 48 + Math.random() * 36;
      b.style.width = b.style.height = size + 'px';
      b.style.left = Math.random() * (field.clientWidth - size) + 'px';
      b.style.animationDuration = (5 + Math.random() * 4) + 's';
      b.addEventListener('animationend', () => b.remove());
      b.addEventListener('pointerdown', () => {
        popped += 1;
        counter.textContent = String(popped);
        b.remove();
      });
      field.appendChild(b);
    };
    spawn();
    const timer = setInterval(spawn, 900);
    return () => clearInterval(timer);
  };

  let newsTopic = 'all';
  screens['/news'] = async () => {
    const news = await getNews();
    const list = newsTopic === 'all' ? news : news.filter((n) => n.topic === newsTopic);
    const [first, ...rest] = list;
    const firstHtml = first ? `
      <article class="card news-card">
        <div class="news-card__img">${first.image ? `<img src="${esc(first.image)}" alt="">` : newsArt(first.topic, first.id)}</div>
        <div class="news-card__body">
          <div class="row-between eyebrow"><span>${esc(topicLabel(first.topic))}</span><span class="muted">${esc(relDate(first.date))}</span></div>
          <h2 class="news-card__title" style="font-size: 19px">${esc(first.title)}</h2>
          <p class="muted" style="font-size: 15px">${esc(first.text)}</p>
          ${first.sourceUrl ? `<a href="${esc(first.sourceUrl)}" target="_blank" rel="noopener" style="font-size: 14px; font-weight: 600">Джерело: ${esc(first.source)}</a>` : ''}
        </div>
      </article>` : '<p class="muted">У цій темі поки немає новин. Загляни трохи згодом.</p>';
    const restHtml = rest.map((n, i) => `
      <article class="card news-row">
        <div class="news-row__thumb" style="background: ${TINTS[i % TINTS.length]}">${n.image ? `<img src="${esc(n.image)}" alt="">` : newsArt(n.topic, n.id)}</div>
        <div class="stack stack--xs" style="min-width: 0">
          <span class="eyebrow">${esc(topicLabel(n.topic))}</span>
          <h3 class="news-row__title">${esc(n.title)}</h3>
          <p class="small muted">${esc(n.text)}</p>
          <span class="small muted">${esc(relDate(n.date))}${n.sourceUrl ? ` · <a href="${esc(n.sourceUrl)}" target="_blank" rel="noopener">${esc(n.source)}</a>` : ''}</span>
        </div>
      </article>`).join('');

    return `
      <div class="page">
        <header class="topbar"><div class="topbar__left">${backBtn('#/', 'На головну')}<h1 class="h1 h1--sm">Добрі новини</h1></div></header>
        ${offlinePill()}
        <p class="muted">Тільки те, що гріє. Новини оновлюються щогодини, і кожна має посилання на джерело.</p>
        <div class="chips" role="group" aria-label="Теми">
          ${NEWS_TOPICS.map((t) => `<button class="chip" data-action="topic" data-topic="${t.id}" aria-pressed="${t.id === newsTopic}">${t.label}</button>`).join('')}
        </div>
        ${firstHtml}
        ${restHtml}
        ${tgUrl() ? `
        <section class="card tg-card">
          ${tgArt(56)}
          <div class="stack stack--xs" style="flex: 1; min-width: 0">
            <h2 class="h2">Добрі новини в Telegram</h2>
            <p class="small muted" style="font-size: 14px">1–3 теплі новини на день, без поганого. Підпишись, щоб не шукати.</p>
          </div>
          <a class="btn btn--tg btn--block" href="${esc(tgUrl())}" target="_blank" rel="noopener">Підписатися на @${esc(CONFIG.telegramChannel)}</a>
        </section>` : ''}
        <section class="hero" style="gap: 12px">
          <h2 class="h2">Бачив щось хороше?</h2>
          <p class="hero__text">Поділися доброю новиною зі свого міста. Найкращі потраплять у стрічку.</p>
          <form class="stack" data-suggest hidden>${trapField()}
            <label class="sr-only" for="sg-title">Що сталося?</label>
            <input class="input" id="sg-title" required maxlength="140" placeholder="Що сталося?">
            <label class="sr-only" for="sg-link">Посилання на джерело</label>
            <input class="input" id="sg-link" type="url" maxlength="300" placeholder="Посилання на джерело (якщо є)">
            <button class="btn btn--yellow btn--block" type="submit">Надіслати</button>
          </form>
          <p class="notice" data-suggest-ok hidden>Дякуємо! Ми обов'язково її прочитаємо.</p>
          <button class="btn btn--yellow btn--block" data-action="suggest-open">Запропонувати новину</button>
        </section>
      </div>`;
  };
  screens['/news'].mount = (root) => {
    const form = root.querySelector('[data-suggest]');
    const openBtn = root.querySelector('[data-action="suggest-open"]');
    openBtn.addEventListener('click', () => {
      form.hidden = false;
      openBtn.hidden = true;
      form.querySelector('input').focus();
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (isBot(form)) { form.hidden = true; root.querySelector('[data-suggest-ok]').hidden = false; return; }
      outbox.add('news', { title: form.querySelector('#sg-title').value.trim(), link: form.querySelector('#sg-link').value.trim() });
      form.hidden = true;
      root.querySelector('[data-suggest-ok]').hidden = false;
    });
  };

  screens['/article/bag'] = () => `
    <div class="page page--white">
      <header class="topbar"><div class="topbar__left">${backBtn('#/', 'Назад')}<span class="small muted" style="font-size: 14px; font-weight: 600">Стаття · 4 хв читання</span></div></header>
      <section class="stack">
        <span class="pill pill--yellow">Безпека</span>
        <h1 class="h1">Тривожна валіза і план дій</h1>
        <p class="lead">Збери один раз і забудь про паніку. Коротко, по пунктах, без зайвого.</p>
      </section>
      <nav class="toc" aria-label="Зміст">
        <a href="#/article/bag" data-jump="bag">1. Що покласти у валізу</a>
        <a href="#/article/bag" data-jump="plan">2. Що робити, коли лунає сирена</a>
        <a href="#/article/bag" data-jump="after">3. Після відбою</a>
      </nav>
      <section id="bag" class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">1. Що покласти у валізу</h2>
        <p>Рюкзак, а не валіза на колесах: руки мають бути вільні. Тримай його біля виходу.</p>
        <div class="box"><div class="box__head">Документи і гроші</div><ul>
          <li>Паспорт, ІПН, свідоцтва: оригінали або копії в плівці</li>
          <li>Фото документів на флешці і в хмарі</li>
          <li>Готівка дрібними купюрами, картка</li></ul></div>
        <div class="box"><div class="box__head">Вода, їжа, аптечка</div><ul>
          <li>Вода: 1–2 літри на людину</li>
          <li>Батончики, горіхи, сухофрукти</li>
          <li>Твої ліки на кілька днів, бинт, знеболювальне</li></ul></div>
        <div class="box"><div class="box__head">Світло і зв'язок</div><ul>
          <li>Заряджений павербанк і кабель</li>
          <li>Ліхтарик із запасними батарейками</li>
          <li>Папірець з номерами рідних (телефон може сісти)</li></ul></div>
        <div class="box"><div class="box__head">Тепло і дрібниці</div><ul>
          <li>Тепла кофта, шкарпетки, термоковдра</li>
          <li>Вологі серветки, антисептик</li>
          <li>Беруші: допомагають заснути в укритті</li></ul></div>
      </section>
      <section id="plan" class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">2. Що робити, коли лунає сирена</h2>
        <div class="step"><span class="step__n">1</span><p><strong>Вдома.</strong> Бери валізу і йди в укриття. Якщо його немає поруч: місце без вікон, за двома стінами (коридор, ванна).</p></div>
        <div class="step"><span class="step__n">2</span><p><strong>На вулиці.</strong> Найближче укриття, підземний перехід або метро. Подалі від скла і вітрин.</p></div>
        <div class="step"><span class="step__n">3</span><p><strong>У транспорті.</strong> Вийди на найближчій зупинці й рушай до укриття.</p></div>
        <div class="callout"><strong>Головне:</strong> лишайся в укритті до відбою, навіть якщо стало тихо.</div>
      </section>
      <section id="after" class="stack">
        <h2 class="h2 h2--lg">3. Після відбою</h2>
        <p>Напиши рідним, що з тобою все добре. Не підходь до уламків і не знімай їх: повідом за номером 101.</p>
      </section>
      <footer class="footer">
        <a class="btn btn--dark btn--block" href="#/shelter">Повернутися в режим укриття</a>
        <p class="small muted">Складено за рекомендаціями ДСНС. Оновлено: 25 жовтня 2026.</p>
      </footer>
    </div>`;
  screens['/article/bag'].mount = (root) => {
    root.querySelectorAll('[data-jump]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        root.querySelector('#' + link.dataset.jump).scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  screens['/thanks'] = async () => {
    const thanks = await getThanks();
    const warmed = store.get('warmed', {});
    const mine = notYetPublished(store.get('myThanks', []), thanks).reverse();
    const mineHtml = mine.map((t) => `
      <article class="card thanks-card thanks-card--mine">
        <span class="thanks-card__to">${esc(t.to)}</span>
        <p>${esc(t.text)}</p>
        <span class="small muted">Твоя подяка · зовсім скоро її побачать усі</span>
      </article>`).join('');
    const cardsHtml = thanks.map((t) => {
      const on = !!warmed[t.id];
      // У подяк із сервера лічильник уже враховує моє «Тепло»
      const n = (t.warm || 0) + (on && !t.sid ? 1 : 0);
      return `
        <article class="card thanks-card">
          <span class="thanks-card__to">${esc(t.to)}</span>
          <p>${esc(t.text)}</p>
          <div class="row-center">
            <span class="small muted">${esc(t.who)}</span>
            <button class="warm" data-action="warm" data-id="${esc(t.id)}" data-sid="${t.sid || ''}" data-base="${t.warm || 0}" aria-pressed="${on}" aria-label="Тепло, ${n}">${icon.heart('currentColor', 16)}<span>${n}</span></button>
          </div>
        </article>`;
    }).join('');

    return `
      <div class="page">
        <header class="topbar"><div class="topbar__left">${backBtn('#/', 'На головну')}<h1 class="h1 h1--sm">Стіна подяк</h1></div></header>
        ${gratitudeCard()}
        <h2 class="h2">Подякуй комусь</h2>
        <form class="card stack" style="padding: 20px; gap: 14px; border-radius: 24px" data-thanks-form>${trapField()}
          <fieldset>
            <legend>Кому дякуємо?</legend>
            <div class="chips">
              ${RECIPIENTS.map((r, i) => `<button type="button" class="chip" data-recipient="${r.id}" aria-pressed="${i === 0}">${r.label}</button>`).join('')}
            </div>
          </fieldset>
          <div class="stack stack--sm" data-other hidden>
            <label class="field-label" for="th-who">Кому саме?</label>
            <input class="input" id="th-who" maxlength="60" placeholder="Наприклад: водію маршрутки №27">
          </div>
          <label class="field-label" for="th-text">Твоя подяка</label>
          <textarea class="textarea" id="th-text" rows="4" maxlength="300" placeholder="Напиши кілька теплих слів…" required></textarea>
          <label class="sr-only" for="th-name">Твоє ім'я і місто</label>
          <input class="input" id="th-name" maxlength="60" placeholder="Твоє ім'я і місто (необов'язково)">
          <p class="notice" role="status" data-sent hidden>Дякуємо! Твої теплі слова зовсім скоро з'являться на стіні.</p>
          <button class="btn btn--dark btn--block" type="submit">Надіслати подяку</button>
          <p class="small muted">Одне тепле слово може зробити чийсь день світлішим.</p>
        </form>
        <section class="stack">
          <h2 class="h2">Нові подяки</h2>
          ${mineHtml}
          ${cardsHtml}
          ${!mineHtml && !cardsHtml ? `
          <div class="card power-hello thanks-empty">
            ${heartArt(96)}
            <h3 class="h2">Тут ще немає подяк</h3>
            <p class="muted">Будь першим! Подякуй енергетикам, рятувальникам, сусідці з п'ятого поверху — будь-кому, хто зробив твій день світлішим.</p>
            <button class="btn btn--yellow btn--block" data-action="focus-thanks">Написати першу подяку</button>
          </div>` : ''}
        </section>
      </div>`;
  };
  screens['/thanks'].mount = (root) => {
    mountGratitude(root);
    const form = root.querySelector('[data-thanks-form]');
    const other = root.querySelector('[data-other]');
    let recipient = RECIPIENTS[0].id;

    root.querySelectorAll('[data-recipient]').forEach((chip) => {
      chip.addEventListener('click', () => {
        recipient = chip.dataset.recipient;
        root.querySelectorAll('[data-recipient]').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        other.hidden = recipient !== 'other';
        root.querySelector('[data-sent]').hidden = true;
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (isBot(form)) { root.querySelector('[data-sent]').hidden = false; return; }
      const text = form.querySelector('#th-text').value.trim();
      const whoInput = form.querySelector('#th-who');
      if (!text) return;
      if (recipient === 'other' && !whoInput.value.trim()) { whoInput.focus(); return; }
      const to = recipient === 'other'
        ? whoInput.value.trim()
        : RECIPIENTS.find((r) => r.id === recipient).label;
      const item = { to, text, name: form.querySelector('#th-name').value.trim() };
      outbox.add('thanks', item);
      const mine = store.get('myThanks', []);
      mine.push(item);
      store.set('myThanks', mine);
      render().then(() => {
        const sent = app.querySelector('[data-sent]');
        if (sent) sent.hidden = false;
      });
    });

    root.querySelectorAll('[data-action="warm"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const warmed = store.get('warmed', {});
        const id = btn.dataset.id;
        const sid = Number(btn.dataset.sid);
        // «Тепло» на сервері можна дати лише один раз, забрати його не можна
        if (sid && warmed[id]) return;
        warmed[id] = !warmed[id];
        store.set('warmed', warmed);
        let n = Number(btn.dataset.base) + (warmed[id] ? 1 : 0);
        if (sid && sbReady()) {
          try {
            const res = await fetch(`${SB_URL}/rest/v1/rpc/warm_thanks`, {
              method: 'POST', headers: sbHeaders, body: JSON.stringify({ thanks_id: sid })
            });
            if (res.ok) n = Number(await res.json()) || n;
          } catch (e) { /* без інтернету: лишається на телефоні */ }
        }
        btn.setAttribute('aria-pressed', String(warmed[id]));
        btn.setAttribute('aria-label', 'Тепло, ' + n);
        btn.querySelector('span').textContent = String(n);
      });
    });
  };

  let installTab = null;
  screens['/install'] = () => {
    const tab = installTab || (detectedDevice === 'iphone' ? 'ios' : 'android');
    const steps = tab === 'android'
      ? ['Відкрий сайт Сонях у Chrome', 'Натисни «Встановити застосунок» у віконці внизу або в меню ⋮', 'Готово: іконка з\'явиться на екрані']
      : ['Відкрий сайт Сонях у Safari', 'Натисни кнопку «Поділитися» внизу екрана', 'Обери «На екран „Дім“»: іконка з\'явиться поруч з іншими'];
    const fake = ['Камера', 'Карти', 'Дія', 'Пошта'];
    const fake2 = ['Фото', 'Музика', 'Нотатки'];
    const app_ = (name) => `<div class="phone-home__app"><span></span><span>${name}</span></div>`;
    return `
      <div class="page">
        <header class="topbar"><div class="topbar__left">${backBtn('#/', 'На головну')}<h1 class="h1 h1--sm" style="font-size: 22px">Сонях на телефоні</h1></div></header>
        <section class="phone-home">
          <div class="phone-home__grid">
            ${fake.map(app_).join('')}
            <div class="phone-home__app phone-home__app--me">${logo(56, false)}<span>Сонях</span></div>
            ${fake2.map(app_).join('')}
          </div>
          <p class="center" style="font-size: 15px; color: #C9D3E8">Іконка на екрані, як у звичайного застосунку. Відкривається на весь екран, без адресного рядка.</p>
        </section>
        <section class="stack">
          <h2 class="h2">Як встановити</h2>
          <div class="segmented" role="group" aria-label="Телефон">
            <button data-action="install-tab" data-tab="android" aria-pressed="${tab === 'android'}">Android</button>
            <button data-action="install-tab" data-tab="ios" aria-pressed="${tab === 'ios'}">iPhone</button>
          </div>
          <ol class="steps">
            ${steps.map((s, i) => `<li><span class="steps__n">${i + 1}</span><span class="steps__text">${s}</span></li>`).join('')}
          </ol>
          ${tab === 'android' && installPrompt ? '<button class="btn btn--dark btn--block" data-action="install">Встановити Сонях</button>' : ''}
        </section>
        <section class="card stack" style="padding: 20px; border-radius: 24px">
          <h2 class="h2">Що працює без інтернету</h2>
          <div class="ok-list">
            <span>${icon.check('#1E7A47', 20)} Режим укриття, дихання, ігри</span>
            <span>${icon.check('#1E7A47', 20)} Чекліст валізи і всі статті</span>
            <span>${icon.check('#1E7A47', 20)} Останні завантажені новини і подяки</span>
            <span class="muted">${stroke('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 20)} Нові подяки відправляться, щойно з'явиться зв'язок</span>
          </div>
        </section>
      </div>`;
  };

  screens['/support'] = () => {
    const donateUrl = safeUrl(CONFIG.donateUrl);
    const hasLink = !!donateUrl;
    return `
      <div class="page">
        <header class="topbar">${backBtn('#/', 'На головну')}</header>
        <section class="hero center" style="align-items: center; gap: 16px; padding: 28px 22px; border-radius: 28px">
          ${logo(88, false, 'Логотип Сонях')}
          <h1 class="h1" style="font-size: 26px; line-height: 1.2">Підтримай Сонях</h1>
          <p class="hero__text" style="font-size: 16px; line-height: 1.55">Сонях безкоштовний для всіх і таким залишиться. Я роблю його сам, щоб у темні дні було трохи більше світла. Якщо він тобі допомагає, ти можеш допомогти йому рости.</p>
          <span class="accent" style="font-size: 14px; font-weight: 600">${esc(CONFIG.authorName || '')}, автор Соняха</span>
        </section>
        <section class="stack stack--sm">
          <h2 class="h2">На що піде підтримка</h2>
          <div class="card news-row" style="align-items: center"><span class="icon-btn" style="background: var(--blue-soft); color: var(--blue)">${icon.server()}</span><span>Сервер і домен, щоб Сонях завжди був доступний</span></div>
          <div class="card news-row" style="align-items: center"><span class="icon-btn" style="background: var(--blue-soft); color: var(--blue)">${icon.gridPlus()}</span><span>Нові ігри, казки і статті для укриття</span></div>
          <div class="card news-row" style="align-items: center"><span class="icon-btn" style="background: var(--blue-soft); color: var(--blue)">${icon.sun('currentColor', 22)}</span><span>Час, щоб щодня шукати для тебе добрі новини</span></div>
        </section>
        <section class="stack stack--sm">
          ${hasLink
            ? `<a class="btn btn--yellow btn--block" style="min-height: 58px; font-size: 17px" href="${esc(donateUrl)}" target="_blank" rel="noopener">${icon.heart('currentColor', 22)} Підтримати через банку</a>`
            : `<span class="btn btn--yellow btn--block" aria-disabled="true" style="min-height: 58px; font-size: 17px">${icon.heart('currentColor', 22)} Підтримати через банку</span>
               <p class="small muted center">Посилання на банку з'явиться незабаром.</p>`}
          <button class="btn btn--outline btn--block" data-action="share">Поділитися Соняхом з друзями</button>
          <p class="notice center" data-share-ok hidden>Посилання скопійовано. Надішли його друзям!</p>
          <p class="small muted center" style="display: flex; align-items: center; justify-content: center; gap: 8px">${icon.wifi()} Щоб перейти на банку, потрібен інтернет</p>
        </section>
        <p class="center muted" style="margin-top: auto">Навіть якщо просто розкажеш про Сонях друзям, це вже велика допомога. Дякую, що ти тут.</p>
      </div>`;
  };

  // ---------- Відключення світла ----------
  const isDemo = /[?&]demo\b/.test(location.search);
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmtMin = (m) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
  const addDays = (iso, n) => {
    const d = new Date(iso + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  // Графіки йдуть за київським часом, тож рахуємо «зараз» саме за ним
  function kyivNow() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).map((p) => [p.type, p.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, minute: Number(parts.hour) * 60 + Number(parts.minute) };
  }

  const getRegions = async () => (await loadJSON('./data/regions.json')).map((r) => ({ ...r, url: safeUrl(r.url) }));
  async function getOutages() {
    if (isDemo) {
      const demo = await loadJSON('./data/outages-demo.json');
      const today = kyivNow().date;
      const days = demo.regions.lviv.days.map((d) => ({ ...d, date: d.date === 'TODAY' ? today : addDays(today, 1) }));
      const regions = {};
      (await getRegions()).filter((r) => r.source).forEach((r) => { regions[r.id] = { ...demo.regions.lviv, days }; });
      return { regions };
    }
    try {
      const res = await fetch('./data/outages.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      return { regions: {} };
    }
  }

  // Що зараз із чергою: є світло чи ні, і до котрої
  function groupStatus(intervals, minute) {
    const cur = intervals.find((i) => i.from <= minute && minute < i.to);
    if (cur) {
      let end = cur.to;
      for (const i of intervals) if (i.from === end) end = i.to;
      return { on: false, maybe: cur.type === 'maybe', until: end };
    }
    const next = intervals.find((i) => i.from > minute);
    return { on: true, until: next ? next.from : null, nextMaybe: next ? next.type === 'maybe' : false };
  }
  const statusText = (st) => {
    if (st.on) return { title: 'Світло є', sub: st.until === null ? 'до кінця дня' : `до ${fmtMin(st.until)}` };
    return { title: st.maybe ? 'Можливе відключення' : 'Світла немає', sub: `до ${fmtMin(Math.min(st.until, 1440))}` };
  };
  const offText = (intervals) => {
    const off = intervals.filter((i) => i.type === 'off');
    const maybe = intervals.filter((i) => i.type === 'maybe');
    if (!intervals.length) return 'Світло буде весь день';
    const parts = [];
    if (off.length) parts.push('Немає: ' + off.map((i) => `${fmtMin(i.from)}–${fmtMin(i.to)}`).join(', '));
    if (maybe.length) parts.push('Можливо: ' + maybe.map((i) => `${fmtMin(i.from)}–${fmtMin(i.to)}`).join(', '));
    return parts.join(' · ');
  };

  // Кругле «сонечко-годинник» на 24 години
  function dial(intervals, minute, showNow) {
    const c = 120, r = 84;
    const pt = (m, rad) => {
      const a = (m / 1440) * 2 * Math.PI - Math.PI / 2;
      return [c + rad * Math.cos(a), c + rad * Math.sin(a)];
    };
    const arc = (from, to, color) => {
      const [x1, y1] = pt(from, r);
      const [x2, y2] = pt(to, r);
      const large = to - from > 720 ? 1 : 0;
      return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${color}" stroke-width="30" fill="none"/>`;
    };
    // Промінці сонечка: кожні 30 хвилин
    const rays = Array.from({ length: 48 }, (_, i) => {
      const [x1, y1] = pt(i * 30, 103);
      const [x2, y2] = pt(i * 30, i % 2 ? 108 : 112);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    }).join('');
    const segs = intervals.map((i) => arc(i.from, i.to, i.type === 'maybe' ? '#9DB7F2' : '#23376A')).join('');
    const labels = [[0, '0'], [360, '6'], [720, '12'], [1080, '18']].map(([m, t]) => {
      const [x, y] = pt(m, 58);
      return `<text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="#4A5873">${t}</text>`;
    }).join('');
    let needle = '';
    if (showNow) {
      const [x, y] = pt(minute, 118);
      const [x0, y0] = pt(minute, 66);
      needle = `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#F2545B" stroke-width="4" stroke-linecap="round"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="#F2545B" stroke="#fff" stroke-width="3"/>`;
    }
    return `<svg class="dial" viewBox="0 0 240 240" role="img" aria-label="Графік черги на добу">
      <g stroke="#FFCF33" stroke-width="3" stroke-linecap="round">${rays}</g>
      <circle cx="${c}" cy="${c}" r="${r}" stroke="#FFCF33" stroke-width="30" fill="none"/>
      ${segs}
      <circle cx="${c}" cy="${c}" r="69" fill="#FFFFFF"/>
      ${labels}
      ${needle}
    </svg>`;
  }

  const bulbArt = (size = 44) => `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#FFF1C2"/><g stroke="#FFB300" stroke-width="2" stroke-linecap="round"><path d="M20 4v3M9 8.5l2 2M31 8.5l-2 2M6 18h3M31 18h3"/></g><path d="M20 10a8 8 0 0 0-4.6 14.5c.9.7 1.6 1.7 1.6 2.9V28h6v-.6c0-1.2.7-2.2 1.6-2.9A8 8 0 0 0 20 10z" fill="#FFCF33"/><rect x="16.5" y="29" width="7" height="2.6" rx="1.3" fill="#4A5873"/><rect x="17.5" y="32.4" width="5" height="2.4" rx="1.2" fill="#4A5873"/><circle cx="17.5" cy="16" r="1.8" fill="#fff" opacity=".8"/></svg>`;
  const sunMoon = {
    sun: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="#FFB300"/><g stroke="#FFB300" stroke-width="2" stroke-linecap="round"><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g></svg>',
    moon: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="#23376A"/></svg>'
  };

  let powerDay = 0;
  screens['/power'] = async () => {
    const [regions, outages] = await Promise.all([getRegions(), getOutages()]);
    const regionId = store.get('region', '');
    const region = regions.find((r) => r.id === regionId);
    const now = kyivNow();

    const select = `
      <label class="field-label" for="pw-region">Твоя область</label>
      <div class="select-wrap">
        <select class="select" id="pw-region" data-region>
          <option value="" ${region ? '' : 'selected'} disabled>Обери область</option>
          ${regions.map((r) => `<option value="${r.id}" ${r.id === regionId ? 'selected' : ''}>${esc(r.name)}${r.id === 'kyiv-city' ? '' : ' область'}</option>`).join('')}
        </select>
      </div>`;

    const head = `
      <header class="topbar"><div class="topbar__left">${backBtn('#/', 'На головну')}<h1 class="h1 h1--sm">Графік світла</h1></div></header>
      ${offlinePill()}
      ${isDemo ? '<span class="pill pill--yellow">Демо: вигадані дані для перевірки вигляду</span>' : ''}`;

    if (!region) {
      return `<div class="page">${head}
        <section class="card power-hello">
          ${bulbArt(72)}
          <h2 class="h2">Коли буде світло?</h2>
          <p class="muted">Обери свою область, і Сонях покаже графік відключень для всіх черг. Він збережеться на телефоні, тож його видно навіть без інтернету.</p>
        </section>
        <section class="stack stack--sm">${select}</section>
      </div>`;
    }

    const findBtn = `
      <a class="btn btn--dark btn--block" href="${esc(region.url)}" target="_blank" rel="noopener">Яка моя черга? Дізнатись на сайті ${esc(region.operator)}</a>
      <p class="small muted center">Там можна знайти свою чергу за адресою. Її достатньо дізнатись один раз.</p>`;
    const articleLink = `<a class="link-row" href="#/article/blackout" style="background: var(--surface); color: var(--ink); border: 1px solid var(--line)">Що робити під час блекауту ${icon.arrow('var(--blue)')}</a>`;

    if (!region.source) {
      return `<div class="page">${head}
        <section class="stack stack--sm">${select}</section>
        <section class="card power-hello">
          ${bulbArt(64)}
          <h2 class="h2">Скоро тут буде графік</h2>
          <p class="muted">Для цієї області Сонях поки не збирає графік автоматично. Подивись його на офіційному сайті ${esc(region.operator)}.</p>
          <a class="btn btn--yellow btn--block" href="${esc(region.url)}" target="_blank" rel="noopener">Відкрити графік на сайті</a>
        </section>
        ${articleLink}
      </div>`;
    }

    const data = outages.regions?.[region.id] || { days: [], status: 'stale' };
    const days = (data.days || []).filter((d) => d.date >= now.date).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2);
    const statusPill = data.status === 'stale'
      ? `<span class="pill pill--offline">${icon.wifi()} Не вдалося оновити, показуємо останнє збережене</span>`
      : `<span class="pill">${icon.clock()} ${data.sourceUpdated ? 'Обленерго оновило: ' + esc(data.sourceUpdated) : 'Дані: ' + esc(region.operator)}</span>`;

    if (!days.length) {
      return `<div class="page">${head}
        <section class="stack stack--sm">${select}</section>
        ${statusPill}
        <section class="card power-hello">
          <svg width="88" height="88" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5.5" fill="#FFCF33"/><g stroke="#FFB300" stroke-width="1.6" stroke-linecap="round"><path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></g><circle cx="10.2" cy="11.2" r=".8" fill="#7A4A12"/><circle cx="13.8" cy="11.2" r=".8" fill="#7A4A12"/><path d="M10 13.4q2 1.8 4 0" stroke="#7A4A12" stroke-width=".9" fill="none" stroke-linecap="round"/></svg>
          <h2 class="h2">Відключень не заплановано</h2>
          <p class="muted">${esc(region.operator)} зараз не публікує графік для твоєї області. Якщо він з'явиться, Сонях покаже його тут.</p>
        </section>
        ${findBtn}
        ${articleLink}
      </div>`;
    }

    const dayIdx = Math.min(powerDay, days.length - 1);
    const day = days[dayIdx];
    const isToday = day.date === now.date;
    const labels = Object.keys(day.groups).sort((a, b) => a.localeCompare(b, 'uk', { numeric: true }));
    const myGroup = store.get('myGroup:' + region.id, '');
    const nowLeft = (now.minute / 1440 * 100).toFixed(2);

    const dayTabs = days.length > 1 ? `
      <div class="segmented" role="group" aria-label="День">
        ${days.map((d, i) => `<button data-action="power-day" data-day="${i}" aria-pressed="${i === dayIdx}">${d.date === now.date ? 'Сьогодні' : 'Завтра'}</button>`).join('')}
      </div>` : '';

    let mine = `
      <section class="card power-mine power-mine--empty">
        ${icon.star()}
        <p>Натисни на свою чергу в списку нижче, і Сонях покаже її великим сонечком-годинником.</p>
      </section>`;
    if (myGroup && day.groups[myGroup]) {
      const intervals = day.groups[myGroup];
      const st = isToday ? statusText(groupStatus(intervals, now.minute)) : { title: intervals.length ? 'Завтра' : 'Світло весь день', sub: '' };
      const on = isToday ? groupStatus(intervals, now.minute).on : true;
      mine = `
        <section class="card power-mine ${on ? '' : 'is-off'}">
          <div class="power-mine__dial">
            ${dial(intervals, now.minute, isToday)}
            <div class="power-mine__center">
              ${on ? sunMoon.sun.replace(/16/g, '30') : sunMoon.moon.replace(/16/g, '30')}
              <strong>${st.title}</strong>
              ${st.sub ? `<span>${st.sub}</span>` : ''}
            </div>
          </div>
          <div class="stack stack--xs center">
            <span class="eyebrow">Моя черга ${esc(myGroup)}</span>
            <p class="small muted">${esc(offText(intervals))}</p>
          </div>
        </section>`;
    }

    const rows = labels.map((g) => {
      const intervals = day.groups[g];
      const segs = intervals.map((i) =>
        `<span class="track__seg ${i.type === 'maybe' ? 'is-maybe' : ''}" style="left:${(i.from / 14.4).toFixed(2)}%;width:${((i.to - i.from) / 14.4).toFixed(2)}%"></span>`).join('');
      const nowState = isToday ? groupStatus(intervals, now.minute) : null;
      return `
        <button class="queue ${g === myGroup ? 'is-mine' : ''}" data-action="pick-group" data-group="${esc(g)}" aria-pressed="${g === myGroup}">
          <span class="queue__badge">${g === myGroup ? icon.star() : ''}${esc(g)}</span>
          <span class="queue__body">
            <span class="track">${segs}${isToday ? `<span class="track__now" style="left:${nowLeft}%"></span>` : ''}</span>
            <span class="queue__text">${nowState ? `<b class="${nowState.on ? 'is-on' : 'is-off'}">${nowState.on ? 'Зараз є' : 'Зараз немає'}</b> · ` : ''}${esc(offText(intervals))}</span>
          </span>
        </button>`;
    }).join('');

    return `<div class="page">${head}
      <section class="stack stack--sm">${select}</section>
      ${statusPill}
      ${dayTabs}
      ${mine}
      <section class="stack stack--sm">
        <div class="row-between"><h2 class="h2">Усі черги</h2><span class="small muted">${new Date(day.date + 'T12:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</span></div>
        <div class="axis" aria-hidden="true"><span>${sunMoon.moon}0</span><span>6</span><span>${sunMoon.sun}12</span><span>18</span><span>24${sunMoon.moon}</span></div>
        ${rows}
        <div class="legend">
          <span><i class="legend__dot"></i>Світло є</span>
          <span><i class="legend__dot is-off"></i>Світла немає</span>
          <span><i class="legend__dot is-maybe"></i>Можливо</span>
          ${isToday ? '<span><i class="legend__now"></i>Зараз</span>' : ''}
        </div>
      </section>
      ${findBtn}
      ${articleLink}
      <p class="small muted">Дані: ${esc(region.operator)}. Сонях лише показує їх зручніше. Якщо щось не збігається, довіряй офіційному сайту.</p>
    </div>`;
  };
  screens['/power'].mount = (root) => {
    const sel = root.querySelector('[data-region]');
    if (sel) sel.addEventListener('change', () => { store.set('region', sel.value); powerDay = 0; render(); });
    // Раз на хвилину оновлюємо «зараз» на графіку
    const timer = setInterval(() => { if (currentRoute === '/power') render(); }, 60000);
    return () => clearInterval(timer);
  };

  // Рядок для головної: «Черга 3.1 · Світло є до 16:00»
  async function powerLine() {
    const regionId = store.get('region', '');
    const group = regionId ? store.get('myGroup:' + regionId, '') : '';
    if (!regionId) return 'Обери область і дізнайся, коли буде світло';
    if (!group) return 'Обери свою чергу, щоб бачити її тут';
    const outages = await getOutages();
    const now = kyivNow();
    const day = (outages.regions?.[regionId]?.days || []).find((d) => d.date === now.date);
    if (!day || !day.groups[group]) return `Черга ${group} · відключень не заплановано`;
    const st = statusText(groupStatus(day.groups[group], now.minute));
    return `Черга ${group} · ${st.title} ${st.sub}`;
  }

  screens['/article/blackout'] = () => `
    <div class="page page--white">
      <header class="topbar"><div class="topbar__left">${backBtn('#/', 'Назад')}<span class="small muted" style="font-size: 14px; font-weight: 600">Стаття · 5 хв читання</span></div></header>
      <section class="stack">
        <span class="pill pill--yellow">Світло</span>
        <h1 class="h1">Що робити під час блекауту</h1>
        <p class="lead">Світло зникло, і це неприємно, але не страшно, якщо ти підготувався. Ось що допоможе пережити відключення спокійно.</p>
      </section>
      <a class="link-row" href="#/power">Подивитись графік відключень ${icon.arrow('var(--yellow)')}</a>
      <section class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">1. Підготуйся заздалегідь</h2>
        <div class="box"><div class="box__head">Перед відключенням</div><ul>
          <li><strong>Знай свій графік.</strong> Перевіряй його на сайті свого обленерго або тут, у Соняху.</li>
          <li><strong>Заряджай усе, поки є світло:</strong> телефон, павербанк, ліхтарик, ноутбук.</li>
          <li><strong>Запас удома:</strong> 2–3 літри води на людину на день, їжа, яку не треба готувати, батарейки, готівка (термінали без світла не працюють).</li>
          <li><strong>Дізнайся, де найближчий «Пункт незламності»:</strong> там тепло, світло, зв'язок і можна зарядити телефон.</li></ul></div>
      </section>
      <section class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">2. Коли світло зникло</h2>
        <div class="step"><span class="step__n">1</span><p><strong>Вимкни техніку з розеток.</strong> Коли світло повернеться, стрибок напруги може її пошкодити. Залиш одну лампу, щоб побачити, що світло є.</p></div>
        <div class="step"><span class="step__n">2</span><p><strong>Не відкривай холодильник без потреби.</strong> Зачинений, він тримає холод близько 4 годин, повна морозилка до доби.</p></div>
        <div class="step"><span class="step__n">3</span><p><strong>Не користуйся ліфтом</strong> у години, коли можуть вимкнути світло.</p></div>
        <div class="step"><span class="step__n">4</span><p><strong>Бережи заряд телефона:</strong> знизь яскравість, увімкни енергозбереження, вимкни зайве.</p></div>
      </section>
      <section class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">3. Як зберегти тепло</h2>
        <div class="box"><div class="box__head">Тепло вдома</div><ul>
          <li>Одягайся шарами, вдягни теплі шкарпетки і шапку: тепло найбільше втрачається через голову і ноги.</li>
          <li>Збирайтеся всією родиною в одній кімнаті, щільно зачиніть двері, вікна завісьте ковдрами чи шторами.</li>
          <li>Термос з гарячим чаєм — найкращий друг під час блекауту.</li></ul></div>
      </section>
      <section class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">4. Безпека, це дуже важливо</h2>
        <div class="callout" style="background: #FDE2D8"><strong>Ніколи не грійся газовою плитою чи духовкою.</strong> Можна отруїтися чадним газом, а він не має ні запаху, ні кольору.</div>
        <div class="box"><div class="box__head">Ще три правила</div><ul>
          <li><strong>Генератор вмикай тільки надворі:</strong> не на балконі, не в під'їзді і не в гаражі.</li>
          <li><strong>Свічки став лише на негорючу поверхню</strong>, подалі від штор, і не лишай без нагляду. Краще ліхтарики.</li>
          <li>Якщо вдома є медичні прилади, які працюють від мережі, подбай про запасне живлення заздалегідь.</li></ul></div>
      </section>
      <section class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">5. Зв'язок</h2>
        <div class="box"><div class="box__head">Щоб не загубитись</div><ul>
          <li>Роутер можна живити від павербанка або ДБЖ, тоді інтернет працюватиме й без світла.</li>
          <li>Домовтеся з рідними, як зв'язуватися, якщо мобільний зв'язок пропаде.</li>
          <li>Запиши найважливіші номери на папірці.</li></ul></div>
      </section>
      <section class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">6. Подбай про себе</h2>
        <p>Блекаут — гарний привід відпочити від екрана: настільні ігри, книжка з ліхтариком, розмови. Діти легше переживають темряву як пригоду: «похід удома», тіньовий театр на стіні.</p>
        <p>Перевір, як там сусіди, особливо літні люди: їм може знадобитися допомога.</p>
      </section>
      <footer class="footer">
        <a class="btn btn--dark btn--block" href="#/power">Подивитись графік відключень</a>
        <p class="small muted">Складено за рекомендаціями ДСНС. Оновлено: 25 жовтня 2026.</p>
      </footer>
    </div>`;

  // ---------- Стаття: коли тривожно + вправа 5-4-3-2-1 ----------
  const GROUNDING = [
    { n: 5, text: 'речей, які ти <strong>бачиш</strong>', hint: 'Колір стіни, лампа, власна долоня…' },
    { n: 4, text: 'речі, яких можеш <strong>торкнутись</strong>', hint: 'Тканина одягу, підлога під ногами, телефон…' },
    { n: 3, text: 'звуки, які <strong>чуєш</strong>', hint: 'Своє дихання, голоси, гудіння…' },
    { n: 2, text: 'запахи', hint: 'Повітря, одяг, чай… Можна просто вдихнути глибше.' },
    { n: 1, text: 'смак', hint: 'Що відчуваєш у роті? Можна зробити ковток води.' }
  ];

  screens['/article/anxiety'] = () => `
    <div class="page page--white">
      <header class="topbar"><div class="topbar__left">${backBtn('#/', 'Назад')}<span class="small muted" style="font-size: 14px; font-weight: 600">Стаття · 4 хв читання</span></div></header>
      <section class="stack">
        <span class="pill pill--yellow">Підтримка</span>
        <h1 class="h1">Коли тривожно: швидка допомога собі</h1>
        <p class="lead">Тривога — нормальна реакція тіла на небезпеку. Її не треба соромитись чи «перемагати». Досить допомогти тілу заспокоїтись. Ось прості способи, які працюють за 1–3 хвилини.</p>
      </section>

      <section class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">1. Подихай</h2>
        <div class="box"><div class="box__head">Одна хвилина</div><ul>
          <li><strong>Видих довший за вдих:</strong> вдих на 4, видих на 6. Довгий видих сам по собі заспокоює серце.</li>
          <li><strong>«Квадрат»:</strong> вдих 4, пауза 4, видих 4, пауза 4.</li></ul></div>
        <a class="link-row" href="#/shelter">Подихати разом із Соняхом ${icon.arrow('var(--yellow)')}</a>
      </section>

      <section class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">2. Повернись «сюди і зараз»</h2>
        <p>Вправа <strong>5-4-3-2-1</strong> повертає увагу з тривожних думок у тіло й навколишній світ. Пройди її крок за кроком: знаходь і торкайся кружечків.</p>
        <div class="ground" data-ground aria-live="polite"></div>
      </section>

      <section class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">3. Допоможи тілу</h2>
        <div class="step"><span class="step__n">1</span><p><strong>«Обійми метелика».</strong> Схрести руки на грудях і по черзі легенько постукуй долонями по плечах 1–2 хвилини.</p></div>
        <div class="step"><span class="step__n">2</span><p><strong>Напруж і відпусти.</strong> Сильно стисни кулаки на 5 секунд, потім повністю розслаб. Те саме з плечима й ногами.</p></div>
        <div class="step"><span class="step__n">3</span><p><strong>Холодна вода</strong> на зап'ястя чи обличчя.</p></div>
        <div class="step"><span class="step__n">4</span><p><strong>Попий води, з'їж щось.</strong> Голод і спрага підсилюють тривогу.</p></div>
      </section>

      <section class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">4. Що допомагає думкам</h2>
        <div class="box"><div class="box__head">Маленькі кроки</div><ul>
          <li><strong>Назви почуття вголос:</strong> «Мені зараз тривожно». Названа емоція слабшає.</li>
          <li><strong>Обмеж новини:</strong> перевіряй їх у визначений час, а не кожні 5 хвилин.</li>
          <li><strong>Зроби одну маленьку справу:</strong> заправити ліжко, полити квітку. Відчуття контролю повертає спокій.</li>
          <li><strong>Напиши комусь</strong> близькому або загляни у «Вдячність дня».</li></ul></div>
        <a class="link-row" href="#/thanks" style="background: var(--surface); color: var(--ink); border: 1px solid var(--line)">Відкрити «Вдячність дня» ${icon.arrow('var(--blue)')}</a>
      </section>

      <section class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">5. Коли варто звернутись по допомогу</h2>
        <p>Якщо тривога не минає тижнями, заважає спати, їсти, працювати, або з'являються думки зашкодити собі, ти не мусиш справлятися сам чи сама.</p>
        <div class="callout"><strong>Lifeline Ukraine — <a href="tel:7333">7333</a>:</strong> лінія підтримки психічного здоров'я і запобігання самогубствам, цілодобово й безкоштовно з будь-якого оператора. Є також чат на lifelineukraine.com.</div>
        <div class="callout" style="background: #FDE2D8"><strong>Якщо є безпосередня небезпека для життя — <a href="tel:112">112</a>.</strong></div>
      </section>

      <footer class="footer">
        <a class="btn btn--dark btn--block" href="#/shelter">Повернутися в режим укриття</a>
        <p class="small muted">Загальні поради з самодопомоги. Не замінюють консультації фахівця. Оновлено: 25 жовтня 2026.</p>
      </footer>
    </div>`;
  screens['/article/anxiety'].mount = (root) => {
    const box = root.querySelector('[data-ground]');
    let step = -1;
    let found = 0;
    let timer = null;
    const draw = () => {
      if (step < 0) {
        box.innerHTML = `
          <p class="ground__big">5 · 4 · 3 · 2 · 1</p>
          <p class="muted center">Займе близько двох хвилин. Не поспішай.</p>
          <button class="btn btn--yellow btn--block" data-g="start">Почати вправу</button>`;
        return;
      }
      if (step >= GROUNDING.length) {
        box.innerHTML = `
          ${sunMoon.sun.replace(/16/g, '56')}
          <p class="ground__title">Ти тут. Ти в безпеці зараз.</p>
          <p class="muted center">Зроби ще один повільний видих. Ти молодець.</p>
          <button class="btn btn--ghost" data-g="restart">Пройти ще раз</button>`;
        return;
      }
      const s = GROUNDING[step];
      box.innerHTML = `
        <span class="small muted">Крок ${step + 1} з ${GROUNDING.length}</span>
        <p class="ground__title">Знайди <span class="ground__n">${s.n}</span> ${s.text}</p>
        <p class="muted center small">${s.hint}</p>
        <div class="ground__dots">
          ${Array.from({ length: s.n }, (_, i) => `<button class="ground__dot ${i < found ? 'is-on' : ''}" data-g="tap" aria-label="Знайшов ${i + 1}" ${i < found ? 'disabled' : ''}></button>`).join('')}
        </div>
        <p class="small muted">${found} з ${s.n}</p>`;
    };
    box.addEventListener('click', (event) => {
      const action = event.target.closest('[data-g]')?.dataset.g;
      if (!action) return;
      if (action === 'start' || action === 'restart') { step = 0; found = 0; }
      if (action === 'tap' && step >= 0 && step < GROUNDING.length && found < GROUNDING[step].n) {
        found++;
        if (found === GROUNDING[step].n) {
          draw();
          timer = setTimeout(() => { step++; found = 0; draw(); }, 700);
          return;
        }
      }
      draw();
    });
    draw();
    return () => clearTimeout(timer);
  };

  // ---------- Вдячність дня: особиста «банка вдячності», живе лише на телефоні ----------
  const GRATITUDE_CHIPS = ['Я прокинувся', 'Тепла їжа', 'Кава чи чай', 'Рідні поруч', 'Є світло', 'Сонце за вікном',
    'Тепла ковдра', 'Дзвінок від друга', 'Тиша вночі', 'Обійми', 'Улюблена пісня', 'Я впорався'];
  const GRATITUDE_QUESTIONS = ['За яку дрібницю ти вдячний сьогодні?', 'Що сьогодні зігріло тебе?',
    'Хто зробив твій день трохи кращим?', 'Що смачного було сьогодні?', 'Який момент дня хочеться запам\'ятати?',
    'Що сьогодні вийшло добре?', 'За що можна подякувати собі сьогодні?'];
  const daysWord = (n) => {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return 'день';
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'дні';
    return 'днів';
  };
  const jarArt = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#FFF1C2"/><rect x="13" y="7" width="14" height="5" rx="2" fill="#E0A000"/><path d="M12 14h16a3 3 0 0 1 3 3v13a5 5 0 0 1-5 5H14a5 5 0 0 1-5-5V17a3 3 0 0 1 3-3z" fill="#fff" stroke="#F0D58A" stroke-width="1.5"/><path d="M20 30c-3.6-2.2-5-4.1-5-5.6a2.4 2.4 0 0 1 5-1.1 2.4 2.4 0 0 1 5 1.1c0 1.5-1.4 3.4-5 5.6z" fill="#F2545B"/><circle cx="14.5" cy="19.5" r="1.6" fill="#FFCF33"/><circle cx="25" cy="18.5" r="1.2" fill="#FFCF33"/><path d="M26 23l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="#FFB300"/></svg>`;
  let gratitudeEdit = false;

  function gratitudeStreak(entries, today) {
    const dates = new Set(entries.map((e) => e.date));
    let day = dates.has(today) ? today : addDays(today, -1);
    let n = 0;
    while (dates.has(day)) { n++; day = addDays(day, -1); }
    return n;
  }

  function gratitudeCard() {
    const today = kyivNow().date;
    const entries = store.get('gratitude', []);
    const todays = entries.find((e) => e.date === today);
    const streak = gratitudeStreak(entries, today);
    const dayNum = Math.floor(new Date(today + 'T12:00:00Z').getTime() / 86400000);
    const question = GRATITUDE_QUESTIONS[dayNum % GRATITUDE_QUESTIONS.length];
    const picked = todays ? todays.items : [];
    const custom = picked.filter((i) => !GRATITUDE_CHIPS.includes(i));

    const head = `
      <div class="gratitude__head">
        ${jarArt(56)}
        <div class="stack stack--xs" style="flex: 1; min-width: 0">
          <h2 class="h2">Вдячність дня</h2>
          <p class="small muted">Щодня згадай хоча б одну добру річ. Записи бачиш лише ти.</p>
        </div>
      </div>`;
    const streakPill = streak ? `<span class="pill pill--yellow">${sunMoon.sun} ${streak} ${daysWord(streak)} поспіль</span>` : '';

    let body;
    if (todays && !gratitudeEdit) {
      body = `
        <p style="font-weight: 700">Сьогодні ти вдячний за:</p>
        <div class="chips">${todays.items.map((i) => `<span class="chip chip--static">${esc(i)}</span>`).join('')}</div>
        <div class="row-center">${streakPill}<button class="btn btn--ghost" data-action="gratitude-edit">Додати ще</button></div>`;
    } else {
      body = `
        <p class="gratitude__q">${esc(question)}</p>
        <div class="chips" role="group" aria-label="Варіанти">
          ${GRATITUDE_CHIPS.map((c) => `<button type="button" class="chip" data-grat="${esc(c)}" aria-pressed="${picked.includes(c)}">${esc(c)}</button>`).join('')}
        </div>
        <label class="sr-only" for="grat-own">Своє</label>
        <input class="input" id="grat-own" maxlength="80" placeholder="Або напиши своє…" value="${esc(custom.join(', '))}">
        <button class="btn btn--yellow btn--block" data-action="gratitude-save">Покласти в банку вдячності</button>
        ${streakPill ? `<div>${streakPill}</div>` : ''}`;
    }

    const past = entries.filter((e) => e.date !== today).slice(-14).reverse();
    const jar = past.length ? `
      <details class="gratitude__jar">
        <summary>Моя банка вдячності (${entries.length})</summary>
        <ul>${past.map((e) => `<li><span class="small muted">${esc(new Date(e.date + 'T12:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' }))}</span>${esc(e.items.join(', '))}</li>`).join('')}</ul>
      </details>` : '';

    return `<section class="card gratitude" data-gratitude>${head}${body}${jar}</section>`;
  }

  function mountGratitude(root) {
    const box = root.querySelector('[data-gratitude]');
    if (!box) return;
    box.querySelectorAll('[data-grat]').forEach((chip) => {
      chip.addEventListener('click', () => chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true')));
    });
    box.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'gratitude-edit') { gratitudeEdit = true; render(); }
      if (action === 'gratitude-save') {
        const items = [...box.querySelectorAll('[data-grat][aria-pressed="true"]')].map((c) => c.dataset.grat);
        const own = box.querySelector('#grat-own').value.split(',').map((s) => s.trim()).filter(Boolean);
        const all = [...new Set([...items, ...own])];
        if (!all.length) { box.querySelector('#grat-own').focus(); return; }
        const today = kyivNow().date;
        const entries = store.get('gratitude', []).filter((e) => e.date !== today);
        entries.push({ date: today, items: all });
        store.set('gratitude', entries.slice(-365));
        gratitudeEdit = false;
        render();
      }
    });
  }

  // ---------- Стаття: як заспокоїти дитину + поради від батьків ----------
  const TIP_AGES = [
    { id: 'baby', label: 'До 3 років' },
    { id: 'preschool', label: '3–6 років' },
    { id: 'school', label: '7–12 років' },
    { id: 'teen', label: 'Підліток' }
  ];
  const ageLabel = (id) => (TIP_AGES.find((a) => a.id === id) || { label: '' }).label;
  const tipCard = (t, mine) => `
    <article class="card thanks-card ${mine ? 'thanks-card--mine' : ''}">
      ${t.age ? `<span class="thanks-card__to">${esc(ageLabel(t.age))}</span>` : ''}
      <p>${esc(t.text)}</p>
      <span class="small muted">${mine ? 'Твоя порада · зовсім скоро її побачать усі' : esc(t.who || 'Від батьків')}</span>
    </article>`;

  screens['/article/kids'] = async () => {
    const tips = await getTips();
    const mine = notYetPublished(store.get('myTips', []), tips).reverse();
    const tipsHtml = mine.map((t) => tipCard(t, true)).join('') + tips.map((t) => tipCard(t, false)).join('');
    return `
    <div class="page page--white">
      <header class="topbar"><div class="topbar__left">${backBtn('#/', 'Назад')}<span class="small muted" style="font-size: 14px; font-weight: 600">Стаття · 5 хв читання</span></div></header>
      <section class="stack">
        <span class="pill pill--yellow">Діти</span>
        <h1 class="h1">Як заспокоїти дитину</h1>
        <p class="lead">Діти зчитують наш стан швидше за слова. Найкраще, що можна зробити, — бути поруч і бути спокійним настільки, наскільки виходить.</p>
      </section>
      <nav class="toc" aria-label="Зміст">
        <a href="#/article/kids" data-jump="k1">1. Спершу заспокой себе</a>
        <a href="#/article/kids" data-jump="k2">2. Під час тривоги чи вибухів</a>
        <a href="#/article/kids" data-jump="k3">3. Що казати і чого не казати</a>
        <a href="#/article/kids" data-jump="k4">4. Вік має значення</a>
        <a href="#/article/kids" data-jump="k5">5. Після відбою</a>
        <a href="#/article/kids" data-jump="k6">6. Коли звернутись по допомогу</a>
        <a href="#/article/kids" data-jump="tips">Поради від мам і тат</a>
      </nav>

      <section id="k1" class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">1. Спершу заспокой себе</h2>
        <div class="box"><div class="box__head">Твій спокій — найкращі ліки</div><ul>
          <li>Зроби кілька повільних видихів: вдих на 4, видих на 6. Дитина «підхопить» твій ритм.</li>
          <li>Говори тихо й повільно, навіть якщо всередині тривожно.</li>
          <li>Не треба вдавати, що все гаразд. Досить показати: «Мені теж неприємно, але я поруч, і ми впораємось».</li></ul></div>
      </section>

      <section id="k2" class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">2. Під час тривоги чи вибухів</h2>
        <div class="step"><span class="step__n">1</span><p><strong>Обійми, тримай за руку, посади на коліна.</strong> Дотик заспокоює краще за будь-які слова.</p></div>
        <div class="step"><span class="step__n">2</span><p><strong>Назви, що відбувається, просто і чесно:</strong> «Це гучно. Ми в безпечному місці. Я з тобою».</p></div>
        <div class="step"><span class="step__n">3</span><p><strong>Дай дитині дію:</strong> тримати ліхтарик, обрати іграшку, рахувати разом.</p></div>
        <div class="step"><span class="step__n">4</span><p><strong>Дихайте разом:</strong> «Надуваємо велику кульку… і повільно здуваємо».</p></div>
        <div class="step"><span class="step__n">5</span><p><strong>Перемкни увагу:</strong> пісенька, казка, гра «Знайди 5 речей синього кольору» або «Бульбашки» тут, у Соняху.</p></div>
        <a class="link-row" href="#/kids">Відкрити «Бульбашки» для дитини ${icon.arrow('var(--yellow)')}</a>
      </section>

      <section id="k3" class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">3. Що казати і чого не казати</h2>
        <div class="box"><div class="box__head" style="background: #1E7A47">Кажи</div><ul>
          <li>«Тобі страшно — це нормально. Я теж іноді боюсь».</li>
          <li>«Ми разом. Дорослі роблять усе, щоб ти був у безпеці».</li></ul></div>
        <div class="box"><div class="box__head" style="background: #B4232A">Краще не казати</div><ul>
          <li>«Не плач», «Не бійся», «Нічого страшного». Так дитина вчиться ховати почуття.</li>
          <li>Не обговорюй страшні новини і подробиці при дитині.</li></ul></div>
      </section>

      <section id="k4" class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">4. Вік має значення</h2>
        <div class="box"><div class="box__head">Що допомагає в різному віці</div><ul>
          <li><strong>Малюки (до 3 років):</strong> звичний ритуал, улюблена іграшка, колискова, твій голос.</li>
          <li><strong>Дошкільнята (3–6):</strong> прості пояснення, гра, малювання страху на папері: «а тепер намалюємо, як він зменшується».</li>
          <li><strong>Школярі (7–12):</strong> чесні відповіді на запитання, план дій («Що ми робимо, коли сирена»), маленькі доручення.</li>
          <li><strong>Підлітки:</strong> розмова на рівних, без тиску. Дай побути з друзями онлайн, поважай їхній спосіб справлятися.</li></ul></div>
      </section>

      <section id="k5" class="stack">
        <h2 class="h2 h2--lg">5. Після відбою</h2>
        <p>Обійміться і скажіть: «Ми впорались». Поверніться до звичних справ: їжа, гра, сон. Рутина дає відчуття безпеки.</p>
        <p>Якщо дитина хоче говорити, слухай. Якщо ні, не змушуй.</p>
      </section>

      <section id="k6" class="stack" style="gap: 14px">
        <h2 class="h2 h2--lg">6. Коли варто звернутись по допомогу</h2>
        <p>Якщо кілька тижнів поспіль дитина погано спить, має нічні жахи, не відпускає тебе ні на крок, повертається до «малечих» звичок чи стала замкненою або агресивною, це привід поговорити з дитячим психологом.</p>
        <div class="callout"><strong>Безкоштовно і цілодобово:</strong> Національна гаряча лінія для дітей та молоді «Ла Страда-Україна» — <a href="tel:116111"><strong>116 111</strong></a> (з мобільного) або <a href="tel:0800500225"><strong>0 800 500 225</strong></a>. Туди можуть дзвонити і діти, і батьки.</div>
      </section>

      <section id="tips" class="tips">
        <div class="tips__head">
          ${tipsArt(64)}
          <div class="stack stack--xs">
            <h2 class="h2 h2--lg">Поради від мам і тат</h2>
            <p class="muted" style="font-size: 15px">Те, що мама підказала колись тобі, сьогодні може заспокоїти чиюсь дитину в укритті.</p>
          </div>
        </div>
        ${tipsHtml || '<p class="muted center" style="font-size: 15px">Тут поки немає порад. Стань першим, хто поділиться!</p>'}
        <form class="card stack" style="padding: 18px; gap: 12px; border-radius: 20px" data-tip-form>${trapField()}
          <label class="field-label" for="tip-text">Що допомагає саме вашій дитині?</label>
          <textarea class="textarea" id="tip-text" rows="3" maxlength="400" placeholder="Наприклад: ми вигадали «чарівну ковдру», під якою нічого не страшно…" required></textarea>
          <fieldset>
            <legend class="small" style="font-weight: 700">Для якого віку (необов'язково)</legend>
            <div class="chips">${TIP_AGES.map((a) => `<button type="button" class="chip" data-age="${a.id}" aria-pressed="false">${a.label}</button>`).join('')}</div>
          </fieldset>
          <label class="sr-only" for="tip-who">Хто ви</label>
          <input class="input" id="tip-who" maxlength="60" placeholder="Хто ви (необов'язково): мама двох дітей, Львів">
          <p class="notice" role="status" data-tip-sent hidden>Дякуємо! Ваша порада зовсім скоро допомагатиме іншим.</p>
          <button class="btn btn--dark btn--block" type="submit">Поділитися порадою</button>
        </form>
      </section>

      <footer class="footer">
        <a class="btn btn--dark btn--block" href="#/shelter">Повернутися в режим укриття</a>
        <p class="small muted">Підготовлено за загальними рекомендаціями з психологічної підтримки дітей у кризових ситуаціях. Не замінює консультації фахівця. Поради батьків — їхній особистий досвід. Оновлено: 25 жовтня 2026.</p>
      </footer>
    </div>`;
  };
  screens['/article/kids'].mount = (root) => {
    root.querySelectorAll('[data-jump]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        root.querySelector('#' + link.dataset.jump).scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    const form = root.querySelector('[data-tip-form]');
    let age = '';
    form.querySelectorAll('[data-age]').forEach((chip) => {
      chip.addEventListener('click', () => {
        age = age === chip.dataset.age ? '' : chip.dataset.age;
        form.querySelectorAll('[data-age]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.age === age)));
      });
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (isBot(form)) { root.querySelector('[data-tip-sent]').hidden = false; return; }
      const text = form.querySelector('#tip-text').value.trim();
      if (!text) return;
      const tip = { text, age, who: form.querySelector('#tip-who').value.trim() };
      outbox.add('tips', tip);
      const mine = store.get('myTips', []);
      mine.push(tip);
      store.set('myTips', mine);
      await render();
      const sent = app.querySelector('[data-tip-sent]');
      if (sent) { sent.hidden = false; sent.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });
  };
  const tipsArt = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#E8EEFB"/><path d="M8 13a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-9l-6 5v-5h-1a4 4 0 0 1-4-4z" fill="#1F4FB8"/><path d="M20 23c-4-2.5-5.5-4.6-5.5-6.3a2.6 2.6 0 0 1 5.5-1.2 2.6 2.6 0 0 1 5.5 1.2c0 1.7-1.5 3.8-5.5 6.3z" fill="#FFCF33"/></svg>`;

  // ---------- Дії по кліку ----------
  app.addEventListener('click', async (event) => {
    if (event.target.closest('[data-back]') && navStack.length > 1) {
      event.preventDefault();
      history.back();
      return;
    }
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    // Фокус на саме вікно меню, а не на перший пункт, щоб не з'являлась синя рамка
    if (action === 'menu') { menu.showModal(); menu.focus(); }
    if (action === 'install') {
      if (!installPrompt) return;
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') store.set('installed', true);
      installPrompt = null;
      render();
    }
    if (action === 'welcome-device') { welcomeDevice = target.dataset.device; render(); }
    if (action === 'skip-welcome') { store.set('welcomeDone', true); location.hash = '#/'; }
    if (action === 'topic') { newsTopic = target.dataset.topic; render(); }
    if (action === 'install-tab') { installTab = target.dataset.tab; render(); }
    if (action === 'power-day') { powerDay = Number(target.dataset.day); render(); }
    if (action === 'focus-thanks') {
      const field = app.querySelector('#th-text');
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field.focus({ preventScroll: true });
    }
    if (action === 'pick-group') {
      const key = 'myGroup:' + store.get('region', '');
      const group = target.dataset.group;
      store.set(key, store.get(key, '') === group ? '' : group);
      await render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (action === 'share') {
      const url = location.href.replace(/#.*$/, '');
      const data = { title: 'Сонях', text: 'Сонях: режим укриття, добрі новини і стіна подяк. Працює без інтернету.', url };
      if (navigator.share) {
        try { await navigator.share(data); } catch (e) { /* користувач закрив */ }
      } else {
        try {
          await navigator.clipboard.writeText(url);
          app.querySelector('[data-share-ok]').hidden = false;
        } catch (e) { /* немає доступу до буфера */ }
      }
    }
  });
  // ---------- Меню з малюнками ----------
  const ill = (bg, inner) =>
    `<svg width="44" height="44" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="${bg}"/>${inner}</svg>`;
  const MENU = [
    {
      href: '#/shelter', label: 'Режим укриття',
      art: ill('#1F2F5C', '<circle cx="29" cy="11" r="5" fill="#FFE9A3"/><circle cx="31.5" cy="9.3" r="4.2" fill="#1F2F5C"/><circle cx="21" cy="8" r="1" fill="#fff"/><circle cx="12" cy="11" r="0.8" fill="#fff"/><path d="M8 21L20 11l12 10z" fill="#FF8A5C"/><rect x="11" y="20" width="18" height="13" rx="2" fill="#FFCF33"/><rect x="17.5" y="25" width="5" height="8" rx="2.5" fill="#7A4A12"/>')
    },
    { href: '#/power', label: 'Графік світла', art: bulbArt() },
    {
      href: '#/news', label: 'Добрі новини',
      art: ill('#FFF1C2', '<g stroke="#FFB300" stroke-width="2.4" stroke-linecap="round"><path d="M20 5v3M20 32v3M5 20h3M32 20h3M9.4 9.4l2.1 2.1M28.5 28.5l2.1 2.1M9.4 30.6l2.1-2.1M28.5 11.5l2.1-2.1"/></g><circle cx="20" cy="20" r="8" fill="#FFCF33"/><circle cx="17.2" cy="18.6" r="1.2" fill="#7A4A12"/><circle cx="22.8" cy="18.6" r="1.2" fill="#7A4A12"/><path d="M16.6 22q3.4 3.4 6.8 0" stroke="#7A4A12" stroke-width="1.6" fill="none" stroke-linecap="round"/>')
    },
    {
      href: '#/thanks', label: 'Стіна подяк',
      art: ill('#FDE2D8', '<path d="M20 33C11 27.5 8 22.5 8 18.5A5.5 5.5 0 0 1 20 16a5.5 5.5 0 0 1 12 2.5c0 4-3 9-12 14.5z" fill="#F2545B"/><ellipse cx="13.5" cy="18" rx="2" ry="1.3" fill="#fff" opacity=".7"/><path d="M32 4.5l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#FFB300"/><circle cx="8" cy="9" r="1.3" fill="#FFB300"/>')
    },
    {
      href: '#/article/bag', label: 'Тривожна валіза і план дій',
      art: ill('#DDF2E5', '<path d="M15 13v-3a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v3" stroke="#2E8A5F" stroke-width="2.4" fill="none"/><rect x="9" y="12" width="22" height="21" rx="6" fill="#3BA776"/><rect x="13" y="22" width="14" height="8" rx="3" fill="#2E8A5F"/><rect x="18" y="19.5" width="4" height="4.5" rx="1" fill="#FFCF33"/>')
    },
    ...(CONFIG.telegramChannel ? [{ href: `https://t.me/${encodeURIComponent(CONFIG.telegramChannel)}`, label: 'Telegram-канал', art: tgArt(44) }] : []),
    {
      href: '#/install', label: 'Як встановити Сонях',
      art: ill('#E8EEFB', '<rect x="12" y="5" width="15" height="29" rx="3.5" fill="#12203A"/><rect x="14" y="8" width="11" height="21" rx="1.5" fill="#fff"/><g fill="#FFCF33"><circle cx="19.5" cy="15.2" r="2.2"/><circle cx="19.5" cy="21.6" r="2.2"/><circle cx="16.3" cy="18.4" r="2.2"/><circle cx="22.7" cy="18.4" r="2.2"/></g><circle cx="19.5" cy="18.4" r="1.8" fill="#7A4A12"/><circle cx="29" cy="29" r="5.5" fill="#3BA776"/><path d="M29 26.2v5.2M26.7 29.3l2.3 2.3 2.3-2.3" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    },
    {
      href: '#/support', label: 'Підтримати автора',
      art: ill('#FFF3D1', '<path d="M20 21v13" stroke="#3BA776" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="24" cy="29" rx="3.6" ry="2" transform="rotate(-30 24 29)" fill="#3BA776"/><g fill="#FFCF33"><circle cx="25.2" cy="15" r="3"/><circle cx="23.7" cy="18.7" r="3"/><circle cx="20" cy="20.2" r="3"/><circle cx="16.3" cy="18.7" r="3"/><circle cx="14.8" cy="15" r="3"/><circle cx="16.3" cy="11.3" r="3"/><circle cx="20" cy="9.8" r="3"/><circle cx="23.7" cy="11.3" r="3"/></g><circle cx="20" cy="15" r="3.6" fill="#7A4A12"/><path d="M32 12c-3-2-4-3.5-4-4.7a1.9 1.9 0 0 1 4-.8 1.9 1.9 0 0 1 4 .8c0 1.2-1 2.7-4 4.7z" fill="#F2545B"/>')
    }
  ];
  // Малюнки для плиток статей на головній, у тому ж стилі, що й меню
  const articleArt = {
    bag: MENU.find((m) => m.href === '#/article/bag').art,
    blackout: bulbArt(44),
    kids: ill('#FDE2D8', '<circle cx="12" cy="13" r="5" fill="#A86A3B"/><circle cx="28" cy="13" r="5" fill="#A86A3B"/><circle cx="12" cy="13" r="2.4" fill="#F6D7B0"/><circle cx="28" cy="13" r="2.4" fill="#F6D7B0"/><circle cx="20" cy="22" r="11" fill="#C98A55"/><ellipse cx="20" cy="26.5" rx="5" ry="4" fill="#F6D7B0"/><circle cx="16" cy="20" r="1.6" fill="#12203A"/><circle cx="24" cy="20" r="1.6" fill="#12203A"/><ellipse cx="20" cy="25" rx="2" ry="1.4" fill="#12203A"/><path d="M33 6l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" fill="#FFB300"/>'),
    anxiety: ill('#EDE4FF', '<path d="M7 15h17a4.5 4.5 0 1 0-4.5-4.5" stroke="#6B4FD8" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M7 22h22a4.5 4.5 0 1 1-4.5 4.5" stroke="#6B4FD8" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M7 29h9" stroke="#9DB7F2" stroke-width="2.6" stroke-linecap="round"/><path d="M33 8c-2.4-1.5-3.3-2.7-3.3-3.6a1.6 1.6 0 0 1 3.3-.6 1.6 1.6 0 0 1 3.3.6c0 .9-.9 2.1-3.3 3.6z" fill="#F2545B"/>')
  };
  document.getElementById('menu-nav').innerHTML = MENU.map((m) =>
    `<a href="${m.href}"${m.href.startsWith('https://') ? ' target="_blank" rel="noopener"' : ''}>${m.art}<span class="sheet__label">${m.label}</span>${stroke('<path d="M9 6l6 6-6 6"/>', 18, 'var(--muted)')}</a>`).join('');

  menu.addEventListener('click', (event) => {
    if (event.target === menu || event.target.closest('a')) menu.close();
  });

  // ---------- Маршрутизація ----------
  let currentRoute = null;
  let cleanup = null;
  let renderId = 0;

  // Шлях користувача по екранах, щоб «Назад» вів туди, звідки прийшли
  let navStack = [];
  try { navStack = JSON.parse(session.get('nav') || '[]'); } catch (e) { navStack = []; }
  function trackNav(route) {
    if (route === '/welcome') navStack = [];
    else if (navStack.length > 1 && navStack[navStack.length - 2] === route) navStack.pop();
    else if (navStack[navStack.length - 1] !== route) navStack.push(route);
    navStack = navStack.slice(-30);
    session.set('nav', JSON.stringify(navStack));
  }

  function routeFromHash() {
    const path = location.hash.replace(/^#/, '') || '/';
    return screens[path] ? path : '/';
  }

  async function render() {
    const id = ++renderId;
    const route = routeFromHash();
    const screen = screens[route];
    const html = await screen();
    if (id !== renderId) return;
    if (cleanup) { cleanup(); cleanup = null; }
    const changed = route !== currentRoute;
    currentRoute = route;
    if (changed) trackNav(route);
    document.body.classList.toggle('is-night', ['/shelter', '/game', '/kids'].includes(route));
    document.querySelector('meta[name="theme-color"]').setAttribute('content', document.body.classList.contains('is-night') ? '#0E1830' : '#12203A');
    app.innerHTML = html;
    if (screen.mount) cleanup = screen.mount(app) || null;
    updateOnline();
    if (changed) {
      window.scrollTo(0, 0);
      app.focus({ preventScroll: true });
      countVisit(route);
    }
  }

  // ---------- Статистика відвідувань (GoatCounter) ----------
  // Без cookies і без стеження: рахуємо лише, які екрани відкривають. Без інтернету просто не рахує.
  let counterLoading = null;
  function countVisit(route) {
    const code = CONFIG.goatcounterCode;
    if (!code || !navigator.onLine || /^(localhost|127\.)/.test(location.hostname)) return;
    if (!counterLoading) {
      window.goatcounter = { no_onload: true, allow_local: false };
      counterLoading = new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = 'https://gc.zgo.at/count.js';
        s.async = true;
        s.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
        s.onload = resolve;
        s.onerror = () => { counterLoading = null; resolve(); };
        document.head.appendChild(s);
      });
    }
    counterLoading.then(() => {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: route === '/' ? '/' : route, title: document.title });
      }
    });
  }

  function updateOnline() {
    app.querySelectorAll('[data-offline]').forEach((el) => { el.hidden = navigator.onLine; });
  }
  window.addEventListener('online', () => { updateOnline(); outbox.flush(); });
  window.addEventListener('offline', updateOnline);
  window.addEventListener('hashchange', render);

  // ---------- Старт ----------
  if (isStandalone()) store.set('welcomeDone', true);
  if (!location.hash && !store.get('welcomeDone', false)) {
    history.replaceState(null, '', '#/welcome');
  }
  render();
  outbox.flush();

  if ('serviceWorker' in navigator) {
    // Коли приїхала нова версія Соняха, один раз перезавантажуємо сторінку, щоб її показати
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      location.reload();
    });
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => { /* без офлайну, але сайт працює */ });
    });
  }
})();
