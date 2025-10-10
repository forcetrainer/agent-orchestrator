# Flint ⚡

A Next.js-based platform that enables BMAD agent builders to leverage the OpenAI API and deploy complex, multi-turn agents to end users through an intuitive chat interface.

**Flint** - *The foundation that generates the spark to ignite your agents.*

## Overview

**Flint** bridges the gap between agent development and use in an IDE and production deployment for non-technical users. It provides a platform designed specifically for BMAD agents, enabling file-based agents with lazy-loading instruction patterns to work seamlessly with OpenAI's function calling API.

### The Problem It Solves

Agent builders can create sophisticated BMAD agents in an IDE, but these agents are trapped in the IDE with no way to:
- Test OpenAI API compatibility before deployment
- Make agents accessible to non-technical end users
- Validate that file-based agent patterns work with OpenAI function calling
- Share working agents for stakeholder feedback and real-world use

**Real-World Use Case: Requirements Gathering**

This prototype includes example agents designed for technical requirements gathering — one of IT's most challenging processes. Eliciting technical details from non-technical stakeholders typically produces requirements that are incomplete, ambiguous, or missing critical context. These gaps cascade into poorly-defined stories, which ultimately result in production defects.

Multi-turn BMAD agents address this by combining structured workflows, domain knowledge, and contextual follow-up questions. By interacting with both end users and technical subject matter experts, these agents accelerate the requirements process while improving output quality—producing clearer requirements, better-defined stories, and more reliable deployments.

### The Solution

Flint provides three core capabilities:

1. **OpenAI Compatibility** - Allows BMAD agents built in an IDE to function correctly with OpenAI's API and function calling patterns
2. **Simple Deployment** - Agent builders upload instruction files and agents become immediately functional
3. **End-User Interface** - Non-technical users interact with agents through a familiar chat interface with Flint's signature cyan spark branding

## Key Features

- **Agentic Execution Loop** - Claude Code-like agent execution pattern using OpenAI's function calling API with pause-load-continue pattern
- **Lazy File Loading** - Resources loaded on-demand during execution for optimal performance and scalability
- **Path Variable Resolution** - Portable bundle structure with dynamic path resolution (`{bundle-root}`, `{core-root}`, `{project-root}`)
- **Critical Actions Processor** - Agent initialization with minimal required files
- **Bundle System** - Self-contained agent packages with workflows, templates, and configurations
- **Flint Design System** - Distinctive visual identity with deep blue primary (#1E40AF), vibrant cyan accents (#06B6D4), and signature 4-6px left borders

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **AI Provider**: OpenAI API - Testing primarily with gpt-5-mini
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Testing**: Jest + React Testing Library
- **Configuration**: YAML (js-yaml)

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd agent-orchestrator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your configuration:
   ```bash
   NODE_ENV=development
   OPENAI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
agent-orchestrator/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   ├── globals.css         # Global styles
│   └── api/                # API routes
│       └── health/         # Health check endpoint
├── components/             # React components
│   ├── chat/               # Chat interface components
│   ├── file-viewer/        # File viewer components
│   ├── navigation/         # Navigation components
│   ├── providers/          # Context providers
│   └── ui/                 # Reusable UI components
├── lib/                    # Business logic (framework-agnostic)
│   ├── agents/             # Agent execution core
│   │   ├── agenticLoop.ts  # Pause-load-continue execution loop
│   │   └── criticalActions.ts  # Agent initialization
│   ├── pathResolver.ts     # Path variable resolution system
│   └── utils/              # Utilities
│       ├── env.ts          # Environment validation
│       └── errors.ts       # Error handling
├── types/                  # TypeScript types
│   ├── api.ts              # API types
│   └── index.ts            # Clean exports
├── bmad/                   # BMAD agent bundles and core
│   ├── core/               # Core BMAD framework
│   ├── bmm/                # BMAD Methodology Module (sample bundle)
│   └── custom/             # Custom agent bundles
├── docs/                   # Documentation
│   ├── AGENT-EXECUTION-SPEC.md  # Agentic execution architecture
│   ├── BUNDLE-SPEC.md      # Bundle structure specification
│   ├── TROUBLESHOOTING.md  # Common issues and solutions
│   └── prd.md              # Product Requirements Document
├── .env.local              # Environment variables (gitignored)
├── .env.example            # Example env file
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── next.config.js          # Next.js config
```

## Architecture

Flint implements a **Claude Code-like agent execution pattern** using OpenAI's function calling API. The architecture enables lazy loading of files and workflows through an agentic execution loop.

### Core Components

#### 1. Agentic Execution Loop (`lib/agents/agenticLoop.ts`)
- Implements pause-load-continue pattern
- Handles tool calls from LLM to load resources on-demand
- Iterates until task completion with safety limits
- See: [AGENT-EXECUTION-SPEC.md](docs/AGENT-EXECUTION-SPEC.md#3-agentic-execution-loop)

#### 2. Path Resolution System (`lib/pathResolver.ts`)
- Resolves path variables: `{bundle-root}`, `{core-root}`, `{project-root}`
- Supports config references: `{config_source}:variable_name`
- Security validation prevents path traversal
- See: [AGENT-EXECUTION-SPEC.md](docs/AGENT-EXECUTION-SPEC.md#5-path-resolution-system)

#### 3. Critical Actions Processor (`lib/agents/criticalActions.ts`)
- Executes initialization sequence when agent loads
- Loads minimal required files (typically just config.yaml)
- Injects loaded content into initial context
- See: [AGENT-EXECUTION-SPEC.md](docs/AGENT-EXECUTION-SPEC.md#4-critical-actions-processor)

#### 4. Bundle System
- Self-contained agent packages with workflows and templates
- Located in `bmad/custom/bundles/{bundle-name}/`
- Contains: agents/, workflows/, templates/, config.yaml, bundle.yaml
- See: [BUNDLE-SPEC.md](docs/BUNDLE-SPEC.md)

### Execution Flow

```
User message
  → LLM generates tool call (read_file/execute_workflow)
  → Execution pauses
  → Tool executes, file content loaded
  → Result injected into context
  → LLM continues with loaded content
  → Final response
```

### Key Benefits

- **Lazy Loading**: Only loads files when explicitly needed via tool calls
- **Scalability**: Agents can have 10+ workflows without pre-loading all of them
- **Performance**: Fast initialization, lower context window usage
- **Efficiency**: Resources loaded on-demand during execution

## Development

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

### Building for Production

```bash
npm run build
npm start
```

### Development Guidelines

- All business logic in `/lib` should be framework-agnostic (no Next.js/React dependencies)
- Components are organized by feature area, not by component type
- Use index files for clean imports: `@/lib/utils` and `@/types`
- Tests are located in `__tests__` directories alongside source code
- Follow Next.js 14 App Router conventions

### Working with Agents

**Adding New Tools:**
- Update tool definitions in `lib/tools/` and system prompt builder

**Creating Bundles:**
- Follow BUNDLE-SPEC.md structure
- Validate paths using path variable system
- Include bundle.yaml manifest and config.yaml

**Debugging Agent Execution:**
- Check logs for tool calls and path resolution
- Use test bundles in `bmad/custom/bundles/test-bundle/`

## Documentation

- **[AGENT-EXECUTION-SPEC.md](docs/AGENT-EXECUTION-SPEC.md)** - Agentic execution architecture with detailed flow examples
- **[BUNDLE-SPEC.md](docs/BUNDLE-SPEC.md)** - Bundle structure and manifest format
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[PRD](docs/prd.md)** - Product Requirements Document

## Target Users

**Primary:** Agent Builders (IT professionals - BAs, developers, engineers) who need to build complex guidance agents and deploy them to end users

**Secondary:** End Users (mix of technical and non-technical staff) who need expert-level assistance through familiar chat interfaces

## Development Progress

**6 of 8 Epics Complete** - Production-ready prototype demonstrating full agent orchestration capabilities

- ✅ **Epic 1**: Foundation and project setup - Backend infrastructure, API routes, environment configuration
- ⚠️ **Epic 2**: Basic OpenAI integration (deprecated - replaced by Epic 4's superior architecture)
- ✅ **Epic 3**: Chat interface and agent selection - ChatGPT-style UI with markdown rendering
- ✅ **Epic 4**: Agentic execution loop and bundle system - Claude Code-like pause-load-continue pattern
- ✅ **Epic 5**: File management and viewer - Session-based outputs with metadata-driven navigation
- ✅ **Epic 6**: Enhanced UX & interactive features - Streaming responses, collapsible panels, smart session naming
- 🎯 **Epic 7**: Docker deployment (NEXT) - Container packaging for easy distribution
- 📋 **Epic 8**: Polish, testing, and documentation - Final production hardening

### What's Working Right Now

**Core Agent Execution:**
- Multi-turn conversations with sophisticated BMAD agents
- Lazy-loading of instruction files on-demand (10+ workflows per agent)
- Path variable resolution for portable bundle structure
- Critical actions processor for agent initialization

**User Experience:**
- Real-time streaming responses (token-by-token like ChatGPT)
- Dynamic status messages showing actual tool activity
- Collapsible file viewer for focused chat experience
- Session-based outputs with friendly display names
- Drag-and-drop file attachment from viewer to chat

**Production-Ready Features:**
- Session metadata system for cross-agent discovery
- Context-aware file naming validation
- Secure file operations with path traversal protection
- Performance-optimized with 60fps rendering

### Next Steps

**Epic 7 (Docker Deployment):**
- Single-command deployment via docker-compose
- Volume mounts for bundles, core files, and outputs
- Production-ready containerization

**Epic 8 (Final Polish):**
- Cross-browser testing and optimization
- Comprehensive agent builder documentation
- End-user guides and tutorials

### Future Enhancements

- Multi-agent orchestration and collaboration
- Agent marketplace for sharing bundles
- Enterprise integrations (SSO, audit logging)
- Advanced analytics and usage tracking



## Built With BMAD

This project is built to support agents created with the [BMAD-METHOD™](https://github.com/bmad-code-org/BMAD-METHOD), a universal AI agent framework for "Agentic Agile Driven Development."

**BMAD™ and BMAD-METHOD™ are trademarks of BMad Code, LLC.**

Flint provides a deployment platform for BMAD agents, enabling them to work seamlessly with OpenAI's API and making them accessible to end users through an intuitive chat interface. While Flint is specifically designed for BMAD agents, the underlying architecture can support other agent frameworks with similar file-based instruction patterns.

Learn more about BMAD:
- [BMAD Method GitHub](https://github.com/bmad-code-org/BMAD-METHOD)
- [BMAD Documentation](https://github.com/bmad-code-org/BMAD-METHOD#readme)

If you find this project useful, please consider ⭐ starring both repositories to help others discover them!

## License

This project is licensed under the **Flint Non-Commercial License** - see the [LICENSE](LICENSE) file for details.

**TL;DR:**
- ✅ Free for personal projects, education, research, and internal corporate use
- ✅ Modify, adapt, and redistribute (with attribution)
- ❌ Cannot be used in commercial products or services that charge fees
- 💼 Commercial licensing available upon request

For commercial licensing inquiries, please open an issue on GitHub.

## Support

For issues and questions:
- Check [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- Review [documentation](docs/)
- Open an issue on GitHub
