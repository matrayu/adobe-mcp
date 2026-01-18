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
const { getTextFrame, parseParagraphRange } = require("./utils");

/**
 * Get all paragraph styles in the document
 */
const getParagraphStyles = async (command) => {
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    const styles = doc.paragraphStyles.everyItem().getElements();
    const styleList = styles.map(style => {
        // Get basic properties safely
        let fontFamily = "";
        let fontSize = 0;

        try {
            if (style.appliedFont && style.appliedFont.isValid) {
                fontFamily = style.appliedFont.fontFamily || "";
            }
            fontSize = parseFloat(style.pointSize) || 0;
        } catch (e) {
            // Some properties might not be accessible
        }

        return {
            name: style.name,
            font: fontFamily,
            size: fontSize,
            isDefault: style.name === "[Basic Paragraph]"
        };
    });

    return {
        status: "SUCCESS",
        styles: styleList
    };
};

/**
 * Get all character styles in the document
 */
const getCharacterStyles = async (command) => {
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    const styles = doc.characterStyles.everyItem().getElements();
    const styleList = styles.map(style => ({
        name: style.name,
        description: ""  // UXP doesn't expose descriptions
    }));

    return {
        status: "SUCCESS",
        styles: styleList
    };
};

/**
 * Apply paragraph style to a range of paragraphs
 */
const applyParagraphStyle = async (command) => {
    const options = command.options;
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    const frame = getTextFrame(options.pageIndex, options.frameIndex);
    const style = doc.paragraphStyles.item(options.styleName);

    if (!style.isValid) {
        const available = doc.paragraphStyles.everyItem()
            .getElements().map(s => s.name);
        throw new Error(
            `Style '${options.styleName}' not found. Available styles: ${available.join(', ')}`
        );
    }

    const paragraphs = frame.paragraphs.everyItem().getElements();
    if (paragraphs.length === 0) {
        throw new Error("Frame has no paragraphs to style");
    }

    const range = parseParagraphRange(options.paragraphRange, paragraphs.length);
    let affectedCount = 0;

    for (let i = range.start; i <= range.end && i < paragraphs.length; i++) {
        paragraphs[i].applyParagraphStyle(style, true);
        affectedCount++;
    }

    return {
        status: "SUCCESS",
        styleApplied: options.styleName,
        frameIndex: options.frameIndex,
        paragraphsAffected: affectedCount,
        rangeApplied: options.paragraphRange
    };
};

/**
 * Apply character style to text found by searching
 */
const applyCharacterStyleToText = async (command) => {
    const options = command.options;
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    const frame = getTextFrame(options.pageIndex, options.frameIndex);
    const style = doc.characterStyles.item(options.styleName);

    if (!style.isValid) {
        const available = doc.characterStyles.everyItem()
            .getElements().map(s => s.name);
        throw new Error(
            `Style '${options.styleName}' not found. Available styles: ${available.join(', ')}`
        );
    }

    // Use InDesign's find/change API
    app.findTextPreferences = null;
    app.changeTextPreferences = null;
    app.findTextPreferences.findWhat = options.searchText;

    const foundItems = frame.findText();
    let styledCount = 0;

    if (options.occurrence === 0) {
        // All occurrences
        foundItems.forEach(item => {
            item.applyCharacterStyle(style, true);
            styledCount++;
        });
    } else {
        // Specific occurrence
        const targetIndex = options.occurrence - 1;
        if (foundItems[targetIndex]) {
            foundItems[targetIndex].applyCharacterStyle(style, true);
            styledCount = 1;
        }
    }

    app.findTextPreferences = null;

    return {
        status: "SUCCESS",
        styleApplied: options.styleName,
        searchText: options.searchText,
        occurrencesFound: foundItems.length,
        occurrencesStyled: styledCount
    };
};

/**
 * Create a new paragraph style
 */
const createParagraphStyle = async (command) => {
    const options = command.options;
    const doc = app.activeDocument;

    if (!doc) {
        throw new Error("No active document");
    }

    // Check if style already exists
    const existingStyle = doc.paragraphStyles.item(options.styleName);
    if (existingStyle.isValid) {
        throw new Error(`Style '${options.styleName}' already exists`);
    }

    // Create new style
    const newStyle = doc.paragraphStyles.add({ name: options.styleName });

    // Apply properties
    const props = options.properties;
    if (props.font) {
        try {
            newStyle.appliedFont = app.fonts.item(props.font);
        } catch (e) {
            throw new Error(`Invalid font name: ${props.font}`);
        }
    }
    if (props.size) {
        newStyle.pointSize = props.size;
    }
    if (props.leading) {
        newStyle.leading = props.leading;
    }
    if (props.color) {
        // Color handling would need proper color swatch creation
        // For now, skip complex color application
    }

    return {
        status: "SUCCESS",
        styleName: options.styleName,
        created: true,
        propertiesApplied: props
    };
};

module.exports = {
    getParagraphStyles,
    getCharacterStyles,
    applyParagraphStyle,
    applyCharacterStyleToText,
    createParagraphStyle
};
