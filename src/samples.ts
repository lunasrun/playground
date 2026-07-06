// Loadable samples for the playground. The sample *data* lives in the plain-ESM
// `samples.data.mjs` (single source of truth) so a dependency-light test can
// compile every one with the real Lunas compiler; this module just adds types.
import type { LunasFile } from "./preview/engine.js";

export interface Sample {
  name: string;
  files: LunasFile[];
}

export { DEFAULT_FILES, SAMPLES } from "./samples.data.mjs";
