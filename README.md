# Agent Orchestrator

A Next.js-based AI agent orchestration platform that enables multi-agent workflows with file access and chat interfaces.

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
├── lib/                    # Business logic
│   └── utils/              # Utilities
│       ├── env.ts          # Environment validation
│       ├── errors.ts       # Error handling
│       └── index.ts        # Clean exports
├── types/                  # TypeScript types
│   ├── api.ts              # API types
│   └── index.ts            # Clean exports
├── .env.local              # Environment variables (gitignored)
├── .env.example            # Example env file
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── next.config.js          # Next.js config
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn

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
   - `NODE_ENV`: Set to `development` or `production`
   - Additional variables as needed

### Running the Application

Development mode:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Running Tests

```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

### Building for Production

```bash
npm run build
npm start
```

## Architecture

This project follows a modular monolith architecture with clear separation of concerns:

- **Frontend**: React components in `/components` organized by feature area
- **Backend**: API routes in `/app/api` and framework-agnostic business logic in `/lib`
- **Types**: Centralized TypeScript definitions in `/types`
- **Utilities**: Shared helpers and utilities in `/lib/utils`

For detailed architecture information, see [Solution Architecture](docs/solution-architecture.md).

### Epic 4: Agent Execution Architecture

This application implements a **Claude Code-like agent execution pattern** using OpenAI's function calling API. The architecture enables lazy loading of files and workflows through an agentic execution loop.

**Core Components:**

1. **Agentic Execution Loop** (`lib/agents/agenticLoop.ts`)
   - Implements pause-load-continue pattern
   - Handles tool calls from LLM to load resources on-demand
   - Iterates until task completion with safety limits
   - See: [AGENT-EXECUTION-SPEC.md](docs/AGENT-EXECUTION-SPEC.md#3-agentic-execution-loop)

2. **Path Resolution System** (`lib/pathResolver.ts`)
   - Resolves path variables: `{bundle-root}`, `{core-root}`, `{project-root}`
   - Supports config references: `{config_source}:variable_name`
   - Security validation prevents path traversal
   - See: [AGENT-EXECUTION-SPEC.md](docs/AGENT-EXECUTION-SPEC.md#5-path-resolution-system)

3. **Critical Actions Processor** (`lib/agents/criticalActions.ts`)
   - Executes initialization sequence when agent loads
   - Loads minimal required files (typically just config.yaml)
   - Injects loaded content into initial context
   - See: [AGENT-EXECUTION-SPEC.md](docs/AGENT-EXECUTION-SPEC.md#4-critical-actions-processor)

4. **Bundle System**
   - Self-contained agent packages with workflows and templates
   - Located in `bmad/custom/bundles/{bundle-name}/`
   - Contains: agents/, workflows/, templates/, config.yaml, bundle.yaml
   - See: [BUNDLE-SPEC.md](docs/BUNDLE-SPEC.md)

**Key Benefits:**
- **Lazy Loading**: Only loads files when explicitly needed via tool calls
- **Scalability**: Agents can have 10+ workflows without pre-loading all of them
- **Performance**: Fast initialization, lower context window usage
- **Efficiency**: Resources loaded on-demand during execution

**Execution Flow Example:**
```
User message
  → LLM generates tool call (read_file/execute_workflow)
  → Execution pauses
  → Tool executes, file content loaded
  → Result injected into context
  → LLM continues with loaded content
  → Final response
```

For complete specification, see:
- [AGENT-EXECUTION-SPEC.md](docs/AGENT-EXECUTION-SPEC.md) - Agentic execution architecture (includes detailed execution flow examples in appendix)
- [BUNDLE-SPEC.md](docs/BUNDLE-SPEC.md) - Bundle structure and manifest format
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Common issues and solutions

### What Changed from Epic 2

**Epic 2 (Deprecated):** Implemented a simple OpenAI function calling loop without proper agentic execution pattern. Agent instructions to load files were treated as documentation rather than executable commands, causing files to not actually load into context.

**Epic 4 (Current):** Complete architectural pivot to implement correct agentic execution:
- Replaced simple API calls with agentic execution loop
- Added tool definitions for file operations (`read_file`, `execute_workflow`, `save_output`)
- Implemented path variable resolution system
- Added critical actions processor for agent initialization
- Introduced bundle structure for portable agent packages

**Why the change was necessary:** Epic 2's approach didn't support BMAD agents that dynamically load workflows and templates. The LLM would acknowledge file load instructions but not actually execute them, breaking workflows. Epic 4's agentic loop forces actual tool execution with the pause-load-continue pattern.

## Development Guidelines

- All business logic in `/lib` should be framework-agnostic (no Next.js/React dependencies)
- Components are organized by feature area, not by component type
- Use index files for clean imports: `@/lib/utils` and `@/types`
- Tests are located in `__tests__` directories alongside source code
- Follow Next.js 14 App Router conventions

### For Developers: Epic 4 Architecture

If you're working on agent execution or bundle system features, here are key concepts:

**Agentic Execution Pattern:**
- The execution loop in `lib/agents/agenticLoop.ts` implements pause-load-continue
- LLM generates tool calls → execution pauses → tools execute → results injected → continues
- Safety limit (MAX_ITERATIONS) prevents infinite loops
- Each iteration grows the message context with tool results

**Path Variable Resolution:**
- Order matters: config references → system variables → path variables → nested resolution
- `resolvePath()` in `lib/pathResolver.ts` handles all variable replacement
- Security validation ensures paths stay within allowed directories (bundle-root, core-root)
- Bundle configs are cached after first load for performance

**Critical Actions:**
- Executed once during agent initialization in `lib/agents/criticalActions.ts`
- Loads minimal required files (typically just config.yaml)
- File content injected as system messages in initial context
- Enables variables from config to be available throughout session

**Bundle Structure:**
- Self-contained packages in `bmad/custom/bundles/{bundle-name}/`
- Required: bundle.yaml (manifest), config.yaml (variables)
- Agents reference bundle resources using `{bundle-root}/` paths
- Workflows use `{installed_path}/` for workflow-local files

**Common Development Tasks:**
- Adding new tools: Update tool definitions in `lib/tools/` and system prompt builder
- Creating bundles: Follow BUNDLE-SPEC.md structure, validate paths
- Debugging agent execution: Check logs for tool calls and path resolution
- Testing workflows: Use test bundles in `bmad/custom/bundles/test-bundle/`

**Architectural Decisions:**
- Why agentic loop? Enables lazy loading of files only when needed
- Why path variables? Makes bundles portable across installations
- Why critical actions? Minimizes initial load while ensuring config availability
- Why bundle structure? Self-contained, uploadable agent packages

## License

[Add license information]
