// Delete confirmation
const deleteForm = document.querySelector(".delete-form");
if (deleteForm instanceof HTMLFormElement) {
  deleteForm.addEventListener("submit", (e) => {
    if (!confirm("Delete this content item? This cannot be undone.")) {
      e.preventDefault();
    }
  });
}

// Slug auto-generation from title
const title = document.querySelector("#title");
const slug = document.querySelector("#slug");
if (title instanceof HTMLInputElement && slug instanceof HTMLInputElement) {
  let slugDirty = false;
  slug.addEventListener("input", () => { slugDirty = true; });
  title.addEventListener("input", () => {
    if (slugDirty) return;
    slug.value = title.value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  });
}

// EasyMDE WYSIWYG editor
const markdownEl = document.querySelector("#markdown");
if (markdownEl instanceof HTMLTextAreaElement && typeof EasyMDE !== "undefined") {
  const easyMde = new EasyMDE({
    element: markdownEl,
    theme: "orboro",
    spellChecker: false,
    autosave: { enabled: false },
    minHeight: "300px",
    maxHeight: "560px",
    toolbar: [
      "bold", "italic", "strikethrough", "heading", "|",
      "quote", "unordered-list", "ordered-list", "|",
      "link", "image", "table", "|",
      "preview", "side-by-side", "fullscreen", "|",
      "guide",
    ],
  });

  // Inject dark theme after EasyMDE initializes so it's last in the cascade
  const s = document.createElement("style");
  s.textContent = `
    .editor-toolbar { background: #111a30 !important; border: 1px solid #1f2b46 !important; border-radius: 8px 8px 0 0 !important; opacity: 1 !important; }
    .editor-toolbar button, .editor-toolbar button i { color: #c8d8f0 !important; }
    .editor-toolbar button:hover, .editor-toolbar button.active { background: rgba(0,229,255,0.1) !important; border-color: #00e5ff !important; color: #00e5ff !important; }
    .editor-toolbar button:hover i, .editor-toolbar button.active i { color: #00e5ff !important; }
    .editor-toolbar i.separator { color: #1f2b46 !important; }
    .editor-statusbar { color: #97a8c4 !important; border-top-color: #1f2b46 !important; }
    .EasyMDEContainer .CodeMirror { background: #0c1324 !important; color: #e8f3ff !important; }
    .EasyMDEContainer .CodeMirror-scroll { background: #0c1324 !important; }
    .EasyMDEContainer .CodeMirror-lines { background: #0c1324 !important; }
    .EasyMDEContainer .CodeMirror-gutters { background: #0c1324 !important; border-right: 1px solid #1f2b46 !important; color: #4a5e80; }
    .EasyMDEContainer .CodeMirror-cursor { border-left: 2px solid #00e5ff !important; }
    .EasyMDEContainer .CodeMirror-selected { background: rgba(0,229,255,0.12) !important; }
    .EasyMDEContainer .cm-header { color: #00e5ff !important; font-weight: 700; }
    .EasyMDEContainer .cm-strong { color: #e8f3ff !important; font-weight: 700; }
    .EasyMDEContainer .cm-em { color: #ff3fb8 !important; font-style: italic; }
    .EasyMDEContainer .cm-strikethrough { color: #97a8c4 !important; }
    .EasyMDEContainer .cm-link { color: #00e5ff !important; }
    .EasyMDEContainer .cm-url { color: #a8ff60 !important; }
    .EasyMDEContainer .cm-quote { color: #97a8c4 !important; font-style: italic; }
  `;
  document.head.appendChild(s);

  // Sync editor value back to textarea before form submits
  const contentForm = document.querySelector("#content-form");
  if (contentForm instanceof HTMLFormElement) {
    contentForm.addEventListener("submit", () => {
      markdownEl.value = easyMde.value();
    });
  }
}
