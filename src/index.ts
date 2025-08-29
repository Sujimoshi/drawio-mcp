#!/usr/bin/env node

import { LinkNodesTool } from './mcp/LinkNodesTools';
import { GetDiagramInfoTool } from './mcp/GetDiagramInfoTool';
import { McpServer } from './mcp/McpServer';
import { NewDiagramTool } from './mcp/NewDiagramTool';
import { AddNodeTool } from './mcp/AddNodeTool';
import { Logger } from './Logger';
import { EditNodeTool } from './mcp/EditNodeTool';
import { RemoveNodesTool } from './mcp/RemoveNodesTool';

new McpServer({
  name: 'drawio-mcp-server',
  version: '1.0.0',
  tools: [
    new NewDiagramTool(),
    new AddNodeTool(),
    new LinkNodesTool(),
    new GetDiagramInfoTool(),
    new EditNodeTool(),
    new RemoveNodesTool(),
  ]
}).run().catch(error => {
  Logger.main.error('Failed to start MCP server', { error });
});