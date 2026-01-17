"""Adobe Photoshop MCP Server."""

from .server import mcp

def main():
    """Entry point for Photoshop MCP server."""
    mcp.run(transport='stdio')

__all__ = ["mcp", "main"]