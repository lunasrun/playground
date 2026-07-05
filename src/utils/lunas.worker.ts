import LunasWorker from "../ls/lunas-ls.worker?worker";

export default function createLunasWorker() {
  return new LunasWorker();
}
