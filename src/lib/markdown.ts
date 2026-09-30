import { Marked } from "marked";
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

export function renderMarkdown(markdown: string): string {
  return parser.parse(markdown, { async: false });
}
