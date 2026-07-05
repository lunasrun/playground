import { attach } from "lunas";
import { api } from "./playground.js";
import App from "./App.lunas";
import "./styles.css";

// Install the playground API on the global object before the UI mounts: the
// Lunas `script:` blocks reach it via `globalThis.pg` (they can't `import`).
globalThis.pg = api;

// Warm up the wasm compiler in the background so the first preview is snappy.
api.initCompiler();

attach(App(), document.getElementById("app")!);
