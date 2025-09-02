# Draw.io MCP Server

A Model Context Protocol (MCP) server that provides programmatic tools for creating and managing draw.io diagrams using mxgraph. Generate architecture diagrams, flowcharts, and other visualizations through a clean API that works with Claude Desktop and other MCP-compatible clients.

## Overview

This server enables you to build diagrams incrementally by providing stateless tools that operate on `.drawio.svg` files. Each operation specifies the target file, making it compatible with VSCode's draw.io extension while maintaining a clean separation between diagram state and server operations.

### Key Features

- **Stateless API**: Each tool call specifies the target file path
- **VSCode Compatible**: Generates `.drawio.svg` files that work seamlessly with VSCode draw.io extension
- **Rich Node Types**: Support for rectangles, ellipses, cylinders, clouds, actors, and more
- **Connection Management**: Create labeled connections with various styling options
- **Batch Operations**: Create, update, and link multiple nodes in a single MCP call for efficient diagram building
- **Flexible Positioning**: Precise control over node placement and sizing
- **MCP Integration**: Works with Claude Desktop and other MCP-compatible applications
- **TypeScript**: Full type safety and IntelliSense support

## Demo

![Demo](presentation.gif)

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

## Configuration

### MCP Client Setup

Add this configuration to your MCP client (e.g., Claude Desktop, Cursor):

```json
{
  "mcpServers": {
    "drawio-diagrams": {
      "command": "npx",
      "args": ["drawio-mcp"]
    }
  }
}
```

### File Paths

The server supports both absolute and relative file paths:

- **Absolute**: `/Users/username/project/diagrams/architecture.drawio.svg`
- **Relative**: `./diagrams/architecture.drawio.svg` (when cwd is configured)

All diagram files should use the `.drawio.svg` extension for proper VSCode integration.

## Tools Reference

### Batch Operations

All primary tools support batch operations, allowing you to perform multiple actions in a single MCP call for improved efficiency:

- **`add_nodes`**: Create multiple nodes simultaneously
- **`edit_nodes`**: Update multiple nodes/edges simultaneously  
- **`link_nodes`**: Create multiple connections simultaneously
- **`remove_nodes`**: Remove multiple nodes simultaneously

This approach reduces network overhead and provides atomic operations - either all changes succeed or none are applied.

---

### new_diagram

Create a new empty diagram file.

**Parameters:**
- `file_path` (string, required): Path for the new diagram file

**Example:**
```json
{
  "file_path": "./diagrams/system-architecture.drawio.svg"
}
```

### add_nodes

Add one or more nodes to an existing diagram in a single operation. Optionally run an automatic layout after insertion.

**Parameters:**
- `file_path` (string, required): Path to the diagram file
- `layout` (object, optional): Automatic layout configuration
  - `algorithm` (string, required if `layout` is provided): One of `hierarchical`, `circle`, `organic`, `compact-tree`, `radial-tree`, `partition`, `stack`
  - `options` (object, optional): Algorithm-specific options
    - For `hierarchical` only: `direction` ∈ `"top-down" | "left-right"` (default: `"top-down"`)
- `nodes` (array, required): Array of node objects to add, each containing:
  - `id` (string, required): Unique identifier for the node
  - `title` (string, required): Display label (supports newlines with `\n`)
  - `x` (number, required): X coordinate position
  - `y` (number, required): Y coordinate position
  - `kind` (string, required): Node shape type
  - `parent` (string, optional): Parent node ID (default: "root")
  - `width` (number, optional): Custom width
  - `height` (number, optional): Custom height

**Available Node Types:**
- `Rectangle`: Standard rectangular node
- `Ellipse`: Oval-shaped node  
- `Cylinder`: Database/storage representation
- `Cloud`: Cloud service representation
- `Square`: Square with fixed aspect ratio
- `Circle`: Circular node
- `Step`: Process step shape
- `Actor`: UML actor (stick figure)
- `Text`: Text-only node

**Example (Single Node):**
```json
{
  "file_path": "./diagrams/system-architecture.drawio.svg",
  "nodes": [
    {
      "id": "user-service",
      "title": "User Service\nAPI Layer",
      "kind": "Rectangle",
      "x": 100,
      "y": 150,
      "width": 120,
      "height": 80
    }
  ]
}
```

**Example (Multiple Nodes):**
```json
{
  "file_path": "./diagrams/system-architecture.drawio.svg",
  "nodes": [
    {
      "id": "user-service",
      "title": "User Service",
      "kind": "Rectangle",
      "x": 100,
      "y": 150
    },
    {
      "id": "database",
      "title": "Primary DB",
      "kind": "Cylinder", 
      "x": 300,
      "y": 150
    },
    {
      "id": "cache",
      "title": "Redis Cache",
      "kind": "Cylinder",
      "x": 200,
      "y": 300
    }
  ]
}
```

**Example (With Layout):**
```json
{
  "file_path": "./diagrams/system-architecture.drawio.svg",
  "layout": {
    "algorithm": "hierarchical",
    "options": { "direction": "left-right" }
  },
  "nodes": [
    { "id": "api", "title": "API", "kind": "Rectangle", "x": 40, "y": 40 },
    { "id": "service", "title": "Service", "kind": "Rectangle", "x": 200, "y": 40 },
    { "id": "db", "title": "DB", "kind": "Cylinder", "x": 360, "y": 40 }
  ]
}
```

Note: The layout runs once after all insertions and considers existing edges in the diagram file. For best results when edges are created or modified later, a dedicated `layout_diagram` tool is recommended (to be added).

### link_nodes

Create one or more connections between existing nodes in a single operation.

**Parameters:**
- `file_path` (string, required): Path to the diagram file
- `edges` (array, required): Array of edge objects to create, each containing:
  - `from` (string, required): Source node ID
  - `to` (string, required): Target node ID
  - `title` (string, optional): Connection label
  - `dashed` (boolean, optional): Whether to use dashed line style
  - `reverse` (boolean, optional): Whether to reverse arrow direction

**Example (Single Connection):**
```json
{
  "file_path": "./diagrams/system-architecture.drawio.svg",
  "edges": [
    {
      "from": "user-service",
      "to": "database",
      "title": "queries",
      "dashed": true
    }
  ]
}
```

**Example (Multiple Connections):**
```json
{
  "file_path": "./diagrams/system-architecture.drawio.svg",
  "edges": [
    {
      "from": "user-service",
      "to": "database",
      "title": "queries"
    },
    {
      "from": "user-service", 
      "to": "cache",
      "title": "cache lookup",
      "dashed": true
    },
    {
      "from": "database",
      "to": "cache", 
      "title": "invalidate",
      "reverse": true
    }
  ]
}
```

### edit_nodes

Modify properties of one or more existing nodes or edges in a single operation.

**Parameters:**
- `file_path` (string, required): Path to the diagram file
- `nodes` (array, required): Array of node/edge objects to update, each containing:
  - `id` (string, required): Node or edge ID to update
  - `title` (string, optional): New display label
  - `kind` (string, optional): New shape type (nodes only)
  - `x` (number, optional): New X coordinate (nodes only)
  - `y` (number, optional): New Y coordinate (nodes only)
  - `width` (number, optional): New width (nodes only)
  - `height` (number, optional): New height (nodes only)

**Example (Single Node):**
```json
{
  "file_path": "./diagrams/system-architecture.drawio.svg",
  "nodes": [
    {
      "id": "user-service",
      "title": "Updated User Service",
      "x": 200,
      "y": 100
    }
  ]
}
```

**Example (Multiple Nodes):**
```json
{
  "file_path": "./diagrams/system-architecture.drawio.svg",
  "nodes": [
    {
      "id": "user-service",
      "title": "Auth Service",
      "kind": "Rectangle",
      "x": 200,
      "y": 100
    },
    {
      "id": "database",
      "title": "Updated Database",
      "x": 400,
      "y": 200
    },
    {
      "id": "connection-1",
      "title": "secure connection"
    }
  ]
}
```

### remove_nodes

Remove one or more nodes from a diagram.

**Parameters:**
- `file_path` (string, required): Path to the diagram file
- `ids` (array, required): Array of node IDs to remove

**Example:**
```json
{
  "file_path": "./diagrams/system-architecture.drawio.svg",
  "ids": ["old-service", "deprecated-db"]
}
```

### get_diagram_info

Retrieve information about a diagram including nodes and connections.

**Parameters:**
- `file_path` (string, required): Path to the diagram file

**Example:**
```json
{
  "file_path": "./diagrams/system-architecture.drawio.svg"
}
```

## Output Format

Diagrams are saved as `.drawio.svg` files with embedded metadata:

- **SVG Format**: Clean vector graphics suitable for web and print
- **Draw.io Metadata**: Full diagram data embedded in SVG for editing
- **VSCode Compatible**: Open directly in VSCode with draw.io extension
- **Self-contained**: No external dependencies or additional files needed

## Development

### Project Structure

```
src/
├── Graph.ts              # Core graph data structure
├── GraphFileManager.ts   # File I/O operations  
├── Logger.ts            # Logging utilities
├── index.ts             # MCP server entry point
├── mcp/                 # MCP tool implementations
│   ├── McpServer.ts     # Server framework
│   ├── NewDiagramTool.ts
│   ├── AddNodeTool.ts   # Supports batch operations (add_nodes)
│   ├── LinkNodesTools.ts # Supports batch operations (link_nodes)
│   ├── EditNodeTool.ts  # Supports batch operations (edit_nodes)
│   ├── RemoveNodesTool.ts # Supports batch operations (remove_nodes)
│   └── GetDiagramInfoTool.ts
└── mxgraph/             # mxgraph integration
    ├── index.ts
    └── jsdom.ts
```

### Building From Source

```bash
# Install dependencies
npm install

# Run TypeScript compilation
npm run build

# Start development server
npm start

# Run linting
npm run lint
```

## Support

- Create an issue on GitHub for bugs and feature requests
- Check existing issues before creating new ones
- Provide detailed reproduction steps for bug reports
