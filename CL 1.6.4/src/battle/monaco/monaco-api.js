/**
 * Lightweight accessor helpers for the in-page Monaco editor instance.
 * Exposes getEditor, getEditorContent, focusEditor, destroyEditor.
 */
export function getEditor() {
  return window.__MONACO_INSTANCE__ || null;
}

export function getEditorContent() {
  // Return the current text value from the editor or an empty string when not ready
  return getEditor()?.getValue() ?? "";
}

export function focusEditor() {
  getEditor()?.focus();
}

export function destroyEditor() {
  getEditor()?.dispose();
  window.__MONACO_INSTANCE__ = null;
}
