#!/usr/bin/env python3
"""
InDesign Page Count Estimator

Estimates page count from text file based on page dimensions, font size, and margins.
Helps users plan document structure before import.

Exit codes:
    0: Estimation successful
    1: Error (file not found, invalid parameters)
"""

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass
class PageEstimate:
    """Result from page estimation"""
    estimated_pages: int
    word_count: int
    character_count: int
    chars_per_page: int
    confidence: str  # "high", "medium", "low"
    assumptions: list


# Common page sizes in points (72pt = 1 inch)
PAGE_SIZES = {
    "letter": (612, 792),  # 8.5" × 11"
    "legal": (612, 1008),  # 8.5" × 14"
    "6x9": (432, 648),
    "5x8": (360, 576),
    "a4": (595, 842),  # 8.27" × 11.69"
    "a5": (420, 595)
}


def parse_page_size(size_str: str) -> tuple:
    """
    Parse page size string to dimensions in points.

    Args:
        size_str: Size string (e.g., "6x9", "letter", "612x792")

    Returns:
        Tuple of (width, height) in points
    """
    size_str = size_str.lower().strip()

    # Check if it's a named size
    if size_str in PAGE_SIZES:
        return PAGE_SIZES[size_str]

    # Try to parse as WxH
    if 'x' in size_str:
        parts = size_str.split('x')
        if len(parts) == 2:
            try:
                # Assume inches if no unit specified
                width = float(parts[0]) * 72  # Convert inches to points
                height = float(parts[1]) * 72
                return (width, height)
            except ValueError:
                pass

    raise ValueError(
        f"Invalid page size: {size_str}. "
        f"Use named size (letter, 6x9, etc.) or WxH format (6x9, 8.5x11)"
    )


def parse_margins(margin_str: str) -> dict:
    """
    Parse margin string to dict.

    Args:
        margin_str: Margin string (e.g., "1,1,1,1" or "0.75")

    Returns:
        Dict with top, bottom, left, right margins in points
    """
    parts = [float(x) * 72 for x in margin_str.split(',')]

    if len(parts) == 1:
        # Same margin all around
        margin = parts[0]
        return {"top": margin, "bottom": margin, "left": margin, "right": margin}
    elif len(parts) == 2:
        # Top/bottom, left/right
        return {"top": parts[0], "bottom": parts[0], "left": parts[1], "right": parts[1]}
    elif len(parts) == 4:
        # Top, right, bottom, left (CSS order) or Top, bottom, left, right
        return {"top": parts[0], "bottom": parts[1], "left": parts[2], "right": parts[3]}
    else:
        raise ValueError(
            "Invalid margin format. Use: single value, two values (TB,LR), "
            "or four values (T,B,L,R)"
        )


def calculate_text_area(page_size: tuple, margins: dict) -> float:
    """
    Calculate usable text area in square points.

    Args:
        page_size: (width, height) in points
        margins: Dict with margin values in points

    Returns:
        Text area in square points
    """
    width, height = page_size
    text_width = width - margins["left"] - margins["right"]
    text_height = height - margins["top"] - margins["bottom"]
    return text_width * text_height


def estimate_chars_per_page(
    text_area: float,
    font_size: int,
    leading: float = None
) -> int:
    """
    Estimate characters that fit on one page.

    Args:
        text_area: Available text area in square points
        font_size: Font size in points
        leading: Line spacing in points (defaults to font_size * 1.2)

    Returns:
        Estimated characters per page
    """
    if leading is None:
        leading = font_size * 1.2  # Standard 120% leading

    # Estimate characters per line
    # Average character width is roughly font_size * 0.5
    char_width = font_size * 0.5
    text_width = text_area ** 0.5  # Approximate width (assuming square-ish)
    chars_per_line = text_width / char_width

    # Estimate lines per page
    text_height = text_area / text_width
    lines_per_page = text_height / leading

    chars_per_page = int(chars_per_line * lines_per_page)

    return chars_per_page


def count_text(file_path: Path) -> tuple:
    """
    Count words and characters in text file.

    Args:
        file_path: Path to text file

    Returns:
        Tuple of (word_count, character_count)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        # Try with different encoding
        with open(file_path, 'r', encoding='latin-1') as f:
            content = f.read()

    words = content.split()
    word_count = len(words)
    char_count = len(content)

    return word_count, char_count


def estimate_pages(
    text_file: Path,
    page_size: str = "6x9",
    font_size: int = 12,
    margins: str = "0.75,0.75,0.75,0.75",
    leading: float = None
) -> PageEstimate:
    """
    Estimate page count for text file.

    Args:
        text_file: Path to text file
        page_size: Page size string
        font_size: Font size in points
        margins: Margin string
        leading: Line spacing (defaults to font_size * 1.2)

    Returns:
        PageEstimate with results
    """
    # Parse inputs
    page_dims = parse_page_size(page_size)
    margin_dict = parse_margins(margins)

    # Count text
    word_count, char_count = count_text(text_file)

    # Calculate text area
    text_area = calculate_text_area(page_dims, margin_dict)

    # Estimate characters per page
    chars_per_page = estimate_chars_per_page(text_area, font_size, leading)

    # Estimate pages
    estimated_pages = max(1, (char_count + chars_per_page - 1) // chars_per_page)

    # Determine confidence
    assumptions = [
        f"Font size: {font_size}pt",
        f"Leading: {leading or font_size * 1.2:.1f}pt",
        f"Average char width: {font_size * 0.5:.1f}pt",
        "Assumes standard paragraph spacing"
    ]

    # Confidence based on various factors
    if font_size < 10 or font_size > 14:
        confidence = "medium"
        assumptions.append("Unusual font size may affect accuracy")
    elif page_size not in PAGE_SIZES:
        confidence = "medium"
        assumptions.append("Custom page size may affect accuracy")
    else:
        confidence = "high"

    return PageEstimate(
        estimated_pages=estimated_pages,
        word_count=word_count,
        character_count=char_count,
        chars_per_page=chars_per_page,
        confidence=confidence,
        assumptions=assumptions
    )


def main():
    parser = argparse.ArgumentParser(
        description="Estimate InDesign page count from text file",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage with 6x9 book
  %(prog)s --text-file manuscript.txt --page-size 6x9

  # Custom font and margins
  %(prog)s --text-file document.txt --page-size letter --font-size 11 --margins "1,1,1.5,1"

  # Custom page dimensions
  %(prog)s --text-file text.txt --page-size 7x10

Page sizes:
  Named: letter, legal, 6x9, 5x8, a4, a5
  Custom: WxH in inches (e.g., "7x10", "8.5x11")

Margins:
  Single value: same margin all around (e.g., "1")
  Two values: top/bottom, left/right (e.g., "1,0.75")
  Four values: top, bottom, left, right (e.g., "1,1,0.75,0.75")
        """
    )
    parser.add_argument(
        "--text-file",
        required=True,
        help="Path to text file"
    )
    parser.add_argument(
        "--page-size",
        default="6x9",
        help="Page size (default: 6x9)"
    )
    parser.add_argument(
        "--font-size",
        type=int,
        default=12,
        help="Font size in points (default: 12)"
    )
    parser.add_argument(
        "--margins",
        default="0.75,0.75,0.75,0.75",
        help="Margins in inches (default: 0.75 all around)"
    )
    parser.add_argument(
        "--leading",
        type=float,
        help="Line spacing in points (default: font_size * 1.2)"
    )

    args = parser.parse_args()

    # Validate file exists
    text_file = Path(args.text_file)
    if not text_file.exists():
        print(f"Error: File not found: {text_file}", file=sys.stderr)
        return 1

    # Run estimation
    try:
        estimate = estimate_pages(
            text_file=text_file,
            page_size=args.page_size,
            font_size=args.font_size,
            margins=args.margins,
            leading=args.leading
        )
    except Exception as e:
        print(f"Error during estimation: {e}", file=sys.stderr)
        return 1

    # Print results
    print("InDesign Page Count Estimation")
    print("=" * 50)
    print(f"\nInput File: {text_file}")
    print(f"Page Size: {args.page_size}")
    print(f"Font Size: {args.font_size}pt")
    print(f"Margins: {args.margins} inches")
    print("\n" + "=" * 50)
    print("RESULTS")
    print("=" * 50)
    print(f"\n📄 Estimated Pages: {estimate.estimated_pages}")
    print(f"📝 Word Count: {estimate.word_count:,}")
    print(f"🔤 Character Count: {estimate.character_count:,}")
    print(f"📏 Characters per Page: ~{estimate.chars_per_page:,}")
    print(f"🎯 Confidence: {estimate.confidence.upper()}")

    print("\nAssumptions:")
    for assumption in estimate.assumptions:
        print(f"  • {assumption}")

    print("\n" + "=" * 50)
    print("Note: Actual page count may vary based on:")
    print("  - Actual font used (proportional vs monospace)")
    print("  - Paragraph spacing and indentation")
    print("  - Images or other non-text elements")
    print("  - Chapter breaks and section starts")
    print("=" * 50)

    return 0


if __name__ == "__main__":
    sys.exit(main())
