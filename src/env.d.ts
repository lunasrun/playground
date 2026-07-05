/// <reference types="vite/client" />

// The Lunas runtime, bundled to a single ESM source string at build time
// (see the `lunasRuntimeVirtual` plugin in vite.config.ts).
declare module "virtual:lunas-runtime" {
  const source: string;
  export default source;
}

// The wasm-pack `web` glue for the browser compiler build (in wasm/web).
declare module "*/lunas_wasm.js" {
  export default function init(input?: string | URL | Request): Promise<unknown>;
  export function compile(source: string): {
    code: string | null;
    diagnostics: { severity: string; message: string; start: number; end: number }[];
  };
  export function version(): string;
}
