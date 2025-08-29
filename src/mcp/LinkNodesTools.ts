import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { GraphFileManager } from "../GraphFileManager.js";
import { Tool } from './McpServer.js';

export class LinkNodesTool implements Tool {
  constructor(private fileManager = GraphFileManager.default) {}

  schema() {
    return {
      name: 'link_nodes',
      description: 'Create one or more connections between nodes in a diagram file',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute or relative path to the diagram file to modify'
          },
          edges: {
            type: 'array',
            description: 'Array of edges to create',
            items: {
              type: 'object',
              properties: {
                from: { type: 'string', description: 'Source node ID' },
                to: { type: 'string', description: 'Target node ID' },
                title: { type: 'string', description: 'Connection label (optional)' },
                dashed: { type: 'boolean', description: 'Whether the connection should be dashed' },
                reverse: { type: 'boolean', description: 'Whether to reverse the connection direction' }
              },
              required: ['from', 'to']
            }
          }
        },
        required: ['file_path', 'edges']
      }
    }
  }

  async execute({ file_path, edges }) {
    if (!file_path || !edges || !edges.length) {
      throw new McpError(ErrorCode.InvalidParams, 'file_path, from, and to are required');
    }

    const graph = await this.fileManager.loadGraphFromSvg(file_path);

    for (const edge of edges) {
      const { from, to, title, dashed, reverse } = edge;

      const style = {
        ...(dashed && { dashed: 1 }),
        ...(reverse && { reverse: true }),
      };
      
      graph.linkNodes({ from, to, title, style });
    }

    await this.fileManager.saveGraphToSvg(graph, file_path);
    
    return {
      content: [
        {
          type: 'text',
          text: `Linked nodes in ${file_path}`,
        }
      ]
    };
  }
}