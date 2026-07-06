import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { build as esbuild } from "esbuild";
import lunas from "vite-plugin-lunas";

// Rollup (production build) doesn't expand the `"./vscode/*"` wildcard exports
// of the @codingame/monaco-vscode-* packages the way esbuild (dev) does, so it
// fails to resolve deep subpaths like
// `@codingame/monaco-vscode-api/vscode/vs/base/browser/cssValue`. Map those to
// the actual files (`<pkg>/vscode/src/<rest>.js`) ourselves.
function codingameVscodeSubpaths(): Plugin {
  const require = createRequire(import.meta.url);
  return {
    name: "codingame-vscode-subpaths",
    enforce: "pre",
    resolveId(source) {
      const m = source.match(/^(@codingame\/[^/]+)\/vscode\/(.+)$/);
      if (!m || /\.(js|css|json)$/.test(m[2])) return null;
      // The packages' `exports` maps don't expose `package.json`, so locate the
      // package root via its main entry instead.
      let pkgDir: string;
      try {
        pkgDir = dirname(require.resolve(m[1]));
      } catch {
        return null;
      }
      const file = join(pkgDir, "vscode", "src", `${m[2]}.js`);
      return existsSync(file) ? file : null;
    },
  };
}

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
  base: "./",
  plugins: [codingameVscodeSubpaths(), lunas({ wasmPkgPath }), lunasRuntimeVirtual()],
  resolve: {
    alias: {
      // The language server imports LineIndex + types from `@lunas-tools/wasm`;
      // route it to a browser-safe shim (the package's real barrel pulls in a
      // Node-only loader). See src/ls/wasm-shim.mjs.
      "@lunas-tools/wasm": fileURLToPath(new URL("./src/ls/wasm-shim.mjs", import.meta.url)),
    },
  },
  worker: { format: "es" },
});
