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

// 第一次做完才记；返回这次是不是新记上的
function record(p) {
  const d = days();
  if (d[p.key]) return false;
  d[p.key] = { craft: p.craft, rows: p.rows, at: Date.now() };
  store.set(DAYS, d);
  return true;
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
HO.daily = { prompt, today, keyOf, days, record, streak, done: key => !!days()[key] };

})();
