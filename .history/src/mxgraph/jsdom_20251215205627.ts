import { JSDOM } from "jsdom";

const dom = new JSDOM();

(global as any).window = dom.window;
global.document = window.document;
global.XMLSerializer = window.XMLSerializer

// #region agent log
fetch('http://127.0.0.1:7242/ingest/e125f499-b451-4501-a0ec-41a5979217c1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'debug-session',
    runId: 'pre-fix',
    hypothesisId: 'H1',
    location: 'src/mxgraph/jsdom.ts:9',
    message: 'Before setting global navigator',
    data: (() => {
      try {
        const desc = Object.getOwnPropertyDescriptor(globalThis as any, 'navigator');
        return {
          hasNavigator: 'navigator' in (globalThis as any),
          isWritable: desc ? !!desc.writable : null,
          isConfigurable: desc ? !!desc.configurable : null,
          hasGetter: !!(desc && typeof desc.get === 'function'),
          hasSetter: !!(desc && typeof desc.set === 'function'),
        };
      } catch (e) {
        return { descriptorError: String(e) };
      }
    })(),
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

try {
  global.navigator = window.navigator;
} catch (e) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e125f499-b451-4501-a0ec-41a5979217c1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId: 'H2',
      location: 'src/mxgraph/jsdom.ts:30',
      message: 'Error when setting global navigator',
      data: (() => {
        try {
          const desc = Object.getOwnPropertyDescriptor(globalThis as any, 'navigator');
          return {
            error: String(e),
            hasNavigator: 'navigator' in (globalThis as any),
            isWritable: desc ? !!desc.writable : null,
            isConfigurable: desc ? !!desc.configurable : null,
            hasGetter: !!(desc && typeof desc.get === 'function'),
            hasSetter: !!(desc && typeof desc.set === 'function'),
          };
        } catch (inner) {
          return { error: String(e), descriptorError: String(inner) };
        }
      })(),
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  throw e;
}

global.location = window.location;
global.DOMParser = window.DOMParser;
