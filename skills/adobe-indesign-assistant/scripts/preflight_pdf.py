#!/usr/bin/env python3
"""
InDesign PDF Export Pre-Flight Check

Validates PDF export settings before export to prevent low-quality output.
Checks preset existence, resolution, color space, and output type matching.

Exit codes:
    0: All checks passed, safe to export
    10: Warnings (export possible but not optimal)
    11: Critical failures (export not recommended)
"""

import argparse
import sys
from dataclasses import dataclass
from typing import List, Dict


@dataclass
class PreflightResult:
    """Result from pre-flight check"""
    passed: bool
    warnings: List[str]
    errors: List[str]
    recommendations: List[str]


# Preset database with recommended settings
PRESET_INFO = {
    "[High Quality Print]": {
        "color_space": "CMYK",
        "min_resolution": 300,
        "output_types": ["print"],
        "description": "CMYK, 300dpi, for commercial printing"
    },
    "[Press Quality]": {
        "color_space": "CMYK",
        "min_resolution": 300,
        "output_types": ["print", "commercial"],
        "description": "CMYK, 300dpi, PDF/X-1a compliant"
    },
    "[Smallest File Size]": {
        "color_space": "RGB",
        "min_resolution": 72,
        "output_types": ["digital", "web", "email"],
        "description": "RGB, 72dpi, for digital distribution"
    },
    "[PDF/X-4:2008]": {
        "color_space": "CMYK",
        "min_resolution": 300,
        "output_types": ["print", "commercial", "pod"],
        "description": "Modern press standard, CMYK, 300dpi"
    }
}


def check_preset_exists(preset_name: str, mcp_available: bool = False) -> PreflightResult:
    """
    Check if specified preset exists in document.

    Args:
        preset_name: Name of PDF export preset
        mcp_available: Whether InDesign MCP tools are available

    Returns:
        PreflightResult with preset existence status
    """
    warnings = []
    errors = []
    recommendations = []

    if not mcp_available:
        warnings.append("MCP tools not available - cannot verify preset exists")
        return PreflightResult(
            passed=True,
            warnings=warnings,
            errors=errors,
            recommendations=recommendations
        )

    # Placeholder for actual MCP integration
    # In real implementation:
    # presets = get_pdf_export_presets()
    # available = [p['name'] for p in presets['presets']]
    # if preset_name not in available:
    #     errors.append(f"Preset '{preset_name}' not found in document")
    #     recommendations.append(f"Available presets: {', '.join(available)}")

    passed = len(errors) == 0
    return PreflightResult(
        passed=passed,
        warnings=warnings,
        errors=errors,
        recommendations=recommendations
    )


def check_preset_match(preset_name: str, output_type: str) -> PreflightResult:
    """
    Check if preset is appropriate for output type.

    Args:
        preset_name: Name of PDF export preset
        output_type: Intended output type (print, digital, web, commercial, pod)

    Returns:
        PreflightResult with preset appropriateness status
    """
    warnings = []
    errors = []
    recommendations = []

    if preset_name not in PRESET_INFO:
        warnings.append(f"Preset '{preset_name}' not in known presets database")
        warnings.append("Unable to validate appropriateness for output type")
        return PreflightResult(
            passed=True,
            warnings=warnings,
            errors=errors,
            recommendations=recommendations
        )

    preset_info = PRESET_INFO[preset_name]
    recommended_types = preset_info["output_types"]

    if output_type not in recommended_types:
        errors.append(
            f"Preset '{preset_name}' not recommended for '{output_type}' output"
        )
        errors.append(
            f"This preset is for: {', '.join(recommended_types)}"
        )

        # Recommend better preset
        better_presets = [
            name for name, info in PRESET_INFO.items()
            if output_type in info["output_types"]
        ]
        if better_presets:
            recommendations.append(
                f"Consider using: {', '.join(better_presets)}"
            )

    passed = len(errors) == 0
    return PreflightResult(
        passed=passed,
        warnings=warnings,
        errors=errors,
        recommendations=recommendations
    )


def check_color_space(preset_name: str, output_type: str) -> PreflightResult:
    """
    Check if color space is appropriate for output.

    Args:
        preset_name: Name of PDF export preset
        output_type: Intended output type

    Returns:
        PreflightResult with color space status
    """
    warnings = []
    errors = []
    recommendations = []

    if preset_name not in PRESET_INFO:
        return PreflightResult(
            passed=True,
            warnings=["Cannot validate color space - preset unknown"],
            errors=errors,
            recommendations=recommendations
        )

    preset_color = PRESET_INFO[preset_name]["color_space"]

    # Print requires CMYK
    if output_type in ["print", "commercial", "pod"]:
        if preset_color != "CMYK":
            errors.append(
                f"Color space mismatch: Preset uses {preset_color}, "
                f"but {output_type} requires CMYK"
            )
            recommendations.append(
                "Use a preset with CMYK color space for print output"
            )

    # Digital prefers RGB
    if output_type in ["digital", "web", "email"]:
        if preset_color != "RGB":
            warnings.append(
                f"Color space note: Preset uses {preset_color}, "
                f"but RGB is typical for {output_type}"
            )

    passed = len(errors) == 0
    return PreflightResult(
        passed=passed,
        warnings=warnings,
        errors=errors,
        recommendations=recommendations
    )


def check_resolution(preset_name: str, output_type: str) -> PreflightResult:
    """
    Check if resolution is adequate for output type.

    Args:
        preset_name: Name of PDF export preset
        output_type: Intended output type

    Returns:
        PreflightResult with resolution status
    """
    warnings = []
    errors = []
    recommendations = []

    if preset_name not in PRESET_INFO:
        return PreflightResult(
            passed=True,
            warnings=["Cannot validate resolution - preset unknown"],
            errors=errors,
            recommendations=recommendations
        )

    preset_resolution = PRESET_INFO[preset_name]["min_resolution"]

    # Print requires 300dpi minimum
    if output_type in ["print", "commercial", "pod"]:
        if preset_resolution < 300:
            errors.append(
                f"Resolution too low: Preset is {preset_resolution}dpi, "
                f"but {output_type} requires 300dpi minimum"
            )
            recommendations.append("Use [High Quality Print] or [Press Quality]")

    # Digital can use lower resolution
    if output_type in ["digital", "web", "email"]:
        if preset_resolution > 150:
            warnings.append(
                f"Resolution may be higher than needed: {preset_resolution}dpi "
                f"for {output_type} (72-150dpi typical)"
            )
            warnings.append("This will result in larger file size")

    passed = len(errors) == 0
    return PreflightResult(
        passed=passed,
        warnings=warnings,
        errors=errors,
        recommendations=recommendations
    )


def main():
    parser = argparse.ArgumentParser(
        description="Pre-flight check for PDF export"
    )
    parser.add_argument(
        "--preset",
        required=True,
        help="PDF export preset name (e.g., '[High Quality Print]')"
    )
    parser.add_argument(
        "--output-type",
        required=True,
        choices=["print", "digital", "web", "email", "commercial", "pod"],
        help="Intended output type"
    )

    args = parser.parse_args()

    # Run all pre-flight checks
    print("InDesign PDF Export Pre-Flight Check")
    print("=" * 60)
    print(f"Preset: {args.preset}")
    print(f"Output Type: {args.output_type}")
    print("=" * 60)

    # Determine if MCP tools are available
    mcp_available = False  # Placeholder

    results = []
    all_passed = True
    has_warnings = False

    # Check 1: Preset exists
    print("\n[1/4] Checking preset exists in document...")
    result = check_preset_exists(args.preset, mcp_available)
    results.append(("Preset Existence", result))
    if not result.passed:
        all_passed = False
    if result.warnings:
        has_warnings = True

    # Check 2: Preset matches output type
    print("\n[2/4] Checking preset matches output type...")
    result = check_preset_match(args.preset, args.output_type)
    results.append(("Preset Match", result))
    if not result.passed:
        all_passed = False
    if result.warnings:
        has_warnings = True

    # Check 3: Color space
    print("\n[3/4] Checking color space...")
    result = check_color_space(args.preset, args.output_type)
    results.append(("Color Space", result))
    if not result.passed:
        all_passed = False
    if result.warnings:
        has_warnings = True

    # Check 4: Resolution
    print("\n[4/4] Checking resolution...")
    result = check_resolution(args.preset, args.output_type)
    results.append(("Resolution", result))
    if not result.passed:
        all_passed = False
    if result.warnings:
        has_warnings = True

    # Print summary
    print("\n" + "=" * 60)
    print("PRE-FLIGHT SUMMARY")
    print("=" * 60)

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

        if result.recommendations:
            print("  Recommendations:")
            for rec in result.recommendations:
                print(f"    → {rec}")

    print("\n" + "=" * 60)

    if all_passed and not has_warnings:
        print("✓ Pre-flight passed - safe to export")
        return 0
    elif all_passed and has_warnings:
        print("⚠ Pre-flight passed with warnings - export possible but not optimal")
        return 10
    else:
        print("✗ Pre-flight failed - export not recommended")
        print("\nFix the errors above before exporting.")
        return 11


if __name__ == "__main__":
    sys.exit(main())
