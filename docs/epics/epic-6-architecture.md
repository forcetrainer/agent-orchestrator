# Epic 6: Enhanced UX & Interactive Features - Solution Architecture

**Author:** Winston (Architect Agent)
**Date:** 2025-10-07
**Project:** Agent Orchestrator
**Epic:** Epic 6 - Enhanced UX & Interactive Features
**Related Documents:** PRD.md, ux-specification.md, solution-architecture.md (original)

---

## Executive Summary

This architecture document defines the technical approach for **Epic 6: Enhanced UX & Interactive Features**, which enhances the Agent Orchestrator platform with improved usability and real-time interactivity. This epic inserts between the completed Epic 5 (File Management) and the upcoming Epic 7 (Docker Deployment).

### What This Epic Delivers

**UI/UX Refinements:**
1. **Dynamic File Viewer** - Collapsible file viewer with improved layout
2. **Smart Session Naming** - User-friendly folder names replacing UUID-only approach
3. **Context-Aware File Naming** - Meaningful filenames based on file purpose

**New Capabilities:**
4. **File Reference Attachments** - Drag existing files from viewer into chat as context
5. **Streaming Responses** - Token-by-token display of agent responses
6. **Dynamic Status Messages** - Tool-aware loading indicators

### Why Now

With the core chat interface and file viewer complete (Epics 1-5), users have reported that:
- The always-visible file viewer reduces available chat space
- Files and sessions are hard to distinguish when using the same agent repeatedly
- Waiting for complete responses makes the system feel slow
- Generic "thinking..." messages don't communicate what's actually happening

These enhancements address real user feedback while preparing the foundation for production deployment (Docker, Epic 7).

### Architecture Philosophy

This epic follows the **incremental enhancement** pattern:
- Build on existing Next.js monolith architecture (no new services)
- Enhance existing components rather than replacing them
- Maintain "radical simplicity" while adding sophisticated features
- Ensure all changes are backward-compatible with existing agent workflows

---

## Technology Stack and Decisions

| Category | Technology | Version | Rationale |
|----------|-----------|---------|-----------|
| **Streaming API** | OpenAI SDK Streaming | Latest (4.x) | Built-in support for Server-Sent Events, handles backpressure automatically |
| **State Management** | React Context API | React 18+ | Already in use, sufficient for file attachment state without adding Zustand complexity |
| **Layout Framework** | CSS Grid + Flexbox | Native CSS | Dynamic resizing for collapsible panels, no library overhead |
| **Drag-Drop Library** | React DnD | 16.0.1 | Industry standard, supports file tree → input drop zones, accessible |
| **Animation Library** | Framer Motion | 10.16.4 | Smooth collapse/expand animations, spring physics for natural feel |
| **Markdown Rendering** | react-markdown | 9.0.0 | Already in use, supports streaming updates via React reconciliation |
| **UUID Generation** | crypto.randomUUID() | Native Web API | Browser-native UUID v4 for session IDs, no external dependency |
| **Session Storage** | File System (JSON) | Node.js fs/promises | Consistent with file-based architecture, stores session metadata |
| **HTTP Streaming** | ReadableStream API | Native Fetch API | Modern streaming primitives, supported in Next.js 13+ App Router |

### Key Technology Decisions Explained

**Why React DnD for Drag-Drop?**
- **Accessibility:** Built-in keyboard navigation and screen reader support
- **Flexibility:** Supports complex drop validation (only allow files, not folders)
- **Integration:** Works seamlessly with React state and event system
- **Alternative Considered:** HTML5 native drag-drop API - rejected due to poor accessibility and inconsistent browser behavior

**Why Framer Motion for Animations?**
- **Spring Physics:** Natural collapse/expand feels better than linear transitions
- **Layout Animations:** Automatically handles complex layout shifts when file viewer toggles
- **Performance:** GPU-accelerated, 60fps animations
- **Alternative Considered:** Tailwind transitions - insufficient for complex layout animations

**Why OpenAI Streaming vs. Custom Chunking?**
- **Latency:** Immediate token delivery reduces perceived wait time
- **Simplicity:** SDK handles connection management and error recovery
- **Efficiency:** Server doesn't wait for complete response before sending to client
- **Alternative Considered:** Batched updates every 100ms - rejected as it adds artificial delay

**Why File System for Session Metadata vs. In-Memory?**
- **Consistency:** Aligns with existing file-based architecture
- **Persistence:** Sessions survive server restarts (important for Docker)
- **Simplicity:** No database or cache layer needed
- **Format:** JSON files in `output/{session-uuid}/manifest.json`

---

## Proposed Source Tree

```
agent-orchestrator/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   ├── route.ts         # [MODIFIED] Add streaming support
│   │   │   │   └── stream.ts        # [NEW] Streaming helpers
│   │   │   ├── files/
│   │   │   │   ├── route.ts         # Existing file operations
│   │   │   │   └── reference.ts     # [NEW] Read file for attachment
│   │   │   └── sessions/
│   │   │       ├── route.ts         # [NEW] Session metadata CRUD
│   │   │       └── utils.ts         # [NEW] Session naming logic
│   │   └── page.tsx                 # Main application page
│   │
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx    # [MODIFIED] Add streaming + attachments
│   │   │   ├── MessageBubble.tsx    # [MODIFIED] Streaming text rendering
│   │   │   ├── MessageInput.tsx     # [MODIFIED] File attachment pills
│   │   │   ├── FileAttachment.tsx   # [NEW] Pill UI component
│   │   │   ├── StatusIndicator.tsx  # [MODIFIED] Dynamic status messages
│   │   │   └── useStreamingChat.ts  # [NEW] Custom hook for streaming
│   │   │
│   │   ├── file-viewer/
│   │   │   ├── FileViewer.tsx       # [MODIFIED] Collapsible with new layout
│   │   │   ├── DirectoryTree.tsx    # [MODIFIED] Drag source for files
│   │   │   ├── FileContent.tsx      # [MODIFIED] Top/bottom split layout
│   │   │   ├── SessionLabel.tsx     # [NEW] Smart session name display
│   │   │   └── useFileViewer.ts     # [NEW] Toggle state management
│   │   │
│   │   └── layout/
│   │       ├── MainLayout.tsx       # [MODIFIED] Dynamic grid for collapsible panels
│   │       └── CollapsiblePanel.tsx # [NEW] Reusable collapse component
│   │
│   ├── lib/
│   │   ├── openai/
│   │   │   ├── client.ts            # Existing OpenAI client
│   │   │   ├── streaming.ts         # [NEW] Streaming chat completion
│   │   │   └── status-mapper.ts     # [NEW] Tool calls → status messages
│   │   │
│   │   ├── sessions/
│   │   │   ├── naming.ts            # [NEW] Session naming strategy
│   │   │   ├── metadata.ts          # [NEW] Session metadata operations
│   │   │   └── types.ts             # [NEW] Session interfaces
│   │   │
│   │   └── files/
│   │       ├── operations.ts        # Existing file ops
│   │       └── reference.ts         # [NEW] File reference for attachments
│   │
│   └── types/
│       ├── chat.ts                  # [MODIFIED] Add streaming message types
│       ├── session.ts               # [NEW] Session metadata types
│       └── attachment.ts            # [NEW] File attachment types
│
├── output/                          # File-based output directory
│   └── {session-uuid}/              # Session folders
│       ├── manifest.json            # [NEW] Session metadata
│       └── *.md                     # Agent-generated files
│
└── package.json                     # [MODIFIED] Add react-dnd, framer-motion
```

### Key Changes Highlighted

**Modified Files (12):**
- `api/chat/route.ts` - Add streaming endpoint
- `ChatInterface.tsx` - Streaming + file attachments
- `MessageBubble.tsx` - Render streaming tokens
- `MessageInput.tsx` - Attachment pills
- `StatusIndicator.tsx` - Dynamic status
- `FileViewer.tsx` - Collapsible toggle
- `DirectoryTree.tsx` - Drag source
- `FileContent.tsx` - Layout change
- `MainLayout.tsx` - Dynamic grid
- `chat.ts` types - Streaming message types
- `package.json` - New dependencies

**New Files (15):**
- `api/chat/stream.ts` - Streaming helpers
- `api/files/reference.ts` - File attachment reader
- `api/sessions/route.ts` - Session metadata API
- `api/sessions/utils.ts` - Session naming
- `FileAttachment.tsx` - Pill component
- `useStreamingChat.ts` - Streaming hook
- `SessionLabel.tsx` - Smart name display
- `useFileViewer.ts` - Toggle state hook
- `CollapsiblePanel.tsx` - Reusable collapse
- `lib/openai/streaming.ts` - Streaming logic
- `lib/openai/status-mapper.ts` - Status messages
- `lib/sessions/*` - Session utilities (3 files)
- `lib/files/reference.ts` - File reference
- `types/session.ts` - Session types
- `types/attachment.ts` - Attachment types

---

## Feature 1: Dynamic File Viewer

### Current Behavior
- File viewer always visible at 30% screen width (right side)
- Left/right split: Chat (70%) | File Viewer (30%)
- No way to hide file viewer for focused chat reading
- File content panel feels cramped in narrow space

### New Behavior
- **Toggle Button:** Top-right corner, collapses/expands file viewer
- **Chat Expansion:** When viewer closed, chat uses 100% width
- **Layout Change:** File content display uses top/bottom split internally
  - Top 40%: Directory tree (horizontal list or compact tree)
  - Bottom 60%: File content (full width, better readability)
- **Smooth Animation:** 300ms spring animation on toggle

### Architecture Design

**Component Structure:**

```tsx
// MainLayout.tsx
<div className="grid grid-cols-[1fr] lg:grid-cols-[1fr_auto]">
  <ChatInterface />

  <AnimatePresence>
    {isFileViewerOpen && (
      <CollapsiblePanel
        side="right"
        width="30%"
        minWidth="400px"
      >
        <FileViewer layout="top-bottom" />
      </CollapsiblePanel>
    )}
  </AnimatePresence>
</div>
```

**State Management:**

```typescript
// useFileViewer.ts
export function useFileViewer() {
  const [isOpen, setIsOpen] = useState(true); // Default open

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, toggle };
}
```

**Layout Implementation:**

```css
/* Dynamic grid adjusts based on viewer state */
.main-layout {
  display: grid;
  grid-template-columns: 1fr; /* Chat only when viewer closed */
}

.main-layout.viewer-open {
  grid-template-columns: 1fr 30%; /* Chat | Viewer when open */
}

/* File viewer internal layout: top/bottom split */
.file-viewer-internal {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.directory-tree {
  height: 40%; /* Top section */
  overflow-y: auto;
  border-bottom: 1px solid #e5e7eb;
}

.file-content {
  height: 60%; /* Bottom section */
  overflow-y: auto;
}
```

**Why This Approach:**
- **CSS Grid** handles responsive layout without JavaScript calculations
- **Framer Motion** provides smooth physics-based animations
- **Flexbox** for internal file viewer layout (simpler than nested grid)
- **AnimatePresence** ensures exit animations complete before unmounting

---

## Feature 2: Smart Session Naming

### Problem Statement

**Current:** Session folders use metadata-based names like:
```
procurement-advisor-intake-workflow/
procurement-advisor-intake-workflow/  # Same name, different session!
```

Both folders have same agent + workflow, differentiated only by hidden UUID. Users can't tell which session is which.

### Proposed Solution

**Smart Naming Strategy (Multi-Tier):**

```typescript
interface SessionMetadata {
  id: string;              // UUID (e.g., "a1b2c3d4-...")
  agentName: string;       // "Procurement Advisor"
  workflowName?: string;   // "Intake Workflow" (if applicable)
  timestamp: string;       // ISO 8601: "2025-10-07T14:30:00Z"
  userSummary?: string;    // First 50 chars of user's first message
  displayName: string;     // Computed display name
}
```

**Naming Algorithm:**

```typescript
function generateDisplayName(metadata: SessionMetadata): string {
  const date = new Date(metadata.timestamp);
  const timeStr = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }); // "Oct 7, 2:30 PM"

  // Option 1: Include user summary if available (most descriptive)
  if (metadata.userSummary) {
    return `${timeStr} - ${truncate(metadata.userSummary, 40)}`;
    // "Oct 7, 2:30 PM - I need to purchase 10 laptops..."
  }

  // Option 2: Workflow + timestamp (if workflow known)
  if (metadata.workflowName) {
    return `${metadata.workflowName} - ${timeStr}`;
    // "Intake Workflow - Oct 7, 2:30 PM"
  }

  // Option 3: Agent + timestamp (fallback)
  return `${metadata.agentName} - ${timeStr}`;
  // "Procurement Advisor - Oct 7, 2:30 PM"
}
```

**Directory Structure on Disk:**

```
output/
├── a1b2c3d4-e5f6-7890-abcd-ef1234567890/  # UUID folder name (unchanged)
│   ├── manifest.json                      # NEW: Session metadata
│   ├── procurement-request.md
│   └── approval-checklist.md
│
└── b2c3d4e5-f6a7-8901-bcde-f12345678901/  # Different UUID
    ├── manifest.json
    └── budget-analysis.md
```

**manifest.json Format:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "agentName": "Procurement Advisor",
  "workflowName": "Intake Workflow",
  "timestamp": "2025-10-07T14:30:00.000Z",
  "userSummary": "I need to purchase 10 laptops for the marketing team",
  "displayName": "Oct 7, 2:30 PM - I need to purchase 10 laptops...",
  "files": [
    "procurement-request.md",
    "approval-checklist.md"
  ]
}
```

**UI Display in Directory Tree:**

```
📁 Sessions
├─ 📂 Oct 7, 2:30 PM - I need to purchase 10 laptops...
│  ├─ 📄 procurement-request.md
│  └─ 📄 approval-checklist.md
│
└─ 📂 Oct 7, 3:15 PM - Software license quote needed
   └─ 📄 budget-analysis.md
```

**Why This Works:**
1. **User Summary** provides context (what they asked for)
2. **Timestamp** differentiates multiple sessions on same day
3. **Graceful Degradation** falls back to workflow or agent name if no summary
4. **Disk Names Unchanged** - UUIDs on disk, friendly names in UI only

### API Endpoints

```typescript
// POST /api/sessions
// Create new session
{
  agentName: string;
  workflowName?: string;
  userMessage: string; // First message becomes summary
}
Response: { id: string, displayName: string }

// GET /api/sessions
// List all sessions with display names
Response: SessionMetadata[]

// PATCH /api/sessions/:id
// Update session metadata (e.g., add files)
{
  files?: string[];
}
```

### Implementation Details

**When Session Created:**
1. User selects agent and sends first message
2. Backend generates UUID via `crypto.randomUUID()`
3. Extract first 50 characters of user message as `userSummary`
4. Compute `displayName` using algorithm above
5. Create `output/{uuid}/manifest.json` with metadata
6. Return session ID to frontend

**When Session Loaded:**
1. Frontend fetches `GET /api/sessions`
2. Backend reads all `manifest.json` files from `output/*/`
3. Returns array of session metadata with display names
4. UI displays user-friendly names in directory tree

**Why manifest.json:**
- **Fast Lookups:** Read single JSON file instead of scanning all files
- **Extensible:** Can add custom metadata later (tags, favorites, etc.)
- **Atomic Writes:** File system guarantees prevent corruption
- **Human-Readable:** Agent builders can inspect/debug sessions easily

---

## Feature 3: Context-Aware File Naming

### Problem Statement

**Current:** Agents write generic filenames:
```
output.md
output-2.md
result.txt
```

Users can't distinguish files without opening them.

### Solution

**Agent Instructions Updated:**
Agents specify meaningful filenames in their `write_file()` tool calls:

```typescript
// OLD (vague)
write_file({ path: "output.md", content: "..." })

// NEW (descriptive)
write_file({
  path: "procurement-request.md",  // Function-based name
  content: "..."
})
```

**Backend Validation:**

```typescript
// lib/files/operations.ts
function validateFilename(filename: string): void {
  // Prevent generic names
  const genericPatterns = [
    /^output(-\d+)?\.md$/,
    /^result\.txt$/,
    /^file\d*\./,
    /^untitled/
  ];

  if (genericPatterns.some(pattern => pattern.test(filename))) {
    throw new Error(
      `Generic filename "${filename}" not allowed. ` +
      `Please use descriptive name (e.g., "procurement-request.md")`
    );
  }

  // Sanitize: Remove path traversal, special chars
  if (filename.includes('..') || /[<>:"|?*]/.test(filename)) {
    throw new Error('Invalid characters in filename');
  }
}
```

**Agent Guidance (System Prompt Addition):**

```
CRITICAL: When writing files, use descriptive filenames based on file purpose:

Examples:
✅ GOOD:
  - procurement-request.md (what it is)
  - budget-analysis-q3.csv (purpose + context)
  - approval-checklist.md (function)

❌ BAD:
  - output.md (too generic)
  - file.txt (meaningless)
  - result-2.md (numbered generic)

Rules:
- Use kebab-case (lowercase with hyphens)
- Include purpose or content type
- Add context if needed (dates, departments)
- Keep under 50 characters
- Use standard extensions (.md, .csv, .txt, .json)
```

**Why This Approach:**
- **No New Code:** Just validation and agent guidance
- **Agent Controlled:** Agents understand context better than system
- **User-Friendly:** Filenames are self-documenting
- **Backward Compatible:** Existing files keep generic names until regenerated

---

## Feature 4: File Reference Attachments

### Use Case

User wants to reference a file previously generated by the agent:

**Example:**
1. Agent creates `procurement-request.md` in earlier conversation
2. User wants to continue: "Review this request and add vendor quotes"
3. User drags `procurement-request.md` from file viewer into chat input
4. File appears as pill/chip in input field
5. On send, backend reads file content and injects into conversation

### Architecture Design

**Frontend Flow:**

```
1. User drags file from DirectoryTree
   ↓
2. Drop zone in MessageInput accepts file
   ↓
3. FileAttachment pill appears in input
   ↓
4. User types message: "Review this request..."
   ↓
5. On send: Send message + file reference to backend
   ↓
6. Backend reads file, injects content into conversation context
   ↓
7. Agent receives message with file content available
```

**Component Implementation:**

```tsx
// FileAttachment.tsx - Pill UI component
interface FileAttachmentProps {
  filename: string;
  filepath: string;
  onRemove: () => void;
}

function FileAttachment({ filename, filepath, onRemove }: FileAttachmentProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1
                    bg-blue-100 rounded-full text-sm">
      <span className="text-blue-800">📎 {filename}</span>
      <button
        onClick={onRemove}
        className="text-blue-600 hover:text-blue-800"
        aria-label={`Remove ${filename}`}
      >
        ✕
      </button>
    </div>
  );
}
```

**Drag-Drop Implementation:**

```tsx
// DirectoryTree.tsx - Drag source
import { useDrag } from 'react-dnd';

function FileItem({ file }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'FILE_REFERENCE',
    item: { filepath: file.path, filename: file.name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="cursor-move"
    >
      📄 {file.name}
    </div>
  );
}

// MessageInput.tsx - Drop zone
import { useDrop } from 'react-dnd';

function MessageInput() {
  const [attachments, setAttachments] = useState<FileReference[]>([]);

  const [{ isOver }, drop] = useDrop({
    accept: 'FILE_REFERENCE',
    drop: (item: { filepath: string, filename: string }) => {
      setAttachments(prev => [...prev, item]);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div ref={drop} className={isOver ? 'bg-blue-50' : ''}>
      {/* Attachment pills */}
      {attachments.map((file, i) => (
        <FileAttachment
          key={i}
          filename={file.filename}
          filepath={file.filepath}
          onRemove={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
        />
      ))}

      {/* Text input */}
      <textarea placeholder="Type message..." />
    </div>
  );
}
```

**Backend Processing:**

```typescript
// API endpoint: POST /api/chat
async function handleChatMessage(req: Request) {
  const { message, attachments } = await req.json();

  // Read file contents for each attachment
  const fileContents = await Promise.all(
    attachments.map(async (ref: FileReference) => {
      const content = await readFile(ref.filepath, 'utf-8');
      return {
        filename: ref.filename,
        content
      };
    })
  );

  // Build conversation context with file contents
  const messages = [
    {
      role: 'system',
      content: 'Files attached by user:\n' +
        fileContents.map(f =>
          `File: ${f.filename}\n---\n${f.content}\n---`
        ).join('\n\n')
    },
    {
      role: 'user',
      content: message
    }
  ];

  // Send to OpenAI with file context
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    // ... other options
  });

  return response;
}
```

**Why React DnD:**
- **Accessibility:** Keyboard-navigable drag-drop (Tab to file, Space to grab, Arrow keys to move, Space to drop)
- **Visual Feedback:** Built-in `isDragging` and `isOver` states
- **Type Safety:** Strong typing for drag item shape
- **Browser Compatibility:** Normalizes inconsistent HTML5 drag-drop APIs

**Security Considerations:**
- **Path Validation:** Only allow files from `output/` directory
- **No Uploads:** This is NOT file upload - only references to existing files
- **Size Limits:** Reject files >1MB to prevent context overflow
- **Injection Prevention:** Sanitize file content before injecting into prompts

---

## Feature 5: Streaming Responses

### ⚠️ CRITICAL IMPLEMENTATION NOTE

**Streaming is a DISPLAY-ONLY enhancement.** It shows tokens as they arrive from the LLM but MUST NOT bypass or replace the existing agentic execution loop.

**What Changes:** Visual display of response text appears token-by-token

**What Stays the Same:** Agentic loop, tool execution, workflow handling, status indicators, ALL existing chat logic

**Implementation Rule:** All tool calls MUST execute synchronously within the streaming flow:
1. LLM generates tool call → **PAUSE** streaming
2. Execute tool (existing logic)
3. Inject tool result into conversation context
4. **RESUME** streaming with tool results available

Violating this constraint will break workflow execution, tool handling, and agent functionality.

---

### Problem Statement

**Current:** User sends message → waits → full response appears
- No feedback during wait (just "thinking...")
- Feels slow even if response is fast
- Can't see partial results for long responses

**New:** Token-by-token streaming like ChatGPT
- Tokens appear as agent generates them
- Perceived latency reduced by 50-70%
- User sees progress in real-time

### Architecture Design

**OpenAI API Integration:**

```typescript
// lib/openai/streaming.ts
export async function streamChatCompletion(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  onToolCall: (toolCall: ToolCall) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) {
  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      stream: true, // Enable streaming
      tools: [...], // Tool definitions
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      // Handle text tokens
      if (delta?.content) {
        onToken(delta.content);
      }

      // Handle tool calls
      if (delta?.tool_calls) {
        onToolCall(delta.tool_calls[0]);
      }

      // Check if done
      if (chunk.choices[0]?.finish_reason) {
        onComplete();
      }
    }
  } catch (error) {
    onError(error);
  }
}
```

**Backend API Route (Streaming):**

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages, attachments } = await req.json();

  // Create ReadableStream for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      await streamChatCompletion(
        messages,

        // On token: Send to client
        (token) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`)
          );
        },

        // On tool call: Send status update
        (toolCall) => {
          const status = mapToolCallToStatus(toolCall);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'status', message: status })}\n\n`)
          );
        },

        // On complete
        () => {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },

        // On error
        (error) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`)
          );
          controller.close();
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

**Frontend React Hook:**

```typescript
// components/chat/useStreamingChat.ts
export function useStreamingChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data:'));

      for (const line of lines) {
        const data = JSON.parse(line.substring(5));

        if (data.type === 'token') {
          setStreamingContent(prev => prev + data.content);
        }

        if (data.type === 'status') {
          // Update status indicator (Feature 6)
          setStatus(data.message);
        }

        if (data.type === 'error') {
          // Handle error
          console.error(data.message);
        }
      }
    }

    // Finalize message
    const agentMsg: Message = {
      role: 'assistant',
      content: streamingContent,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, agentMsg]);
    setStreamingContent('');
    setIsStreaming(false);
  };

  return { messages, streamingContent, isStreaming, sendMessage };
}
```

**React Component Rendering:**

```tsx
// MessageBubble.tsx
function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  return (
    <div className="message-bubble">
      <ReactMarkdown>
        {message.content}
      </ReactMarkdown>

      {isStreaming && (
        <span className="streaming-cursor animate-pulse">▋</span>
      )}
    </div>
  );
}
```

**Why Server-Sent Events (SSE):**
- **Simplicity:** Built into Fetch API, no WebSocket complexity
- **Reconnection:** Browser auto-reconnects if connection drops
- **HTTP-Friendly:** Works with standard HTTP/HTTPS, no special protocols
- **Next.js Support:** Native support in App Router with ReadableStream

**Performance Optimization:**
- **Batching:** Accumulate tokens for 16ms (1 frame) before rendering to avoid layout thrashing
- **React Reconciliation:** ReactMarkdown efficiently diffs partial content
- **Backpressure:** ReadableStream pauses if client can't keep up

---

## Feature 6: Dynamic Status Messages

### Problem Statement

**Current:** Generic status messages
- "Agent is thinking..." (always, regardless of what's happening)
- "Agent is loading..." (only during initial load)

**New:** Context-aware status based on agent actions
- "Reading workflow.md..." (agent loading file)
- "Writing procurement-request.md..." (agent creating file)
- "Analyzing budget requirements..." (agent processing)
- "Executing workflow step 3..." (agent in workflow)

### Architecture Design

**Tool Call Status Mapping:**

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

**Extended Status for Custom Actions:**

Agents can also emit custom status via special message format:

```typescript
// Agent instruction pattern
"Before performing complex analysis, inform the user:

  Tool: status_update
  Message: 'Analyzing budget requirements...'
"
```

**Backend Integration:**

```typescript
// During streaming (app/api/chat/route.ts)
if (delta?.tool_calls) {
  const toolCall = delta.tool_calls[0];
  const status = mapToolCallToStatus(toolCall);

  // Emit status event to frontend
  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify({
      type: 'status',
      message: status
    })}\n\n`)
  );
}
```

**Frontend Display:**

```tsx
// StatusIndicator.tsx
interface StatusIndicatorProps {
  message: string;
  isActive: boolean;
}

function StatusIndicator({ message, isActive }: StatusIndicatorProps) {
  if (!isActive) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 px-4 py-2
                    bg-gray-50 rounded-lg animate-pulse">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
      <span>{message}</span>
    </div>
  );
}

// Usage in ChatInterface
<StatusIndicator
  message={currentStatus || 'Agent is thinking...'}
  isActive={isStreaming}
/>
```

**Status Message Categories:**

| Tool Call | Status Message Pattern | Example |
|-----------|----------------------|---------|
| `read_file` | "Reading {filename}..." | "Reading workflow.md..." |
| `write_file` | "Writing {filename}..." | "Writing procurement-request.md..." |
| `list_files` | "Browsing files..." | "Browsing files..." |
| Custom action | "{custom message}..." | "Analyzing budget requirements..." |
| No tool call | "Processing..." | "Processing..." (fallback) |

**Why This Approach:**
- **Zero Agent Changes:** Works with existing tool definitions
- **Automatic:** Status derived from tool calls, no manual coding
- **Extensible:** Easy to add new tools to status mapper
- **User-Friendly:** Clear, specific feedback builds trust

---

## Data Architecture

### Session Metadata Schema

```typescript
interface SessionMetadata {
  id: string;                    // UUID v4
  agentName: string;             // From bundle manifest
  agentId: string;               // Bundle ID
  workflowName?: string;         // Workflow used (if applicable)
  timestamp: string;             // ISO 8601 creation time
  lastModified: string;          // ISO 8601 last update
  userSummary?: string;          // First user message (truncated to 50 chars)
  displayName: string;           // Computed user-friendly name
  files: string[];               // Array of file paths relative to session folder
  messageCount: number;          // Total messages in conversation
  status: 'active' | 'archived'; // Session lifecycle state
}
```

**Storage Location:** `output/{session-uuid}/manifest.json`

**File Example:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "agentName": "Procurement Advisor",
  "agentId": "procurement-advisor",
  "workflowName": "Intake Workflow",
  "timestamp": "2025-10-07T14:30:00.000Z",
  "lastModified": "2025-10-07T14:45:32.000Z",
  "userSummary": "I need to purchase 10 laptops for the marketing",
  "displayName": "Oct 7, 2:30 PM - I need to purchase 10 laptops...",
  "files": [
    "procurement-request.md",
    "approval-checklist.md",
    "budget-analysis.csv"
  ],
  "messageCount": 12,
  "status": "active"
}
```

### File Reference Schema

```typescript
interface FileReference {
  filepath: string;  // Full path relative to output/ (e.g., "{uuid}/procurement-request.md")
  filename: string;  // Display name (e.g., "procurement-request.md")
  size?: number;     // File size in bytes (optional)
}
```

**Used for:** Drag-drop file attachments, no persistence needed (ephemeral state in React)

### Streaming Message Types

```typescript
// Server-Sent Event payload types
type StreamEvent =
  | { type: 'token', content: string }
  | { type: 'status', message: string }
  | { type: 'tool_call', name: string, arguments: object }
  | { type: 'error', message: string }
  | { type: 'done' };

// Frontend message structure
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: FileReference[];  // Only on user messages
  toolCalls?: ToolCall[];         // Only on assistant messages
}
```

---

## API Design

### New/Modified Endpoints

#### 1. POST /api/chat (Modified)

**Purpose:** Send message and receive streaming response

**Request:**

```typescript
{
  messages: Message[];          // Conversation history
  attachments?: FileReference[]; // Optional file references
  sessionId?: string;            // Optional session ID (creates new if omitted)
}
```

**Response:** Server-Sent Events stream

```
data: {"type":"status","message":"Reading workflow.md..."}

data: {"type":"token","content":"I"}

data: {"type":"token","content":" can"}

data: {"type":"token","content":" help"}

data: {"type":"status","message":"Writing procurement-request.md..."}

data: [DONE]
```

**Changes from Current:**
- Added `stream: true` to OpenAI API call
- Return `ReadableStream` instead of JSON
- Handle file attachments
- Emit status events during tool execution

---

#### 2. POST /api/sessions (New)

**Purpose:** Create new session with metadata

**Request:**

```typescript
{
  agentName: string;
  agentId: string;
  workflowName?: string;
  userMessage: string;  // First message becomes summary
}
```

**Response:**

```typescript
{
  id: string;           // Generated UUID
  displayName: string;  // Computed display name
  timestamp: string;    // ISO 8601
}
```

**Implementation:**

```typescript
// app/api/sessions/route.ts
export async function POST(req: Request) {
  const { agentName, agentId, workflowName, userMessage } = await req.json();

  // Generate session ID
  const id = crypto.randomUUID();

  // Create metadata
  const metadata: SessionMetadata = {
    id,
    agentName,
    agentId,
    workflowName,
    timestamp: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    userSummary: truncate(userMessage, 50),
    displayName: generateDisplayName({ agentName, workflowName, userMessage, timestamp: new Date().toISOString() }),
    files: [],
    messageCount: 0,
    status: 'active'
  };

  // Write manifest.json
  const sessionDir = path.join(process.env.OUTPUT_DIR, id);
  await fs.mkdir(sessionDir, { recursive: true });
  await fs.writeFile(
    path.join(sessionDir, 'manifest.json'),
    JSON.stringify(metadata, null, 2)
  );

  return Response.json({ id, displayName: metadata.displayName, timestamp: metadata.timestamp });
}
```

---

#### 3. GET /api/sessions (New)

**Purpose:** List all sessions with metadata

**Response:**

```typescript
{
  sessions: SessionMetadata[]
}
```

**Implementation:**

```typescript
export async function GET() {
  const outputDir = process.env.OUTPUT_DIR;
  const sessionDirs = await fs.readdir(outputDir);

  const sessions = await Promise.all(
    sessionDirs
      .filter(dir => /^[0-9a-f-]{36}$/.test(dir)) // UUID format
      .map(async (dir) => {
        const manifestPath = path.join(outputDir, dir, 'manifest.json');
        try {
          const content = await fs.readFile(manifestPath, 'utf-8');
          return JSON.parse(content) as SessionMetadata;
        } catch {
          return null; // Skip if manifest missing
        }
      })
  );

  return Response.json({
    sessions: sessions
      .filter(Boolean)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  });
}
```

---

#### 4. PATCH /api/sessions/:id (New)

**Purpose:** Update session metadata (e.g., add files)

**Request:**

```typescript
{
  files?: string[];           // Updated file list
  status?: 'active' | 'archived';
  lastModified?: string;
}
```

**Response:**

```typescript
{
  success: boolean;
  session: SessionMetadata;
}
```

---

#### 5. POST /api/files/reference (New)

**Purpose:** Read file content for attachment

**Request:**

```typescript
{
  filepath: string;  // Relative to output/ directory
}
```

**Response:**

```typescript
{
  filename: string;
  content: string;
  size: number;
}
```

**Security Validation:**

```typescript
export async function POST(req: Request) {
  const { filepath } = await req.json();

  // Validate: Must be within output directory
  const outputDir = path.resolve(process.env.OUTPUT_DIR);
  const fullPath = path.resolve(outputDir, filepath);

  if (!fullPath.startsWith(outputDir)) {
    return Response.json({ error: 'Invalid file path' }, { status: 403 });
  }

  // Size limit: 1MB
  const stats = await fs.stat(fullPath);
  if (stats.size > 1024 * 1024) {
    return Response.json({ error: 'File too large (max 1MB)' }, { status: 413 });
  }

  const content = await fs.readFile(fullPath, 'utf-8');

  return Response.json({
    filename: path.basename(filepath),
    content,
    size: stats.size
  });
}
```

---

## Cross-Cutting Concerns

### Error Handling

**Streaming Errors:**
- Connection drops mid-stream → Frontend shows "Connection lost, retrying..." and auto-retries
- OpenAI API error → Emit error event, display user-friendly message
- File read failure (attachment) → Validate before sending, show inline error in pill

**Session Errors:**
- manifest.json corrupted → Log error, skip session in directory tree
- Duplicate UUID (extremely unlikely) → Regenerate new UUID
- Disk full → Show error toast: "Cannot create session, disk full"

**Drag-Drop Errors:**
- User drags folder (not file) → Reject drop, show message "Only files can be attached"
- File doesn't exist → Validate on drop, show error pill
- File too large → Show warning in pill: "⚠️ File too large (max 1MB)"

### Performance Optimization

**Streaming:**
- **Token Batching:** Accumulate tokens for 16ms (1 frame) before React update
- **Debounced Rendering:** Use `useTransition()` for non-urgent streaming updates
- **Memo:** Memoize `MessageBubble` components to prevent re-render of old messages

**File Viewer:**
- **Lazy Loading:** Only render visible files in tree (virtualized list for 100+ files)
- **Debounced Collapse:** Wait 300ms before layout recalculation when toggling viewer
- **Passive Event Listeners:** Use `{ passive: true }` for scroll listeners

**Session List:**
- **Cache manifest.json:** In-memory cache with 1-minute TTL
- **Pagination:** Load 20 sessions initially, infinite scroll for more
- **Background Refresh:** Fetch new sessions every 30s without blocking UI

### Security

**File Access Control:**
- **Path Traversal Prevention:** Resolve paths and check `startsWith(outputDir)`
- **Whitelist Extensions:** Only `.md`, `.txt`, `.csv`, `.json` for attachments
- **Size Limits:** 1MB max per attachment, 10 attachments max per message
- **Sanitization:** Escape HTML in file content before injecting into prompts

**Session Metadata:**
- **UUID Validation:** Ensure session IDs match UUID v4 format
- **JSON Parsing:** Try-catch with fallback for corrupted manifests
- **Rate Limiting:** Max 1 session creation per second per client

**Streaming:**
- **Timeout:** 60s max for streaming connections
- **Abort Controller:** Clean up streams on component unmount
- **Error Boundaries:** Wrap streaming components to catch rendering errors

### Accessibility

**Drag-Drop:**
- **Keyboard Alternative:** Button in directory tree: "Attach to Chat" (Space to activate)
- **Screen Reader:** Announce "File attached" when pill added
- **Focus Management:** Focus moves to pill after drop, Tab navigates to remove button

**File Viewer Toggle:**
- **ARIA:** `aria-expanded` on toggle button, `aria-label="Toggle file viewer"`
- **Keyboard:** `Ctrl/Cmd + B` shortcut documented and implemented
- **Focus Trap:** When viewer opens, focus moves inside (Escape to close)

**Streaming Status:**
- **Live Region:** `aria-live="polite"` on status indicator
- **Screen Reader:** Announces status changes without interrupting
- **Visual:** Animated pulsing dot + text for dual sensory feedback

---

## Implementation Guidance

### Story Breakdown (Estimated: 10 stories)

**Story 6.1: Dynamic File Viewer Toggle (3 points)**
- Add toggle button to top navigation
- Implement collapse/expand animation with Framer Motion
- Update CSS Grid layout for dynamic resizing
- Keyboard shortcut `Ctrl/Cmd + B`
- Acceptance: File viewer collapses smoothly, chat uses full width

**Story 6.2: File Viewer Layout Redesign (2 points)**
- Change internal layout from left/right to top/bottom split
- Directory tree at top (40% height, horizontal or compact)
- File content at bottom (60% height, full width)
- Acceptance: File content is easier to read in wider format

**Story 6.3: Session Metadata System (5 points)**
- Create `manifest.json` schema and types
- Implement session creation API (`POST /api/sessions`)
- Implement session listing API (`GET /api/sessions`)
- Generate display names from metadata
- Acceptance: New sessions have manifest.json with display name

**Story 6.4: Smart Session Display (3 points)**
- Update directory tree to show display names instead of UUIDs
- Implement session name tooltip (shows full UUID on hover)
- Sort sessions by timestamp (newest first)
- Acceptance: Sessions have user-friendly names in file viewer

**Story 6.5: Context-Aware File Naming (2 points)**
- Update agent system prompt with filename guidelines
- Add backend validation for generic filenames
- Return helpful error messages for bad filenames
- Acceptance: Agents generate descriptive filenames, generic names rejected

**Story 6.6: File Reference Attachment UI (5 points)**
- Install react-dnd library
- Implement drag source in DirectoryTree
- Implement drop zone in MessageInput
- Create FileAttachment pill component with remove button
- Acceptance: User can drag file from tree to input, pill appears

**Story 6.7: File Attachment Backend (3 points)**
- Create `/api/files/reference` endpoint
- Validate file paths and sizes
- Inject file content into conversation context
- Acceptance: Attached files' content available to agent

**Story 6.8: OpenAI Streaming Integration (5 points)**
- Update OpenAI client for streaming mode
- Create SSE endpoint in `/api/chat`
- Implement `useStreamingChat` hook
- Handle token-by-token rendering in MessageBubble
- Acceptance: Responses stream in real-time

**Story 6.9: Dynamic Status Messages (3 points)**
- Create status mapper for tool calls
- Emit status events during streaming
- Update StatusIndicator component
- Acceptance: Status shows "Reading X...", "Writing Y..." based on tool

**Story 6.10: Polish & Testing (3 points)**
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Accessibility audit (keyboard nav, screen readers)
- Performance testing (100 sessions, large files)
- Documentation updates (README, user guide)
- Acceptance: All features work smoothly, accessible, performant

**Total Estimated Points:** 34 points (~2-3 sprints for solo developer)

---

### Testing Strategy

**Unit Tests:**
- Session naming algorithm (various input combinations)
- File path validation (path traversal attacks)
- Status message mapper (all tool types)
- Filename validation (generic patterns)

**Integration Tests:**
- Streaming end-to-end (send message → receive tokens)
- File attachment flow (drag → attach → send → agent receives)
- Session creation → listing → update
- File viewer toggle → layout resize

**E2E Tests (Playwright):**
- User journey: Create session, send message, attach file, receive streaming response
- File viewer: Toggle open/close, drag file to chat
- Session list: Verify display names, sort order

**Manual Testing:**
- Accessibility: Tab navigation, screen reader announcements
- Cross-browser: Chrome, Firefox, Safari, Edge
- Performance: 100 sessions, 50 files, large attachments

---

## Architecture Decision Records (ADRs)

### ADR-1: Use Server-Sent Events for Streaming Instead of WebSocket

**Status:** Accepted

**Context:**
Streaming responses require real-time communication from server to client. Options: WebSocket or Server-Sent Events (SSE).

**Decision:**
Use SSE via ReadableStream and Fetch API.

**Rationale:**
- **Simplicity:** SSE is one-way (server → client), which matches our use case
- **HTTP-Friendly:** Works over standard HTTP/HTTPS, no protocol upgrade needed
- **Next.js Support:** Native support in App Router with ReadableStream
- **Auto-Reconnect:** Browser automatically reconnects if connection drops
- **No State:** Stateless connections simplify deployment (no WebSocket session management)

**Consequences:**
- ✅ Simpler implementation and debugging
- ✅ Works through proxies and firewalls that block WebSocket
- ✅ No need for Socket.io or similar library
- ❌ One-way only (can't stop stream mid-flight from client without aborting request)
- ❌ Not suitable for bidirectional real-time (acceptable for this use case)

---

### ADR-2: Use React DnD for File Attachments Instead of Native HTML5

**Status:** Accepted

**Context:**
File attachment requires drag-drop from file tree to chat input. Options: Native HTML5 drag-drop API or React DnD library.

**Decision:**
Use React DnD library.

**Rationale:**
- **Accessibility:** Built-in keyboard navigation for drag-drop (Space to grab, Arrow keys to move)
- **Consistency:** Normalizes browser inconsistencies in HTML5 drag-drop
- **Type Safety:** Strong TypeScript types for drag items
- **Visual Feedback:** Easy `isDragging`, `isOver` states for UI feedback
- **Maintainability:** Declarative API easier to understand than imperative HTML5

**Consequences:**
- ✅ Accessible by default (WCAG compliant)
- ✅ Works consistently across browsers
- ✅ Less boilerplate than native API
- ❌ Adds 50KB to bundle (acceptable for UX improvement)
- ❌ Learning curve for developers unfamiliar with library

---

### ADR-3: Store Session Metadata in JSON Files Instead of In-Memory or Database

**Status:** Accepted

**Context:**
Session metadata (display names, timestamps, file lists) needs persistent storage. Options: In-memory, JSON files, or database.

**Decision:**
Store as `manifest.json` files alongside session outputs.

**Rationale:**
- **Consistency:** Aligns with file-based architecture (no database in MVP)
- **Persistence:** Survives server restarts and Docker container recreation
- **Simplicity:** No database schema, migrations, or ORM needed
- **Portability:** Sessions are self-contained folders (easy to backup, move, share)
- **Human-Readable:** Agent builders can inspect/debug manifest.json directly

**Consequences:**
- ✅ Zero infrastructure overhead
- ✅ Docker-friendly (volume mount persists sessions)
- ✅ Easy to implement and debug
- ❌ Slower for large session counts (100+ requires caching)
- ❌ No relational queries (acceptable for simple listing/sorting)

**Mitigation:**
- Implement in-memory cache with 1-minute TTL for session list
- Paginate session list (load 20 at a time)

---

### ADR-4: Use Framer Motion for Animations Instead of CSS Transitions

**Status:** Accepted

**Context:**
Collapsible file viewer requires smooth animations for toggle. Options: CSS transitions, React Spring, or Framer Motion.

**Decision:**
Use Framer Motion.

**Rationale:**
- **Layout Animations:** Automatically animates complex layout shifts (grid resizing)
- **Spring Physics:** Natural easing feels better than cubic-bezier curves
- **Declarative:** `AnimatePresence` handles mount/unmount animations cleanly
- **Performance:** GPU-accelerated, optimized for React reconciliation
- **Ecosystem:** Well-maintained, widely used in React community

**Consequences:**
- ✅ Professional-feeling animations with minimal code
- ✅ Handles edge cases (rapid toggling, mid-animation cancellation)
- ✅ Accessible (respects `prefers-reduced-motion`)
- ❌ Adds 60KB to bundle (acceptable for UX improvement)
- ❌ Overkill for simple transitions (but enables future enhancements)

---

### ADR-5: Generate Display Names Server-Side Instead of Client-Side

**Status:** Accepted

**Context:**
Session display names could be computed on server (in manifest.json) or dynamically on client.

**Decision:**
Compute and store display names in manifest.json on session creation.

**Rationale:**
- **Performance:** Client doesn't re-compute for every session on every render
- **Consistency:** All clients see same display name (no timezone or locale issues)
- **Caching:** Enables server-side caching of session list
- **Simplicity:** Client just displays pre-computed string

**Consequences:**
- ✅ Faster client rendering
- ✅ Consistent across users (if multi-user in future)
- ✅ Enables server-side sorting/filtering
- ❌ Display name can't change based on client locale (acceptable for MVP)
- ❌ Must update manifest.json if naming algorithm changes (migration needed)

---

## Completion Checklist

**Architecture Documentation:**
- [x] Technology stack decisions documented with versions
- [x] Proposed source tree shows all new/modified files
- [x] API endpoints defined with request/response schemas
- [x] Data schemas defined (SessionMetadata, FileReference, StreamEvent)
- [x] ADRs capture key architectural decisions
- [x] Cross-cutting concerns addressed (error handling, security, performance)

**Feature Specifications:**
- [x] Dynamic File Viewer: Layout, animations, toggle behavior
- [x] Smart Session Naming: Algorithm, storage, display
- [x] Context-Aware File Naming: Validation, guidelines
- [x] File Attachments: Drag-drop UI, backend processing
- [x] Streaming Responses: SSE integration, token rendering
- [x] Dynamic Status: Tool mapping, UI display

**Implementation Guidance:**
- [x] 10 user stories with point estimates
- [x] Testing strategy (unit, integration, E2E, manual)
- [x] Security considerations documented
- [x] Accessibility requirements specified
- [x] Performance optimization strategies

**Next Steps:**
- [ ] Update PRD.md with new Epic 6, renumber Docker to Epic 7
- [ ] Generate tech spec for Epic 6 with detailed acceptance criteria
- [ ] Create project-workflow-analysis update with Epic 6 status
- [ ] Update UX specification with new interaction patterns

---

**Document Status:** Complete and ready for tech spec generation

**Estimated Timeline:** 2-3 sprints (34 story points) for solo developer

**Risk Level:** Low - All features build on existing architecture, no new services or infrastructure

