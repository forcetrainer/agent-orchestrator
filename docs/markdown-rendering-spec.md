# Markdown Rendering Style Specification

This document defines the visual styling standards for rendering markdown content throughout the Agent Orchestrator application. It provides separate specifications for light mode and dark mode to ensure consistent, readable documentation presentation.

---

## Table of Contents

1. [Light Mode Specification](#light-mode-specification)
2. [Dark Mode Specification](#dark-mode-specification)
3. [Implementation Guide](#implementation-guide)
4. [Color Palette Reference](#color-palette-reference)

---

## Light Mode Specification

### Typography

- **Font Family**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif
- **Base Font Size**: 16px
- **Line Height**: 1.7

### Headings

#### H1
- **Font Size**: 32px
- **Font Weight**: 700
- **Color**: #2c3e50
- **Margin Top**: 0
- **Margin Bottom**: 24px
- **Border Left**: 5px solid #3498db
- **Padding Left**: 16px

#### H2
- **Font Size**: 26px
- **Font Weight**: 700
- **Color**: #2c3e50
- **Margin Top**: 30px
- **Margin Bottom**: 16px
- **Border Left**: 4px solid #3498db
- **Padding Left**: 12px

#### H3
- **Font Size**: 20px
- **Font Weight**: 600
- **Color**: #34495e
- **Margin Top**: 24px
- **Margin Bottom**: 12px
- **Padding Left**: 0

#### H4
- **Font Size**: 18px
- **Font Weight**: 600
- **Color**: #34495e
- **Margin Top**: 20px
- **Margin Bottom**: 10px

### Body Text

#### Paragraph
- **Color**: #2c3e50
- **Margin Bottom**: 16px
- **Line Height**: 1.7

#### Strong/Bold
- **Font Weight**: 600
- **Color**: inherit

#### Emphasis/Italic
- **Font Style**: italic
- **Color**: inherit

### Links

- **Color**: #3498db
- **Text Decoration**: none
- **Border Bottom**: 1px solid #3498db
- **Transition**: color 0.2s ease

#### Hover State
- **Color**: #2980b9
- **Border Bottom Color**: #2980b9

### Code

#### Inline Code
- **Background**: #ecf0f1
- **Color**: #e74c3c
- **Padding**: 2px 6px
- **Border Radius**: 3px
- **Font Family**: 'Consolas', 'Monaco', 'Courier New', monospace
- **Font Size**: 90%
- **Font Weight**: 500

#### Code Blocks
- **Background**: #2c3e50
- **Color**: #ecf0f1
- **Padding**: 16px
- **Border Radius**: 4px
- **Margin Bottom**: 16px
- **Overflow X**: auto
- **Font Family**: 'Consolas', 'Monaco', 'Courier New', monospace
- **Font Size**: 14px
- **Line Height**: 1.5

##### Code Block Content
- **Color**: #a8e6cf (for general text)
- **Background**: transparent

### Lists

#### Unordered Lists
- **Padding Left**: 30px
- **Margin Bottom**: 16px

##### List Items
- **Margin Bottom**: 6px
- **Line Height**: 1.7

#### Ordered Lists
- **Padding Left**: 30px
- **Margin Bottom**: 16px

##### List Items
- **Margin Bottom**: 6px
- **Line Height**: 1.7

### Blockquotes

- **Border Left**: 4px solid #3498db
- **Padding Left**: 16px
- **Margin Left**: 0
- **Margin Bottom**: 16px
- **Color**: #555
- **Font Style**: italic
- **Background**: #f8f9fa
- **Padding Top**: 8px
- **Padding Bottom**: 8px

### Tables

- **Border Collapse**: collapse
- **Width**: 100%
- **Margin Bottom**: 16px

#### Table Header
- **Background**: #3498db
- **Color**: white
- **Font Weight**: 600
- **Padding**: 12px
- **Text Align**: left

#### Table Cells
- **Padding**: 10px 12px
- **Border**: 1px solid #dfe6e9

#### Alternating Rows
- **Background**: #f8f9fa (even rows)

### Horizontal Rule

- **Border**: none
- **Border Top**: 2px solid #e0e0e0
- **Margin**: 24px 0

---

## Dark Mode Specification

### Typography

- **Font Family**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif
- **Base Font Size**: 16px
- **Line Height**: 1.7
- **Background**: #1a1a1a
- **Base Text Color**: #e0e0e0

### Headings

#### H1
- **Font Size**: 32px
- **Font Weight**: 700
- **Color**: #ffffff
- **Margin Top**: 0
- **Margin Bottom**: 24px
- **Border Left**: 5px solid #4fc3f7
- **Padding Left**: 16px

#### H2
- **Font Size**: 26px
- **Font Weight**: 700
- **Color**: #ffffff
- **Margin Top**: 30px
- **Margin Bottom**: 16px
- **Border Left**: 4px solid #4fc3f7
- **Padding Left**: 12px

#### H3
- **Font Size**: 20px
- **Font Weight**: 600
- **Color**: #f0f0f0
- **Margin Top**: 24px
- **Margin Bottom**: 12px
- **Padding Left**: 0

#### H4
- **Font Size**: 18px
- **Font Weight**: 600
- **Color**: #f0f0f0
- **Margin Top**: 20px
- **Margin Bottom**: 10px

### Body Text

#### Paragraph
- **Color**: #e0e0e0
- **Margin Bottom**: 16px
- **Line Height**: 1.7

#### Strong/Bold
- **Font Weight**: 600
- **Color**: #ffffff

#### Emphasis/Italic
- **Font Style**: italic
- **Color**: inherit

### Links

- **Color**: #4fc3f7
- **Text Decoration**: none
- **Border Bottom**: 1px solid #4fc3f7
- **Transition**: color 0.2s ease

#### Hover State
- **Color**: #81d4fa
- **Border Bottom Color**: #81d4fa

### Code

#### Inline Code
- **Background**: #2d2d2d
- **Color**: #ff6b6b
- **Padding**: 2px 6px
- **Border Radius**: 3px
- **Font Family**: 'Consolas', 'Monaco', 'Courier New', monospace
- **Font Size**: 90%
- **Font Weight**: 500
- **Border**: 1px solid #3a3a3a

#### Code Blocks
- **Background**: #252526
- **Color**: #d4d4d4
- **Padding**: 16px
- **Border Radius**: 4px
- **Margin Bottom**: 16px
- **Overflow X**: auto
- **Font Family**: 'Consolas', 'Monaco', 'Courier New', monospace
- **Font Size**: 14px
- **Line Height**: 1.5
- **Border**: 1px solid #3a3a3a

##### Code Block Content
- **Color**: #9cdcfe (for general text)
- **Background**: transparent

### Lists

#### Unordered Lists
- **Padding Left**: 30px
- **Margin Bottom**: 16px

##### List Items
- **Margin Bottom**: 6px
- **Line Height**: 1.7
- **Color**: #e0e0e0

#### Ordered Lists
- **Padding Left**: 30px
- **Margin Bottom**: 16px

##### List Items
- **Margin Bottom**: 6px
- **Line Height**: 1.7
- **Color**: #e0e0e0

### Blockquotes

- **Border Left**: 4px solid #4fc3f7
- **Padding Left**: 16px
- **Margin Left**: 0
- **Margin Bottom**: 16px
- **Color**: #b0b0b0
- **Font Style**: italic
- **Background**: #252526
- **Padding Top**: 8px
- **Padding Bottom**: 8px

### Tables

- **Border Collapse**: collapse
- **Width**: 100%
- **Margin Bottom**: 16px

#### Table Header
- **Background**: #4fc3f7
- **Color**: #1a1a1a
- **Font Weight**: 600
- **Padding**: 12px
- **Text Align**: left

#### Table Cells
- **Padding**: 10px 12px
- **Border**: 1px solid #3a3a3a
- **Color**: #e0e0e0

#### Alternating Rows
- **Background**: #252526 (even rows)

### Horizontal Rule

- **Border**: none
- **Border Top**: 2px solid #3a3a3a
- **Margin**: 24px 0

---

## Implementation Guide

### CSS Class Naming Convention

Use a clear prefix system to distinguish between light and dark mode styles:

- `.markdown-light` - Light mode container class
- `.markdown-dark` - Dark mode container class

### Responsive Design

#### Mobile Breakpoint (< 768px)

- Reduce heading font sizes by 20%
- Reduce padding on all elements proportionally
- Ensure code blocks have horizontal scroll enabled
- Adjust table layouts for mobile viewing (consider card-style layout)

**Example Mobile Adjustments:**
- H1: 32px → 25.6px
- H2: 26px → 20.8px
- H3: 20px → 16px
- H4: 18px → 14.4px
- Padding Left (H1): 16px → 12px
- Padding Left (H2): 12px → 8px

### Usage Example

```jsx
// Light mode
<div className="markdown-light">
  {/* Rendered markdown content */}
</div>

// Dark mode
<div className="markdown-dark">
  {/* Rendered markdown content */}
</div>
```

### Integration with react-markdown

When using react-markdown or similar libraries, apply these styles through:

1. CSS modules scoped to markdown containers
2. Tailwind CSS classes matching specifications
3. Styled-components or CSS-in-JS matching specifications

---

## Color Palette Reference

### Light Mode Colors

| Element | Color Code | Usage |
|---------|-----------|-------|
| Primary Accent | #3498db | Headings border, links |
| Dark Accent | #2980b9 | Link hover states |
| Primary Text | #2c3e50 | Body text, headings |
| Secondary Text | #34495e | H3/H4 headings |
| Code Error/Highlight | #e74c3c | Inline code text |
| Code Success | #a8e6cf | Code block text |
| Background Gray | #ecf0f1 | Inline code background |
| Light Background | #f8f9fa | Blockquotes, table rows |
| Border Gray | #dfe6e9 | Table borders |
| Code Block Background | #2c3e50 | Code block background |
| HR Border | #e0e0e0 | Horizontal rules |

### Dark Mode Colors

| Element | Color Code | Usage |
|---------|-----------|-------|
| Primary Accent | #4fc3f7 | Headings border, links, table headers |
| Light Accent | #81d4fa | Link hover states |
| Primary Text | #e0e0e0 | Body text, list items |
| Secondary Text | #f0f0f0 | H3/H4 headings |
| Heading Text | #ffffff | H1/H2 headings, strong text |
| Code Error/Highlight | #ff6b6b | Inline code text |
| Code Variable | #9cdcfe | Code block text |
| Background | #1a1a1a | Page background |
| Card Background | #252526 | Code blocks, blockquotes, table rows |
| Code Background | #2d2d2d | Inline code background |
| Border Gray | #3a3a3a | Code borders, table borders, HR |
| Blockquote Text | #b0b0b0 | Blockquote text |
| Code Block Text | #d4d4d4 | Default code block text |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-08 | Bryan Inagaki | Initial specification created |

---

## Related Documentation

- [Component Library](./components.md) - Component usage guidelines
- [Design System](./design-system.md) - Overall design system
- [Accessibility Guidelines](./accessibility.md) - WCAG compliance standards
