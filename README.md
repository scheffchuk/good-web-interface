# Web Interface Guidelines MCP Server

An MCP (Model Context Protocol) server that provides web interface design guidelines and best practices based on [interfaces.rauno.me](https://interfaces.rauno.me/).

## What it does

This server helps developers follow web interface best practices by providing:

- **Interface Guidelines** - Get guidelines by category (typography, accessibility, performance, etc.)
- **Search Functionality** - Find specific guidelines by keyword
- **Pattern Validation** - Validate interface patterns against best practices
- **Live Documentation** - Fetch the latest guidelines from GitHub
- **Quick Tips** - Get scenario-based tips for common interface challenges

## Available Tools

1. `get_guidelines` - Get guidelines by category or all
2. `search_guidelines` - Search guidelines by keyword
3. `validate_pattern` - Validate interface patterns
4. `get_updated_docs` - Fetch latest documentation from GitHub
5. `get_quick_tips` - Get tips for forms, buttons, animations, etc.

## Usage

```bash
# Start the server
pnpm dev

# Test with curl
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

Built with Next.js and the `mcp-handler` package.
