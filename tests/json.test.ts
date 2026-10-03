import assert from 'node:assert/strict';
import { test } from 'node:test';
import { jsonForHtml } from '../src/lib/json.ts';

test('inline JSON cannot close its script or introduce HTML parser tokens', () => {
  const titles = [
    '</script><img src=x onerror="alert(1)">',
    '</ScRiPt ><script>alert(1)</script>',
    '<!--<script>nested</script>-->',
    'A < B & C > D, "quoted", \\ path, café 🎮\u2028\u2029',
  ];
  for (const title of titles) {
    const data = {
      '@type': 'BlogPosting', headline: title,
      nav: [{ label: title }], content: [{ title }],
    };
    const encoded = jsonForHtml(data);
    assert.doesNotMatch(encoded, /[<>&]/);
    assert.deepEqual(JSON.parse(encoded), data);
    const block = `<script type="application/json">${encoded}</script>`;
    assert.equal((block.match(/<\/script\s*>/gi) ?? []).length, 1);
  }
});

test('JSON values retain their types and non-serializable roots fail explicitly', () => {
  for (const value of [null, false, 42, 'text', [1, null, true], { missing: undefined, list: [undefined] }]) {
    assert.deepEqual(JSON.parse(jsonForHtml(value)), JSON.parse(JSON.stringify(value)));
  }
  assert.throws(() => jsonForHtml(undefined), TypeError);
});
