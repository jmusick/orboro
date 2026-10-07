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
    autoDownloadFontAwesome: false,
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

  // EasyMDE hides the source textarea. Name its actual editable input instead,
  // for both CodeMirror's desktop textarea and mobile contenteditable modes.
  const markdownLabel = document.querySelector("#markdown-label");
  if (markdownLabel instanceof HTMLLabelElement) {
    const editorInput = easyMde.codemirror.getInputField();
    editorInput.id = "markdown-editor";
    editorInput.setAttribute("aria-labelledby", markdownLabel.id);
    const description = markdownEl.getAttribute("aria-describedby");
    if (description) editorInput.setAttribute("aria-describedby", description);
    if (editorInput.isContentEditable) {
      editorInput.setAttribute("role", "textbox");
      editorInput.setAttribute("aria-multiline", "true");
    }
    markdownLabel.htmlFor = editorInput.id;
    markdownLabel.addEventListener("click", () => easyMde.codemirror.focus());
  }

  // Sync editor value back to textarea before form submits
  const contentForm = document.querySelector("#content-form");
  if (contentForm instanceof HTMLFormElement) {
    contentForm.addEventListener("submit", () => {
      markdownEl.value = easyMde.value();
    });
  }
}
