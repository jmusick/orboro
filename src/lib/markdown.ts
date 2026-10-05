import { Marked } from "marked";
import xss from "xss";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import lua from "highlight.js/lib/languages/lua";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

// xss is CommonJS, so Node's ESM loader only exposes its default export.
const { FilterXSS, safeAttrValue } = xss as unknown as typeof import("xss");

// Only ship the grammars useful for development articles, rather than the
// full language catalogue. Registered grammars include aliases such as js/ts.
for (const [name, grammar] of Object.entries({
  bash, css, javascript, json, lua, markdown, python, sql, typescript, xml, yaml,
})) {
  hljs.registerLanguage(name, grammar);
}

// Keep this instance isolated from Marked's global configuration. Highlighting
// emits CSS classes, not inline styles or scripts, so it works with our CSP.
const parser = new Marked({
  renderer: {
    code({ text, lang }) {
      const language = lang?.trim().split(/\s+/)[0].toLowerCase();
      // Unknown and unlabeled code use Marked's escaped, plain-text renderer.
      // Avoid guessing a language (especially for shell output and prose).
      if (!language || !hljs.getLanguage(language)) return false;

      const { value } = hljs.highlight(text, { language, ignoreIllegals: true });
      return `<pre><code class="hljs language-${language}">${value}\n</code></pre>\n`;
    },
  },
});

// Marked passes raw HTML and URL schemes through untouched, so its output is
// filtered against an allowlist before it reaches `set:html`. Tags and
// attributes outside the list are dropped, `<script>`/`<style>` lose their
// bodies, and href/src keep only http(s), mailto, tel, fragment and relative
// URLs. This is the author-content boundary: shortcodes expand *after* it, so
// trusted widget markup and nonces are never filtered.
const common = ["class", "id", "title"];
const sanitizer = new FilterXSS({
  whiteList: {
    a: ["href", ...common],
    abbr: common, b: common, blockquote: common, br: [], caption: common,
    code: common, del: common, details: [...common, "open"], div: common,
    em: common, figcaption: common, figure: common,
    h1: common, h2: common, h3: common, h4: common, h5: common, h6: common,
    hr: [], i: common, img: ["src", "alt", "width", "height", "loading", ...common],
    input: ["type", "checked", "disabled"],
    kbd: common, li: common, mark: common, ol: ["start", ...common],
    p: common, pre: common, s: common, span: common, strong: common,
    sub: common, summary: common, sup: common, table: common, tbody: common,
    td: ["align", ...common], tfoot: common, th: ["align", ...common],
    thead: common, tr: common, u: common, ul: common,
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
  // Marked emits only type="checkbox" inputs for task lists.
  onTagAttr: (tag, name, value) =>
    tag === "input" && name === "type" && value !== "checkbox" ? "" : undefined,
  safeAttrValue: (tag, name, value, css) => {
    if (name === "src" && /^\s*data:/i.test(value)) return "";
    return safeAttrValue(tag, name, value, css);
  },
});

export function renderMarkdown(markdown: string): string {
  return sanitizer.process(parser.parse(markdown, { async: false }));
}
