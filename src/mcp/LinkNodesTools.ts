import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { GraphFileManager } from "../GraphFileManager.js";
import { Tool } from './McpServer.js';

export class LinkNodesTool implements Tool {
  constructor(private fileManager = GraphFileManager.default) {}

  schema() {
    return {
      name: 'link_nodes',
      description: 'Create a connection between two nodes in a diagram file',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute or relative path to the diagram file to modify'
          },
          from: { type: 'string', description: 'Source node ID' },
          to: { type: 'string', description: 'Target node ID' },
          title: { type: 'string', description: 'Connection label (optional)' },
          dashed: { type: 'boolean', description: 'Whether the connection should be dashed' },
          reverse: { type: 'boolean', description: 'Whether to reverse the connection direction' }
        },
        required: ['file_path', 'from', 'to']
      }
    }
  }

  async execute({ file_path, from, to, title, dashed, reverse }) {
    if (!file_path || !from || !to) {
      throw new McpError(ErrorCode.InvalidParams, 'file_path, from, and to are required');
    }

    const graph = await this.fileManager.loadGraphFromSvg(file_path);

    const style = {
      ...(dashed && { dashed: 1 }),
      ...(reverse && { reverse: true }),
    };

    const id = graph.linkNodes({
      from,
      to,
      ...(title && { title }),
      ...(Object.keys(style).length > 0 && { style })
    });

    await this.fileManager.saveGraphToSvg(graph, file_path);
    
    return {
      content: [
        {
          type: 'text',
          text: `Linked nodes: ${from} -> ${to} with id [${id}] ${title ? ` (${title})` : ''} in ${file_path}`,
        }
      ]
    };
  }
}