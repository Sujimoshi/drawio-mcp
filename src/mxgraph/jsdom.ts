import { JSDOM } from 'jsdom';

const dom = new JSDOM();

(global as any).window = dom.window;
global.document = window.document;
global.XMLSerializer = window.XMLSerializer;

// Node 24+ made global.navigator read-only. Try assignment first, then
// Object.defineProperty, and finally patch individual properties so mxgraph
// can find things like navigator.appVersion.
function forceGlobal(name: string, value: any) {
  try {
    (global as any)[name] = value;
    if ((global as any)[name] === value) return;
  } catch { /* read-only */ }
  try {
    Object.defineProperty(global, name, { value, writable: true, configurable: true });
    if ((global as any)[name] === value) return;
  } catch { /* still read-only */ }
  // Last resort: patch missing properties onto the existing global
  const existing = (global as any)[name];
  if (existing && typeof existing === 'object') {
    for (const key of Object.keys(value)) {
      try { if (!(key in existing)) (existing as any)[key] = value[key]; } catch {}
    }
    // Also copy own-property descriptors from the prototype (e.g. appVersion)
    const proto = Object.getPrototypeOf(value);
    if (proto) {
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key === 'constructor') continue;
        try {
          if (!(key in existing)) {
            const desc = Object.getOwnPropertyDescriptor(proto, key);
            if (desc) Object.defineProperty(existing, key, { get: () => value[key], configurable: true });
          }
        } catch {}
      }
    }
  }
}

forceGlobal('navigator', window.navigator);
forceGlobal('location', window.location);

global.DOMParser = window.DOMParser;
