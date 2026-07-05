// Unit tests for the preview source transforms — pure, no wasm, no browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractStyle, bareifyImports, dataModule } from "../src/preview/transform.mjs";

test("extractStyle pulls the dedented style: block body", () => {
  const src = [
    "html:",
    "    <p>hi</p>",
    "style:",
    "    .a { color: red; }",
    "    .b { margin: 0; }",
    "script:",
    "    let n = 0",
  ].join("\n");
  assert.equal(extractStyle(src), ".a { color: red; }\n.b { margin: 0; }");
});

test("extractStyle returns empty when there is no style block", () => {
  assert.equal(extractStyle("html:\n    <p>hi</p>\nscript:\n    let n = 0"), "");
});

test("bareifyImports rewrites sibling .lunas imports to bare specifiers", () => {
  const code = 'import Child from "./Child.lunas";\nimport { x } from "lunas";';
  assert.equal(
    bareifyImports(code),
    'import Child from "Child";\nimport { x } from "lunas";',
  );
});

test("bareifyImports leaves the runtime import untouched", () => {
  const code = 'import { component } from "lunas";';
  assert.equal(bareifyImports(code), code);
});

test("dataModule produces a decodable text/javascript data URL", () => {
  const code = 'export default 1 + 1; // ${weird} & chars';
  const url = dataModule(code);
  assert.ok(url.startsWith("data:text/javascript;charset=utf-8,"));
  assert.equal(decodeURIComponent(url.split(",").slice(1).join(",")), code);
});
