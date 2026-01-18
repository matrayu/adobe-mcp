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

const { app } = require("indesign");

/**
 * Get file entry from absolute path
 * @param {string} filePath - Absolute file path
 * @returns {Promise<FileEntry>} File entry object
 */
async function getFileEntry(filePath) {
    const fs = require('uxp').storage.localFileSystem;
    try {
        return await fs.getEntryWithUrl("file:" + filePath);
    } catch (e) {
        throw new Error(`File not found or inaccessible: ${filePath}`);
    }
}

/**
 * Get text frame with validation (PAGE-SPECIFIC indexing)
 * @param {number} pageIndex - Page index (0-based)
 * @param {number} frameIndex - Frame index on the specific page (0-based)
 * @returns {TextFrame} Text frame object
 */
function getTextFrame(pageIndex, frameIndex) {
    const doc = app.activeDocument;
    if (!doc) {
        throw new Error("No active document");
    }

    const page = doc.pages.item(pageIndex);
    if (!page.isValid) {
        throw new Error(`Invalid page index: ${pageIndex}`);
    }

    const frame = page.textFrames.item(frameIndex);
    if (!frame.isValid) {
        const frameCount = page.textFrames.length;
        throw new Error(
            `Frame ${frameIndex} not found on page ${pageIndex}. ` +
            `Page has ${frameCount} text frame(s) (indices 0-${frameCount - 1})`
        );
    }

    return frame;
}

/**
 * Check text overflow in frame
 * @param {TextFrame} textFrame - Text frame to check
 * @returns {Object} Overflow status and character count
 */
function checkOverflow(textFrame) {
    const hasOverflow = textFrame.overflows;
    let overflowCount = 0;

    if (hasOverflow && textFrame.parentStory) {
        const storyLength = textFrame.parentStory.characters.length;
        const visibleLength = textFrame.characters.length;
        overflowCount = storyLength - visibleLength;
    }

    return { hasOverflow, overflowCount };
}

/**
 * Parse paragraph range string
 * @param {string} rangeStr - Range string ("all", "first", "last", "0", "0-5", etc.)
 * @param {number} totalParagraphs - Total number of paragraphs available
 * @returns {Object} Start and end indices
 */
function parseParagraphRange(rangeStr, totalParagraphs) {
    if (rangeStr === "all") {
        return { start: 0, end: totalParagraphs - 1 };
    }
    if (rangeStr === "first") {
        return { start: 0, end: 0 };
    }
    if (rangeStr === "last") {
        return { start: totalParagraphs - 1, end: totalParagraphs - 1 };
    }

    if (rangeStr.includes("-")) {
        const [start, end] = rangeStr.split("-").map(Number);
        return { start, end: Math.min(end, totalParagraphs - 1) };
    }

    const index = Number(rangeStr);
    return { start: index, end: index };
}

/**
 * Validate page bounds against page dimensions
 * @param {Array} bounds - [top, left, bottom, right] in points
 * @param {Page} page - InDesign page object
 * @throws {Error} If bounds exceed page dimensions
 */
function validateBounds(bounds, page) {
    const pageWidth = parseFloat(page.bounds[3] - page.bounds[1]);
    const pageHeight = parseFloat(page.bounds[2] - page.bounds[0]);

    const [top, left, bottom, right] = bounds;

    if (right > pageWidth || bottom > pageHeight) {
        throw new Error(
            `Bounds exceed page dimensions (${pageWidth.toFixed(0)}x${pageHeight.toFixed(0)} pts). ` +
            `Provided: [${top}, ${left}, ${bottom}, ${right}]`
        );
    }

    if (left < 0 || top < 0) {
        throw new Error(`Bounds cannot have negative values: [${top}, ${left}, ${bottom}, ${right}]`);
    }

    if (right <= left || bottom <= top) {
        throw new Error(`Invalid bounds dimensions: [${top}, ${left}, ${bottom}, ${right}]`);
    }
}

module.exports = {
    getFileEntry,
    getTextFrame,
    checkOverflow,
    parseParagraphRange,
    validateBounds
};
