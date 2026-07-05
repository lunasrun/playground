// The bridge between the Lunas UI and the (non-reactive) TypeScript logic.
//
// Lunas `script:` blocks can't yet `import` modules, so `main.ts` installs this
// API on `globalThis.pg` and the `.lunas` components call into it. Everything
// here is a plain async/pure function — the reactive state lives in the Lunas
// components.
import { buildPreview, initCompiler, type LunasFile, type PreviewBuild } from "./preview/engine.js";
import { DEFAULT_FILES, SAMPLES, type Sample } from "./samples.js";

const STORAGE_KEY = "lunas-playground.files.v1";

function loadFiles(): LunasFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_FILES);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // fall through to defaults on any corruption
  }
  return structuredClone(DEFAULT_FILES);
}

function saveFiles(files: LunasFile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch {
    // ignore quota / privacy-mode failures — persistence is best-effort
  }
}

export interface PlaygroundApi {
  loadFiles(): LunasFile[];
  saveFiles(files: LunasFile[]): void;
  build(files: LunasFile[], activeName: string): Promise<PreviewBuild>;
  samples(): Sample[];
  initCompiler(): Promise<unknown>;
}

export const api: PlaygroundApi = {
  loadFiles,
  saveFiles,
  build: (files, activeName) => buildPreview(files, activeName),
  samples: () => SAMPLES,
  initCompiler,
};

declare global {
  // eslint-disable-next-line no-var
  var pg: PlaygroundApi;
}
