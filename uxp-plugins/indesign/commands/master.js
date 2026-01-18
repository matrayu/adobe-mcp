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

const { app, FirstBaseline, SpecialCharacters, Justification } = require("indesign");

/**
 * Add automatic page numbering to master pages
 */
const addPageNumbers = async (command) => {
    const options = command.options;
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    const masterSpread = doc.masterSpreads.item(0);
    const position = options.position;
    const fontSize = options.fontSize;

    // Calculate bounds based on position
    const docPrefs = doc.documentPreferences;
    const pageWidth = parseFloat(docPrefs.pageWidth);
    const pageHeight = parseFloat(docPrefs.pageHeight);

    let leftBounds, rightBounds;

    switch (position) {
        case "bottom_center":
            leftBounds = [pageHeight - 36, pageWidth / 2 - 20, pageHeight - 24, pageWidth / 2 + 20];
            rightBounds = [pageHeight - 36, pageWidth / 2 - 20, pageHeight - 24, pageWidth / 2 + 20];
            break;
        case "bottom_outside":
            leftBounds = [pageHeight - 36, 20, pageHeight - 24, 60];  // Left page: left side
            rightBounds = [pageHeight - 36, pageWidth - 60, pageHeight - 24, pageWidth - 20];  // Right page: right side
            break;
        case "top_center":
            leftBounds = [20, pageWidth / 2 - 20, 32, pageWidth / 2 + 20];
            rightBounds = [20, pageWidth / 2 - 20, 32, pageWidth / 2 + 20];
            break;
        case "top_outside":
            leftBounds = [20, 20, 32, 60];  // Left page: left side
            rightBounds = [20, pageWidth - 60, 32, pageWidth - 20];  // Right page: right side
            break;
        default:
            leftBounds = [pageHeight - 36, pageWidth / 2 - 20, pageHeight - 24, pageWidth / 2 + 20];
            rightBounds = [pageHeight - 36, pageWidth / 2 - 20, pageHeight - 24, pageWidth / 2 + 20];
    }

    // Add to left page
    const leftPage = masterSpread.pages.item(0);
    const leftFrame = leftPage.textFrames.add();
    leftFrame.geometricBounds = leftBounds;
    leftFrame.textFramePreferences.firstBaselineOffset = FirstBaseline.leadingOffset;
    leftFrame.contents = SpecialCharacters.autoPageNumber;
    leftFrame.parentStory.characters.item(0).pointSize = fontSize;

    // Add to right page
    const rightPage = masterSpread.pages.item(1);
    const rightFrame = rightPage.textFrames.add();
    rightFrame.geometricBounds = rightBounds;
    rightFrame.textFramePreferences.firstBaselineOffset = FirstBaseline.leadingOffset;
    rightFrame.contents = SpecialCharacters.autoPageNumber;
    rightFrame.parentStory.characters.item(0).pointSize = fontSize;

    // Right-align if outside position
    if (position.includes("outside")) {
        rightFrame.parentStory.characters.item(0).justification = Justification.rightAlign;
    } else if (position.includes("center")) {
        leftFrame.parentStory.characters.item(0).justification = Justification.centerAlign;
        rightFrame.parentStory.characters.item(0).justification = Justification.centerAlign;
    }

    return {
        status: "SUCCESS",
        position: position,
        fontSize: fontSize,
        leftPageFrameAdded: true,
        rightPageFrameAdded: true
    };
};

/**
 * Add running headers to master pages
 */
const addRunningHeader = async (command) => {
    const options = command.options;
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    const masterSpread = doc.masterSpreads.item(0);
    const headerText = options.headerText;
    const position = options.position;
    const applyTo = options.applyTo;

    const docPrefs = doc.documentPreferences;
    const pageWidth = parseFloat(docPrefs.pageWidth);

    let leftBounds, rightBounds;

    switch (position) {
        case "top_left":
            leftBounds = [20, 54, 32, 200];
            rightBounds = [20, 54, 32, 200];
            break;
        case "top_center":
            leftBounds = [20, pageWidth / 2 - 100, 32, pageWidth / 2 + 100];
            rightBounds = [20, pageWidth / 2 - 100, 32, pageWidth / 2 + 100];
            break;
        case "top_right":
            leftBounds = [20, pageWidth - 200, 32, pageWidth - 54];
            rightBounds = [20, pageWidth - 200, 32, pageWidth - 54];
            break;
        case "top_outside":
            leftBounds = [20, 54, 32, 200];  // Left page: left side
            rightBounds = [20, pageWidth - 200, 32, pageWidth - 54];  // Right page: right side
            break;
        case "top_inside":
            leftBounds = [20, pageWidth - 200, 32, pageWidth - 54];  // Left page: right side
            rightBounds = [20, 54, 32, 200];  // Right page: left side
            break;
        default:
            leftBounds = [20, pageWidth - 200, 32, pageWidth - 54];
            rightBounds = [20, pageWidth - 200, 32, pageWidth - 54];
    }

    let leftFrameAdded = false;
    let rightFrameAdded = false;

    // Add to left page if applicable
    if (applyTo === "both" || applyTo === "left_only") {
        const leftPage = masterSpread.pages.item(0);
        const leftFrame = leftPage.textFrames.add();
        leftFrame.geometricBounds = leftBounds;
        leftFrame.textFramePreferences.firstBaselineOffset = FirstBaseline.leadingOffset;
        leftFrame.contents = headerText;
        leftFrame.parentStory.characters.item(0).pointSize = 10;

        if (position === "top_outside" || position === "top_left") {
            leftFrame.parentStory.characters.item(0).justification = Justification.leftAlign;
        } else if (position === "top_inside" || position === "top_right") {
            leftFrame.parentStory.characters.item(0).justification = Justification.rightAlign;
        } else {
            leftFrame.parentStory.characters.item(0).justification = Justification.centerAlign;
        }

        leftFrameAdded = true;
    }

    // Add to right page if applicable
    if (applyTo === "both" || applyTo === "right_only") {
        const rightPage = masterSpread.pages.item(1);
        const rightFrame = rightPage.textFrames.add();
        rightFrame.geometricBounds = rightBounds;
        rightFrame.textFramePreferences.firstBaselineOffset = FirstBaseline.leadingOffset;
        rightFrame.contents = headerText;
        rightFrame.parentStory.characters.item(0).pointSize = 10;

        if (position === "top_outside" || position === "top_right") {
            rightFrame.parentStory.characters.item(0).justification = Justification.rightAlign;
        } else if (position === "top_inside" || position === "top_left") {
            rightFrame.parentStory.characters.item(0).justification = Justification.leftAlign;
        } else {
            rightFrame.parentStory.characters.item(0).justification = Justification.centerAlign;
        }

        rightFrameAdded = true;
    }

    return {
        status: "SUCCESS",
        headerText: headerText,
        position: position,
        leftPageFrameAdded: leftFrameAdded,
        rightPageFrameAdded: rightFrameAdded
    };
};

module.exports = {
    addPageNumbers,
    addRunningHeader
};
