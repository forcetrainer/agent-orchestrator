# Agent Orchestrator Product Requirements Document (PRD)

**Author:** Bryan
**Date:** 2025-10-02
**Project Level:** Level 3 (Full Product)
**Project Type:** Web application (Backend service + Frontend)
**Target Scale:** 12-40 stories, 2-5 epics

---

## Description, Context and Goals

**Agent Orchestrator** is a lightweight web platform that enables BMAD agent builders to validate OpenAI API compatibility and deploy agents to end users. The platform bridges the critical gap between agent development in Claude Code and production deployment for non-technical users.

**The Core Problem:**

Agent builders can create sophisticated BMAD agents in Claude Code, but these agents are trapped in the IDE with no way to:
- Test OpenAI API compatibility before deployment
- Make agents accessible to non-technical end users
- Validate that file-based agent patterns work with OpenAI function calling
- Share working agents for stakeholder feedback and real-world use

Existing agent orchestration platforms fail to address this need - they're either too expensive, too complex, or fundamentally don't understand BMAD's file-based architecture and lazy-loading instruction patterns.

**The Solution:**

Agent Orchestrator provides three core capabilities:

1. **OpenAI Compatibility Testing** - Validates that BMAD agents built in Claude Code function correctly with OpenAI's API and function calling patterns
2. **Simple Deployment** - Agent builders upload instruction files and agents become immediately functional (target: <1 hour for simple agents)
3. **End-User Interface** - Non-technical users interact with agents through a familiar ChatGPT-style chat interface

**What Makes This Unique:**

This is the first and only platform designed specifically for BMAD agents. It preserves BMAD's core philosophy of radical simplicity:
- No translation layer - agents use files, platform enables file operations via OpenAI function calling
- No complex configuration - upload files and the agent works
- No infrastructure burden - Docker deployment, file-based storage, no database
- Fills a genuine gap - immediate use cases waiting for this exact solution

**Target Users:**

**Primary:** Agent Builders (IT professionals - BAs, developers, engineers) who need to build complex guidance agents that exceed platform-level capabilities and deploy them to end users

**Secondary:** End Users (mix of technical and non-technical staff) who need expert-level assistance through familiar chat interfaces

### Deployment Intent

**MVP Phase (4-8 hours):** Docker-based deployment for local/network access to validate OpenAI API compatibility and enable immediate testing of ready-to-deploy BMAD agents.

**Production Phase:** Self-hosted platform accessible via Docker with potential evolution toward:
- Public platform for agent builders to deploy and share agents
- Agent marketplace and discovery features
- Multi-agent orchestration capabilities
- Integration with enterprise platforms (ServiceNow, Slack, Teams)

**Primary Goal:** Prove that BMAD agents can work with OpenAI API and be deployed to production use, establishing a reusable deployment pattern for the BMAD methodology.

### Context

**Current State:**

The BMAD methodology enables rapid development of sophisticated agents in Claude Code using a file-based architecture and lazy-loading instruction patterns. However, these agents exist only within the IDE, creating a critical deployment gap. Agent builders have ready-to-deploy use cases but face two blocking unknowns: (1) Will BMAD agents work with OpenAI's API? and (2) How can agents reach their intended audience of non-technical end users?

Platform-level agent builders (ServiceNow, Microsoft Copilot Studio) excel at accessing large datasets but struggle with complex instruction sets and human-in-the-loop guidance scenarios. IT professionals who can learn BMAD methodology have no viable path to build and deploy custom agents that handle complex, human-centered problems requiring extensive guidance and multi-step collaboration.

**Why Now:**

Multiple BMAD agents are production-ready but blocked by lack of a deployment platform. Without immediate validation of OpenAI compatibility, valuable agents remain untested and unused by their intended audience. The BMAD methodology cannot demonstrate its full potential beyond developer tooling, and the opportunity cost of inaction grows as ready-to-use agents sit idle instead of delivering value.

**Architectural Learning:**

During Epic 2 and Epic 3 implementation (completed October 2025), validation testing revealed that the initial OpenAI integration approach did not match BMAD agent execution patterns. Specifically:
- File loading via function calling was not properly blocking execution (agents continued without loaded files)
- BMAD path variables were not being resolved, preventing core file reuse
- Agent initialization did not execute critical-actions as required

This discovery led to creation of two architectural specifications:
- **AGENT-EXECUTION-SPEC.md** - Defines proper agentic execution loop with pause-load-continue pattern
- **BUNDLE-SPEC.md** - Defines standardized bundle structure for agent organization

Epic 4 was created to implement these specifications, replacing the deprecated Epic 2 implementation with the correct architecture. This represents normal agile learning: build, validate, correct. The MVP scope and goals remain unchanged - only the implementation approach was refined.

### Goals

**1. Validate OpenAI API Compatibility (Primary)**
- Successfully deploy at least 3 different BMAD agents via OpenAI API
- Document any required modifications and create reusable adaptation patterns
- Prove that lazy-loading instruction pattern is viable with OpenAI function calling
- **Success Metric:** 95%+ of BMAD agent features work correctly with OpenAI API

**2. Enable Rapid Agent Deployment**
- Agent builders can go from "agent complete" to "deployed and accessible" in <1 hour for simple agents
- Support iteration speed of <15 minutes for instruction updates and redeployment
- **Success Metric:** 80%+ deployment success rate on first attempt after OpenAI compatibility is proven

**3. Deliver Intuitive End-User Experience**
- Non-technical users can access and use agents without training
- Familiar ChatGPT-style interface reduces learning curve to near-zero
- **Success Metrics:** 85%+ response acceptability, 75%+ task completion rate, 60%+ return usage within 30 days

**4. Establish BMAD Production Viability**
- Demonstrate that BMAD methodology works beyond developer tooling
- Create reference implementation for BMAD deployment patterns
- Enable non-developer use cases through accessible chat interface
- **Success Metric:** 5+ agents deployed to production within first month of availability

**5. Build Foundation for Future Growth**
- Architecture supports evolution toward agent marketplace and multi-agent orchestration
- Maintain radical simplicity while enabling future enhancements
- **Success Metric:** Clean architecture enables Phase 2 features without major refactoring

## Requirements

### Functional Requirements

#### Agent Management

**FR-1: Agent Discovery and Selection**
- System automatically scans agents folder to discover all .md agent files (recursive)
- Dropdown/selector displays available agents for user selection
- No manual configuration required - folder contents define available agents
- Agent list updates when new agents are added to the folder

**FR-2: Agent Loading and Initialization**
- System implements agentic execution loop with function calling (pause-load-continue pattern)
- Selected agent's instruction files load via tool calls when agent requests them
- Support for BMAD's lazy-loading pattern - files loaded on-demand through function calling
- Execute agent critical-actions section during initialization
- Parse and process agent bundle.yaml manifest for metadata
- Preserve agent's native directory structure and file organization
- Handle agent metadata and configuration from agent definition files

#### Chat Interface

**FR-3: ChatGPT-Style Chat UI**
- Text input field with send button for user messages
- Chat history displays user messages and agent responses in conversation format
- Markdown rendering for agent responses (headings, lists, code blocks, links, etc.)
- Clear visual distinction between user and agent messages

**FR-4: Response Handling and Display**
- Loading indicators during agent processing (shows when agent is "thinking")
- Token-by-token streaming display of text responses (visual enhancement only - does not bypass agentic execution loop)
- Stop/cancel button to halt agent mid-execution
- Error messages displayed clearly when agent encounters issues
- Support for multi-paragraph and formatted agent responses

#### OpenAI Integration

**FR-5: OpenAI API with Function Calling**
- Integration with OpenAI API using agentic execution loop with function calling
- Execution pattern: LLM receives message → generates tool call → backend pauses execution → executes tool → injects result into conversation context → LLM continues with tool result
- Agentic loop continues until LLM returns final response without tool calls
- Support for multiple sequential function calls as agent works through tasks
- Tool execution blocks continuation until results are available (prevents premature continuation)
- Proper error handling for API failures and rate limits
- Safety limit on maximum iterations to prevent infinite loops

**FR-6: File Operation Tools**
- `read_file(path)` - Load instruction/workflow files on-demand as agent requests
- `write_file(path, content)` - Create output files preserving directory structure
- `list_files(directory)` - Browse available files and directories
- Auto-create parent directories as needed for file writes
- Restrict file operations to authorized paths (bundle folders and core for reads, output folder for writes)
- **Path Variable Resolution System:**
  - Resolve `{bundle-root}` to agent's bundle directory (`bmad/custom/bundles/{bundle-name}/`)
  - Resolve `{core-root}` to BMAD core directory (`bmad/core/`)
  - Resolve `{project-root}` to application root directory
  - Resolve `{config_source}:variable_name` references from bundle config.yaml
  - Support nested variable resolution in workflow configurations

#### File Management

**FR-7: File Writing with Directory Preservation**
- Support writing files to any path within output directory
- Automatically create parent directories if they don't exist
- Preserve agent's intended directory structure from instructions
- Handle multiple file writes during single agent interaction

**FR-8: File Viewer (Read-Only)**
- Simple file browser for output directory only
- Directory traversal to navigate multiple folders created by agents
- Human-readable session names derived from agent metadata (hides technical UUIDs)
- Internal metadata files (manifest.json) hidden from user view but used for navigation enhancement
- Display file contents in browser with basic formatting
- View-only interface - no editing, no downloads in MVP
- Restricted to agent output directory for security

#### Deployment and Configuration

**FR-9: Docker Deployment**
- Containerized application packaged as Docker image
- Volume mounts for agents folder (read-only) and output directory (read-write)
- Environment variable configuration for OpenAI API key
- Simple docker-compose setup for easy deployment

**FR-10: Environment Configuration**
- OpenAI API key configuration via environment variable
- Configurable paths for agents folder and output directory
- Port configuration for web server
- Minimal configuration required - sensible defaults for all settings

#### Session Management (Basic)

**FR-11: Single-Session Conversation**
- Maintain conversation context within active browser session
- Agent remembers previous messages in current conversation
- Context resets when user selects different agent
- No persistence across browser sessions in MVP

**FR-12: Conversation Reset**
- User can start new conversation with same agent (clears context)
- Clean slate for testing different scenarios with same agent
- Previous outputs remain in file viewer until manually cleaned

**FR-13: Agent Bundle Structure Support**
- System discovers agents by scanning `bmad/custom/bundles/*/bundle.yaml` manifest files
- Parse bundle.yaml to extract agent metadata (id, name, title, description, icon, entry_point)
- Support multi-agent bundles (multiple agents in single bundle sharing resources)
- Support standalone agent bundles (single agent per bundle)
- Filter agent display to only entry_point: true agents in bundle manifests
- Load bundle resources (workflows, templates, config) relative to bundle root
- Validate required bundle structure before loading (bundle.yaml, agents/, config.yaml)
- Handle bundle-scoped path variables in agent instructions and workflows

### Non-Functional Requirements

**NFR-1: Performance**
- Chat responses begin within 2 seconds of user sending message
- File operations complete quickly enough to avoid noticeable delays in agent responses
- File viewer loads and displays files within 1 second
- Agent selector updates within 500ms when agents folder changes

**NFR-2: Reliability**
- System gracefully handles OpenAI API failures with clear error messages
- File operation errors don't crash the application
- Agent errors/failures allow user to recover and continue or restart conversation
- Uptime appropriate for self-hosted local/network deployment (no SLA requirements for MVP)

**NFR-3: Scalability (MVP Baseline)**
- Support at least 5 concurrent users on standard developer hardware
- Handle agents with up to 50 instruction files without performance degradation
- File viewer can navigate directories with up to 100 files
- Note: Enterprise scalability deferred to post-MVP

**NFR-4: Security**
- File read operations restricted to agents folder only
- File write operations restricted to output directory only
- No path traversal attacks (e.g., `../../etc/passwd`)
- OpenAI API key stored securely as environment variable, never exposed to frontend
- No authentication required for MVP (assumes trusted local/network deployment)

**NFR-5: Usability**
- Zero learning curve for end users familiar with ChatGPT/Claude.ai
- Agent builder can deploy new agent without reading documentation (self-explanatory process)
- Clear error messages guide users when something goes wrong
- Interface works on desktop browsers (Chrome, Firefox, Safari, Edge) - mobile optimization deferred

**NFR-6: Maintainability**
- Codebase uses standard Next.js patterns and conventions
- Clear separation between frontend UI, backend API, and OpenAI integration
- Minimal dependencies - prefer built-in Next.js features over external libraries
- Code structure supports adding Phase 2 features without major refactoring

**NFR-7: Compatibility**
- Works with OpenAI API (gpt-4, gpt-4-turbo, future models with function calling)
- Runs on Docker on macOS, Linux, and Windows
- Browser support: Modern evergreen browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Node.js version aligned with Next.js requirements

**NFR-8: Observability**
- Console logging for key operations (agent loading, file operations, API calls)
- Error logging captures enough context to debug issues
- Clear visibility into agent processing status for end users
- Docker logs accessible for troubleshooting deployment issues

**NFR-9: Deployment Simplicity**
- Single `docker-compose up` command starts entire application
- Configuration via environment variables only
- No database setup or migration scripts
- Clear README with setup instructions in under 10 steps

**NFR-10: Cost Efficiency**
- Minimal hosting costs - runs on modest hardware
- Pay-per-use OpenAI API pricing model (no fixed costs)
- File-based storage eliminates database hosting costs
- Docker deployment eliminates need for managed hosting services

## User Journeys

### Journey 1: Agent Builder - First Deployment

**Persona:** Sarah, Business Analyst who learned BMAD methodology and built her first agent in Claude Code to guide users through a complex procurement approval process.

**Goal:** Deploy her agent to OpenAI so her team can test it before wider rollout.

**Journey:**

1. **Preparation**
   - Sarah has completed her agent in Claude Code with all instruction files and workflows
   - She bundles her agent files into a folder structure (agent definition + instructions + templates)
   - She has access to the Agent Orchestrator running on her local Docker instance

2. **Agent Upload**
   - Sarah copies her agent folder into the mounted `agents/` directory
   - She refreshes the Agent Orchestrator in her browser
   - The agent selector automatically detects her new "Procurement Advisor" agent

3. **Initial Testing**
   - Sarah selects "Procurement Advisor" from the dropdown
   - She types a test message: "I need to submit a procurement request for new laptops"
   - The agent loads its instructions and responds with the first guidance step
   - **Decision Point:** Does the agent response match expectations?
     - **Yes:** Sarah continues testing with different scenarios
     - **No:** Sarah reviews console logs, identifies issue in instructions, updates files, and retries

4. **Validation**
   - Sarah walks through complete procurement workflow with the agent
   - Agent successfully reads workflow files, writes output documents to output folder
   - Sarah checks file viewer to confirm all expected documents were created
   - She tests error scenarios (missing information, edge cases)

5. **Team Sharing**
   - Sarah confirms agent works correctly with OpenAI API
   - She shares the Docker instance URL with 3 team members for UAT
   - Team members access agent via browser without any setup
   - Sarah collects feedback and iterates on instructions

6. **Outcome**
   - Total time from agent completion to team testing: 45 minutes
   - Sarah has validated OpenAI compatibility and identified one instruction improvement
   - Agent is ready for wider deployment after incorporating feedback

---

### Journey 2: End User - Getting Guided Assistance

**Persona:** Marcus, Procurement Manager (non-technical) who needs to navigate a complex procurement approval process but isn't sure which forms to fill out or what approvals are needed.

**Goal:** Successfully submit a procurement request with proper documentation and approvals.

**Journey:**

1. **Discovery**
   - Marcus receives email from Sarah with Agent Orchestrator URL and instructions: "Use the Procurement Advisor agent to get help with your request"
   - He clicks the link and sees a familiar chat interface (similar to ChatGPT)

2. **Initiation**
   - Agent is already selected (Sarah configured default agent)
   - Agent greets Marcus and asks about his procurement need
   - Marcus types: "I need to purchase 10 new laptops for the marketing team, budget is $15,000"

3. **Guided Workflow**
   - Agent asks clarifying questions: purchase urgency, vendor preferences, existing quotes
   - Marcus provides information conversationally
   - Agent explains: "Based on your budget and quantity, you need Director approval plus IT Security review"
   - **Decision Point:** Marcus has questions
     - Agent patiently explains approval requirements and links to relevant policies
     - Marcus feels confident to proceed

4. **Document Generation**
   - Agent guides Marcus through required information for procurement form
   - Agent generates draft procurement request document
   - Marcus reviews document in file viewer, requests one change (budget justification wording)
   - Agent updates document based on feedback

5. **Completion**
   - Agent provides final checklist: "✓ Procurement form complete, ✓ Budget approved, → Next: Submit to Director for approval"
   - Agent tells Marcus where to find completed form and what to do next
   - Marcus downloads form from file viewer and submits via email

6. **Outcome**
   - Marcus completed complex procurement request in 20 minutes (would have taken 2+ hours previously)
   - He felt guided and confident throughout process
   - He bookmarks Agent Orchestrator for future procurement needs

---

### Journey 3: Agent Builder - Rapid Iteration After Feedback

**Persona:** Sarah (same as Journey 1), now iterating on her agent after UAT feedback.

**Goal:** Quickly improve agent instructions based on team feedback and redeploy for continued testing.

**Journey:**

1. **Feedback Collection**
   - Sarah reviews feedback from 3 team members who tested the agent
   - Common issue: Agent asks for vendor quotes too early, before explaining budget approval requirements
   - Marcus requested clearer explanation of approval thresholds

2. **Instruction Updates**
   - Sarah opens agent workflow file in her code editor
   - She reorders steps: budget approval guidance now comes before vendor quote request
   - She adds detailed approval threshold explanation (under $5K, $5K-25K, over $25K)
   - She saves changes to the agent files in the mounted agents folder
   - Total edit time: 8 minutes

3. **Immediate Redeployment**
   - Sarah returns to Agent Orchestrator in browser
   - She clicks "New Conversation" to reset context
   - Agent automatically loads updated instructions (no manual reload needed)
   - Sarah tests the updated flow: "I need to purchase software licenses for $8,000"

4. **Validation**
   - Agent now explains approval thresholds first, then asks about vendor quotes
   - The flow feels more logical and less overwhelming
   - **Decision Point:** Satisfied with changes?
     - **Yes:** Notify team that improvements are live
     - **No:** Make additional tweaks and repeat (takes another 10-15 minutes)

5. **Team Communication**
   - Sarah sends quick message: "Procurement Advisor updated based on your feedback - try it again!"
   - Team members simply refresh their browser and start new conversation
   - No deployment downtime, no version management complexity

6. **Outcome**
   - Time from receiving feedback to deploying fix: 12 minutes
   - Rapid iteration enables continuous improvement based on real user feedback
   - Team confidence in agent grows as it becomes more polished

## UX Design Principles

**1. Radical Familiarity**
- Interface should feel immediately familiar to anyone who has used ChatGPT or Claude.ai
- Zero learning curve for end users - if they can chat, they can use the platform
- No novel UI patterns that require explanation or training

**2. Invisible Complexity**
- Hide technical details (file operations, API calls, function calling) from end users
- Agent builders see what they need (console logs, error details) without overwhelming end users
- System feels simple even when performing complex file operations behind the scenes

**3. Progressive Disclosure**
- Show only what's needed at each step of the journey
- Agent selector and chat interface are primary - file viewer is secondary
- Advanced features (logs, debugging) available but not prominent

**4. Trust Through Transparency**
- Loading indicators show when agent is processing
- Clear error messages explain what went wrong and suggest recovery paths
- File viewer lets users verify agent outputs and build confidence

**5. Forgiving by Design**
- Easy to start new conversation if things go wrong
- Stop/cancel button prevents runaway agent behavior
- Errors don't lose user progress or corrupt agent state

**6. Speed as a Feature**
- Fast response times reduce friction and build confidence
- Instant agent selection and conversation reset
- No unnecessary loading states or artificial delays

**7. Consistent Mental Model**
- Agent = expert assistant in a specific domain
- Chat = natural conversation to get guidance
- File viewer = place to find outputs the agent created
- Simple, consistent metaphors throughout

**8. Builder Empowerment**
- Agent builders control their agent's behavior through files, not platform configuration
- Platform enables BMAD patterns without imposing constraints
- Quick iteration cycle empowers continuous improvement

**9. Mobile-Later, Desktop-First**
- Optimize for desktop browsers where agent builders and professional users work
- Responsive design principles but no mobile-specific features in MVP
- Accept that complex guidance workflows suit desktop contexts

**10. Self-Documenting Interface**
- UI elements clearly labeled with their purpose
- Error messages include actionable guidance
- No need for separate help documentation to use basic features

## Epics

### Epic 1: Backend Foundation & Infrastructure
**Goal:** Establish Next.js backend infrastructure to support OpenAI integration and frontend communication

**Scope:**
- Next.js project initialization with TypeScript
- API route structure for chat, agents, and files
- Environment configuration and validation
- Error handling middleware
- Health check endpoint
- Project structure and organization

**Value:** Provides the foundational server architecture that all other epics depend on - without this, we cannot build chat interface or integrate with OpenAI

**Estimated Stories:** 6 stories

---

### Epic 2: OpenAI Integration with File Operations (DEPRECATED)
**Goal:** Validate that BMAD agents work with OpenAI API through function calling for file operations

**Status:** DEPRECATED - Replaced by Epic 4

**Original Scope:**
- OpenAI API integration with function calling support
- File operation tools: read_file, write_file, list_files
- Lazy-loading pattern for instruction files
- Path security and access controls
- Agent loading and initialization
- Error handling for API and file operation failures

**Deprecation Reason:** Validation testing revealed that the implementation did not properly implement agentic execution loop (pause-load-continue pattern) required for BMAD agents. Path variable resolution and critical actions processing were also missing. Epic 4 implements the correct architecture per AGENT-EXECUTION-SPEC.md and BUNDLE-SPEC.md.

**Learning Preserved:** File operation security patterns, API error handling, and basic function calling concepts are reused in Epic 4.

**Estimated Stories:** 10 stories (learning complete)

---

### Epic 3: Chat Interface and Agent Selection
**Goal:** Enable end users to select and interact with BMAD agents through a familiar chat interface

**Status:** PARTIALLY COMPLETE

**Scope:**
- ChatGPT-style chat UI with message history ✅
- Agent discovery and selection mechanism (needs bundle-aware rework in Epic 4)
- Basic conversation management (new conversation, reset) ✅
- Markdown rendering for agent responses ✅
- Loading states and error handling ✅
- Message send functionality ✅

**Value:** Delivers the fundamental user experience - chat interface that feels familiar and enables agent interaction

**Completion Notes:** Stories 3.1-3.8 (UI infrastructure) are complete. Stories 3.4 (Agent Discovery), 3.9 (Lazy-loading Validation), and 3.10 (Agent Initialization) are blocked pending Epic 4 completion.

**Estimated Stories:** 9 stories (6 complete, 3 pending Epic 4)

---

### Epic 4: Agent Execution Architecture & Bundle System (NEW)
**Goal:** Implement correct agent execution architecture with agentic loop and bundle structure support

**Status:** IN PROGRESS

**Scope:**
- Agentic execution loop with pause-load-continue pattern
- Path variable resolution system ({bundle-root}, {core-root}, {project-root})
- Critical actions processor for agent initialization
- Bundle structure discovery and loading (bundle.yaml manifests)
- Refactor file operation tools for path variables
- Bundle-aware agent discovery
- System prompt builder with tool usage instructions
- End-to-end validation with bundled agents
- Test suite refactoring for new architecture
- Core BMAD files volume mount support
- Documentation updates

**Value:** Fixes fundamental execution pattern mismatch discovered during Epic 2/3 validation. Enables BMAD agents to function correctly with OpenAI API using the same patterns as Claude Code. Establishes sustainable agent organization through bundle structure.

**Success Criteria:**
- ✅ Agentic execution loop implements pause-load-continue pattern (matches Claude Code)
- ✅ File loading via function calling blocks execution until files are available
- ✅ Path variables ({bundle-root}, {core-root}, {project-root}) resolve correctly
- ✅ Critical actions execute during agent initialization
- ✅ Bundle structure discovered from manifests (bundle.yaml)
- ✅ Bundled agents load and execute successfully end-to-end
- ✅ All Epic 2/3 tests refactored and passing with new architecture

**Dependencies:**
- Replaces deprecated Epic 2 implementation
- Unblocks Epic 3 Stories 3.4, 3.9, 3.10
- Must complete before Epic 5-7 can proceed

**Estimated Stories:** 12 stories
**Estimated Effort:** 1.5-2 sprints

---

### Epic 5: File Management and Viewer
**Goal:** Enable users to view and verify agent-generated outputs

**Status:** COMPLETE

**Scope:**
- File viewer for output directory (read-only)
- Directory navigation and traversal
- File content display with formatting
- Markdown rendering in file viewer
- Directory structure preservation
- Navigation polish and refresh functionality

**Value:** Builds trust by letting users verify agent outputs and access generated documents

**Estimated Stories:** 7 stories

---

### Epic 6: Enhanced UX & Interactive Features
**Goal:** Improve usability and add real-time interactive capabilities based on user feedback

**Status:** PLANNED

**Scope:**

**UI/UX Refinements:**
- Dynamic file viewer with collapsible toggle (free up chat space)
- Layout redesign: Top/bottom split for file content (better readability)
- Smart session naming (timestamp + user summary instead of UUID-only)
- Context-aware file naming (descriptive names instead of "output.md")

**New Capabilities:**
- File reference attachments (drag files from viewer into chat as context)
- Streaming responses (token-by-token display like ChatGPT)
- Dynamic status messages (tool-aware: "Reading X...", "Writing Y...")

**Value:** Addresses real user feedback from Epics 1-5. File viewer was always visible (reduces chat space), sessions/files hard to distinguish, waiting for full responses feels slow, generic status messages don't communicate what's happening. These enhancements prepare foundation for production deployment.

**Architecture Highlights:**
- Server-Sent Events for streaming responses
- React DnD for accessible drag-drop
- Framer Motion for smooth animations
- Session metadata stored in manifest.json files
- No new services (enhances existing components)

**Estimated Stories:** 10 stories
**Estimated Effort:** 2-3 sprints

**Related Documentation:** `/docs/epic-6-architecture.md`

---

### Epic 7: Docker Deployment and Configuration
**Goal:** Package platform for easy deployment via Docker with minimal configuration

**Status:** PLANNED

**Scope:**
- Dockerfile for Next.js application
- docker-compose configuration
- Volume mounts for bundles, core, and output folders
- Environment variable configuration (including bundle and core paths)
- Deployment documentation
- Logging and health checks

**Value:** Enables distribution and deployment - agent builders can run the platform locally or on network

**Updates for Bundle Architecture:**
- Volume mount: `./bmad/custom/bundles:/app/bmad/custom/bundles:ro` (read-only)
- Volume mount: `./bmad/core:/app/bmad/core:ro` (read-only)
- Environment variables: BUNDLE_ROOT_PATH, CORE_ROOT_PATH, PROJECT_ROOT_PATH

**Estimated Stories:** 6 stories

---

### Epic 8: Polish, Testing, and Documentation
**Goal:** Ensure platform is production-ready with good UX and clear documentation

**Status:** PLANNED

**Scope:**
- UI/UX polish and refinement (beyond Epic 6 enhancements)
- Error message improvements
- Cross-browser testing
- Performance optimization
- User documentation (README, setup guide)
- Agent builder guide (how to deploy BMAD agents with bundle structure)
- Bundle structure documentation and examples
- Code quality and cleanup
- MVP validation testing

**Value:** Takes platform from "works" to "delightful to use" - critical for adoption and real-world usage

**Updates for Bundle Architecture:**
- Document bundle structure requirements (bundle.yaml, agents/, config.yaml)
- Provide bundle creation examples
- Explain path variable usage
- Include critical actions patterns

**Estimated Stories:** 8 stories

---

**Total Estimated Stories:** 62 stories across 8 epics

**Epic Summary:**
- Epic 1: Backend Foundation - 6 stories ✅ COMPLETE
- Epic 2: OpenAI Integration (DEPRECATED) - 10 stories (learning preserved)
- Epic 3: Chat Interface - 9 stories ✅ COMPLETE
- Epic 4: Agent Execution & Bundle System - 12 stories ✅ COMPLETE
- Epic 5: File Viewer - 7 stories ✅ COMPLETE
- Epic 6: Enhanced UX & Interactive Features - 10 stories (NEXT)
- Epic 7: Docker Deployment - 6 stories (PLANNED)
- Epic 8: Polish & Documentation - 8 stories (PLANNED)

**Timeline Impact:** Added Epic 6 (2-3 sprints) for UX improvements before Docker deployment

**Critical Architectural Note:** Epic 1 (Backend Foundation) must be completed first before any other epic can begin. This is the foundational infrastructure that enables both OpenAI integration and the chat interface.

**Solo Developer Execution Plan:**
- **Revised Sequential Order:** Epic 1 ✅ → Epic 4 ✅ → Epic 3 ✅ → Epic 5 ✅ → **Epic 6 (NEXT)** → Epic 7 → Epic 8
- **Complete each epic 100%** before moving to the next - no epic overlap
- **Epic 6 builds on Epic 5:** File viewer and chat interface foundation required
- **Epic 6 before Docker (Epic 7):** UX improvements make platform production-ready
- **Test thoroughly** at the end of each epic before proceeding
- **Epic 2 Deprecated:** Learning from Epic 2 informs Epic 4 implementation

_Note: Detailed story breakdown with acceptance criteria available in epics.md_

## Out of Scope

The following features are explicitly deferred to post-MVP phases:

### Phase 2 Features (Enhanced UX)
- Session persistence across browser sessions (pause/resume conversations)
- ~~Streaming responses (token-by-token display)~~ **→ MOVED TO EPIC 6**
- Syntax highlighting for code in chat and file viewer
- File download capability (currently view-only)
- File versioning and history
- Search/filter capabilities for output files
- Real-time file update notifications
- ~~File attachments for context~~ **→ MOVED TO EPIC 6** (file reference attachments)

### Phase 3 Features (Multi-Agent & Marketplace)
- Multiple simultaneous agent conversations (Slack-style channels)
- Agent marketplace and discovery features
- Rating and review system for agents
- Community-contributed agents
- Agent templates and starter kits
- Agent-to-agent communication and orchestration
- Visual workflow builder for chaining agents

### Phase 4 Features (Platform Expansion)
- Multi-LLM provider support (Claude API, local models, etc.)
- Authentication and user management
- Team collaboration features
- Usage tracking and analytics
- Enterprise deployment options (SSO, RBAC, etc.)
- Integration with enterprise platforms (ServiceNow, Slack, Teams)

### Not Planned
- Agent editing interface (agents are edited in IDE, deployed to platform)
- Visual agent builder (BMAD agents are file-based by design)
- Database-backed storage (file-based architecture is intentional)
- Mobile apps (desktop-first approach)
- Real-time collaboration on agent conversations
- Agent monetization/payment features

---

## Next Steps

### Immediate Actions

**1. Architecture Phase (REQUIRED)**
- Run architecture workflow with this PRD and epics.md as inputs
- Define system architecture, API design, and component structure
- Make key technical decisions (Next.js routing, state management, file system design)
- Output: architecture.md

**2. UX Specification (HIGHLY RECOMMENDED)**
- Create detailed UX specification for chat interface and file viewer
- Define information architecture and component hierarchy
- Design user flows and interaction patterns
- Optional: Generate AI Frontend Prompt for rapid prototyping
- Output: ux-specification.md

### Subsequent Planning

**3. Detailed User Stories**
- Generate comprehensive user stories from epics with full acceptance criteria
- Prioritize stories for MVP vs. post-MVP phases
- Define story dependencies and sequencing
- Output: user-stories.md

**4. Technical Design**
- Database schema (minimal - configuration only)
- API specifications for frontend-backend communication
- OpenAI function calling interface definitions
- File system security and access control design

**5. Testing Strategy**
- Unit test approach for file operations and OpenAI integration
- Integration test plan for end-to-end agent workflows
- UAT criteria based on success metrics in Goals section

### Development Preparation

**6. Development Environment Setup**
- Initialize Next.js project with TypeScript
- Set up Docker development environment
- Configure OpenAI SDK and test API access
- Create repository structure

**7. Sprint Planning**
- Epic 2 (OpenAI Integration) should be prioritized early to validate core hypothesis
- Epic 1 (Chat Interface) can run in parallel with basic OpenAI integration
- Epic 3 (File Viewer) follows once file operations are working
- Epic 4 (Docker) near end of development cycle
- Epic 5 (Polish) continuous throughout + final push

**8. Success Metrics Setup**
- Define how to measure the 5 goals from PRD
- Plan for collecting OpenAI compatibility data
- Set up basic logging for deployment success tracking

## Document Status

- [ ] Goals and context validated with stakeholders
- [ ] All functional requirements reviewed
- [ ] User journeys cover all major personas
- [ ] Epic structure approved for phased delivery
- [ ] Ready for architecture phase

_Note: See technical-decisions.md for captured technical context_

---

_This PRD adapts to project level Level 3 - providing appropriate detail without overburden._
