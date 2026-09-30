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
