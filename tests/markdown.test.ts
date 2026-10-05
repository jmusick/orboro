import assert from "node:assert/strict";
import { test } from "node:test";
import { renderMarkdown } from "../src/lib/markdown.ts";

test("fenced code uses language aliases and preserves the code's text", () => {
  const html = renderMarkdown('```js\nconst message = "<hello> & goodbye";\n```');
  assert.match(html, /class="hljs language-js"/);
  assert.match(html, /class="hljs-keyword"/);
  assert.match(html, /&lt;hello&gt; &amp; goodbye/);
  assert.doesNotMatch(html, /<hello>|style=|<script/);
});

test("unknown and unspecified languages remain escaped plain text", () => {
  for (const language of ["", "unknown", 'unknown\" onclick=\"alert(1)']) {
    const html = renderMarkdown(`\`\`\`${language}\n<script>alert(1)</script>\n\`\`\``);
    assert.match(html, /&lt;script&gt;/);
    assert.doesNotMatch(html, /<script>|hljs-|class="[^"]*" onclick=/);
  }
});

test("inline and indented code stay unchanged, while HTML fences highlight safely", () => {
  assert.equal(renderMarkdown("`const x = 1`"), "<p><code>const x = 1</code></p>\n");
  assert.equal(renderMarkdown("    <div>"), "<pre><code>&lt;div&gt;\n</code></pre>\n");
  const html = renderMarkdown('```html\n<button onclick="run()">Go</button>\n```');
  assert.match(html, /hljs-tag/);
  assert.doesNotMatch(html, /<button/);
});

test("raw scripts, handlers and unsafe URL schemes are stripped", () => {
  const html = renderMarkdown([
    '<script>alert(1)</script>',
    '',
    '<img src="/a.webp" alt="a" onerror="alert(1)" style="x:y">',
    '',
    '<iframe src="https://evil.example"></iframe>',
    '',
    '[bad](javascript:alert(1)) [data](data:text/html;base64,AAAA) [ok](https://example.com/a?b=1&c=2)',
    '',
    '![x](data:image/svg+xml;base64,AAAA)',
  ].join("\n"));
  assert.doesNotMatch(html, /<script|alert\(1\)|onerror|style=|<iframe|javascript:|data:/i);
  assert.match(html, /<img src="\/a\.webp" alt="a">/);
  assert.match(html, /<a href="https:\/\/example\.com\/a\?b=1&amp;c=2">ok<\/a>/);
});

test("trusted author markup survives: images with class, tables, task lists, shortcodes", () => {
  const img = renderMarkdown('<img class="float-left" src="/media/images/about-header.webp" alt="Avatar">');
  assert.match(img, /<img class="float-left" src="\/media\/images\/about-header\.webp" alt="Avatar">/);
  const table = renderMarkdown("| a | b |\n|:--|--:|\n| 1 | 2 |");
  assert.match(table, /<th align="left">a<\/th>/);
  assert.match(renderMarkdown("- [x] done"), /<input checked disabled type="checkbox">/);
  assert.match(renderMarkdown('{{token attr="value"}}'), /\{\{token attr=&quot;value&quot;\}\}/);
});
