// Monaco editor (on @codingame/monaco-vscode-editor-api) with:
//   - TextMate syntax highlighting from the real Lunas grammar (via shiki), and
//   - the Lunas language server over a web worker (monaco-languageclient), so
//     diagnostics / symbols / folding — and future hover/completion/definition —
//     work through the LSP protocol.
//
// `monaco-editor` is aliased to @codingame/monaco-vscode-editor-api (see the
// pnpm override), so shiki and this module share one monaco with the vscode
// service layer that monaco-languageclient needs.
import * as monaco from "monaco-editor";
import { initServices } from "monaco-languageclient/vscode/services";
import { MonacoLanguageClient } from "monaco-languageclient";
import { BrowserMessageReader, BrowserMessageWriter } from "vscode-languageserver/browser";
import { createHighlighter } from "shiki";
import { shikiToMonaco } from "@shikijs/monaco";
import LsWorker from "../ls/worker?worker";
import lunasGrammar from "../../external/lunas-tools/packages/grammar/lunas.tmLanguage.json";
import langConfig from "../../external/lunas-tools/packages/grammar/language-configuration.json";

const LANG_ID = "lunas";
const THEME = "github-light";

let setupDone: Promise<void> | null = null;

async function setup(): Promise<void> {
  // Bring up the vscode service layer (languages / model / configuration / log),
  // then register the Lunas language and its grammar.
  await initServices({}, { caller: "lunas-playground" });

  monaco.languages.register({ id: LANG_ID, extensions: [".lunas"] });

  const highlighter = await createHighlighter({
    themes: [THEME],
    langs: [
      { ...(lunasGrammar as object), name: LANG_ID } as never,
      "typescript",
      "javascript",
      "css",
      "html",
    ],
  });
  shikiToMonaco(highlighter, monaco);

  monaco.languages.setLanguageConfiguration(LANG_ID, {
    comments: langConfig.comments as monaco.languages.CommentRule,
    brackets: langConfig.brackets as [string, string][],
    autoClosingPairs: langConfig.autoClosingPairs,
    surroundingPairs: langConfig.surroundingPairs.map(([open, close]) => ({ open, close })),
    wordPattern: new RegExp(langConfig.wordPattern),
  });

  startLanguageClient();
}

// Connect a MonacoLanguageClient to the lunas-ls worker. The client tracks every
// `lunas` model, so diagnostics/symbols flow automatically once it's started.
function startLanguageClient(): void {
  const worker = new LsWorker();
  worker.addEventListener("message", function onReady(event: MessageEvent) {
    if ((event.data as { type?: string })?.type !== "ready") return;
    worker.removeEventListener("message", onReady);

    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);
    const client = new MonacoLanguageClient({
      name: "Lunas Language Client",
      clientOptions: {
        documentSelector: [{ language: LANG_ID }],
        // Keep the session alive across transient errors.
        errorHandler: { error: () => ({ action: 1 }), closed: () => ({ action: 2 }) },
      },
      messageTransports: { reader, writer },
    });
    client.start();
  });
}

export interface EditorHandle {
  setValue(value: string): void;
  dispose(): void;
}

/**
 * Mount a Monaco editor into `host`, seeded with `value`. `onChange` fires on
 * every edit (used to recompile the preview). Returns a handle for programmatic
 * updates (e.g. switching files).
 */
export async function initEditor(
  host: HTMLElement,
  value: string,
  onChange: (value: string) => void,
): Promise<EditorHandle> {
  setupDone ??= setup();
  await setupDone;

  const model = monaco.editor.createModel(value, LANG_ID, monaco.Uri.parse("inmemory://playground/App.lunas"));
  const editor = monaco.editor.create(host, {
    model,
    theme: THEME,
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    tabSize: 4,
    scrollBeyondLastLine: false,
    renderWhitespace: "selection",
  });

  editor.onDidChangeModelContent(() => onChange(editor.getValue()));

  return {
    setValue(next: string) {
      if (editor.getValue() !== next) editor.setValue(next);
    },
    dispose() {
      editor.dispose();
      model.dispose();
    },
  };
}
