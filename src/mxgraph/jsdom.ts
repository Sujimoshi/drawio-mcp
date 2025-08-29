import { JSDOM } from "jsdom";

const dom = new JSDOM();

(global as any).window = dom.window;
global.document = window.document;
global.XMLSerializer = window.XMLSerializer
global.navigator = window.navigator;
global.location = window.location;
global.DOMParser = window.DOMParser;
