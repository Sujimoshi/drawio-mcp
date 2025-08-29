import { GraphFileManager } from '../GraphFileManager';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { Graph } from '../Graph';
import { Tool } from './McpServer';

export class NewDiagramTool implements Tool {
  constructor(private fileManager = GraphFileManager.default) {}

  schema() {
    return {
      name: 'new_diagram',
      description: 'Create a new empty diagram file',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute or relative path for the diagram file (should end with .drawio.svg)'
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

    await this.fileManager.saveGraphToSvg(new Graph(), file_path);
    
    return {
      content: [
        {
          type: 'text',
          text: `Created new diagram: ${file_path}`,
        }
      ]
    };
  }
}