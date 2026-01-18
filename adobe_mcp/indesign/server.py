# MIT License
#
# Copyright (c) 2025 Mike Chambers
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

from mcp.server.fastmcp import FastMCP
from ..shared import init, sendCommand, createCommand, socket_client
import sys

#logger.log(f"Python path: {sys.executable}")
#logger.log(f"PYTHONPATH: {os.environ.get('PYTHONPATH')}")
#logger.log(f"Current working directory: {os.getcwd()}")
#logger.log(f"Sys.path: {sys.path}")


# Create an MCP server
mcp_name = "Adobe InDesign MCP Server"
mcp = FastMCP(mcp_name, log_level="ERROR")
print(f"{mcp_name} running on stdio", file=sys.stderr)

APPLICATION = "indesign"
PROXY_URL = 'http://localhost:3001'
PROXY_TIMEOUT = 20

socket_client.configure(
    app=APPLICATION, 
    url=PROXY_URL,
    timeout=PROXY_TIMEOUT
)

init(APPLICATION, socket_client)

@mcp.tool()
def create_document(
    width:int, height:int, pages:int = 0,
    facing_pages:bool = False,
    columns:dict = {"count":1, "gutter":12},
    margins:dict = {"top":36, "bottom":36, "left":36, "right":36}):
    """
    Creates a new InDesign document.

    WARNING: facing_pages=True may cause frame persistence issues on even-numbered pages
    due to Primary Text Frame auto-creation. For programmatic frame creation,
    use facing_pages=False.

    Args:
        width: Page width in pixels/points
        height: Page height in pixels/points
        pages: Number of pages to create
        facing_pages: Enable facing pages mode (use False for programmatic control)
        columns: Column configuration dict
        margins: Margin configuration dict
    """

    command = createCommand("createDocument", {
        "intent":"WEB_INTENT",
        "pageWidth":width,
        "pageHeight":height,
        "margins":margins,
        "columns":columns,
        "pagesPerDocument":pages,
        "facingPages":facing_pages  # Fixed: was pagesFacing, must be facingPages
    })

    return sendCommand(command)

@mcp.tool()
def get_text_frames(page_index: int = 0):
    """
    Discover all text frames on a specific page.

    Returns list of frames with their properties including bounds, content status,
    overflow status, and linking information. Frame indices are page-specific.

    Args:
        page_index: Page index (0-based)

    Returns:
        Dict with status and list of frame info dicts
    """
    command = createCommand("getTextFrames", {
        "pageIndex": page_index
    })
    return sendCommand(command)

@mcp.tool()
def get_text_frame_info(text_frame_index: int, page_index: int = 0):
    """
    Get detailed information about a specific text frame.

    Provides comprehensive frame details including bounds, content length,
    overflow status, linking information, and parent story length.

    Args:
        text_frame_index: Frame index on the page (0-based, page-specific)
        page_index: Page index (0-based)

    Returns:
        Dict with detailed frame information
    """
    command = createCommand("getTextFrameInfo", {
        "frameIndex": text_frame_index,
        "pageIndex": page_index
    })
    return sendCommand(command)

# Document Operations
@mcp.tool()
def open_document(file_path: str):
    """
    Opens an InDesign document (.indd) or template (.indt) file.

    Args:
        file_path: Absolute path to the InDesign file

    Returns:
        Dict with document info including name, page count, dimensions, etc.
    """
    command = createCommand("openDocument", {
        "filePath": file_path
    })
    return sendCommand(command)

@mcp.tool()
def save_document():
    """
    Saves the active InDesign document.

    Returns:
        Dict with save status and file path
    """
    command = createCommand("saveDocument", {})
    return sendCommand(command)

@mcp.tool()
def save_document_as(file_path: str):
    """
    Saves the active document to a specified path.

    Args:
        file_path: Absolute path for the saved file

    Returns:
        Dict with save status, file path, and file size
    """
    command = createCommand("saveDocumentAs", {
        "filePath": file_path
    })
    return sendCommand(command)

@mcp.tool()
def close_document(save_options: str = "yes"):
    """
    Closes the active InDesign document.

    Args:
        save_options: Save options - "yes", "no", or "ask"

    Returns:
        Dict with close status
    """
    command = createCommand("closeDocument", {
        "saveOptions": save_options
    })
    return sendCommand(command)

@mcp.tool()
def get_document_info():
    """
    Returns comprehensive information about the active document.

    Returns:
        Dict with document properties including page count, dimensions,
        margins, facing pages status, file path, save status, etc.
    """
    command = createCommand("getDocumentInfo", {})
    return sendCommand(command)

# Text Operations
@mcp.tool()
def create_text_frame(page_index: int = 0, geometric_bounds: list = [72, 72, 500, 400]):
    """
    Creates a text frame on a specified page.

    Args:
        page_index: Page index (0-based)
        geometric_bounds: Frame bounds [top, left, bottom, right] in points from page origin

    Returns:
        Dict with frame index, page index, and bounds
    """
    command = createCommand("createTextFrame", {
        "pageIndex": page_index,
        "geometricBounds": geometric_bounds
    })
    return sendCommand(command)

@mcp.tool()
def insert_text(text_frame_index: int, text: str, page_index: int = 0):
    """
    Inserts text content into a specified text frame.

    Args:
        text_frame_index: Frame index on the page (0-based, page-specific)
        text: Text content to insert
        page_index: Page index (0-based)

    Returns:
        Dict with insertion status and overflow information
    """
    command = createCommand("insertText", {
        "frameIndex": text_frame_index,
        "text": text,
        "pageIndex": page_index
    })
    return sendCommand(command)

@mcp.tool()
def import_text_file(text_frame_index: int, file_path: str, page_index: int = 0, insertion_point: int = -1):
    """
    Imports a text file into a text frame.

    Args:
        text_frame_index: Frame index on the page (0-based, page-specific)
        file_path: Absolute path to text file (.txt, .docx, .rtf)
        page_index: Page index (0-based)
        insertion_point: Where to insert (-1 = end, 0 = start, n = after nth character)

    Returns:
        Dict with import status and overflow information
    """
    command = createCommand("importTextFile", {
        "frameIndex": text_frame_index,
        "filePath": file_path,
        "pageIndex": page_index,
        "insertionPoint": insertion_point
    })
    return sendCommand(command)

@mcp.tool()
def remove_duplicate_frames():
    """
    Removes duplicate and empty text frames caused by Primary Text Frame conflicts.

    In facing pages mode, InDesign may create duplicate frames on pages.
    This tool identifies and removes:
    - Empty frames (no content)
    - Duplicate frames (same position as other frames on same page)
    - Master page frame duplicates

    Returns:
        Dict with removal status and count of frames removed per page
    """
    command = createCommand("removeDuplicateFrames", {})
    return sendCommand(command)

@mcp.tool()
def create_threaded_frames(start_page: int, end_page: int, geometric_bounds: list = [54, 54, 594, 378]):
    """
    Creates text frames on multiple pages and links them atomically.

    This is the recommended method for multi-page documents as it creates
    and links frames in a single operation, preventing frame loss between operations.

    Args:
        start_page: Starting page index (0-based)
        end_page: Ending page index (inclusive)
        geometric_bounds: Frame bounds [top, left, bottom, right] in points

    Returns:
        Dict with created frames and linking status
    """
    command = createCommand("createThreadedFrames", {
        "startPage": start_page,
        "endPage": end_page,
        "geometricBounds": geometric_bounds
    })
    return sendCommand(command)

@mcp.tool()
def link_text_frames(source_frame_index: int, target_frame_index: int, source_page_index: int = 0, target_page_index: int = 0):
    """
    Links two text frames for text flow (threading).

    Frames can be on different pages. Text will flow from source to target when source overflows.

    Args:
        source_frame_index: Source frame index (page-specific)
        target_frame_index: Target frame index (page-specific)
        source_page_index: Source frame's page index
        target_page_index: Target frame's page index

    Returns:
        Dict with link status
    """
    command = createCommand("linkTextFrames", {
        "sourceFrameIndex": source_frame_index,
        "targetFrameIndex": target_frame_index,
        "sourcePageIndex": source_page_index,
        "targetPageIndex": target_page_index
    })
    return sendCommand(command)

@mcp.tool()
def get_text_content(text_frame_index: int, page_index: int = 0):
    """
    Retrieves text content from a frame for verification.

    Args:
        text_frame_index: Frame index on the page (0-based, page-specific)
        page_index: Page index (0-based)

    Returns:
        Dict with text content, character count, and paragraph count
    """
    command = createCommand("getTextContent", {
        "frameIndex": text_frame_index,
        "pageIndex": page_index
    })
    return sendCommand(command)

@mcp.tool()
def detect_text_overflow(text_frame_index: int, page_index: int = 0):
    """
    Detects text overflow in a frame to prevent content loss.

    Args:
        text_frame_index: Frame index on the page (0-based, page-specific)
        page_index: Page index (0-based)

    Returns:
        Dict with overflow status, character count, and suggestions
    """
    command = createCommand("detectTextOverflow", {
        "frameIndex": text_frame_index,
        "pageIndex": page_index
    })
    return sendCommand(command)

# Style Operations
@mcp.tool()
def get_paragraph_styles():
    """
    Returns list of available paragraph styles in the document.

    Returns:
        Dict with list of paragraph style names and properties
    """
    command = createCommand("getParagraphStyles", {})
    return sendCommand(command)

@mcp.tool()
def get_character_styles():
    """
    Returns list of available character styles in the document.

    Returns:
        Dict with list of character style names
    """
    command = createCommand("getCharacterStyles", {})
    return sendCommand(command)

@mcp.tool()
def apply_paragraph_style(style_name: str, text_frame_index: int, paragraph_range: str = "all", page_index: int = 0):
    """
    Applies a paragraph style to specified paragraphs in a text frame.

    Args:
        style_name: Name of the paragraph style (case-sensitive)
        text_frame_index: Frame index on the page (0-based, page-specific)
        paragraph_range: Range to apply - "all", "first", "last", "0", "0-5", etc.
        page_index: Page index (0-based)

    Returns:
        Dict with application status and paragraphs affected
    """
    command = createCommand("applyParagraphStyle", {
        "styleName": style_name,
        "frameIndex": text_frame_index,
        "paragraphRange": paragraph_range,
        "pageIndex": page_index
    })
    return sendCommand(command)

@mcp.tool()
def apply_character_style_to_text(style_name: str, search_text: str, text_frame_index: int, occurrence: int = 0, page_index: int = 0):
    """
    Applies a character style to text found by searching (not index-based).

    Searches for text within the frame and applies character style to matches.

    Args:
        style_name: Name of the character style (case-sensitive)
        search_text: Text to search for and style
        text_frame_index: Frame index on the page (0-based, page-specific)
        occurrence: Which occurrence to style (0 = all, 1 = first, 2 = second, etc.)
        page_index: Page index (0-based)

    Returns:
        Dict with application status, occurrences found, and occurrences styled
    """
    command = createCommand("applyCharacterStyleToText", {
        "styleName": style_name,
        "searchText": search_text,
        "frameIndex": text_frame_index,
        "occurrence": occurrence,
        "pageIndex": page_index
    })
    return sendCommand(command)

@mcp.tool()
def create_paragraph_style(style_name: str, properties: dict):
    """
    Creates a new paragraph style with specified properties.

    Args:
        style_name: Name for the new style
        properties: Style properties dict (font, size, leading, color, etc.)

    Returns:
        Dict with creation status and properties applied
    """
    command = createCommand("createParagraphStyle", {
        "styleName": style_name,
        "properties": properties
    })
    return sendCommand(command)

# Page Operations
@mcp.tool()
def add_page(location: str = "AT_END", reference_page: int = None):
    """
    Adds a new page to the document.

    Args:
        location: Where to add - "AT_BEGINNING", "AT_END", "AFTER", "BEFORE"
        reference_page: Reference page index (required for AFTER/BEFORE)

    Returns:
        Dict with new page index and total page count
    """
    command = createCommand("addPage", {
        "location": location,
        "referencePage": reference_page
    })
    return sendCommand(command)

# Image Operations
@mcp.tool()
def place_image(file_path: str, page_index: int = 0, position: list = None, fit_option: str = "PROPORTIONALLY"):
    """
    Places an image on a page with optional positioning and fit options.

    Args:
        file_path: Absolute path to image file
        page_index: Page index (0-based)
        position: [x, y] position in points from page origin (None = current position)
        fit_option: Fit method - "PROPORTIONALLY", "FILL_PROPORTIONALLY",
                    "FIT_CONTENT_TO_FRAME", "FIT_FRAME_TO_CONTENT"

    Returns:
        Dict with placement status, frame index, position, and dimensions
    """
    command = createCommand("placeImage", {
        "filePath": file_path,
        "pageIndex": page_index,
        "position": position,
        "fitOption": fit_option
    })
    return sendCommand(command)

# PDF Export Operations
@mcp.tool()
def get_pdf_export_presets():
    """
    Returns list of available PDF export presets.

    Returns:
        Dict with list of preset names and default preset
    """
    command = createCommand("getPdfExportPresets", {})
    return sendCommand(command)

@mcp.tool()
def export_pdf(file_path: str, page_range: str = "ALL", preset_name: str = "[High Quality Print]"):
    """
    Exports document to PDF with specified preset and page range.

    Args:
        file_path: Absolute path for the PDF file
        page_range: Pages to export - "ALL", "1-5", "1,3,5", etc.
        preset_name: PDF export preset name

    Returns:
        Dict with export status, file size, pages exported, preset used
    """
    command = createCommand("exportPdf", {
        "filePath": file_path,
        "pageRange": page_range,
        "presetName": preset_name
    })
    return sendCommand(command)

@mcp.resource("config://get_instructions")
def get_instructions() -> str:
    """Read this first! Returns information and instructions on how to use Photoshop and this API"""

    return f"""
    You are an InDesign and design expert who is creative and loves to help other people learn to use InDesign and create.

    Rules to follow:

    1. Think deeply about how to solve the task
    2. Always check your work
    3. Read the info for the API calls to make sure you understand the requirements and arguments
    """


"""
BLEND_MODES = [
    "COLOR",
    "COLORBURN",
    "COLORDODGE",
    "DARKEN",
    "DARKERCOLOR",
    "DIFFERENCE",
    "DISSOLVE",
    "EXCLUSION",
    "HARDLIGHT",
    "HARDMIX",
    "HUE",
    "LIGHTEN",
    "LIGHTERCOLOR",
    "LINEARBURN",
    "LINEARDODGE",
    "LINEARLIGHT",
    "LUMINOSITY",
    "MULTIPLY",
    "NORMAL",
    "OVERLAY",
    "PINLIGHT",
    "SATURATION",
    "SCREEN",
    "SOFTLIGHT",
    "VIVIDLIGHT",
    "SUBTRACT",
    "DIVIDE"
]
"""