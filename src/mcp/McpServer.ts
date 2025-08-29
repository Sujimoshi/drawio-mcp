// @ts-check

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { Logger } from '../Logger';

export interface Tool {
  schema: () => { name: string; description: string; inputSchema: object };
  execute: (args: any) => Promise<any>;
}

export interface McpServerConfig {
  tools: Tool[];
  name: string;
  version: string;
}

export class McpServer {
  tools: Tool[];
  server: Server;

  constructor({ tools, name, version }: McpServerConfig, public logger = new Logger('McpServer')) {
    this.tools = tools;
    this.server = new Server({
      name,
      version,
    }, {
      capabilities: {
        tools: {}
      }
    });
  }

  async run(transport: Transport = new StdioServerTransport()) {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools.map(tool => tool.schema())
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const tool = this.tools.find(tool => tool.schema().name === request.params.name);
  
        if (!tool) {
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }
  
        return tool.execute(request.params.arguments);
      } catch (error) {
        this.logger.error(`Failed to execute tool: ${error.message}`, { error });
        if (error instanceof McpError) throw error;
        throw new McpError(ErrorCode.InternalError, `Failed to execute tool: ${error.message}`);
      }
    });

    await this.server.connect(transport);
  }
}