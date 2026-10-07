import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const layout = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
const controller = layout.match(/<script id="csp-navigation"[^>]*>([\s\S]*?)<\/script>/)[1];

class Tag {
  constructor(type, nonce) {
    this.tagName = type;
    this.nonce = nonce;
    this.values = new Map(nonce ? [['nonce', nonce]] : []);
    this.dataset = {};
    this.textContent = 'trusted widget initialization';
    this.src = '';
  }
  get attributes() { return [...this.values].map(([name, value]) => ({ name, value })); }
  getAttribute(name) { return this.values.get(name) ?? null; }
  setAttribute(name, value) {
    this.values.set(name, value);
    if (name === 'nonce') this.nonce = value;
  }
  replaceWith(replacement) { this.replacement = replacement; }
}
class Page {
  constructor(tags) { this.tags = tags; }
  querySelectorAll(selector) {
    return this.tags.filter(tag => tag.values.has('nonce') && (selector.includes('style') || (tag.tagName === 'script' && tag.dataset.astroExec === undefined)));
  }
}
function setup() {
  const events = new Map();
  const document = new Page([]);
  document.currentScript = { nonce: 'active-response-nonce' };
  document.addEventListener = (name, fn) => events.set(name, fn);
  document.createElement = type => new Tag(type);
  const scope = { window: {}, document, Document: Page };
  runInNewContext(controller, scope);
  return { events, document, scope };
}

test('page swaps preserve authorized nonces without authorizing unnonced HTML', () => {
  const { events, document } = setup();
  const script = new Tag('script', 'incoming-response-nonce');
  const style = new Tag('style', 'incoming-response-nonce');
  const authorScript = new Tag('script');
  const incoming = new Page([script, style, authorScript]);
  events.get('astro:before-swap')({ newDocument: incoming });
  assert.equal(script.nonce, 'active-response-nonce');
  assert.equal(style.nonce, 'active-response-nonce');
  assert.equal(authorScript.nonce, undefined);

  // Browsers blank the content attribute on connection, keeping .nonce.
  script.values.set('nonce', '');
  document.tags = incoming.tags;
  events.get('astro:after-swap')();
  assert.equal(script.replacement.nonce, 'active-response-nonce');
  assert.equal(script.replacement.textContent, script.textContent);
  assert.equal(script.replacement.dataset.astroExec, '');
  assert.equal(authorScript.replacement, undefined);
});

test('already executed, external, JSON and mismatched scripts are left alone', () => {
  const { events, document } = setup();
  const tags = Array.from({ length: 4 }, () => new Tag('script', 'active-response-nonce'));
  tags[0].dataset.astroExec = '';
  tags[1].src = '/client.js';
  tags[2].setAttribute('type', 'application/json');
  tags[3].nonce = 'different-nonce';
  document.tags = tags;
  events.get('astro:after-swap')();
  assert.ok(tags.every(tag => !tag.replacement));
});

test('the controller registers only once across repeated navigation', () => {
  const { events, scope } = setup();
  const original = events.get('astro:after-swap');
  runInNewContext(controller, scope);
  assert.equal(events.size, 2);
  assert.equal(events.get('astro:after-swap'), original);
});
