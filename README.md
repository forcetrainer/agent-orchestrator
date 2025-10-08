# Agent Orchestrator

A Next.js-based platform that enables BMAD agent builders to validate OpenAI API compatibility and deploy agents to end users through an intuitive chat interface.

## Overview

**Agent Orchestrator** bridges the gap between agent development in Claude Code and production deployment for non-technical users. It provides a platform designed specifically for BMAD agents, enabling file-based agents with lazy-loading instruction patterns to work seamlessly with OpenAI's function calling API.

### The Problem It Solves

Agent builders can create sophisticated BMAD agents in Claude Code, but these agents are trapped in the IDE with no way to:
- Test OpenAI API compatibility before deployment
- Make agents accessible to non-technical end users
- Validate that file-based agent patterns work with OpenAI function calling
- Share working agents for stakeholder feedback and real-world use

### The Solution

Agent Orchestrator provides three core capabilities:

1. **OpenAI Compatibility Testing** - Validates that BMAD agents built in Claude Code function correctly with OpenAI's API and function calling patterns
2. **Simple Deployment** - Agent builders upload instruction files and agents become immediately functional
3. **End-User Interface** - Non-technical users interact with agents through a familiar ChatGPT-style chat interface

## Key Features

- **Agentic Execution Loop** - Claude Code-like agent execution pattern using OpenAI's function calling API with pause-load-continue pattern
- **Lazy File Loading** - Resources loaded on-demand during execution for optimal performance and scalability
- **Path Variable Resolution** - Portable bundle structure with dynamic path resolution (`{bundle-root}`, `{core-root}`, `{project-root}`)
- **Critical Actions Processor** - Agent initialization with minimal required files
- **Bundle System** - Self-contained agent packages with workflows, templates, and configurations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **AI Provider**: OpenAI API (GPT-4/GPT-3.5)
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

Agent Orchestrator implements a **Claude Code-like agent execution pattern** using OpenAI's function calling API. The architecture enables lazy loading of files and workflows through an agentic execution loop.

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

## Roadmap

- ✅ **Epic 1**: Foundation and project setup
- ✅ **Epic 2**: Basic OpenAI integration (deprecated)
- ✅ **Epic 3**: Enhanced architecture and testing
- ✅ **Epic 4**: Agentic execution loop and bundle system (current)
- 🔄 **Epic 5**: Production features and deployment optimization
- 📋 **Future**: Multi-agent orchestration, marketplace, enterprise integrations



## Support

For issues and questions:
- Check [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- Review [documentation](docs/)
- Open an issue on GitHub
