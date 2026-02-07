import { JSDOM } from "jsdom";

const dom = new JSDOM();

(global as any).window = dom.window;
global.document = window.document;
global.XMLSerializer = window.XMLSerializer;
// Node 24+ made global.navigator (and sometimes location) read-only; avoid crash (mxgraph still works via window.*)
try {
  (global as any).navigator = window.navigator;
} catch {
  /* ignored on Node 24+ */
}
try {
  (global as any).location = window.location;
} catch {
  /* ignored on Node 24+ */
}
global.DOMParser = window.DOMParser;
