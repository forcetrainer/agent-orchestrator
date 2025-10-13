# Epic 6: Enhanced UX & Interactive Features - Technical Specification

**Author:** Winston (Architect Agent)
**Date:** 2025-10-07
**Epic:** Epic 6 - Enhanced UX & Interactive Features
**Status:** Ready for Implementation
**Related Documents:** epic-6-architecture.md, PRD.md, epics.md

---

## Executive Summary

This technical specification provides implementation-ready details for Epic 6, which enhances the Agent Orchestrator with improved usability and real-time interactive capabilities. The epic addresses critical user feedback from Epics 1-5: the file viewer occupies too much screen space, sessions and files are difficult to distinguish, response latency feels slow, and status messages are too generic.

**What We're Building:**
1. Collapsible file viewer with improved layout
2. Smart session naming system
3. Context-aware file naming validation
4. File reference attachments (drag-drop from viewer to chat)
5. Streaming responses (token-by-token display)
6. Dynamic tool-aware status messages

**Why Now:** With core functionality complete (Epics 1-5), these UX improvements are essential before Docker deployment (Epic 7). They transform the platform from "functional" to "production-ready."

---

## Technical Architecture Summary

### High-Level Design

Epic 6 follows an **incremental enhancement** pattern - no new services, only improvements to existing components:

```
┌─────────────────────────────────────────────────────┐
│ Frontend (React/Next.js)                             │
├─────────────────────────────────────────────────────┤
│ • ChatInterface (enhanced with streaming)            │
│ • FileViewer (collapsible, new layout)              │
│ • MessageInput (file attachment drag-drop)           │
│ • StatusIndicator (dynamic messages)                 │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│ Backend API Routes (Next.js App Router)              │
├─────────────────────────────────────────────────────┤
│ • POST /api/chat (SSE streaming)                     │
│ • POST /api/sessions (create with metadata)          │
│ • GET /api/sessions (list with display names)        │
│ • PATCH /api/sessions/:id (update metadata)          │
│ • POST /api/files/reference (read for attachment)    │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│ File System Storage                                  │
├─────────────────────────────────────────────────────┤
│ output/                                              │
│ ├── {uuid}/                                          │
│ │   ├── manifest.json (NEW - session metadata)      │
│ │   └── *.md (agent outputs)                        │
└─────────────────────────────────────────────────────┘
```

### Key Technology Decisions

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| Streaming | OpenAI SDK + SSE | 4.x | Built-in streaming support, auto-reconnect |
| Drag-Drop | React DnD | 16.0.1 | Accessibility, cross-browser consistency |
| Animations | Framer Motion | 10.16.4 | Spring physics, layout animations |
| Session Storage | JSON files (manifest.json) | Native fs | Aligns with file-based architecture |
| State Management | React Context API | React 18+ | Already in use, sufficient for this scope |
| Markdown Renderer | react-markdown | 9.x | GitHub-flavored markdown, extensible, secure |

---

### Markdown Rendering Implementation

**Purpose:** Provide consistent, visually appealing markdown rendering for agent messages and file viewer content with full support for light and dark modes.

#### Overview

All agent messages and file viewer content are rendered as markdown with comprehensive styling that adapts to the user's system theme preference. The implementation uses `react-markdown` with custom CSS styling that follows the markdown rendering specification.

#### Component Integration

**Location:** Agent messages (ChatInterface) and File Viewer content display

**Dependencies:**
- `react-markdown` v9.x - Core markdown parser and renderer
- `remark-gfm` - GitHub-flavored markdown support (tables, strikethrough, task lists)
- CSS modules or Tailwind for styling

**Implementation Pattern:**

```typescript
// components/chat/MessageBubble.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MessageBubble({ message }: { message: Message }) {
  const theme = useTheme(); // 'light' | 'dark'

  return (
    <div className={cn(
      "message-content",
      theme === 'dark' ? 'markdown-dark' : 'markdown-light'
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom component overrides if needed
          code: CustomCodeBlock,
          a: CustomLink,
        }}
      >
        {message.content}
      </ReactMarkdown>
    </div>
  );
}
```

#### Styling Architecture

**CSS Class Structure:**

Two primary container classes provide theme-specific styling:
- `.markdown-light` - Light mode styling (default)
- `.markdown-dark` - Dark mode styling

**Style Specifications:**

See `/docs/ux-specification.md` section "Markdown Rendering Specification" for complete details. Key highlights:

**Light Mode:**
- Headings: Blue accent borders (#3498db), dark gray text (#2c3e50)
- Code: Light gray background (#ecf0f1), red text (#e74c3c)
- Code blocks: Dark background (#2c3e50), light text (#ecf0f1)
- Links: Blue (#3498db) with underline border

**Dark Mode:**
- Headings: Cyan accent borders (#4fc3f7), white text
- Code: Dark background (#2d2d2d), red-orange text (#ff6b6b)
- Code blocks: VSCode-style (#252526), light gray text (#d4d4d4)
- Links: Cyan (#4fc3f7) with underline border

#### Responsive Behavior

**Mobile Adjustments (< 768px):**
- Heading font sizes reduced by 20%
- Padding reduced proportionally
- Code blocks: horizontal scroll enabled
- Tables: Consider card-style layout transformation

**Font Size Adjustments:**
- H1: 32px → 25.6px
- H2: 26px → 20.8px
- H3: 20px → 16px
- H4: 18px → 14.4px

#### Supported Markdown Features

**Basic Formatting:**
- Headings (H1-H6) with distinctive left-border accent
- Paragraphs with optimal line-height (1.7)
- Bold/strong and italic/emphasis
- Links with hover effects

**Advanced Features:**
- Unordered and ordered lists
- Nested lists with proper indentation
- Code blocks with syntax highlighting colors
- Inline code with distinctive background
- Blockquotes with left accent border
- Tables with alternating row backgrounds
- Horizontal rules

#### Theme Detection

**Implementation:**

```typescript
// hooks/useTheme.ts
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Detect system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    setTheme(mediaQuery.matches ? 'dark' : 'light');

    const listener = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return theme;
}
```

#### CSS Implementation Options

**Option 1: CSS Modules (Recommended)**
```css
/* styles/markdown.module.css */
.markdown-light h1 {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  border-left: 5px solid #3498db;
  padding-left: 16px;
  margin-bottom: 24px;
}

.markdown-dark h1 {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  border-left: 5px solid #4fc3f7;
  padding-left: 16px;
  margin-bottom: 24px;
}
/* ...continue for all elements */
```

**Option 2: Tailwind + Custom Classes**
```tsx
// Create Tailwind plugin in tailwind.config.js
// Use @apply directives for markdown styling
```

**Option 3: Styled Components**
```typescript
// Use CSS-in-JS with theme provider
const MarkdownContainer = styled.div<{ theme: 'light' | 'dark' }>`
  /* Dynamic styling based on theme prop */
`;
```

#### Security Considerations

**XSS Prevention:**
- `react-markdown` escapes HTML by default (secure)
- Do NOT use `dangerouslySetInnerHTML`
- Do NOT enable `rehype-raw` plugin (allows raw HTML)

**Link Safety:**
- External links: Add `target="_blank"` and `rel="noopener noreferrer"`
- Validate file:// and javascript: protocols (block by default)

#### Performance Optimization

**Rendering Performance:**
- Memoize markdown components to prevent re-renders
- Lazy-load syntax highlighting if needed
- Use `React.memo()` for MessageBubble component

**Code Example:**
```typescript
export const MessageBubble = React.memo(({ message }: { message: Message }) => {
  // ... rendering logic
});
```

#### Testing Requirements

**Visual Testing:**
- [ ] All heading levels render correctly (H1-H6)
- [ ] Code blocks have proper background and text color
- [ ] Inline code is visually distinct
- [ ] Tables display properly with alternating rows
- [ ] Blockquotes have left accent border
- [ ] Links are clickable and show hover state
- [ ] Lists (ordered/unordered) indent correctly

**Theme Testing:**
- [ ] Light mode applies correct colors
- [ ] Dark mode applies correct colors
- [ ] Theme switches dynamically when system preference changes
- [ ] No flash of unstyled content (FOUC)

**Responsive Testing:**
- [ ] Mobile breakpoint reduces font sizes correctly
- [ ] Code blocks scroll horizontally on mobile
- [ ] Tables adapt to narrow screens
- [ ] Padding adjustments work as expected

**Browser Testing:**
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari
- [ ] Mobile Chrome

#### Related Documentation

- Complete specification: `/docs/markdown-rendering-spec.md`
- UX guidelines: `/docs/ux-specification.md` (Markdown Rendering Specification section)
- Component library: Future component documentation

---

## Component Specifications

### 1. Dynamic File Viewer (Stories 6.1, 6.2)

#### Current State
- File viewer always visible at 30% width (right side)
- Left/right split: Chat (70%) | File Viewer (30%)
- File content cramped in narrow panel

#### New State
- Toggle button in top navigation (collapses/expands viewer)
- Chat uses 100% width when viewer closed
- File viewer internal layout: Top (40% - directory tree) / Bottom (60% - file content)

#### Implementation Details

**Component Structure:**

```typescript
// components/layout/MainLayout.tsx
export function MainLayout({ children }: { children: React.ReactNode }) {
  const { isFileViewerOpen } = useFileViewer();

  return (
    <div className={cn(
      "grid h-screen",
      isFileViewerOpen ? "grid-cols-[1fr_30%]" : "grid-cols-[1fr]"
    )}>
      <main className="overflow-hidden">
        {children}
      </main>

      <AnimatePresence>
        {isFileViewerOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "30%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="border-l border-gray-200"
          >
            <FileViewer />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

// components/file-viewer/useFileViewer.ts
export function useFileViewer() {
  const [isOpen, setIsOpen] = useState(true);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  useEffect(() => {
    // Keyboard shortcut: Ctrl/Cmd + B
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isOpen, toggle };
}

// components/file-viewer/FileViewer.tsx
export function FileViewer() {
  return (
    <div className="flex flex-col h-full">
      {/* Top: Directory Tree (40%) */}
      <div className="h-[40%] overflow-y-auto border-b border-gray-200">
        <DirectoryTree />
      </div>

      {/* Bottom: File Content (60%) */}
      <div className="h-[60%] overflow-y-auto">
        <FileContent />
      </div>
    </div>
  );
}
```

**Testing Checklist:**
- [ ] Toggle button in navigation works (click)
- [ ] Keyboard shortcut works (Ctrl/Cmd + B)
- [ ] Animation is smooth (no jank, 60fps)
- [ ] Chat panel expands to full width when closed
- [ ] File content is readable in bottom section (no horizontal scroll)
- [ ] Viewer state persists during session
- [ ] Works in Chrome, Firefox, Safari, Edge

---

### 2. Smart Session Naming (Stories 6.3, 6.4)

#### Problem
Session folders use agent+workflow names, making identical sessions indistinguishable:
```
procurement-advisor-intake-workflow/  # Which one?
procurement-advisor-intake-workflow/  # They look the same!
```

#### Solution
Display names with timestamp + user message summary:
```
Oct 7, 2:30 PM - I need to purchase 10 laptops...
Oct 7, 3:15 PM - Software license quote needed
```

#### Implementation Details

**Data Model:**

```typescript
// types/session.ts
export interface SessionMetadata {
  id: string;                    // UUID v4
  agentName: string;             // "Procurement Advisor"
  agentId: string;               // "procurement-advisor"
  workflowName?: string;         // "Intake Workflow" (optional)
  timestamp: string;             // ISO 8601
  lastModified: string;          // ISO 8601
  userSummary?: string;          // First 50 chars of user's first message
  displayName: string;           // Computed name
  files: string[];               // File paths relative to session folder
  messageCount: number;          // Total messages
  status: 'active' | 'archived';
}
```

**Naming Algorithm:**

```typescript
// lib/sessions/naming.ts
export function generateDisplayName(metadata: {
  agentName: string;
  workflowName?: string;
  userMessage?: string;
  timestamp: string;
}): string {
  const date = new Date(metadata.timestamp);
  const timeStr = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }); // "Oct 7, 2:30 PM"

  // Priority 1: User message summary (most descriptive)
  if (metadata.userMessage) {
    const summary = truncate(metadata.userMessage, 40);
    return `${timeStr} - ${summary}`;
  }

  // Priority 2: Workflow name
  if (metadata.workflowName) {
    return `${metadata.workflowName} - ${timeStr}`;
  }

  // Priority 3: Agent name (fallback)
  return `${metadata.agentName} - ${timeStr}`;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}
```

**API Endpoints:**

```typescript
// app/api/sessions/route.ts

// POST /api/sessions - Create new session
export async function POST(req: Request) {
  const { agentName, agentId, workflowName, userMessage } = await req.json();

  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const metadata: SessionMetadata = {
    id,
    agentName,
    agentId,
    workflowName,
    timestamp,
    lastModified: timestamp,
    userSummary: userMessage ? truncate(userMessage, 50) : undefined,
    displayName: generateDisplayName({ agentName, workflowName, userMessage, timestamp }),
    files: [],
    messageCount: 0,
    status: 'active'
  };

  // Create session directory and manifest
  const sessionDir = path.join(process.env.OUTPUT_DIR!, id);
  await fs.mkdir(sessionDir, { recursive: true });
  await fs.writeFile(
    path.join(sessionDir, 'manifest.json'),
    JSON.stringify(metadata, null, 2)
  );

  return Response.json({ id, displayName: metadata.displayName, timestamp });
}

// GET /api/sessions - List all sessions
export async function GET() {
  const outputDir = process.env.OUTPUT_DIR!;
  const entries = await fs.readdir(outputDir, { withFileTypes: true });

  const sessions = await Promise.all(
    entries
      .filter(entry => entry.isDirectory() && /^[0-9a-f-]{36}$/.test(entry.name))
      .map(async (entry) => {
        try {
          const manifestPath = path.join(outputDir, entry.name, 'manifest.json');
          const content = await fs.readFile(manifestPath, 'utf-8');
          return JSON.parse(content) as SessionMetadata;
        } catch {
          // No manifest - return minimal metadata with UUID as display name
          return {
            id: entry.name,
            displayName: entry.name,
            status: 'active'
          };
        }
      })
  );

  // Sort by timestamp (newest first)
  sessions.sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return bTime - aTime;
  });

  return Response.json({ sessions });
}
```

**Frontend Integration:**

```typescript
// components/file-viewer/DirectoryTree.tsx
export function DirectoryTree() {
  const { data: sessions } = useSWR('/api/sessions', fetcher);

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-2">Sessions</h3>
      {sessions?.sessions.map((session: SessionMetadata) => (
        <div
          key={session.id}
          className="cursor-pointer hover:bg-gray-100 p-2 rounded"
          title={`UUID: ${session.id}`} // Tooltip shows UUID
        >
          📂 {session.displayName}
        </div>
      ))}
    </div>
  );
}
```

**Testing Checklist:**
- [ ] manifest.json created for new sessions
- [ ] Display name includes timestamp + user summary
- [ ] Falls back to workflow name if no user message
- [ ] Falls back to agent name if no workflow
- [ ] Sessions sorted newest first
- [ ] Tooltip shows UUID on hover
- [ ] Old sessions without manifest still display (UUID fallback)
- [ ] No crashes if manifest.json corrupted

---

### 3. Context-Aware File Naming (Story 6.5)

#### Problem
Agents write generic filenames: `output.md`, `result.txt`, `file-1.md`

#### Solution
Validate filenames, reject generic patterns, guide agents to descriptive names

#### Implementation Details

**Validation Logic:**

```typescript
// lib/files/operations.ts
const GENERIC_PATTERNS = [
  /^output(-\d+)?\.md$/i,
  /^result(-\d+)?\.txt$/i,
  /^file\d*\./i,
  /^untitled/i,
  /^document\d*\./i
];

export function validateFilename(filename: string): void {
  // Check for generic patterns
  if (GENERIC_PATTERNS.some(pattern => pattern.test(filename))) {
    throw new Error(
      `Generic filename "${filename}" not allowed. ` +
      `Use descriptive names based on content or purpose.\n\n` +
      `Examples:\n` +
      `  ✅ procurement-request.md\n` +
      `  ✅ budget-analysis-q3.csv\n` +
      `  ✅ approval-checklist.md\n\n` +
      `  ❌ output.md\n` +
      `  ❌ result.txt\n` +
      `  ❌ file-1.md`
    );
  }

  // Path traversal prevention
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Filename cannot contain path separators or ".."');
  }

  // Special character check
  if (/[<>:"|?*]/.test(filename)) {
    throw new Error('Filename contains invalid characters: < > : " | ? *');
  }
}
```

**System Prompt Addition:**

```typescript
// lib/openai/client.ts
const FILE_NAMING_GUIDELINES = `
CRITICAL: When writing files, use descriptive filenames based on content/purpose.

Rules:
- Use kebab-case (lowercase with hyphens)
- Include purpose or content type
- Add context if helpful (dates, departments, etc.)
- Keep under 50 characters
- Use standard extensions (.md, .csv, .txt, .json)

Examples:
✅ GOOD:
  - procurement-request.md (describes what it is)
  - budget-analysis-q3.csv (purpose + context)
  - approval-checklist.md (function-based)
  - software-license-quote.md

❌ BAD (will be rejected):
  - output.md (too generic)
  - file.txt (meaningless)
  - result-2.md (numbered generic)
  - untitled.md (lazy naming)
`;

export function buildSystemPrompt(agent: AgentConfig): string {
  return `
${agent.instructions}

${FILE_NAMING_GUIDELINES}

...rest of system prompt...
  `;
}
```

**Testing Checklist:**
- [ ] Generic filenames rejected: `output.md`, `result.txt`, `file-1.md`
- [ ] Descriptive filenames accepted: `procurement-request.md`, `budget-analysis.csv`
- [ ] Error message is helpful and shows examples
- [ ] Path traversal prevented (no `../`, `/`, `\`)
- [ ] Special characters blocked (no `<>:"|?*`)
- [ ] Agent receives guidelines in system prompt

---

### 4. File Reference Attachments (Stories 6.6, 6.7)

#### Use Case
User drags `procurement-request.md` from file viewer into chat input to provide context for next message

#### Implementation Details

**Frontend (Drag-Drop UI):**

```typescript
// Install: npm install react-dnd react-dnd-html5-backend

// components/file-viewer/DirectoryTree.tsx
import { useDrag } from 'react-dnd';

function FileItem({ file }: { file: FileNode }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'FILE_REFERENCE',
    item: { filepath: file.path, filename: file.name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: file.type === 'file', // Only files, not folders
  });

  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}
      className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
    >
      📄 {file.name}
    </div>
  );
}

// components/chat/MessageInput.tsx
import { useDrop } from 'react-dnd';

export function MessageInput() {
  const [attachments, setAttachments] = useState<FileReference[]>([]);

  const [{ isOver }, drop] = useDrop({
    accept: 'FILE_REFERENCE',
    drop: (item: { filepath: string, filename: string }) => {
      // Prevent duplicates
      if (attachments.some(a => a.filepath === item.filepath)) {
        return;
      }
      setAttachments(prev => [...prev, item]);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const removeAttachment = (filepath: string) => {
    setAttachments(prev => prev.filter(a => a.filepath !== filepath));
  };

  return (
    <div
      ref={drop}
      className={cn(
        "border rounded-lg p-4",
        isOver && "bg-blue-50 border-blue-300"
      )}
    >
      {/* Attachment pills */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((file) => (
            <FileAttachment
              key={file.filepath}
              filename={file.filename}
              filepath={file.filepath}
              onRemove={() => removeAttachment(file.filepath)}
            />
          ))}
        </div>
      )}

      {/* Text input */}
      <textarea
        placeholder="Type your message..."
        className="w-full resize-none border-0 focus:ring-0"
      />

      <button onClick={() => handleSend(attachments)}>Send</button>
    </div>
  );
}

// components/chat/FileAttachment.tsx
export function FileAttachment({
  filename,
  onRemove
}: {
  filename: string;
  onRemove: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full text-sm">
      <span className="text-blue-800">📎 {filename}</span>
      <button
        onClick={onRemove}
        className="text-blue-600 hover:text-blue-800 font-bold"
        aria-label={`Remove ${filename}`}
      >
        ✕
      </button>
    </div>
  );
}
```

**Backend (File Reading & Injection):**

```typescript
// app/api/files/reference/route.ts
export async function POST(req: Request) {
  const { filepath } = await req.json();

  const outputDir = path.resolve(process.env.OUTPUT_DIR!);
  const fullPath = path.resolve(outputDir, filepath);

  // Security: Path must be within output directory
  if (!fullPath.startsWith(outputDir)) {
    return Response.json({ error: 'Invalid file path' }, { status: 403 });
  }

  // Check file size
  const stats = await fs.stat(fullPath);
  if (stats.size > 1024 * 1024) { // 1MB limit
    return Response.json({ error: 'File too large (max 1MB)' }, { status: 413 });
  }

  // Read file content
  const content = await fs.readFile(fullPath, 'utf-8');

  return Response.json({
    filename: path.basename(filepath),
    content,
    size: stats.size
  });
}

// app/api/chat/route.ts (modified to handle attachments)
export async function POST(req: Request) {
  const { messages, attachments } = await req.json();

  // Read attached files
  const fileContents = await Promise.all(
    (attachments || []).map(async (ref: FileReference) => {
      const response = await fetch('/api/files/reference', {
        method: 'POST',
        body: JSON.stringify({ filepath: ref.filepath }),
      });
      return response.json();
    })
  );

  // Build conversation with file contents as system message
  const conversationMessages = [];

  // Add file contents as system message
  if (fileContents.length > 0) {
    const filesText = fileContents.map(f =>
      `File: ${f.filename}\n${'---'}\n${f.content}\n${'---'}`
    ).join('\n\n');

    conversationMessages.push({
      role: 'system',
      content: `Files attached by user:\n\n${filesText}`
    });
  }

  // Add conversation messages
  conversationMessages.push(...messages);

  // Send to OpenAI (streaming response follows...)
  // ... (see Story 6.8 for streaming implementation)
}
```

**Testing Checklist:**
- [ ] Files draggable from directory tree
- [ ] Drop zone highlights when hovering with file
- [ ] Pill appears in input after drop
- [ ] Remove button works
- [ ] Cannot drag folders (only files)
- [ ] Multiple files can be attached (up to 10)
- [ ] Duplicates prevented
- [ ] Backend reads file and injects into conversation
- [ ] Path traversal attacks prevented
- [ ] File size limit enforced (1MB)
- [ ] Keyboard alternative works (for accessibility)

---

### 5. Streaming Responses (Story 6.8)

#### Current Behavior
User sends message → waits → full response appears at once

#### New Behavior
User sends message → tokens appear one-by-one as generated (like ChatGPT)

#### Implementation Details

**Backend (SSE Streaming):**

```typescript
// lib/openai/streaming.ts
export async function streamChatCompletion(
  messages: ChatMessage[],
  callbacks: {
    onToken: (token: string) => void;
    onToolCall: (toolCall: ToolCall) => void;
    onComplete: () => void;
    onError: (error: Error) => void;
  }
) {
  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      stream: true,
      tools: [...toolDefinitions], // read_file, write_file, etc.
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      // Text tokens
      if (delta?.content) {
        callbacks.onToken(delta.content);
      }

      // Tool calls
      if (delta?.tool_calls) {
        callbacks.onToolCall(delta.tool_calls[0]);
      }

      // Completion
      if (chunk.choices[0]?.finish_reason) {
        callbacks.onComplete();
      }
    }
  } catch (error) {
    callbacks.onError(error as Error);
  }
}

// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      await streamChatCompletion(
        messages,
        {
          // On token: Send to client
          onToken: (token) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`)
            );
          },

          // On tool call: Send status update (Story 6.9)
          onToolCall: (toolCall) => {
            const status = mapToolCallToStatus(toolCall);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'status', message: status })}\n\n`)
            );
          },

          // On complete
          onComplete: () => {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          },

          // On error
          onError: (error) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`)
            );
            controller.close();
          }
        }
      );
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Frontend (Stream Consumption):**

```typescript
// components/chat/useStreamingChat.ts
export function useStreamingChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState('');

  const sendMessage = async (content: string, attachments: FileReference[]) => {
    // Add user message immediately
    const userMsg: Message = { role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    // Start streaming
    setIsStreaming(true);
    setStreamingContent('');

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, userMsg],
        attachments
      }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data:'));

        for (const line of lines) {
          if (line === 'data: [DONE]') continue;

          const data = JSON.parse(line.substring(5));

          if (data.type === 'token') {
            setStreamingContent(prev => prev + data.content);
          }

          if (data.type === 'status') {
            setStatus(data.message);
          }

          if (data.type === 'error') {
            console.error(data.message);
            setIsStreaming(false);
            return;
          }
        }
      }
    } finally {
      // Finalize message
      const agentMsg: Message = {
        role: 'assistant',
        content: streamingContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentMsg]);
      setStreamingContent('');
      setIsStreaming(false);
      setStatus('');
    }
  };

  return { messages, streamingContent, isStreaming, status, sendMessage };
}

// components/chat/MessageBubble.tsx
export function MessageBubble({
  message,
  isStreaming
}: {
  message: Message;
  isStreaming?: boolean;
}) {
  return (
    <div className="message-bubble">
      <ReactMarkdown>{message.content}</ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-gray-700 animate-pulse ml-1">
          ▋
        </span>
      )}
    </div>
  );
}
```

**Testing Checklist:**
- [ ] Tokens appear one-by-one (not all at once)
- [ ] Streaming cursor animates at end of text
- [ ] Stop button cancels stream
- [ ] Connection errors handled gracefully
- [ ] Stream completes with [DONE] event
- [ ] Final message saved to history
- [ ] Performance is smooth (60fps, no layout thrashing)
- [ ] Works in all browsers (Chrome, Firefox, Safari, Edge)

---

### 6. Dynamic Status Messages (Story 6.9)

#### Problem
Generic status: "Agent is thinking..."

#### Solution
Tool-aware status: "Reading workflow.md...", "Writing procurement-request.md..."

#### Implementation Details

**Status Mapping:**

```typescript
// lib/openai/status-mapper.ts
export function mapToolCallToStatus(toolCall: ToolCall): string {
  const { name, arguments: args } = toolCall.function;

  switch (name) {
    case 'read_file':
      const filename = extractFilename(args.path);
      return `Reading ${filename}...`;

    case 'write_file':
      const outFilename = extractFilename(args.path);
      return `Writing ${outFilename}...`;

    case 'list_files':
      return 'Browsing files...';

    case 'execute_workflow':
      const workflowName = extractFilename(args.workflow_path);
      return `Executing ${workflowName}...`;

    default:
      return 'Processing...';
  }
}

function extractFilename(path: string): string {
  return path.split('/').pop() || 'file';
}
```

**Frontend Display:**

```typescript
// components/chat/StatusIndicator.tsx
export function StatusIndicator({
  message,
  isActive
}: {
  message: string;
  isActive: boolean;
}) {
  if (!isActive) return null;

  return (
    <div
      className="flex items-center gap-2 text-sm text-gray-600 px-4 py-2 bg-gray-50 rounded-lg"
      role="status"
      aria-live="polite"
    >
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
      <span>{message}</span>
    </div>
  );
}

// Usage in ChatInterface
const { status, isStreaming } = useStreamingChat();

return (
  <div>
    {/* ... messages ... */}
    <StatusIndicator message={status || 'Agent is thinking...'} isActive={isStreaming} />
  </div>
);
```

**Testing Checklist:**
- [ ] "Reading X..." when agent calls read_file
- [ ] "Writing Y..." when agent calls write_file
- [ ] "Browsing files..." when agent calls list_files
- [ ] "Processing..." for other actions
- [ ] Status updates in real-time during streaming
- [ ] Status clears when agent completes
- [ ] Pulsing dot animation
- [ ] Screen reader announces status changes (aria-live)

---

## Implementation Plan

### Story Dependencies

```
Story 6.1 (File Viewer Toggle)
  ↓
Story 6.2 (Layout Redesign) ← depends on 6.1
  ↓
Story 6.3 (Session Metadata) ← independent
  ↓
Story 6.4 (Smart Session Display) ← depends on 6.3
  ↓
Story 6.5 (File Naming Validation) ← independent
  ↓
Story 6.6 (File Attachment UI) ← depends on 6.2
  ↓
Story 6.7 (File Attachment Backend) ← depends on 6.6
  ↓
Story 6.8 (Streaming) ← independent (can run in parallel with 6.6-6.7)
  ↓
Story 6.9 (Dynamic Status) ← depends on 6.8
  ↓
Story 6.10 (Polish & Testing) ← depends on all above
```

### Sprint Planning (2-3 Sprints for Solo Developer)

**Sprint 1: UI Foundation (Stories 6.1, 6.2, 6.5)**
- Week 1: File viewer toggle + layout redesign
- Week 2: File naming validation

**Sprint 2: Data & Attachments (Stories 6.3, 6.4, 6.6, 6.7)**
- Week 1: Session metadata system + smart display
- Week 2: File attachment drag-drop + backend

**Sprint 3: Real-Time Features (Stories 6.8, 6.9, 6.10)**
- Week 1: Streaming responses + dynamic status
- Week 2: Polish, testing, documentation

---

## Testing Strategy

**Philosophy:** Minimal, high-value testing. See `/docs/solution-architecture.md` Section 15 for complete testing guidelines.

### What We Test for Epic 6

**Focus on 2-3 critical failure scenarios per feature:**

```typescript
// lib/sessions/naming.test.ts
describe('generateDisplayName', () => {
  // Test edge case: Very long user message
  it('truncates long messages to 40 characters', () => {
    const longMessage = 'I need to purchase 50 laptops, 20 monitors, and 30 keyboards for the marketing team';
    const result = generateDisplayName({
      agentName: 'Test',
      userMessage: longMessage,
      timestamp: '2025-10-07T14:30:00Z'
    });
    expect(result.length).toBeLessThanOrEqual(60); // timestamp + truncated message
  });

  // Test error handling: Invalid timestamp
  it('handles invalid timestamp gracefully', () => {
    expect(() => generateDisplayName({
      agentName: 'Test',
      timestamp: 'invalid'
    })).not.toThrow(); // Should fallback, not crash
  });
});

// lib/files/operations.test.ts - ONLY security tests
describe('validateFilename security', () => {
  it('prevents path traversal attacks', () => {
    expect(() => validateFilename('../etc/passwd')).toThrow();
    expect(() => validateFilename('../../etc/passwd')).toThrow();
  });

  it('blocks special characters that could break filesystem', () => {
    expect(() => validateFilename('file<>.txt')).toThrow();
  });
});

// app/api/sessions/route.test.ts - ONLY critical path
describe('POST /api/sessions', () => {
  it('handles corrupted manifest.json gracefully', async () => {
    // Simulate existing corrupted manifest
    await writeFile('output/test-session/manifest.json', '{ invalid');

    const response = await POST(createRequest({ agentName: 'Test' }));
    expect(response.status).toBe(200); // Doesn't crash
  });
});
```

### What We Don't Test

**Deleted tests (see deletion script):**
- ❌ E2E tests - Too slow, use manual testing
- ❌ UI rendering tests - If it renders, React works
- ❌ Animation tests - Visual QA catches these
- ❌ Performance benchmarks - Brittle, use Chrome DevTools manually

### Manual Testing Checklist (10 minutes before deploy)

**Epic 6 Specific:**
- [ ] File viewer toggles on/off smoothly
- [ ] Sessions show descriptive names (not UUIDs)
- [ ] Drag file from viewer → appears as pill in chat
- [ ] Agent responses stream word-by-word
- [ ] Status shows "Reading X..." / "Writing Y..."
- [ ] Generic filenames rejected (try "output.md")

**Performance (spot check):**
- Open DevTools Performance tab
- Toggle file viewer → should be <300ms, 60fps
- Stream a response → no dropped frames

---

## Security Considerations

### File Attachment Security

**Path Traversal Prevention:**
```typescript
const outputDir = path.resolve(process.env.OUTPUT_DIR!);
const fullPath = path.resolve(outputDir, filepath);

if (!fullPath.startsWith(outputDir)) {
  throw new Error('Invalid file path');
}
```

**File Size Limits:**
- Max 1MB per attachment
- Max 10 attachments per message

**Content Validation:**
- Only `.md`, `.txt`, `.csv`, `.json` files allowed for attachment
- Binary files rejected

### Session Metadata Security

**UUID Validation:**
```typescript
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!UUID_PATTERN.test(sessionId)) {
  throw new Error('Invalid session ID');
}
```

**manifest.json Parsing:**
- Try-catch with fallback for corrupted JSON
- Validate schema before use
- Sanitize all string fields

### Streaming Security

**Timeout Protection:**
- 60s max for streaming connections
- Auto-abort on client disconnect

**Error Handling:**
- Never leak internal errors to client
- Log full errors server-side
- Return sanitized error messages

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1)
- Deploy to staging environment
- Developer testing (all stories)
- Fix critical bugs

### Phase 2: Limited Rollout (Week 2)
- Enable for 10% of users (feature flag)
- Monitor error rates, performance metrics
- Collect user feedback

### Phase 3: Full Rollout (Week 3)
- Enable for 100% of users
- Announce new features in changelog
- Update documentation

### Rollback Plan
- Feature flags allow instant disable
- Session metadata backward compatible (old sessions still work without manifest)
- File viewer toggle defaults to "open" (preserves old behavior)

---

## Success Metrics

### User Experience Metrics
- **File Viewer Usage:** % of sessions where viewer is collapsed (target: >30%)
- **Session Findability:** Time to find specific session (target: <10s)
- **Perceived Latency:** User satisfaction with streaming (survey: target >80% positive)
- **File Attachment Usage:** % of messages with attachments (track adoption)

### Technical Metrics
- **Performance:** File viewer toggle <300ms, streaming 60fps
- **Error Rates:** <1% streaming errors, <0.1% session metadata corruption
- **Load Times:** Session list <1s for 100 sessions

### Adoption Metrics
- **Feature Discovery:** % of users who try each feature within 1 week
- **Retention:** % of users who continue using features after 1 month

---

## Documentation Updates

### User-Facing Documentation

**README.md:**
```markdown
## New Features (Epic 6)

### Collapsible File Viewer
Click the "Files" button in the top-right to toggle the file viewer. Press `Ctrl/Cmd + B` for keyboard shortcut.

### Smart Session Names
Sessions now show timestamps and message summaries instead of UUIDs. Example: "Oct 7, 2:30 PM - Purchase laptops..."

### File Attachments
Drag files from the file viewer into the chat input to provide context. The agent will reference the file content in its response.

### Streaming Responses
Agent responses now appear token-by-token as they're generated, just like ChatGPT.

### Dynamic Status
Watch real-time status messages like "Reading workflow.md..." or "Writing procurement-request.md..." to see what the agent is doing.
```

### Developer Documentation

**Architecture Documentation:**
- Add Epic 6 section to architecture.md
- Document session metadata format in API docs
- Update API reference with new endpoints

**Code Comments:**
- Inline comments for complex logic (status mapper, streaming, drag-drop)
- JSDoc for all public functions

---

## Conclusion

Epic 6 transforms Agent Orchestrator from a functional prototype into a production-ready platform with modern UX patterns. The incremental enhancement approach minimizes risk while delivering significant user value.

**Key Takeaways:**
- All features build on existing architecture (no new services)
- Beginner-friendly explanations included for all technical decisions
- Comprehensive testing strategy ensures quality
- Feature flags and phased rollout minimize deployment risk

**Next Steps:**
1. Review this tech spec with team
2. Begin Story 6.1 implementation
3. Follow sprint plan (2-3 sprints total)
4. Monitor metrics after rollout

**Related Documents:**
- `/docs/epic-6-architecture.md` - Full architectural design
- `/docs/PRD.md` - Epic 6 in product context
- `/docs/epics.md` - Story breakdown with acceptance criteria

---

**Document Status:** Ready for Implementation
**Last Updated:** 2025-10-07
**Next Review:** After Sprint 1 completion

