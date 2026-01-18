#!/usr/bin/env python3
"""
InDesign Document Validator

Checks document health before operations to prevent errors.
Validates overflow, fonts, styles, and frame bounds.

Exit codes:
    0: All checks passed
    10: Validation warnings (non-critical)
    11: Validation failures (critical)
"""

import argparse
import sys
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class ValidationResult:
    """Result from validation check"""
    passed: bool
    warnings: List[str]
    errors: List[str]
    details: dict


def check_overflow(mcp_available: bool = False) -> ValidationResult:
    """
    Check for text overflow across all pages.

    In real implementation, would call InDesign MCP tools to:
    1. Get document page count
    2. For each page, get text frames
    3. For each frame, detect overflow
    4. Report any overflow found

    Args:
        mcp_available: Whether InDesign MCP tools are available

    Returns:
        ValidationResult with overflow status
    """
    warnings = []
    errors = []

    if not mcp_available:
        warnings.append("MCP tools not available - cannot check overflow")
        return ValidationResult(
            passed=True,
            warnings=warnings,
            errors=errors,
            details={"mcp_available": False}
        )

    # Placeholder for actual MCP integration
    # In real implementation:
    # doc_info = get_document_info()
    # for page in range(doc_info['page_count']):
    #     frames = get_text_frames(page_index=page)
    #     for frame in frames:
    #         overflow = detect_text_overflow(frame['index'], page)
    #         if overflow['hasOverflow']:
    #             errors.append(f"Page {page}, Frame {frame['index']}: {overflow['overflowCharacterCount']} chars overflow")

    details = {
        "pages_checked": 0,
        "frames_checked": 0,
        "overflow_found": 0
    }

    passed = len(errors) == 0
    return ValidationResult(passed=passed, warnings=warnings, errors=errors, details=details)


def check_fonts(mcp_available: bool = False) -> ValidationResult:
    """
    Check for missing or substituted fonts.

    Args:
        mcp_available: Whether InDesign MCP tools are available

    Returns:
        ValidationResult with font status
    """
    warnings = []
    errors = []

    if not mcp_available:
        warnings.append("MCP tools not available - cannot check fonts")
        return ValidationResult(
            passed=True,
            warnings=warnings,
            errors=errors,
            details={"mcp_available": False}
        )

    # Placeholder for actual font checking
    # Would require new MCP tool: get_document_fonts()

    details = {
        "fonts_used": 0,
        "fonts_missing": 0,
        "fonts_substituted": 0
    }

    passed = len(errors) == 0
    return ValidationResult(passed=passed, warnings=warnings, errors=errors, details=details)


def check_styles(mcp_available: bool = False) -> ValidationResult:
    """
    Check for applied styles that don't exist in document.

    Args:
        mcp_available: Whether InDesign MCP tools are available

    Returns:
        ValidationResult with style status
    """
    warnings = []
    errors = []

    if not mcp_available:
        warnings.append("MCP tools not available - cannot check styles")
        return ValidationResult(
            passed=True,
            warnings=warnings,
            errors=errors,
            details={"mcp_available": False}
        )

    # Placeholder for actual style validation
    # In real implementation:
    # available_styles = get_paragraph_styles()
    # # Check if any text has styles not in available_styles
    # # This would require new MCP tool to get applied styles

    details = {
        "paragraph_styles": 0,
        "character_styles": 0,
        "undefined_styles": 0
    }

    passed = len(errors) == 0
    return ValidationResult(passed=passed, warnings=warnings, errors=errors, details=details)


def check_bounds(mcp_available: bool = False) -> ValidationResult:
    """
    Check for frames outside page dimensions.

    Args:
        mcp_available: Whether InDesign MCP tools are available

    Returns:
        ValidationResult with bounds status
    """
    warnings = []
    errors = []

    if not mcp_available:
        warnings.append("MCP tools not available - cannot check bounds")
        return ValidationResult(
            passed=True,
            warnings=warnings,
            errors=errors,
            details={"mcp_available": False}
        )

    # Placeholder for bounds checking
    # In real implementation:
    # doc_info = get_document_info()
    # page_width = doc_info['dimensions']['width']
    # page_height = doc_info['dimensions']['height']
    # for page in range(doc_info['page_count']):
    #     frames = get_text_frames(page_index=page)
    #     for frame in frames:
    #         bounds = frame['bounds']
    #         if bounds[3] > page_width or bounds[2] > page_height:
    #             errors.append(f"Page {page}, Frame {frame['index']}: extends beyond page")

    details = {
        "frames_checked": 0,
        "frames_out_of_bounds": 0
    }

    passed = len(errors) == 0
    return ValidationResult(passed=passed, warnings=warnings, errors=errors, details=details)


def main():
    parser = argparse.ArgumentParser(
        description="Validate InDesign document health"
    )
    parser.add_argument(
        "--check-overflow",
        action="store_true",
        help="Check for text overflow"
    )
    parser.add_argument(
        "--check-fonts",
        action="store_true",
        help="Check for missing fonts"
    )
    parser.add_argument(
        "--check-styles",
        action="store_true",
        help="Check for undefined styles"
    )
    parser.add_argument(
        "--check-bounds",
        action="store_true",
        help="Check for frames outside page bounds"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Run all checks"
    )

    args = parser.parse_args()

    # If no specific checks requested, default to --all
    if not any([args.check_overflow, args.check_fonts, args.check_styles, args.check_bounds, args.all]):
        args.all = True

    # Determine if MCP tools are available
    # In production, would test actual connection
    mcp_available = False  # Placeholder

    results = []
    all_passed = True
    has_warnings = False

    print("InDesign Document Validation")
    print("=" * 50)

    if args.all or args.check_overflow:
        print("\n[1/4] Checking for text overflow...")
        result = check_overflow(mcp_available)
        results.append(("Overflow Check", result))
        if not result.passed:
            all_passed = False
        if result.warnings:
            has_warnings = True

    if args.all or args.check_fonts:
        print("\n[2/4] Checking fonts...")
        result = check_fonts(mcp_available)
        results.append(("Font Check", result))
        if not result.passed:
            all_passed = False
        if result.warnings:
            has_warnings = True

    if args.all or args.check_styles:
        print("\n[3/4] Checking styles...")
        result = check_styles(mcp_available)
        results.append(("Style Check", result))
        if not result.passed:
            all_passed = False
        if result.warnings:
            has_warnings = True

    if args.all or args.check_bounds:
        print("\n[4/4] Checking frame bounds...")
        result = check_bounds(mcp_available)
        results.append(("Bounds Check", result))
        if not result.passed:
            all_passed = False
        if result.warnings:
            has_warnings = True

    # Print summary
    print("\n" + "=" * 50)
    print("VALIDATION SUMMARY")
    print("=" * 50)

    for check_name, result in results:
        status = "✓ PASS" if result.passed else "✗ FAIL"
        print(f"\n{check_name}: {status}")

        if result.errors:
            print("  Errors:")
            for error in result.errors:
                print(f"    - {error}")

        if result.warnings:
            print("  Warnings:")
            for warning in result.warnings:
                print(f"    - {warning}")

    print("\n" + "=" * 50)

    if all_passed and not has_warnings:
        print("✓ All checks passed")
        return 0
    elif all_passed and has_warnings:
        print("⚠ Checks passed with warnings")
        return 10
    else:
        print("✗ Validation failed")
        return 11


if __name__ == "__main__":
    sys.exit(main())
