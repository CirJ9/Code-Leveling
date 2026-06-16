declare const require: any;
declare const monaco: any;

interface Window {
  __MONACO_INSTANCE__?: any;
  monaco?: any;
  isEditorActive?: boolean; // ✅ Add your flag here
}

declare module 'monaco-editor/esm/vs/editor/editor.api' {
  export * from 'monaco-editor';
}
