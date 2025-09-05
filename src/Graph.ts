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

  addNode({ id, title, parent = 'root', kind = 'Rectangle', x = 10, y = 10, ...rest }) {
    const normalizedKind = Graph.normalizeKind(kind)
    const { style, width, height } = { ...Graph.Kinds[normalizedKind], ...rest }
    const to = parent === 'root' ? this.root : this.model.getCell(parent)
    const node = this.graph.insertVertex(to, id, title, Number(x), Number(y), width, height);
    node.setStyle(style)
    return node
  }

  editNode({ id, title, kind, x, y, width, height }) {
    const node = this.model.getCell(id);

    if (!node) throw new Error(`Node not found`);

    if (title) node.setValue(title);
    if (kind) node.setStyle(Graph.Kinds[Graph.normalizeKind(kind)].style);
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

  hierarchicalLayout(direction = DIRECTION_TOP_DOWN) {
    const dir = DIR_TO_MX_DIRECTION[direction]
    const layout = new mxHierarchicalLayout(this.graph, dir);
    return this.runLayout(layout, Object.values(this.model.cells)[1])
  }

  circleLayout() {
    const layout = new mxCircleLayout(this.graph);
    return this.runLayout(layout)
  }

  organicLayout() {
    const layout = new mxFastOrganicLayout(this.graph);
    return this.runLayout(layout)
  }

  compactTreeLayout() {
    const layout = new mxCompactTreeLayout(this.graph);
    return this.runLayout(layout)
  }

  radialTreeLayout() {
    const layout = new mxRadialTreeLayout(this.graph);
    return this.runLayout(layout)
  }

  partitionLayout() {
    const layout = new mxPartitionLayout(this.graph);
    return this.runLayout(layout)
  }

  stackLayout() {
    const layout = new mxStackLayout(this.graph);
    return this.runLayout(layout)
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

        this.hierarchicalLayout(options.direction);
        break;
      }
      case LAYOUT_CIRCLE: {
        this.circleLayout();
        break;
      }
      case LAYOUT_ORGANIC: {
        this.organicLayout();
        break;
      }
      case LAYOUT_COMPACT_TREE: {
        this.compactTreeLayout();
        break;
      }
      case LAYOUT_RADIAL_TREE: {
        this.radialTreeLayout();
        break;
      }
      case LAYOUT_PARTITION: {
        this.partitionLayout();
        break;
      }
      case LAYOUT_STACK: {
        this.stackLayout();
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

