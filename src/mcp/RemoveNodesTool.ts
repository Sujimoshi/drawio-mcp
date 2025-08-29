import { GraphFileManager } from "../GraphFileManager";
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { Tool } from "./McpServer";

export class RemoveNodesTool implements Tool {
  constructor(private fileManager = GraphFileManager.default) {}

  schema() {
    return {
      name: 'remove_nodes',
      description: 'Remove nodes or edges from a diagram file',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute or relative path to the diagram file to modify'
          },
          ids: { 
            type: 'array', 
            description: 'Array of node/edge IDs to remove', 
            items: { 
              type: 'string', 
              description: 'Node ID'
            } 
          }
        },
        required: ['file_path', 'ids']
      }
    }
  }

  async execute({ file_path, ids }) {
    if (!file_path || !ids) {
      throw new McpError(ErrorCode.InvalidParams, 'file_path and ids are required');
    }

    const graph = await this.fileManager.loadGraphFromSvg(file_path);

    graph.removeNodes(ids);

    await this.fileManager.saveGraphToSvg(graph, file_path);

    return {
      content: [
        {
          type: 'text',
          text: `Removed nodes: ${ids.join(', ')} from ${file_path}`,
        }
      ]
    };
  }
}