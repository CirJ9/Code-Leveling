/**
 * DOM helpers to show/hide the Monaco editor panel in the battle UI.
 * These directly toggle the panel's CSS to enable/disable editor interactivity.
 */
// dom-editor-control.js
export function showEditor() {
    // Make the DOM editor visible and interactive
    const editor = document.getElementById("monaco-panel");
    editor.style.opacity = "1";
    editor.style.pointerEvents = "auto";
}

export function hideEditor() {
    const editor = document.getElementById("monaco-panel");
    editor.style.opacity = "0";
    editor.style.pointerEvents = "none";
}

