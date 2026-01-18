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

const { app, LocationOptions } = require("indesign");

/**
 * Add a new page to the document
 */
const addPage = async (command) => {
    const options = command.options;
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    let locationOption;
    let referencePage = null;

    switch (options.location) {
        case "AT_BEGINNING":
            locationOption = LocationOptions.AT_BEGINNING;
            break;
        case "AT_END":
            locationOption = LocationOptions.AT_END;
            break;
        case "AFTER":
            locationOption = LocationOptions.AFTER;
            if (options.referencePage === null || options.referencePage === undefined) {
                throw new Error("reference_page is required when location is AFTER");
            }
            referencePage = doc.pages.item(options.referencePage);
            if (!referencePage.isValid) {
                throw new Error(`Invalid reference page: ${options.referencePage}`);
            }
            break;
        case "BEFORE":
            locationOption = LocationOptions.BEFORE;
            if (options.referencePage === null || options.referencePage === undefined) {
                throw new Error("reference_page is required when location is BEFORE");
            }
            referencePage = doc.pages.item(options.referencePage);
            if (!referencePage.isValid) {
                throw new Error(`Invalid reference page: ${options.referencePage}`);
            }
            break;
        default:
            locationOption = LocationOptions.AT_END;
    }

    let newPage;
    if (referencePage) {
        newPage = doc.pages.add(locationOption, referencePage);
    } else {
        newPage = doc.pages.add(locationOption);
    }

    // Get the index of the newly created page
    const pages = doc.pages.everyItem().getElements();
    const pageIndex = pages.indexOf(newPage);

    return {
        status: "SUCCESS",
        pageAdded: pageIndex,
        totalPages: pages.length,
        location: options.location
    };
};

module.exports = {
    addPage
};
