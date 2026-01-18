# Adobe MCP - Unified MCP Server for Adobe Creative Suite

Adobe MCP provides AI-powered automation for Adobe Creative Suite applications (Photoshop, Premiere Pro, Illustrator, and InDesign) through the Model Context Protocol (MCP). This enables AI assistants like Claude to control Adobe applications programmatically using natural language.

## Features

- **Multi-Application Support**: Control Photoshop, Premiere Pro, Illustrator, and InDesign
- **Natural Language Interface**: Use conversational commands to automate Adobe apps
- **Comprehensive API**: Access to layers, filters, text, selections, and more
- **Real-time Communication**: WebSocket-based proxy for instant command execution
- **Cross-Platform**: Works on Windows and macOS

## Architecture

The system uses a 3-tier architecture:

1. **MCP Servers** (Python) - Expose tools to AI/LLM clients
2. **Proxy Server** (Node.js) - WebSocket bridge between MCP and Adobe apps
3. **UXP Plugins** (JavaScript) - Execute commands within Adobe applications

## Optional: Workflow Skills

In addition to raw MCP tools, this project includes **optional Claude Code skills** that provide high-level workflow automation:

### adobe-indesign-assistant

Expert guide for InDesign document production. Orchestrates 22 InDesign MCP tools for:
- Book layout and manuscript formatting
- Text overflow detection and threading
- Style application and management
- Print-ready PDF export with validation

**Installation:**
```bash
ln -s $(pwd)/skills/adobe-indesign-assistant ~/.claude/skills/
```

**Usage:**
```
Format my 300-page manuscript for 6x9 print with chapter styles
```

See [skills/README.md](skills/README.md) for complete documentation.

### When to Use Skills vs Raw MCP Tools

- **Use Skills** - For common workflows with validation and error handling
- **Use Raw MCP Tools** - For custom automation and precise control

You can mix both approaches as needed.

## Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- Adobe Creative Suite applications (26.0+ for Photoshop, 25.3+ for Premiere)
- Adobe UXP Developer Tools

### Quick Install

1. Clone the repository:

```bash
git clone https://github.com/yourusername/adobe-mcp.git
cd adobe-mcp
```

2. Install Python dependencies:

```bash
pip install -e .
```

3. Install proxy server dependencies:

```bash
cd proxy-server
npm install
cd ..
```

4. Start the proxy server:

```bash
adobe-proxy
```

5. Install UXP plugins via Adobe UXP Developer Tools

## Usage

### Claude Desktop Configuration (Recommended)

Add to your Claude desktop configuration:

```json
{
  "mcpServers": {
    "adobe-photoshop": {
      "command": "adobe-photoshop"
    },
    "adobe-premiere": {
      "command": "adobe-premiere"
    },
    "adobe-illustrator": {
      "command": "adobe-illustrator"
    },
    "adobe-indesign": {
      "command": "adobe-indesign"
    }
  }
}
```

### Daily Usage Workflow

Each time you want to use Adobe MCP, follow these steps:

1. **Start the Proxy Server** (Required - leave running)
   ```bash
   adobe-proxy
   ```
   Keep this terminal window open. The proxy must be running for any Adobe MCP commands to work.

2. **Open Your Adobe Application** (e.g., Photoshop, Premiere Pro)

3. **Load the UXP Plugin** (Required once per Adobe app session)
   - Open Adobe UXP Developer Tools
   - Find the plugin in your list (if previously added) and click "Load"
   - If not added yet, see [UXP Plugin Installation](#uxp-plugin-installation) below
   - Note: You'll need to reload the plugin each time you restart the Adobe app

4. **Open Claude Desktop**
   - MCP servers start automatically when Claude Desktop launches
   - You should see the Adobe MCP tools available in Claude

5. **Start Creating!**
   - Use natural language to control your Adobe applications through Claude

**Pro Tip**: Keep the proxy server running in a background terminal to avoid restarting it each time.

### Manual MCP Server Startup (Advanced/Development)

For testing or development, you can start MCP servers manually instead of through Claude Desktop:

```bash
# Photoshop
adobe-photoshop

# Premiere Pro
adobe-premiere

# Illustrator
adobe-illustrator

# InDesign
adobe-indesign
```

Note: When using Claude Desktop, you don't need to start these manually - Claude Desktop starts them automatically based on your configuration.

### Example Prompts

- "Create a new Photoshop document with a blue gradient background"
- "Add a text layer saying 'Hello World' in 48pt Helvetica"
- "Apply a gaussian blur filter to the current layer"
- "Create a double exposure effect with two images"
- "Add cross-fade transitions between all clips in Premiere"

## UXP Plugin Installation

1. Launch Adobe UXP Developer Tools
2. Click "Add Plugin" and navigate to the appropriate plugin folder:
   - `uxp-plugins/photoshop` for Photoshop
   - `uxp-plugins/premiere` for Premiere Pro
   - `uxp-plugins/illustrator` for Illustrator
   - `uxp-plugins/indesign` for InDesign
3. Select the `manifest.json` file
4. Click "Load" to activate the plugin

## Development

### Project Structure

```
adobe-mcp/
├── adobe_mcp/           # Python MCP servers
│   ├── photoshop/      # Photoshop MCP server
│   ├── premiere/       # Premiere Pro MCP server
│   ├── illustrator/    # Illustrator MCP server
│   ├── indesign/       # InDesign MCP server
│   └── shared/         # Shared utilities
├── uxp-plugins/        # Adobe UXP plugins
│   ├── photoshop/      # Photoshop plugin
│   ├── premiere/       # Premiere plugin
│   ├── illustrator/    # Illustrator plugin
│   └── indesign/       # InDesign plugin
├── proxy-server/       # WebSocket proxy server
└── docs/              # Documentation
```

### Adding New Features

1. Add the API method to the appropriate MCP server
2. Implement the corresponding handler in the UXP plugin
3. Test the integration through the proxy server

## Troubleshooting

### Common Issues

- **"No Adobe tools available in Claude"**
  - Make sure the proxy server (`adobe-proxy`) is running
  - Verify the UXP plugin is loaded in your Adobe app
  - Check that your Claude Desktop configuration includes the Adobe MCP servers
  - Restart Claude Desktop after configuration changes

- **Plugin won't connect**
  - Ensure the proxy server is running: `adobe-proxy`
  - Verify it's running on port 3001 (check terminal output)
  - Check that the UXP plugin shows "Connected" status in its panel
  - Try reloading the UXP plugin in Adobe UXP Developer Tools

- **Commands fail or timeout**
  - Confirm the UXP plugin is loaded and showing as connected
  - Check the proxy server terminal for error messages
  - Verify the Adobe application is fully launched and responsive
  - Try restarting the proxy server

- **Port 3001 already in use**
  - Find and stop the process using port 3001
  - Or configure a different port in both the proxy server and MCP server configurations

- **MCP server errors**
  - Verify Python dependencies are installed: `pip install -e .`
  - Check that Python 3.10+ is installed
  - Look for error messages in Claude Desktop's MCP logs

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines.

## Acknowledgments

This project integrates work from multiple Adobe automation projects and contributors.
