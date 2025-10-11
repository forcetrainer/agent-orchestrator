# Agent Orchestrator - Epic Breakdown

**Author:** Bryan
**Date:** 2025-10-02 (Updated: 2025-10-11)
**Project Level:** Level 3 (Full Product)
**Target Scale:** 68 stories across 9 epics

---

## Epic Overview

This epic breakdown supports the Agent Orchestrator PRD, organizing development into 9 major epics that deliver the MVP platform. The primary goal is validating OpenAI API compatibility with BMAD agents while enabling rapid deployment to end users.

**IMPORTANT ARCHITECTURAL PIVOT (October 2025):**
Epic 2 and Epic 3 validation testing revealed that the initial OpenAI integration approach did not properly implement the agentic execution loop required for BMAD agents. Epic 4 "Agent Execution Architecture & Bundle System" was created to implement the correct architecture per AGENT-EXECUTION-SPEC.md and BUNDLE-SPEC.md, replacing the deprecated Epic 2 implementation.

**NEW EPIC ADDED (October 2025 - Epic 6):**
Epic 6 "Enhanced UX & Interactive Features" was added based on user feedback from Epics 1-5. Users reported that the always-visible file viewer reduces chat space, sessions/files are hard to distinguish, and waiting for full responses feels slow. Epic 6 addressed these pain points before Docker deployment.

**NEW EPIC ADDED (October 2025 - Epic 9):**
Epic 9 "Simplify Workflow Execution Architecture" was added to address agent behavior issues caused by over-engineered workflow execution system. Refactor simplifies tool architecture, improves LLM agency, and aligns with Claude Code's proven patterns. See REFACTOR-SPEC-SIMPLIFY-WORKFLOW-EXECUTION.md for detailed rationale.

**Epic Sequencing (Solo Developer - Revised Sequential Order):**
1. **Epic 1** (Backend Foundation) - ✅ COMPLETE
2. **Epic 2** (OpenAI Integration) - ⚠️ DEPRECATED (learning preserved, replaced by Epic 4)
3. **Epic 3** (Chat Interface) - ✅ COMPLETE
4. **Epic 4** (Agent Execution Architecture & Bundle System) - ✅ COMPLETE
5. **Epic 5** (File Viewer) - ✅ COMPLETE
6. **Epic 6** (Enhanced UX & Interactive Features) - ✅ COMPLETE
7. **Epic 9** (Simplify Workflow Execution Architecture) - 🎯 NEXT (NEW - architectural refactor)
8. **Epic 7** (Docker Deployment) - Requires clean architecture (Epic 9 complete)
9. **Epic 8** (Polish & Docs) - Final polish after all features complete

**Critical Dependency Chain (Solo Developer):** Epic 1 ✅ → Epic 4 ✅ → Epic 3 ✅ → Epic 5 ✅ → Epic 6 ✅ → **Epic 9 🎯** → Epic 7 → Epic 8

**⚠️ Solo Developer Warning:** Unlike team environments where epics can overlap, as a solo developer you MUST complete each epic fully before moving to the next. Half-built epics create technical debt and context switching overhead.

**Total Estimated Effort:** 68 stories (Level 3 scope: 12-40 stories, expanded due to architectural correction + UX improvements + workflow simplification)
- Epic 1: 6 stories ✅ COMPLETE
- Epic 2: 10 stories ⚠️ DEPRECATED
- Epic 3: 9 stories ✅ COMPLETE
- Epic 4: 12 stories ✅ COMPLETE
- Epic 5: 7 stories ✅ COMPLETE
- Epic 6: 10 stories ✅ COMPLETE
- Epic 9: 6 stories 🎯 NEXT (NEW - Workflow Simplification)
- Epic 7: 6 stories (Docker)
- Epic 8: 8 stories (Polish)

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

### Epic 2: OpenAI Integration with File Operations (DEPRECATED)

**Status:** ⚠️ DEPRECATED - Replaced by Epic 4

**Epic Goal:** Validate that BMAD agents work with OpenAI API through function calling for file operations

**Business Value:** Proves the core hypothesis - this is the primary validation goal of the entire MVP

**Original Success Criteria:**
- At least one BMAD agent successfully executes via OpenAI API
- File operations (read, write, list) work correctly via function calling
- Lazy-loading pattern loads instruction files on-demand
- Path security prevents unauthorized file access

**Deprecation Reason:**
Validation testing during Story 3.10 revealed that this implementation did not properly implement the agentic execution loop (pause-load-continue pattern) required for BMAD agents. Specific issues:
- File loading via function calling did not block execution (agents continued without loaded files)
- BMAD path variables ({bundle-root}, {core-root}, {project-root}) were not being resolved
- Agent initialization did not execute critical-actions as required
- Simple function calling loop inadequate for complex agent workflows

**Learning Preserved:**
- File operation security patterns (path validation, access controls)
- API error handling approaches
- Basic function calling concepts
- OpenAI SDK integration patterns

**Replaced By:** Epic 4 "Agent Execution Architecture & Bundle System" which implements correct architecture per AGENT-EXECUTION-SPEC.md and BUNDLE-SPEC.md

**Dependencies:** Epic 1 (Backend foundation must be complete - especially API routes and environment config)

**Estimated Stories:** 11 stories (learning complete, implementation deprecated)

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

**Status:** 🔄 PARTIALLY COMPLETE

**Epic Goal:** Enable end users to select and interact with BMAD agents through a familiar chat interface

**Business Value:** Delivers the fundamental user experience that makes agents accessible to non-technical users

**Success Criteria:**
- End users can select an agent and have a conversation
- Interface feels familiar to ChatGPT/Claude.ai users
- Markdown rendering works correctly for agent responses
- Users can start new conversations and reset context

**Completion Status:**
- ✅ Stories 3.1-3.8: UI infrastructure complete (chat layout, message display, markdown rendering)
- 🚧 Story 3.4: Agent Discovery - needs bundle-aware rework in Epic 4
- 🚧 Story 3.9: Lazy-loading Validation - needs re-testing after Epic 4
- 🚧 Story 3.10: Agent Initialization - needs complete re-implementation in Epic 4

**Dependencies:**
- Epic 1 (Backend foundation) ✅ COMPLETE
- Epic 4 (Agent Execution Architecture) - REQUIRED to unblock Stories 3.4, 3.9, 3.10

**⚠️ Architectural Note:** Original dependency was Epic 2 (deprecated). Epic 4 now provides the correct agent execution architecture needed to complete this epic.

**Estimated Stories:** 9 stories (6 complete, 3 blocked pending Epic 4)

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
1. Backend scans agent directories at depth 1 (agents/*/*.md) and identifies agent definition files by presence of `<agent id="..." name="..." title="...">` XML tag
2. `/api/agents` endpoint returns list of discovered agents with metadata
3. Dropdown/selector displays list of agents in UI
4. Agent metadata (id, name, title, icon) extracted from XML `<agent>` tag attributes
5. Dropdown appears prominently in UI (top of page or sidebar)
6. Selecting an agent loads it for conversation
7. System handles empty agents folder gracefully (shows message)
8. Agent discovery excludes workflow/template .md files (only scans depth 1)
9. Agent discovery validates required XML metadata (id, name, title) and filters out files without valid agent tags

**Technical Notes:**
- Create `lib/agents/scanner.ts` for agent discovery logic
- Create `lib/agents/validator.ts` for agent validation logic
- Scan at depth 1 only (agents/*/*.md), not recursive through workflows/templates
- Parse XML `<agent>` tag using regex to extract id, name, title, icon attributes
- Extract optional description from `<persona><role>` element content
- Validate required fields (id, name, title) and check for duplicate IDs
- Filter out files in workflows/ and templates/ subdirectories
- Filter out files without valid `<agent>` tag
- Return agent list as JSON: [{id, name, title, description?, icon?, path}]
- Frontend calls API on mount and populates dropdown
- **Agent File Structure:** Each agent must have:
  - `agents/{agent-dir}/{name}-{role}.md` (REQUIRED - agent definition with XML metadata)
  - `agents/{agent-dir}/workflows/` (OPTIONAL - workflow definitions)
  - `agents/{agent-dir}/templates/` (OPTIONAL - template files)
  - `agents/{agent-dir}/files/` (OPTIONAL - misc files)

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

#### Story 3.9: Validate Lazy-Loading with Complex BMAD Agent Workflow

**As a** developer
**I want** to validate that lazy-loading works with complex BMAD agents
**So that** I can confirm OpenAI function calling properly loads multiple instruction files on-demand

**Prerequisites:** Stories 3.5-3.10 complete (functional chat interface with agent initialization), Epic 2 complete (OpenAI integration with read_file function)

**Acceptance Criteria:**
1. Select or create a complex BMAD agent that requires loading at least 3 instruction files during execution
2. Agent uses lazy-loading pattern (files loaded via read_file when agent requests them, not upfront)
3. Test agent via chat interface with realistic workflow that triggers multiple instruction loads
4. Verify in console logs that read_file is called multiple times for different instruction files
5. Agent successfully completes workflow using dynamically loaded instructions
6. All lazy-loaded files return correct content to OpenAI
7. Agent behavior matches expected BMAD agent patterns
8. Document any OpenAI compatibility issues discovered during testing

**Technical Notes:**
- Use existing BMAD agent (bmad/bmm/agents/architect or similar) OR create test agent with workflow that loads templates/instructions
- Monitor `/api/chat` logs to verify read_file function calls
- Test should simulate real-world agent usage (not just basic "hello world")
- This validates PRD Goal #1: "Prove that lazy-loading instruction pattern is viable with OpenAI function calling"
- Consider testing with agent that has `<i>Load into memory...` patterns

---

#### Story 3.10: Agent Initialization on Selection

**As an** end user
**I want** the agent to initialize and greet me when I select it
**So that** I understand the agent's capabilities before sending my first message

**Prerequisites:** Stories 3.1-3.8 complete (chat interface functional)

**Acceptance Criteria:**
1. When agent is selected, system loads agent definition file and parses XML structure
2. System executes agent `<critical-actions>` section in order
3. Critical actions can load config files, set variables, and prepare agent context
4. Agent greeting/welcome message displays automatically before user input
5. Agent command list displays if defined in agent instructions
6. Initialization completes before user can send first message
7. Loading indicator shows during initialization process
8. Initialization errors display clearly without crashing interface

**Technical Notes:**
- Implement `lib/agents/initializer.ts` for initialization logic
- Parse agent XML to extract and execute `<critical-actions>`
- Support loading config files like `bmad/bmm/config.yaml`
- Agent greeting displays as "system" message role
- Fulfills PRD FR-2: "Agent Loading and Initialization"

---

### Epic 4: Agent Execution Architecture & Bundle System (NEW)

**Status:** 🚧 IN PROGRESS

**Epic Goal:** Implement correct agent execution architecture with agentic loop and bundle structure support

**Business Value:** Fixes fundamental execution pattern mismatch discovered during Epic 2/3 validation. Enables BMAD agents to function correctly with OpenAI API using the same patterns as Claude Code. Establishes sustainable agent organization through bundle structure.

**Success Criteria:**
- ✅ Agentic execution loop implements pause-load-continue pattern (matches Claude Code)
- ✅ File loading via function calling blocks execution until files are available
- ✅ Path variables ({bundle-root}, {core-root}, {project-root}) resolve correctly
- ✅ Critical actions execute during agent initialization
- ✅ Bundle structure discovered from manifests (bundle.yaml)
- ✅ Bundled agents load and execute successfully end-to-end
- ✅ All Epic 2/3 tests refactored and passing with new architecture

**Dependencies:**
- Epic 1 (Backend foundation) ✅ COMPLETE
- Epic 3 Stories 3.1-3.8 (UI infrastructure) ✅ COMPLETE
- Replaces deprecated Epic 2 implementation
- Blocks Epic 3 Stories 3.4, 3.9, 3.10 completion
- Must complete before Epic 5-7 can proceed

**Estimated Stories:** 12 stories
**Estimated Effort:** 1.5-2 sprints

---

#### Story 4.1: Implement Agentic Execution Loop

**As a** developer
**I want** to implement an agentic execution loop with function calling
**So that** agents pause execution, load files via tools, and continue only after files are available

**Prerequisites:** Epic 1 complete (API routes), Epic 3 Stories 3.1-3.8 (UI)

**Acceptance Criteria:**
1. Implement while loop that continues until LLM returns response without tool calls
2. Each iteration: call OpenAI → check for tool calls → execute tools → inject results → loop
3. Conversation messages array grows with each tool call and result
4. Tool results injected as 'tool' role messages with tool_call_id
5. Loop has safety limit (max 50 iterations) to prevent infinite loops
6. Each iteration logged for debugging
7. Loop maintains conversation context across all iterations
8. Agent cannot continue without tool results (execution blocks on tool calls)

**Technical Notes:**
- Follow AGENT-EXECUTION-SPEC.md Section 3: "Agentic Execution Loop"
- Replace existing simple function calling from Epic 2 Story 2.6
- Messages array structure: system → user → assistant (with tool_calls) → tool → assistant → ...

---

#### Story 4.2: Implement Path Variable Resolution System

**As a** developer
**I want** to resolve BMAD path variables in file paths
**So that** agents can use {bundle-root}, {core-root}, and {project-root} to navigate files

**Prerequisites:** Story 4.1 (Agentic loop)

**Acceptance Criteria:**
1. Resolve {bundle-root} to `bmad/custom/bundles/{bundle-name}/`
2. Resolve {core-root} to `bmad/core/`
3. Resolve {project-root} to application root directory
4. Resolve {config_source}:variable_name by loading bundle config.yaml
5. Support nested variable resolution (variables within variables)
6. Resolution happens before executing file operation tools
7. Invalid variable references return clear error messages
8. Path resolution function unit tested with all variable types

**Technical Notes:**
- Follow AGENT-EXECUTION-SPEC.md Section 5: "Path Resolution System"
- Create `lib/pathResolver.ts` utility
- Load bundle config.yaml once per agent session, cache for variable lookups
- Resolve in order: config references → system variables → path variables

---

#### Story 4.3: Implement Critical Actions Processor

**As a** developer
**I want** to execute agent critical-actions during initialization
**So that** agents can load config files and set up initial context

**Prerequisites:** Story 4.2 (Path resolution)

**Acceptance Criteria:**
1. Parse `<critical-actions>` section from agent.md XML
2. Extract file load instructions: "Load into memory {path} and set variables: var1, var2"
3. Execute file loads via read_file function during initialization
4. Inject loaded file contents as system messages before user input
5. Parse config.yaml files and store variables for resolution
6. Execute non-file instructions as system messages (e.g., "Remember user's name is {user_name}")
7. All critical actions complete before agent accepts first user message
8. Errors in critical actions halt initialization with clear message

**Technical Notes:**
- Follow AGENT-EXECUTION-SPEC.md Section 4: "Critical Actions Processor"
- Create `lib/agents/criticalActions.ts`
- Critical actions run BEFORE agentic loop starts
- Typically loads bundle config.yaml and sets user preferences

---

#### Story 4.4: Implement Bundle Structure Discovery and Loading

**As a** developer
**I want** to discover agents from bundle manifests
**So that** the system can load bundled agents with proper metadata

**Prerequisites:** Story 4.2 (Path resolution)

**Acceptance Criteria:**
1. Scan `bmad/custom/bundles/*/bundle.yaml` files
2. Parse bundle.yaml to extract type (bundle vs standalone)
3. Extract agent metadata: id, name, title, description, icon, file, entry_point
4. Filter agents to only show entry_point: true in agent selector
5. Return agent list with bundle context: [{id, name, title, description, icon, bundleName, bundlePath}]
6. Validate bundle structure (required: bundle.yaml, agents/, config.yaml)
7. Handle missing or malformed bundle.yaml gracefully
8. Update `/api/agents` endpoint to return bundled agents

**Technical Notes:**
- Follow BUNDLE-SPEC.md Section "Server Integration > Agent Discovery"
- Replace Epic 3 Story 3.4 agent discovery implementation
- Create `lib/agents/bundleScanner.ts`
- Scan depth 1 only (`bundles/*/bundle.yaml`), not recursive

---

#### Story 4.5: Refactor File Operation Tools for Agentic Loop

**As a** developer
**I want** to refactor existing read_file, write_file, list_files tools
**So that** they work correctly within the agentic execution loop and support path variables

**Prerequisites:** Story 4.1 (Agentic loop), Story 4.2 (Path resolution)

**Acceptance Criteria:**
1. Update read_file to resolve path variables before reading
2. Update write_file to resolve path variables before writing
3. Update list_files to resolve path variables before listing
4. Tools return results in format compatible with agentic loop context injection
5. Tool results include resolved paths for debugging
6. Path security validation works with resolved paths (no traversal attacks)
7. Tools work with bundle structure ({bundle-root}/workflows/*, {core-root}/tasks/*)
8. Existing Epic 2 tool tests refactored to test with path variables

**Technical Notes:**
- Modify existing `lib/fileOperations.ts` from Epic 2
- Add path resolution step before Epic 2 security checks
- Ensure tool results inject cleanly into conversation messages array
- Test with bundled agent paths: `{bundle-root}/workflows/intake/workflow.yaml`

---

#### Story 4.6: Refactor Agent Discovery for Bundle Structure

**As a** developer
**I want** to update agent discovery to load from bundle manifests
**So that** bundled agents display correctly in agent selector

**Prerequisites:** Story 4.4 (Bundle discovery)

**Acceptance Criteria:**
1. Frontend calls `/api/agents` and receives bundled agent list
2. Agent selector dropdown displays agent name and title from bundle.yaml
3. Optional: Display bundle name as subtitle (e.g., "Alex - Requirements Facilitator")
4. Selecting agent loads from bundle structure (bundle.yaml file path)
5. Agent metadata (icon, description) available for UI enhancement (optional for MVP)
6. Empty bundles folder shows "No agents available" message
7. Malformed bundles logged but don't crash agent selector

**Technical Notes:**
- Update frontend agent selector component from Epic 3 Story 3.4
- Keep UI simple: flat list of all entry_point agents (don't group by bundle for MVP)
- Agent ID from bundle.yaml used as unique identifier

---

#### Story 4.7: Re-implement Agent Initialization with Critical Actions

**As a** developer
**I want** to execute agent initialization using critical actions processor
**So that** agents load config and greet users correctly on selection

**Prerequisites:** Story 4.3 (Critical actions), Story 4.6 (Bundle discovery)

**Acceptance Criteria:**
1. When agent selected, load agent.md from bundle
2. Parse and execute `<critical-actions>` section
3. Load bundle config.yaml if specified in critical actions
4. Execute file loads via agentic loop (if agent requests files during initialization)
5. Display agent greeting message after initialization completes
6. Loading indicator shows during initialization
7. Initialization errors display clearly without crashing UI
8. User can send first message after initialization completes

**Technical Notes:**
- Replace Epic 3 Story 3.10 implementation
- Combines critical actions processor (Story 4.3) with agentic loop (Story 4.1)
- Agent greeting typically comes from agent definition or first system response

---

#### Story 4.8: Implement System Prompt Builder with Tool Usage Instructions

**As a** developer
**I want** to build system prompts that instruct OpenAI to actively use tools
**So that** file load instructions trigger actual tool calls instead of being acknowledged as text

**Prerequisites:** Story 4.1 (Agentic loop)

**Acceptance Criteria:**
1. System prompt includes agent persona, role, identity, principles
2. System prompt explicitly instructs: "When you see instructions to load files, use the read_file tool"
3. System prompt lists available tools and their purpose
4. System prompt explains workflow execution pattern
5. System prompt emphasizes: "DO NOT just acknowledge file load instructions - actually call the tools"
6. Available commands from agent's `<cmds>` section included in prompt
7. System prompt tested to verify it triggers tool calls (not just text acknowledgment)

**Technical Notes:**
- Follow AGENT-EXECUTION-SPEC.md Section 6: "System Prompt Builder"
- Create `lib/agents/systemPromptBuilder.ts`
- Critical instruction: Make OpenAI understand it MUST use tools, not describe them

---

#### Story 4.9: Validate Bundled Agents End-to-End

**As a** developer
**I want** to validate that bundled agents work correctly with new architecture
**So that** we confirm agents behave like they do in Claude Code

**Prerequisites:** All Epic 4 stories 4.1-4.8 complete

**Acceptance Criteria:**
1. Load bundled agent from `bmad/custom/bundles/requirements-workflow/`
2. Agent initializes successfully, executes critical actions
3. User sends message that triggers workflow requiring file loads
4. Verify in logs: read_file tool called multiple times for different instruction files
5. Verify execution pauses at each tool call, waits for result, then continues
6. Agent successfully completes workflow using dynamically loaded instructions
7. Path variables ({bundle-root}, {core-root}) resolve correctly in logs
8. Agent behavior matches expected BMAD patterns (similar to Claude Code execution)
9. Document any remaining compatibility issues discovered

**Technical Notes:**
- Use existing bundled agents: Alex, Casey, or Pixel from requirements-workflow bundle
- This is equivalent to Epic 3 Story 3.9 (lazy-loading validation) but with correct architecture
- Monitor console logs to verify tool execution flow
- Compare behavior to same agent running in Claude Code (if possible)

---

#### Story 4.10: Refactor Epic 2 and Epic 3 Tests

**As a** developer
**I want** to refactor existing tests for new architecture
**So that** test suite validates correct agentic execution pattern

**Prerequisites:** All Epic 4 stories 4.1-4.9 complete

**Acceptance Criteria:**
1. Unit tests for agentic execution loop (iterations, tool injection, safety limits)
2. Unit tests for path variable resolution (all variable types)
3. Unit tests for critical actions processor
4. Unit tests for bundle discovery and parsing
5. Integration tests for complete agent initialization flow
6. Integration tests for file loading during agent execution
7. Update Epic 2 tests that are still relevant (file security, error handling)
8. Delete Epic 2 tests that are obsolete (simple function calling loop)
9. All tests passing with new architecture

**Technical Notes:**
- Review existing Epic 2 test suite, identify what to keep vs replace
- Focus on testing the agentic loop, not just individual functions
- Test with realistic agent scenarios (multi-file loads, variable resolution)
- Mock OpenAI responses to test tool call handling

---

#### Story 4.11: Add Core BMAD Files Volume Mount Support

**As a** developer
**I want** to ensure core BMAD files are accessible from bundles
**So that** agents can use {core-root} to load shared workflow files

**Prerequisites:** Story 4.2 (Path resolution)

**Acceptance Criteria:**
1. System can read files from `bmad/core/` directory
2. {core-root} variable resolves to correct path
3. Agents can execute: `read_file({core-root}/tasks/workflow.md)`
4. Core files are read-only (writes to core-root rejected)
5. Path security prevents access outside core directory via traversal
6. Document core dependencies in bundle.yaml are accessible
7. Test with actual core file: load `bmad/core/tasks/workflow.md`

**Technical Notes:**
- Core files already exist in project at `/Users/bryan.inagaki/Documents/development/agent-orchestrator/bmad/core/`
- This story primarily validates path resolution and security with core files
- Prepares for Epic 6 (Docker) where core will be mounted read-only

---

#### Story 4.12: Update Documentation for Epic 4 Architecture

**As a** developer
**I want** to document the new architecture in code comments and README
**So that** future developers understand the agentic execution pattern

**Prerequisites:** All Epic 4 stories complete

**Acceptance Criteria:**
1. README updated with architecture overview (agentic loop + bundle structure)
2. Code comments in agentic loop explain execution flow
3. Code comments in path resolver explain variable resolution order
4. Developer notes explain differences from original Epic 2 approach
5. Link to AGENT-EXECUTION-SPEC.md and BUNDLE-SPEC.md in relevant files
6. Quick troubleshooting guide for common agent execution issues
7. Example of successful agent execution flow in comments or docs

**Technical Notes:**
- Keep concise - detailed specs are in AGENT-EXECUTION-SPEC and BUNDLE-SPEC
- Focus on "why we did it this way" for future maintainers
- Document Epic 2 → Epic 4 transition for historical context

---

### Epic 5: File Management and Viewer

**Epic Goal:** Enable users to view and verify agent-generated outputs

**Business Value:** Builds trust by letting users see what agents created and access generated documents

**Success Criteria:**
- Users can browse output directory structure
- File contents display correctly in browser
- Read-only access prevents accidental modifications
- Directory structure is intuitive to navigate

**Dependencies:** Epic 4 COMPLETE (write_file working with path variables) AND Epic 3 COMPLETE (Chat UI layout established for file viewer integration)

**⚠️ Solo Developer Note:** Complete Epic 4 fully before starting Epic 5. The file viewer integrates into the existing chat UI layout, so you need that foundation stable first.

**Estimated Stories:** 8 (includes foundational Story 5.0)

---

#### Story 5.0: Session-Based Output Management (Foundation)

**As a** workflow engine developer
**I want** a standardized, secure session-based output management system
**So that** agent outputs are organized, discoverable, and isolated from application source code

**Prerequisites:** Epic 4 COMPLETE (Path Resolution Story 4.2, Workflow Engine Story 4.9)

**⚠️ CRITICAL:** This is a **foundational story** that MUST be completed before Stories 5.1-5.7. The file viewer has no predictable structure to display without this.

**Problem Statement:**
- Current agents use inconsistent output paths with undefined variables
- No standardized way for agents to discover outputs from other agents
- Security risk: agents could potentially write to source code directories
- File viewer (Stories 5.1-5.7) needs reliable directory structure to display

**Solution:**
- Isolated `/data/agent-outputs/` directory for all agent writes
- UUID-based session folders provide unique, collision-free namespacing
- Manifest.json enables cross-agent discovery and human navigation
- Security boundary: agents can ONLY write to `/data`, never to source code

**Acceptance Criteria:**

1. **Isolated Output Directory**
   - [ ] `/data/agent-outputs/` directory created at project root
   - [ ] `/data` added to `.gitignore` (agent outputs not version controlled)
   - [ ] Path validator enforces: agents can ONLY write to `/data/agent-outputs`
   - [ ] Attempts to write outside `/data` throw security error

2. **Session ID Generation**
   - [ ] Workflow engine generates UUID v4 for each workflow execution
   - [ ] Session folder created at `/data/agent-outputs/{uuid}/`
   - [ ] `{{session_id}}` template variable available to agents
   - [ ] Session ID immutable for duration of workflow

3. **Manifest Auto-Generation**
   - [ ] Manifest.json created on workflow start with `status: "running"`
   - [ ] Manifest finalized on completion with `completed_at` and final status
   - [ ] Schema matches SESSION-OUTPUT-SPEC.md v1.0.0
   - [ ] Manifest saved to `{session-folder}/manifest.json`

4. **Configuration Updates**
   - [ ] `bmad/bmm/config.yaml` updated:
     ```yaml
     output_folder: '{project-root}/data/agent-outputs'
     agent_outputs_folder: '{output_folder}'
     ```
   - [ ] Variables resolve correctly via path resolver

5. **Agent Workflow Migration**
   - [ ] **IMPORTANT: This is one of the LAST steps (Phase 5 in implementation)**
   - [ ] All Alex workflows updated (6 workflows): session_id, session_folder, manifest_file, default_output_file
   - [ ] All Casey workflows updated (6 workflows): same fields
   - [ ] All Pixel workflows updated (3 workflows): same fields
   - [ ] **DO NOT UPDATE until workflow engine changes are complete and tested**

6. **Session Discovery API**
   - [ ] `findSessions()` function implemented with filters (agent, workflow, status, limit)
   - [ ] Returns array of manifest objects sorted by started_at (newest first)
   - [ ] Empty array returned if no matches (not error)

7. **Output Registration**
   - [ ] `registerOutput()` utility available for agents
   - [ ] Appends to `manifest.outputs[]` array atomically
   - [ ] Auto-populates `created_at` timestamp

8. **Documentation**
   - [ ] SESSION-OUTPUT-SPEC.md finalized in `/docs`
   - [ ] BUNDLE-SPEC.md updated with session management section

**Implementation Phases:**

1. **Phase 1: Infrastructure** - Directory creation, config updates, documentation
2. **Phase 2: Workflow Engine** - UUID generation, session folder creation, manifest auto-generation
3. **Phase 3: Session Discovery** - findSessions() API, registerOutput() utility
4. **Phase 4: Security** - Path validator enforcement, security testing
5. **Phase 5: Agent Migration** - Update all workflow.yaml files (LAST STEP before testing)
6. **Phase 6: Integration Testing** - End-to-end validation, cross-agent discovery

**Technical Notes:**
- Detailed architecture in `docs/tech-spec-epic-5.md` Story 5.0 section
- Full specification in `docs/SESSION-OUTPUT-SPEC.md`
- Security model: `/data` is the ONLY writable location for agents
- Manifest schema enables programmatic cross-agent file discovery
- Session UUIDs prevent collision and enable concurrent workflow execution

**Story Points:** 8 (foundational infrastructure work)

---

#### Story 5.1: File Viewer UI Component

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

#### Story 5.2: Display Directory Tree Structure

**As an** end user
**I want** to see the directory structure of output files
**So that** I can navigate folders created by the agent

**Prerequisites:** Story 5.1 (File Viewer UI)

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

#### Story 5.2.1: Session Metadata Display Enhancement

**As an** end user
**I want** to see human-readable session names instead of UUIDs
**So that** I can easily identify which agent created which outputs

**Prerequisites:** Story 5.2 (Directory Tree Structure), Story 5.0 (Session-Based Output Management)

**Acceptance Criteria:**
1. Session folders display as "{Agent Title} - {Workflow Name} ({Date})" instead of UUID
2. manifest.json files hidden from directory tree (internal metadata only)
3. Clicking session folder shows agent metadata (agent name, workflow, user, timestamps)
4. Internal technical paths (UUIDs) still used for file operations and security validation
5. Empty sessions (no outputs yet) show as "Agent Name - Workflow (In Progress)"
6. Display names update when manifest.json is modified
7. Sessions without manifest.json fall back to showing UUID (graceful degradation)

**Technical Notes:**
- Create `lib/files/manifestReader.ts` to load and parse manifest.json
- Extend FileTreeNode interface: add `displayName?: string` and `metadata?: SessionMetadata`
- Update tree builder to read manifest.json from each session folder
- Generate display name: `${agent.title} - ${workflow.name} (${formatDate(execution.started_at)})`
- Filter files: exclude `manifest.json` from tree (add `isInternal?: boolean` flag)
- DirectoryTree component renders `node.displayName || node.name` (fallback to UUID)
- Cache manifest data to avoid repeated file reads (session metadata rarely changes)

**Implementation Tasks:**
- [ ] Create SessionMetadata TypeScript interface matching Story 5.0 manifest schema
- [ ] Implement manifestReader.ts with parseManifest() and generateDisplayName() functions
- [ ] Extend FileTreeNode interface with displayName and metadata fields
- [ ] Update treeBuilder.ts to load manifests and generate display names
- [ ] Add file filtering logic to exclude manifest.json from tree
- [ ] Update DirectoryTree component to render displayName
- [ ] Add metadata panel or tooltip showing full session details
- [ ] Write unit tests for manifest parsing and display name generation
- [ ] Write integration tests for tree with metadata-enhanced display
- [ ] Update tech-spec-epic-5.md with new data models and module descriptions

---

#### Story 5.3: Display File Contents

**As an** end user
**I want** to view the contents of files the agent created
**So that** I can read and verify generated documents

**Prerequisites:** Story 5.2 (Directory Tree)

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

#### Story 5.4: Markdown Rendering in File Viewer

**As an** end user
**I want** markdown files to render with formatting
**So that** I can read generated docs as intended

**Prerequisites:** Story 5.3 (Display File Contents)

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

#### Story 5.5: Refresh File List

**As an** end user
**I want** the file list to update when agent creates new files
**So that** I see newly created files without manual refresh

**Prerequisites:** Story 5.2 (Directory Tree)

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

#### Story 5.6: File Viewer Navigation Polish

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

#### Story 5.7: Security - Read-Only File Access

**As a** platform operator
**I want** file viewer to be read-only
**So that** users cannot modify or delete files through the UI

**Prerequisites:** All Epic 5 stories

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

### Epic 6: Enhanced UX & Interactive Features

**Epic Goal:** Improve usability and add real-time interactive capabilities based on user feedback from Epics 1-5

**Business Value:** Addresses key user pain points: file viewer takes up too much chat space, sessions/files are hard to distinguish, waiting for full responses feels slow, and generic status messages don't communicate what's happening. These UX improvements are essential before production deployment (Docker).

**Success Criteria:**
- File viewer can be collapsed to give chat 100% width
- File content displays in top/bottom split (better readability than narrow side panel)
- Session folders have user-friendly names (not just UUIDs)
- Files have descriptive names based on purpose (not "output.md")
- Users can drag files from viewer into chat to provide context
- Agent responses stream token-by-token (like ChatGPT)
- Status messages show actual tool activity ("Reading X...", "Writing Y...")

**Dependencies:** Epic 5 (File Viewer) must be complete - Epic 6 enhances existing file viewer and chat components

**Estimated Stories:** 10 stories (34 points, 2-3 sprints)

**Related Documentation:** `/docs/epic-6-architecture.md`

---

#### Story 6.1: Dynamic File Viewer Toggle

**As a** user
**I want** to collapse and expand the file viewer
**So that** I can use full screen width for chat when I need focused reading

**Prerequisites:** Epic 5 complete (file viewer exists)

**Acceptance Criteria:**
1. Toggle button appears in top-right navigation bar
2. Button shows "Files" icon when viewer closed, "Close" icon when open
3. Clicking button smoothly collapses/expands file viewer with 300ms animation
4. When viewer closed, chat panel uses 100% width (not 70%)
5. When viewer open, layout is 70% chat / 30% file viewer (current behavior preserved)
6. Keyboard shortcut `Ctrl/Cmd + B` toggles file viewer
7. Animation uses spring physics (natural feel, not linear)
8. Viewer state persists during session (if closed, stays closed until user reopens)

**Technical Notes:**
- Use Framer Motion for smooth collapse/expand animation
- CSS Grid adjusts dynamically: `grid-template-columns: 1fr` (closed) vs `1fr 30%` (open)
- `AnimatePresence` component handles mount/unmount animations
- State managed via `useFileViewer` hook (React Context)

**Definition of Done:**
- User can toggle file viewer on/off
- Chat panel expands to full width when viewer closed
- Animation is smooth and natural-feeling
- Keyboard shortcut works
- No layout jank or flash of unstyled content

---

#### Story 6.2: File Viewer Layout Redesign (Top/Bottom Split)

**As a** user
**I want** file content displayed in a wider format
**So that** I can read files more easily (current narrow side panel is cramped)

**Prerequisites:** Story 6.1 (toggle functionality)

**Acceptance Criteria:**
1. File viewer internal layout changes from left/right to top/bottom split
2. Top section (40% height): Directory tree (compact or horizontal layout)
3. Bottom section (60% height): File content display (full width of panel)
4. File content is easier to read with wider format (no horizontal scrolling for normal content)
5. Directory tree remains fully functional in top section
6. File selection in tree updates content in bottom section
7. Both sections have independent scrolling

**Technical Notes:**
- Use Flexbox for internal file viewer layout: `flex-direction: column`
- Directory tree: `height: 40%; overflow-y: auto`
- File content: `height: 60%; overflow-y: auto`
- Consider horizontal file tree layout (row of folders) or compact vertical
- Preserve all existing file tree functionality (expand/collapse, file selection)

**Definition of Done:**
- File content displays in bottom section with full panel width
- Directory tree in top section (compact layout)
- Both sections scroll independently
- All existing file viewer features work
- Layout is responsive and doesn't break on smaller screens

---

#### Story 6.3: Session Metadata System

**As a** developer
**I want** session metadata stored alongside outputs
**So that** I can generate user-friendly session names and track session details

**Prerequisites:** Epic 5 complete (output directory structure exists)

**Acceptance Criteria:**
1. `manifest.json` file created in each session folder (e.g., `output/{uuid}/manifest.json`)
2. Manifest contains: `id`, `agentName`, `agentId`, `workflowName`, `timestamp`, `lastModified`, `userSummary`, `displayName`, `files[]`, `messageCount`, `status`
3. POST `/api/sessions` endpoint creates new session and generates manifest
4. GET `/api/sessions` endpoint returns all sessions with metadata
5. PATCH `/api/sessions/:id` endpoint updates session metadata (e.g., add files)
6. Display name generated using algorithm: "Oct 7, 2:30 PM - {first 40 chars of user message}"
7. Falls back to "{workflowName} - {timestamp}" if no user message
8. Falls back to "{agentName} - {timestamp}" if no workflow
9. Session creation returns `{ id, displayName, timestamp }`

**Technical Notes:**
- Use `crypto.randomUUID()` for session IDs
- Store manifest as JSON in `output/{uuid}/manifest.json`
- Naming algorithm in `lib/sessions/naming.ts`
- Metadata operations in `lib/sessions/metadata.ts`
- TypeScript interfaces in `types/session.ts`

**Definition of Done:**
- manifest.json created for every new session
- API endpoints work and return proper data
- Display names generated correctly with fallbacks
- Manifest format is well-documented
- Existing sessions without manifest handled gracefully

---

#### Story 6.4: Smart Session Display in File Viewer

**As a** user
**I want** to see friendly session names instead of UUIDs
**So that** I can quickly find the session I'm looking for

**Prerequisites:** Story 6.3 (session metadata system)

**Acceptance Criteria:**
1. Directory tree displays session `displayName` instead of UUID folder name
2. Sessions sorted by timestamp (newest first)
3. Hovering over session shows full UUID in tooltip
4. If manifest.json missing, fallback to showing UUID (don't crash)
5. Session list refreshes when new session created
6. Old sessions (pre-Epic 6) without manifest still appear with UUID names

**Technical Notes:**
- GET `/api/sessions` returns array of SessionMetadata
- Frontend maps UUID folder names to display names from manifest
- Sort sessions by `timestamp` field (descending)
- Cache session list with 1-minute TTL for performance
- Handle missing manifest gracefully (log warning, use UUID)

**Definition of Done:**
- Users see "Oct 7, 2:30 PM - Purchase 10 laptops..." instead of UUID
- Sessions sorted newest first
- Tooltip shows UUID on hover
- No crashes if manifest missing
- Performance is acceptable (no lag when loading session list)

---

#### Story 6.5: Context-Aware File Naming Validation

**As an** agent builder
**I want** agents to use descriptive file names
**So that** users can identify files without opening them

**Prerequisites:** Epic 4 complete (file operations exist)

**Acceptance Criteria:**
1. Backend validates filenames in `write_file()` tool call
2. Generic patterns rejected: `output.md`, `output-2.md`, `result.txt`, `file.txt`, `untitled.md`
3. Error message returned to agent: "Generic filename not allowed. Use descriptive name (e.g., 'procurement-request.md')"
4. System prompt updated with filename guidelines (examples of good/bad names)
5. Validation allows descriptive names: `procurement-request.md`, `budget-analysis-q3.csv`, `approval-checklist.md`
6. Path traversal prevention (no `../`, special chars)
7. Filename sanitization (kebab-case recommended but not enforced)

**Technical Notes:**
- Validation in `lib/files/operations.ts` -> `validateFilename()`
- Regex patterns for generic names: `/^output(-\d+)?\.md$/`, `/^result\./`, `/^file\d*\./`
- Agent guidance added to system prompt in `lib/openai/client.ts`
- Keep validation simple (don't be too strict, just block obviously generic names)

**Definition of Done:**
- Generic filenames rejected with helpful error
- Agents receive clear guidance in system prompt
- Descriptive filenames pass validation
- Path traversal attacks prevented
- Error messages guide agents to better naming

---

#### Story 6.6: File Reference Attachment UI (Drag & Drop)

**As a** user
**I want** to drag files from the viewer into the chat input
**So that** I can reference existing files as context for my next message

**Prerequisites:** Epic 5 complete (file viewer), Story 6.2 (file viewer layout)

**Acceptance Criteria:**
1. Files in directory tree are draggable (cursor changes to "move")
2. Chat input area accepts dropped files (shows blue highlight when hovering with file)
3. Dropped file appears as pill/chip in input area above text field
4. Pill shows filename and has remove button (× icon)
5. User can attach multiple files (up to 10)
6. Clicking × on pill removes attachment
7. Folders cannot be dragged (only files)
8. Keyboard alternative: Select file in tree, press Space, then "Attach to Chat" button appears
9. Screen reader announces "File attached: {filename}"
10. Drag-drop works with keyboard (Tab to file, Space to grab, Arrow keys to move, Space to drop)

**Technical Notes:**
- Install `react-dnd` library for drag-drop
- `DirectoryTree.tsx`: Implement `useDrag()` hook on file items (type: 'FILE_REFERENCE')
- `MessageInput.tsx`: Implement `useDrop()` hook for drop zone
- `FileAttachment.tsx`: New pill component (blue background, rounded, with × button)
- Drag item payload: `{ filepath: string, filename: string }`
- State: `const [attachments, setAttachments] = useState<FileReference[]>([])`

**Definition of Done:**
- Users can drag files from tree to chat input
- Pills appear in input area
- Remove button works on each pill
- Keyboard navigation fully functional
- Accessible (screen reader support)
- Cannot drag folders (validation)


---

#### Story 6.7: File Attachment Backend Processing

**As a** system
**I want** to read attached file contents and inject into conversation context
**So that** the agent can reference file contents in its response

**Prerequisites:** Story 6.6 (UI drag-drop)

**Acceptance Criteria:**
1. POST `/api/chat` endpoint accepts `attachments` array in request
2. Backend validates file paths (must be within `output/` directory)
3. Backend reads file contents for each attachment (max 1MB per file)
4. File contents injected into conversation as system message before user message
5. Format: "Files attached by user:\nFile: {filename}\n---\n{content}\n---"
6. Multiple attachments handled correctly (all files injected)
7. File not found error handled gracefully (return error to frontend)
8. File too large error (>1MB) returned to frontend
9. Path traversal attacks prevented (no `../../etc/passwd`)

**Technical Notes:**
- New endpoint: POST `/api/files/reference` to read file content
- Security: `path.resolve()` and check `startsWith(outputDir)`
- Size check: `fs.stat()` before reading, reject if >1MB
- Build messages array with system message containing file contents
- Error responses: 403 (forbidden path), 413 (too large), 404 (not found)

**Definition of Done:**
- Attached files' contents available to agent
- Agent can reference file content in responses
- Security validated (path traversal prevented)
- File size limits enforced
- Error handling works (file not found, too large, etc.)

---

#### Story 6.8: OpenAI Streaming Integration

**As a** user
**I want** to see agent responses appear token-by-token
**So that** I know the agent is working and can read partial results

**Prerequisites:** Epic 4 complete (OpenAI integration exists)

**Acceptance Criteria:**
1. Backend uses OpenAI streaming API (`stream: true`)
2. POST `/api/chat` returns Server-Sent Events (SSE) stream
3. Frontend receives tokens one-by-one and appends to message bubble
4. Streaming cursor (▋) appears at end of text while streaming
5. Tokens batch for 16ms (1 frame) before rendering (avoid layout thrashing)
6. Stop button cancels stream mid-response
7. Errors during streaming handled gracefully (connection lost, API error)
8. Stream completes with `[DONE]` event
9. Final message saved to conversation history
10. Perceived latency reduced compared to waiting for full response

**Technical Notes:**
- OpenAI SDK: `await openai.chat.completions.create({ stream: true })`
- Backend: Return `ReadableStream` with SSE format
- Frontend hook: `useStreamingChat()` manages stream state
- Decode stream: `TextDecoder()` + parse SSE format (`data: {...}\n\n`)
- React: Accumulate tokens in `streamingContent` state, render in `MessageBubble`
- Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`

**Definition of Done:**
- Responses stream token-by-token (visible to user)
- Streaming cursor animates during streaming
- Stop button cancels stream
- Errors handled without crashing
- Performance is smooth (60fps, no jank)
- Final message appears in history

---

#### Story 6.9: Dynamic Status Messages (Tool-Aware)

**As a** user
**I want** to see what the agent is actually doing
**So that** I understand the progress instead of just "thinking..."

**Prerequisites:** Story 6.8 (streaming integration)

**Acceptance Criteria:**
1. Status indicator shows tool-specific messages during execution
2. "Reading {filename}..." when agent calls `read_file()`
3. "Writing {filename}..." when agent calls `write_file()`
4. "Browsing files..." when agent calls `list_files()`
5. "Processing..." for other actions or when no tool call
6. Status updates in real-time as streaming occurs
7. Status clears when agent completes response
8. Status has animated pulsing dot indicator

**Technical Notes:**
- `lib/openai/status-mapper.ts`: Map tool calls to status messages
- Extract filename from tool arguments: `args.path.split('/').pop()`
- Emit status event via SSE: `data: {"type":"status","message":"Reading workflow.md..."}\n\n`
- Frontend: Display in `StatusIndicator` component
- CSS: Pulsing animation on status dot + text

**Definition of Done:**
- Status shows specific tool activity (not generic "thinking")
- Filename extracted from tool call and displayed
- Status updates in real-time during streaming
- Visual pulsing animation
- Accessible (screen reader announces status changes)

---

#### Story 6.10: Epic 6 Polish, Testing & Documentation

**As a** developer
**I want** Epic 6 features polished and well-tested
**So that** the UX improvements are production-ready

**Prerequisites:** Stories 6.1-6.9 complete

**Acceptance Criteria:**
1. Cross-browser testing (Chrome, Firefox, Safari, Edge) - all features work
2. Accessibility audit passed:
   - File viewer toggle keyboard accessible
   - Drag-drop has keyboard alternative
   - Status announcements work with screen reader
   - Focus management correct (no focus traps)
3. Performance testing:
   - 100 sessions load without lag
   - File viewer toggle is smooth (60fps)
   - Streaming maintains 60fps rendering
4. Documentation updated:
   - README mentions new features (streaming, file attachments, collapsible viewer)
   - User guide includes screenshots of file attachment flow
   - Developer docs explain session metadata format
5. Code quality:
   - No console errors or warnings
   - TypeScript strict mode passing
   - ESLint clean
   - Unused code removed

**Technical Notes:**
- Use Playwright for E2E tests (drag-drop, streaming, toggle)
- Lighthouse audit for accessibility score
- Chrome DevTools Performance tab for FPS profiling
- Test with large session counts (generate 100 dummy sessions)

**Definition of Done:**
- All browsers tested and working
- Accessibility checklist complete
- Performance targets met (60fps, <1s load times)
- Documentation updated
- Code quality high (no warnings, clean linting)

---



### Epic 9: Simplify Workflow Execution Architecture

**Epic Goal:** Refactor workflow execution system to LLM-orchestrated pattern, removing over-engineered tool abstractions

**Business Value:** Fixes agent behavior issues caused by over-engineered workflow execution. The current `execute_workflow` tool (640 lines) does too much "magic" without LLM awareness, creating cognitive overhead and reducing LLM agency. Refactor gives LLM full control through explicit file operations.

**Success Criteria:**
- LLM orchestrates all workflow steps explicitly
- Tool results are simple (no complex nested objects)
- Path resolver reduced to ~150 lines
- execute_workflow tool removed
- All workflows produce identical outputs

**Dependencies:** Epic 6 COMPLETE (workflow engine currently in use)

**Blocks:** Epic 7 (Docker) - clean up architecture before production deployment

**Estimated Stories:** 6 stories
**Estimated Effort:** 1-2 sprints

---

#### Story 9.1: Remove execute_workflow Tool

**As a** developer
**I want** to remove the execute_workflow tool from the codebase
**So that** LLM orchestrates workflow execution instead of hidden tool logic

**Prerequisites:** Epic 6 complete, all existing workflows documented

**Acceptance Criteria:**
1. `lib/tools/fileOperations.ts` - Remove `executeWorkflow` function (lines 289-516)
2. `lib/tools/toolDefinitions.ts` - Remove `executeWorkflowTool` export
3. `lib/agents/agenticLoop.ts` - Remove from tool definitions list
4. Only two file operation tools remain: `read_file`, `save_output`
5. All tests referencing execute_workflow removed or updated
6. Code compiles without errors after removal

**Technical Notes:**
- This is destructive - ensure Epic 6 is complete and working before starting
- Document current execute_workflow behavior for reference during migration
- Keep security validation logic (will be reused in simplified path resolver)

---

#### Story 9.2: Simplify Path Resolver

**As a** developer
**I want** to simplify the path resolver from 471 lines to ~150 lines
**So that** variable resolution is transparent and maintainable

**Prerequisites:** Story 9.1 (execute_workflow removed)

**Acceptance Criteria:**
1. **Keep** in `lib/pathResolver.ts`:
   - Basic path resolution for `{bundle-root}`, `{core-root}`, `{project-root}`
   - Security validation (stays within allowed directories)
   - Write path validation (restrict to /data/agent-outputs)
2. **Remove** from `lib/pathResolver.ts`:
   - `{config_source}:variable_name` resolution (LLM handles this by reading config.yaml)
   - `{date}` and `{user_name}` resolution (LLM generates these)
   - `{session_id}` resolution (LLM manages session IDs)
   - Multi-pass nested variable resolution
   - Config file auto-loading and parsing
   - Circular reference detection
3. Path resolver reduced to ~150 lines (68% reduction from 471 lines)
4. All path security tests pass
5. Unit tests updated for simplified resolver

**Technical Notes:**
- Follow refactor spec Section "Phase 3: Simplify Path Resolver"
- Document what was removed and why (LLM now handles these responsibilities)
- Security validation is critical - do not simplify security checks

---

#### Story 9.3: Update System Prompt with Workflow Orchestration Instructions

**As a** developer
**I want** to add workflow orchestration instructions to the system prompt
**So that** LLM knows how to load workflows, resolve variables, and manage sessions

**Prerequisites:** Story 9.2 (path resolver simplified)

**Acceptance Criteria:**
1. Add new section to `lib/agents/prompts/system-prompt.md`: "Running Workflows"
2. Section includes (~80 lines):
   - Step 1: Load Workflow Configuration (call read_file with workflow.yaml path)
   - Step 2: Load Referenced Files (instructions, template, config)
   - Step 3: Load Core Workflow Engine (read bmad/core/tasks/workflow.md)
   - Step 4: Execute Workflow Instructions (follow steps in exact order)
   - Step 5: Session and Output Management (generate UUID, create folders, save files)
   - Variable Resolution rules (bundle-root, project-root, core-root, date, config variables)
3. System prompt emphasizes: "You are in control. Read what you need, when you need it."
4. Examples provided for each step
5. System prompt tested with sample workflow to verify LLM follows instructions

**Technical Notes:**
- Follow refactor spec Section "Phase 2: Update System Prompt for Workflow Orchestration"
- Be explicit and detailed - LLM needs clear instructions
- Test with GPT-4 to ensure instructions are clear

---

#### Story 9.4: Update save_output Tool to Remove Session Folder Auto-Prepending

**As a** developer
**I want** to simplify save_output to accept full paths from LLM
**So that** LLM explicitly controls where files are saved

**Prerequisites:** Story 9.3 (system prompt updated)

**Acceptance Criteria:**
1. Remove session folder auto-prepending logic from `lib/tools/fileOperations.ts`
2. **OLD behavior**: `if (sessionFolder && relative path) { prepend sessionFolder }`
3. **NEW behavior**: LLM provides full paths, tool resolves variables and saves
4. Path security validation still enforced (must be within /data/agent-outputs)
5. Tool returns simple result: `{ success: true, path: resolvedPath }` or error
6. Unit tests updated for new behavior
7. Integration test: LLM calls save_output with full path, file saved correctly

**Technical Notes:**
- Follow refactor spec Section "Phase 4: Update save_output Tool"
- LLM must now provide paths like: `/data/agent-outputs/{session-id}/output.md`
- Security checks remain - only /data/agent-outputs is writable

---

#### Story 9.5: Update Workflow Instructions to Make Session Management Explicit

**As a** developer
**I want** to update all workflow instruction files to explicitly create sessions
**So that** session management is visible in workflow steps, not hidden in tooling

**Prerequisites:** Stories 9.1-9.4 complete (new architecture in place)

**Acceptance Criteria:**
1. Update Step 0 in all workflow instruction files (15 files total):
   - Alex workflows: 6 files
   - Casey workflows: 6 files
   - Pixel workflows: 3 files
2. New Step 0 format:
   ```markdown
   <step n="0" goal="Initialize session and load template">
   <action>Generate session ID using uuid v4 or timestamp format YYYY-MM-DD-HHMMSS</action>
   <action>Create session folder at {project-root}/data/agent-outputs/{session-id}/</action>
   <action>Read template file from {bundle-root}/templates/template-name.md</action>
   <action>Save template to {project-root}/data/agent-outputs/{session-id}/output.md</action>
   <action>Throughout this workflow, you will read output.md, modify it, and save it back</action>
   </step>
   ```
3. All 15 workflow files updated consistently
4. Test one workflow end-to-end to verify LLM follows new instructions
5. Document changes in workflow instruction migration guide

**Technical Notes:**
- Follow refactor spec Section "Phase 5: Update Workflow Instructions"
- This is the most time-consuming story (15 files)
- Use find/replace carefully - each workflow may have slight variations
- Test incrementally - update one workflow, test, then continue

---

#### Story 9.6: End-to-End Validation and Documentation

**As a** developer
**I want** to validate that all workflows produce identical outputs with new architecture
**So that** we confirm the refactor is successful and document the new patterns

**Prerequisites:** All Epic 9 stories 9.1-9.5 complete

**Acceptance Criteria:**
1. **Validation Testing**:
   - Run at least 3 different workflows (one from Alex, Casey, Pixel bundles)
   - Compare outputs to baseline from old architecture
   - Verify identical functionality (same files created, same content)
   - Verify session folders created correctly
   - Verify manifest.json generated
2. **Performance Testing**:
   - Measure workflow execution time (should be similar or faster)
   - Verify no performance regressions
3. **Documentation Updates**:
   - Update `docs/solution-architecture.md` with new architecture (remove execute_workflow, add LLM orchestration section)
   - Create `docs/WORKFLOW-MIGRATION-GUIDE.md` explaining old vs new pattern
   - Update `docs/tech-spec-epic-9.md` (if creating separate tech spec)
4. **Code Cleanup**:
   - Remove all dead code related to execute_workflow
   - Update comments referencing old architecture
   - ESLint clean, no warnings
5. **Success Metrics Validated**:
   - ✅ LLM orchestrates all workflow steps explicitly
   - ✅ Tool results are simple (no complex nested objects)
   - ✅ Path resolver reduced to ~150 lines
   - ✅ execute_workflow tool removed
   - ✅ All workflows produce identical outputs

**Technical Notes:**
- This is the validation story - thorough testing before moving to Epic 7
- Create baseline outputs from old architecture for comparison
- Document any differences discovered (should be none)
- If issues found, fix before marking Epic 9 complete

---

### Epic 7: Docker Deployment and Configuration

**Epic Goal:** Package platform for easy deployment via Docker with minimal configuration

**Business Value:** Enables distribution - agent builders can run the platform locally or on network

**Success Criteria:**
- Single docker-compose up starts entire application
- Volume mounts work correctly for bundles, core, and outputs
- Environment variable configuration is simple
- Clear documentation for deployment

**Dependencies:** Epics 1, 3, 4, 5 ALL 100% COMPLETE - you need a fully functional application before containerizing

**⚠️ Solo Developer Note:** Do NOT start Docker work until you have a working app you can test locally. Debugging Docker issues with a half-built app is extremely painful.

**Bundle Architecture Updates:**
- Volume mount for `bmad/custom/bundles` (read-only)
- Volume mount for `bmad/core` (read-only)
- Environment variables: BUNDLE_ROOT_PATH, CORE_ROOT_PATH, PROJECT_ROOT_PATH

**Estimated Stories:** 6

---

#### Story 7.1: Create Dockerfile for Next.js App

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

#### Story 7.2: Configure Volume Mounts

**As an** agent builder
**I want** to mount my bundle and core folders into the container
**So that** the platform can access agents and shared BMAD files

**Prerequisites:** Story 7.1 (Dockerfile)

**Acceptance Criteria:**
1. Bundle folder (`bmad/custom/bundles`) mounts as read-only volume
2. Core folder (`bmad/core`) mounts as read-only volume
3. Output folder mounts as read-write volume
4. Volume paths configurable via docker-compose
5. Mounted folders accessible from Next.js app
6. File changes in mounted volumes reflect immediately
7. Permissions set correctly for file operations
8. Example bundle structure documented

**Technical Notes:**
- Define volumes in docker-compose.yml:
  - `./bmad/custom/bundles:/app/bmad/custom/bundles:ro`
  - `./bmad/core:/app/bmad/core:ro`
  - `./output:/app/output:rw`
- Use bind mounts for development
- Document recommended folder structure per BUNDLE-SPEC
- Test on macOS, Linux, Windows (if possible)

---

#### Story 7.3: Environment Variable Configuration

**As a** deployer
**I want** to configure the app via environment variables
**So that** I don't have to modify code for deployment

**Prerequisites:** Story 7.1 (Dockerfile)

**Acceptance Criteria:**
1. OPENAI_API_KEY loaded from environment
2. BUNDLE_ROOT_PATH configurable (default: `/app/bmad/custom/bundles`)
3. CORE_ROOT_PATH configurable (default: `/app/bmad/core`)
4. PROJECT_ROOT_PATH configurable (default: `/app`)
5. OUTPUT_FOLDER_PATH configurable (default: `/app/output`)
6. Port number configurable (default 3000)
7. Environment variables documented in README
8. .env.example file provided as template
9. App validates required variables on startup

**Technical Notes:**
- Use Next.js environment variable support
- Create .env.example with placeholder values including new path variables
- Add startup validation for OPENAI_API_KEY and path variables
- Document which vars are required vs optional
- Ensure path variables match bundle architecture from Epic 4

---

#### Story 7.4: Create docker-compose.yml

**As a** deployer
**I want** a docker-compose file for easy deployment
**So that** I can start the app with one command

**Prerequisites:** Stories 7.1, 7.2, 7.3 (Docker configured)

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

#### Story 7.5: Deployment Documentation

**As a** new deployer
**I want** clear instructions for deploying the platform
**So that** I can get it running quickly

**Prerequisites:** All Epic 7 stories complete

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

#### Story 7.6: Basic Logging and Health Check

**As a** deployer
**I want** basic logging and health check
**So that** I can verify the app is running correctly

**Prerequisites:** Story 7.4 (docker-compose)

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

### Epic 8: Polish, Testing, and Documentation

**Epic Goal:** Ensure platform is production-ready with good UX and clear documentation

**Business Value:** Takes platform from "works" to "delightful to use" - critical for adoption

**Success Criteria:**
- UI/UX is polished and intuitive
- Error messages are helpful
- Cross-browser testing complete
- Documentation enables self-service setup

**Dependencies:** Epics 1-6 ALL COMPLETE - final polish phase after all features working

**⚠️ Solo Developer Note:** While some polish can happen during development, save the bulk of Epic 8 for the end. Polishing incomplete features wastes time. Exception: Story 8.5 (Agent Builder Guide) and Story 8.6 (End User Guide) can be drafted earlier as you learn the system.

**Estimated Stories:** 8

---

#### Story 8.1: UI/UX Polish Pass

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

#### Story 8.2: Error Message Improvements

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

#### Story 8.3: Cross-Browser Testing

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

#### Story 8.4: Performance Optimization

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

#### Story 8.5: Agent Builder Guide

**As an** agent builder
**I want** documentation on deploying BMAD agents with bundle structure
**So that** I can successfully deploy my agents to the platform

**Prerequisites:** Platform functional, Epic 4 complete

**Acceptance Criteria:**
1. Guide explains BMAD bundle structure (bundle.yaml, agents/, config.yaml)
2. Instructions for creating new agent bundles
3. Path variable usage examples ({bundle-root}, {core-root}, {project-root})
4. Critical actions patterns and configuration
5. Example bundled agent provided as reference
6. Troubleshooting section for common agent issues
7. Explanation of OpenAI compatibility considerations
8. Guide to testing agents before deployment
9. Tips for optimizing agents for OpenAI

**Technical Notes:**
- Create separate AGENT_BUILDER_GUIDE.md
- Include sample bundled agent with comments
- Document bundle.yaml format per BUNDLE-SPEC.md
- Document known differences between Claude Code and OpenAI
- Explain path variable resolution system
- Link from main README

---

#### Story 8.6: End User Guide

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

#### Story 8.7: Code Quality and Cleanup

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

#### Story 8.8: MVP Validation Test

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

**Total Stories:** 52 stories across 7 epics

**Epic Breakdown:**
- Epic 1: 6 stories (Backend Foundation & Infrastructure) ✅ COMPLETE
- Epic 2: 11 stories (OpenAI Integration with File Operations) ⚠️ DEPRECATED
- Epic 3: 9 stories (Chat Interface and Agent Selection) 🔄 PARTIALLY COMPLETE (6 complete, 3 blocked)
- Epic 4: 12 stories (Agent Execution Architecture & Bundle System) 🚧 IN PROGRESS (NEW)
- Epic 5: 7 stories (File Management and Viewer)
- Epic 6: 6 stories (Docker Deployment and Configuration)
- Epic 7: 8 stories (Polish, Testing, and Documentation)

**Development Sequence (Solo Developer - Revised Sequential):**
1. **Sprint 1:** Epic 1 (ALL stories 1.1-1.6) - Backend foundation ✅ COMPLETE
2. **Sprint 2-3:** Epic 4 (ALL stories 4.1-4.12) - Agent Execution Architecture 🚧 IN PROGRESS
3. **Sprint 4:** Epic 3 (Complete remaining stories 3.4, 3.9, 3.10) - Chat Interface completion
4. **Sprint 5:** Epic 5 (ALL stories 5.1-5.7) - File Viewer
5. **Sprint 6:** Epic 6 (ALL stories 6.1-6.6) - Docker Deployment
6. **Sprint 7:** Epic 7 (ALL stories 7.1-7.8) - Polish, Testing, Documentation

**Critical Path (Solo Developer):** Epic 1 ✅ → Epic 4 🚧 → Epic 3 (complete) → Epic 5 → Epic 6 → Epic 7

**⚠️ Solo Developer Critical Rules:**
1. **NO epic overlap** - Complete each epic 100% before starting the next
2. **NO parallel work** - Context switching between epics kills productivity
3. **Test thoroughly** at end of each epic before moving on - fixes are cheaper now than later
4. **Epic 4 gates Epic 3** - Cannot complete Epic 3 until correct agent execution architecture is in place
5. **Epic 4 gates ALL subsequent epics** - Correct architecture is foundation for everything else

**Key Insight:** Epic 4 architectural correction is critical - it replaces the deprecated Epic 2 implementation with the correct agentic execution loop and bundle structure. This is the foundation that enables all remaining work.

**Architectural Pivot (October 2025):** Epic 2 validation revealed execution pattern mismatch. Epic 4 implements correct architecture per AGENT-EXECUTION-SPEC.md and BUNDLE-SPEC.md, replacing Epic 2.

---

_This epic breakdown provides detailed implementation guidance while maintaining flexibility for discovery during development. Story estimates and sequencing can be adjusted based on actual implementation findings._
