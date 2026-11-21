/* 有手就行 · 今日一件
 * 题目由本地日期算出来，不用服务器：同一天谁打开都是同一件。
 * 手艺按 ORDER 每天轮一种；种子决定针法和颜色，目标排数 8–12。
 * 完成的日子记在 hands-on.days，连续天数从这里算。规则见 docs/daily.md。
 */
(() => {
'use strict';
const { hash, store } = HO;

const ORDER = ['embroidery', 'knitting'];
const EPOCH = Date.UTC(2026, 10, 21);   // 第 0 天
const DAYS = 'hands-on.days';

const pad = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = key => key.split('-').map(Number);

function prompt(key) {
  const [y, m, d] = parse(key);
  const n = Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 864e5);
  const craft = ORDER[((n % ORDER.length) + ORDER.length) % ORDER.length];
  const seed = (Math.floor(hash(y, m * 32 + d, 0x5EED) * 0xFFFFFFFF) >>> 0) || 1;
  const rows = 8 + Math.floor(hash(seed, 3, 7) * 5);
  return { key, n, craft, seed, rows };
}

const today = () => prompt(keyOf(new Date()));

function days() {
  const v = store.get(DAYS, {});
  return v && typeof v === 'object' ? v : {};
}

// 请浏览器别自动清掉存档（Safari 七天不来会清脚本写的数据；Chrome 对常来的网站会同意）。不做备份，只靠这个
function persist() {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
}

// 第一次做完才记；返回这次是不是新记上的
function record(p) {
  const d = days();
  if (d[p.key]) return false;
  d[p.key] = { craft: p.craft, rows: p.rows, at: Date.now() };
  store.set(DAYS, d);
  persist();
  return true;
}

// 第 n 天的日期
function keyAt(n) {
  const t = new Date(EPOCH + n * 864e5);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/* 墙码：一件作品完全由日期决定，所以整面墙 = 哪几天做完了（分享整面墙用）。
 * 从第 0 天起每天一位，压成 base64url，前面一个字母是版本。一年约 60 个字。 */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function encode(list = Object.keys(days())) {
  const ns = list.map(k => prompt(k).n).filter(n => n >= 0);
  if (!ns.length) return '';
  const bits = new Uint8Array(Math.max(...ns) + 1);
  for (const n of ns) bits[n] = 1;
  let out = 'a';
  for (let i = 0; i < bits.length; i += 6) {
    let v = 0;
    for (let j = 0; j < 6; j++) v |= (bits[i + j] || 0) << j;
    out += B64[v];
  }
  return out;
}

// 返回日期列表；看不懂的码返回 null
function decode(code) {
  if (!/^a[A-Za-z0-9_-]{1,2000}$/.test(code || '')) return null;
  const list = [];
  for (let i = 1; i < code.length; i++) {
    const v = B64.indexOf(code[i]);
    for (let j = 0; j < 6; j++) if (v >> j & 1) list.push(keyAt((i - 1) * 6 + j));
  }
  return list;
}

// 连续天数：今天做完了从今天数，没做完从昨天数（今天还有机会，不算断）
function streak() {
  const d = days(), now = new Date();
  let day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!d[keyOf(day)]) day.setDate(day.getDate() - 1);
  let n = 0;
  while (d[keyOf(day)]) { n++; day.setDate(day.getDate() - 1); }
  return n;
}

HO.ORDER = ORDER;
HO.daily = { prompt, today, keyOf, keyAt, days, record, streak, encode, decode, persist, done: key => !!days()[key] };

})();
