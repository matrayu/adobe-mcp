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

const { app, FitOptions } = require("indesign");
const { getFileEntry } = require("./utils");

/**
 * Place an image on a page
 */
const placeImage = async (command) => {
    const options = command.options;
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    const page = doc.pages.item(options.pageIndex);
    if (!page.isValid) {
        throw new Error(`Invalid page index: ${options.pageIndex}`);
    }

    const file = await getFileEntry(options.filePath);

    // Place the image on the page
    const graphics = page.place(file);
    if (!graphics || graphics.length === 0) {
        throw new Error("Failed to place image");
    }

    const graphic = graphics[0];
    const frame = graphic.parent;

    // Apply fit option
    let fitOption;
    switch (options.fitOption) {
        case "PROPORTIONALLY":
            fitOption = FitOptions.PROPORTIONALLY;
            break;
        case "FILL_PROPORTIONALLY":
            fitOption = FitOptions.FILL_PROPORTIONALLY;
            break;
        case "FIT_CONTENT_TO_FRAME":
            fitOption = FitOptions.CONTENT_TO_FRAME;
            break;
        case "FIT_FRAME_TO_CONTENT":
            fitOption = FitOptions.FRAME_TO_CONTENT;
            break;
        default:
            fitOption = FitOptions.PROPORTIONALLY;
    }

    frame.fit(fitOption);

    // Apply position if specified
    if (options.position && options.position.length === 2) {
        const [x, y] = options.position;
        frame.move([y, x]);  // InDesign uses [y, x] order for move
    }

    // Get frame index on the page
    const frameIndex = page.allPageItems.everyItem().getElements().indexOf(frame);

    // Get final position and dimensions
    const bounds = frame.geometricBounds;
    const width = parseFloat(bounds[3] - bounds[1]);
    const height = parseFloat(bounds[2] - bounds[0]);

    return {
        status: "SUCCESS",
        imagePlaced: options.filePath,
        frameIndex: frameIndex,
        pageIndex: options.pageIndex,
        finalPosition: [parseFloat(bounds[1]), parseFloat(bounds[0])],
        dimensions: {
            width: width,
            height: height
        },
        fitMethodUsed: options.fitOption
    };
};

module.exports = {
    placeImage
};
