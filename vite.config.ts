import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { build as esbuild } from "esbuild";
import lunas from "vite-plugin-lunas";

// The plugin compiles the playground's own `.lunas` UI at build time via the
// wasm-pack `nodejs` bindings built by `pnpm wasm:build` into `wasm/node`.
// Resolved from this file's URL — no absolute paths (see scripts/build-wasm.mjs).
const wasmPkgPath = fileURLToPath(new URL("./wasm/node", import.meta.url));

// The live preview runs user code inside a sandboxed iframe, which needs the
// Lunas runtime as a single self-contained ES module. Bundle it once (from the
// submodule) and expose the source text as `virtual:lunas-runtime`, so the
// preview engine can inline it as a data: URL (blob: URLs are blocked in the
// iframe's opaque origin).
function lunasRuntimeVirtual(): Plugin {
  const id = "virtual:lunas-runtime";
  const resolved = "\0" + id;
  const entry = fileURLToPath(
    new URL("./external/lunas/packages/lunas/src/index.mjs", import.meta.url),
  );
  return {
    name: "lunas-runtime-virtual",
    resolveId(source) {
      return source === id ? resolved : null;
    },
    async load(loadId) {
      if (loadId !== resolved) return null;
      const result = await esbuild({
        entryPoints: [entry],
        bundle: true,
        format: "esm",
        platform: "browser",
        write: false,
      });
      return `export default ${JSON.stringify(result.outputFiles[0].text)};`;
    },
  };
}

export default defineConfig({
  plugins: [lunas({ wasmPkgPath }), lunasRuntimeVirtual()],
});
