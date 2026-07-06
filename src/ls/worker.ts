// The Lunas language server, running in a dedicated web worker.
//
// Reuses the real `lunas-ls` from the tooling repo (external/lunas-tools) — the
// same server that ships for VS Code — and injects the playground's own
// (codegen-complete) web-wasm compiler so diagnostics match the live preview.
// As lunas-ls gains capabilities (hover / completion / definition), they light
// up here automatically with no client changes.
import {
  createConnection,
  BrowserMessageReader,
  BrowserMessageWriter,
} from "vscode-languageserver/browser";
// @ts-expect-error — submodule TS, resolved & bundled by Vite (not typechecked).
import { createServer } from "../../external/lunas-tools/packages/language-server/src/server.js";
import init, { compile, analyze } from "../../wasm/web/lunas_wasm.js";
import wasmUrl from "../../wasm/web/lunas_wasm_bg.wasm?url";

const worker = self as unknown as {
  postMessage(message: unknown): void;
  addEventListener(type: string, listener: (event: unknown) => void): void;
};

const reader = new BrowserMessageReader(worker as never);
const writer = new BrowserMessageWriter(worker as never);
const connection = createConnection(reader, writer);

// The wasm loads asynchronously; until it's ready the server serves the
// structural features (document symbols / folding) and skips diagnostics /
// navigation. Once loaded, `compile` powers diagnostics and `analyze` powers
// hover / go-to-definition / references / highlight / rename.
let compileFn: ((source: string) => unknown) | null = null;
let analyzeFn: ((source: string) => unknown) | null = null;
init(wasmUrl).then(() => {
  compileFn = (source: string) => compile(source);
  analyzeFn = (source: string) => analyze(source);
});

createServer(
  connection,
  () => compileFn,
  () => analyzeFn,
);

// Tell the main thread the worker script is up so the client attaches its
// message reader before sending `initialize`.
worker.postMessage({ type: "ready" });
