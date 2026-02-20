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
                height: { type: 'number', description: 'New node height, only appliable to nodes (optional)' },
                corner_radius: { type: 'integer', minimum: 1, description: 'Corner radius in pixels (≥1), applies to RoundedRectangle' },
                fillColor: { type: 'string', description: 'Background fill color (hex, e.g., "#dae8fc")' },
                strokeColor: { type: 'string', description: 'Border color (hex, e.g., "#6c8ebf")' },
                fontColor: { type: 'string', description: 'Text color (hex, e.g., "#333333")' },
                strokeWidth: { type: 'number', description: 'Border width in pixels' },
                fontSize: { type: 'number', description: 'Font size in pixels' },
                fontStyle: { type: 'integer', description: 'Font style bitmask: 1=bold, 2=italic, 4=underline (combinable, e.g., 3=bold+italic)' },
                fontFamily: { type: 'string', description: 'Font family name (e.g., "Helvetica")' },
                opacity: { type: 'number', minimum: 0, maximum: 100, description: 'Overall opacity (0=transparent, 100=opaque)' }
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
      const { id, title, kind, x, y, width, height, corner_radius, fillColor, strokeColor, fontColor, strokeWidth, fontSize, fontStyle, fontFamily, opacity } = node;
      
      graph.editNode({ id, title, kind: kind ? Graph.normalizeKind(kind) : undefined, x, y, width, height, ...(corner_radius && { corner_radius: Number(corner_radius) }), fillColor, strokeColor, fontColor, strokeWidth, fontSize, fontStyle, fontFamily, opacity });
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