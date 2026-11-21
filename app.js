/* 有手就行 · 外壳
 * 工作桌（首页）↔ 每个小玩意。路由用 hash：#/ 是桌子，#/embroidery、#/knitting 是两样东西。
 * 这里管：画布尺寸、每帧循环、键盘/手势分发、上面的面包屑和大数字、下面的按键提示、声音和语言。
 */
(() => {
'use strict';
const { store, sound, audio, paper, angDiff } = HO;

const ORDER = HO.ORDER;

const STR = {
  zh: {
    series: '有手就行',
    stitch_next: (n, s) => `再绣 ${n} 排 · 解锁${s}`,
    knit_next: (n, s) => `再织 ${n} 排 · 解锁${s}`,
    row: n => `第 ${n} 排`,
    tip_keys: '照顺序按，循环下去就是一排',
    tip_touch: '照箭头方向划，循环下去就是一排',
    tip_pullNeedle: '抓住针眼那头往外拖，就能拆掉',
    tip_pullYarn: '抓住右边垂下去的毛线往外拖，就能拆掉',
    newStitch: '新针法',
    fresh: '拆光了，换一块重新来',
    more: '更多小玩意，陆续上桌',
    notYet: '还没动手',
    sound: '声音',
    lang: 'English',
    desc: '把打发时间的手作，变成屏幕上的小游戏。',
    today: '今日一件',
    todayWhat: (craft, n) => `${craft} · ${n} 排`,
    dayLeft: n => `今天还差 ${n} 排`,
    dayDone: s => s > 1 ? `今天做完了 · 连续 ${s} 天` : '今天做完了',
    dayProgress: (r, n) => `做到第 ${r} / ${n} 排`,
    dayToast: '今天这件做完了',
    dayNew: '大家今天做的是同一件',
    wall: '作品墙',
    wallLink: n => `作品墙 · ${n} 件 →`,
    wallCount: n => n ? `挂了 ${n} 件` : '还没有作品。做完今日一件，就会挂上来',
    wallShared: n => `一面分享来的墙 · ${n} 件`,
    wallBad: '这个链接读不出来',
    wallToday: '今天的还没做',
    stripSum: (d, r) => d ? `${d} 天 · ${r} 排` : '',
    stripEmpty: '还空着',
    goToday: '去做今天的',
  },
  en: {
    series: 'Hands-on',
    stitch_next: (n, s) => `${n} more row${n > 1 ? 's' : ''} · unlocks ${s}`,
    knit_next: (n, s) => `${n} more row${n > 1 ? 's' : ''} · unlocks ${s}`,
    row: n => `Row ${n}`,
    tip_keys: 'Press in order, loop it, and that’s a row',
    tip_touch: 'Swipe along the arrows, loop it, and that’s a row',
    tip_pullNeedle: 'Grab the needle by its eye and pull to unpick',
    tip_pullYarn: 'Grab the hanging yarn on the right and pull to unravel',
    newStitch: 'New stitch',
    fresh: 'All undone, starting fresh',
    more: 'More small things coming to the table',
    notYet: 'Not started',
    sound: 'Sound',
    lang: '中文',
    desc: 'Idle-time handcrafts, turned into small screen games.',
    today: 'Today’s piece',
    todayWhat: (craft, n) => `${craft} · ${n} rows`,
    dayLeft: n => `${n} more row${n > 1 ? 's' : ''} today`,
    dayDone: s => s > 1 ? `Done today · ${s}-day streak` : 'Done today',
    dayProgress: (r, n) => `Row ${r} of ${n}`,
    dayToast: 'Today’s piece is done',
    dayNew: 'Everyone makes the same piece today',
    wall: 'Wall',
    wallLink: n => `Wall · ${n} piece${n > 1 ? 's' : ''} →`,
    wallCount: n => n ? `${n} piece${n > 1 ? 's' : ''} on the wall` : 'Nothing yet. Finish today’s piece and it goes up here',
    wallShared: n => `A shared wall · ${n} piece${n > 1 ? 's' : ''}`,
    wallBad: 'This link can’t be read',
    wallToday: 'Not done yet',
    stripSum: (d, r) => d ? `${d} day${d > 1 ? 's' : ''} · ${r} rows` : '',
    stripEmpty: 'Nothing yet',
    goToday: 'Make today’s',
  },
};

let lang = store.get('hands-on.lang', 'zh');
if (!STR[lang]) lang = 'zh';
const T = o => o == null ? '' : typeof o === 'string' ? o : (o[lang] || o.zh);
const t = k => STR[lang][k];

// ───────────────────────── DOM ─────────────────────────

const $ = id => document.getElementById(id);
const cv = $('c'), g = cv.getContext('2d');
const elHome = $('crumb-home'), elSep = $('crumb-sep'), elPiece = $('crumb-piece');
const elLen = $('len'), elNext = $('next'), elScore = $('score');
const elDock = $('dock'), elName = $('stname'), elCaps = $('caps'), elTip = $('tip');
const elToast = $('toast'), elSnd = $('snd'), elLang = $('lang'), elTable = $('table'), elMore = $('more');

const ARROW = deg => `<svg viewBox="0 0 24 24" style="transform:rotate(${deg}deg)" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter"/></svg>`;
const ICON_SND_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';
const ICON_SND_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/><path d="M3 3l18 18" class="cut"/></svg>';
elLang.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9M12 3C9.4 5.6 8.2 8.6 8.2 12s1.2 6.4 3.8 9"/></svg>';

// ───────────────────────── 画布与循环 ─────────────────────────

let game = null;
let V = null;

function measure() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  const top = elNext.getBoundingClientRect().bottom + 6;
  const bottom = elDock.getBoundingClientRect().top - 6;
  V = { W, H, dpr, top, bottom: Math.max(bottom, top + 200) };
}

function layout() {
  if (!game) return;
  measure();
  game.layout(V);
  kick();
}

let running = false, lastT = 0;
function kick() {
  if (running || !game || !V) return;
  running = true;
  lastT = performance.now();
  requestAnimationFrame(frame);
}
function frame(now) {
  if (!game) { running = false; return; }
  const dt = Math.min(.05, (now - lastT) / 1000);
  lastT = now;
  const active = game.update(dt, now);
  g.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
  g.clearRect(0, 0, V.W, V.H);
  game.draw(g, now);
  if (active) requestAnimationFrame(frame);
  else running = false;   // 没东西在动就停，省电
}

// ───────────────────────── 路由 ─────────────────────────

let daily = null;   // 在做今日一件时是当天的题目，否则 null
let wall = null;    // 在看作品墙时：{ code }，code 为 null 是自己的墙，否则是分享来的
let visit = 0;      // 每进一次门加一，「开始动手」每次进门只记一次

function route() {
  const id = location.hash.replace(/^#\/?/, '');
  daily = id === 'today' ? HO.daily.today() : null;
  wall = id === 'wall' ? { code: null } : id.startsWith('wall/') ? { code: id.slice(5) } : null;
  game = wall ? null : HO.games[daily ? daily.craft : id] || null;
  document.body.classList.toggle('home', !game);
  document.body.classList.toggle('wall', !!wall);
  ptr = null;
  visit++;
  if (game) {
    game.enter({ daily });
    renderHud();
    layout();
  } else {
    running = false;
    if (wall) paintWall(); else paintHome();
  }
  renderChrome();
  // 备份码是用户自己的数据，不送进统计
  HO.page(wall ? (wall.code ? '/wall/shared' : '/wall') : daily ? '/today' : game ? `/${game.id}` : '/');
}

// 第一次走对一步：真的开始动手了（只是点进来看看的不算）
function started() {
  HO.trackOnce(visit, daily ? 'daily_start' : 'craft_start', {
    craft: game.id, input: HO.mode, ...(daily ? { day: daily.key } : {}),
  });
}

// ───────────────────────── 上面和下面 ─────────────────────────

function renderChrome() {
  elHome.textContent = t('series');
  elSep.hidden = elPiece.hidden = !game && !wall;
  const piece = wall ? t('wall') : game ? (daily ? `${t('today')} · ${T(game.name)}` : T(game.name)) : '';
  elPiece.textContent = piece;
  document.title = piece ? `${t('series')} / ${piece}` : `${t('series')} · hands-on`;
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
  elSnd.innerHTML = HO.muted ? ICON_SND_OFF : ICON_SND_ON;
  elSnd.setAttribute('aria-label', t('sound'));
  elSnd.setAttribute('aria-pressed', String(!HO.muted));
  elLang.setAttribute('aria-label', t('lang'));
  elLang.title = t('lang');
  elMore.textContent = t('more');
}

function renderHud() {
  if (!game) return;
  const h = game.hud(HO.mode);
  elLen.textContent = h.len;
  if (daily) {
    // 第一次做够排数：记进作品墙。之后可以接着做，多做的不算
    if (h.rows >= daily.rows && HO.daily.record(daily)) {
      sound.fanfare();
      toast('dayToast');
      HO.track('daily_complete', { craft: game.id, day: daily.key, rows: daily.rows, streak: HO.daily.streak() });
    }
    elNext.textContent = HO.daily.done(daily.key)
      ? t('dayDone')(HO.daily.streak())
      : t('dayLeft')(daily.rows - h.rows);
  } else {
    elNext.textContent = h.next
      ? t(game.verb === 'knit' ? 'knit_next' : 'stitch_next')(h.next.n, T(h.next.name))
      : t('row')(h.row);
  }
  elName.textContent = h.name.map(T).join(' · ');
  elCaps.innerHTML = h.steps.map(s => {
    const face = s.arrow == null ? s.face : ARROW(s.arrow);
    const label = s.label ? `<small>${s.label.map(T).join(' · ')}</small>` : '';
    return `<span class="cap ${s.state}"><b>${face}</b>${label}</span>`;
  }).join('');
  elDock.classList.toggle('red', h.red);
  elDock.classList.toggle('labels', h.steps.some(s => s.label));
  if (h.tip) elTip.textContent = t('tip_' + h.tip);
  elTip.classList.toggle('off', !h.tip);
}

let toastT = 0;
function toast(kind, name) {
  elToast.innerHTML = `<em>${t(kind)}</em>${name ? `<strong>${T(name)}</strong>` : ''}`;
  elToast.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => elToast.classList.remove('on'), 2600);
}

HO.app = { toast };

// ───────────────────────── 工作桌（首页） ─────────────────────────

const items = ORDER.map((id, i) => {
  const gm = HO.games[id];
  const a = document.createElement('a');
  a.className = 'item';
  a.href = `#/${id}`;
  a.style.setProperty('--rot', `${i % 2 ? 2.2 : -2.6}deg`);
  a.innerHTML = '<canvas aria-hidden="true"></canvas><span class="no"></span><span class="nm"></span><span class="sub"></span>';
  elTable.appendChild(a);
  return { gm, a, cv: a.querySelector('canvas'), no: a.querySelector('.no'), nm: a.querySelector('.nm'), sub: a.querySelector('.sub') };
});

function paintToday() {
  const p = HO.daily.today(), gm = HO.games[p.craft];
  const [, m, d] = p.key.split('-');
  $('t-date').innerHTML = `<b>${m}.${d}</b><small>N°${String(p.n + 1).padStart(3, '0')}</small>`;
  $('t-ttl').textContent = t('today');
  $('t-what').textContent = t('todayWhat')(T(gm.name), p.rows);
  const done = HO.daily.done(p.key), rows = gm.saved(p).rows;
  $('t-st').textContent = done ? t('dayDone')(HO.daily.streak())
    : rows > 0 ? t('dayProgress')(Math.min(rows + 1, p.rows), p.rows)
    : t('dayNew');
  $('today').classList.toggle('done', done);
  const n = Object.keys(HO.daily.days()).length, link = $('wall-link');
  link.hidden = !n;
  link.textContent = t('wallLink')(n);
}

function paintHome() {
  paintToday();
  for (const it of items) {
    it.no.textContent = `N°${it.gm.no}`;
    it.nm.textContent = T(it.gm.name);
    const len = it.gm.savedLen();
    it.sub.textContent = len > 0 ? `${len.toFixed(1)} cm` : t('notYet');
    paintPiece(it.cv, it.gm, (c, w, h) => it.gm.preview(c, w, h));
  }
}

// 把一件东西画进一块画布；悬空的（围巾）先画到离屏，再垫一层错开的软影子
const off = document.createElement('canvas');
function paintPiece(cv, gm, draw) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = cv.getBoundingClientRect();
  if (!r.width) return;
  cv.width = Math.round(r.width * dpr);
  cv.height = Math.round(r.height * dpr);
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, r.width, r.height);
  const f = gm.floats;
  if (!f) { draw(c, r.width, r.height); return; }
  off.width = cv.width;
  off.height = cv.height;
  const o = off.getContext('2d');
  o.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw(o, r.width, r.height);
  const u = r.width * .066;
  HO.floatShadow(c, off, r.width, r.height, u * f.dx, u * f.dy, f.alpha, dpr);
  c.drawImage(off, 0, 0, r.width, r.height);
}

// ───────────────────────── 作品墙 ─────────────────────────

const elWHead = $('w-head'), elWActs = $('w-acts'), elWStrips = $('w-strips');
let segs = [];   // 每天一块画布 { cv, gm, p, edge, w, done }
let seen = null; // 滚到附近才画

/* 作品墙 = 每种手艺一条长长的织物：每天做完的那几排接上去。
 * 刺绣布往下长（最早一天在上、带流苏），围巾挂在针上往下垂（最新一天在上、挨着针）。
 * 自己的墙在长的那一头留「今天的还没做」；分享来的墙只读。 */
function paintWall() {
  const shared = wall.code != null;
  const list = shared ? HO.daily.decode(wall.code) : Object.keys(HO.daily.days());
  elWActs.innerHTML = '';
  elWStrips.innerHTML = '';
  segs = [];
  if (seen) seen.disconnect();
  if (!list) { elWHead.textContent = t('wallBad'); return; }

  const have = [...new Set(list)].map(k => HO.daily.prompt(k)).filter(p => p.n >= 0);
  const today = HO.daily.today(), todo = !shared && !HO.daily.done(today.key);
  elWHead.textContent = shared ? t('wallShared')(have.length) : t('wallCount')(have.length);

  for (const craft of ORDER) {
    const gm = HO.games[craft], st = gm.strip;
    const ps = have.filter(p => p.craft === craft).sort((a, b) => a.n - b.n);
    const col = document.createElement('div');
    col.className = `strip ${st.grows}`;
    const rows = ps.reduce((s, p) => s + p.rows, 0);
    col.innerHTML = `<p class="strip-name"><b>${T(gm.name)}</b><small>${t('stripSum')(ps.length, rows)}</small></p><div class="strip-body"></div>`;
    elWStrips.appendChild(col);
    const body = col.querySelector('.strip-body'), w = body.clientWidth;

    // 今天轮到这一种、还没做：在会长出来的那一头留一个红色虚线框
    const todoEl = todo && today.craft === craft ? Object.assign(document.createElement('a'), {
      href: '#/today', className: 'strip-todo', textContent: t('wallToday'),
    }) : null;
    if (todoEl && st.grows === 'up') col.insertBefore(todoEl, body);
    if (!ps.length && !todoEl) body.innerHTML = `<span class="strip-empty">${t('stripEmpty')}</span>`;

    const order = st.grows === 'down' ? ps : ps.slice().reverse();
    const pad = st.pad(w);
    let y = 0;
    for (const p of order) {
      const edge = { oldest: p === ps[0], newest: p === ps[ps.length - 1] };
      const h = st.height(w, p, edge);
      const cv = document.createElement('canvas');
      cv.setAttribute('aria-hidden', 'true');
      Object.assign(cv.style, { top: `${y - pad}px`, width: `${w}px`, height: `${h + 2 * pad}px` });
      const [, m, d] = p.key.split('-');
      const tag = document.createElement('span');
      tag.className = 'strip-tag';
      tag.style.top = `${y + h / 2}px`;
      tag.innerHTML = `<b>${m}.${d}</b><small>${p.rows}</small>`;
      body.append(cv, tag);
      segs.push({ cv, gm, p, edge, w, done: false });
      y += h;
    }
    if (ps.length) body.style.height = `${y}px`;
    if (todoEl && st.grows === 'down') col.appendChild(todoEl);
  }

  // 分享来的墙只能看；下面只留一个去做今天的入口
  if (shared) {
    const a = document.createElement('a');
    a.href = '#/today';
    a.className = 'btn';
    a.textContent = t('goToday');
    elWActs.appendChild(a);
  }
  // 一年下来会有几百块画布：滚到附近才画，画过就不再管
  const paint = s => {
    if (s.done) return;
    s.done = true;
    paintPiece(s.cv, s.gm, c => s.gm.strip.draw(c, s.w, s.p, s.edge));
  };
  if ('IntersectionObserver' in window) {
    seen = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      seen.unobserve(e.target);
      paint(segs.find(s => s.cv === e.target));
    }), { root: $('wall'), rootMargin: '800px 0px' });
    segs.forEach(s => seen.observe(s.cv));
  } else segs.forEach(paint);
}

// ───────────────────────── 输入 ─────────────────────────

function setMode(m) {
  if (HO.mode === m) return;
  HO.mode = m;
  renderHud();
}

window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape' && (game || wall)) { location.hash = '#/'; return; }
  if (!game || e.repeat) return;
  const K = e.key.length === 1 ? e.key.toUpperCase() : '';
  if (!K || !game.keys.includes(K)) return;
  e.preventDefault();
  audio();
  setMode('keys');
  if (game.key(K)) started();
  renderHud();
  kick();
});

let ptr = null;
const SWIPE = 22;
cv.addEventListener('pointerdown', e => {
  if (!game) return;
  audio();
  if (e.pointerType === 'touch') setMode('touch');
  const grab = game.grab(e.clientX, e.clientY);
  ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, fired: false, last: 0, pull: grab };
  if (grab) {
    game.pullStart(e.clientX, e.clientY);
    cv.style.cursor = 'grabbing';
    kick();
  }
  if (cv.setPointerCapture) { try { cv.setPointerCapture(e.pointerId); } catch (err) {} }
});
cv.addEventListener('pointermove', e => {
  if (!game) return;
  if (!ptr) {
    if (e.pointerType === 'mouse') cv.style.cursor = game.grab(e.clientX, e.clientY) ? 'grab' : '';
    return;
  }
  if (e.pointerId !== ptr.id) return;
  if (ptr.pull) {
    if (game.pullMove(e.clientX, e.clientY)) renderHud();
    kick();
    return;
  }
  const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
  if (Math.hypot(dx, dy) < SWIPE) return;
  const ang = Math.atan2(dy, dx);
  // 一划只算一步；手不抬、拐了弯才算下一步（可以连着画折线）
  if (ptr.fired && angDiff(ang, ptr.last) < 1.0) { ptr.x = e.clientX; ptr.y = e.clientY; return; }
  setMode('touch');
  if (game.swipe(ang, ptr.fired)) {
    started();
    if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(6);
  }
  ptr.fired = true;
  ptr.last = ang;
  ptr.x = e.clientX;
  ptr.y = e.clientY;
  renderHud();
  kick();
});
const endPtr = e => {
  if (!ptr || e.pointerId !== ptr.id) return;
  if (ptr.pull) { game && game.pullEnd(); cv.style.cursor = ''; renderHud(); kick(); }
  ptr = null;
};
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', endPtr);

elSnd.addEventListener('click', () => {
  HO.muted = !HO.muted;
  if (!HO.muted) { audio(); sound.tick(0); }
  renderChrome();
});

elLang.addEventListener('click', () => {
  lang = lang === 'zh' ? 'en' : 'zh';
  HO.lang = lang;
  store.set('hands-on.lang', lang);
  renderChrome();
  if (game) { renderHud(); layout(); } else if (wall) paintWall(); else paintHome();
});

let resizeT = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => (game ? layout() : wall ? paintWall() : paintHome()), 60);
});
window.addEventListener('hashchange', route);

// ───────────────────────── 开始 ─────────────────────────

HO.lang = lang;
paper();
route();

})();
