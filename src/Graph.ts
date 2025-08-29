import { mxGraph, mxCodec, mxUtils, mxHierarchicalLayout, mxConstants, mxCircleLayout, mxGeometry } from './mxgraph/index.js';

export class Graph {
  static Kinds = {
    Rectangle: { style: { rounded: 1, whiteSpace: 'wrap', html: 1 }, width: 120, height: 60 },
    Elipse: { style: { ellipse: '', whiteSpace: 'wrap', html: 1 }, width: 120, height: 80 },
    Cylinder: { style: 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;', width: 60, height: 80 },
    Cloud: { style: 'ellipse;shape=cloud;whiteSpace=wrap;html=1;', width: 120, height: 80 },
    Square: { style: 'whiteSpace=wrap;html=1;aspect=fixed;rounded=1;', width: 80, height: 80 },
    Circle: { style: 'ellipse;whiteSpace=wrap;html=1;aspect=fixed;', width: 80, height: 80 },
    Step: { style: 'shape=step;perimeter=stepPerimeter;whiteSpace=wrap;html=1;fixedSize=1;', width: 120, height: 80 },
    Actor: { style: 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;', width: 30, height: 60 },
    Text: { style: 'text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;', width: 60, height: 30 },
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
    const { style, width, height } = { ...Graph.Kinds[kind], ...rest }
    const to = parent === 'root' ? this.root : this.model.getCell(parent)
    const node = this.graph.insertVertex(to, id, title, Number(x), Number(y), width, height);
    node.setStyle(style)
    return node
  }

  editNode({ id, title, kind, x, y, width, height }) {
    const node = this.model.getCell(id);

    if (!node) throw new Error(`Node not found`);

    if (title) node.setValue(title);
    if (kind) node.setStyle(Graph.Kinds[kind].style);
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

  hierarchicalLayout(direction = 'top-down') {
    const dir = { 'top-down': mxConstants.DIRECTION_NORTH, 'left-right': mxConstants.DIRECTION_WEST }[direction]
    const layout = new mxHierarchicalLayout(this.graph, dir);
    layout.execute(this.root, Object.values(this.model.cells)[1]);
    return this
  }

  circleLayout() {
    const layout = new mxCircleLayout(this.graph);
    layout.execute(this.root);
    return this
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

