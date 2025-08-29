import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { GraphFileManager } from "../GraphFileManager.js";
import { Tool } from "./McpServer.js";
import { Graph } from "../Graph.js";

export class AddNodeTool implements Tool {
  constructor(private fileManager = GraphFileManager.default) {}

  schema() {
    return {
      name: 'add_node',
      description: 'Add a node to a diagram file',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute or relative path to the diagram file to modify'
          },
          id: { type: 'string', description: 'Unique identifier for the node' },
          title: { type: 'string', description: 'Display label for the node (can contain newlines "\n")' },
          kind: {
            type: 'string',
            enum: Object.keys(Graph.Kinds),
            default: 'Rectangle',
            description: 'Shape/kind of the node'
          },
          parent: {
            type: 'string',
            default: 'root',
            description: 'Parent node ID (root for top-level nodes)'
          },
          x: { type: 'number', description: 'X coordinate' },
          y: { type: 'number', description: 'Y coordinate' },
          width: { type: 'number', description: 'Custom width (optional)' },
          height: { type: 'number', description: 'Custom height (optional)' }
        },
        required: ['file_path', 'id', 'title', 'x', 'y']
      }
    }
  }

  async execute({ file_path, id, title, kind = 'Rectangle', parent = 'root', x, y, width, height }) {
    if (!file_path || !id || !title || x === undefined || y === undefined) {
      throw new McpError(ErrorCode.InvalidParams, 'file_path, id, title, x, and y are required');
    }

    const graph = await this.fileManager.loadGraphFromSvg(file_path);
    
    graph.addNode({ 
      id, 
      title, 
      kind, 
      parent, 
      x: Number(x), 
      y: Number(y),
      ...(width && { width: Number(width) }),
      ...(height && { height: Number(height) })
    });

    await this.fileManager.saveGraphToSvg(graph, file_path);
    
    return {
      content: [
        {
          type: 'text',
          text: `Added node: ${id} (${title}) with shape ${kind} to ${file_path}`,
        }
      ]
    };
  }
}