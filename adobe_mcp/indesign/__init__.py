"""Adobe InDesign MCP Server."""

from .server import mcp

def main():
    """Entry point for InDesign MCP server."""
    mcp.run(transport='stdio')

__all__ = ["mcp", "main"]