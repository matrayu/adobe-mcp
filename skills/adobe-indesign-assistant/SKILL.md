---
name: adobe-indesign-assistant
description: Expert guide for InDesign document creation and publishing workflows. Orchestrates 22 InDesign MCP tools for book layout, manuscript formatting, and print-ready PDF export. Understands frames, threading, styles, and print production requirements.
license: MIT
metadata:
  version: 1.0.0
  target_users: publishers, content creators, designers
  workflows: book_layout, manuscript_import, pdf_export
---

# Adobe InDesign Assistant

Expert automation for InDesign document production workflows.

---

## Quick Start

Transform natural language into InDesign workflows:

```
Format my 300-page manuscript for 6x9 print with chapter styles
```

```
Open this template and import my memoir text
```

```
Export print-ready PDF with bleed settings
```

The assistant will orchestrate the 22 InDesign MCP tools, validate inputs, detect overflow, and guide you through any issues.

---

## Triggers

**Natural language activation:**
- "Format my manuscript for InDesign"
- "Create a book layout from this text"
- "Import my document and apply styles"
- "Export print-ready PDF"
- "Check my InDesign document for errors"

**Workflow-specific:**
- "Book layout workflow"
- "Manuscript import workflow"
- "PDF export workflow"

---

## Core Workflows

| Workflow | What It Does | Key Steps |
|----------|--------------|-----------|
| **Book Layout** | Create multi-page book from template | Open template → Discover frames → Apply styles → Manage pages |
| **Manuscript Import** | Import long text with formatting | Validate file → Import text → Detect overflow → Thread frames |
| **PDF Export** | Create print-ready PDF | Validate presets → Pre-flight check → Export with settings |
| **Template Setup** | Configure new document | Set dimensions → Create master frames → Define styles |

---

## How It Works

### Phase 1: Discovery
Understand your document structure before making changes.

**For templates:**
- Open document with `open_document()`
- Discover existing frames with `get_text_frames()`
- Check available styles with `get_paragraph_styles()`

**For new documents:**
- Get user requirements (size, margins, pages)
- Create document with `create_document()`
- Set up initial text frames

### Phase 2: Content Import
Bring in your text with automatic overflow handling.

**Steps:**
1. Validate text file exists and format is supported (.txt, .docx, .rtf)
2. Import with `import_text_file()`
3. Detect overflow with `detect_text_overflow()`
4. If overflow:
   - Calculate pages needed
   - Add pages with `add_page()`
   - Create frames with `create_text_frame()`
   - Link with `link_text_frames()`

### Phase 3: Formatting
Apply consistent styles across your document.

**Steps:**
1. List available styles
2. Validate style names exist
3. Apply paragraph styles by range
4. Apply character styles to specific text

**Example sequence:**
```
get_paragraph_styles() → ["Body Text", "Heading 1", "Quote"]
apply_paragraph_style("Heading 1", frame_index=0, paragraph_range="first")
apply_paragraph_style("Body Text", frame_index=0, paragraph_range="1-999")
```

### Phase 4: Validation
Check for common issues before export.

**Automated checks:**
- Text overflow detection (no silent content loss)
- Missing styles validation
- Frame bounds within page dimensions
- PDF preset availability

### Phase 5: Export
Produce print-ready or digital PDF output.

**Steps:**
1. List available presets with `get_pdf_export_presets()`
2. Validate preset for output type
3. Run pre-flight script
4. Export with `export_pdf()`

---

## InDesign Concepts

<details>
<summary><strong>Understanding Frames</strong></summary>

InDesign uses a **frame-based layout model** (unlike word processors):

| Concept | Description | Why It Matters |
|---------|-------------|----------------|
| **Text Frame** | Container that holds text | All text must be in a frame |
| **Frame Bounds** | `[top, left, bottom, right]` in points | Defines frame position/size |
| **Page-Specific Index** | Frame 0 on page 1 ≠ Frame 0 on page 2 | Always specify page index |
| **Threading** | Linking frames for text flow | Enables text across pages |
| **Overflow** | Text that doesn't fit in frame | Must be detected and handled |

**Key insight:** You create frames first, then fill them with content. This is opposite of word processors where content creates layout.

</details>

<details>
<summary><strong>Text Threading</strong></summary>

**Threading** links frames so text flows from one to the next when the first frame overflows.

**When to use:**
- Long documents (books, magazines)
- Multi-page layouts
- Consistent text flow

**How threading works:**
```
Page 1, Frame 0 → Page 2, Frame 0 → Page 3, Frame 0
    (500 words)      (500 words)      (remaining)
```

**MCP implementation:**
```
link_text_frames(
    source_frame_index=0, source_page_index=0,
    target_frame_index=0, target_page_index=1
)
```

</details>

<details>
<summary><strong>Paragraph vs Character Styles</strong></summary>

| Style Type | Applies To | Use Case | Example |
|------------|------------|----------|---------|
| **Paragraph** | Entire paragraph | Body text, headings, quotes | "Body Text", "Heading 1" |
| **Character** | Selected text within paragraph | Emphasis, special formatting | "Italic", "Bold", "Book Title" |

**Hierarchy:** Paragraph styles set the base; character styles override for specific text.

**Best practice:** Apply paragraph styles first (broad), then character styles (specific).

</details>

<details>
<summary><strong>Points and Coordinates</strong></summary>

**Units:** InDesign uses **points** (72pt = 1 inch)

**Coordinate system:**
- Origin: Top-left corner of PAGE (not printable area)
- Format: `[top, left, bottom, right]`
- Example: `[72, 72, 500, 400]` = frame starting 1" from top-left

**Common page sizes:**
- US Letter: 612 × 792 pt (8.5" × 11")
- 6×9 book: 432 × 648 pt
- A4: 595 × 842 pt

</details>

---

## Scripts

This skill includes Python scripts for autonomous validation and verification.

### validate_document.py

**Purpose:** Check document health before operations

**Usage:**
```bash
python ~/.claude/skills/adobe-indesign-assistant/scripts/validate_document.py \
  --check-overflow \
  --check-fonts \
  --check-styles
```

**Checks:**
- Text overflow across all pages
- Missing or substituted fonts
- Applied styles that don't exist in document
- Frames outside page bounds

**Exit codes:**
- 0: All checks passed
- 10: Validation warnings (non-critical)
- 11: Validation failures (critical)

### preflight_pdf.py

**Purpose:** Validate PDF export settings before export

**Usage:**
```bash
python ~/.claude/skills/adobe-indesign-assistant/scripts/preflight_pdf.py \
  --preset "[High Quality Print]" \
  --output-type print
```

**Checks:**
- Preset exists in document
- Preset appropriate for output type
- Resolution sufficient for print (if applicable)
- Color space correct (CMYK for print, RGB for digital)

### estimate_pages.py

**Purpose:** Calculate page count from text file

**Usage:**
```bash
python ~/.claude/skills/adobe-indesign-assistant/scripts/estimate_pages.py \
  --text-file manuscript.txt \
  --page-size "6x9" \
  --font-size 12 \
  --margins "0.75,0.75,0.75,0.75"
```

**Output:**
```
Estimated pages: 287
Word count: 85,432
Characters per page: ~2,100
```

---

## Validation & Error Recovery

### Pre-Operation Validation

Before calling MCP tools, the skill validates:

| Check | Prevents | Recovery |
|-------|----------|----------|
| File exists | "File not found" errors | Ask user for correct path |
| Frame index valid | "Frame not found" errors | List available frames |
| Style exists | Style application failures | List available styles, offer creation |
| Preset exists | PDF export failures | List available presets |

### Post-Operation Validation

After calling MCP tools, the skill checks:

| Operation | Check | Action if Failed |
|-----------|-------|------------------|
| `insert_text()` | Overflow status | Guide frame linking or page addition |
| `apply_paragraph_style()` | Paragraphs affected > 0 | Report issue, suggest alternatives |
| `export_pdf()` | File created | Check permissions, disk space |

### Common Issues

<details>
<summary><strong>Text Overflow Detected</strong></summary>

**Problem:** Text doesn't fit in frame, content hidden.

**Automatic recovery:**
1. Detect overflow with `detect_text_overflow()`
2. Calculate pages needed based on overflow character count
3. Add pages with `add_page()`
4. Create frames on new pages
5. Link frames with `link_text_frames()`

**User sees:**
```
✓ Imported 85,432 characters
⚠ Overflow detected: 12,453 characters need additional frames
→ Adding 5 pages to accommodate overflow
→ Creating frames and threading text
✓ Text flow complete across 6 pages
```

</details>

<details>
<summary><strong>Style Not Found</strong></summary>

**Problem:** Trying to apply a style that doesn't exist.

**Recovery:**
1. List available styles with `get_paragraph_styles()`
2. Show user available options
3. Offer to create style if desired
4. Apply alternative or create new

**User sees:**
```
✗ Style "Chapter Title" not found
Available paragraph styles: Body Text, Heading 1, Heading 2, Quote
Would you like to:
1. Use an existing style
2. Create "Chapter Title" style
```

</details>

---

## Anti-Patterns

| Avoid | Why | Instead |
|-------|-----|---------|
| Assuming global frame indices | Indices are page-specific | Always specify page_index |
| Not checking overflow | Silent content loss | Use `detect_text_overflow()` after text operations |
| Applying styles blindly | Fails if style doesn't exist | List styles first, validate before applying |
| Exporting without validation | May fail or produce low-quality output | Run pre-flight checks |
| Creating frames outside page | Frames won't be visible | Validate bounds against page dimensions |

---

## Verification Checklist

After workflow completion:

**Document Structure:**
- [ ] All frames within page bounds
- [ ] Text threading correct (no broken links)
- [ ] No overflow (or intentional)

**Content:**
- [ ] All text imported successfully
- [ ] Styles applied as intended
- [ ] Images placed correctly

**Export:**
- [ ] PDF preset validated
- [ ] Export completed without errors
- [ ] File size reasonable for content

---

## Example Workflows

<details>
<summary><strong>Complete Book Layout</strong></summary>

**User request:** "Format my memoir manuscript for 6x9 print with chapter titles"

**Skill execution:**

1. **Validate input:**
   ```
   Check manuscript.txt exists ✓
   Validate 6x9 dimensions (432×648pt) ✓
   ```

2. **Setup document:**
   ```
   create_document(width=432, height=648, facing_pages=true)
   create_text_frame(page_index=0, geometric_bounds=[72, 72, 576, 360])
   ```

3. **Import and format:**
   ```
   import_text_file(frame_index=0, file_path="manuscript.txt")
   detect_text_overflow(frame_index=0, page_index=0)
   → Overflow detected: 45,123 characters

   # Add pages and thread
   add_page(location="AT_END") × 15
   create_text_frame(page_index=1, bounds=[72, 72, 576, 360]) × 15
   link_text_frames(source=0, target=0, source_page=0, target_page=1)
   # ... continue threading
   ```

4. **Apply styles:**
   ```
   get_paragraph_styles() → ["Body Text", "Heading 1", ...]

   # For each page with chapter start:
   apply_paragraph_style("Heading 1", frame=0, range="first", page=i)
   apply_paragraph_style("Body Text", frame=0, range="1-999", page=i)
   ```

5. **Validate and export:**
   ```
   Run validate_document.py → All checks passed ✓
   get_pdf_export_presets() → ["[High Quality Print]", ...]
   Run preflight_pdf.py --preset "[High Quality Print]" ✓
   export_pdf(file_path="memoir_print.pdf", preset="[High Quality Print]")
   ```

**Result:** 16-page formatted memoir ready for print production

</details>

---

## Extension Points

1. **New Workflows:** Add magazine layout, brochure design as MCP tools expand
2. **Advanced Validation:** Color profile checks, font embedding validation
3. **Batch Processing:** Process multiple manuscripts sequentially
4. **Template Library:** Pre-configured templates for common formats
5. **Style Management:** Import/export style libraries across documents

---

## Related Skills

| Skill | Relationship |
|-------|--------------|
| adobe-photoshop-assistant | Image prep before placement |
| adobe-premiere-assistant | Video content for interactive PDFs |
| pdf-validator | Additional PDF quality checks |

---

## Technical Notes

**MCP Tool Dependencies:**
- Requires InDesign MCP server running (`adobe-indesign`)
- Requires proxy server on port 3001
- InDesign application must be running with UXP plugin loaded

**Coordinate System:**
- Origin: Top-left of page
- Units: Points (72pt = 1")
- Bounds format: [top, left, bottom, right]

**Frame Indexing:**
- Page-specific (frame 0 on page 1 ≠ frame 0 on page 2)
- Zero-based indexing
- Created frames appended to end of page's frame list

**Threading Behavior:**
- Text flows automatically when frames linked
- Unlinking doesn't delete text (returns to source frame as overflow)
- Circular links prevented by system

---

## Changelog

### v1.0.0 (2026-01-17)
- Initial release with 3 core workflows
- 22 InDesign MCP tools orchestrated
- Validation scripts for autonomous operation
- Pre-flight checks for PDF export
- Comprehensive error recovery patterns
