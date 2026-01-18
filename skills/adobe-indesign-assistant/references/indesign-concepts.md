# InDesign Concepts Reference

Deep dive into InDesign's architecture and terminology.

---

## Frame-Based Layout Model

### Core Principle

InDesign uses **containers (frames) that hold content**, unlike word processors where content creates layout.

```
Word Processor Model:     InDesign Model:
Type text → Layout        Create frame → Add text
```

### Frame Types

| Frame Type | Contains | Created By |
|------------|----------|------------|
| Text Frame | Text content | `create_text_frame()` |
| Graphics Frame | Images | `place_image()` |
| Unassigned Frame | Nothing yet | Manual creation in InDesign |

### Frame Properties

```
TextFrame:
├── geometricBounds: [top, left, bottom, right]
├── contents: string
├── overflows: boolean
├── nextTextFrame: TextFrame or null
├── previousTextFrame: TextFrame or null
└── parentPage: Page
```

---

## Page-Specific Indexing

**Critical concept:** Frame indices are relative to their page, not the document.

### Example

```
Document with 3 pages:

Page 0:
  Frame 0 (first frame on page 0)
  Frame 1 (second frame on page 0)

Page 1:
  Frame 0 (first frame on page 1) ← DIFFERENT from page 0 frame 0
  Frame 1 (second frame on page 1)

Page 2:
  Frame 0 (first frame on page 2)
```

### Implications

**Wrong:**
```python
# This targets frame 0 on page 0, not frame 0 on page 1!
insert_text(text_frame_index=0, text="Page 2 content", page_index=1)
# Will insert into page 1's frame 0, which may not be what you want
```

**Right:**
```python
# Always think: "Which frame on which page?"
get_text_frames(page_index=1)  # See what frames exist
insert_text(text_frame_index=0, text="Page 2 content", page_index=1)
```

---

## Text Threading

### What Is Threading?

Linking frames so text flows from one to the next automatically when overflow occurs.

### Thread Chain

```
[Frame A] --next--> [Frame B] --next--> [Frame C]
    ↑                   ↑                   ↑
  previous          previous            previous
```

### Threading Rules

1. **Direction:** One-way flow (A → B, not B → A)
2. **Single next:** Each frame has 0 or 1 next frame
3. **Single previous:** Each frame has 0 or 1 previous frame
4. **No circles:** A → B → A is prevented

### Threading Operations

| Operation | MCP Tool | Result |
|-----------|----------|--------|
| Link frames | `link_text_frames()` | Text flows source → target |
| Unlink frames | Not available | Text returns to source as overflow |
| Check link status | `get_text_frame_info()` | Returns next/previous frame indices |

### Threading Workflow

**Step 1: Create frames**
```python
create_text_frame(page_index=0, geometric_bounds=[72, 72, 500, 400])
create_text_frame(page_index=1, geometric_bounds=[72, 72, 500, 400])
create_text_frame(page_index=2, geometric_bounds=[72, 72, 500, 400])
```

**Step 2: Insert text into first frame**
```python
insert_text(text_frame_index=0, text="Long text...", page_index=0)
detect_text_overflow(text_frame_index=0, page_index=0)
# Returns: hasOverflow=true, overflowCharacterCount=5000
```

**Step 3: Thread frames**
```python
link_text_frames(
    source_frame_index=0, source_page_index=0,
    target_frame_index=0, target_page_index=1
)
link_text_frames(
    source_frame_index=0, source_page_index=1,
    target_frame_index=0, target_page_index=2
)
```

**Result:** Text flows automatically across all 3 pages.

---

## Styles System

### Style Hierarchy

```
Document
├── Paragraph Styles
│   ├── [Basic Paragraph] (default)
│   ├── Body Text
│   ├── Heading 1
│   ├── Heading 2
│   └── Quote
└── Character Styles
    ├── [None] (default)
    ├── Bold
    ├── Italic
    └── Book Title
```

### Paragraph Styles

**Scope:** Entire paragraph (from line break to line break)

**Properties:**
- Font family and size
- Line spacing (leading)
- Paragraph spacing (before/after)
- Alignment (left, right, center, justified)
- Indentation
- Tab stops

**Application:**
```python
apply_paragraph_style(
    style_name="Body Text",
    text_frame_index=0,
    paragraph_range="all",  # or "first", "last", "0-5"
    page_index=0
)
```

### Character Styles

**Scope:** Selected text within a paragraph

**Properties:**
- Font family and size override
- Font style (bold, italic)
- Color
- Underline, strikethrough
- Baseline shift

**Application:**
```python
# Find and style specific text
apply_character_style_to_text(
    style_name="Book Title",
    search_text="The Great Gatsby",
    text_frame_index=0,
    occurrence=0,  # 0 = all, 1 = first, etc.
    page_index=0
)
```

### Style vs Local Formatting

| Approach | Pros | Cons |
|----------|------|------|
| **Styles** | Consistent, updatable, professional | Requires setup |
| **Local Formatting** | Quick, flexible | Inconsistent, hard to update |

**Best practice:** Always use styles for production documents.

---

## Overflow

### What Is Overflow?

Text that doesn't fit in a frame. Overflow is **hidden** but not deleted.

### Overflow Scenarios

```
Scenario 1: Single frame, no threading
[Frame with 1000 chars capacity]
Insert 1500 chars
Result: 1000 visible, 500 overflow (hidden)

Scenario 2: Threaded frames
[Frame A: 1000 cap] → [Frame B: 1000 cap]
Insert 1500 chars into A
Result: A shows 1000, B shows 500, no overflow

Scenario 3: Insufficient threading
[Frame A] → [Frame B]
Insert 3000 chars
Result: A full, B full, 1000 overflow (hidden)
```

### Detecting Overflow

**Always check after text operations:**
```python
result = insert_text(frame_index=0, text="Long text...", page_index=0)

if result['overflow']:
    chars_hidden = result['overflowCharacterCount']
    print(f"Warning: {chars_hidden} characters hidden!")
    # Take action: add pages, create frames, thread
```

### Overflow Recovery

**Automatic recovery pattern:**
1. Detect overflow
2. Calculate pages needed (chars_overflow / chars_per_page)
3. Add pages
4. Create frames on new pages
5. Thread all frames
6. Verify no remaining overflow

---

## Coordinate System

### Origin and Units

- **Origin:** Top-left corner of page (not printable area)
- **Units:** Points (pt), where 72pt = 1 inch
- **Direction:** Right = +X, Down = +Y

### Geometric Bounds Format

```
[top, left, bottom, right]

Example:
[72, 72, 500, 400]
     ↓   ↓    ↓    ↓
    1"  1"  ~7"  ~5.5"

Creates frame:
- Starting 1" from top edge
- Starting 1" from left edge
- Ending ~7" from top edge (height = 6")
- Ending ~5.5" from left edge (width = 4.5")
```

### Common Page Sizes

| Format | Dimensions (pts) | Dimensions (inches) | Use Case |
|--------|------------------|---------------------|----------|
| US Letter | 612 × 792 | 8.5" × 11" | General documents |
| Legal | 612 × 1008 | 8.5" × 14" | Legal documents |
| 6×9 Book | 432 × 648 | 6" × 9" | Trade paperback |
| 5×8 Book | 360 × 576 | 5" × 8" | Digest size |
| A4 | 595 × 842 | 8.27" × 11.69" | International standard |

### Margin Calculation

To create frame respecting margins:

```python
page_width = 612  # US Letter
page_height = 792
margin_top = 72  # 1"
margin_bottom = 72
margin_left = 72
margin_right = 72

frame_bounds = [
    margin_top,                          # top
    margin_left,                         # left
    page_height - margin_bottom,         # bottom
    page_width - margin_right            # right
]
# Result: [72, 72, 720, 540]
```

---

## PDF Export

### Export Presets

**Built-in presets:**
- `[High Quality Print]` - CMYK, 300dpi, for commercial printing
- `[Press Quality]` - CMYK, 300dpi, PDF/X-1a compliant
- `[Smallest File Size]` - RGB, 72dpi, for email/web
- `[PDF/X-4:2008]` - Modern press standard

### Preset Selection Guide

| Output Type | Recommended Preset | Color Space | Resolution |
|-------------|-------------------|-------------|------------|
| Commercial print | [Press Quality] | CMYK | 300dpi |
| Home printer | [High Quality Print] | CMYK | 300dpi |
| Digital distribution | [Smallest File Size] | RGB | 72-150dpi |
| Print-on-demand | [PDF/X-4:2008] | CMYK | 300dpi |

### Page Range Syntax

```python
"ALL"           # All pages
"1-5"           # Pages 1 through 5
"1,3,5"         # Pages 1, 3, and 5
"1-5,10"        # Pages 1-5 and page 10
"1-"            # Page 1 to end
"-5"            # Start to page 5
```

---

## Print Production Concepts

### Bleed

**Definition:** Extension of content beyond trim edge (typically 0.125")

**Purpose:** Ensures no white edges if trimming is slightly off

**Implementation:** Extend frame bounds beyond page edge by bleed amount

### Slug

**Definition:** Non-printing area outside bleed for production notes

**Use case:** Color bars, registration marks, job info

### Color Spaces

| Space | Use Case | Channels |
|-------|----------|----------|
| RGB | Digital (screen) | Red, Green, Blue |
| CMYK | Print | Cyan, Magenta, Yellow, Black |
| Pantone | Spot colors | Single ink |

**Critical:** Always use CMYK for commercial print, RGB for digital.

### Resolution

| Type | Minimum | Recommended | Use |
|------|---------|-------------|-----|
| Text | 300dpi | 300dpi | Body copy |
| Photos | 300dpi | 300dpi | Photo books |
| Line art | 600dpi | 1200dpi | Logos, diagrams |
| Web/Digital | 72dpi | 150dpi | Screen viewing |

---

## Master Pages

### Concept

Template pages that apply consistent layout to multiple pages.

**Use cases:**
- Page numbers
- Headers/footers
- Consistent frame placement
- Background elements

**MCP support:** Not currently available (would require new MCP tools)

**Workaround:** Create frames consistently on each page with scripts.

---

## Best Practices

### Document Setup

1. **Define page size first** - Changing later breaks existing frames
2. **Set margins early** - Affects frame placement
3. **Create master frames** - Template for consistent layout
4. **Define styles upfront** - Harder to retrofit later

### Text Workflow

1. **Import to single frame first** - See total overflow
2. **Calculate pages needed** - overflow_chars / chars_per_page
3. **Create all pages at once** - More efficient than incremental
4. **Thread in sequence** - Page 0→1→2, not random order
5. **Verify no overflow** - Check final page in chain

### Style Application

1. **List available styles** - Know what exists
2. **Apply paragraph styles first** - Broad strokes
3. **Apply character styles second** - Fine details
4. **Use ranges** - More efficient than paragraph-by-paragraph
5. **Validate application** - Check paragraphs_affected > 0

### Export Preparation

1. **Run validation** - Check fonts, overflow, bounds
2. **Select correct preset** - Match output type
3. **Verify color space** - CMYK for print, RGB for digital
4. **Check resolution** - 300dpi minimum for print
5. **Preview before export** - Catch issues early

---

## Common Misconceptions

| Misconception | Reality |
|---------------|---------|
| "Frame indices are global" | They're page-specific |
| "Overflow is deleted" | It's hidden, not lost |
| "Styles are optional" | Professional work requires styles |
| "Can change page size anytime" | Breaks existing frames |
| "72dpi is fine for print" | Need 300dpi minimum |
| "RGB works for print" | Must convert to CMYK |
| "Threading is automatic" | Must explicitly link frames |

---

## Glossary

| Term | Definition |
|------|------------|
| **Frame** | Container for content (text or graphics) |
| **Threading** | Linking frames for text flow |
| **Overflow** | Text that doesn't fit in frame (hidden) |
| **Geometric Bounds** | Frame position/size: [top, left, bottom, right] |
| **Point** | Unit of measurement (72pt = 1") |
| **Paragraph Style** | Formatting for entire paragraph |
| **Character Style** | Formatting for text within paragraph |
| **Master Page** | Template page for consistent layout |
| **Bleed** | Content extending beyond trim edge |
| **Slug** | Non-printing production area |
| **CMYK** | Cyan/Magenta/Yellow/Black (print color space) |
| **RGB** | Red/Green/Blue (digital color space) |
| **DPI** | Dots per inch (resolution) |
| **PDF/X** | PDF standard for commercial printing |
