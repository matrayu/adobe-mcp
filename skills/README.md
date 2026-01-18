# Adobe MCP Skills

Optional Claude Code skills that provide high-level workflow automation built on Adobe MCP tools.

---

## What Are Skills?

**MCP Tools** provide low-level programmatic control (primitives):
```python
# Raw tool calls
open_document("/path/to/file.indt")
get_text_frames(page_index=0)
insert_text(frame_index=0, text="Hello")
detect_text_overflow(frame_index=0, page_index=0)
```

**Skills** orchestrate multiple tools into complete workflows:
```
Format my 300-page manuscript for 6x9 print with chapter styles
```

Skills provide:
- ✅ **Validation** - Check inputs before operations
- ✅ **Error recovery** - Guide users through issues
- ✅ **Automation** - Multi-step workflows in natural language
- ✅ **Best practices** - Encode expert knowledge
- ✅ **Scripts** - Self-verifying automation

---

## Available Skills

### adobe-indesign-assistant

**Purpose:** Expert automation for InDesign document production workflows.

**Key Workflows:**
- **Book Layout** - Transform manuscript → formatted book
- **Template-Based** - Use InDesign templates with new content
- **PDF Export** - Validate and export print-ready PDFs
- **Manuscript Formatting** - Automatic style application

**Capabilities:**
- Orchestrates all 22 InDesign MCP tools
- Validates overflow, fonts, styles, frame bounds
- Pre-flight PDF export settings
- Estimates page count from text files
- Understands InDesign concepts (frames, threading, styles)

**Usage Examples:**
```
Format my memoir manuscript for 6x9 print
```

```
Open this template and import my chapter text
```

```
Export print-ready PDF with bleed settings for commercial printing
```

**Scripts:**
```bash
# Validate document health
python ~/.claude/skills/adobe-indesign-assistant/scripts/validate_document.py --all

# Check PDF export settings
python ~/.claude/skills/adobe-indesign-assistant/scripts/preflight_pdf.py \
  --preset "[High Quality Print]" --output-type print

# Estimate pages
python ~/.claude/skills/adobe-indesign-assistant/scripts/estimate_pages.py \
  --text-file manuscript.txt --page-size 6x9
```

**Documentation:**
- `SKILL.md` - Main skill with workflows
- `references/indesign-concepts.md` - Deep dive into InDesign architecture
- `references/workflows.md` - 5 complete workflows with code

---

## Installation

Skills are **optional enhancements** to the Adobe MCP tools. Install only the skills you need.

### Method 1: Symlink (Recommended)

Create a symbolic link from this repository to your Claude Code skills directory:

```bash
# From the adobe-mcp project root
ln -s $(pwd)/skills/adobe-indesign-assistant ~/.claude/skills/

# Verify installation
ls ~/.claude/skills/adobe-indesign-assistant
```

**Advantages:**
- Updates automatically when you pull changes
- No duplication
- Easy to uninstall (just remove symlink)

### Method 2: Copy

Copy the skill directory to your Claude Code skills directory:

```bash
# From the adobe-mcp project root
cp -r skills/adobe-indesign-assistant ~/.claude/skills/

# Verify installation
ls ~/.claude/skills/adobe-indesign-assistant
```

**Advantages:**
- Independent copy
- Won't change if you update the repo

### Verification

Test the skill is loaded:

```bash
# In a Claude Code session
/skills

# Should show: adobe-indesign-assistant
```

---

## Uninstalling Skills

Remove the symlink or directory from `~/.claude/skills/`:

```bash
# Remove symlink
rm ~/.claude/skills/adobe-indesign-assistant

# Or remove copied directory
rm -rf ~/.claude/skills/adobe-indesign-assistant
```

---

## Using Skills

### Activation

Skills activate automatically when you use trigger phrases:

**Explicit activation:**
```
Use the InDesign assistant to format my manuscript
```

**Natural language:**
```
Format my 300-page book for print
Import this text file into my InDesign template
Export PDF ready for commercial printing
```

### MCP Requirements

Skills require the corresponding MCP servers to be running:

```bash
# Terminal 1: Proxy server
adobe-proxy

# Terminal 2: InDesign MCP server
adobe-indesign
```

And the UXP plugin must be loaded in the Adobe application.

---

## When to Use Skills vs Raw MCP Tools

### Use Skills When:
- ✅ You want guided workflows with validation
- ✅ You're performing common operations (book layout, PDF export)
- ✅ You want error recovery and helpful messages
- ✅ You prefer natural language over code
- ✅ You're learning InDesign automation

### Use Raw MCP Tools When:
- ✅ You need precise, custom control
- ✅ You're building your own workflows
- ✅ You're integrating with other systems
- ✅ The skill doesn't cover your use case
- ✅ You prefer explicit code

**You can mix both approaches** - use skills for common tasks, drop to MCP tools for custom operations.

---

## Developing New Skills

Want to create your own Adobe MCP skills?

### Structure

```
skills/
└── your-skill-name/
    ├── SKILL.md              # Main entry point (required)
    ├── references/           # Deep documentation (optional)
    ├── scripts/              # Automation scripts (optional)
    └── assets/               # Templates, examples (optional)
```

### Using SkillCreator

Use Claude Code's skillcreator to generate production-ready skills:

```
/skillcreator Create a skill for [your workflow]
```

### Best Practices

1. **Start with the problem** - What workflow are you automating?
2. **Define triggers** - How will users activate your skill?
3. **Validate inputs** - Check before calling MCP tools
4. **Handle errors** - Provide recovery guidance
5. **Document workflows** - Show complete examples
6. **Add scripts** - Enable autonomous operation
7. **Test thoroughly** - Use real Adobe applications

### Contributing

To contribute a skill to this project:

1. Create your skill in `skills/your-skill-name/`
2. Follow the structure and patterns of existing skills
3. Include comprehensive documentation
4. Test with real Adobe applications
5. Submit a pull request

---

## Roadmap

### Future Skills (Planned)

**adobe-photoshop-assistant:**
- Batch image processing workflows
- Non-destructive editing patterns
- Export optimization for web/print

**adobe-premiere-assistant:**
- Video editing automation
- Timeline management
- Multi-format export workflows

**adobe-workflow-orchestrator:**
- Cross-application workflows
- Asset pipeline management
- Consistent design system maintenance

---

## Troubleshooting

### Skill Not Activating

**Problem:** Trigger phrases don't activate the skill.

**Solutions:**
1. Verify skill is installed: `ls ~/.claude/skills/adobe-indesign-assistant`
2. Check SKILL.md exists: `cat ~/.claude/skills/adobe-indesign-assistant/SKILL.md | head`
3. Restart Claude Code session
4. Try explicit activation: "Use the InDesign assistant to..."

### MCP Tools Not Available

**Problem:** Skill says "MCP tools not available".

**Solutions:**
1. Start proxy server: `adobe-proxy`
2. Start MCP server: `adobe-indesign`
3. Load UXP plugin in Adobe InDesign
4. Verify connection: InDesign UXP panel should show "Connected"

### Scripts Fail

**Problem:** Validation or pre-flight scripts return errors.

**Solutions:**
1. Check Python version: `python3 --version` (requires 3.7+)
2. Run with verbose output: `python -v script.py`
3. Check file permissions: `ls -l ~/.claude/skills/adobe-indesign-assistant/scripts/`
4. Make executable: `chmod +x ~/.claude/skills/adobe-indesign-assistant/scripts/*.py`

---

## Support

- **Issues:** Report issues with skills on the main project issue tracker
- **Documentation:** Each skill's SKILL.md contains detailed usage information
- **Examples:** Check `references/workflows.md` for complete workflow examples

---

## License

All skills in this directory are licensed under MIT License, same as the main Adobe MCP project.
