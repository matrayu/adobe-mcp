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

const { app, SaveOptions } = require("indesign");
const { getFileEntry, createFileEntry } = require("./utils");

/**
 * Open an InDesign document or template
 */
const openDocument = async (command) => {
    const options = command.options;
    const file = await getFileEntry(options.filePath);

    // Open the document
    const doc = await app.open(file);

    const pageCount = doc.pages.length;
    const docPrefs = doc.documentPreferences;

    return {
        status: "SUCCESS",
        documentName: doc.name,
        pageCount: pageCount,
        pageWidth: parseFloat(docPrefs.pageWidth),
        pageHeight: parseFloat(docPrefs.pageHeight),
        facingPages: docPrefs.facingPages,
        textFrameCount: doc.textFrames.length
    };
};

/**
 * Save the active document
 */
const saveDocument = async (command) => {
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    await doc.save();

    return {
        status: "SUCCESS",
        filePath: doc.filePath || "(unsaved)",
        saved: true
    };
};

/**
 * Save document as a new file
 */
const saveDocumentAs = async (command) => {
    const options = command.options;
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    // Use createFileEntry to handle file creation
    const file = await createFileEntry(options.filePath);
    await doc.save(file);

    const fileInfo = await file.getMetadata();

    return {
        status: "SUCCESS",
        filePath: file.nativePath,
        fileSizeKb: Math.round(fileInfo.size / 1024)
    };
};

/**
 * Close the active document
 */
const closeDocument = async (command) => {
    const options = command.options;
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    let saveOption;
    switch (options.saveOptions.toLowerCase()) {
        case "yes":
            saveOption = SaveOptions.YES;
            break;
        case "no":
            saveOption = SaveOptions.NO;
            break;
        case "ask":
            saveOption = SaveOptions.ASK;
            break;
        default:
            saveOption = SaveOptions.YES;
    }

    await doc.close(saveOption);

    return {
        status: "SUCCESS",
        closed: true,
        saved: saveOption === SaveOptions.YES
    };
};

/**
 * Get comprehensive document information
 */
const getDocumentInfo = async (command) => {
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    const docPrefs = doc.documentPreferences;
    const marginPrefs = doc.marginPreferences;

    return {
        status: "SUCCESS",
        name: doc.name,
        pageCount: doc.pages.length,
        dimensions: {
            width: parseFloat(docPrefs.pageWidth),
            height: parseFloat(docPrefs.pageHeight)
        },
        margins: {
            top: parseFloat(marginPrefs.top),
            bottom: parseFloat(marginPrefs.bottom),
            left: parseFloat(marginPrefs.left),
            right: parseFloat(marginPrefs.right)
        },
        facingPages: docPrefs.facingPages,
        filePath: doc.filePath || null,
        saved: doc.saved,
        modified: doc.modified
    };
};

module.exports = {
    openDocument,
    saveDocument,
    saveDocumentAs,
    closeDocument,
    getDocumentInfo
};
