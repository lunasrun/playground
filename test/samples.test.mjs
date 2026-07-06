// Compile every playground sample with the real Lunas compiler so a broken
// sample can't ship. Uses the wasm-pack `nodejs` build (pnpm wasm:build); when
// it's absent this skips loudly rather than failing, mirroring the opt-in
// real-binary pattern (CI runs `pnpm wasm:build` before `pnpm test`).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SAMPLES } from "../src/samples.data.mjs";

const wasmEntry = fileURLToPath(new URL("../wasm/node/lunas_wasm.js", import.meta.url));
const haveWasm = existsSync(wasmEntry);
const compile = haveWasm ? createRequire(import.meta.url)(wasmEntry).compile : null;

for (const sample of SAMPLES) {
  test(`sample "${sample.name}" compiles cleanly`, { skip: haveWasm ? false : "wasm not built (run pnpm wasm:build)" }, () => {
    for (const file of sample.files) {
      const result = compile(file.content);
      const errors = (result.diagnostics ?? []).filter((d) => d.severity === "error");
      assert.deepEqual(
        errors.map((e) => e.message),
        [],
        `${sample.name} / ${file.name}.lunas should have no compiler errors`,
      );
      assert.ok(result.code, `${sample.name} / ${file.name}.lunas should emit code`);
    }
  });
}
