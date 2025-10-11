# Solution Architecture Document

**Project:** Agent Orchestrator
**Date:** 2025-10-02
**Author:** Bryan

## Executive Summary

Agent Orchestrator is a lightweight web platform that enables BMAD agent builders to validate OpenAI API compatibility and deploy agents to end users. This architecture prioritizes **radical simplicity** - a clean, minimal prototype that demonstrates BMAD agents working with OpenAI's function calling, accessible through a familiar ChatGPT-style interface.

**Architecture Approach:** Monolithic Next.js application with file-based storage
**Deployment:** Single Docker container with volume mounts
**Core Value:** Prove BMAD + OpenAI compatibility with minimal complexity

This document provides a complete technical blueprint for building a simple, clean application focused on the core prototype goal.

## 1. Technology Stack and Decisions

### 1.1 Technology and Library Decision Table

| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| Framework | Next.js | 14.2.0 | Modern React framework with built-in SSR, API routes, and file-based routing. App Router simplifies development. |
| Language | TypeScript | 5.3.0 | Type safety catches errors early, excellent IDE support, modern Next.js default. |
| Runtime | Node.js | 20 LTS | Stable long-term support, required for Next.js, excellent ecosystem. |
| Package Manager | npm | 10.x | Ships with Node.js, simple, no additional setup required. |
| Styling | Tailwind CSS | 3.4.0 | Utility-first CSS matches UX spec, rapid development, small bundle size. |
| UI Components | Headless UI | 1.7.18 | Unstyled accessible components (dropdowns, modals), pairs well with Tailwind. |
| Markdown Rendering | react-markdown | 9.0.1 | Renders agent responses and file content, supports GitHub-flavored markdown. |
| Markdown Plugins | remark-gfm | 4.0.0 | Adds GitHub-flavored markdown support (tables, task lists, strikethrough). |
| LLM Integration | openai | 4.28.0 | Official OpenAI SDK, supports function calling pattern for file operations. |
| File Operations | fs/promises | Built-in Node.js | Native Node.js file system with async/await, no external dependencies. |
| Path Security | path | Built-in Node.js | Path validation and resolution to prevent directory traversal attacks. |
| HTTP Client | fetch | Built-in | Native fetch API in Node.js 18+, no axios needed. |
| Containerization | Docker | 24.x | Single container deployment, volume mounts for agents and outputs. |
| Development | tsx | 4.7.1 | TypeScript execution for scripts, development utilities. |

**Design Philosophy Applied:**
- **Minimal Dependencies:** Use Next.js and Node.js built-ins wherever possible
- **Specific Versions:** Lock versions for reproducibility
- **No Database:** File-based storage eliminates PostgreSQL/MongoDB complexity
- **No Auth Platform:** Trusted local deployment removes Auth0/Clerk/NextAuth
- **No Cloud Services:** Self-contained application, no Vercel/AWS dependencies

## 2. Application Architecture

### 2.1 Architecture Pattern

**Pattern:** Modular Monolith (Single Next.js Application)

```
┌─────────────────────────────────────────────────┐
│              Next.js Application                 │
│                                                  │
│  ┌────────────┐         ┌──────────────────┐   │
│  │  Frontend  │────────>│   API Routes     │   │
│  │  (React)   │         │  (/app/api/...)  │   │
│  └────────────┘         └──────────────────┘   │
│                                  │               │
│                                  v               │
│                         ┌──────────────────┐   │
│                         │  Business Logic  │   │
│                         │   (/lib/...)     │   │
│                         └──────────────────┘   │
│                                  │               │
│                         ┌────────┴────────┐    │
│                         │                 │     │
│                         v                 v     │
│                  ┌──────────┐      ┌──────────┐│
│                  │ File I/O │      │  OpenAI  ││
│                  └──────────┘      └──────────┘│
└─────────────────────────────────────────────────┘
                         │                 │
                         v                 v
                  ┌──────────┐      ┌──────────┐
                  │  Agents  │      │  OpenAI  │
                  │  Folder  │      │   API    │
                  └──────────┘      └──────────┘
```

**Why Monolith?**
- Single codebase = easier to understand and maintain
- Shared TypeScript types across frontend and backend
- No microservices complexity or service-to-service communication
- Perfect for solo developer building a prototype

### 2.2 Server-Side Rendering Strategy

**Approach:** Hybrid Rendering (Server Components + Client Components)

- **Server Components (Default):** Static layout, navigation bar, file viewer structure
- **Client Components:** Chat interface, message input, interactive elements
- **API Routes:** Backend logic for OpenAI integration and file operations

**Why This Strategy?**
- Server components reduce JavaScript bundle size
- Client components enable real-time interactivity (chat, loading states)
- Next.js App Router makes this pattern natural and simple

### 2.3 Page Routing and Navigation

**Single Page Application (SPA) Structure:**

```
/ (root)
  └── Main application layout
      ├── Top navigation (server component)
      ├── Chat interface (client component)
      └── File viewer (client component, collapsible)
```

**No Multi-Page Routing:**
- Single screen design per UX spec
- No need for `/chat`, `/files`, etc.
- Panel states managed by client-side React state

### 2.4 Data Fetching Approach

**Frontend → API Routes → Business Logic Pattern:**

```typescript
// Frontend fetches from API routes
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message, agentId })
})

// API route calls business logic
export async function POST(req: Request) {
  const { message, agentId } = await req.json()
  const result = await chatService.sendMessage(message, agentId)
  return Response.json(result)
}
```

**Why This Pattern?**
- Clean separation: UI doesn't touch file system or OpenAI directly
- API routes provide security boundary
- Easy to test business logic independently

## 3. Data Architecture

### 3.1 Database Schema

**No Database - File-Based Storage**

Instead of a database, we use the file system:

```
/agents/                  (Read-only, mounted volume)
  └── [agent-name]/
      ├── agent.md         (Agent definition)
      ├── instructions/    (Agent instructions)
      └── workflows/       (Agent workflows)

/output/                  (Read-write, mounted volume)
  └── [session-folders]/  (Organized by user/session)
      └── *.md, *.txt     (Agent-generated files)
```

**Why No Database?**
- Simplicity: No schema migrations, no ORM, no connection pooling
- Prototype focus: File system is sufficient for MVP
- Deployment: No database container or managed service needed
- BMAD philosophy: File-based architecture aligns with agent methodology

### 3.2 Data Models and Relationships

**TypeScript Types (In-Memory Data Structures):**

```typescript
// Core domain types
interface Agent {
  id: string
  name: string
  description: string
  path: string
  mainFile: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  agentId: string
  messages: Message[]
  createdAt: Date
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

interface FunctionCall {
  name: string
  arguments: Record<string, any>
}
```

**Relationships:**
- Agent → Conversation (one-to-many, in-memory only)
- Conversation → Messages (one-to-many, in-memory only)
- No persistence: Conversations exist only during active session

### 3.3 Data Migrations Strategy

**Not Applicable - No Database**

Configuration managed through:
- Environment variables (`.env.local`)
- Docker volumes for file paths
- No migration scripts needed

## 4. API Design

### 4.1 API Structure

**RESTful JSON API via Next.js API Routes**

All API routes under `/app/api/`:

```
/app/api/
  ├── agents/
  │   └── route.ts           # GET /api/agents (list available agents)
  ├── chat/
  │   └── route.ts           # POST /api/chat (send message to agent)
  ├── files/
  │   ├── route.ts           # GET /api/files (list output files)
  │   └── [path]/route.ts    # GET /api/files/[path] (read specific file)
  └── health/
      └── route.ts           # GET /api/health (health check)
```

### 4.2 API Routes

#### GET /api/agents
**Purpose:** List all available agents from agents folder

**Request:** None

**Response:**
```typescript
{
  agents: [
    {
      id: "procurement-advisor",
      name: "Procurement Advisor",
      description: "Guides users through procurement requests",
      path: "/agents/procurement-advisor"
    }
  ]
}
```

**Implementation:**
- Scan `/agents` directory recursively
- Parse agent metadata from agent.md files
- Return list of available agents

---

#### POST /api/chat
**Purpose:** Send user message to selected agent, get response via OpenAI

**Request:**
```typescript
{
  agentId: string,
  message: string,
  conversationId?: string  // Optional, for continuing conversation
}
```

**Response:**
```typescript
{
  conversationId: string,
  message: {
    id: string,
    role: "assistant",
    content: string,
    timestamp: string
  },
  functionCalls?: FunctionCall[]  // If agent used file operations
}
```

**Flow:**
1. Load agent instructions (lazy-load via file operations)
2. Build OpenAI messages array with conversation history
3. Call OpenAI API with function calling enabled
4. If function calls requested, execute them (read_file, write_file, list_files)
5. Return function results to OpenAI, get final response
6. Return response to frontend

**⚠️ Architectural Simplification (Epic 9 - October 2025):**

The workflow execution architecture was significantly simplified to improve LLM agency and reduce complexity:

**OLD APPROACH (Before Epic 9):**
- `execute_workflow` tool (640 lines) orchestrated entire workflow execution
- System automatically created session folders, generated UUIDs, auto-loaded files
- Complex tool returned 10+ field objects with mixed concerns
- LLM received massive structured data without knowing where it came from
- Path resolver did 5-pass nested variable resolution (471 lines)

**NEW APPROACH (After Epic 9 - LLM-Orchestrated):**
- LLM orchestrates workflow execution through explicit `read_file` and `save_output` calls
- System prompt instructs LLM on workflow execution pattern
- LLM decides when to create folders, load files, save outputs
- Simple tool results: `{ success: true, content: "file content here" }`
- Simplified path resolver (~150 lines) handles basic variable resolution only
- All actions visible in conversation (better debugging)

**Why the Change:**
- Removes LLM confusion from complex tool results
- Gives LLM full control and visibility over workflow steps
- Aligns with Claude Code patterns (simple file operations)
- Reduces codebase by ~580 lines
- Improves agent behavior (less "magic", more explicit actions)

See `/docs/tech-spec-epic-9.md` and `/docs/REFACTOR-SPEC-SIMPLIFY-WORKFLOW-EXECUTION.md` for detailed rationale.

---

#### GET /api/files
**Purpose:** List directory structure of output folder

**Query Params:**
- `path` (optional): Subdirectory path

**Response:**
```typescript
{
  files: [
    {
      name: "procurement",
      path: "/procurement",
      type: "directory",
      children: [...]
    },
    {
      name: "request-form.md",
      path: "/request-form.md",
      type: "file"
    }
  ]
}
```

---

#### GET /api/files/[path]
**Purpose:** Read content of specific file

**URL Params:**
- `path`: File path relative to output directory

**Response:**
```typescript
{
  content: string,
  path: string,
  type: string  // MIME type or extension
}
```

**Security:**
- Validate path doesn't escape output directory
- Return 403 if path traversal detected

---

#### GET /api/health
**Purpose:** Health check endpoint for monitoring

**Response:**
```typescript
{
  status: "ok",
  timestamp: string,
  version: string
}
```

### 4.3 Form Actions and Mutations

**No Server Actions Needed:**
- All mutations via API routes (POST /api/chat)
- File writes handled server-side by OpenAI function calls
- No form submissions in traditional sense (chat-based interaction)

## 5. Authentication and Authorization

### 5.1 Auth Strategy

**No Authentication in MVP**

**Rationale:**
- Trusted local/network deployment (per PRD)
- Simplicity: No auth provider, no session management
- Prototype focus: Prove agent functionality, not production security

**Future Considerations (Post-MVP):**
- Add simple password protection via environment variable
- Or integrate NextAuth.js for proper authentication

### 5.2 Session Management

**In-Memory Conversation State:**

```typescript
// Server-side conversation cache (in-memory)
const conversations = new Map<string, Conversation>()

// No persistent storage
// Conversations lost on server restart
```

**Why In-Memory?**
- Simplest approach for prototype
- No Redis or session store needed
- Sufficient for testing and demo purposes

### 5.3 Protected Routes

**Not Applicable - No Authentication**

All routes publicly accessible in MVP.

### 5.4 Role-Based Access Control

**Not Applicable - Single User Prototype**

## 6. State Management

### 6.1 Server State

**No Server State Caching:**

- API routes are stateless (except in-memory conversations)
- Each request reads fresh data from file system
- No Redis or state store

**Why Stateless?**
- Simplicity: No distributed state to manage
- Fresh data: Always see latest agent files and outputs

### 6.2 Client State

**React Context API for Global State:**

```typescript
// contexts/AppContext.tsx
interface AppState {
  selectedAgent: Agent | null
  conversation: Message[]
  isLoading: boolean
  error: string | null
}

const AppContext = createContext<AppState>(...)

// Usage in components
const { selectedAgent, conversation } = useContext(AppContext)
```

**Local Component State:**
- Message input: `useState` for text value
- File viewer: `useState` for selected file
- UI toggles: `useState` for panel open/close

**Why Context API?**
- Built into React, no external library
- Sufficient for simple global state (agent, messages)
- No complex state logic that requires Zustand/Redux

### 6.3 Form State

**Simple Controlled Inputs:**

```typescript
const [message, setMessage] = useState('')

// No form library needed
<textarea
  value={message}
  onChange={(e) => setMessage(e.target.value)}
/>
```

**Why No Form Library?**
- Single input field (message textarea)
- No complex validation or multi-step forms
- React state is sufficient

### 6.4 Caching Strategy

**No Caching in MVP:**

- Fresh data on every request
- No `useSWR` or `React Query`
- No API response caching

**Why No Caching?**
- Simplicity: Avoid cache invalidation complexity
- Development speed: See changes immediately
- Prototype: Performance not critical yet

## 7. UI/UX Architecture

### 7.1 Component Structure

**Component Hierarchy:**

```
<RootLayout> (Server Component)
  └── <AppProvider> (Client Component - Context)
      └── <MainLayout> (Client Component)
          ├── <TopNav> (Client Component)
          │   ├── <AgentSelector> (Client Component)
          │   └── <FileViewerToggle> (Client Component)
          ├── <ChatPanel> (Client Component)
          │   ├── <MessageList> (Client Component)
          │   │   └── <Message> (Client Component)
          │   └── <MessageInput> (Client Component)
          └── <FileViewer> (Client Component, collapsible)
              ├── <DirectoryTree> (Client Component)
              └── <FileContent> (Client Component)
```

**Atomic Component Pattern:**
- **Atoms:** Button, Input, Icon
- **Molecules:** Message, FileTreeItem, AgentOption
- **Organisms:** ChatPanel, FileViewer, TopNav
- **Templates:** MainLayout
- **Pages:** Home (root page)

### 7.2 Styling Approach

**Tailwind CSS Utility-First:**

```typescript
// Inline utility classes (per UX spec)
<div className="flex h-screen bg-white">
  <div className="flex-1 flex flex-col max-w-[1200px]">
    <div className="h-16 border-b px-6 flex items-center justify-between">
      {/* Top nav */}
    </div>
  </div>
</div>
```

**Design System Variables:**
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',      // Primary blue
        'primary-hover': '#2563EB',
        'gray-50': '#F9FAFB',
        'gray-900': '#111827',
        // ... (from UX spec)
      },
      spacing: {
        // 4px base unit
      },
      borderRadius: {
        // UX spec values
      }
    }
  }
}
```

**Why Tailwind?**
- Matches UX specification exactly
- Rapid prototyping with utilities
- No CSS file management
- Purges unused styles for small bundle

### 7.3 Responsive Design

**Desktop-First Approach (per PRD):**

```typescript
// Tailwind responsive classes
<div className="
  w-full md:w-[70%]          // 100% on mobile, 70% on desktop
  h-screen
  flex flex-col
">
```

**Breakpoints (from UX spec):**
- Default: Mobile/Tablet (<768px) - basic functionality
- `md:` Tablet (768px+) - improved layout
- `lg:` Desktop (1024px+) - full features
- `xl:` Large Desktop (1280px+) - optimal

**Note:** Mobile not optimized in MVP, desktop is primary target.

### 7.4 Accessibility

**WCAG AA Compliance:**

- **Keyboard Navigation:** All interactive elements accessible via Tab/Enter
- **ARIA Labels:** Descriptive labels on buttons and inputs
- **Focus Indicators:** Visible 2px blue outline on focus
- **Color Contrast:** 4.5:1 minimum (per UX spec palette)
- **Screen Reader Support:** Semantic HTML, proper heading hierarchy

```typescript
// Example: Accessible button
<button
  aria-label="Send message"
  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  Send
</button>
```

## 8. Performance Optimization

### 8.1 SSR Caching

**Not Applicable - SPA with Client Rendering:**

Main page is minimal, most rendering happens client-side.

### 8.2 Static Generation

**Not Applicable - Dynamic Application:**

No static pages to pre-generate. All content is dynamic (chat messages, files).

### 8.3 Image Optimization

**Minimal Images in MVP:**

- Icons: SVG or emoji (no optimization needed)
- No user uploads in MVP
- Future: Use Next.js `<Image>` component if images added

### 8.4 Code Splitting

**Automatic via Next.js:**

- Dynamic imports for large components (if needed)
- React lazy loading for file viewer (loads only when opened)

```typescript
// Example: Lazy load file viewer
const FileViewer = dynamic(() => import('@/components/FileViewer'), {
  loading: () => <div>Loading...</div>
})
```

**Why Minimal Optimization?**
- Prototype doesn't need aggressive optimization
- Next.js handles basics automatically
- Premature optimization avoided

## 9. SEO and Meta Tags

### 9.1 Meta Tag Strategy

**Basic Meta Tags Only:**

```typescript
// app/layout.tsx
export const metadata = {
  title: 'Agent Orchestrator',
  description: 'Deploy and interact with BMAD agents via OpenAI',
}
```

**Why Minimal SEO?**
- Local deployment, not public website
- No search engine indexing needed
- Internal tool, not marketing site

### 9.2 Sitemap

**Not Needed:**

Single-page application, local deployment.

### 9.3 Structured Data

**Not Needed:**

No SEO requirements for prototype.

## 10. Deployment Architecture

### 10.1 Hosting Platform

**Self-Hosted Docker Container:**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Why Docker?**
- Consistent environment across machines
- Easy deployment: `docker-compose up`
- Volume mounts for agents and outputs
- No cloud platform dependencies

### 10.2 CDN Strategy

**Not Applicable - Local Deployment:**

Static assets served directly by Next.js. No CDN needed for local/network use.

### 10.3 Edge Functions

**Not Applicable - Traditional Server:**

Next.js API routes run on Node.js server, not edge runtime.

### 10.4 Environment Configuration

**Environment Variables:**

```bash
# .env.local (development)
OPENAI_API_KEY=sk-...
AGENTS_PATH=/app/agents
OUTPUT_PATH=/app/output
NODE_ENV=production
PORT=3000
```

**Docker Compose Configuration:**

```yaml
version: '3.8'
services:
  agent-orchestrator:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./agents:/app/agents:ro      # Read-only agents
      - ./output:/app/output:rw      # Read-write outputs
```

## 11. Component and Integration Overview

### 11.1 Major Modules

**Module Structure:**

```
/lib/
  ├── openai/              # OpenAI integration
  │   ├── client.ts        # OpenAI SDK wrapper
  │   ├── function-tools.ts # File operation function definitions
  │   └── chat.ts          # Chat completion logic
  │
  ├── agents/              # Agent management
  │   ├── loader.ts        # Discover and load agents
  │   ├── parser.ts        # Parse agent.md files
  │   └── types.ts         # Agent type definitions
  │
  ├── files/               # File operations
  │   ├── reader.ts        # Read files with security checks
  │   ├── writer.ts        # Write files to output directory
  │   ├── lister.ts        # List directory contents
  │   └── security.ts      # Path validation and sanitization
  │
  └── utils/               # Shared utilities
      ├── errors.ts        # Error handling
      ├── logger.ts        # Logging utilities
      └── validators.ts    # Input validation
```

### 11.2 Page Structure

**Single Page Application:**

```
/app/
  ├── layout.tsx           # Root layout (server component)
  ├── page.tsx             # Main page (client component entry)
  ├── globals.css          # Tailwind directives
  └── api/                 # API routes (defined in Section 4)
```

### 11.3 Shared Components

**Component Library:**

```
/components/
  ├── chat/
  │   ├── ChatPanel.tsx
  │   ├── MessageList.tsx
  │   ├── Message.tsx
  │   └── MessageInput.tsx
  │
  ├── file-viewer/
  │   ├── FileViewer.tsx
  │   ├── DirectoryTree.tsx
  │   ├── FileContent.tsx
  │   └── TreeNode.tsx
  │
  ├── navigation/
  │   ├── TopNav.tsx
  │   ├── AgentSelector.tsx
  │   └── FileViewerToggle.tsx
  │
  ├── ui/                  # Reusable UI atoms
  │   ├── Button.tsx
  │   ├── Dropdown.tsx
  │   ├── LoadingSpinner.tsx
  │   └── ErrorMessage.tsx
  │
  └── providers/
      └── AppProvider.tsx  # Context provider
```

### 11.4 Third-Party Integrations

**External Services:**

1. **OpenAI API**
   - Purpose: LLM inference with function calling
   - Integration: Official `openai` npm package
   - Configuration: API key via environment variable

**That's It - No Other External Services:**
- No authentication service
- No database service
- No cloud storage
- No monitoring platform
- No email service
- No payment processing

**Rationale:** Radical simplicity - only integrate what's absolutely necessary.

## 12. Architecture Decision Records

### ADR-001: Why Next.js?

**Decision:** Use Next.js 14 with App Router

**Rationale:**
- **Full-stack in one framework:** Frontend + API routes in single codebase
- **Built-in features:** Routing, API layer, TypeScript support, no config needed
- **Modern patterns:** Server/client components, optimized by default
- **Deployment simplicity:** Single build, single container
- **Ecosystem:** Excellent TypeScript support, large community

**Alternatives Considered:**
- Separate React SPA + Express backend (more complexity, two servers)
- Remix (similar to Next.js, but less familiar to team)
- Vanilla React + API framework (more setup, no SSR)

**Trade-offs:**
- Next.js has learning curve (App Router is new)
- Slightly heavier than minimal Express setup
- Vendor lock-in to Vercel patterns (but works self-hosted)

**Outcome:** Next.js wins for rapid prototyping with minimal setup.

---

### ADR-002: Why No Database?

**Decision:** Use file-based storage, no PostgreSQL/MongoDB

**Rationale:**
- **Simplicity:** No schema, no migrations, no connection pooling
- **BMAD alignment:** Agents are file-based, outputs are files
- **Deployment:** One less container to manage
- **Prototype scope:** No need to persist conversations long-term
- **Development speed:** Read/write files directly, no ORM

**Alternatives Considered:**
- SQLite (lightweight, but still SQL overhead)
- PostgreSQL (production-grade, but overkill for prototype)
- MongoDB (document store, but adds complexity)

**Trade-offs:**
- Can't query data easily (no SQL)
- Concurrent writes may need locking (low risk for prototype)
- Scaling limitations (acceptable for MVP)

**Outcome:** File system is sufficient and aligns with BMAD philosophy.

---

### ADR-003: Why TypeScript?

**Decision:** Use TypeScript for all application code

**Rationale:**
- **Type safety:** Catch errors at compile time, not runtime
- **IDE support:** Excellent autocomplete, refactoring, navigation
- **Modern default:** Next.js + TypeScript is the recommended setup
- **Shared types:** Frontend and backend share type definitions
- **Documentation:** Types serve as inline documentation

**Alternatives Considered:**
- JavaScript (faster to write, but more bugs)
- JSDoc (type hints in JS, but incomplete)

**Trade-offs:**
- Slightly more verbose
- Learning curve for beginners (but Bryan selected beginner level for explanations)

**Outcome:** TypeScript provides better developer experience and reliability.

---

### ADR-004: Why Docker Deployment?

**Decision:** Deploy as Docker container with volume mounts

**Rationale:**
- **Consistency:** Same environment everywhere (dev, staging, prod)
- **Isolation:** No dependency conflicts with host system
- **Volume mounts:** Easy to swap agent files and access outputs
- **Portability:** Runs on any machine with Docker
- **Simple setup:** `docker-compose up` is all you need

**Alternatives Considered:**
- Direct Node.js deployment (works, but env inconsistency)
- Vercel deployment (great for cloud, not for local/on-prem)
- Kubernetes (massive overkill for single container)

**Trade-offs:**
- Requires Docker installed on host
- Slightly more disk space than bare Node.js

**Outcome:** Docker provides best balance of simplicity and portability.

---

### ADR-005: Why No Authentication?

**Decision:** No authentication in MVP

**Rationale:**
- **PRD requirement:** "No authentication required for MVP (assumes trusted local/network deployment)"
- **Simplicity:** Avoid auth provider setup (Auth0, Clerk, NextAuth)
- **Prototype focus:** Prove agent functionality, not security
- **Local deployment:** Running on developer machine or internal network

**Alternatives Considered:**
- Simple password (environment variable) - easy to add later
- NextAuth.js (full auth, but adds complexity)
- No consideration for OAuth (overkill)

**Trade-offs:**
- Not suitable for public internet deployment
- Anyone with network access can use the app

**Outcome:** No auth is appropriate for MVP scope. Can add later if needed.

---

### ADR-006: Why Context API (Not Zustand/Redux)?

**Decision:** Use React Context API for global state

**Rationale:**
- **Built-in:** No external library needed
- **Simple state:** Agent selection, messages, loading flags
- **No complex logic:** No need for middleware, thunks, or actions
- **Prototype appropriate:** Avoid over-engineering

**Alternatives Considered:**
- Zustand (lightweight, but external dep)
- Redux Toolkit (powerful, but heavy for simple state)
- Jotai/Recoil (atomic state, but added complexity)

**Trade-offs:**
- Context re-renders all consumers (acceptable with small component tree)
- No built-in devtools (can use React DevTools)

**Outcome:** Context API is sufficient for this application's state needs.

## 13. Implementation Guidance

### 13.1 Development Workflow

**Setup Steps:**

```bash
# 1. Initialize Next.js project
npx create-next-app@latest agent-orchestrator --typescript --tailwind --app

# 2. Install dependencies
cd agent-orchestrator
npm install openai@4.28.0 react-markdown@9.0.1 remark-gfm@4.0.0 @headlessui/react@1.7.18

# 3. Create environment variables
cat > .env.local << EOF
OPENAI_API_KEY=sk-your-key-here
AGENTS_PATH=/agents
OUTPUT_PATH=/output
EOF

# 4. Create folder structure
mkdir -p agents output lib/{openai,agents,files,utils} components/{chat,file-viewer,navigation,ui,providers}

# 5. Run development server
npm run dev
```

**Development Flow:**

1. **Start with business logic:** Build `/lib` modules first (agents, files, openai)
2. **Then API routes:** Implement `/app/api` endpoints
3. **Then UI components:** Build React components
4. **Then integration:** Connect UI to API
5. **Then Docker:** Create Dockerfile and docker-compose.yml

**Testing as You Go:**
- Test file operations with sample agents
- Test OpenAI integration with console logs
- Test UI components in isolation
- Test full flow: select agent → send message → see response

### 13.2 File Organization

**Folder Structure Explained:**

```
agent-orchestrator/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (metadata, providers)
│   ├── page.tsx            # Main page (chat interface)
│   ├── globals.css         # Tailwind directives
│   └── api/                # API routes
│       ├── agents/route.ts
│       ├── chat/route.ts
│       ├── files/route.ts
│       └── health/route.ts
│
├── components/             # React components
│   ├── chat/               # Chat-related components
│   ├── file-viewer/        # File viewer components
│   ├── navigation/         # Navigation components
│   ├── ui/                 # Reusable UI components
│   └── providers/          # Context providers
│
├── lib/                    # Business logic (framework-agnostic)
│   ├── openai/             # OpenAI integration
│   ├── agents/             # Agent management
│   ├── files/              # File operations
│   └── utils/              # Shared utilities
│
├── types/                  # TypeScript type definitions
│   ├── agent.ts
│   ├── message.ts
│   └── file.ts
│
├── public/                 # Static assets (if any)
│
├── agents/                 # Agent files (mounted volume in Docker)
│   └── [agent-folders]/
│
├── output/                 # Generated outputs (mounted volume)
│   └── [output-files]/
│
├── .env.local              # Environment variables (gitignored)
├── .dockerignore           # Docker ignore file
├── Dockerfile              # Container definition
├── docker-compose.yml      # Docker compose config
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind config
└── next.config.js          # Next.js config
```

### 13.3 Naming Conventions

**Files and Folders:**
- **Components:** PascalCase (e.g., `ChatPanel.tsx`, `MessageInput.tsx`)
- **Utilities/Functions:** camelCase (e.g., `parseAgent.ts`, `validatePath.ts`)
- **Types:** PascalCase (e.g., `Agent`, `Message`, `FileNode`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_MESSAGE_LENGTH`)
- **Folders:** kebab-case (e.g., `file-viewer/`, `api/`)

**Code Conventions:**

```typescript
// React components: Named exports for main component
export function ChatPanel() { ... }

// Utilities: Named exports for functions
export function parseAgent(content: string): Agent { ... }

// Types: Export interfaces and types
export interface Agent { ... }
export type MessageRole = 'user' | 'assistant' | 'system'

// Constants: Export const
export const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB
```

### 13.4 Best Practices

**1. Error Handling:**

```typescript
// Always wrap async operations in try-catch
try {
  const response = await openai.chat.completions.create(...)
  return response
} catch (error) {
  if (error instanceof OpenAIError) {
    // Handle OpenAI-specific errors
    throw new Error(`OpenAI API error: ${error.message}`)
  }
  throw error
}
```

**2. Path Security:**

```typescript
// Always validate file paths to prevent traversal attacks
import path from 'path'

function validatePath(userPath: string, baseDir: string): string {
  const resolved = path.resolve(baseDir, userPath)
  if (!resolved.startsWith(baseDir)) {
    throw new Error('Invalid path: directory traversal detected')
  }
  return resolved
}
```

**3. TypeScript Strictness:**

```typescript
// Use strict types, avoid 'any'
// BAD:
function parseData(data: any) { ... }

// GOOD:
function parseData(data: unknown): ParsedData {
  if (!isValidData(data)) {
    throw new Error('Invalid data format')
  }
  return data as ParsedData
}
```

**4. Component Organization:**

```typescript
// Order: imports, types, component, exports
import { useState } from 'react'
import { Message } from '@/types/message'

interface ChatPanelProps {
  agentId: string
  onSend: (message: string) => void
}

export function ChatPanel({ agentId, onSend }: ChatPanelProps) {
  const [input, setInput] = useState('')
  // ...
}
```

**5. Environment Variables:**

```typescript
// Validate environment variables at startup
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required')
}
```

## 14. Proposed Source Tree

```
agent-orchestrator/
├── app/                                    # Next.js App Router
│   ├── layout.tsx                          # Root layout with providers
│   ├── page.tsx                            # Main page (chat interface)
│   ├── globals.css                         # Tailwind CSS directives
│   ├── favicon.ico                         # App icon
│   └── api/                                # API Routes
│       ├── agents/
│       │   └── route.ts                    # GET /api/agents
│       ├── chat/
│       │   └── route.ts                    # POST /api/chat
│       ├── files/
│       │   ├── route.ts                    # GET /api/files (list)
│       │   └── [path]/
│       │       └── route.ts                # GET /api/files/[path] (read)
│       └── health/
│           └── route.ts                    # GET /api/health
│
├── components/                             # React Components
│   ├── chat/
│   │   ├── ChatPanel.tsx                   # Main chat container
│   │   ├── MessageList.tsx                 # Scrollable message history
│   │   ├── Message.tsx                     # Individual message bubble
│   │   └── MessageInput.tsx                # Text input + send button
│   ├── file-viewer/
│   │   ├── FileViewer.tsx                  # File viewer container (collapsible)
│   │   ├── DirectoryTree.tsx               # Directory tree navigator
│   │   ├── FileContent.tsx                 # File content display with markdown
│   │   └── TreeNode.tsx                    # Recursive tree node component
│   ├── navigation/
│   │   ├── TopNav.tsx                      # Top navigation bar
│   │   ├── AgentSelector.tsx               # Agent dropdown selector
│   │   └── FileViewerToggle.tsx            # File viewer show/hide button
│   ├── ui/
│   │   ├── Button.tsx                      # Reusable button component
│   │   ├── Dropdown.tsx                    # Dropdown component (Headless UI)
│   │   ├── LoadingSpinner.tsx              # Loading indicator
│   │   ├── ErrorMessage.tsx                # Error display component
│   │   └── Modal.tsx                       # Modal dialog (for confirmations)
│   └── providers/
│       └── AppProvider.tsx                 # React Context provider
│
├── lib/                                    # Business Logic (Framework-Agnostic)
│   ├── openai/
│   │   ├── client.ts                       # OpenAI SDK client setup
│   │   ├── function-tools.ts               # Function calling tool definitions
│   │   ├── chat.ts                         # Chat completion logic
│   │   └── types.ts                        # OpenAI-specific types
│   ├── agents/
│   │   ├── loader.ts                       # Discover agents from file system
│   │   ├── parser.ts                       # Parse agent.md files
│   │   ├── validator.ts                    # Validate agent structure
│   │   └── types.ts                        # Agent type definitions
│   ├── files/
│   │   ├── reader.ts                       # Read files with security checks
│   │   ├── writer.ts                       # Write files to output directory
│   │   ├── lister.ts                       # List directory contents
│   │   └── security.ts                     # Path validation and sanitization
│   └── utils/
│       ├── errors.ts                       # Custom error classes
│       ├── logger.ts                       # Logging utilities
│       └── validators.ts                   # Input validation helpers
│
├── types/                                  # TypeScript Type Definitions
│   ├── agent.ts                            # Agent-related types
│   ├── message.ts                          # Message and conversation types
│   ├── file.ts                             # File system types
│   └── api.ts                              # API request/response types
│
├── public/                                 # Static Assets (if needed)
│   └── (empty in MVP)
│
├── agents/                                 # Agent Files (Docker Volume Mount)
│   └── (mounted from host, read-only)
│
├── output/                                 # Output Files (Docker Volume Mount)
│   └── (mounted from host, read-write)
│
├── .env.local                              # Environment variables (local dev)
├── .env.example                            # Example env file
├── .dockerignore                           # Docker ignore file
├── .gitignore                              # Git ignore file
├── Dockerfile                              # Docker container definition
├── docker-compose.yml                      # Docker compose configuration
├── package.json                            # NPM dependencies and scripts
├── package-lock.json                       # NPM lock file
├── tsconfig.json                           # TypeScript configuration
├── tailwind.config.ts                      # Tailwind CSS configuration
├── next.config.js                          # Next.js configuration
├── postcss.config.js                       # PostCSS config (for Tailwind)
└── README.md                               # Project documentation
```

**Critical Folders:**

- **`/lib`**: Core business logic - agent loading, file operations, OpenAI integration. Framework-agnostic so it can be tested independently and potentially reused.

- **`/components`**: React UI components organized by feature area. Each component is self-contained with clear responsibilities matching the UX specification.

- **`/app/api`**: Next.js API routes that provide the backend API. These routes call `/lib` functions and handle HTTP concerns (request parsing, response formatting, error handling).

## 15. Testing Strategy

**Philosophy:** Minimal, high-value testing focused on critical failure scenarios.

### 15.1 Core Testing Principles

**DO NOT TEST:**
- ❌ Simple CRUD operations (reads/writes with no logic)
- ❌ Code that just calls other tested code (pass-through functions)
- ❌ React component rendering (checking if elements exist)
- ❌ CSS classes or styling implementation details
- ❌ Type exports or re-exports (`expect(x).toBe(x)`)
- ❌ Anything requiring more than 10 lines of setup

**DO TEST:**
- ✅ Edge cases (boundary conditions, null/undefined, empty inputs)
- ✅ Error handling (what happens when things fail)
- ✅ Business logic (calculations, transformations, decisions)
- ✅ Security vulnerabilities (path traversal, injection attacks)
- ✅ Critical failure scenarios (data corruption, auth bypass)

**Guiding Rule:** Write 2-3 tests for the most critical failure scenarios, not comprehensive coverage.

### 15.2 TypeScript Over Runtime Tests

**Prefer type safety over runtime validation tests:**

```typescript
// ✅ GOOD: Let TypeScript catch this at compile time
interface AgentConfig {
  id: string
  name: string
  apiKey: string  // Required, not optional
}

// ❌ BAD: Testing what TypeScript already guarantees
it('should require apiKey', () => {
  expect(() => createAgent({ id: '1', name: 'test' })).toThrow()
})
```

**Exception:** Test runtime inputs that TypeScript can't validate (user input, file contents, API responses).

### 15.3 What We Actually Test

**Security-Critical Tests (lib/pathResolver.security.test.ts):**
```typescript
// KEEP: These prevent actual security vulnerabilities
describe('validateWritePath', () => {
  it('should block path traversal to /etc/passwd', () => {
    expect(() => validateWritePath('/etc/passwd', context)).toThrow('Security violation')
  })

  it('should block write to source code directories', () => {
    expect(() => validateWritePath('lib/malicious.ts', context)).toThrow('Security violation')
  })
})
```

**Business Logic Tests (where actual bugs hide):**
```typescript
// KEEP: Tests critical failure scenarios
describe('executeAgent with function calling', () => {
  it('should handle OpenAI rate limit errors gracefully', async () => {
    mockOpenAI.mockRejectedValue(new RateLimitError())
    const result = await executeAgent(agent, 'test')
    expect(result.error).toContain('Rate limit exceeded')
  })

  it('should prevent infinite tool-calling loops', async () => {
    // Agent keeps calling read_file recursively
    const result = await executeAgent(agentWithInfiniteLoop, 'test')
    expect(result.iterations).toBeLessThanOrEqual(MAX_ITERATIONS)
  })
})
```

**Error Handling Tests (resilience):**
```typescript
// KEEP: Verifies system handles failures gracefully
describe('Session creation', () => {
  it('should handle corrupt manifest.json gracefully', async () => {
    await writeFile('session-123/manifest.json', '{ invalid json')
    const sessions = await getSessions()
    expect(sessions).toBeDefined() // Doesn't crash
  })
})
```

### 15.4 What We Delete

**Remove entirely:**
1. **lib/utils/__tests__/index.test.ts** - Tests re-exports exist (332 lines)
2. **components/chat/__tests__/MessageInput.test.tsx** - Tests disabled form renders (65 lines)
3. **components/chat/__tests__/LoadingIndicator.test.tsx** - Tests CSS classes (68 lines)
4. **components/chat/__tests__/ErrorMessage.test.tsx** - Tests styling (167 lines)
5. **lib/files/__tests__/reader.test.ts** - Performance tests (<100ms file reads are brittle)

**Reduce drastically:**
6. **app/api/chat/__tests__/route.test.ts** - From 460 lines to ~50 lines (keep 2-3 critical tests)

### 15.5 Testing Budget

**Target:** 2-3 tests per critical module, ~30-50 tests total (down from 100+)

**Allocation:**
- Security tests: ~15 tests (path validation, auth bypass prevention)
- Business logic: ~15 tests (agentic loop, critical workflows)
- Error handling: ~10 tests (graceful degradation, corrupt data)
- Integration: ~5 tests (end-to-end critical paths)

**Coverage:** We don't track coverage percentages. Instead ask: "What's the worst thing that could go wrong?" and test that.

### 15.6 Manual Testing Checklist

**Before every release, manually verify:**

- [ ] Agent selection works
- [ ] Send message → receive response
- [ ] File viewer shows outputs
- [ ] File operations (read/write) work
- [ ] Error messages are helpful (not stack traces)
- [ ] Works in Chrome, Firefox, Safari

**Time estimate:** 10 minutes of manual testing replaces hours of test maintenance.

### 15.7 When to Write a Test

**Decision tree:**

1. Is it a security vulnerability? → ✅ Write test
2. Is it a critical business logic bug that could lose data? → ✅ Write test
3. Is it an edge case that caused a production incident? → ✅ Write test
4. Does it test styling, rendering, or simple CRUD? → ❌ No test
5. Would the test require >10 lines of setup/mocking? → ❌ No test
6. Can TypeScript catch this at compile time? → ❌ No test

**When in doubt, skip the test.** It's easier to add tests later when bugs appear than to maintain tests that provide no value.

### 15.8 Examples of Good vs Bad Tests

**❌ BAD: Testing implementation details**
```typescript
it('renders textarea with placeholder text', () => {
  render(<MessageInput />)
  const textarea = screen.getByPlaceholderText('Type your message...')
  expect(textarea).toBeInTheDocument()
  expect(textarea.tagName).toBe('TEXTAREA')
})
```
*Why bad:* Tests that a textarea exists. If it exists, React would crash. No value.

**✅ GOOD: Testing critical failure scenario**
```typescript
it('should prevent XSS injection in markdown rendering', () => {
  const maliciousMarkdown = '<script>alert("XSS")</script>'
  const { container } = render(<MessageBubble content={maliciousMarkdown} />)
  expect(container.querySelector('script')).toBeNull() // Script tags stripped
})
```
*Why good:* Prevents actual security vulnerability.

**❌ BAD: Testing API validation with 10 similar tests**
```typescript
it('should return 400 when agentId is missing', async () => { ... })
it('should return 400 when message is missing', async () => { ... })
it('should return 400 when agentId is not a string', async () => { ... })
it('should return 400 when message is not a string', async () => { ... })
it('should return 400 when agentId is empty', async () => { ... })
// ... 5 more similar tests
```
*Why bad:* Testing the same validation logic 10 times. One test is enough.

**✅ GOOD: Testing critical failure scenario**
```typescript
it('should return 500 and log error on OpenAI API failure', async () => {
  mockOpenAI.mockRejectedValue(new Error('API down'))
  const response = await POST(request)
  expect(response.status).toBe(500)
  expect(response.body.error).toBe('An unexpected error occurred')
  expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('API down'))
})
```
*Why good:* Verifies error handling and logging work correctly.

### 15.9 Framework & Tools

**Keep:**
- Jest for unit tests
- React Testing Library (only for critical component logic)
- Manual testing for UI/UX

**Remove:**
- Playwright/E2E tests (too slow, manual testing is faster for prototypes)
- Snapshot tests (brittle, fail on irrelevant changes)
- Coverage tools (we don't track coverage %)

## 16. DevOps and CI/CD

### 16.1 Local Development

**Setup:**

```bash
# Clone repo
git clone <repo-url>
cd agent-orchestrator

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with OpenAI API key

# Run development server
npm run dev
```

**Development Commands:**

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:e2e": "playwright test"
  }
}
```

### 16.2 Docker Deployment

**Dockerfile:**

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
RUN npm ci --production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  agent-orchestrator:
    build: .
    container_name: agent-orchestrator
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - AGENTS_PATH=/app/agents
      - OUTPUT_PATH=/app/output
    volumes:
      - ./agents:/app/agents:ro           # Read-only agents
      - ./output:/app/output:rw           # Read-write outputs
    restart: unless-stopped

  # Optional: Add nginx reverse proxy later if needed
```

**Deployment Commands:**

```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### 16.3 CI/CD Pipeline (Optional for MVP)

**GitHub Actions Example (if desired later):**

```yaml
# .github/workflows/build.yml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run build
      - run: npm test
```

**Note:** CI/CD is optional for MVP. Simple `docker-compose up` is sufficient for prototype deployment.

### 16.4 Monitoring and Logging

**Console Logging:**

```typescript
// lib/utils/logger.ts
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args)
  },
  error: (message: string, error: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error)
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args)
    }
  }
}
```

**What to Log:**
- Agent loading and parsing
- File operations (read/write)
- OpenAI API calls (request/response)
- Errors with full stack traces

**No External Monitoring:**
- No Sentry, Datadog, or LogRocket in MVP
- Docker logs are sufficient: `docker-compose logs -f`
- For production, add monitoring platform later

## 17. Security

### 17.1 File System Security

**Path Traversal Prevention:**

```typescript
// lib/files/security.ts
import path from 'path'

export function validatePath(userPath: string, baseDir: string): string {
  // Resolve to absolute path
  const resolved = path.resolve(baseDir, userPath)

  // Check if resolved path is within base directory
  if (!resolved.startsWith(path.resolve(baseDir))) {
    throw new Error('Access denied: Path traversal detected')
  }

  return resolved
}

// Usage:
const safePath = validatePath(req.query.path, OUTPUT_PATH)
const content = await fs.readFile(safePath, 'utf-8')
```

**Read/Write Boundaries:**
- **Agents folder:** Read-only (prevent agent modification)
- **Output folder:** Read-write (allow agent to create files)
- **No access:** Any path outside these two directories

### 17.2 API Security

**Input Validation:**

```typescript
// Validate all user inputs
const messageSchema = z.object({
  agentId: z.string().min(1).max(100),
  message: z.string().min(1).max(10000),
  conversationId: z.string().uuid().optional()
})

export async function POST(req: Request) {
  const body = await req.json()
  const validated = messageSchema.parse(body)  // Throws on invalid
  // ... proceed with validated data
}
```

**Rate Limiting (Future):**
- Not implemented in MVP (local deployment)
- Add if exposing to internet: `express-rate-limit` or middleware

### 17.3 Environment Variables

**Secrets Management:**

```bash
# .env.local (gitignored)
OPENAI_API_KEY=sk-...

# Never commit secrets to Git
# Use .env.example with placeholder values
```

**Runtime Validation:**

```typescript
// Validate on startup
const requiredEnvVars = ['OPENAI_API_KEY', 'AGENTS_PATH', 'OUTPUT_PATH']

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}
```

### 17.4 OpenAI API Security

**API Key Protection:**
- Never expose API key to frontend
- All OpenAI calls happen server-side (API routes)
- API key stored in environment variable, not in code

**Function Calling Restrictions:**

```typescript
// Only allow specific file operations
const allowedFunctions = ['read_file', 'write_file', 'list_files']

function executeFunctionCall(call: FunctionCall) {
  if (!allowedFunctions.includes(call.name)) {
    throw new Error(`Function not allowed: ${call.name}`)
  }
  // ... execute
}
```

### 17.5 Future Security Enhancements

**Post-MVP Considerations:**
- Add authentication (password protection or NextAuth.js)
- Implement HTTPS with SSL certificates
- Add CORS restrictions if exposing API
- Implement rate limiting for API routes
- Add request size limits (prevent DoS)
- Sanitize markdown output (prevent XSS in rendered content)

**For MVP:**
- Basic file path validation is sufficient
- Trusted local deployment, no public exposure
- Focus on functionality over hardening

---

## Specialist Sections

### DevOps Specialist Section

**Assessment:** Simple deployment (Docker + docker-compose)

**Inline Coverage:**

The DevOps approach for this project is intentionally minimal:

1. **Single Container Deployment:** One Docker container runs the Next.js app. No orchestration (Kubernetes) needed.

2. **Volume Mounts:** Two volumes provide data persistence:
   - `/agents` (read-only): Agent instruction files
   - `/output` (read-write): Agent-generated outputs

3. **Environment Configuration:** All config via environment variables in `.env` or docker-compose.

4. **No CI/CD in MVP:** Manual build and deploy with `docker-compose up`. Can add GitHub Actions later if needed.

5. **Logging:** Console logs accessible via `docker-compose logs -f`. No centralized logging platform.

6. **Health Check:** Simple `/api/health` endpoint for uptime monitoring.

**Rationale:** For a prototype running locally or on internal network, elaborate DevOps infrastructure is unnecessary. Keep it simple.

---

### Security Specialist Section

**Assessment:** Basic security for trusted deployment

**Inline Coverage:**

Security measures appropriate for MVP:

1. **File System Security:**
   - Path validation prevents directory traversal
   - Read-only agent folder, write-restricted output folder
   - No access outside designated directories

2. **API Security:**
   - Input validation with Zod schemas
   - No authentication (trusted deployment per PRD)
   - OpenAI API key server-side only

3. **No Public Exposure:**
   - Designed for local/network deployment
   - Not internet-facing in MVP
   - No HTTPS required for local use

4. **Future Hardening:**
   - Add password protection via env variable
   - Implement HTTPS for remote access
   - Add rate limiting if public deployment

**Rationale:** Security appropriate to deployment context. Local prototype doesn't need enterprise-grade hardening, but basic protections (path validation) are in place.

---

### Testing Specialist Section

**Assessment:** Manual testing sufficient for MVP

**Inline Coverage:**

Testing approach for prototype:

1. **Manual Testing Priority:**
   - Test agent selection, chat flow, file viewing manually
   - Validate OpenAI compatibility with real agents
   - Browser testing in Chrome/Firefox

2. **Optional Automated Tests:**
   - Unit tests for critical file operations (path validation)
   - API route tests for chat endpoint
   - E2E test for happy path (if time permits)

3. **No Comprehensive Test Suite:**
   - Prototype code will change rapidly
   - Over-testing slows iteration
   - Focus on proving concept, not test coverage

4. **Quality Gates:**
   - Does agent selection work?
   - Do messages send and receive responses?
   - Can files be viewed?
   - Are outputs created correctly?

**Rationale:** For a prototype, manual testing is faster and more appropriate than building a full test suite. Add automated tests when stabilizing for production use.

---

## Implementation Roadmap

### Phase 1: Foundation (Day 1-2)
1. Set up Next.js project with TypeScript and Tailwind
2. Implement file operations (`/lib/files`)
3. Implement agent loader (`/lib/agents`)
4. Build `/api/agents` route

### Phase 2: OpenAI Integration (Day 2-3)
1. Set up OpenAI client (`/lib/openai`)
2. Define function calling tools (read_file, write_file, list_files)
3. Build `/api/chat` route with function calling
4. Test with sample agent

### Phase 3: Frontend (Day 3-4)
1. Build chat components (ChatPanel, MessageList, Message, MessageInput)
2. Build navigation (TopNav, AgentSelector)
3. Implement context provider (AppProvider)
4. Connect UI to API routes

### Phase 4: File Viewer (Day 4-5)
1. Build DirectoryTree component
2. Build FileContent component with markdown rendering
3. Implement `/api/files` routes
4. Add panel toggle and animations

### Phase 5: Docker & Polish (Day 5-6)
1. Create Dockerfile and docker-compose.yml
2. Test Docker deployment
3. Error handling polish
4. UX refinements (loading states, error messages)
5. README documentation

**Total Time Estimate:** 4-6 days for complete MVP

---

_Generated using BMAD Method Solution Architecture workflow_
_Architecture prioritizes radical simplicity for clean prototype demonstration_
