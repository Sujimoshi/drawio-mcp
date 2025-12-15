import { JSDOM } from "jsdom";

// Create a minimal browser-like environment for mxgraph using JSDOM.
const dom = new JSDOM();

// Attach core DOM globals
(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).XMLSerializer = dom.window.XMLSerializer;

// Ensure a browser‑like navigator is available. Node 22+ may expose a
// read‑only accessor for navigator, so we prefer redefining it via
// defineProperty when possible.
(() => {
  const g = globalThis as any;
  const existing = Object.getOwnPropertyDescriptor(g, "navigator");

  if (!existing || existing.configurable) {
    // Safe to replace or define from scratch.
    Object.defineProperty(g, "navigator", {
      value: dom.window.navigator,
      writable: true,
      configurable: true,
    });
    return;
  }

  // Fallback: property exists and is non‑configurable; try to at least
  // provide an appVersion so libraries like mxgraph don't crash.
  try {
    if (g.navigator && typeof g.navigator === "object" && !("appVersion" in g.navigator)) {
      (g.navigator as any).appVersion = "Node.js";
    }
  } catch {
    // If even this fails, we silently ignore; mxgraph feature detection
    // may be limited but the server should still run.
  }
})();

// Additional globals used by mxgraph
(globalThis as any).location = dom.window.location;
(globalThis as any).DOMParser = dom.window.DOMParser;
