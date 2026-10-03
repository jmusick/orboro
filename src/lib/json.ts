/** Serialize data for a script element's raw HTML body, not an HTML attribute. */
export function jsonForHtml(value: unknown): string {
  const json = JSON.stringify(value);
  if (json === undefined) {
    throw new TypeError("Inline JSON requires a JSON-serializable value");
  }
  // HTML parses script boundaries before JSON parsing, even for JSON data blocks.
  return json
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");
}
