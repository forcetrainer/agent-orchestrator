# Epic 4: Agent Execution Architecture & Bundle System - Technical Specification

**Epic Goal:** Implement correct agent execution architecture with agentic loop and bundle structure support

**Status:** 🚧 IN PROGRESS

**Dependencies:**
- Epic 1 (Backend Foundation) ✅ COMPLETE
- Epic 3 Stories 3.1-3.8 (UI Infrastructure) ✅ COMPLETE
- Replaces deprecated Epic 2 implementation

**Foundational Specifications:**
- [AGENT-EXECUTION-SPEC.md](./AGENT-EXECUTION-SPEC.md) - Core execution architecture
- [BUNDLE-SPEC.md](./BUNDLE-SPEC.md) - Bundle structure and organization

---

## 1. Executive Summary

### 1.1 Problem Statement

Epic 2 validation revealed fundamental execution pattern mismatch:
- **Problem:** OpenAI treats file load instructions as documentation, not executable commands
- **Result:** Agents acknowledge file loads in text but don't actually load files
- **Impact:** Workflows fail because required files are missing from context

### 1.2 Solution Overview

Implement Claude Code-like agent execution system using:
1. **Agentic Execution Loop** - Pause-load-continue pattern via function calling
2. **Bundle Structure** - Self-contained agent packages with manifests
3. **Path Variable Resolution** - Dynamic resolution of {bundle-root}, {core-root}, etc.
4. **Critical Actions Processing** - Initialization-time file loading and setup

### 1.3 Success Criteria

- ✅ Agentic execution loop implements pause-load-continue pattern
- ✅ File loading via function calling blocks execution until files are available
- ✅ Path variables ({bundle-root}, {core-root}, {project-root}) resolve correctly
- ✅ Critical actions execute during agent initialization
- ✅ Bundle structure discovered from manifests (bundle.yaml)
- ✅ Bundled agents load and execute successfully end-to-end
- ✅ All Epic 2/3 tests refactored and passing with new architecture

---

## 2. Architectural Foundation

### 2.1 Core Specifications

This tech spec builds on two foundational documents:

#### AGENT-EXECUTION-SPEC.md
Defines the agent execution architecture:
- **Section 1-2:** Problem statement and solution overview
- **Section 3:** Agentic execution loop implementation
- **Section 4:** Critical actions processor
- **Section 5:** Path resolution system
- **Section 6:** System prompt builder
- **Section 7:** Tool execution handlers
- **Section 8:** Variable resolution for workflows

**Key Patterns:**
```
User message → LLM call → Tool calls?
  → Yes: Execute tools, add results to context, loop back to LLM
  → No: Return final response
```

#### BUNDLE-SPEC.md
Defines bundle structure and organization:
- **Section 1:** Directory structure (multi-agent vs standalone)
- **Section 2:** File specifications (bundle.yaml, config.yaml, agent.md)
- **Section 3:** Path variable system
- **Section 4:** Variable resolution order
- **Section 5:** Security model and path restrictions
- **Section 6:** Server integration patterns

**Key Structure:**
```
bmad/custom/bundles/{bundle-name}/
├── bundle.yaml          # Manifest
├── config.yaml          # Configuration
├── agents/              # Agent definitions
├── workflows/           # Workflows
└── templates/           # Templates
```

### 2.2 Architecture Principles

1. **Lazy Loading** - Only load files when explicitly needed via tool calls
2. **Bundle Isolation** - Agents reference bundle-local resources via {bundle-root}
3. **Execution Blocking** - Agent pauses on tool calls, continues after results
4. **Variable Resolution** - Dynamic path and config variable replacement
5. **Security by Design** - Path validation prevents traversal attacks

---

## 3. Component Architecture

### 3.1 System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  - Agent Selector (reads /api/agents)                  │
│  - Chat Interface (posts to /api/chat)                 │
│  - Message Display                                      │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│               API Routes (Next.js)                      │
│  - /api/agents (bundle discovery)                      │
│  - /api/chat (agentic execution)                       │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│            Core Execution Engine                        │
│                                                         │
│  ┌───────────────────────────────────────────┐        │
│  │   Bundle Scanner                          │        │
│  │   - Discovers bundles                     │        │
│  │   - Parses bundle.yaml                    │        │
│  │   - Returns agent metadata                │        │
│  └───────────────────────────────────────────┘        │
│                                                         │
│  ┌───────────────────────────────────────────┐        │
│  │   Agent Initializer                       │        │
│  │   - Loads agent.md                        │        │
│  │   - Processes critical-actions            │        │
│  │   - Loads config.yaml                     │        │
│  │   - Builds system prompt                  │        │
│  └───────────────────────────────────────────┘        │
│                                                         │
│  ┌───────────────────────────────────────────┐        │
│  │   Agentic Execution Loop                  │        │
│  │   - Calls OpenAI with tools               │        │
│  │   - Executes tool calls                   │        │
│  │   - Injects results into context          │        │
│  │   - Loops until completion                │        │
│  └───────────────────────────────────────────┘        │
│                                                         │
│  ┌───────────────────────────────────────────┐        │
│  │   Tool Execution Handlers                 │        │
│  │   - read_file                             │        │
│  │   - execute_workflow                      │        │
│  │   - save_output                           │        │
│  └───────────────────────────────────────────┘        │
│                                                         │
│  ┌───────────────────────────────────────────┐        │
│  │   Path Resolver                           │        │
│  │   - Resolves {bundle-root}                │        │
│  │   - Resolves {core-root}                  │        │
│  │   - Resolves {config_source}:var          │        │
│  │   - Validates security                    │        │
│  └───────────────────────────────────────────┘        │
│                                                         │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 OpenAI API                              │
│  - Chat Completions                                     │
│  - Function Calling                                     │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

#### Agent Initialization Flow
```
1. User selects agent
   ↓
2. /api/agents returns bundle metadata
   ↓
3. Frontend sends agent_id to /api/chat
   ↓
4. Load agent.md from bundle
   ↓
5. Parse <critical-actions>
   ↓
6. Load config.yaml (via read_file or direct)
   ↓
7. Build system prompt
   ↓
8. Create initial message context
   ↓
9. Return agent greeting/initialization
```

#### Agentic Execution Flow
```
1. User sends message
   ↓
2. Add to messages array
   ↓
3. Call OpenAI with tools
   ↓
4. Assistant returns with tool_calls?
   ├─ YES:
   │   ├─ Execute each tool call
   │   ├─ Add tool results to messages
   │   └─ Loop back to step 3
   └─ NO:
       └─ Return final response to user
```

#### Workflow Execution Flow
```
1. Agent calls execute_workflow tool
   ↓
2. Load workflow.yaml
   ↓
3. Resolve {config_source}:variables from config.yaml
   ↓
4. Load instructions.md from workflow
   ↓
5. Load template.md if specified
   ↓
6. Return workflow context to agent
   ↓
7. Agent processes workflow steps
   ↓
8. Agent calls save_output to save results
```

---

## 4. Implementation Details

### 4.1 Story-by-Story Technical Requirements

#### Story 4.1: Agentic Execution Loop

**Location:** `lib/agents/agenticLoop.ts`

**Implementation:**
```typescript
interface ExecutionResult {
  success: boolean;
  response: string;
  iterations: number;
  messages: Array<ChatMessage>;
}

async function executeAgent(
  agentId: string,
  userMessage: string,
  conversationHistory: Array<ChatMessage>
): Promise<ExecutionResult> {

  // Phase 1: Initialize
  const agent = await loadAgent(agentId);
  const criticalContext = await processCriticalActions(agent);

  // Phase 2: Build message context
  let messages = [
    { role: 'system', content: buildSystemPrompt(agent) },
    ...criticalContext.messages,
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  // Phase 3: Agentic loop
  const MAX_ITERATIONS = 50;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messages,
      tools: getToolDefinitions(),
      tool_choice: 'auto'
    });

    const assistantMessage = response.choices[0].message;
    messages.push(assistantMessage);

    // Check for tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      for (const toolCall of assistantMessage.tool_calls) {
        const toolResult = await executeToolCall(toolCall, agent.bundleName);

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }

      continue; // Loop back for next iteration
    }

    // No tool calls - done
    return {
      success: true,
      response: assistantMessage.content,
      iterations,
      messages
    };
  }

  throw new Error('Max iterations exceeded');
}
```

**Testing Requirements:**
- Unit tests: Loop continues until no tool calls
- Unit tests: Max iterations prevents infinite loops
- Unit tests: Tool results injected correctly
- Integration tests: Full execution with real OpenAI calls (mocked)

**References:**
- AGENT-EXECUTION-SPEC.md Section 3: Agentic Execution Loop

---

#### Story 4.2: Path Variable Resolution System

**Location:** `lib/pathResolver.ts`

**Implementation:**
```typescript
interface PathContext {
  bundleRoot: string;      // bmad/custom/bundles/{bundle-name}
  coreRoot: string;        // bmad/core
  projectRoot: string;     // /path/to/agent-orchestrator
  bundleConfig?: any;      // Parsed config.yaml
}

function resolvePath(pathTemplate: string, context: PathContext): string {
  let resolved = pathTemplate;

  // Step 1: Replace path variables
  const replacements = {
    '{bundle-root}': context.bundleRoot,
    '{core-root}': context.coreRoot,
    '{project-root}': context.projectRoot
  };

  for (const [variable, value] of Object.entries(replacements)) {
    resolved = resolved.replace(new RegExp(escapeRegex(variable), 'g'), value);
  }

  // Step 2: Resolve config references {config_source}:variable
  const configRefMatch = resolved.match(/\{config_source\}:(\w+)/);
  if (configRefMatch && context.bundleConfig) {
    const varName = configRefMatch[1];
    const varValue = context.bundleConfig[varName];
    if (varValue === undefined) {
      throw new Error(`Config variable not found: ${varName}`);
    }
    resolved = resolved.replace(configRefMatch[0], varValue);
  }

  // Step 3: Resolve system variables
  if (resolved.includes('{date}')) {
    const date = new Date().toISOString().split('T')[0];
    resolved = resolved.replace('{date}', date);
  }

  // Step 4: Normalize and validate
  const normalized = path.normalize(resolved);
  validatePathSecurity(normalized, context);

  return normalized;
}

function validatePathSecurity(resolvedPath: string, context: PathContext): void {
  const normalizedPath = path.normalize(resolvedPath);

  // Check if path is within allowed directories
  const allowedRoots = [
    path.normalize(context.bundleRoot),
    path.normalize(context.coreRoot)
  ];

  const isAllowed = allowedRoots.some(root =>
    normalizedPath.startsWith(root)
  );

  if (!isAllowed) {
    throw new Error(`Security violation: Path outside allowed directories: ${resolvedPath}`);
  }

  // Prevent traversal attacks
  if (normalizedPath.includes('..')) {
    throw new Error(`Security violation: Path traversal detected: ${resolvedPath}`);
  }
}
```

**Testing Requirements:**
- Unit tests: {bundle-root} resolves correctly
- Unit tests: {core-root} resolves correctly
- Unit tests: {config_source}:var resolves from config
- Unit tests: {date} resolves to current date
- Unit tests: Path traversal attacks blocked
- Unit tests: Paths outside allowed directories blocked

**References:**
- AGENT-EXECUTION-SPEC.md Section 5: Path Resolution System
- BUNDLE-SPEC.md Section 3: Path Variables

---

#### Story 4.3: Critical Actions Processor

**Location:** `lib/agents/criticalActions.ts`

**Implementation:**
```typescript
interface CriticalContext {
  messages: Array<ChatMessage>;
  config: any;
}

async function processCriticalActions(
  agent: Agent,
  bundleRoot: string
): Promise<CriticalContext> {

  const messages: Array<ChatMessage> = [];
  let bundleConfig = null;

  const context: PathContext = {
    bundleRoot,
    coreRoot: 'bmad/core',
    projectRoot: process.cwd(),
    bundleConfig: null
  };

  for (const action of agent.criticalActions) {
    const instruction = action.trim();

    // Pattern: "Load into memory {path} and set variables: var1, var2"
    const loadMatch = instruction.match(/Load into memory (.+?) and set/i);
    if (loadMatch) {
      const filePath = loadMatch[1];
      const resolvedPath = resolvePath(filePath, context);

      try {
        const fileContent = await fs.readFile(resolvedPath, 'utf-8');

        messages.push({
          role: 'system',
          content: `[Critical Action] Loaded file: ${resolvedPath}\n\n${fileContent}`
        });

        // If config.yaml, parse and store
        if (filePath.includes('config.yaml')) {
          bundleConfig = YAML.parse(fileContent);
          context.bundleConfig = bundleConfig;
        }
      } catch (error) {
        console.error(`Failed to load critical file: ${resolvedPath}`, error);
        throw new Error(`Critical action failed: ${instruction}`);
      }
    }
    // Other critical instructions
    else {
      messages.push({
        role: 'system',
        content: `[Critical Instruction] ${instruction}`
      });
    }
  }

  return { messages, config: bundleConfig };
}
```

**Testing Requirements:**
- Unit tests: File load instructions parsed correctly
- Unit tests: Config.yaml loaded and parsed
- Unit tests: System messages created correctly
- Integration tests: Critical actions execute before first user message

**References:**
- AGENT-EXECUTION-SPEC.md Section 4: Critical Actions Processor

---

#### Story 4.4: Bundle Structure Discovery

**Location:** `lib/agents/bundleScanner.ts`

**Implementation:**
```typescript
interface AgentMetadata {
  id: string;
  name: string;
  title: string;
  description?: string;
  icon?: string;
  bundleName: string;
  bundlePath: string;
  filePath: string;
}

async function discoverBundles(bundlesRoot: string): Promise<Array<AgentMetadata>> {
  const agents: Array<AgentMetadata> = [];

  // Scan bmad/custom/bundles/*
  const bundleDirs = await fs.readdir(bundlesRoot, { withFileTypes: true });

  for (const bundleDir of bundleDirs) {
    if (!bundleDir.isDirectory()) continue;

    const bundlePath = path.join(bundlesRoot, bundleDir.name);
    const manifestPath = path.join(bundlePath, 'bundle.yaml');

    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = YAML.parse(manifestContent);

      // Validate bundle structure
      validateBundleManifest(manifest);

      if (manifest.type === 'bundle') {
        // Multi-agent bundle
        for (const agent of manifest.agents) {
          if (agent.entry_point) {
            agents.push({
              id: agent.id,
              name: agent.name,
              title: agent.title,
              description: agent.description,
              icon: agent.icon,
              bundleName: manifest.name,
              bundlePath: bundlePath,
              filePath: path.join(bundlePath, agent.file)
            });
          }
        }
      } else if (manifest.type === 'standalone') {
        // Standalone agent
        agents.push({
          id: manifest.agent.id,
          name: manifest.agent.name,
          title: manifest.agent.title,
          description: manifest.agent.description,
          icon: manifest.agent.icon,
          bundleName: manifest.name,
          bundlePath: bundlePath,
          filePath: path.join(bundlePath, manifest.agent.file)
        });
      }
    } catch (error) {
      console.error(`Failed to load bundle: ${bundleDir.name}`, error);
      // Continue to next bundle
    }
  }

  return agents;
}

function validateBundleManifest(manifest: any): void {
  if (!manifest.type) throw new Error('Bundle manifest missing type');
  if (!manifest.name) throw new Error('Bundle manifest missing name');
  if (!manifest.version) throw new Error('Bundle manifest missing version');

  if (manifest.type === 'bundle') {
    if (!manifest.agents || !Array.isArray(manifest.agents)) {
      throw new Error('Multi-agent bundle missing agents array');
    }
    const hasEntryPoint = manifest.agents.some((a: any) => a.entry_point);
    if (!hasEntryPoint) {
      throw new Error('No entry_point agent defined in bundle');
    }
  } else if (manifest.type === 'standalone') {
    if (!manifest.agent) {
      throw new Error('Standalone bundle missing agent definition');
    }
  }
}
```

**Testing Requirements:**
- Unit tests: Multi-agent bundle parsed correctly
- Unit tests: Standalone bundle parsed correctly
- Unit tests: Only entry_point agents returned
- Unit tests: Invalid bundles handled gracefully
- Integration tests: Real bundle directory scanned

**References:**
- BUNDLE-SPEC.md Section 1: Directory Structure
- BUNDLE-SPEC.md Section 2: bundle.yaml specification
- BUNDLE-SPEC.md Section 7: Agent Discovery

---

#### Story 4.5: File Operation Tools Refactor

**Location:** `lib/tools/fileOperations.ts`

**Implementation:**
```typescript
const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read a file from the bundle or core BMAD system. Use this when you need to load configuration files, templates, or any other file referenced in agent instructions.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to file. Can use variables: {bundle-root}/path/to/file, {core-root}/path/to/file'
          }
        },
        required: ['file_path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'execute_workflow',
      description: 'Execute a workflow. This will load the workflow configuration, instructions, and template (if applicable), then execute the workflow steps.',
      parameters: {
        type: 'object',
        properties: {
          workflow_path: {
            type: 'string',
            description: 'Path to workflow.yaml file, e.g., {bundle-root}/workflows/intake/workflow.yaml'
          },
          user_input: {
            type: 'object',
            description: 'User-provided inputs for the workflow',
            additionalProperties: true
          }
        },
        required: ['workflow_path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'save_output',
      description: 'Save generated content to a file. Used for workflow outputs.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path where to save the file'
          },
          content: {
            type: 'string',
            description: 'Content to save'
          }
        },
        required: ['file_path', 'content']
      }
    }
  }
];

async function executeReadFile(
  params: { file_path: string },
  context: PathContext
): Promise<any> {
  const resolvedPath = resolvePath(params.file_path, context);

  try {
    const content = await fs.readFile(resolvedPath, 'utf-8');
    return {
      success: true,
      path: resolvedPath,
      content: content,
      size: content.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      path: resolvedPath
    };
  }
}

async function executeSaveOutput(
  params: { file_path: string; content: string },
  context: PathContext
): Promise<any> {
  const resolvedPath = resolvePath(params.file_path, context);

  try {
    const dir = path.dirname(resolvedPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(resolvedPath, params.content, 'utf-8');

    return {
      success: true,
      path: resolvedPath,
      size: params.content.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      path: resolvedPath
    };
  }
}
```

**Testing Requirements:**
- Unit tests: read_file resolves paths and reads correctly
- Unit tests: save_output creates directories and saves
- Unit tests: execute_workflow loads and resolves workflow
- Unit tests: Path security enforced on all operations

**References:**
- AGENT-EXECUTION-SPEC.md Section 2: Tool Definitions

---

#### Story 4.8: System Prompt Builder

**Location:** `lib/agents/systemPromptBuilder.ts`

**Implementation:**
```typescript
function buildSystemPrompt(agent: Agent): string {
  return `You are ${agent.name}, ${agent.title}.

${agent.persona.role}

IDENTITY:
${agent.persona.identity}

COMMUNICATION STYLE:
${agent.persona.communication_style}

PRINCIPLES:
${agent.persona.principles}

CRITICAL INSTRUCTIONS FOR TOOL USAGE:
- When you encounter instructions to load files, you MUST use the read_file tool
- When you need to execute a workflow, you MUST use the execute_workflow tool
- DO NOT just acknowledge file load instructions in text - actually call the tools
- ALWAYS wait for tool results before continuing with the task
- Tool calls will pause execution and provide you with file content

AVAILABLE COMMANDS:
${agent.commands.map(cmd => {
  let desc = `${cmd.cmd} - ${cmd.description}`;
  if (cmd.runWorkflow) desc += `\n  Workflow: ${cmd.runWorkflow}`;
  return desc;
}).join('\n')}

WORKFLOW EXECUTION PATTERN:
When a user invokes a command (e.g., *workflow-request):
1. Identify the workflow path from the command definition
2. Call execute_workflow tool with that path
3. Wait for the workflow configuration, instructions, and template
4. Follow the workflow instructions step by step
5. Use save_output tool to save generated content

Remember: You have access to tools. Use them actively, not just describe them.`;
}
```

**Testing Requirements:**
- Unit tests: System prompt includes all required sections
- Integration tests: System prompt leads to tool calls (not acknowledgments)

**References:**
- AGENT-EXECUTION-SPEC.md Section 6: System Prompt Builder

---

### 4.2 API Endpoints

#### GET /api/agents

**Purpose:** Return list of available agents from bundles

**Implementation:**
```typescript
// app/api/agents/route.ts
export async function GET(request: Request) {
  try {
    const bundlesRoot = process.env.BUNDLES_ROOT || 'bmad/custom/bundles';
    const agents = await discoverBundles(bundlesRoot);

    return Response.json({
      success: true,
      agents: agents
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

**Response Format:**
```json
{
  "success": true,
  "agents": [
    {
      "id": "alex-facilitator",
      "name": "Alex",
      "title": "Requirements Facilitator",
      "description": "Gathers initial requirements",
      "icon": "📝",
      "bundleName": "requirements-workflow",
      "bundlePath": "bmad/custom/bundles/requirements-workflow",
      "filePath": "bmad/custom/bundles/requirements-workflow/agents/alex-facilitator.md"
    }
  ]
}
```

#### POST /api/chat

**Purpose:** Execute agentic loop for chat interactions

**Implementation:**
```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  try {
    const { agent_id, message, conversation_history } = await request.json();

    const result = await executeAgent(agent_id, message, conversation_history || []);

    return Response.json({
      success: true,
      response: result.response,
      iterations: result.iterations
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

**Request Format:**
```json
{
  "agent_id": "alex-facilitator",
  "message": "*workflow-request",
  "conversation_history": [
    { "role": "user", "content": "previous message" },
    { "role": "assistant", "content": "previous response" }
  ]
}
```

**Response Format:**
```json
{
  "success": true,
  "response": "Agent response content",
  "iterations": 3
}
```

---

## 5. Data Models

### 5.1 Bundle Manifest (bundle.yaml)

```yaml
type: bundle | standalone
name: string (kebab-case)
version: string (semver)
description: string
author: string (optional)
created: date (optional)

# Multi-agent bundle
agents:
  - id: string
    name: string
    title: string
    file: string (relative path)
    entry_point: boolean
    description: string (optional)

# Standalone bundle
agent:
  id: string
  name: string
  title: string
  file: string

resources:
  workflows: string (path)
  templates: string (path)
  config: string (path)

core_dependencies:
  - string (path to core file)
```

### 5.2 Bundle Config (config.yaml)

```yaml
user_name: string
communication_language: string
output_folder: string (with path variables)
project_name: string
# ... custom variables
```

### 5.3 Agent Definition

```typescript
interface Agent {
  id: string;
  name: string;
  title: string;
  icon: string;
  persona: {
    role: string;
    identity: string;
    communication_style: string;
    principles: string;
  };
  criticalActions: Array<string>;
  commands: Array<{
    cmd: string;
    description: string;
    runWorkflow?: string;
    exec?: string;
  }>;
  bundleName: string;
  bundlePath: string;
}
```

### 5.4 Workflow Configuration

```yaml
name: string
description: string
config_source: string (path with variables)
output_folder: string (variable reference)
installed_path: string (path with variables)
template: string (path with variables)
instructions: string (path with variables)
default_output_file: string (path with variables)
template: boolean
```

---

## 6. Security Considerations

### 6.1 Path Security

**Allowed Read Paths:**
- `{bundle-root}/*` - Bundle-local files (read/write)
- `{core-root}/*` - BMAD core files (read-only)

**Forbidden:**
- Paths outside bundle-root and core-root
- Path traversal: `../`, `..\\`
- Absolute paths outside project root
- Symbolic links (resolved and validated)

**Implementation:**
```typescript
function validatePathSecurity(resolvedPath: string, context: PathContext): void {
  const normalized = path.normalize(resolvedPath);

  const allowedRoots = [
    path.normalize(context.bundleRoot),
    path.normalize(context.coreRoot)
  ];

  const isAllowed = allowedRoots.some(root => normalized.startsWith(root));

  if (!isAllowed) {
    throw new Error(`Access denied: ${resolvedPath}`);
  }

  if (normalized.includes('..')) {
    throw new Error(`Path traversal detected: ${resolvedPath}`);
  }
}
```

### 6.2 Tool Execution Limits

- **Max Iterations:** 50 (prevents infinite loops)
- **Timeout:** 2 minutes per agent execution
- **File Size Limits:** 1MB per file read
- **Rate Limiting:** TBD (future enhancement)

### 6.3 Input Validation

- Bundle manifest: Schema validation via YAML parser
- Agent ID: Alphanumeric + hyphens only
- File paths: Must match allowed patterns
- User input: Sanitized before passing to OpenAI

---

## 7. Performance Optimization

### 7.1 Lazy Loading Benefits

**Startup Performance:**
- Traditional: Load all workflows (~50k tokens)
- Lazy Loading: Load config only (~2k tokens)
- **Improvement: 25x reduction in initialization tokens**

**Runtime Performance:**
- Only active workflow in context
- No unused workflows consuming context window
- Faster response times from OpenAI

### 7.2 Caching Strategy (Optional - Phase 2)

```typescript
// In-memory cache for frequently accessed files
const fileCache = new Map<string, string>();

async function cachedReadFile(filePath: string): Promise<string> {
  if (fileCache.has(filePath)) {
    return fileCache.get(filePath)!;
  }

  const content = await fs.readFile(filePath, 'utf-8');
  fileCache.set(filePath, content);
  return content;
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

**Path Resolution:**
- ✅ {bundle-root} resolves correctly
- ✅ {core-root} resolves correctly
- ✅ {config_source}:var resolves from config
- ✅ Path traversal attacks blocked
- ✅ Invalid paths rejected

**Bundle Discovery:**
- ✅ Multi-agent bundles parsed
- ✅ Standalone bundles parsed
- ✅ Invalid bundles handled gracefully
- ✅ Only entry_point agents returned

**Critical Actions:**
- ✅ File loads execute correctly
- ✅ Config.yaml parsed and stored
- ✅ System messages created

**Tool Execution:**
- ✅ read_file loads files
- ✅ save_output writes files
- ✅ execute_workflow loads workflows

### 8.2 Integration Tests

**Agent Initialization:**
- ✅ Agent loads from bundle
- ✅ Critical actions execute
- ✅ Config variables available

**Agentic Loop:**
- ✅ Loop continues until no tool calls
- ✅ Tool results injected correctly
- ✅ Max iterations enforced

**End-to-End Workflow:**
- ✅ User selects agent
- ✅ User invokes workflow command
- ✅ Agent loads workflow via tool call
- ✅ Workflow executes successfully
- ✅ Output saved correctly

### 8.3 Test Data

**Test Bundle:**
```
bmad/custom/bundles/test-bundle/
├── bundle.yaml
├── config.yaml
├── agents/
│   └── test-agent.md
└── workflows/
    └── test-workflow/
        ├── workflow.yaml
        └── instructions.md
```

---

## 9. Migration Plan

### 9.1 Deprecation of Epic 2 Code

**Files to Replace:**
- `lib/openai.ts` - Simple function calling → Agentic loop
- `lib/agents/scanner.ts` - File-based discovery → Bundle discovery
- `app/api/chat/route.ts` - Simple loop → Agentic execution

**Files to Keep (with modifications):**
- `lib/fileOperations.ts` - Add path resolution
- `app/api/agents/route.ts` - Update to bundle discovery

### 9.2 Epic 3 Updates Required

**Story 3.4 (Agent Discovery):**
- Update to use bundle-based discovery
- Parse bundle.yaml instead of scanning .md files

**Story 3.9 (Lazy Loading Validation):**
- Re-test with agentic loop
- Verify file loads via tool calls

**Story 3.10 (Agent Initialization):**
- Update to use critical actions processor
- Test initialization with bundle structure

### 9.3 Migration Checklist

- [ ] Implement all Epic 4 components
- [ ] Refactor Epic 3 Stories 3.4, 3.9, 3.10
- [ ] Update tests for new architecture
- [ ] Remove Epic 2 deprecated code
- [ ] Update documentation
- [ ] Validate end-to-end with real bundles

---

## 10. Rollout Plan

### 10.1 Development Sequence

**Sprint 1 (Stories 4.1-4.4):**
- Agentic execution loop
- Path resolution system
- Critical actions processor
- Bundle discovery

**Sprint 2 (Stories 4.5-4.8):**
- File operation tools refactor
- Agent discovery refactor
- Agent initialization
- System prompt builder

**Sprint 3 (Stories 4.9-4.12):**
- End-to-end validation
- Test refactoring
- Core files support
- Documentation

### 10.2 Validation Gates

**Gate 1 (After Story 4.4):**
- ✅ Bundles discovered correctly
- ✅ Path variables resolve
- ✅ Critical actions execute

**Gate 2 (After Story 4.8):**
- ✅ Agentic loop works end-to-end
- ✅ File loads via tool calls
- ✅ Agent initialization complete

**Gate 3 (After Story 4.12):**
- ✅ Real bundled agent executes successfully
- ✅ All tests passing
- ✅ Epic 3 stories unblocked

---

## 11. Known Issues and Future Work

### 11.1 Known Limitations (MVP)

- **No Streaming:** Responses returned after full completion
- **No Caching:** Files read from disk every time
- **No Agent-to-Agent:** Agents cannot invoke other agents
- **No State Persistence:** Workflow state not saved between sessions

### 11.2 Future Enhancements (Post-MVP)

**Phase 2:**
- Streaming responses for better UX
- File caching for performance
- Workflow state persistence

**Phase 3:**
- Agent-to-agent communication
- Batch workflow processing
- Advanced debugging tools

---

## 12. Appendices

### 12.1 Reference Documents

**Core Specifications:**
- [AGENT-EXECUTION-SPEC.md](./AGENT-EXECUTION-SPEC.md) - Detailed execution architecture
- [BUNDLE-SPEC.md](./BUNDLE-SPEC.md) - Bundle structure and organization
- [PRD.md](./PRD.md) - Product requirements and success criteria
- [epics.md](./epics.md) - Epic breakdown and story details

**OpenAI Documentation:**
- [Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [Chat Completions API](https://platform.openai.com/docs/api-reference/chat)

### 12.2 Example Bundle Reference

**Production Bundle:**
- Location: `bmad/custom/bundles/requirements-workflow/`
- Agents: Alex, Casey, Pixel
- Workflows: 15+ workflows
- Use Cases: Requirements gathering, analysis, story development

### 12.3 Glossary

- **Agentic Loop:** Execution pattern where LLM calls tools, waits for results, continues
- **Bundle:** Self-contained package of agents, workflows, templates, and configuration
- **Critical Actions:** Initialization steps executed when agent loads
- **Entry Point:** Agent that users can directly select and start conversations with
- **Lazy Loading:** Loading files on-demand via tool calls, not pre-loading
- **Path Variable:** Dynamic path placeholder like {bundle-root} resolved at runtime
- **Tool Call:** OpenAI function calling to execute file operations or workflows

---

## 13. Post-Review Follow-ups

### Story 4.2 Follow-ups (from Senior Developer Review - 2025-10-05)

**Medium Priority:**
- ✅ **COMPLETED** Add symbolic link resolution validation to prevent links escaping allowed directories (lib/pathResolver.ts:142-193) - OWASP Node.js 2025 best practice implemented using fs.realpathSync()
- ✅ **COMPLETED** Sanitize security error messages to prevent path information leakage in production (lib/pathResolver.ts:180-182) - Now throws generic "Access denied" with detailed logging

**Low Priority:**
- ✅ **COMPLETED** Add test for symbolic link handling (lib/__tests__/pathResolver.test.ts:275-325) - 3 new tests added
- Add test for concurrent config loading from multiple bundles (lib/__tests__/pathResolver.integration.test.ts)
- Add JSDoc examples for common path resolution patterns (lib/pathResolver.ts:272-284)

**Review Outcome:** Approved - Implementation is production-ready with 50 passing tests (enhanced from 47) and hardened security posture following OWASP best practices. Medium priority items completed 2025-10-05.

---

**Specification Version:** 1.0
**Date:** 2025-10-05
**Author:** Agent Orchestrator Team
**Status:** 🚧 IN PROGRESS
