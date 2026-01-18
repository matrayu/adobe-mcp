/* MIT License
 *
 * Copyright (c) 2025 Mike Chambers
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const { app, ExportFormat, PageRange } = require("indesign");
const { createFileEntry } = require("./utils");

/**
 * Get available PDF export presets
 */
const getPdfExportPresets = async (command) => {
    const presets = app.pdfExportPresets.everyItem().getElements();

    return {
        status: "SUCCESS",
        presets: presets.map(p => ({
            name: p.name,
            description: null  // UXP doesn't expose descriptions
        })),
        defaultPreset: "[High Quality Print]"
    };
};

/**
 * Export document to PDF
 */
const exportPdf = async (command) => {
    const options = command.options;
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    // Validate preset exists
    const preset = app.pdfExportPresets.item(options.presetName);
    if (!preset.isValid) {
        const available = app.pdfExportPresets.everyItem()
            .getElements().map(p => p.name);
        throw new Error(
            `Preset '${options.presetName}' not found. Available: ${available.join(', ')}`
        );
    }

    // Set page range
    if (options.pageRange !== "ALL") {
        app.pdfExportPreferences.pageRange = options.pageRange;
    } else {
        app.pdfExportPreferences.pageRange = PageRange.ALL_PAGES;
    }

    // Export - use createFileEntry to handle file creation
    const file = await createFileEntry(options.filePath);
    await doc.exportFile(ExportFormat.PDF_TYPE, file, false, preset);

    const fileInfo = await file.getMetadata();

    return {
        status: "SUCCESS",
        pdfExported: file.nativePath,
        fileSizeKb: Math.round(fileInfo.size / 1024),
        pagesExported: doc.pages.length,
        presetUsed: options.presetName,
        pageRange: options.pageRange
    };
};

module.exports = {
    getPdfExportPresets,
    exportPdf
};
