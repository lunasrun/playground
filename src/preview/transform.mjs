// Pure, dependency-free source transforms used when assembling the preview.
// Kept as plain ESM (with a sibling .d.ts) and separate from engine.ts — which
// pulls in the wasm compiler and the bundled-runtime virtual module — so they
// can be unit-tested under `node --test` without a browser or the wasm binary.

/**
 * Pull the raw CSS out of a `.lunas` `style:` block. The format is
 * indentation-based: `style:` on its own line, then the block body indented
 * beneath it until the next top-level line. The current codegen drops styles,
 * so the playground extracts and injects them into the preview itself.
 * @param {string} source
 * @returns {string}
 */
export function extractStyle(source) {
  const lines = source.split("\n");
  const out = [];
  let inStyle = false;
  let indent = 0;
  for (const line of lines) {
    if (!inStyle) {
      if (/^style:\s*$/.test(line)) {
        inStyle = true;
        indent = 0;
      }
      continue;
    }
    if (line.trim() === "") {
      out.push("");
      continue;
    }
    const lead = line.length - line.trimStart().length;
    if (lead === 0) break; // dedent to a new top-level block ends the style
    if (indent === 0) indent = lead;
    out.push(line.slice(Math.min(indent, lead)));
  }
  return out.join("\n").trim();
}

/**
 * Rewrite sibling component imports (`from "./Foo.lunas"`) to bare specifiers
 * (`from "Foo"`) so an import map can resolve them across `data:` URL modules
 * (a relative specifier would resolve against the importing data: URL, which
 * has no meaningful base, rather than against the map).
 * @param {string} code
 * @returns {string}
 */
export function bareifyImports(code) {
  return code.replace(/from\s*(["'])\.\/([^"']+?)\.lunas\1/g, 'from "$2"');
}

/**
 * Encode a module's source as a `data:` URL usable from a sandboxed iframe.
 * @param {string} code
 * @returns {string}
 */
export function dataModule(code) {
  return "data:text/javascript;charset=utf-8," + encodeURIComponent(code);
}
