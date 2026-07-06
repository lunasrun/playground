// Browser-safe stand-in for `@lunas-tools/wasm`, aliased in vite.config.ts.
//
// The language server (external/lunas-tools) imports `LineIndex` + types from
// `@lunas-tools/wasm`, but that package's barrel also re-exports a Node-only
// loader (node:fs / node:module) that can't run in a web worker. `LineIndex`
// is standalone (pure offset→position math), so we re-export just it; the
// server's compiler is injected separately (the playground's web-wasm build).
export { LineIndex } from "../../external/lunas-tools/packages/wasm/src/line-index.ts";
