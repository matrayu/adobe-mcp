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
const { getTextFrame, checkOverflow, getFileEntry, validateBounds } = require("./utils");

/**
 * Get all text frames on a specific page
 */
const getTextFrames = async (command) => {
    const options = command.options;
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    const page = doc.pages.item(options.pageIndex);
    if (!page.isValid) {
        throw new Error(`Invalid page index: ${options.pageIndex}`);
    }

    const frames = [];
    const textFrames = page.textFrames.everyItem().getElements();

    for (let i = 0; i < textFrames.length; i++) {
        const frame = textFrames[i];
        const overflow = checkOverflow(frame);

        frames.push({
            index: i,
            bounds: frame.geometricBounds,
            hasContent: frame.contents.length > 0,
            overflow: overflow.hasOverflow,
            characterCount: frame.characters.length,
            linkedToNext: frame.nextTextFrame !== null,
            label: frame.label || null
        });
    }

    return {
        status: "SUCCESS",
        pageIndex: options.pageIndex,
        frames: frames
    };
};

/**
 * Get detailed information about a specific text frame
 */
const getTextFrameInfo = async (command) => {
    const options = command.options;
    const frame = getTextFrame(options.pageIndex, options.frameIndex);
    const overflow = checkOverflow(frame);

    let nextFrameIndex = null;
    if (frame.nextTextFrame && frame.nextTextFrame.isValid) {
        // Find the index of the next frame on its page
        const nextPage = frame.nextTextFrame.parentPage;
        const nextPageFrames = nextPage.textFrames.everyItem().getElements();
        nextFrameIndex = nextPageFrames.indexOf(frame.nextTextFrame);
    }

    let parentStoryLength = 0;
    if (frame.parentStory && frame.parentStory.isValid) {
        parentStoryLength = frame.parentStory.characters.length;
    }

    return {
        status: "SUCCESS",
        index: options.frameIndex,
        pageIndex: options.pageIndex,
        bounds: frame.geometricBounds,
        contentLength: frame.characters.length,
        hasOverflow: overflow.hasOverflow,
        overflowCharacterCount: overflow.overflowCount,
        linkedToNext: frame.nextTextFrame !== null,
        nextFrameIndex: nextFrameIndex,
        parentStoryLength: parentStoryLength
    };
};

/**
 * Create a new text frame on a page
 */
const createTextFrame = async (command) => {
    const options = command.options;
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    const page = doc.pages.item(options.pageIndex);
    if (!page.isValid) {
        throw new Error(`Invalid page index: ${options.pageIndex}`);
    }

    // Validate bounds
    validateBounds(options.geometricBounds, page);

    // Get frame count BEFORE adding new frame
    const frameCountBefore = page.textFrames.length;

    // Create frame (InDesign appends to end of collection)
    const textFrame = page.textFrames.add();
    textFrame.geometricBounds = options.geometricBounds;

    // CRITICAL: Initialize frame properties to ensure persistence
    // Adobe examples ALWAYS set multiple properties immediately after creation
    // Uninitialized frames may not persist in InDesign's object model
    const { FirstBaseline } = require("indesign");
    textFrame.textFramePreferences.firstBaselineOffset = FirstBaseline.leadingOffset;
    textFrame.label = `Frame_p${options.pageIndex}_${frameCountBefore}`;  // Label for identification
    textFrame.contents = "";  // Initialize content

    // Validate frame was created successfully
    if (!textFrame.isValid) {
        throw new Error("Frame creation failed - frame became invalid after creation");
    }

    // The new frame's index is the previous count (0-based, appended to end)
    // Adobe's documentation pattern: trust the returned reference, don't re-verify
    const frameIndex = frameCountBefore;

    return {
        status: "SUCCESS",
        frameIndex: frameIndex,
        pageIndex: options.pageIndex,
        bounds: textFrame.geometricBounds,
        created: true
    };
};

/**
 * Insert text into a text frame
 */
const insertText = async (command) => {
    const options = command.options;
    const frame = getTextFrame(options.pageIndex, options.frameIndex);

    // Insert text
    frame.contents = options.text;

    // Check for overflow
    const overflow = checkOverflow(frame);

    return {
        status: "SUCCESS",
        frameIndex: options.frameIndex,
        pageIndex: options.pageIndex,
        charactersInserted: options.text.length,
        overflow: overflow.hasOverflow,
        overflowCharacterCount: overflow.overflowCount
    };
};

/**
 * Import text file into a text frame
 */
const importTextFile = async (command) => {
    const options = command.options;
    const frame = getTextFrame(options.pageIndex, options.frameIndex);
    const file = await getFileEntry(options.filePath);

    // Determine insertion point
    let insertionPoint;
    if (options.insertionPoint === -1) {
        // Insert at end
        insertionPoint = frame.insertionPoints.item(-1);
    } else if (options.insertionPoint === 0) {
        // Insert at start
        insertionPoint = frame.insertionPoints.item(0);
    } else {
        // Insert at specific position
        insertionPoint = frame.insertionPoints.item(options.insertionPoint);
    }

    // Import file
    insertionPoint.place(file);

    // Check for overflow
    const overflow = checkOverflow(frame);

    return {
        status: "SUCCESS",
        frameIndex: options.frameIndex,
        pageIndex: options.pageIndex,
        fileImported: options.filePath,
        charactersImported: frame.characters.length,
        overflow: overflow.hasOverflow,
        overflowCharacterCount: overflow.overflowCount
    };
};

/**
 * Link two text frames for text flow
 */
const linkTextFrames = async (command) => {
    const options = command.options;
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    // Get frames from potentially different pages
    const sourcePage = doc.pages.item(options.sourcePageIndex);
    const targetPage = doc.pages.item(options.targetPageIndex);

    if (!sourcePage.isValid) {
        throw new Error(`Invalid source page index: ${options.sourcePageIndex}`);
    }
    if (!targetPage.isValid) {
        throw new Error(`Invalid target page index: ${options.targetPageIndex}`);
    }

    const sourceFrame = sourcePage.textFrames.item(options.sourceFrameIndex);
    const targetFrame = targetPage.textFrames.item(options.targetFrameIndex);

    // Enhanced error diagnostics
    if (!sourceFrame.isValid) {
        const sourceFrameCount = sourcePage.textFrames.length;
        throw new Error(
            `Source frame ${options.sourceFrameIndex} not found on page ${options.sourcePageIndex}. ` +
            `Page has ${sourceFrameCount} frame(s).`
        );
    }
    if (!targetFrame.isValid) {
        const targetFrameCount = targetPage.textFrames.length;
        throw new Error(
            `Target frame ${options.targetFrameIndex} not found on page ${options.targetPageIndex}. ` +
            `Page has ${targetFrameCount} frame(s).`
        );
    }

    // Check for circular linking
    if (targetFrame.previousTextFrame === sourceFrame) {
        throw new Error("Circular link detected");
    }

    sourceFrame.nextTextFrame = targetFrame;

    return {
        status: "SUCCESS",
        sourceFrame: {
            index: options.sourceFrameIndex,
            page: options.sourcePageIndex
        },
        targetFrame: {
            index: options.targetFrameIndex,
            page: options.targetPageIndex
        },
        linked: true
    };
};

/**
 * Get text content from a frame
 */
const getTextContent = async (command) => {
    const options = command.options;
    const frame = getTextFrame(options.pageIndex, options.frameIndex);

    const paragraphs = frame.paragraphs.everyItem().getElements();

    return {
        status: "SUCCESS",
        frameIndex: options.frameIndex,
        pageIndex: options.pageIndex,
        content: frame.contents,
        characterCount: frame.characters.length,
        paragraphCount: paragraphs.length
    };
};

/**
 * Detect text overflow in a frame
 */
const detectTextOverflow = async (command) => {
    const options = command.options;
    const frame = getTextFrame(options.pageIndex, options.frameIndex);
    const overflow = checkOverflow(frame);

    let suggestion = "";
    if (overflow.hasOverflow) {
        suggestion = "Link to another frame or create new page";
    }

    return {
        status: "SUCCESS",
        frameIndex: options.frameIndex,
        pageIndex: options.pageIndex,
        hasOverflow: overflow.hasOverflow,
        overflowCharacterCount: overflow.overflowCount,
        needsAdditionalFrames: overflow.hasOverflow,
        suggestion: suggestion
    };
};

/**
 * Remove duplicate and empty frames caused by PTF conflicts
 */
const removeDuplicateFrames = async (command) => {
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    const removalReport = [];
    let totalRemoved = 0;

    // Iterate through all document pages
    const pages = doc.pages.everyItem().getElements();

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const frames = page.textFrames.everyItem().getElements();

        if (frames.length === 0) {
            continue;  // No frames on this page
        }

        const framesToKeep = [];
        const framesToRemove = [];

        // Identify duplicates and empty frames
        for (let j = 0; j < frames.length; j++) {
            const frame = frames[j];

            // Check if frame is empty
            const isEmpty = frame.contents.length === 0;

            // Check if frame has same bounds as another frame on this page
            let isDuplicate = false;
            for (let k = 0; k < framesToKeep.length; k++) {
                const existingFrame = framesToKeep[k];
                const boundsMatch =
                    frame.geometricBounds[0] === existingFrame.geometricBounds[0] &&
                    frame.geometricBounds[1] === existingFrame.geometricBounds[1] &&
                    frame.geometricBounds[2] === existingFrame.geometricBounds[2] &&
                    frame.geometricBounds[3] === existingFrame.geometricBounds[3];

                if (boundsMatch) {
                    isDuplicate = true;
                    break;
                }
            }

            // Decide whether to keep or remove
            if (isDuplicate) {
                // If it's a duplicate, only keep it if the existing one is empty
                // and this one has content
                const existingIsEmpty = framesToKeep.some(f =>
                    f.geometricBounds[0] === frame.geometricBounds[0] &&
                    f.contents.length === 0
                );

                if (!isEmpty && existingIsEmpty) {
                    // Remove the empty one, keep this one with content
                    const emptyIndex = framesToKeep.findIndex(f =>
                        f.geometricBounds[0] === frame.geometricBounds[0] &&
                        f.contents.length === 0
                    );
                    if (emptyIndex !== -1) {
                        framesToRemove.push(framesToKeep[emptyIndex]);
                        framesToKeep.splice(emptyIndex, 1);
                    }
                    framesToKeep.push(frame);
                } else {
                    framesToRemove.push(frame);
                }
            } else {
                framesToKeep.push(frame);
            }
        }

        // Remove the identified frames
        for (let j = 0; j < framesToRemove.length; j++) {
            try {
                framesToRemove[j].remove();
                totalRemoved++;
            } catch (e) {
                // Frame might already be invalid
            }
        }

        if (framesToRemove.length > 0) {
            removalReport.push({
                pageIndex: i,
                framesRemoved: framesToRemove.length,
                framesRemaining: framesToKeep.length
            });
        }
    }

    return {
        status: "SUCCESS",
        totalFramesRemoved: totalRemoved,
        pagesAffected: removalReport.length,
        details: removalReport
    };
};

/**
 * Create threaded text frames across multiple pages (atomic operation)
 * Recommended for multi-page documents - creates and links in single operation
 */
const createThreadedFrames = async (command) => {
    const options = command.options;
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    const startPage = options.startPage;
    const endPage = options.endPage;
    const bounds = options.geometricBounds;

    if (startPage < 0 || endPage < startPage) {
        throw new Error(`Invalid page range: ${startPage} to ${endPage}`);
    }

    const { FirstBaseline } = require("indesign");
    const framesCreated = [];
    let previousFrame = null;

    // Create all frames and link them immediately in same execution
    for (let pageIndex = startPage; pageIndex <= endPage; pageIndex++) {
        console.log(`[createThreadedFrames] Processing page ${pageIndex}`);

        const page = doc.pages.item(pageIndex);
        if (!page.isValid) {
            throw new Error(`Invalid page index: ${pageIndex}`);
        }

        // Validate bounds for this page
        validateBounds(bounds, page);

        // Get frame count before creation for verification
        const frameCountBefore = page.textFrames.length;
        console.log(`[createThreadedFrames] Page ${pageIndex} has ${frameCountBefore} frames before creation`);

        // WORKAROUND: Create frame at document level, then move to page
        // page.textFrames.add() fails silently on even pages (InDesign UXP bug)
        const textFrame = doc.textFrames.add();
        textFrame.itemLayer = page.itemLayer;  // Assign to page's layer
        textFrame.geometricBounds = bounds;

        // Move frame to specific page by adjusting bounds relative to page
        // Need to account for page position in spread
        const pageY = page.bounds[0];
        const pageX = page.bounds[1];
        textFrame.move([pageY, pageX]);

        textFrame.textFramePreferences.firstBaselineOffset = FirstBaseline.leadingOffset;
        textFrame.label = `ThreadedFrame_${pageIndex}`;
        textFrame.contents = "";  // Initialize

        // Verify frame was created
        const frameCountAfter = page.textFrames.length;
        console.log(`[createThreadedFrames] Page ${pageIndex} has ${frameCountAfter} frames after creation`);

        if (!textFrame.isValid) {
            console.log(`[createThreadedFrames] ERROR: Frame on page ${pageIndex} became invalid!`);
            throw new Error(`Frame creation failed on page ${pageIndex} - frame became invalid`);
        }

        // Link to previous frame if exists
        if (previousFrame && previousFrame.isValid) {
            console.log(`[createThreadedFrames] Linking page ${pageIndex-1} frame to page ${pageIndex} frame`);
            previousFrame.nextTextFrame = textFrame;
        }

        framesCreated.push({
            pageIndex: pageIndex,
            frameIndex: frameCountBefore,  // Actual index where frame was added
            linkedToPrevious: previousFrame !== null
        });

        previousFrame = textFrame;
    }

    console.log(`[createThreadedFrames] Loop completed. Created ${framesCreated.length} frames total.`);

    return {
        status: "SUCCESS",
        framesCreated: framesCreated,
        totalFrames: framesCreated.length,
        threaded: true,
        startPage: startPage,
        endPage: endPage
    };
};

module.exports = {
    getTextFrames,
    getTextFrameInfo,
    createTextFrame,
    removeDuplicateFrames,
    createThreadedFrames,
    insertText,
    importTextFile,
    linkTextFrames,
    getTextContent,
    detectTextOverflow
};
