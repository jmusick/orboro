import { marked } from 'marked';

export function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function escapeCdata(html: string): string {
  return html.replaceAll(']]>', ']]]]><![CDATA[>');
}

// Feed readers cannot execute or style our widgets. Keep those posts useful and
// small by linking to the full article instead of expanding shortcode payloads.
export function renderFeedHtml(markdown: string, excerpt: string, link: string, base: string): string {
  if (/\{\{\w+[^}]*\}\}/.test(markdown)) {
    return `<p>${escapeXml(excerpt)}</p><p><a href="${escapeXml(link)}">Read the full article on Orboro.net</a></p>`;
  }
  const html = marked.parse(markdown, { async: false })
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  // This is feed portability, not an HTML security sanitizer. Rewrite URL
  // attributes in emitted tags, leaving escaped code samples/text untouched.
  return html.replace(/<[a-z](?:[^"'<>]|"[^"]*"|'[^']*')*>/gi, (tag) => tag.replace(
    /(\s+)([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g,
    (attribute, spacing, name, doubleQuoted, singleQuoted, unquoted) => {
      if (!/^(src|href)$/i.test(name) || (doubleQuoted ?? singleQuoted ?? unquoted) === undefined) return attribute;
      const value = String(doubleQuoted ?? singleQuoted ?? unquoted).replaceAll('&amp;', '&');
      if (/^[a-z][a-z\d+.-]*:/i.test(value)) return attribute;
      try {
        return `${spacing}${name}="${escapeXml(new URL(value, link || base).href)}"`;
      } catch {
        return attribute;
      }
    },
  ));
}
