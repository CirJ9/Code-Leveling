/**
 * Initialize a Monaco editor instance and attach it to the DOM container.
 * Returns the created editor or null if container not found. Stores instance on window.__MONACO_INSTANCE__.
 */
/**
 * Initialize a Monaco editor instance and attach it to the DOM container.
 * Stores instance on `window.__MONACO_INSTANCE__`.
 * @param {string} containerId
 * @param {object} [options]
 * @returns {Promise<any|null>} Monaco editor instance or null if container not found
 */
export async function initMonacoEditor(containerId, options = {}) {
  await initMonacoLoader();

  const container = document.getElementById(containerId);
  if (!container) return null;
  
  const defaultOptions = {
    value: "// Java spell here...",
    language: "java",
    theme: "vs-dark",
    automaticLayout: true,
    fontFamily: 'BoldPixels, monospace' ,
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 20,
    cursorBlinking: 'smooth',
    cursorStyle: 'line',
    renderWhitespace: 'none',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
  };

  const editor = monaco.editor.create(
    document.getElementById(containerId),
    { ...defaultOptions, ...options }
  );

  window.__MONACO_INSTANCE__ = editor;
  console.log("✅ Monaco Ready!");
  return editor;
}

export function initMonacoLoader() {
  // Configure RequireJS path for the Monaco editor package then load the main bundle
  return new Promise((resolve) => {
    require.config({
      paths: {
        vs: './lib/monaco-editor/vs'
      }
    });

    // Load Monaco's main module and resolve when ready
    require(["vs/editor/editor.main"], resolve);
  });
}

if (!window.monaco) window.monaco = {};
if (!window.monaco.editor) window.monaco.editor = {};
