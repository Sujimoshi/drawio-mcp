import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { GraphFileManager } from "../GraphFileManager.js";
import { Tool } from "./McpServer.js";
import { Graph } from "../Graph.js";

export class AddNodeTool implements Tool {
  constructor(private fileManager = GraphFileManager.default) {}

  schema() {
    return {
      name: 'add_nodes',
      description: 'Add one or more nodes to a diagram file. Optionally run an automatic layout after insertion.',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute or relative path to the diagram file to modify'
          },
          layout: {
            type: 'object',
            description: 'Optional automatic layout configuration',
            properties: {
              algorithm: { type: 'string', enum: ['hierarchical','circle','organic','compact-tree','radial-tree','partition','stack'], description: 'Layout algorithm' },
              options: { type: 'object', description: 'Algorithm-specific options (e.g., { direction: "top-down" | "left-right" } for hierarchical)' }
            },
            required: ['algorithm']
          },
          nodes: {
            type: 'array',
            description: 'Array of nodes to add',
            items: {
              type: 'object',
              properties: {
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
              required: ['id', 'title', 'x', 'y', 'kind']
            }
          }
        },
        required: ['file_path', 'nodes']
      }
    }
  }

  async execute({ file_path, nodes, layout }) {
    if (!file_path || !nodes || !nodes.length) {
      throw new McpError(ErrorCode.InvalidParams, 'file_path and nodes are required');
    }

    const graph = await this.fileManager.loadGraphFromSvg(file_path);

    for (const node of nodes) {
      const { id, title, kind, parent, x, y, width, height } = node;

      graph.addNode({ 
        id, 
        title, 
        kind: Graph.normalizeKind(kind), 
        parent, 
        x: Number(x), 
        y: Number(y),
        ...(width && { width: Number(width) }),
        ...(height && { height: Number(height) })
      });
    }

    // TODO: Prefer a separate `layout_diagram` tool to decouple layout from add operations for better edge-aware reflow.
    if (layout) {
      if (!layout.algorithm) {
        throw new McpError(ErrorCode.InvalidParams, 'layout.algorithm is required when layout is provided');
      }
      try {
        graph.applyLayout(layout);
      } catch (e: any) {
        throw new McpError(ErrorCode.InvalidParams, e?.message || 'Invalid layout configuration');
      }
    }

    await this.fileManager.saveGraphToSvg(graph, file_path);
    
    return {
      content: [
        {
          type: 'text',
          text: `Nodes added to ${file_path}`,
        }
      ]
    };
  }
}