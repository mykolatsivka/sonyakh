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
  const getNews = async () => (await loadJSON('./data/news.json')).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const getThanks = () => loadJSON('./data/thanks.json');

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

  // ---------- Черга відправлення (працює офлайн) ----------
  const outbox = {
    add(type, payload) {
      const items = store.get('outbox', []);
      items.push({ type, payload, createdAt: new Date().toISOString() });
      store.set('outbox', items);
      outbox.flush();
    },
    async flush() {
      if (!CONFIG.apiUrl || !navigator.onLine) return;
      const items = store.get('outbox', []);
      const left = [];
      for (const item of items) {
        try {
          const res = await fetch(`${CONFIG.apiUrl.replace(/\/$/, '')}/${item.type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });
          if (!res.ok) left.push(item);
        } catch (e) {
          left.push(item);
        }
      }
      store.set('outbox', left);
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
        <div class="news-card__img">${top.image ? `<img src="${esc(top.image)}" alt="">` : logo(56, true)}</div>
        <div class="news-card__body">
          <span class="eyebrow">${esc(topicLabel(top.topic))}</span>
          <h3 class="news-card__title">${esc(top.title)}</h3>
          <p class="muted" style="font-size: 15px">${esc(top.text)}</p>
        </div>
      </a>` : '<p class="muted">Скоро тут з\'явиться перша добра новина.</p>';

    const thanksBlock = thanks.slice(0, 2).map((t) => `
      <div class="card thanks-card">
        <span class="thanks-card__to">${esc(t.to)}</span>
        <p style="font-size: 15px">${esc(t.text)}</p>
        <span class="small muted">${esc(t.who)}</span>
      </div>`).join('');

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
        </section>

        <section class="stack">
          <div class="row-between">
            <h2 class="h2">Стіна подяк</h2>
            <a href="#/thanks" style="font-size: 14px; font-weight: 600">Подякувати</a>
          </div>
          ${thanksBlock}
        </section>

        <section class="grid-2">
          <a class="tile tile--yellow" href="#/article/bag">${icon.bag()} Тривожна валіза і план дій</a>
          <a class="tile" href="#/article/blackout">${icon.bolt()} Що робити під час блекауту</a>
          <span class="tile tile--soon">${icon.person()} Як заспокоїти дитину<span class="tile__soon">Скоро</span></span>
          <span class="tile tile--soon">${icon.pulse()} Коли тривожно: швидка допомога собі<span class="tile__soon">Скоро</span></span>
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
        <div class="news-card__img">${first.image ? `<img src="${esc(first.image)}" alt="">` : logo(56, true)}</div>
        <div class="news-card__body">
          <div class="row-between eyebrow"><span>${esc(topicLabel(first.topic))}</span><span class="muted">${esc(relDate(first.date))}</span></div>
          <h2 class="news-card__title" style="font-size: 19px">${esc(first.title)}</h2>
          <p class="muted" style="font-size: 15px">${esc(first.text)}</p>
          ${first.sourceUrl ? `<a href="${esc(first.sourceUrl)}" target="_blank" rel="noopener" style="font-size: 14px; font-weight: 600">Джерело: ${esc(first.source)}</a>` : ''}
        </div>
      </article>` : '<p class="muted">У цій темі поки немає новин. Загляни трохи згодом.</p>';
    const restHtml = rest.map((n, i) => `
      <article class="card news-row">
        <div class="news-row__thumb" style="background: ${TINTS[i % TINTS.length]}">${n.image ? `<img src="${esc(n.image)}" alt="">` : ''}</div>
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
        <p class="muted">Тільки те, що гріє. Кожна новина перевірена і має посилання на джерело.</p>
        <div class="chips" role="group" aria-label="Теми">
          ${NEWS_TOPICS.map((t) => `<button class="chip" data-action="topic" data-topic="${t.id}" aria-pressed="${t.id === newsTopic}">${t.label}</button>`).join('')}
        </div>
        ${firstHtml}
        ${restHtml}
        <section class="hero" style="gap: 12px">
          <h2 class="h2">Бачив щось хороше?</h2>
          <p class="hero__text">Поділися доброю новиною зі свого міста. Найкращі потраплять у стрічку.</p>
          <form class="stack" data-suggest hidden>
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
        <p class="small muted">Складено за рекомендаціями ДСНС. [Дата перевірки статті]</p>
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
    const mine = store.get('myThanks', []).slice().reverse();
    const mineHtml = mine.map((t) => `
      <article class="card thanks-card thanks-card--mine">
        <span class="thanks-card__to">${esc(t.to)}</span>
        <p>${esc(t.text)}</p>
        <span class="small muted">Твоя подяка · зовсім скоро її побачать усі</span>
      </article>`).join('');
    const cardsHtml = thanks.map((t) => {
      const on = !!warmed[t.id];
      const n = (t.warm || 0) + (on ? 1 : 0);
      return `
        <article class="card thanks-card">
          <span class="thanks-card__to">${esc(t.to)}</span>
          <p>${esc(t.text)}</p>
          <div class="row-center">
            <span class="small muted">${esc(t.who)}</span>
            <button class="warm" data-action="warm" data-id="${esc(t.id)}" data-base="${t.warm || 0}" aria-pressed="${on}" aria-label="Тепло, ${n}">${icon.heart('currentColor', 16)}<span>${n}</span></button>
          </div>
        </article>`;
    }).join('');

    return `
      <div class="page">
        <header class="topbar"><div class="topbar__left">${backBtn('#/', 'На головну')}<h1 class="h1 h1--sm">Стіна подяк</h1></div></header>
        <form class="card stack" style="padding: 20px; gap: 14px; border-radius: 24px" data-thanks-form>
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
        </section>
      </div>`;
  };
  screens['/thanks'].mount = (root) => {
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
      btn.addEventListener('click', () => {
        const warmed = store.get('warmed', {});
        const id = btn.dataset.id;
        warmed[id] = !warmed[id];
        store.set('warmed', warmed);
        const n = Number(btn.dataset.base) + (warmed[id] ? 1 : 0);
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
    const hasLink = !!CONFIG.donateUrl;
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
            ? `<a class="btn btn--yellow btn--block" style="min-height: 58px; font-size: 17px" href="${esc(CONFIG.donateUrl)}" target="_blank" rel="noopener">${icon.heart('currentColor', 22)} Підтримати через банку</a>`
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

  const getRegions = () => loadJSON('./data/regions.json');
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
        <p class="small muted">Складено за рекомендаціями ДСНС. [Дата перевірки статті]</p>
      </footer>
    </div>`;

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

    if (action === 'menu') menu.showModal();
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
    {
      href: '#/install', label: 'Як встановити Сонях',
      art: ill('#E8EEFB', '<rect x="12" y="5" width="15" height="29" rx="3.5" fill="#12203A"/><rect x="14" y="8" width="11" height="21" rx="1.5" fill="#fff"/><g fill="#FFCF33"><circle cx="19.5" cy="15.2" r="2.2"/><circle cx="19.5" cy="21.6" r="2.2"/><circle cx="16.3" cy="18.4" r="2.2"/><circle cx="22.7" cy="18.4" r="2.2"/></g><circle cx="19.5" cy="18.4" r="1.8" fill="#7A4A12"/><circle cx="29" cy="29" r="5.5" fill="#3BA776"/><path d="M29 26.2v5.2M26.7 29.3l2.3 2.3 2.3-2.3" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    },
    {
      href: '#/support', label: 'Підтримати автора',
      art: ill('#FFF3D1', '<path d="M20 21v13" stroke="#3BA776" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="24" cy="29" rx="3.6" ry="2" transform="rotate(-30 24 29)" fill="#3BA776"/><g fill="#FFCF33"><circle cx="25.2" cy="15" r="3"/><circle cx="23.7" cy="18.7" r="3"/><circle cx="20" cy="20.2" r="3"/><circle cx="16.3" cy="18.7" r="3"/><circle cx="14.8" cy="15" r="3"/><circle cx="16.3" cy="11.3" r="3"/><circle cx="20" cy="9.8" r="3"/><circle cx="23.7" cy="11.3" r="3"/></g><circle cx="20" cy="15" r="3.6" fill="#7A4A12"/><path d="M32 12c-3-2-4-3.5-4-4.7a1.9 1.9 0 0 1 4-.8 1.9 1.9 0 0 1 4 .8c0 1.2-1 2.7-4 4.7z" fill="#F2545B"/>')
    }
  ];
  document.getElementById('menu-nav').innerHTML = MENU.map((m) =>
    `<a href="${m.href}">${m.art}<span class="sheet__label">${m.label}</span>${stroke('<path d="M9 6l6 6-6 6"/>', 18, 'var(--muted)')}</a>`).join('');

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
    }
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
