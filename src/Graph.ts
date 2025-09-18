import { mxGraph, mxCodec, mxUtils, mxHierarchicalLayout, mxConstants, mxCircleLayout, mxGeometry, mxFastOrganicLayout, mxCompactTreeLayout, mxRadialTreeLayout, mxPartitionLayout, mxStackLayout } from './mxgraph/index.js';

const LAYOUT_HIERARCHICAL = 'hierarchical'
const LAYOUT_CIRCLE = 'circle'
const LAYOUT_ORGANIC = 'organic'
const LAYOUT_COMPACT_TREE = 'compact-tree'
const LAYOUT_RADIAL_TREE = 'radial-tree'
const LAYOUT_PARTITION = 'partition'
const LAYOUT_STACK = 'stack'

const DIRECTION_TOP_DOWN = 'top-down'
const DIRECTION_LEFT_RIGHT = 'left-right'

const DIR_TO_MX_DIRECTION = {
  [DIRECTION_TOP_DOWN]: mxConstants.DIRECTION_NORTH,
  [DIRECTION_LEFT_RIGHT]: mxConstants.DIRECTION_WEST
}

const DEFAULT_CORNER_RADIUS = 12
const KIND_ROUNDED_RECTANGLE = 'RoundedRectangle'
const PROP_ARC_SIZE = 'arcSize'
const PROP_ABSOLUTE_ARC_SIZE = 'absoluteArcSize'

export class Graph {
  static Kinds = {
    Rectangle: { style: { rounded: 1, whiteSpace: 'wrap', html: 1 }, width: 120, height: 60 },
    Ellipse: { style: { ellipse: '', whiteSpace: 'wrap', html: 1 }, width: 120, height: 80 },
    Cylinder: { style: 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;', width: 60, height: 80 },
    Cloud: { style: 'ellipse;shape=cloud;whiteSpace=wrap;html=1;', width: 120, height: 80 },
    Square: { style: 'whiteSpace=wrap;html=1;aspect=fixed;rounded=1;', width: 80, height: 80 },
    Circle: { style: 'ellipse;whiteSpace=wrap;html=1;aspect=fixed;', width: 80, height: 80 },
    Step: { style: 'shape=step;perimeter=stepPerimeter;whiteSpace=wrap;html=1;fixedSize=1;', width: 120, height: 80 },
    Actor: { style: 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;', width: 30, height: 60 },
    Text: { style: 'text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;', width: 60, height: 30 },
    RoundedRectangle: { style: `whiteSpace=wrap;html=1;rounded=1;absoluteArcSize=1;arcSize=${DEFAULT_CORNER_RADIUS * 2}`, width: 120, height: 60 },
  }

  static normalizeKind(kind: string) {
    if (kind === 'Elipse') return 'Ellipse';
    return kind;
  }

  graph: typeof mxGraph;
  container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.graph = new mxGraph(this.container);
  }

  get root() {
    return this.graph.getDefaultParent();
  }

  get model() {
    return this.graph.getModel()
  }

  toStyleString(data) {
    if (typeof data === 'string') return data
    return Object.entries(data).reduce((tmp, [key, value]) => {
      return value === undefined ? tmp : tmp += key + (value ? `=${value}` : '') + ';'
    }, '')
  }

  /**
   * Parses a style definition into a key-value object.
   * 
   * Handles both string and object style formats:
   * - String format: "key1=value1;key2=value2;" (semicolon-separated key=value pairs)
   * - Object format: { key1: "value1", key2: "value2" } (plain object)
   * 
   * For string styles, empty values (e.g., "key=") are converted to empty strings.
   * For object styles, the input is shallow copied to avoid mutation.
   * 
   * @param style - Style definition as either a semicolon-separated string or object
   * @returns Object with style properties as key-value pairs
   * 
   * @example
   * parseStyle("rounded=1;whiteSpace=wrap;html=1")
   * // Returns: { rounded: "1", whiteSpace: "wrap", html: "1" }
   * 
   * @example
   * parseStyle({ rounded: 1, whiteSpace: "wrap" })
   * // Returns: { rounded: 1, whiteSpace: "wrap" }
   */
  private parseStyle(style: any): Record<string, string> {
    if (typeof style === 'string') {
      return style.split(';').filter(Boolean).reduce((acc: Record<string, string>, kv) => {
        const [k, v] = kv.split('=');
        acc[k] = v === undefined ? '' : v;
        return acc;
      }, {});
    }
    return { ...style };
  }

  /**
   * Converts a style object into a semicolon-separated style string.
   * 
   * This function is the inverse of parseStyle(), converting a key-value object
   * back into the string format used by mxGraph. Properties with undefined values
   * are skipped, while properties with falsy values (empty string, 0, false) are
   * included with just the key name (no equals sign).
   * 
   * @param style - Object with style properties as key-value pairs
   * @returns Semicolon-separated style string in format "key1=value1;key2;key3=value3;"
   * 
   * @example
   * stringifyStyle({ rounded: "1", whiteSpace: "wrap", html: "1" })
   * // Returns: "rounded=1;whiteSpace=wrap;html=1;"
   * 
   * @example
   * stringifyStyle({ rounded: "", whiteSpace: "wrap" })
   * // Returns: "rounded;whiteSpace=wrap;"
   */
  private stringifyStyle(style: Record<string, any>): string {
    return Object.entries(style).reduce((tmp, [key, value]) => {
      return value === undefined ? tmp : tmp += key + (value ? `=${value}` : '') + ';'
    }, '');
  }

  

  /**
   * Adjusts the style string for a specific node kind, applying kind-specific modifications.
   * 
   * For RoundedRectangle nodes, this function modifies the corner radius by setting:
   * - absoluteArcSize to '1' to enable absolute arc sizing
   * - arcSize to the calculated value (corner_radius * 2, default to 24)
   * 
   * @param style - The base style string to modify
   * @param kind - The node kind (e.g., 'RoundedRectangle', 'Rectangle', etc.)
   * @param corner_radius - The desired corner radius in pixels (only applies to RoundedRectangle)
   * @returns The modified style string with kind-specific adjustments applied
   */
  private adjustStyleByKind(style: string, kind: string, corner_radius: number) : string {
    if (kind === KIND_ROUNDED_RECTANGLE) {
      const styleObj = this.parseStyle(style);
      if (corner_radius !== undefined) {
        const cr = parseInt(String(corner_radius), 10);
        styleObj[PROP_ABSOLUTE_ARC_SIZE] = '1';
        const arcSize = !isNaN(cr) && cr >= 1 ? cr * 2 : DEFAULT_CORNER_RADIUS * 2;
        styleObj[PROP_ARC_SIZE] = String(arcSize);
      }
      // console.error(`adjusted style: ${this.stringifyStyle(styleObj)}`);
      return this.stringifyStyle(styleObj);
    }
    return style;
  }

  
  addNode({ id, title, parent = 'root', kind = 'Rectangle', x = 10, y = 10, corner_radius, ...rest }) {
    const normalizedKind = Graph.normalizeKind(kind)
    const { style, width, height } = { ...Graph.Kinds[normalizedKind], ...rest }
    
    const to = parent === 'root' ? this.root : this.model.getCell(parent)
    const node = this.graph.insertVertex(to, id, title, Number(x), Number(y), width, height);
    node.setStyle(this.adjustStyleByKind(style, normalizedKind, corner_radius));
    return node
  }

  editNode({ id, title, kind, x, y, width, height, corner_radius }) {
    const node = this.model.getCell(id);

    if (!node) throw new Error(`Node not found`);
    const normalizedKind = Graph.normalizeKind(kind)
    if (title) node.setValue(title);
    if (kind) node.setStyle(Graph.Kinds[normalizedKind].style);

    // if it's rounded, apply the corner radius
    const isRounded = normalizedKind === KIND_ROUNDED_RECTANGLE;
    if (isRounded && corner_radius !== undefined) {
      const currentStyleStr = node.getStyle && node.getStyle() ? String(node.getStyle()) : '';
      node.setStyle(this.adjustStyleByKind(currentStyleStr, normalizedKind, corner_radius));
    }
    // if the geometry is changed, update the geometry
    if (x !== undefined || y !== undefined || width !== undefined || height !== undefined) {
      const geometry = node.getGeometry();
      node.setGeometry(new mxGeometry(
        x ?? geometry.x,
        y ?? geometry.y,
        width ?? geometry.width,
        height ?? geometry.height
      ));
    }

    return this
  }

  linkNodes({ from, to, title, style = {} }) {
    const [fromNode, toNode] = [this.model.getCell(from), this.model.getCell(to)]
    const id = `${from}-2-${to}`
    const line = this.graph.insertEdge(this.root, id, title ? title : null, fromNode, toNode);
    line.setStyle(this.toStyleString({
      edgeStyle: 'none',
      noEdgeStyle: 1,
      orthogonal: 1,
      html: 1,
      ...style
    }))
    
    return id
  }

  removeNodes(ids: string[]) {
    const cells = ids.map(id => this.model.getCell(id));
    this.graph.removeCells(cells);
    return this
  }

  /**
   * Executes a given layout algorithm on the graph's root element.
   *
   * @param layout - An object with an `execute` method, typically an mxGraph layout instance.
   * @param args - Additional arguments to pass to the layout's `execute` method.
   * @returns The current Graph instance for method chaining.
   *
   * @remarks
   * This method is used internally to apply various mxGraph layout algorithms
   * (e.g., hierarchical, circle, organic) to the graph. The layout is executed
   * on the root element of the graph, and any additional arguments are forwarded
   * to the layout's `execute` method.
   */
  private runLayout(layout: { execute: (...params: any[]) => void }, ...args: any[]) {
    layout.execute(this.root, ...args);
    return this
  }


  /**
   * Applies a layout algorithm to the graph.
   *
   * @param params - An object containing the layout algorithm and optional options.
   * @param params.algorithm - The name of the layout algorithm to apply. Supported values are:
   *   - 'hierarchical'
   *   - 'circle'
   *   - 'organic'
   *   - 'compact-tree'
   *   - 'radial-tree'
   *   - 'partition'
   *   - 'stack'
   * @param params.options - Optional parameters for the layout algorithm.
   *   - For 'hierarchical', you may specify `direction` as either 'top-down' or 'left-right'.
   *
   * @throws {Error} If an unsupported algorithm is provided, or if an invalid direction is specified for hierarchical layout.
   *
   * @returns {Graph} The current Graph instance for method chaining.
   *
   * @example
   * graph.applyLayout({ algorithm: 'hierarchical', options: { direction: 'left-right' } });
   * graph.applyLayout({ algorithm: 'circle' });
   */
  applyLayout({ algorithm, options = {} }: { algorithm: string; options?: any }) {
    switch (algorithm) {
      case LAYOUT_HIERARCHICAL: {
        if (  options.direction !== undefined &&
              options.direction !== DIRECTION_TOP_DOWN && options.direction !== DIRECTION_LEFT_RIGHT )
            throw new Error( `Invalid hierarchical direction: ${options.direction}. Allowed: ${DIRECTION_TOP_DOWN}, ${DIRECTION_LEFT_RIGHT}` );

        this.runLayout(new mxHierarchicalLayout(this.graph, DIR_TO_MX_DIRECTION[options.direction]), Object.values(this.model.cells)[1]);
        break;
      }
      case LAYOUT_CIRCLE: {
        this.runLayout(new mxCircleLayout(this.graph));
        break;
      }
      case LAYOUT_ORGANIC: {
        this.runLayout(new mxFastOrganicLayout(this.graph));
        break;
      }
      case LAYOUT_COMPACT_TREE: {
        this.runLayout(new mxCompactTreeLayout(this.graph));
        break;
      }
      case LAYOUT_RADIAL_TREE: {
        this.runLayout(new mxRadialTreeLayout(this.graph));
        break;
      }
      case LAYOUT_PARTITION: {
        this.runLayout(new mxPartitionLayout(this.graph));
        break;
      }
      case LAYOUT_STACK: {
        this.runLayout(new mxStackLayout(this.graph));
        break;
      }
      default: {
        const supportedAlgorithms = [ LAYOUT_HIERARCHICAL, LAYOUT_CIRCLE, LAYOUT_ORGANIC,
                                      LAYOUT_COMPACT_TREE, LAYOUT_RADIAL_TREE, LAYOUT_PARTITION,
                                      LAYOUT_STACK,
                                    ];
        throw new Error( `Unsupported layout algorithm: ${algorithm}. Supported: ${supportedAlgorithms.join(', ')}` );
      }
    }
    return this;
  }

  toXML() {
    const encoder = new mxCodec();
    const result = encoder.encode(this.model);
    return mxUtils.getPrettyXml(result)
  }

  /**
   * Static method to create a Graph instance from XML
   * @param {string} xmlString - XML string in mxGraph format
   * @returns {Graph} - New Graph instance loaded from XML
   */
  static fromXML(xmlString) {
    const graph = new Graph();

    // Use the global DOMParser that was set up in mxgraph.js
    const parsedDoc = new DOMParser().parseFromString(xmlString, 'text/xml')

    // Create a codec with the parsed document
    const codec = new mxCodec(parsedDoc);
    
    codec.decode(parsedDoc.documentElement, graph.model);

    return graph;
  }
}

