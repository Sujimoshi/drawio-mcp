import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types";
import { GraphFileManager } from "../GraphFileManager";
import { Tool } from "./McpServer";
import { Graph } from "../Graph";

export class EditNodeTool implements Tool {
  constructor(private fileManager = GraphFileManager.default) {}

  schema() {
    return {
      name: 'edit_node',
      description: 'Edit node or edge in a diagram file',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute or relative path to the diagram file to modify'
          },
          id: { type: 'string', description: 'Unique identifier of the node or edge to update' },
          title: { type: 'string', description: 'Display label for the node or edge to update (can contain newlines "\n")' },
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
        required: ['file_path', 'id']
      }
    }
  }

  async execute({ file_path, id, title, kind, x, y, width, height }) {
    if (!file_path || !id) {
      throw new McpError(ErrorCode.InvalidParams, 'file_path, id are required');
    }

    const graph = await this.fileManager.loadGraphFromSvg(file_path);
    
    graph.editNode({ id, title, kind, x, y, width, height });
    
    await this.fileManager.saveGraphToSvg(graph, file_path);

    return {
      content: [
        {
          type: 'text',
          text: `Edited node: ${id} (${title}) in ${file_path}`,
        }
      ]
    };
  }
}