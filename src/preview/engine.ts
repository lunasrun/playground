// The preview engine: compile every `.lunas` file in the project with the
// browser (wasm-pack `web`) build of the Lunas compiler, then assemble a
// self-contained HTML document that mounts the entry component.
//
// Two constraints shape the assembly:
//   1. The live preview runs in a `sandbox="allow-scripts"` iframe, whose
//      opaque origin blocks blob: URLs — so every module is inlined as a
//      `data:` URL and wired together with an import map.
//   2. The current Lunas codegen does not emit `style:` blocks, so we extract
//      them from the source ourselves and inject a `<style>` into the document.
import runtimeSource from "virtual:lunas-runtime";
import init, { compile } from "../../wasm/web/lunas_wasm.js";
import wasmUrl from "../../wasm/web/lunas_wasm_bg.wasm?url";
import { bareifyImports, dataModule, extractStyle } from "./transform.mjs";

export { extractStyle } from "./transform.mjs";

export interface Diagnostic {
  severity: string;
  message: string;
  start: number;
  end: number;
}

export interface CompileResult {
  code: string | null;
  diagnostics: Diagnostic[];
}

export interface LunasFile {
  name: string;
  content: string;
}

export interface PreviewBuild {
  doc: string;
  activeJs: string;
  css: string;
  error: string | null;
}

let ready: Promise<unknown> | null = null;

/** Lazily initialize the wasm compiler (idempotent). */
export function initCompiler(): Promise<unknown> {
  return (ready ??= init(wasmUrl));
}

/** Compile a single `.lunas` source string to JS + diagnostics. */
export async function compileSource(source: string): Promise<CompileResult> {
  await initCompiler();
  return compile(source) as CompileResult;
}

/**
 * Compile all files and assemble the preview document. `entryName` is the file
 * whose default export is mounted (conventionally `App`); `activeName` selects
 * which file's compiled JS is returned for the "JavaScript" pane.
 */
export async function buildPreview(
  files: LunasFile[],
  activeName: string,
  entryName = "App",
): Promise<PreviewBuild> {
  const modules: Record<string, string> = {};
  let css = "";
  let activeJs = "";

  for (const file of files) {
    const result = await compileSource(file.content);
    const err = result.diagnostics?.find((d) => d.severity === "error");
    if (err) {
      return {
        doc: "",
        activeJs: "",
        css: "",
        error: `${file.name}.lunas: ${err.message}`,
      };
    }
    const code = result.code ?? "";
    modules[file.name] = bareifyImports(code);
    const style = extractStyle(file.content);
    if (style) css += style + "\n";
    if (file.name === activeName) activeJs = code;
  }

  const imports: Record<string, string> = {
    lunas: dataModule(runtimeSource),
  };
  for (const name of Object.keys(modules)) {
    imports[name] = dataModule(modules[name]);
  }

  const importMap = JSON.stringify({ imports });
  // `component()` roots are a single Element (attach handles them); a multi-root
  // template compiles to `fragment()`, whose factory returns an array of nodes
  // that `attach` can't appendChild. Append those directly, then fire the
  // subtree's onMount via a marker carrying the fragment's context.
  const entry = [
    `import App from ${JSON.stringify(entryName)};`,
    `import { attach } from "lunas";`,
    `const host = document.getElementById("app");`,
    `const root = App();`,
    `if (Array.isArray(root)) {`,
    `  for (const n of root) host.appendChild(n);`,
    `  const marker = document.createComment("");`,
    `  marker.__lunasCtx = root.__lunasCtx;`,
    `  attach(marker, host);`,
    `} else {`,
    `  attach(root, host);`,
    `}`,
  ].join("\n");

  const doc = [
    "<!doctype html>",
    '<html><head><meta charset="utf-8">',
    "<style>:root{color-scheme:light}body{margin:0;font-family:system-ui,sans-serif}</style>",
    `<style>${css}</style>`,
    "</head><body>",
    '<div id="app"></div>',
    `<script type="importmap">${importMap}</script>`,
    `<script type="module">${entry}</script>`,
    "</body></html>",
  ].join("");

  return { doc, activeJs, css, error: null };
}
