// Monaco editor + TextMate syntax highlighting for `.lunas`.
//
// Highlighting reuses the real Lunas TextMate grammar from the `lunasrun/tools`
// language-tooling repo, vendored as the `external/lunas-tools` submodule (no
// copy — single source of truth). shiki loads the grammar (which embeds
// TypeScript / CSS / HTML) and drives Monaco's tokenizer via `shikiToMonaco`.
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import { createHighlighter } from "shiki";
import { shikiToMonaco } from "@shikijs/monaco";
import lunasGrammar from "../../external/lunas-tools/packages/grammar/lunas.tmLanguage.json";
import langConfig from "../../external/lunas-tools/packages/grammar/language-configuration.json";

const LANG_ID = "lunas";
const THEME = "github-light";

// Monaco only needs its core editor worker here — highlighting comes from shiki
// and language intelligence (later) from the Lunas language server, not from
// Monaco's built-in TS/CSS services.
(self as unknown as { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};

let setupDone: Promise<void> | null = null;

async function setup(): Promise<void> {
  monaco.languages.register({ id: LANG_ID, extensions: [".lunas"] });

  const highlighter = await createHighlighter({
    themes: [THEME],
    // The Lunas grammar embeds these scopes, so shiki must know them too.
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
}

export interface EditorHandle {
  setValue(value: string): void;
  dispose(): void;
}

/**
 * Mount a Monaco editor into `host`, seeded with `value`. `onChange` fires on
 * every edit with the current text (used to recompile the preview). Returns a
 * handle for programmatic updates (e.g. switching files).
 */
export async function initEditor(
  host: HTMLElement,
  value: string,
  onChange: (value: string) => void,
): Promise<EditorHandle> {
  setupDone ??= setup();
  await setupDone;

  const editor = monaco.editor.create(host, {
    value,
    language: LANG_ID,
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
      // Guard against clobbering the cursor when the value already matches.
      if (editor.getValue() !== next) editor.setValue(next);
    },
    dispose() {
      editor.dispose();
    },
  };
}
