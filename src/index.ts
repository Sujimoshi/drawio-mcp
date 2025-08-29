#!/usr/bin/env node

import { LinkNodesTool } from './mcp/LinkNodesTools.js';
import { GetDiagramInfoTool } from './mcp/GetDiagramInfoTool.js';
import { McpServer } from './mcp/McpServer.js';
import { NewDiagramTool } from './mcp/NewDiagramTool.js';
import { AddNodeTool } from './mcp/AddNodeTool.js';
import { Logger } from './Logger.js';
import { EditNodeTool } from './mcp/EditNodeTool.js';
import { RemoveNodesTool } from './mcp/RemoveNodesTool.js';

new McpServer({
  name: 'drawio-mcp',
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