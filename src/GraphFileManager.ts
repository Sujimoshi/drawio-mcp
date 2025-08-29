import fs from 'fs/promises';
import path from 'path';
import pako from 'pako';
import { Graph } from './Graph';

/**
 * Handles diagram file operations and SVG content parsing
 * Works directly with file paths
 */
export class GraphFileManager {
  static default = new GraphFileManager();

  /**
   * Load a graph from a .drawio.svg file
   */
  async loadGraphFromSvg(filePath: string) {
    // Resolve relative paths relative to process.cwd()
    const resolvedPath = path.resolve(filePath);
    await fs.access(resolvedPath);
    
    // Load from SVG content attribute and use direct XML loading
    const svgContent = await fs.readFile(resolvedPath, 'utf8');
    const xmlData = this.extractXMLFromSVG(svgContent);
    
    return Graph.fromXML(xmlData);
  }

  /**
   * Save a graph to a .drawio.svg file
   * @param {Graph} graph - Graph instance to save
   * @param {string} filePath - Absolute or relative path to save the .drawio.svg file
   */
  async saveGraphToSvg(graph: Graph, filePath: string) {
    // Resolve relative paths relative to process.cwd()
    const resolvedPath = path.resolve(filePath);
    // Ensure directory exists
    const dir = path.dirname(resolvedPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Save SVG for VSCode draw.io extension (no metadata file needed!)

    const tmp = pako.deflateRaw(encodeURIComponent(graph.toXML()));
    var bytes = new Uint8Array(tmp);
    var binary = '';

    for (var i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    const compressed = btoa(binary);
    const content = `&lt;mxfile&gt;&lt;diagram id=&quot;d&quot; name=&quot;P&quot;&gt;${compressed}&lt;/diagram&gt;&lt;/mxfile&gt;`;
    graph.container.children[0].setAttribute('content', 'replaceme')
    const svgContent = graph.container.innerHTML.replace('replaceme', content)

    await fs.writeFile(resolvedPath, svgContent, 'utf8');
  }


  /**
   * Get diagram statistics from file
   * @param {string} filePath - Absolute or relative path to the file
   * @returns {Object} - Object with nodeCount and edgeCount
   */
  async getDiagramStats(filePath: string) {
    try {
      const graph = await this.loadGraphFromSvg(filePath);
      const cells = graph.model.cells;
      const nodeCount = Object.values(cells).filter((cell: any) => cell && cell.vertex).length;
      const edgeCount = Object.values(cells).filter((cell: any) => cell && cell.edge).length;
      return { nodeCount, edgeCount };
    } catch {
      return { nodeCount: 0, edgeCount: 0 };
    }
  }

  /**
   * Extract raw XML data from SVG content attribute for direct mxGraph loading
   * @param {string} svgContent - Raw SVG file content
   * @returns {string|null} - Raw mxGraph XML data or null if extraction fails
   */
  extractXMLFromSVG(svgContent: string) {
    // Extract the content attribute from SVG
    const contentMatch = svgContent.match(/content="([^"]+)"/);
    if (!contentMatch) {
      return null;
    }

    // Decode the content attribute
    const encodedContent = contentMatch[1];
    
    // Step 1: HTML decode
    const htmlDecoded = encodedContent
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');

    // Step 2: Extract base64 data from mxfile structure
    const mxfileMatch = htmlDecoded.match(/<diagram[^>]*>([^<]+)<\/diagram>/);
    if (!mxfileMatch) {
      return null;
    }

    // Step 3: Base64 decode and decompress
    const base64Data = mxfileMatch[1];
    const compressedData = Buffer.from(base64Data, 'base64');
    const decompressed = pako.inflateRaw(compressedData, { to: 'string' });
    
    // Step 4: URI decode to get XML - return directly for mxGraph
    const xmlData = decodeURIComponent(decompressed);
    return xmlData;
  }
}
