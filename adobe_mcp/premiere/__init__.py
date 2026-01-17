"""Adobe Premiere Pro MCP Server."""

from .server import mcp

def main():
    """Entry point for Premiere MCP server."""
    mcp.run(transport='stdio')

__all__ = ["mcp", "main"]