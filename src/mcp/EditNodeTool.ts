import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { GraphFileManager } from "../GraphFileManager.js";
import { Tool } from "./McpServer.js";
import { Graph } from "../Graph.js";

export class EditNodeTool implements Tool {
  constructor(private fileManager = GraphFileManager.default) {}

  schema() {
    return {
      name: 'edit_nodes',
      description: 'Edit one or more nodes or edges in a diagram file',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute or relative path to the diagram file to modify'
          },
          nodes: {
            type: 'array',
            description: 'Array of nodes to edit',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Unique identifier of the node or edge to update' },
                title: { type: 'string', description: 'Display label for the node or edge to update (can contain newlines "\n") (optional)' },
                kind: {
                  type: 'string',
                  enum: Object.keys(Graph.Kinds),
                  description: 'Shape/kind of the node for edit, only appliable to nodes (optional)'
                },
                x: { type: 'number', description: 'New node X coordinate, only appliable to nodes (optional)' },
                y: { type: 'number', description: 'New node Y coordinate, only appliable to nodes (optional)' },
                width: { type: 'number', description: 'New node width, only appliable to nodes (optional)' },
                height: { type: 'number', description: 'New node height, only appliable to nodes (optional)' }
              },
              required: ['id']
            }
          }
        },
        required: ['file_path', 'nodes']
      }
    }
  }

  async execute({ file_path, nodes }) {
    if (!file_path || !nodes || !nodes.length) {
      throw new McpError(ErrorCode.InvalidParams, 'file_path and nodes are required');
    }

    const graph = await this.fileManager.loadGraphFromSvg(file_path);

    for (const node of nodes) {
      const { id, title, kind, x, y, width, height } = node;
      
      graph.editNode({ id, title, kind, x, y, width, height });
    }

    await this.fileManager.saveGraphToSvg(graph, file_path);

    return {
      content: [
        {
          type: 'text',
          text: `Nodes edited in ${file_path}`,
        }
      ]
    };
  }
}