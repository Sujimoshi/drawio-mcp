import { GraphFileManager } from "../GraphFileManager";
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { Tool } from "./McpServer";

export class GetDiagramInfoTool implements Tool {
  constructor(private fileManager = GraphFileManager.default) {}

  schema() {
    return {
      name: 'get_diagram_info',
      description: 'Get xml representation of a diagram file',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute or relative path to the diagram file to inspect'
          }
        },
        required: ['file_path']
      }
    }
  }

  async execute({ file_path }) {
    if (!file_path) {
      throw new McpError(ErrorCode.InvalidParams, 'file_path is required');
    }
    
    const graph = await this.fileManager.loadGraphFromSvg(file_path);

    return {
      content: [
        {
          type: 'text',
          text: `Graph xml representation: \n${graph.toXML()}`
        }
      ]
    };
  }
}