# InDesign Workflows

Detailed step-by-step workflows for common document production tasks.

---

## Workflow 1: Book Layout from Manuscript

**Goal:** Transform a text file into a formatted book ready for print.

**Input:**
- Manuscript file (manuscript.txt, .docx, or .rtf)
- Page size (e.g., 6×9 inches)
- Desired margins
- Style preferences

**Output:** Multi-page InDesign document with formatted text, ready for PDF export.

### Step-by-Step

**Phase 1: Planning**

1. **Estimate page count:**
   ```bash
   python scripts/estimate_pages.py \
     --text-file manuscript.txt \
     --page-size "6x9" \
     --font-size 12 \
     --margins "0.75,0.75,0.75,0.75"
   ```

2. **Note requirements:**
   - Estimated pages: 287
   - Will need threading across ~287 frames
   - Chapter titles need Heading 1 style
   - Body text needs consistent formatting

**Phase 2: Document Creation**

3. **Create document:**
   ```python
   create_document(
       width=432,  # 6 inches * 72pt/inch
       height=648,  # 9 inches * 72pt/inch
       pages=1,  # Start with 1, add more as needed
       facing_pages=true,  # For book layout
       margins={"top": 54, "bottom": 54, "left": 54, "right": 54}  # 0.75"
   )
   ```

**Phase 3: Initial Frame Setup**

4. **Create first text frame:**
   ```python
   # Calculate frame bounds from margins
   create_text_frame(
       page_index=0,
       geometric_bounds=[54, 54, 594, 378]  # Respects margins
   )
   ```

**Phase 4: Text Import**

5. **Import manuscript:**
   ```python
   result = import_text_file(
       text_frame_index=0,
       file_path="/path/to/manuscript.txt",
       page_index=0,
       insertion_point=-1  # Append to end
   )
   ```

6. **Check overflow:**
   ```python
   overflow_check = detect_text_overflow(
       text_frame_index=0,
       page_index=0
   )

   if overflow_check['hasOverflow']:
       chars_overflow = overflow_check['overflowCharacterCount']
       pages_needed = ceil(chars_overflow / 2100)  # ~2100 chars/page
   ```

**Phase 5: Page Addition and Threading**

7. **Add pages:**
   ```python
   for i in range(pages_needed):
       add_page(location="AT_END")
   ```

8. **Create frames on new pages:**
   ```python
   for page_num in range(1, pages_needed + 1):
       create_text_frame(
           page_index=page_num,
           geometric_bounds=[54, 54, 594, 378]
       )
   ```

9. **Thread frames:**
   ```python
   for page_num in range(pages_needed):
       link_text_frames(
           source_frame_index=0,
           source_page_index=page_num,
           target_frame_index=0,
           target_page_index=page_num + 1
       )
   ```

**Phase 6: Style Application**

10. **List available styles:**
    ```python
    styles = get_paragraph_styles()
    # Example: ['[Basic Paragraph]', 'Body Text', 'Heading 1', 'Quote']
    ```

11. **Apply chapter title style:**
    ```python
    # For each page that starts a chapter (assume page 0, 15, 45, 78...)
    for chapter_page in [0, 15, 45, 78, ...]:
        apply_paragraph_style(
            style_name="Heading 1",
            text_frame_index=0,
            paragraph_range="first",
            page_index=chapter_page
        )
    ```

12. **Apply body text style:**
    ```python
    for page_num in range(total_pages):
        apply_paragraph_style(
            style_name="Body Text",
            text_frame_index=0,
            paragraph_range="1-999",  # All except first (title)
            page_index=page_num
        )
    ```

**Phase 7: Validation**

13. **Run document validation:**
    ```bash
    python scripts/validate_document.py \
      --check-overflow \
      --check-fonts \
      --check-styles
    ```

14. **Review results:**
    - All overflow resolved ✓
    - No missing fonts ✓
    - All styles applied correctly ✓

**Phase 8: Export**

15. **Validate PDF preset:**
    ```python
    presets = get_pdf_export_presets()
    # Choose appropriate preset for output type
    ```

16. **Run pre-flight:**
    ```bash
    python scripts/preflight_pdf.py \
      --preset "[High Quality Print]" \
      --output-type print
    ```

17. **Export PDF:**
    ```python
    export_pdf(
        file_path="/path/to/output/book.pdf",
        page_range="ALL",
        preset_name="[High Quality Print]"
    )
    ```

**Result:** 287-page formatted book ready for commercial printing.

---

## Workflow 2: Template-Based Document

**Goal:** Use an existing InDesign template and fill it with new content.

**Input:**
- InDesign template (.indt file)
- Content to import
- Understanding of template structure

**Output:** Customized document from template.

### Step-by-Step

**Phase 1: Template Discovery**

1. **Open template:**
   ```python
   doc_info = open_document(
       file_path="/path/to/template.indt"
   )
   # Returns: page_count, dimensions, text_frame_count
   ```

2. **Discover frame structure:**
   ```python
   # For each page in template
   for page_num in range(doc_info['page_count']):
       frames = get_text_frames(page_index=page_num)
       # Note which frames exist and their purposes
   ```

3. **Inspect first frame:**
   ```python
   frame_info = get_text_frame_info(
       text_frame_index=0,
       page_index=0
   )
   # Check: bounds, hasContent, overflow, linkedToNext
   ```

**Phase 2: Content Planning**

4. **Map content to frames:**
   ```
   Template structure:
   - Page 0, Frame 0: Title
   - Page 0, Frame 1: Author bio
   - Page 1+, Frame 0: Body text (threaded)

   Content mapping:
   - title.txt → Page 0, Frame 0
   - bio.txt → Page 0, Frame 1
   - manuscript.txt → Page 1, Frame 0 (with threading)
   ```

**Phase 3: Content Insertion**

5. **Insert title:**
   ```python
   insert_text(
       text_frame_index=0,
       text=title_content,
       page_index=0
   )
   ```

6. **Insert bio:**
   ```python
   insert_text(
       text_frame_index=1,
       text=bio_content,
       page_index=0
   )
   ```

7. **Import main content:**
   ```python
   import_text_file(
       text_frame_index=0,
       file_path="manuscript.txt",
       page_index=1
   )
   ```

**Phase 4: Overflow Handling**

8. **Check for overflow:**
   ```python
   overflow = detect_text_overflow(
       text_frame_index=0,
       page_index=1
   )
   ```

9. **If overflow exists:**
   - Check if template has pre-linked frames
   - If not, add pages and create/link frames (see Workflow 1)

**Phase 5: Style Application**

10. **List template styles:**
    ```python
    styles = get_paragraph_styles()
    # Use template's existing styles
    ```

11. **Apply styles based on template conventions**

**Phase 6: Save and Export**

12. **Save as new document:**
    ```python
    save_document_as(
        file_path="/path/to/new_document.indd"
    )
    ```

13. **Export as PDF** (see Workflow 1, Phase 8)

---

## Workflow 3: Quick PDF Export

**Goal:** Export existing InDesign document to print-ready PDF.

**Input:** Open InDesign document
**Output:** PDF file with correct settings

### Step-by-Step

**Phase 1: Document Validation**

1. **Get document info:**
   ```python
   doc_info = get_document_info()
   # Check page_count, modified status
   ```

2. **Run validation:**
   ```bash
   python scripts/validate_document.py \
     --check-overflow \
     --check-fonts
   ```

3. **Fix any issues before export**

**Phase 2: Preset Selection**

4. **List available presets:**
   ```python
   presets = get_pdf_export_presets()
   # Example: ['[High Quality Print]', '[Press Quality]', ...]
   ```

5. **Choose based on output type:**
   | Output | Preset |
   |--------|--------|
   | Commercial printing | [Press Quality] |
   | Home printer | [High Quality Print] |
   | Digital/Email | [Smallest File Size] |

**Phase 3: Pre-Flight**

6. **Run pre-flight check:**
   ```bash
   python scripts/preflight_pdf.py \
     --preset "[Press Quality]" \
     --output-type print
   ```

7. **Review pre-flight results:**
   - Color space: CMYK ✓
   - Resolution: 300dpi ✓
   - Preset exists ✓

**Phase 4: Export**

8. **Export with settings:**
   ```python
   export_pdf(
       file_path="/path/to/output.pdf",
       page_range="ALL",
       preset_name="[Press Quality]"
   )
   ```

9. **Verify export:**
   - Check file was created
   - Check file size is reasonable
   - Quick visual inspection

**Result:** Print-ready PDF in under 2 minutes.

---

## Workflow 4: Manuscript Formatting Automation

**Goal:** Automatically format imported manuscript with consistent styles.

**Input:** Raw text file with chapter markers
**Output:** Fully formatted document

### Step-by-Step

**Phase 1: Content Analysis**

1. **Analyze manuscript structure:**
   - Identify chapter markers (e.g., "Chapter 1", "CHAPTER ONE")
   - Count chapters
   - Estimate total pages

2. **Run estimation:**
   ```bash
   python scripts/estimate_pages.py --text-file manuscript.txt
   ```

**Phase 2: Document Setup**

3. **Create appropriately-sized document:**
   ```python
   create_document(width=432, height=648, pages=estimated_pages)
   ```

4. **Create and thread frames** (see Workflow 1)

**Phase 3: Import and Initial Styling**

5. **Import text:**
   ```python
   import_text_file(text_frame_index=0, file_path="manuscript.txt")
   ```

6. **Apply base body text style:**
   ```python
   apply_paragraph_style("Body Text", 0, "all", 0)
   ```

**Phase 4: Chapter Title Styling**

7. **Find and style chapter titles:**
   ```python
   # For each chapter start pattern
   for chapter_pattern in ["Chapter 1", "Chapter 2", ...]:
       apply_character_style_to_text(
           style_name="Chapter Title",
           search_text=chapter_pattern,
           text_frame_index=0,
           occurrence=1  # First occurrence only
       )
   ```

8. **Apply paragraph style to chapter titles:**
   - This requires knowing paragraph indices
   - May need to manually apply first paragraph after import

**Phase 5: Special Text Styling**

9. **Apply emphasis to specific phrases:**
   ```python
   apply_character_style_to_text(
       style_name="Italic",
       search_text=specific_phrase,
       occurrence=0  # All occurrences
   )
   ```

**Phase 6: Validation and Export**

10. **Validate** (see Workflow 3)
11. **Export** (see Workflow 3)

---

## Workflow 5: Adding Images to Layout

**Goal:** Place memoir photos or illustrations in document.

**Input:**
- Open InDesign document
- Image files (JPG, PNG, TIFF)
- Desired placement locations

**Output:** Document with images placed and formatted.

### Step-by-Step

**Phase 1: Planning**

1. **Identify image placement:**
   - Which pages need images?
   - Where on each page?
   - What size should images be?

2. **Prepare image files:**
   - Ensure resolution is adequate (300dpi for print)
   - Verify file format is supported
   - Check file paths are accessible

**Phase 2: Page Preparation**

3. **Add pages if needed:**
   ```python
   add_page(location="AFTER", reference_page=5)
   ```

4. **Note available space:**
   - Check text frame bounds
   - Calculate available space for images

**Phase 3: Image Placement**

5. **Place first image:**
   ```python
   place_image(
       file_path="/path/to/photo1.jpg",
       page_index=2,
       position=[100, 100],  # [x, y] from page origin
       fit_option="PROPORTIONALLY"  # Maintains aspect ratio
   )
   ```

6. **Place additional images:**
   ```python
   for img_info in image_placements:
       place_image(
           file_path=img_info['path'],
           page_index=img_info['page'],
           position=img_info['position'],
           fit_option="PROPORTIONALLY"
       )
   ```

**Phase 4: Adjustment**

7. **Verify placement:**
   - Check images don't overlap text
   - Ensure images are within page bounds
   - Verify resolution is adequate

8. **Adjust if needed:**
   - May need to manually adjust in InDesign
   - MCP tools provide initial placement

**Phase 5: Export**

9. **Export with images:**
   ```python
   export_pdf(
       file_path="document_with_images.pdf",
       preset_name="[High Quality Print]"
   )
   ```

---

## Common Workflow Patterns

### Pattern 1: Add Pages Until No Overflow

```python
def resolve_overflow(frame_index, page_index):
    while True:
        overflow = detect_text_overflow(frame_index, page_index)
        if not overflow['hasOverflow']:
            break

        # Add page
        current_pages = get_document_info()['page_count']
        add_page(location="AT_END")

        # Create frame on new page
        new_page = current_pages
        create_text_frame(page_index=new_page, geometric_bounds=[54, 54, 594, 378])

        # Link from last page to new page
        link_text_frames(
            source_frame_index=0, source_page_index=new_page - 1,
            target_frame_index=0, target_page_index=new_page
        )
```

### Pattern 2: Apply Styles to Range

```python
def apply_styles_to_document(total_pages):
    for page_num in range(total_pages):
        # First paragraph: heading
        apply_paragraph_style("Heading 1", 0, "first", page_num)

        # Remaining paragraphs: body
        apply_paragraph_style("Body Text", 0, "1-999", page_num)
```

### Pattern 3: Batch Style Application

```python
def batch_apply_character_styles(style_mappings):
    """
    style_mappings = {
        "Book Title": ["The Great Gatsby", "1984"],
        "Emphasis": ["very important", "critical point"]
    }
    """
    for style_name, phrases in style_mappings.items():
        for phrase in phrases:
            apply_character_style_to_text(
                style_name=style_name,
                search_text=phrase,
                occurrence=0  # All occurrences
            )
```

### Pattern 4: Safe Export with Validation

```python
def safe_export(output_path, preset_name="[High Quality Print]"):
    # Step 1: Validate document
    validation = run_script("validate_document.py")
    if validation['exit_code'] != 0:
        raise ValueError(f"Validation failed: {validation['errors']}")

    # Step 2: Validate preset
    presets = get_pdf_export_presets()
    if preset_name not in [p['name'] for p in presets['presets']]:
        raise ValueError(f"Preset '{preset_name}' not found")

    # Step 3: Pre-flight
    preflight = run_script("preflight_pdf.py", preset=preset_name)
    if preflight['exit_code'] != 0:
        print(f"Pre-flight warnings: {preflight['warnings']}")

    # Step 4: Export
    result = export_pdf(output_path, "ALL", preset_name)
    return result
```

---

## Workflow Decision Tree

```
User Request
    │
    ├─ "Format my manuscript"
    │   → Workflow 1: Book Layout
    │
    ├─ "Use this template"
    │   → Workflow 2: Template-Based
    │
    ├─ "Export to PDF"
    │   → Workflow 3: Quick PDF Export
    │
    ├─ "Apply styles automatically"
    │   → Workflow 4: Manuscript Formatting
    │
    └─ "Add photos to my book"
        → Workflow 5: Adding Images
```

---

## Troubleshooting Workflows

### Issue: Text Not Appearing After Import

**Symptoms:** `import_text_file()` succeeds but no text visible.

**Diagnosis:**
1. Check frame bounds are within page
2. Check frame is on correct page
3. Check text didn't go to overflow immediately

**Solution:**
```python
# Verify frame exists and is valid
frames = get_text_frames(page_index=0)
print(f"Frames on page 0: {len(frames)}")

# Check frame info
info = get_text_frame_info(text_frame_index=0, page_index=0)
print(f"Content length: {info['contentLength']}")
print(f"Has overflow: {info['hasOverflow']}")
```

### Issue: Style Not Applying

**Symptoms:** `apply_paragraph_style()` returns success but formatting unchanged.

**Diagnosis:**
1. Check style name is exact match (case-sensitive)
2. Verify style exists in document
3. Check paragraph range is valid

**Solution:**
```python
# List available styles
styles = get_paragraph_styles()
print(f"Available: {[s['name'] for s in styles['styles']]}")

# Verify exact name
if "Body Text" in [s['name'] for s in styles['styles']]:
    apply_paragraph_style("Body Text", 0, "all", 0)
else:
    print("Style 'Body Text' not found - check spelling")
```

### Issue: Export Produces Low-Quality PDF

**Symptoms:** PDF exports but looks pixelated or colors are wrong.

**Diagnosis:**
1. Check preset used
2. Verify resolution settings
3. Check color space (CMYK vs RGB)

**Solution:**
```bash
# Run pre-flight to diagnose
python scripts/preflight_pdf.py --preset "[Current Preset]" --output-type print

# Use correct preset for output type
# Print: [Press Quality] or [High Quality Print]
# Digital: [Smallest File Size]
```

---

## Best Practices by Workflow

### Book Layout
- Estimate pages before starting
- Create all pages at once
- Thread sequentially (page 0→1→2, not random)
- Apply styles after all text is placed
- Always check final page for overflow

### Template-Based
- Discover structure before modifying
- Map content to frames before importing
- Respect template's style system
- Save as new document, don't overwrite template

### PDF Export
- Always run validation first
- Choose preset before starting
- Run pre-flight checks
- Verify file creation and size

### Manuscript Formatting
- Analyze structure before importing
- Apply broad styles (body text) first
- Apply specific styles (chapters) second
- Validate overflow at each step
- Use character styles sparingly
