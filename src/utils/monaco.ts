import * as monaco from "@codingame/monaco-vscode-editor-api";
import lunasHighlightingRules from "../syntaxes/lunas.tmLanguage.json?raw";
import lunasHtmlHighlightingRules from "../syntaxes/text.html.lunas.tmLanguage.json?raw";
import { createHighlighter } from "shiki";
import { shikiToMonaco } from "@shikijs/monaco";
import createLunasWorker from "./lunas.worker";
import { MonacoLanguageClient } from "monaco-languageclient";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
} from "vscode-languageserver/browser";
import "vscode/localExtensionHost";
import { initialize } from "@codingame/monaco-vscode-api";

await initialize(monaco);

const highlighter = await createHighlighter({
  langs: [
    JSON.parse(lunasHighlightingRules),
    JSON.parse(lunasHtmlHighlightingRules),
    "typescript",
    "javascript",
    "css",
  ],
  themes: ["github-light"],
});

monaco.languages.register({ id: "lunas" });
monaco.languages.register({ id: "javascript" });
monaco.languages.register({ id: "css" });

shikiToMonaco(highlighter, monaco);

// Registering the new language

// Registering the new language's configuration
// TODO: Delte ts-ignore
// @ts-ignore

// Optional: You can also add custom configuration for comments, auto-closing pairs, etc.
monaco.languages.setLanguageConfiguration("lunas", {
  comments: {
    // define comment symbols if your language supports them
    lineComment: "//",
    blockComment: ["/*", "*/"],
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
});

import "@codingame/monaco-vscode-editor-api/esm/vs/basic-languages/css/css.contribution";
import "@codingame/monaco-vscode-editor-api/esm/vs/basic-languages/xml/xml.contribution";
import "@codingame/monaco-vscode-editor-api/esm/vs/basic-languages/javascript/javascript.contribution";

import EditorWorker from "@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker?worker";
import JavaScriptWorker from "@codingame/monaco-vscode-editor-api/esm/vs/language/typescript/ts.worker?worker";
import CSSWorker from "@codingame/monaco-vscode-editor-api/esm/vs/language/css/css.worker?worker";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.MonacoEnvironment = {
  getWorker(_: string, _label: string) {
    console.log("getWorker called with label:", _label);
    if (_label === "javascript") {
      return new JavaScriptWorker();
    }
    if (_label === "css") {
      return new CSSWorker();
    }

    return new EditorWorker();
  },
};

export const options = {
  colorDecorators: true,
  lineHeight: 24,
  tabSize: 2,
  minimap: { enabled: false },
};

export const readOnlyOptions = {
  colorDecorators: true,
  lineHeight: 24,
  tabSize: 2,
  minimap: { enabled: false },
  readOnly: true,
};

monaco.editor.onDidCreateEditor((editor) => {
  window.addEventListener("resize", () => editor.layout());
});

declare global {
  interface Window {
    __lunasLanguageClient?: MonacoLanguageClient;
  }
}

export async function ensureLunasClientForModel(
  model: monaco.editor.ITextModel
) {
  console.log("Checking model for Lunas client:", model.uri.toString());
  if (model.getLanguageId() !== "lunas") return;
  if (window.__lunasLanguageClient) return;

  const worker = createLunasWorker();
  await new Promise<void>((resolve) => {
    const onReady = (event: MessageEvent) => {
      if (event.data?.type === "ready") {
        worker.removeEventListener("message", onReady);
        resolve();
      }
    };
    worker.addEventListener("message", onReady);
  });

  const reader = new BrowserMessageReader(worker);
  const writer = new BrowserMessageWriter(worker);

  window.__lunasLanguageClient = new MonacoLanguageClient({
    name: "Lunas Language Client",
    clientOptions: {
      documentSelector: [{ language: "lunas" }],
      errorHandler: {
        error: () => ({ action: 1 }), // Continue
        closed: () => ({ action: 2 }), // Restart
      },
    },
    messageTransports: {
      reader,
      writer,
    },
  });
  window.__lunasLanguageClient.start();
}

monaco.editor.onDidCreateModel((model) => {
  if (model.getLanguageId() !== "lunas") return;
  ensureLunasClientForModel(model);
});

// // // --- Patch: Avoid MonacoLanguageClient auto-attach in browser ---
// // // See: https://github.com/microsoft/monaco-languageclient/issues/1002
// // // Prevent 'Default api is not ready yet' error in browser
// // if ((window as any).MonacoServices) {
// //   // @ts-ignore
// //   (window as any).MonacoServices.install = () => {};
// // })();
