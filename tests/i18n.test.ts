import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { URL } from 'node:url';

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const catalogFiles = ['assets/js/locales/zh-CN.js', 'assets/js/locales/en.js'];

function catalogs() {
  const context = { window: {} as any };
  catalogFiles.forEach(file => runInNewContext(read(file), context));
  return context.window.WUPAGE_MESSAGES as Record<string, Record<string, string>>;
}

test('all languages have the same keys and interpolation parameters', () => {
  const messages = catalogs();
  const keys = Object.keys(messages['zh-CN']).sort();
  assert.deepEqual(Object.keys(messages.en).sort(), keys);
  for (const key of keys) {
    assert.ok(messages.en[key].trim(), `${key} needs an English translation`);
    assert.deepEqual(messages.en[key].match(/\{\w+\}/g), messages['zh-CN'][key].match(/\{\w+\}/g), key);
  }
});

test('every page translation and checkout error code has a catalog entry', () => {
  const messages = catalogs();
  for (const page of ['index', 'guide', 'api', 'terms', 'privacy', 'thanks']) {
    const html = read(`${page}.html`);
    for (const match of html.matchAll(/data-i18n(?:-[\w-]+)?="([\w.]+)"/g)) {
      assert.ok(Object.hasOwn(messages['zh-CN'], match[1]), `${page}: ${match[1]}`);
    }
    const scripts = [...html.matchAll(/<script src="([^"?]+)[^"]*" defer>/g)].map(match => match[1]);
    assert.deepEqual(scripts.slice(0, 3), [...catalogFiles, 'assets/js/i18n.js']);
    assert.match(html, /id="languageSelect"/);
  }
  for (const match of read('src/payments.ts').matchAll(/code: '(payments\.\w+)'/g)) {
    assert.ok(Object.hasOwn(messages.en, match[1]), match[1]);
  }
});

// Exercise the browser-independent language and URL behavior without a DOM dependency.
function runtime(options: { url?: string; saved?: string; languages?: string[]; blocked?: boolean } = {}) {
  const saved = new Map<string, string>();
  if (options.saved) saved.set('wupage.locale', options.saved);
  const boundText: any[] = [];
  const events: any[] = [];
  const window: any = {
    location: new URL(options.url ?? 'https://example.com/guide.html?source=test#step-3'),
    localStorage: {
      getItem: (key: string) => { if (options.blocked) throw new Error(); return saved.get(key); },
      setItem: (key: string, value: string) => { if (options.blocked) throw new Error(); saved.set(key, value); },
    },
    addEventListener() {},
  };
  window.history = { state: { retained: true }, replaceState(_state: unknown, _title: string, url: string) { window.location = new URL(url); } };
  const document = {
    documentElement: { lang: '' },
    querySelector: () => null,
    querySelectorAll: (selector: string) => selector === '[data-i18n]' ? boundText : [],
    dispatchEvent: (event: unknown) => events.push(event),
  };
  const context = {
    window, document, navigator: { languages: options.languages ?? ['en-US'] }, URL,
    CustomEvent: class {
      type: string;
      options: unknown;
      constructor(type: string, options: unknown) { this.type = type; this.options = options; }
    },
  };
  catalogFiles.forEach(file => runInNewContext(read(file), context));
  runInNewContext(read('assets/js/i18n.js'), context);
  return { i18n: window.WuPageI18n, window, document, saved, events, boundText };
}

test('language priority is URL, saved preference, supported browser language, then Chinese', () => {
  assert.equal(runtime({ url: 'https://example.com/?lang=zh-CN', saved: 'en' }).i18n.locale, 'zh-CN');
  assert.equal(runtime({ saved: 'zh-CN' }).i18n.locale, 'zh-CN');
  assert.equal(runtime({ languages: ['fr-FR', 'en-GB'] }).i18n.locale, 'en');
  assert.equal(runtime({ url: 'https://example.com/?lang=invalid', saved: 'invalid', languages: ['ja'] }).i18n.locale, 'zh-CN');
  assert.equal(runtime({ blocked: true }).i18n.locale, 'en');
});

test('switching preserves guide state, query parameters and dynamic text parameters', () => {
  const { i18n, window, document, boundText, saved } = runtime();
  const counter = { dataset: {}, textContent: '' };
  boundText.push(counter);
  i18n.text(counter, 'guide.count', { current: 3, total: 4 });
  assert.equal(counter.textContent, 'Step 3 / 4');
  i18n.setLocale('zh-CN');
  assert.equal(counter.textContent, '第 3 / 4 步');
  assert.equal(document.documentElement.lang, 'zh-CN');
  assert.equal(window.location.search, '?source=test&lang=zh-CN');
  assert.equal(window.location.hash, '#step-3');
  assert.equal(saved.get('wupage.locale'), 'zh-CN');
  assert.equal(i18n.t('unknown.key'), 'unknown.key');
  delete window.WUPAGE_MESSAGES.en['common.guide'];
  i18n.setLocale('en');
  assert.equal(i18n.t('common.guide'), '使用引导');
});

test('links retain language without local storage and leave external URLs and hashes intact', () => {
  const { i18n } = runtime({ blocked: true });
  i18n.setLocale('zh-CN');
  assert.equal(i18n.localizedUrl('terms.html?source=tip#refunds'), '/terms.html?source=tip&lang=zh-CN#refunds');
  assert.equal(i18n.localizedUrl('/thanks'), '/thanks?lang=zh-CN');
  for (const url of ['#step-2', 'https://github.com/mr-wuliu/wupage', 'mailto:master.wuliu@gmail.com', '/api/checkout', '/assets/img/favicon.png']) {
    assert.equal(i18n.localizedUrl(url), url);
  }
});
