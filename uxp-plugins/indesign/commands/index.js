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

const {app, DocumentIntentOptions} = require("indesign");

// Import all command modules
const coreCommands = require("./core");
const textCommands = require("./text");
const stylesCommands = require("./styles");
const pagesCommands = require("./pages");
const imagesCommands = require("./images");
const exportCommands = require("./export");
const masterCommands = require("./master");


const createDocument = async (command) => {
    console.log("createDocument")

    const options = command.options

    let documents = app.documents
    let margins = options.margins

    let unit = getUnitForIntent(DocumentIntentOptions.WEB_INTENT)

    app.marginPreferences.bottom = `${margins.bottom}${unit}`
    app.marginPreferences.top = `${margins.top}${unit}`
    app.marginPreferences.left = `${margins.left}${unit}`
    app.marginPreferences.right = `${margins.right}${unit}`

    app.marginPreferences.columnCount = options.columns.count
    app.marginPreferences.columnGutter = `${options.columns.gutter}${unit}`
    

    let documentPreferences = {
        pageWidth: `${options.pageWidth}${unit}`,
        pageHeight: `${options.pageHeight}${unit}`,
        pagesPerDocument: options.pagesPerDocument,
        facingPages: options.facingPages,
        intent: DocumentIntentOptions.WEB_INTENT
    }

    const showingWindow = true
    //Boolean showingWindow, DocumentPreset documentPreset, Object withProperties
    const doc = documents.add({showingWindow, documentPreferences})

    // Return document info
    return {
        status: "SUCCESS",
        documentName: doc.name,
        pageCount: doc.pages.length,
        pageWidth: parseFloat(doc.documentPreferences.pageWidth),
        pageHeight: parseFloat(doc.documentPreferences.pageHeight),
        facingPages: doc.documentPreferences.facingPages,
        saved: false  // New document is unsaved
    };
}


const getUnitForIntent = (intent) => {

    if(intent && intent.toString() === DocumentIntentOptions.WEB_INTENT.toString()) {
        return "px"
    }

    throw new Error(`getUnitForIntent : unknown intent [${intent}]`)
}

const parseAndRouteCommand = async (command) => {
    let action = command.action;

    let f = commandHandlers[action];

    if (typeof f !== "function") {
        throw new Error(`Unknown Command: ${action}`);
    }
    
    console.log(f.name)
    return f(command);
};


const commandHandlers = {
    // Original command
    createDocument,

    // Core document operations
    openDocument: coreCommands.openDocument,
    saveDocument: coreCommands.saveDocument,
    saveDocumentAs: coreCommands.saveDocumentAs,
    closeDocument: coreCommands.closeDocument,
    getDocumentInfo: coreCommands.getDocumentInfo,

    // Text operations
    getTextFrames: textCommands.getTextFrames,
    getTextFrameInfo: textCommands.getTextFrameInfo,
    createTextFrame: textCommands.createTextFrame,
    removeDuplicateFrames: textCommands.removeDuplicateFrames,
    createThreadedFrames: textCommands.createThreadedFrames,
    insertText: textCommands.insertText,
    insertFormattedParagraphs: textCommands.insertFormattedParagraphs,
    importTextFile: textCommands.importTextFile,
    linkTextFrames: textCommands.linkTextFrames,
    getTextContent: textCommands.getTextContent,
    detectTextOverflow: textCommands.detectTextOverflow,

    // Style operations
    getParagraphStyles: stylesCommands.getParagraphStyles,
    getCharacterStyles: stylesCommands.getCharacterStyles,
    applyParagraphStyle: stylesCommands.applyParagraphStyle,
    applyCharacterStyleToText: stylesCommands.applyCharacterStyleToText,
    createParagraphStyle: stylesCommands.createParagraphStyle,
    createCharacterStyle: stylesCommands.createCharacterStyle,

    // Page operations
    addPage: pagesCommands.addPage,

    // Master page operations
    addPageNumbers: masterCommands.addPageNumbers,
    addRunningHeader: masterCommands.addRunningHeader,

    // Image operations
    placeImage: imagesCommands.placeImage,

    // Export operations
    getPdfExportPresets: exportCommands.getPdfExportPresets,
    exportPdf: exportCommands.exportPdf
};


const getActiveDocumentSettings = (command) => {
    const document = app.activeDocument


    const d = document.documentPreferences
    const documentPreferences = {
        pageWidth:d.pageWidth,
        pageHeight:d.pageHeight,
        pagesPerDocument:d.pagesPerDocument,
        facingPages:d.facingPages,
        measurementUnit:getUnitForIntent(d.intent)
    }

    const marginPreferences = {
        top:document.marginPreferences.top,
        bottom:document.marginPreferences.bottom,
        left:document.marginPreferences.left,
        right:document.marginPreferences.right,
        columnCount : document.marginPreferences.columnCount,
        columnGutter : document.marginPreferences.columnGutter
    }
    return {documentPreferences, marginPreferences}
}

const checkRequiresActiveDocument = async (command) => {
    if (!requiresActiveProject(command)) {
        return;
    }

    let document = app.activeDocument
    if (!document) {
        throw new Error(
            `${command.action} : Requires an open InDesign document`
        );
    }
};

const requiresActiveDocument = (command) => {
    return !["createDocument"].includes(command.action);
};


module.exports = {
    getActiveDocumentSettings,
    checkRequiresActiveDocument,
    parseAndRouteCommand
};
