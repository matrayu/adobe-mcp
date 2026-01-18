# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Adobe MCP is a unified MCP (Model Context Protocol) server system that enables AI assistants to programmatically control Adobe Creative Suite applications (Photoshop, Premiere Pro, Illustrator, and InDesign) using natural language commands.

## Architecture

The system uses a 3-tier architecture:

1. **MCP Servers** (Python/FastMCP) - Located in `adobe_mcp/{app}/server.py`
   - Expose tools to AI/LLM clients via the Model Context Protocol
   - Each application has its own dedicated server (photoshop, premiere, illustrator, indesign)
   - Servers communicate with UXP plugins via WebSocket through the proxy

2. **Proxy Server** (Node.js/Socket.io) - Located in `proxy-server/`
   - WebSocket bridge between MCP servers and UXP plugins
   - Runs on port 3001 by default
   - Handles bidirectional communication and connection management

3. **UXP Plugins** (JavaScript) - Located in `uxp-plugins/{app}/`
   - Execute actual commands within Adobe applications
   - Connect to proxy via Socket.io
   - Each plugin has a `commands/` directory with command handlers
   - Must be loaded via Adobe UXP Developer Tools

## Development Setup

### Installation

```bash
# Install Python package and dependencies
pip install -e .

# Install proxy server dependencies
cd proxy-server
npm install
cd ..
```

### Running Components

```bash
# Start the proxy server (MUST be running first)
adobe-proxy

# Start individual MCP servers (in separate terminals)
adobe-photoshop
adobe-premiere
adobe-illustrator
adobe-indesign
```

### UXP Plugin Installation

1. Open Adobe UXP Developer Tools
2. Click "Add Plugin" and navigate to `uxp-plugins/{app}/`
3. Select the `manifest.json` file
4. Click "Load" to activate the plugin

**Important**: Plugins must be manually loaded after each Adobe application restart.

## Testing

```bash
# Run tests (currently only Illustrator has tests)
pytest tests/test_illustrator.py

# Run with verbose output
pytest tests/test_illustrator.py -v

# Run specific test
pytest tests/test_illustrator.py::test_name
```

## Code Architecture

### Shared Utilities (`adobe_mcp/shared/`)

- `core.py` - Core command creation and sending logic
- `socket_client.py` - WebSocket client for proxy communication
- `logger.py` - Logging utilities
- `fonts.py` - Font enumeration utilities

All MCP servers import from shared to:
- Initialize connection: `init(APPLICATION, socket_client)`
- Create commands: `createCommand(action, options)`
- Send commands: `sendCommand(command)`

### MCP Server Pattern

Each application server follows this pattern:

```python
from mcp.server.fastmcp import FastMCP
from ..shared import init, sendCommand, createCommand, socket_client

APPLICATION = "photoshop"  # or premiere, illustrator, indesign
PROXY_URL = 'http://localhost:3001'
PROXY_TIMEOUT = 20

# Configure socket client
socket_client.configure(app=APPLICATION, url=PROXY_URL, timeout=PROXY_TIMEOUT)
init(APPLICATION, socket_client)

# Define MCP tools using @mcp.tool() decorator
@mcp.tool()
def tool_name(param: type) -> type:
    """Tool description"""
    command = createCommand("commandAction", {"key": param})
    return sendCommand(command)
```

### Command Flow

1. MCP server creates command dict: `{"application": "photoshop", "action": "createLayer", "options": {...}}`
2. Command sent via WebSocket to proxy server
3. Proxy routes to appropriate UXP plugin via Socket.io
4. UXP plugin executes command in Adobe app
5. Response flows back through proxy to MCP server

## Platform-Specific Considerations

### Windows

- User documents folder: `C:\Users\{username}\Documents\`
- PowerShell scripts provided for Windows compatibility
- Use `install-windows.ps1` and `start-windows.ps1` for setup

### macOS

- User documents folder: `/Users/{username}/Documents/`
- Bash scripts work natively
- No special considerations needed

## Adding New Features

### Adding a New Tool to an Existing MCP Server

1. Add tool decorator and function to `adobe_mcp/{app}/server.py`
2. Create command handler in `uxp-plugins/{app}/commands/{action}.js`
3. Register handler in UXP plugin's main.js command dispatcher
4. Test the integration

### Adding Support for a New Adobe Application

1. Create directory: `adobe_mcp/{app}/`
2. Create `__init__.py`, `__main__.py`, and `server.py` (follow existing pattern)
3. Add entry point to `pyproject.toml` under `[project.scripts]`
4. Create UXP plugin directory: `uxp-plugins/{app}/`
5. Create `manifest.json` with app-specific host requirements
6. Implement command handlers in `commands/` directory

## Common Development Commands

```bash
# Lint Python code
ruff adobe_mcp/

# Format Python code
black adobe_mcp/

# Type check Python code
mypy adobe_mcp/

# Install dev dependencies
pip install -e ".[dev]"
```

## Debugging

### Connection Issues

- Verify proxy server is running on port 3001
- Check UXP plugin is loaded in Adobe app
- Look for connection status in UXP plugin panel
- Check browser console in UXP Developer Tools

### Command Failures

- Check response status in MCP server logs
- Use `logger.log()` in shared utilities for debugging
- Inspect command format being sent to proxy
- Verify command handler exists in UXP plugin

### Port Conflicts

If port 3001 is already in use:
1. Find and kill the process using the port
2. Or modify `PROXY_URL` in MCP servers to use different port
3. Update proxy server port in `proxy-server/proxy.js`

## Known Limitations

### InDesign: Frame Persistence with Facing Pages

**CRITICAL:** Always use `facing_pages=False` for programmatic frame creation.

**Issue:** InDesign UXP API `page.textFrames.add()` fails silently on even-numbered pages when facing pages mode is enabled.

**Symptoms:**
- Frames work on pages 0, 1, 3, 5, 7, 9, 11 (page 0 + odd pages)
- Frames disappear immediately on pages 2, 4, 6, 8, 10 (even pages)
- Console shows: "Page 2: 0 frames before → 0 frames after"
- No error thrown - silent failure

**Root Cause:**
- Primary Text Frame (PTF) feature conflicts with programmatic frame creation
- InDesign garbage collects frames that don't match PTF pattern
- UXP API bug specific to facing pages + even page combination

**Required Workaround:**
```python
# ALWAYS create with facing_pages=False
create_document(
    width=432, height=648, pages=12,
    facing_pages=False,  # ← REQUIRED
    margins={"top": 54, "bottom": 54, "left": 54, "right": 54}
)

# Then frames work on ALL pages
create_threaded_frames(start_page=0, end_page=11)
```

**To Enable Facing Pages Display (After Content Complete):**
1. Create document with `facing_pages=False`
2. Create frames and add content programmatically
3. Save document
4. Manually enable in InDesign: File → Document Setup → Check "Facing Pages"

**Bug Fix History:**
- 2026-01-17 (f7eef95): Fixed parameter name mismatch (`pagesFacing` → `facingPages`)
- Parameter now correctly applied, but facing pages mode still causes frame issues
- Recommendation: Avoid facing_pages=True for programmatic workflows

## Key Files

- `pyproject.toml` - Python package configuration and dependencies
- `proxy-server/proxy.js` - WebSocket proxy implementation
- `adobe_mcp/shared/socket_client.py` - Socket.io client implementation
- `uxp-plugins/{app}/main.js` - UXP plugin entry point and command dispatcher
- `uxp-plugins/{app}/manifest.json` - UXP plugin metadata and permissions
