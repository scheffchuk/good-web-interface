# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js MCP (Model Context Protocol) server that provides **Web Interface Guidelines** based on https://interfaces.rauno.me/. The server uses the `mcp-handler` package to create MCP-compatible endpoints that help developers follow best practices for web interface design.

### Key Features

- **Real-time Documentation**: Fetches updated guidelines from GitHub repository and website
- **Categorized Guidelines**: Organized by interactivity, typography, motion, touch, accessibility, performance, and design
- **Search Functionality**: Search guidelines by keywords
- **Pattern Validation**: Validate interface patterns against established guidelines
- **Quick Tips**: Scenario-based tips for common interface challenges

## Development Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server

Package manager: `pnpm` (version 8.15.7+)

## Testing

- Test the MCP server: `node scripts/test-client.mjs [URL]`
- Default test URL: `https://mcp-for-next-js.vercel.app`
- Example: `node scripts/test-client.mjs https://mcp-for-next-js.vercel.app`

## Architecture

### Core Components

- **MCP Handler**: Located in `app/mcp/route.ts` - defines the MCP server with tools, prompts, and resources
- **Transport Support**: Both HTTP and SSE (Server-Sent Events) transports available
- **Tool System**: Uses Zod for schema validation of tool parameters

### Available MCP Tools

1. **get_guidelines** - Get guidelines by category (interactivity, typography, motion, touch, accessibility, performance, design, or all)
2. **search_guidelines** - Search for specific guidelines by keyword
3. **validate_pattern** - Validate interface patterns against guidelines
4. **get_updated_docs** - Fetch latest documentation from GitHub or website
5. **get_quick_tips** - Get scenario-based tips (forms, buttons, animations, mobile, accessibility, performance)

### Key Files

- `app/mcp/route.ts` - Main MCP server with 5 interface guideline tools
- `scripts/test-client.mjs` - SSE client for testing MCP functionality
- `scripts/test-streamable-http-client.mjs` - HTTP client for testing

### MCP Server Configuration

The MCP server is configured with:
- Base path: "" (root)
- Verbose logging enabled
- Max duration: 60 seconds
- SSE disabled by default (`disableSse: true`)
- Fetches live data from GitHub: `https://raw.githubusercontent.com/raunofreiberg/interfaces/main/README.md`
- Fetches live data from website: `https://interfaces.rauno.me/`

### Example Usage

```bash
# Test tools listing
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'

# Get accessibility guidelines
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "get_guidelines", "arguments": {"category": "accessibility"}}, "id": 2}'

# Search for animation-related guidelines
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "search_guidelines", "arguments": {"query": "animation"}}, "id": 3}'
```

## Deployment Notes

For Vercel deployment:
- Enable Fluid compute for efficient execution
- Adjust `maxDuration` to 800 for Pro/Enterprise accounts
- SSE transport requires Redis attachment