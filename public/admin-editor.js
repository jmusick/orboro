import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

const markdown = document.querySelector("#markdown");
const preview = document.querySelector("#preview");
const toggle = document.querySelector("#preview-toggle");

if (
  markdown instanceof HTMLTextAreaElement &&
  preview instanceof HTMLDivElement &&
  toggle instanceof HTMLButtonElement
) {
  toggle.addEventListener("click", async () => {
    const visible = preview.style.display !== "none";
    if (visible) {
      preview.style.display = "none";
      return;
    }

    preview.style.display = "block";
    const rendered = await marked.parse(markdown.value);
    preview.innerHTML = typeof rendered === "string" ? rendered : "";
  });
}
