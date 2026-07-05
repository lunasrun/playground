/// <reference types="vite/client" />

declare module "*?tsraw" {
  const src: string;
  export default src;
}

declare module "*.vue" {
  import { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
