# Agent Orchestrator - Epic Breakdown

**Author:** Bryan
**Date:** 2025-10-02
**Project Level:** Level 3 (Full Product)
**Target Scale:** 35-45 stories across 6 epics

---

## Epic Overview

This epic breakdown supports the Agent Orchestrator PRD, organizing development into 6 major epics that deliver the MVP platform. The primary goal is validating OpenAI API compatibility with BMAD agents while enabling rapid deployment to end users.

**Epic Sequencing (Solo Developer - Strict Sequential Order):**
1. **Epic 1** (Backend Foundation) - MUST complete ALL stories before proceeding
2. **Epic 2** (OpenAI Integration) - MUST complete ALL stories before proceeding (validates core hypothesis)
3. **Epic 3** (Chat Interface) - Can only build functional UI after Epic 2 is 100% complete
4. **Epic 4** (File Operations & Viewer) - Requires Epic 2 file operations + Epic 3 UI layout
5. **Epic 5** (Docker Deployment) - Requires fully working application (Epics 1-4 complete)
6. **Epic 6** (Polish & Docs) - Final polish after all features complete

**Critical Dependency Chain (Solo Developer):** Epic 1 → Epic 2 → Epic 3 → Epic 4 → Epic 5 → Epic 6

**⚠️ Solo Developer Warning:** Unlike team environments where epics can overlap, as a solo developer you MUST complete each epic fully before moving to the next. Half-built epics create technical debt and context switching overhead.

**Total Estimated Effort:** 43 stories (Level 3 scope: 12-40 stories, slightly over due to infrastructure needs)

---

## Epic Details

### Epic 1: Backend Foundation & Infrastructure

**Epic Goal:** Establish Next.js backend infrastructure to support OpenAI integration and frontend communication

**Business Value:** Provides the foundational server architecture that all other epics depend on - without this, we cannot build chat interface or integrate with OpenAI

**Success Criteria:**
- Next.js project initialized with API routes
- Backend can receive and respond to HTTP requests
- Environment configuration working
- Basic error handling in place
- Project structure supports future epics

**Dependencies:** None (FOUNDATIONAL - must complete first)

**Estimated Stories:** 5-6

---

#### Story 1.1: Initialize Next.js Project with TypeScript

**As a** developer
**I want** a Next.js project with TypeScript configured
**So that** I have a foundation for building the backend and frontend

**Prerequisites:** None

**Acceptance Criteria:**
1. Next.js 14+ project initialized with App Router
2. TypeScript configured and working
3. Project runs locally with `npm run dev`
4. Default Next.js page displays at localhost:3000
5. ESLint configured for code quality
6. .gitignore properly configured
7. package.json has correct dependencies

**Technical Notes:**
- Use `npx create-next-app@latest` with TypeScript option
- Choose App Router (not Pages Router)
- Add Tailwind CSS during setup for UI styling later
- Initialize git repository

---

#### Story 1.2: Create API Route Structure

**As a** developer
**I want** organized API route structure
**So that** I can build endpoints for chat, agents, and files

**Prerequisites:** Story 1.1 (Next.js initialized)

**Acceptance Criteria:**
1. `/api/chat` route created and responds to POST
2. `/api/agents` route created and responds to GET
3. `/api/files` route created and responds to GET
4. Each route returns proper JSON responses
5. Routes use TypeScript types for request/response
6. Basic request validation in place
7. 404 handling for unknown routes

**Technical Notes:**
- Use Next.js App Router API routes: `app/api/[route]/route.ts`
- Create types file for API request/response shapes
- Return { success: boolean, data?: any, error?: string }
- Use NextRequest and NextResponse types

---

#### Story 1.3: Environment Configuration

**As a** developer
**I want** environment variable configuration
**So that** I can manage secrets and configuration separately from code

**Prerequisites:** Story 1.1 (Next.js initialized)

**Acceptance Criteria:**
1. .env.local file created for local development
2. .env.example file created as template
3. OPENAI_API_KEY variable defined
4. AGENTS_FOLDER_PATH variable with default value
5. OUTPUT_FOLDER_PATH variable with default value
6. Environment variables accessible in API routes
7. Validation on startup for required variables

**Technical Notes:**
- Use Next.js built-in environment variable support
- Prefix server-only vars appropriately
- Create utility function to validate env vars on startup
- Document all variables in .env.example

---

#### Story 1.4: Error Handling Middleware

**As a** developer
**I want** consistent error handling across all API routes
**So that** errors are logged and returned in standard format

**Prerequisites:** Story 1.2 (API routes)

**Acceptance Criteria:**
1. Error handler utility function created
2. All API routes use error handler
3. Errors logged to console with stack traces
4. Errors returned as JSON with standard format
5. Different error types handled (validation, not found, server error)
6. HTTP status codes set correctly (400, 404, 500)
7. Error messages are user-friendly (no stack traces in response)

**Technical Notes:**
- Create `lib/errorHandler.ts` utility
- Wrap async handlers with try/catch
- Return { success: false, error: message, code: status }
- Log full error details server-side only

---

#### Story 1.5: Basic Health Check Endpoint

**As a** developer
**I want** a health check endpoint
**So that** I can verify the server is running

**Prerequisites:** Story 1.2 (API routes)

**Acceptance Criteria:**
1. `/api/health` endpoint created
2. Returns 200 OK when server is healthy
3. Response includes { status: "ok", timestamp: ISO8601 }
4. Endpoint responds quickly (< 100ms)
5. Can be called without authentication
6. Used for Docker health checks later

**Technical Notes:**
- Simple GET endpoint
- Return current timestamp and status
- Optional: check critical dependencies (file system access)

---

#### Story 1.6: Project Structure and Organization

**As a** developer
**I want** clear project structure
**So that** code is organized and maintainable

**Prerequisites:** Stories 1.1, 1.2 completed

**Acceptance Criteria:**
1. `/app` folder for Next.js pages and API routes
2. `/lib` folder for utilities and helpers
3. `/types` folder for TypeScript types
4. `/components` folder for React components (for later)
5. README.md with project overview and setup instructions
6. Clear separation between frontend and backend code
7. Folder structure documented in README

**Technical Notes:**
- Follow Next.js 14 App Router conventions
- Create index files for clean imports
- Document architectural decisions
- Keep structure simple but scalable

---

### Epic 2: OpenAI Integration with File Operations

**Epic Goal:** Validate that BMAD agents work with OpenAI API through function calling for file operations

**Business Value:** Proves the core hypothesis - this is the primary validation goal of the entire MVP

**Success Criteria:**
- At least one BMAD agent successfully executes via OpenAI API
- File operations (read, write, list) work correctly via function calling
- Lazy-loading pattern loads instruction files on-demand
- Path security prevents unauthorized file access

**Dependencies:** Epic 1 (Backend foundation must be complete - especially API routes and environment config)

**Estimated Stories:** 11 (includes Story 2.3.5 smoke test for risk mitigation)

---

#### Story 2.1: OpenAI API Integration Setup

**As a** developer
**I want** to integrate OpenAI API with function calling
**So that** agents can execute with OpenAI as the LLM provider

**Prerequisites:** Epic 1 complete (especially Story 1.2 API routes, Story 1.3 environment config)

**Acceptance Criteria:**
1. OpenAI SDK installed and configured
2. API key loaded from environment variable (OPENAI_API_KEY)
3. Chat completion endpoint successfully called from `/api/chat` route
4. Function calling capability enabled
5. Response from OpenAI returned via API route
6. API errors are caught and handled gracefully
7. Rate limiting is handled appropriately

**Technical Notes:**
- Use official OpenAI Node.js SDK: `npm install openai`
- Configure model selection (gpt-4, gpt-4-turbo) via environment or config
- Create `/lib/openai.ts` service module for OpenAI interactions
- Call from `/api/chat` route handler

---

#### Story 2.2: Define File Operation Function Schemas

**As a** developer
**I want** to define function schemas for file operations
**So that** OpenAI can call file operation tools correctly

**Prerequisites:** Story 2.1 (OpenAI Integration)

**Acceptance Criteria:**
1. read_file function schema defined with parameters (path)
2. write_file function schema defined with parameters (path, content)
3. list_files function schema defined with parameters (directory)
4. Schemas include clear descriptions for OpenAI to understand usage
5. Parameter types and constraints are properly specified
6. Schemas passed to OpenAI during chat completion
7. Function definitions match OpenAI function calling format

**Technical Notes:**
- Follow OpenAI function calling schema format
- Include detailed descriptions to guide LLM behavior
- Define required vs optional parameters
- Consider adding file_exists or other utility functions

---

#### Story 2.3: Implement read_file Function

**As an** agent
**I want** to read instruction and workflow files
**So that** I can load my instructions on-demand (lazy-loading)

**Prerequisites:** Story 2.2 (Function Schemas)

**Acceptance Criteria:**
1. read_file(path) loads file contents from file system
2. Function restricts reads to agents folder only
3. Path traversal attacks are prevented (no ../../etc/passwd)
4. File not found returns clear error message
5. Function returns file contents as string
6. Large files are handled appropriately (size limit or streaming)
7. Binary files are rejected or handled gracefully
8. Function result returns to OpenAI for processing

**Technical Notes:**
- Use fs.readFileSync or fs.promises.readFile
- Implement path validation and security checks
- Normalize paths to prevent traversal
- Set reasonable file size limit (e.g., 1MB)

---

#### Story 2.4: Implement write_file Function

**As an** agent
**I want** to write output files to the output directory
**So that** I can generate documents for end users

**Prerequisites:** Story 2.2 (Function Schemas)

**Acceptance Criteria:**
1. write_file(path, content) creates file in output directory
2. Function restricts writes to output folder only
3. Parent directories are auto-created if they don't exist
4. Existing files are overwritten (no versioning in MVP)
5. Path traversal attacks are prevented
6. Write errors return clear error message
7. Function confirms successful write to OpenAI
8. File permissions set appropriately

**Technical Notes:**
- Use fs.writeFileSync or fs.promises.writeFile
- Implement path validation similar to read_file
- Use fs.mkdirSync with recursive option for parent dirs
- Consider write size limits to prevent abuse

---

#### Story 2.5: Implement list_files Function

**As an** agent
**I want** to list files in directories
**So that** I can discover available instructions and view outputs

**Prerequisites:** Story 2.2 (Function Schemas)

**Acceptance Criteria:**
1. list_files(directory) returns array of file/folder names
2. Function works for both agents folder and output folder
3. Returns file names, not full paths (security)
4. Distinguishes between files and directories
5. Empty directories return empty array
6. Directory not found returns clear error
7. Path security enforced (no arbitrary directory listing)
8. Results formatted clearly for OpenAI to parse

**Technical Notes:**
- Use fs.readdirSync or fs.promises.readdir
- Use fs.statSync to check if file or directory
- Return JSON structure with name and type (file/dir)
- Limit recursion depth if implementing recursive listing

---

#### Story 2.6: Function Calling Loop Implementation

**As a** developer
**I want** OpenAI to execute multiple function calls in sequence
**So that** agents can perform complex multi-step operations

**Prerequisites:** Stories 2.3, 2.4, 2.5 (All functions implemented)

**Acceptance Criteria:**
1. OpenAI response parsed for function calls
2. Requested function executed on backend
3. Function result sent back to OpenAI
4. OpenAI continues processing with function result
5. Loop continues until OpenAI returns final text response
6. Multiple function calls in sequence work correctly
7. Loop has safety limit to prevent infinite calls
8. Each function call logged for debugging

**Technical Notes:**
- Implement while loop checking for function_call in response
- Execute function based on function name
- Format function result as required by OpenAI
- Add max iterations limit (e.g., 50 calls)

---

#### Story 2.7: Agent Loading and Initialization

**As an** agent builder
**I want** my agent to load its initial instructions when selected
**So that** the agent knows its role and capabilities

**Prerequisites:** Story 2.3 (read_file), Story 2.6 (Function Loop)

**Acceptance Criteria:**
1. When agent is selected, system reads agent definition file
2. Agent definition passed as system message to OpenAI
3. Agent initializes with correct personality and instructions
4. Agent can request additional instruction files via read_file
5. Lazy-loading: Not all instructions loaded upfront
6. Agent metadata (name, description) extracted correctly
7. Multiple agents can be switched without reloading app

**Technical Notes:**
- Create agent parser to extract system prompt
- Send agent definition as system message in OpenAI request
- Support BMAD agent file format
- Cache agent definitions to avoid repeated file reads

---

#### Story 2.8: Path Security and Validation

**As a** platform operator
**I want** file operations to be secure
**So that** agents cannot access unauthorized files or directories

**Prerequisites:** Stories 2.3, 2.4, 2.5 (File functions)

**Acceptance Criteria:**
1. Path traversal attempts (../) are blocked
2. Absolute paths outside allowed directories are rejected
3. Symbolic links are resolved and validated
4. Hidden files and system files cannot be accessed
5. Error messages don't leak sensitive path information
6. Security failures logged for monitoring
7. Unit tests verify security controls work

**Technical Notes:**
- Use path.normalize and path.resolve
- Check resolved path starts with allowed base path
- Reject paths containing .. after normalization
- Test with known attack patterns

---

#### Story 2.9: Error Handling for File Operations

**As an** end user
**I want** clear error messages when file operations fail
**So that** I understand what went wrong

**Prerequisites:** Stories 2.3, 2.4, 2.5 (File functions)

**Acceptance Criteria:**
1. File not found errors explain which file is missing
2. Permission errors are caught and reported
3. Path security violations show "Access denied" without details
4. Disk full or write errors are handled gracefully
5. Errors returned to OpenAI in parseable format
6. Agent can continue conversation after file error
7. Detailed errors logged to console for debugging

**Technical Notes:**
- Wrap file operations in try/catch
- Map error types to user-friendly messages
- Return structured error objects to OpenAI
- Log stack traces server-side only

---

#### Story 2.10: Test with Sample BMAD Agent

**As a** developer
**I want** to validate a complete BMAD agent workflow
**So that** I prove OpenAI compatibility with real agent

**Prerequisites:** All Epic 2 stories complete

**Acceptance Criteria:**
1. Sample BMAD agent deployed to agents folder
2. Agent loads successfully when selected
3. User can have conversation with agent
4. Agent reads instruction files via read_file
5. Agent writes output files via write_file
6. Generated files appear in output directory
7. Complete workflow executes without errors
8. Document successful test case for reference

**Technical Notes:**
- Choose simple BMAD agent for initial test
- Document any required modifications for OpenAI
- Create test script for repeatable validation
- Begin documenting OpenAI compatibility patterns

---

### Epic 3: Chat Interface and Agent Selection

**Epic Goal:** Enable end users to select and interact with BMAD agents through a familiar chat interface

**Business Value:** Delivers the fundamental user experience that makes agents accessible to non-technical users

**Success Criteria:**
- End users can select an agent and have a conversation
- Interface feels familiar to ChatGPT/Claude.ai users
- Markdown rendering works correctly for agent responses
- Users can start new conversations and reset context

**Dependencies:** Epic 1 (Backend foundation) AND Epic 2 (100% COMPLETE - all OpenAI integration + file operations + agent loading must be working)

**⚠️ Critical Note:** You can build UI shell (Stories 3.1-3.4) with only Epic 1 complete, but Stories 3.5-3.8 (functional chat) REQUIRE Epic 2 fully complete. For solo development, complete Epic 2 entirely before starting Epic 3.

**Estimated Stories:** 8

---

#### Story 3.1: Basic Chat UI Layout

**As an** end user
**I want** a clean chat interface with message history
**So that** I can have conversations with agents in a familiar format

**Prerequisites:** Epic 1 complete (Next.js project and API routes ready)

**Acceptance Criteria:**
1. Chat interface displays with text input at bottom
2. Message history area shows above input field
3. Send button appears next to input field
4. Layout resembles ChatGPT/Claude.ai (simple, clean, focused)
5. Interface is responsive and works on desktop browsers
6. No functionality required yet - just UI layout

**Technical Notes:**
- Create page in `app/page.tsx`
- Use Tailwind CSS for styling (already set up in Epic 1)
- Create reusable message component for chat bubbles

---

#### Story 3.2: Display User and Agent Messages

**As an** end user
**I want** to see my messages and agent responses displayed clearly
**So that** I can follow the conversation flow

**Prerequisites:** Story 3.1 (Basic Chat UI)

**Acceptance Criteria:**
1. User messages appear right-aligned with distinct styling
2. Agent messages appear left-aligned with different styling
3. Clear visual distinction between user and agent messages
4. Messages display in chronological order (oldest to newest)
5. Message history scrolls when conversation grows long
6. Auto-scroll to latest message when new message arrives

**Technical Notes:**
- Create message state management (useState for MVP)
- Style user vs agent messages differently (color, alignment, avatar)
- Store messages as array of {role: 'user'|'assistant', content: string}

---

#### Story 3.3: Markdown Rendering for Agent Responses

**As an** end user
**I want** agent responses to render properly with formatting
**So that** I can read structured information (headings, lists, code blocks)

**Prerequisites:** Story 3.2 (Display Messages)

**Acceptance Criteria:**
1. Markdown headings render correctly (h1-h6)
2. Lists (bulleted and numbered) display properly
3. Code blocks appear with monospace font and background
4. Links are clickable and styled appropriately
5. Bold and italic text render correctly
6. Line breaks and paragraphs are preserved
7. Tables render if agent uses markdown tables

**Technical Notes:**
- Install `react-markdown`: `npm install react-markdown`
- Configure syntax highlighting for code blocks (optional for MVP)
- Test with various markdown formats from sample agent responses
- Only render markdown for agent messages, not user messages

---

#### Story 3.4: Agent Discovery and Selection Dropdown

**As an** agent builder
**I want** the system to automatically discover agents in my agents folder
**So that** I don't have to manually configure which agents are available

**Prerequisites:** Epic 1 (API routes), Story 3.1 (Basic UI)

**Acceptance Criteria:**
1. Backend scans agents folder on startup and finds all .md agent files
2. `/api/agents` endpoint returns list of discovered agents
3. Dropdown/selector displays list of agents in UI
4. Agent names extracted from file metadata or filename
5. Dropdown appears prominently in UI (top of page or sidebar)
6. Selecting an agent loads it for conversation
7. System handles empty agents folder gracefully (shows message)
8. Recursive scanning finds agents in subdirectories

**Technical Notes:**
- Update `/api/agents/route.ts` to scan file system
- Use fs module to read directory structure recursively
- Filter for .md files and parse agent metadata (name, description)
- Return agent list as JSON: [{id, name, description, path}]
- Frontend calls API on mount and populates dropdown

---

#### Story 3.5: Basic Message Send Functionality

**As an** end user
**I want** to send messages to the agent
**So that** I can interact and get responses

**Prerequisites:** Story 3.2 (Display Messages), Story 3.4 (Agent Selection), **Epic 2 COMPLETE (all stories 2.1-2.10)** - requires full OpenAI integration with function calling, file operations, and agent loading working

**Acceptance Criteria:**
1. Clicking send button submits message to `/api/chat`
2. Pressing Enter in input field submits message
3. Input field clears after message is sent
4. User message immediately appears in chat history
5. Input is disabled while waiting for agent response
6. Empty messages are not sent
7. Long messages are accepted (multi-line support)
8. Agent response appears when received from backend

**Technical Notes:**
- POST to `/api/chat` with {agentId, messages: [{role, content}]}
- Backend calls OpenAI with conversation history
- Handle form submission properly (preventDefault)
- Add basic validation for empty messages
- Consider shift+Enter for multi-line vs Enter to send

---

#### Story 3.6: Loading Indicator During Agent Processing

**As an** end user
**I want** to see when the agent is thinking/processing
**So that** I know the system is working and haven't lost my message

**Prerequisites:** Story 3.5 (Message Send)

**Acceptance Criteria:**
1. Loading indicator appears after sending message
2. Indicator shows "Agent is thinking..." or similar message
3. Indicator appears in chat history where agent response will be
4. Indicator disappears when agent response arrives
5. Visual cue is clear but not distracting (subtle animation)
6. Works correctly even for slow API responses

**Technical Notes:**
- Add loading state: `isLoading` boolean
- Show placeholder message component with animation
- Consider typing indicator animation (three animated dots)
- Set loading=true before API call, false after response

---

#### Story 3.7: New Conversation / Reset Functionality

**As an** end user
**I want** to start a new conversation with the same agent
**So that** I can test different scenarios or recover from errors

**Prerequisites:** Story 3.5 (Message Send)

**Acceptance Criteria:**
1. "New Conversation" button visible in UI
2. Clicking button clears chat history
3. Agent context resets (doesn't remember previous messages)
4. Input field remains focused and ready for new message
5. Confirmation dialog if conversation has significant history (optional for MVP)
6. Button is clearly labeled and easy to find

**Technical Notes:**
- Clear messages array in state
- Reset to empty array: `setMessages([])`
- No backend state to clear in MVP (stateless API)
- Focus input field after reset

---

#### Story 3.8: Basic Error Handling in Chat

**As an** end user
**I want** clear error messages when something goes wrong
**So that** I understand what happened and can try again

**Prerequisites:** Story 3.5 (Message Send)

**Acceptance Criteria:**
1. API errors display as error messages in chat
2. Error messages are clearly styled (red/warning color)
3. Errors explain what went wrong in plain language
4. Network errors show "Connection failed - please try again"
5. Agent errors show agent-specific error information
6. User can still send new messages after error
7. Errors don't crash the interface

**Technical Notes:**
- Implement try/catch for fetch calls
- Create error message component (distinct from agent messages)
- Map technical errors to user-friendly messages
- Log detailed errors to console for debugging
- Show errors in chat history, not just alerts

---

### Epic 4: File Management and Viewer

**Epic Goal:** Enable users to view and verify agent-generated outputs

**Business Value:** Builds trust by letting users see what agents created and access generated documents

**Success Criteria:**
- Users can browse output directory structure
- File contents display correctly in browser
- Read-only access prevents accidental modifications
- Directory structure is intuitive to navigate

**Dependencies:** Epic 2 COMPLETE (write_file working - Story 2.4) AND Epic 3 COMPLETE (Chat UI layout established for file viewer integration)

**⚠️ Solo Developer Note:** Complete Epic 3 fully before starting Epic 4. The file viewer integrates into the existing chat UI layout, so you need that foundation stable first.

**Estimated Stories:** 7

---

#### Story 4.1: File Viewer UI Component

**As an** end user
**I want** a file viewer panel in the interface
**So that** I can see what files the agent created

**Prerequisites:** Epic 3 Story 3.1 (Chat UI layout established)

**Acceptance Criteria:**
1. File viewer panel appears in UI (sidebar or separate view)
2. Panel clearly labeled "Output Files" or similar
3. Panel toggleable or always visible (design decision)
4. Empty state shows "No files yet" message
5. UI doesn't interfere with chat interface
6. Responsive layout works on different screen sizes

**Technical Notes:**
- Consider split-pane layout (chat left, files right)
- Or tab-based interface (Chat tab / Files tab)
- Use CSS Grid or Flexbox for layout

---

#### Story 4.2: Display Directory Tree Structure

**As an** end user
**I want** to see the directory structure of output files
**So that** I can navigate folders created by the agent

**Prerequisites:** Story 4.1 (File Viewer UI)

**Acceptance Criteria:**
1. Directory tree displays output folder structure
2. Folders can be expanded/collapsed
3. Files are distinguishable from folders (icons or styling)
4. Nested directories display with proper indentation
5. Empty folders show as empty (not hidden)
6. Tree updates when new files are created
7. Clicking file selects it for viewing

**Technical Notes:**
- Create API endpoint to get directory tree structure
- Recursive function to build tree from file system
- Use tree view component or build custom
- Consider libraries like react-folder-tree

---

#### Story 4.3: Display File Contents

**As an** end user
**I want** to view the contents of files the agent created
**So that** I can read and verify generated documents

**Prerequisites:** Story 4.2 (Directory Tree)

**Acceptance Criteria:**
1. Clicking file in tree loads its contents
2. Text files display with proper formatting
3. Line breaks and whitespace preserved
4. Large files load without crashing browser
5. Binary files show "Cannot preview" message
6. Currently selected file is highlighted in tree
7. File path shown above content area

**Technical Notes:**
- Create API endpoint to read file contents
- Stream large files or implement pagination
- Detect binary vs text files (check mime type)
- Use <pre> tag or code editor component for display

---

#### Story 4.4: Markdown Rendering in File Viewer

**As an** end user
**I want** markdown files to render with formatting
**So that** I can read generated docs as intended

**Prerequisites:** Story 4.3 (Display File Contents)

**Acceptance Criteria:**
1. .md files render with markdown formatting
2. Toggle between rendered and raw view
3. Headings, lists, tables all render correctly
4. Links are clickable (if safe)
5. Code blocks display with proper formatting
6. Matches markdown rendering in chat interface
7. Default view is rendered (not raw)

**Technical Notes:**
- Reuse markdown renderer from chat interface
- Add "View Raw" toggle button
- Detect file extension to decide render mode

---

#### Story 4.5: Refresh File List

**As an** end user
**I want** the file list to update when agent creates new files
**So that** I see newly created files without manual refresh

**Prerequisites:** Story 4.2 (Directory Tree)

**Acceptance Criteria:**
1. File list refreshes after agent completes response
2. Manual refresh button available
3. New files highlighted or indicated as new (optional)
4. Refresh preserves currently selected file if still exists
5. Refresh doesn't interrupt user if viewing file
6. Auto-refresh frequency is reasonable (not too aggressive)

**Technical Notes:**
- Trigger refresh after function calling completes
- Use polling or WebSocket for real-time updates (polling simpler for MVP)
- Debounce refresh to avoid excessive calls

---

#### Story 4.6: File Viewer Navigation Polish

**As an** end user
**I want** smooth navigation between files
**So that** I can efficiently review multiple generated files

**Prerequisites:** Stories 4.3, 4.4 (File display working)

**Acceptance Criteria:**
1. Keyboard shortcuts for navigation (up/down arrows)
2. Breadcrumb trail shows current file path
3. "Back" functionality to return to file list view (if needed)
4. Loading indicator when opening large files
5. Scroll position preserved when switching files
6. Clear indication when file is empty vs loading

**Technical Notes:**
- Implement keyboard event handlers
- Add breadcrumb component
- Optimize for quick file switching

---

#### Story 4.7: Security - Read-Only File Access

**As a** platform operator
**I want** file viewer to be read-only
**So that** users cannot modify or delete files through the UI

**Prerequisites:** All Epic 3 stories

**Acceptance Criteria:**
1. No edit or delete buttons in file viewer UI
2. API endpoints only support read operations
3. Write attempts return error (shouldn't happen from UI)
4. File tree cannot trigger file deletions
5. File downloads disabled in MVP (view-only)
6. Security tested with manual API calls

**Technical Notes:**
- API endpoints should only implement GET methods
- Reject POST/PUT/DELETE at API level
- Document intention to add download in Phase 2

---

### Epic 5: Docker Deployment and Configuration

**Epic Goal:** Package platform for easy deployment via Docker with minimal configuration

**Business Value:** Enables distribution - agent builders can run the platform locally or on network

**Success Criteria:**
- Single docker-compose up starts entire application
- Volume mounts work correctly for agents and outputs
- Environment variable configuration is simple
- Clear documentation for deployment

**Dependencies:** Epics 1, 2, 3, 4 ALL 100% COMPLETE - you need a fully functional application before containerizing

**⚠️ Solo Developer Note:** Do NOT start Docker work until you have a working app you can test locally. Debugging Docker issues with a half-built app is extremely painful.

**Estimated Stories:** 6

---

#### Story 5.1: Create Dockerfile for Next.js App

**As a** developer
**I want** a Dockerfile that builds and runs the Next.js application
**So that** the app can be containerized

**Prerequisites:** Working Next.js application (Epics 1-4 complete)

**Acceptance Criteria:**
1. Dockerfile uses appropriate Node.js base image
2. Dependencies installed via npm/yarn
3. Production build created
4. Application starts successfully in container
5. Environment variables can be passed to container
6. Image size is reasonable (use multi-stage build)
7. Container runs as non-root user for security

**Technical Notes:**
- Use official Node.js image (alpine for smaller size)
- Multi-stage build: build stage + runtime stage
- Copy only necessary files to runtime stage
- Set NODE_ENV=production

---

#### Story 5.2: Configure Volume Mounts

**As an** agent builder
**I want** to mount my agents folder into the container
**So that** the platform can access my agents

**Prerequisites:** Story 5.1 (Dockerfile)

**Acceptance Criteria:**
1. Agents folder mounts as read-only volume
2. Output folder mounts as read-write volume
3. Volume paths configurable via docker-compose
4. Mounted folders accessible from Next.js app
5. File changes in mounted volumes reflect immediately
6. Permissions set correctly for file operations
7. Example folder structure documented

**Technical Notes:**
- Define volumes in docker-compose.yml
- Use bind mounts for development
- Document recommended folder structure
- Test on macOS, Linux, Windows (if possible)

---

#### Story 5.3: Environment Variable Configuration

**As a** deployer
**I want** to configure the app via environment variables
**So that** I don't have to modify code for deployment

**Prerequisites:** Story 5.1 (Dockerfile)

**Acceptance Criteria:**
1. OPENAI_API_KEY loaded from environment
2. Agents folder path configurable (with default)
3. Output folder path configurable (with default)
4. Port number configurable (default 3000)
5. Environment variables documented in README
6. .env.example file provided as template
7. App validates required variables on startup

**Technical Notes:**
- Use Next.js environment variable support
- Create .env.example with placeholder values
- Add startup validation for OPENAI_API_KEY
- Document which vars are required vs optional

---

#### Story 5.4: Create docker-compose.yml

**As a** deployer
**I want** a docker-compose file for easy deployment
**So that** I can start the app with one command

**Prerequisites:** Stories 5.1, 5.2, 5.3 (Docker configured)

**Acceptance Criteria:**
1. docker-compose.yml defines complete setup
2. Environment variables passed to container
3. Volume mounts configured correctly
4. Port mapping configured (host:container)
5. Service starts with `docker-compose up`
6. Logs visible in console
7. Service stops cleanly with `docker-compose down`

**Technical Notes:**
- Single service definition (web app)
- Use environment file (.env) for variables
- Map port 3000 or configurable port
- Name service descriptively (e.g., agent-orchestrator)

---

#### Story 5.5: Deployment Documentation

**As a** new deployer
**I want** clear instructions for deploying the platform
**So that** I can get it running quickly

**Prerequisites:** All Epic 4 stories complete

**Acceptance Criteria:**
1. README includes deployment section
2. Prerequisites listed (Docker, Docker Compose installed)
3. Step-by-step setup instructions (10 steps or fewer)
4. Configuration options documented
5. Troubleshooting section for common issues
6. Example .env file provided
7. Instructions tested by someone unfamiliar with project

**Technical Notes:**
- Use clear headings and code blocks in README
- Include example commands for copy-paste
- Document folder structure requirements
- Add troubleshooting for common errors

---

#### Story 5.6: Basic Logging and Health Check

**As a** deployer
**I want** basic logging and health check
**So that** I can verify the app is running correctly

**Prerequisites:** Story 5.4 (docker-compose)

**Acceptance Criteria:**
1. Application logs startup messages
2. Health check endpoint (/health or /api/health)
3. Health check returns 200 OK when app is ready
4. Logs show when agent is selected
5. Logs show file operation activity
6. Error logs clearly indicate failures
7. Docker logs accessible via `docker logs` command

**Technical Notes:**
- Create /api/health endpoint returning simple status
- Use console.log for basic logging (structured logging optional)
- Log at startup: "Server ready on port 3000"
- Consider log levels (info, warn, error)

---

### Epic 6: Polish, Testing, and Documentation

**Epic Goal:** Ensure platform is production-ready with good UX and clear documentation

**Business Value:** Takes platform from "works" to "delightful to use" - critical for adoption

**Success Criteria:**
- UI/UX is polished and intuitive
- Error messages are helpful
- Cross-browser testing complete
- Documentation enables self-service setup

**Dependencies:** Epics 1-5 ALL COMPLETE - final polish phase after all features working

**⚠️ Solo Developer Note:** While some polish can happen during development, save the bulk of Epic 6 for the end. Polishing incomplete features wastes time. Exception: Story 6.5 (Agent Builder Guide) and 6.6 (End User Guide) can be drafted earlier as you learn the system.

**Estimated Stories:** 8

---

#### Story 6.1: UI/UX Polish Pass

**As an** end user
**I want** a polished, professional-looking interface
**So that** the platform feels trustworthy and pleasant to use

**Prerequisites:** Epic 3 complete (Chat UI working)

**Acceptance Criteria:**
1. Consistent spacing and alignment throughout
2. Color scheme is cohesive and professional
3. Typography is clear and readable
4. Button states (hover, active, disabled) are styled
5. Transitions and animations are subtle (not distracting)
6. Loading states are clear but not jarring
7. Mobile layout works (even if not optimized)
8. Dark mode support (optional, nice-to-have)

**Technical Notes:**
- Review entire UI for consistency
- Use CSS variables for colors and spacing
- Test all interactive elements
- Consider accessibility (contrast ratios, focus states)

---

#### Story 6.2: Error Message Improvements

**As an** end user
**I want** helpful error messages
**So that** I understand what went wrong and how to fix it

**Prerequisites:** All error handling implemented

**Acceptance Criteria:**
1. All error messages reviewed for clarity
2. Technical jargon removed or explained
3. Errors suggest next steps when possible
4. Error styling is consistent (color, icon, placement)
5. Errors don't blame user ("Invalid input" vs "You entered invalid input")
6. Contact/help information provided for unrecoverable errors
7. Errors tested with non-technical user for comprehension

**Technical Notes:**
- Create error message style guide
- Map common errors to friendly messages
- Review all catch blocks and error handlers
- Consider error message component for consistency

---

#### Story 6.3: Cross-Browser Testing

**As a** user on any modern browser
**I want** the platform to work correctly
**So that** I can use my preferred browser

**Prerequisites:** All features complete

**Acceptance Criteria:**
1. Testing completed on Chrome (latest)
2. Testing completed on Firefox (latest)
3. Testing completed on Safari (latest)
4. Testing completed on Edge (latest)
5. Known issues documented if any exist
6. Critical bugs fixed before release
7. Minimum browser versions documented

**Technical Notes:**
- Create testing checklist for each browser
- Test on actual browsers (not just simulators)
- Focus on: chat interface, file viewer, markdown rendering
- Document browser-specific issues

---

#### Story 6.4: Performance Optimization

**As an** end user
**I want** fast response times
**So that** the platform feels responsive and efficient

**Prerequisites:** All features complete

**Acceptance Criteria:**
1. Initial page load under 2 seconds
2. Chat messages send/display quickly
3. File viewer opens files within 1 second
4. No unnecessary API calls or renders
5. Large file handling doesn't freeze UI
6. Memory leaks identified and fixed
7. Performance tested with realistic agent workflows

**Technical Notes:**
- Use React DevTools Profiler
- Optimize re-renders (React.memo, useMemo)
- Implement lazy loading where appropriate
- Test with large conversations and many files

---

#### Story 6.5: Agent Builder Guide

**As an** agent builder
**I want** documentation on deploying BMAD agents
**So that** I can successfully deploy my agents to the platform

**Prerequisites:** Platform functional

**Acceptance Criteria:**
1. Guide explains BMAD agent file structure
2. Instructions for adding agents to agents folder
3. Example agent provided as reference
4. Troubleshooting section for common agent issues
5. Explanation of OpenAI compatibility considerations
6. Guide to testing agents before deployment
7. Tips for optimizing agents for OpenAI

**Technical Notes:**
- Create separate AGENT_BUILDER_GUIDE.md
- Include sample agent with comments
- Document known differences between Claude Code and OpenAI
- Link from main README

---

#### Story 6.6: End User Guide

**As an** end user
**I want** basic usage instructions
**So that** I can get started quickly

**Prerequisites:** Platform functional

**Acceptance Criteria:**
1. Quick start guide in README
2. Screenshots of key UI elements
3. Example conversation flow
4. FAQ section for common questions
5. Explanation of what agents can do
6. How to start new conversation
7. How to access generated files

**Technical Notes:**
- Keep concise (one page or less)
- Focus on "getting started" not comprehensive docs
- Include annotated screenshots
- Write for non-technical audience

---

#### Story 6.7: Code Quality and Cleanup

**As a** developer
**I want** clean, maintainable code
**So that** future development is easier

**Prerequisites:** All features implemented

**Acceptance Criteria:**
1. Remove commented-out code
2. Remove console.logs used for debugging
3. Fix linting errors and warnings
4. Consistent code formatting throughout
5. No unused imports or variables
6. TODOs addressed or documented
7. File and function naming is clear and consistent

**Technical Notes:**
- Run linter and fix issues
- Use Prettier for formatting consistency
- Review all files for cleanup opportunities
- Consider code review if multiple developers

---

#### Story 6.8: MVP Validation Test

**As a** product owner
**I want** to validate MVP meets success criteria
**So that** I can confirm readiness for release

**Prerequisites:** All epics complete

**Acceptance Criteria:**
1. At least 3 different BMAD agents deployed successfully
2. OpenAI compatibility rate measured and documented
3. Build-to-deploy time measured (target: <1 hour)
4. End user can complete task without assistance
5. All MVP success criteria from PRD validated
6. Known issues documented in KNOWN_ISSUES.md
7. Go/no-go decision made for release

**Technical Notes:**
- Create validation checklist from PRD success criteria
- Run through all user journeys from PRD
- Document OpenAI compatibility findings
- Prepare for potential iterations based on findings

---

## Summary

**Total Stories:** 44 stories across 6 epics

**Epic Breakdown:**
- Epic 1: 6 stories (Backend Foundation & Infrastructure)
- Epic 2: 11 stories (OpenAI Integration with File Operations - includes 2.3.5 smoke test)
- Epic 3: 8 stories (Chat Interface and Agent Selection)
- Epic 4: 7 stories (File Management and Viewer)
- Epic 5: 6 stories (Docker Deployment and Configuration)
- Epic 6: 8 stories (Polish, Testing, and Documentation)

**Development Sequence (Solo Developer - Strict Sequential):**
1. **Sprint 1:** Epic 1 (ALL stories 1.1-1.6) - Backend foundation - MUST complete 100% before proceeding
2. **Sprint 2:** Epic 2 (ALL stories 2.1-2.3.5, 2.4-2.10) - OpenAI integration - MUST complete 100% before proceeding
3. **Sprint 3:** Epic 3 (ALL stories 3.1-3.8) - Chat Interface - MUST complete 100% before proceeding
4. **Sprint 4:** Epic 4 (ALL stories 4.1-4.7) - File Viewer - MUST complete 100% before proceeding
5. **Sprint 5:** Epic 5 (ALL stories 5.1-5.6) - Docker Deployment - MUST complete 100% before proceeding
6. **Sprint 6:** Epic 6 (ALL stories 6.1-6.8) - Polish, Testing, Documentation

**Critical Path (Solo Developer):** Epic 1 → Epic 2 → Epic 3 → Epic 4 → Epic 5 → Epic 6

**⚠️ Solo Developer Critical Rules:**
1. **NO epic overlap** - Complete each epic 100% before starting the next
2. **NO parallel work** - Context switching between epics kills productivity
3. **Test thoroughly** at end of each epic before moving on - fixes are cheaper now than later
4. **Epic 2 gates Epic 3** - You cannot build functional chat until OpenAI integration is complete
5. **Epic 3 gates Epic 4** - File viewer integrates into chat UI layout

**Key Insight:** Epic 1 is the critical foundation - without backend infrastructure, neither OpenAI integration nor Chat UI can be built. Each epic builds on the complete foundation of the previous epic.

---

_This epic breakdown provides detailed implementation guidance while maintaining flexibility for discovery during development. Story estimates and sequencing can be adjusted based on actual implementation findings._
