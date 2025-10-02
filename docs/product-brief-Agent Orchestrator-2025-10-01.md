# Product Brief: Agent Orchestrator

**Date:** 2025-10-01
**Author:** Bryan
**Status:** Draft for PM Review

---

## Executive Summary

**Agent Orchestrator** is a lightweight web platform that enables BMAD agent builders to test OpenAI API compatibility and deploy agents to end users. Built with Next.js and designed around BMAD's file-based architecture, it bridges the gap between agent development in Claude Code and production deployment for non-technical users.

**The Problem:** Agent builders can create sophisticated BMAD agents in Claude Code, but these agents are trapped in the IDE with no way to test OpenAI compatibility or deploy to end users. Platform-level agents (ServiceNow, Copilot Studio) can't handle complex instruction sets or human-in-the-loop guidance scenarios. Multiple ready-to-deploy use cases are blocked by lack of a simple deployment platform.

**The Solution:** A ChatGPT-style web interface where agent builders upload BMAD agent files and immediately make them functional via OpenAI API. The platform uses function calling to replicate Claude Code's file operations, preserves BMAD's lazy-loading pattern, and provides end users with a familiar chat experience. Docker deployment enables local/network access without enterprise complexity.

**Target Market:**
- **Primary:** IT professionals (BAs, developers, engineers) building complex guidance agents that exceed platform-level capabilities
- **Secondary:** Non-technical end users who need expert-level assistance through familiar chat interfaces

**Key Value Proposition:** The first and only platform designed specifically for BMAD agents - validating OpenAI compatibility, enabling rapid deployment (under 1 hour for simple agents), and preserving BMAD's radical simplicity without databases, authentication, or complex configuration.

---

## Problem Statement

Agent builders can create sophisticated BMAD agents using Claude Code, but these agents are trapped in the IDE. There is currently **no platform to test agents with OpenAI or deploy them for end users** - the intended audience of non-technical users who will never touch a CLI or IDE.

**Current State Pain Points:**

- **Technical Validation Gap:** No way to test whether BMAD agents built in Claude Code will work properly with OpenAI's API - the builder has no idea if their agents will function correctly until they have a testing platform
- **Deployment Gap:** Builders have ready-to-deploy use cases but no way to make agents accessible to end users
- **API Compatibility Unknown:** Agents designed in Claude Code may behave differently with OpenAI's function calling and instruction following - this needs immediate validation
- **Collaboration Barrier:** Cannot share working agents with stakeholders, clients, or end users for feedback and validation
- **Platform Lock-in:** Agents only work in Claude Code CLI, limiting their utility to developers only

**Why Existing Solutions Fall Short:**

Existing agent orchestration platforms either:
1. **High Cost:** Enterprise platforms with expensive per-seat or per-conversation pricing models
2. **High Complexity:** Require extensive configuration, infrastructure setup, or custom development that undermines the simplicity and elegance of BMAD's file-based agent design
3. **No BMAD Support:** Don't understand BMAD's file-based architecture and lazy-loading instruction pattern

**Urgency:**

Multiple use cases are **ready for immediate deployment** but blocked by two critical unknowns:
1. **Technical:** Do BMAD agents work with OpenAI API? (needs immediate validation)
2. **Deployment:** How to make agents accessible to non-technical end users?

Without this tool, valuable agents remain untested and unused by their intended audience, and the BMAD methodology cannot demonstrate its full potential beyond developer tooling.

---

## Proposed Solution

**Core Approach:**

Agent Orchestrator is a lightweight, web-based platform that bridges the gap between BMAD agent development in Claude Code and real-world deployment with OpenAI. It enables agent builders to validate OpenAI API compatibility and deploy agents to end users through a simple, familiar chat interface.

**The Solution:**

A Next.js web application with three core capabilities:

1. **OpenAI Compatibility Testing:** Validates that BMAD agents built in Claude Code work properly with OpenAI's API and function calling patterns
2. **Simple Deployment:** Agent builders bundle instruction files and upload to the orchestrator - agents become immediately functional
3. **End-User Interface:** Non-technical users interact with agents through a familiar ChatGPT-style chat interface

**What Makes This Different:**

This is the **first and only platform** designed specifically for BMAD agents. There is no existing solution that:
- Understands BMAD's file-based architecture and lazy-loading instruction pattern
- Provides a simple upload-and-deploy workflow for agent builders
- Bridges Claude Code development to OpenAI deployment
- Offers lightweight, low-cost agent hosting without enterprise complexity

**Why This Will Succeed:**

The solution preserves BMAD's core philosophy of radical simplicity:
- **No translation layer:** BMAD agents use files; the platform simply enables file operations via OpenAI function calling
- **No complex configuration:** Upload files → agent works
- **No infrastructure burden:** Docker deployment, file-based storage, no database overhead
- **Fills a genuine gap:** Agent builders have immediate use cases waiting for this exact solution

**Ideal User Experience:**

**For Agent Builders:**
1. Build agent in Claude Code with BMAD methodology
2. Bundle instruction files, workflows, and templates
3. Upload to Agent Orchestrator
4. Agent is immediately testable with OpenAI API
5. Share agent URL with end users for production use

**For End Users:**
- Visit agent URL
- Interact through familiar chat interface (ChatGPT/Claude.ai style)
- Agent follows instructions, reads/writes files as designed
- Simple, intuitive - no technical knowledge required

---

## Target Users

### Primary User Segment: Agent Builders

**Profile:**
- IT team members including Business Analysts, Developers, and Engineers
- Technical skill level: Comfortable with IDEs, can use/learn Claude Code or Cursor
- Work in organizations where platform-level agents (ServiceNow, Microsoft Copilot Studio) exist but fall short for complex use cases
- Capable of being trained on BMAD methodology and file-based agent design

**Current State:**
- Limited to platform-level agent builders (ServiceNow, Copilot Studio) which excel at accessing large datasets but struggle with:
  - Complex, extensive instruction sets
  - Problems requiring significant human guidance and input
  - Multi-step collaborative workflows
- No viable way to build agents from scratch that handle complex, human-centered problems
- Cannot deploy custom agents to end users outside of platform constraints

**Primary Pain Points:**
- **Limited Agent Complexity:** Platform agents can't handle sophisticated instructions or multi-step guidance
- **Human-in-the-Loop Gap:** Existing tools optimize for automation at scale, not collaborative problem-solving with humans
- **Deployment Restrictions:** Even when they build something valuable, no way to make it generally available to end users
- **Creative Constraints:** Forced to work within platform limitations rather than designing agents for the actual problem

**Goals:**
- Build agents that guide humans through complex, nuanced problems (not just automated workflows)
- Test agent behavior with OpenAI API to validate compatibility
- Deploy agents to end users quickly and simply
- Create specialized agents with extensive instruction sets that existing platforms can't support
- Make agents generally available without platform lock-in or enterprise complexity

**Success Metrics:**
- Can build and deploy a complex agent in hours/days (not weeks/months)
- Agents work reliably with OpenAI API
- End users can access agents without IT involvement
- Can iterate on agent instructions and redeploy quickly

---

### Secondary User Segment: End Users

**Profile:**
- Mix of IT and non-IT personnel
- Range from technical users to completely non-technical staff
- Need guidance through complex problems or processes
- Comfortable with chat interfaces (ChatGPT, Claude.ai, Slack)

**Current State:**
- Either use clunky platform-level agents with limited capabilities
- Or lack access to AI assistance for their complex problems entirely
- May be frustrated with one-size-fits-all automation that doesn't address their specific needs

**Primary Pain Points:**
- Complex problems require human judgment but lack accessible guidance tools
- Existing platform agents too rigid or simplistic for nuanced situations
- Need expert-level assistance but experts aren't always available

**Goals:**
- Get guidance through complex problems when they need it
- Use familiar, intuitive chat interface
- Receive contextual, step-by-step assistance tailored to their specific situation
- Avoid learning new systems or technical tools

**Success Metrics:**
- Can access and use agents without training
- Successfully complete complex tasks with agent guidance
- Prefer agent assistance over other available options
- Return to use agents repeatedly for recurring needs

---

## Goals and Success Metrics

### Business Objectives

**Primary Objective: OpenAI API Compatibility Validation**
- Prove that BMAD agents built in Claude Code can function with OpenAI's API
- Determine what modifications (if any) are needed for OpenAI compatibility
- Establish patterns and best practices for adapting agents from Claude Code to OpenAI deployment
- Validate that OpenAI function calling can support BMAD's file operation patterns
- **Success Criteria:**
  - Successfully deploy at least 3 different BMAD agents via OpenAI API
  - Document any required modifications and create reusable adaptation patterns
  - Prove that the lazy-loading instruction pattern is viable with OpenAI

**Secondary Objective: Rapid Agent Development and Deployment**
- Prove that complex agents can be built quickly and made available to end users with minimal effort
- Demonstrate the viability of BMAD methodology for production agent deployment
- **Success Criteria:** Agent builders can go from "agent complete" to "deployed and accessible to end users" in under 1 hour for simple agents

### User Success Metrics

**Agent Builders:**
- **Build-to-Deploy Time:** Time from completing agent in Claude Code to having it live and accessible to end users
  - Target: <1 hour for simple agents, <4 hours for complex agents
- **Iteration Speed:** Time to modify agent instructions and redeploy
  - Target: <15 minutes for instruction updates
- **Deployment Success Rate:** Percentage of agents that work correctly on first deployment
  - Target: >80% success rate after OpenAI compatibility is proven

**End Users:**
- **Response Acceptability:** Percentage of agent responses that match user intent and are usable for next steps
  - Target: >85% of responses rated as acceptable/useful
- **Task Completion Rate:** Percentage of users who successfully complete their intended task with agent assistance
  - Target: >75% completion rate
- **Return Usage:** Percentage of users who return to use the agent again
  - Target: >60% return within 30 days

### Key Performance Indicators (KPIs)

1. **OpenAI Compatibility Rate:** Percentage of BMAD agent features that work correctly with OpenAI API (Target: 95%+)

2. **Time-to-Deploy:** Average time from agent completion to live deployment (Target: <1 hour for simple agents)

3. **Agent Update Cycle Time:** Average time to modify and redeploy an agent (Target: <15 minutes)

4. **End User Response Quality:** Percentage of agent responses rated as acceptable/usable (Target: >85%)

5. **Platform Adoption:** Number of agents deployed to production by agent builders (Target: 5+ agents within first month of availability)

---

## Strategic Alignment and Financial Impact

### Financial Impact

This is a personal project with no formal budget constraints or ROI requirements. Development will proceed regardless of financial projections.

**Investment:**
- Personal time investment: Estimated 4-8 hours for MVP development (based on incremental build plan)
- Hosting costs: Minimal (Docker deployment, file-based storage, pay-per-use OpenAI API)
- No revenue targets or cost-savings requirements

### Company Objectives Alignment

**N/A** - Personal project without organizational alignment requirements

### Strategic Initiatives

**Personal Strategic Goals:**

1. **Validate BMAD Methodology:** Prove that BMAD agents can work with OpenAI API and be deployed to production
2. **Unlock Immediate Use Cases:** Enable ready-to-deploy agents to reach their intended end users
3. **Establish Deployment Pattern:** Create reusable approach for making BMAD agents generally available
4. **Foundation for Future Growth:** Build simple now, with architecture (Next.js) that enables future enhancements (marketplace, multi-agent, orchestration)

**Opportunity Cost of NOT Building This:**

- BMAD agents remain trapped in IDE, unable to reach end users
- No way to validate OpenAI compatibility - uncertainty blocks deployment
- Ready-to-use agents sit idle instead of delivering value
- BMAD methodology cannot demonstrate production viability beyond developer tooling

---

## MVP Scope

### Core Features (Must Have)

1. **Chat Interface**
   - ChatGPT-style chat UI for agent interaction
   - Markdown rendering for agent responses
   - Input field with send button
   - Loading indicators during agent processing
   - Stop/cancel button to halt agent mid-execution

2. **Agent Selection**
   - Dropdown/selector to choose from available agents
   - Auto-scan agents folder to discover all .md agent files
   - Load selected agent's instruction files into system

3. **OpenAI API Integration**
   - OpenAI API with function calling support
   - File operation tools: `read_file(path)`, `write_file(path, content)`, `list_files(directory)`
   - Lazy-loading pattern: load instruction/workflow files on-demand as agent requests them

4. **File Operations**
   - File writing with preserved directory structure from agent instructions
   - Auto-create parent directories as needed
   - Support for agent's native file patterns

5. **File Viewer**
   - Simple file browser for output directory only (read-only, no downloads)
   - Directory traversal to navigate multiple folders created by agents
   - Display file contents in browser
   - Restricted to agent output directory for security

6. **Docker Deployment**
   - Containerized application for easy local/network deployment
   - Volume mounts for agents folder and output directory
   - Environment variable configuration for OpenAI API key

### Out of Scope for MVP

**Deferred to v2:**
- Session persistence (pause/resume conversations)
- Streaming responses (token-by-token display)
- Syntax highlighting for code in chat or file viewer
- Real-time file update notifications
- **Robust file management UI:** Using directory structure as visual hierarchy instead of CLI-style tree view
- File download capability (currently view-only)
- File versioning and history
- Search/filter output files
- Multiple simultaneous agent conversations (Slack-style channels)
- Agent marketplace and discovery
- Agent orchestration/linking (agent-to-agent communication)

### MVP Success Criteria

The MVP is ready to use when:
- ✅ Agent builder can upload/configure agent files and have them immediately functional
- ✅ End users can interact with agents through familiar chat interface with proper markdown formatting
- ✅ OpenAI function calling successfully executes file operations (read, write, list)
- ✅ Generated files are viewable through directory-browsable file viewer
- ✅ At least one complete BMAD agent works end-to-end via OpenAI API
- ✅ Platform is deployable via Docker for local or network access

---

## Post-MVP Vision

### Phase 2 Features

**Enhanced User Experience:**
- Session persistence (pause/resume conversations across browser sessions)
- Streaming responses (token-by-token display for better perceived performance)
- Syntax highlighting for code in chat and file viewer
- File download capability (currently view-only)

**Improved File Management:**
- Enhanced file management UI using directory structure as visual hierarchy (moving away from CLI-style tree view)
- File versioning and history
- Search and filter capabilities for output files
- Real-time file update notifications

**Performance & Polish:**
- Optimized agent loading and context management
- Better error handling and user feedback
- Mobile-responsive design improvements

### Long-term Vision (1-2 Years)

**Agent Marketplace:**
- Curated library of BMAD agents across multiple domains
- Agent discovery and search functionality
- Rating and review system
- Community-contributed agents
- Agent templates and starter kits

**Multi-Agent Orchestration:**
- Slack-style interface with channels for different agents
- Simultaneous conversations with multiple agents
- Agent-to-agent communication and collaboration
- Visual workflow builder for chaining agents together
- Cross-agent context sharing

**Platform Expansion:**
- Multi-LLM provider support (beyond OpenAI: Claude API, local models, etc.)
- Authentication and user management
- Team collaboration features
- Usage tracking and analytics
- Enterprise deployment options

### Expansion Opportunities

**From Personal Project to Platform:**
- Open source community development
- Public platform for agent builders to deploy and share agents
- Agent-as-a-Service business model
- Integration with existing enterprise platforms (ServiceNow, Slack, Teams)

**BMAD Ecosystem Growth:**
- Demonstrate production viability of BMAD methodology
- Create reference implementation for BMAD deployment patterns
- Enable non-developer agent creation through visual builders
- Establish best practices for OpenAI-compatible BMAD agents

---

## Technical Considerations

### Platform Requirements

- **Platform:** Web-based application
- **Deployment:** Docker for local/network access
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge)
- **Performance:** Fast response times, lightweight resource usage
- **Accessibility:** Standard web accessibility best practices

### Technology Preferences

- **Frontend Framework:** Next.js
- **Backend:** Node.js (integrated with Next.js)
- **LLM Integration:** OpenAI API with function calling
- **Storage:** File-based system (no database required)
- **Infrastructure:** Docker containerization
- **Deployment Model:** Self-hosted via Docker with volume mounts

### Architecture Considerations

**Core Design Principles:**
- **Radical Simplicity:** No database, no authentication (MVP), flat file structure
- **Self-Maintaining:** Auto-scan agents folder to discover available agents (no manual configuration)
- **Lazy Loading:** Only load instruction/workflow files when agent requests them (minimize context)
- **Trust the Files:** Files are the data model - platform enables BMAD's native file-based pattern

**Key Architectural Decisions:**

1. **Agent Discovery:**
   - Auto-scan agents folder for all .md agent files (recursive)
   - No configuration files needed - folder contents define available agents

2. **File Operations via OpenAI Function Calling:**
   - `read_file(path)` - Load instruction/workflow files on-demand
   - `write_file(path, content)` - Create output files with preserved directory structure
   - `list_files(directory)` - Browse available files and directories

3. **Directory Structure:**
   - Preserve agent's native directory structure for outputs
   - Auto-create parent directories as needed
   - Volume mounts for agents folder and output directory

4. **Starting Point:**
   - Repurpose existing Next.js + OpenAI chatbot template
   - Modify for BMAD-specific file operations and agent selection

---

## Constraints and Assumptions

### Constraints

**Timeline:**
- Personal project with flexible timeline
- Target: 4-8 hour MVP build based on incremental approach
- No hard deadlines, but preference for rapid iteration

**Resources:**
- Solo development effort
- Personal time investment
- No team dependencies

**Technical:**
- Must work with OpenAI API (primary validation target)
- Docker deployment required for accessibility
- File-based architecture (no database infrastructure)

**Budget:**
- Minimal hosting costs (acceptable)
- Pay-per-use OpenAI API pricing model
- No formal budget constraints

### Key Assumptions

**About User Behavior:**
- Agent builders are comfortable with IDEs and can learn BMAD methodology with minimal training
- End users will find chat interface intuitive based on familiarity with ChatGPT/Claude.ai
- Users don't need authentication or multi-tenancy for MVP (local/network deployment model)
- Agent builders will accept some iteration to adapt agents from Claude Code to OpenAI compatibility

**About the Market:**
- No existing BMAD-specific deployment platform exists (first mover advantage)
- Real demand exists for human-in-the-loop guidance agents (not just automation)
- Platform-level agents (ServiceNow, Copilot Studio) have proven limitations for complex use cases
- OpenAI API pricing is acceptable for target use cases

**About Technical Feasibility:**
- OpenAI function calling can replicate Claude Code's file operation patterns (PRIMARY ASSUMPTION - needs validation)
- BMAD's lazy-loading instruction pattern will work with OpenAI API
- Suitable Next.js + OpenAI chatbot templates exist and are adaptable
- Docker deployment will be straightforward with volume mounts
- Markdown rendering libraries for Next.js are mature and reliable

**Assumptions Requiring Validation:**
1. **OpenAI compatibility with BMAD agents** - This is the critical unknown driving MVP development
2. **Agent adaptation effort** - Unknown how much modification is needed to make agents OpenAI-compatible
3. **Performance at scale** - File-based architecture may need optimization for complex agents with many files

---

## Risks and Open Questions

### Key Risks

**HIGH RISK:**
- **OpenAI Compatibility Risk:** BMAD agents might not work with OpenAI API as expected, requiring significant rework or fundamentally different approach
  - *Impact:* Could invalidate core MVP approach
  - *Mitigation:* MVP is designed specifically to validate this risk early

**MEDIUM RISK:**
- **Adaptation Complexity:** Converting agents from Claude Code to OpenAI might be more complex than anticipated
  - *Impact:* Longer development time, more manual work per agent
  - *Mitigation:* Document patterns, create reusable adaptation guidelines

- **Context Window Limitations:** Complex agents with many files might exceed OpenAI context limits
  - *Impact:* Some agents may not be deployable without significant modification
  - *Mitigation:* Lazy loading helps, but may need additional optimization strategies

**LOW RISK:**
- **Performance:** File operations might be too slow for good user experience
  - *Impact:* Sluggish agent responses
  - *Mitigation:* File-based architecture is inherently simple; can optimize if needed

### Open Questions

**Technical Unknowns:**
1. How much modification will BMAD agents need to work with OpenAI?
2. Will OpenAI's function calling be reliable enough for production use?
3. What patterns emerge for successful BMAD-to-OpenAI adaptation?
4. How should error handling work when agents fail or get stuck?
5. What's the practical context window limit for complex multi-file agents?

**Implementation Questions:**
1. Which Next.js + OpenAI chatbot template is the best starting point?
2. How to handle agent state during long conversations?
3. What security measures are needed for file operations (beyond restricting to output directory)?
4. How to communicate OpenAI processing status to users (it may be slower than Claude)?

**User Experience Questions:**
1. How do we communicate when agents need modification for OpenAI compatibility?
2. What's the right level of technical detail to show end users during agent execution?
3. How do users recover from agent errors or unexpected behavior?

### Areas Needing Further Research

**Pre-Development Research:**
- Survey available Next.js + OpenAI chatbot templates and starters
- Review OpenAI function calling documentation, best practices, and known limitations
- Evaluate markdown rendering libraries for Next.js (react-markdown, etc.)
- Research Docker deployment patterns for Next.js applications

**During Development Research:**
- Document OpenAI compatibility patterns as they're discovered
- Track which BMAD agent features work/don't work with OpenAI
- Identify common adaptation patterns for reuse
- Test context window limits with real BMAD agents

---

## Appendices

### A. Research Summary

**Brainstorming Session Insights:**
- Applied First Principles Thinking, Resource Constraints, and SCAMPER methods
- Identified core architecture: Next.js frontend, OpenAI API with function calling, file-based storage, Docker deployment
- Established incremental build sequence: 1-hour POC → agent selector → file writing → file viewer (4-8 hours total)
- Key themes: Radical simplicity, foundation for growth, trust the files, lazy loading

**Technical Research Findings:**
- BMAD agents already define the architecture through their file-based design
- OpenAI function calling pattern: LLM → tool call → backend executes → result → LLM continues
- Next.js chosen for familiar stack and future UI enhancement path (Slack-style multi-agent interface)
- Auto-scanning agents folder eliminates configuration overhead

**Key Insights from Brainstorming:**
1. The BMAD agents already define the architecture - platform simply enables existing patterns
2. Template repurposing beats custom building - find Next.js chatbot starter and modify
3. Incremental validation - hour-by-hour build sequence proves each layer before adding complexity
4. Thinking small enough - can build MVP in hours, not weeks, by starting with bare essentials

### B. Stakeholder Input

- **Primary Stakeholder:** Bryan (agent builder and developer)
- **Input Source:** Comprehensive brainstorming session documenting needs, constraints, and vision
- **Key Requirement:** Validate OpenAI compatibility ASAP to unblock ready-to-deploy use cases
- **Decision Authority:** Personal project - full autonomy on technical and product decisions
- **Success Criteria:** Ability to test and deploy BMAD agents with minimal friction

### C. References

**Source Documents:**
- Brainstorming Session Results: `/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/brainstorming-session-results-2025-10-01.md`

**Methodologies:**
- BMAD Methodology: File-based agent architecture with lazy-loading instructions
- Brainstorming Techniques: First Principles Thinking, Resource Constraints, SCAMPER Method

**Technology Stack:**
- Next.js Framework: https://nextjs.org
- OpenAI API: https://platform.openai.com/docs
- Docker: https://www.docker.com

**Design Inspiration:**
- ChatGPT interface (chat.openai.com)
- Claude.ai interface (claude.ai)
- Slack-style multi-channel UI (future vision)

---

_This Product Brief serves as the foundational input for Product Requirements Document (PRD) creation._

_Next Steps: Handoff to Product Manager for PRD development using the `workflow prd` command._
