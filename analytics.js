/* 有手就行 · 统计（GA4）
 * 只在正式网址、填了 ID 时才加载 Google 的脚本；本地开发只打印到控制台。
 * 不弹同意框：欧洲经济区、英国、瑞士默认不写 cookie（Consent Mode 只发无 cookie 的匿名信号），
 * 其他地区记统计；广告类一律关闭。
 * 路由是 #/…，所以页面浏览自己发：/、/embroidery、/knitting、/today。
 * 事件和漏斗见 docs/analytics.md。
 */
(() => {
'use strict';

const ID = '';   // GA4 衡量 ID，形如 G-XXXXXXXXXX
const HOST = 'hands-on.withzurara.com';
const STRICT = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT',
  'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH'];

const live = !!ID && location.hostname === HOST;
const dev = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

let gtag = () => {};
if (live) {
  window.dataLayer = window.dataLayer || [];
  gtag = function () { window.dataLayer.push(arguments); };
  const ads = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  gtag('consent', 'default', { ...ads, analytics_storage: 'denied', region: STRICT });
  gtag('consent', 'default', { ...ads, analytics_storage: 'granted' });
  gtag('js', new Date());
  gtag('config', ID, { send_page_view: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
  document.head.appendChild(s);
}

function track(name, params = {}) {
  if (live) gtag('event', name, params);
  else if (dev) console.debug('[track]', name, params);
}

let lastPath = null;
function page(path) {
  if (path === lastPath) return;
  lastPath = path;
  track('page_view', { page_location: location.origin + path, page_path: path, page_title: document.title });
}

// 同一次进门只记一次（比如「开始动手」）
const once = new Set();
function trackOnce(key, name, params) {
  if (once.has(key)) return;
  once.add(key);
  track(name, params);
}

HO.track = track;
HO.trackOnce = trackOnce;
HO.page = page;

})();
