import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const component = readFileSync(new URL('../src/components/ConsentBanner.astro', import.meta.url), 'utf8');
const script = component.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];

function browserHarness(stored = null, storageUnavailable = false) {
  const listeners = new Map();
  const scripts = [];
  const cookies = [];
  let reloads = 0;
  let hasBanner = true;
  class Element {
    constructor(kind) { this.kind = kind; this.hidden = true; this.isConnected = true; }
    closest(selector) {
      return selector === `[data-analytics-${this.kind === 'preferences' ? 'preferences' : 'consent'}]` ? this : null;
    }
    getAttribute() { return this.kind; }
    focus() {}
  }
  const preferences = new Element('preferences');
  const banner = { hidden: true, contains: () => true, querySelector: () => new Element('denied') };
  const controller = { nonce: 'first-page-nonce' };
  const document = {
    title: 'Home',
    getElementById: id => id === 'analytics-controller' ? controller : hasBanner ? banner : null,
    querySelector: () => preferences,
    querySelectorAll: () => [preferences],
    createElement: () => ({}),
    head: { appendChild: element => scripts.push(element) },
    addEventListener: (name, listener) => {
      const handlers = listeners.get(name) || [];
      handlers.push(listener);
      listeners.set(name, handlers);
    },
    get cookie() { return '_ga=old; _ga_BLR72SL0L6=old; orboro_session=keep'; },
    set cookie(value) { cookies.push(value); }
  };
  const window = { addEventListener: document.addEventListener };
  const context = {
    Element, document, window,
    location: { href: 'https://www.orboro.net/', pathname: '/', hostname: 'www.orboro.net', reload: () => reloads++ },
    localStorage: {
      getItem: () => { if (storageUnavailable) throw new Error('blocked'); return stored; },
      setItem: (_, value) => { if (storageUnavailable) throw new Error('blocked'); stored = value; }
    }
  };
  const emit = (name, event = {}) => (listeners.get(name) || []).forEach(listener => listener(event));
  runInNewContext(script, context);
  return {
    scripts, cookies, banner, controller, window, context,
    emit, click: choice => emit('click', { target: new Element(choice) }),
    swap: () => { controller.nonce = 'next-page-nonce'; emit('astro:page-load'); },
    admin: () => { hasBanner = false; emit('astro:page-load'); },
    rerun: () => runInNewContext(script, context),
    get stored() { return stored; },
    get reloads() { return reloads; },
    get pageViews() { return (window.dataLayer || []).filter(event => event[0] === 'event' && event[1] === 'page_view'); }
  };
}

test('unanswered and declined consent never load analytics, including navigation', () => {
  for (const stored of [null, 'denied', 'invalid']) {
    const browser = browserHarness(stored);
    browser.swap();
    assert.equal(browser.scripts.length, 0);
    assert.equal(browser.pageViews.length, 0);
    assert.equal(browser.banner.hidden, stored === 'denied');
    browser.click('denied');
    browser.swap();
    assert.equal(browser.stored, 'denied');
    assert.equal(browser.scripts.length, 0);
  }
});

test('acceptance after navigation uses the current nonce and tracks each page once', () => {
  const browser = browserHarness();
  browser.swap();
  browser.click('granted');
  assert.equal(browser.scripts.length, 1);
  assert.equal(browser.scripts[0].nonce, 'next-page-nonce');
  assert.equal(browser.pageViews.length, 1);
  browser.rerun();
  browser.swap();
  assert.equal(browser.pageViews.length, 2);
  assert.equal(browser.scripts.length, 1);
  browser.click('preferences');
  assert.equal(browser.banner.hidden, false);
  browser.click('granted');
  assert.equal(browser.pageViews.length, 2);
  browser.admin();
  assert.equal(browser.pageViews.length, 2);
});

test('saved acceptance has no automatic page view before astro:page-load', () => {
  const browser = browserHarness('granted');
  assert.equal(browser.scripts.length, 1);
  assert.equal(browser.pageViews.length, 0);
  const config = browser.window.dataLayer.find(event => event[0] === 'config');
  assert.equal(config[2].send_page_view, false);
  browser.swap();
  assert.equal(browser.pageViews.length, 1);
});

test('withdrawal disables analytics, clears parent-domain cookies, and preserves the session', () => {
  const browser = browserHarness('granted');
  browser.click('denied');
  assert.equal(browser.stored, 'denied');
  assert.equal(browser.window['ga-disable-G-BLR72SL0L6'], true);
  assert.equal(browser.reloads, 1);
  assert.ok(browser.cookies.some(value => value.includes('domain=orboro.net')));
  assert.ok(browser.cookies.every(value => !value.startsWith('orboro_session')));
  const last = browser.window.dataLayer.at(-1);
  assert.equal(last[2].analytics_storage, 'denied');
});

test('storage restrictions preserve choices during client navigation', () => {
  const browser = browserHarness(null, true);
  browser.click('granted');
  browser.swap();
  assert.equal(browser.scripts.length, 1);
  assert.equal(browser.banner.hidden, true);
  browser.click('denied');
  assert.equal(browser.reloads, 1);
});

test('withdrawal in another tab stops this tab too', () => {
  const browser = browserHarness('granted');
  browser.emit('storage', { key: 'orboro-analytics-consent', newValue: 'denied' });
  assert.equal(browser.reloads, 1);
  assert.equal(browser.window['ga-disable-G-BLR72SL0L6'], true);
});
