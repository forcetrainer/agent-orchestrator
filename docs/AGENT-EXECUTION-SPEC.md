# BMAD Agent Execution Architecture Specification

## Overview

This document specifies how to implement a Claude Code-like agent execution system using OpenAI's API with function calling. The goal is to enable **lazy loading** of files and workflows, ensuring that agents only load resources when explicitly needed, rather than pre-loading all possible dependencies.

---

## Problem Statement

### Current Limitation

When using standard OpenAI chat completions API:
- Agent files contain instructions like `<i>Load {bundle-root}/workflows/intake.yaml</i>`
- LLM reads these instructions as **documentation**, not executable commands
- LLM may acknowledge the instruction in text but **does not actually load the file**
- Execution continues **without the file content in context**
- Result: Instructions fail because required files are missing

### Desired Behavior (Claude Code Pattern)

1. Agent reads instruction: `<i>Load {bundle-root}/config.yaml</i>`
2. Agent **generates tool call** to `read_file` function
3. Execution **pauses** and waits for tool result
4. File content is **injected into context**
5. Agent **continues execution** with file now available

### Why This Matters

- **Scalability**: Agents may have 10-15 workflows, but users only invoke 1 at a time
- **Performance**: Pre-loading all workflows wastes context window and processing time
- **Efficiency**: Lazy loading ensures only necessary files are loaded on-demand
- **User Experience**: Faster initialization, lower latency

---

## Solution Architecture

Implement an **agentic execution loop** that uses OpenAI's function calling to:
1. Parse agent file critical actions at initialization
2. Provide tools for file reading and workflow execution
3. Execute in a loop, handling tool calls until completion
4. Inject tool results back into context for continued processing

---

## Core Components

### 1. Agent Initialization (Critical Actions Phase)

**Purpose**: Load minimal required files at agent startup.

**Process**:
1. Read agent.md file from bundle
2. Parse `<critical-actions>` section
3. Extract file load instructions
4. Load ONLY files specified in critical actions (typically just config.yaml)
5. Inject loaded content into initial context

**Example Critical Actions**:
```xml
<critical-actions>
  <i>Load into memory {bundle-root}/config.yaml and set variables: project_name, output_folder, user_name</i>
  <i>Remember the user's name is {user_name}</i>
  <i>ALWAYS communicate in {communication_language}</i>
</critical-actions>
```

**What to Load**:
- `{bundle-root}/config.yaml` → Always load (contains variables)
- Other files → Only if explicitly mentioned in critical-actions

**What NOT to Load**:
- Workflows → Load on-demand when user invokes command
- Templates → Load when workflow needs them
- Instructions → Load when workflow starts

---

### 2. Tool Definitions

Provide tools that the LLM can call to load resources.

#### Tool: `read_file`

**Purpose**: Read a file from bundle or core.

```json
{
  "type": "function",
  "function": {
    "name": "read_file",
    "description": "Read a file from the bundle or core BMAD system. Use this when you need to load configuration files, templates, or any other file referenced in agent instructions.",
    "parameters": {
      "type": "object",
      "properties": {
        "file_path": {
          "type": "string",
          "description": "Path to file. Can use variables: {bundle-root}/path/to/file, {core-root}/path/to/file"
        }
      },
      "required": ["file_path"]
    }
  }
}
```

**Implementation**:
```javascript
async function executeReadFile(params) {
  const { file_path } = params;

  // Resolve path variables
  const resolvedPath = resolvePath(file_path, {
    bundleRoot: currentBundleRoot,
    coreRoot: systemCoreRoot
  });

  // Read file
  const content = await fs.readFile(resolvedPath, 'utf-8');

  return {
    success: true,
    path: resolvedPath,
    content: content
  };
}
```

#### Tool: `execute_workflow`

**Purpose**: Execute a workflow from the bundle.

```json
{
  "type": "function",
  "function": {
    "name": "execute_workflow",
    "description": "Execute a workflow. This will load the workflow configuration, instructions, and template (if applicable), then execute the workflow steps.",
    "parameters": {
      "type": "object",
      "properties": {
        "workflow_path": {
          "type": "string",
          "description": "Path to workflow.yaml file, e.g., {bundle-root}/workflows/intake/workflow.yaml"
        },
        "user_input": {
          "type": "object",
          "description": "User-provided inputs for the workflow",
          "additionalProperties": true
        }
      },
      "required": ["workflow_path"]
    }
  }
}
```

**Implementation**:
```javascript
async function executeWorkflow(params) {
  const { workflow_path, user_input } = params;

  // 1. Resolve and load workflow.yaml
  const resolvedPath = resolvePath(workflow_path, { bundleRoot });
  const workflowConfig = await readYAML(resolvedPath);

  // 2. Resolve variables in workflow config
  const resolved = await resolveWorkflowVariables(workflowConfig, bundleConfig);

  // 3. Load instructions
  const instructionsPath = resolvePath(resolved.instructions, { bundleRoot });
  const instructions = await fs.readFile(instructionsPath, 'utf-8');

  // 4. Load template if exists
  let template = null;
  if (resolved.template) {
    const templatePath = resolvePath(resolved.template, { bundleRoot });
    template = await fs.readFile(templatePath, 'utf-8');
  }

  // 5. Return workflow context
  return {
    success: true,
    workflow_name: resolved.name,
    description: resolved.description,
    instructions: instructions,
    template: template,
    config: resolved,
    user_input: user_input
  };
}
```

#### Tool: `save_output`

**Purpose**: Save generated content to file.

```json
{
  "type": "function",
  "function": {
    "name": "save_output",
    "description": "Save generated content to a file. Used for workflow outputs.",
    "parameters": {
      "type": "object",
      "properties": {
        "file_path": {
          "type": "string",
          "description": "Path where to save the file"
        },
        "content": {
          "type": "string",
          "description": "Content to save"
        }
      },
      "required": ["file_path", "content"]
    }
  }
}
```

---

### 3. Agentic Execution Loop

**Purpose**: Continuously execute LLM calls, handling tool calls until task completion.

**Pattern**:
```
User message → LLM call → Tool calls?
  → Yes: Execute tools, add results to context, loop back to LLM
  → No: Return final response
```

**Implementation**:
```javascript
async function executeAgent(agentFilePath, userMessage, bundleRoot) {
  // PHASE 1: Initialize Agent
  const agent = await loadAgent(agentFilePath);
  const criticalContext = await processCriticalActions(agent.criticalActions, bundleRoot);

  // PHASE 2: Build initial message context
  let messages = [
    {
      role: 'system',
      content: buildSystemPrompt(agent)
    },
    ...criticalContext.messages,  // Files from critical-actions
    {
      role: 'user',
      content: userMessage
    }
  ];

  // PHASE 3: Agentic loop
  const maxIterations = 50;  // Prevent infinite loops
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    // Call OpenAI with function calling
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messages,
      tools: getToolDefinitions(),
      tool_choice: 'auto'
    });

    const assistantMessage = response.choices[0].message;

    // Add assistant message to context
    messages.push(assistantMessage);

    // Check for tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        const toolResult = await executeToolCall(toolCall, bundleRoot);

        // Add tool result to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }

      // Continue loop - LLM will process tool results in next iteration
      continue;
    }

    // No tool calls - agent is done
    return {
      success: true,
      response: assistantMessage.content,
      iterations: iterations,
      messages: messages
    };
  }

  // Max iterations reached
  throw new Error('Agent execution exceeded maximum iterations');
}
```

**Key Points**:
- Messages array grows with each tool call and result
- Loop continues until LLM returns without tool calls
- Each iteration gives LLM chance to process previous tool results
- Safety limit prevents infinite loops

---

### 4. Critical Actions Processor

**Purpose**: Parse and execute critical action instructions at agent initialization.

**Process**:
1. Parse `<critical-actions>` XML section
2. Identify file load instructions
3. Resolve path variables
4. Load files
5. Return as system messages for context

**Implementation**:
```javascript
async function processCriticalActions(criticalActions, bundleRoot) {
  const messages = [];

  for (const action of criticalActions) {
    const instruction = action.textContent.trim();

    // Pattern: "Load into memory {path} and set variables: var1, var2, var3"
    if (instruction.includes('Load into memory')) {
      const pathMatch = instruction.match(/\{[^}]+\}[^\s]*/);
      if (pathMatch) {
        const filePath = pathMatch[0];
        const resolvedPath = resolvePath(filePath, { bundleRoot });

        try {
          const fileContent = await fs.readFile(resolvedPath, 'utf-8');

          messages.push({
            role: 'system',
            content: `[Critical Action] Loaded file: ${resolvedPath}\n\n${fileContent}`
          });

          // If it's config.yaml, also parse and store variables
          if (filePath.includes('config.yaml')) {
            const config = YAML.parse(fileContent);
            // Store for variable resolution
            bundleConfig = config;
          }
        } catch (error) {
          console.error(`Failed to load critical file: ${resolvedPath}`, error);
        }
      }
    }

    // Other critical instructions become system messages
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

---

### 5. Path Resolution System

**Purpose**: Resolve path variables like `{bundle-root}`, `{core-root}`, etc.

**Variables to Support**:
- `{bundle-root}` → `bmad/custom/bundles/{bundle-name}/`
- `{core-root}` → `bmad/core/`
- `{project-root}` → Absolute path to BMAD installation
- `{config_source}` → Path to config.yaml (from workflow config)
- `{installed_path}` → Workflow directory path

**Implementation**:
```javascript
function resolvePath(pathTemplate, context) {
  let resolved = pathTemplate;

  // Replace path variables
  const replacements = {
    '{bundle-root}': context.bundleRoot,
    '{core-root}': context.coreRoot || 'bmad/core',
    '{project-root}': context.projectRoot || process.cwd(),
    '{installed_path}': context.installedPath,
    '{config_source}': context.configSource
  };

  for (const [variable, value] of Object.entries(replacements)) {
    if (value) {
      resolved = resolved.replace(variable, value);
    }
  }

  // Handle config variable references: {config_source}:variable_name
  const configRefMatch = resolved.match(/\{config_source\}:(\w+)/);
  if (configRefMatch && context.bundleConfig) {
    const varName = configRefMatch[1];
    const varValue = context.bundleConfig[varName];
    resolved = resolved.replace(configRefMatch[0], varValue || '');
  }

  return resolved;
}
```

**Variable Resolution Order**:
1. Load bundle config.yaml
2. Resolve path variables (`{bundle-root}`, etc.)
3. Resolve config references (`{config_source}:variable`)
4. Resolve system variables (`{date}`)
5. Prompt user for any unresolved variables

---

### 6. System Prompt Builder

**Purpose**: Create system prompt that instructs LLM on proper tool usage.

**Critical Elements**:
- Agent persona and role
- Explicit instructions to USE TOOLS, not just acknowledge
- Available commands and their descriptions
- Tool usage patterns

**Implementation**:
```javascript
function buildSystemPrompt(agent) {
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
  return `${cmd.cmd} - ${cmd.description}${cmd.runWorkflow ? `\n  Workflow: ${cmd.runWorkflow}` : ''}`;
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

---

### 7. Tool Execution Handler

**Purpose**: Route tool calls to appropriate handlers.

**Implementation**:
```javascript
async function executeToolCall(toolCall, bundleRoot) {
  const { name, arguments: argsString } = toolCall.function;
  const args = JSON.parse(argsString);

  const context = {
    bundleRoot,
    coreRoot: 'bmad/core',
    projectRoot: process.cwd(),
    bundleConfig: currentBundleConfig
  };

  switch (name) {
    case 'read_file':
      return await executeReadFile(args, context);

    case 'execute_workflow':
      return await executeWorkflow(args, context);

    case 'save_output':
      return await executeSaveOutput(args, context);

    default:
      return {
        success: false,
        error: `Unknown tool: ${name}`
      };
  }
}

async function executeReadFile(params, context) {
  const { file_path } = params;
  const resolvedPath = resolvePath(file_path, context);

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

async function executeSaveOutput(params, context) {
  const { file_path, content } = params;
  const resolvedPath = resolvePath(file_path, context);

  try {
    // Ensure directory exists
    const dir = path.dirname(resolvedPath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(resolvedPath, content, 'utf-8');

    return {
      success: true,
      path: resolvedPath,
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
```

---

### 8. Workflow Variable Resolution

**Purpose**: Resolve variables in workflow.yaml configuration.

**Process**:
1. Load workflow.yaml
2. Load config_source file (usually bundle config.yaml)
3. Replace `{config_source}:variable` with values from config
4. Replace path variables
5. Replace system variables (date, etc.)

**Implementation**:
```javascript
async function resolveWorkflowVariables(workflowConfig, bundleConfig) {
  const resolved = { ...workflowConfig };

  // Helper to resolve a single value
  function resolveValue(value) {
    if (typeof value !== 'string') return value;

    let result = value;

    // Resolve {config_source}:variable_name
    const configMatch = result.match(/\{config_source\}:(\w+)/g);
    if (configMatch) {
      configMatch.forEach(match => {
        const varName = match.split(':')[1];
        const varValue = bundleConfig[varName] || '';
        result = result.replace(match, varValue);
      });
    }

    // Resolve system variables
    if (result.includes('{date}')) {
      result = result.replace('{date}', new Date().toISOString().split('T')[0]);
    }

    return result;
  }

  // Recursively resolve all values
  function resolveObject(obj) {
    if (typeof obj === 'string') {
      return resolveValue(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(resolveObject);
    }
    if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = resolveObject(value);
      }
      return result;
    }
    return obj;
  }

  return resolveObject(resolved);
}
```

---

## Execution Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AGENT INITIALIZATION                                     │
├─────────────────────────────────────────────────────────────┤
│ • Load agent.md file                                        │
│ • Parse <critical-actions>                                  │
│ • Load config.yaml (via file read)                         │
│ • Build system prompt                                       │
│ • Create initial message context                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. USER INPUT                                               │
├─────────────────────────────────────────────────────────────┤
│ User: "*workflow-request"                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. LLM CALL (with tools)                                    │
├─────────────────────────────────────────────────────────────┤
│ • Send messages to OpenAI                                   │
│ • Include tool definitions                                  │
│ • tool_choice: 'auto'                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
          ┌───────────────┴───────────────┐
          │ Tool calls present?           │
          └───────────┬───────────────────┘
                 Yes  │  No
          ┌───────────┴──────────┐
          ↓                      ↓
┌──────────────────────┐  ┌─────────────────┐
│ 4. EXECUTE TOOLS     │  │ 6. RETURN       │
├──────────────────────┤  │    RESPONSE     │
│ • execute_workflow   │  ├─────────────────┤
│   - Load workflow    │  │ Final answer    │
│   - Load instructions│  │ to user         │
│   - Load template    │  └─────────────────┘
│ • Return results     │
└──────────────────────┘
          ↓
┌──────────────────────┐
│ 5. ADD TOOL RESULTS  │
│    TO CONTEXT        │
├──────────────────────┤
│ • Inject file content│
│ • Loop back to step 3│
└──────────────────────┘
          ↓
    (back to LLM call)
```

---

## Implementation Checklist

### Core Infrastructure
- [ ] Implement agentic execution loop
- [ ] Define tool schemas (read_file, execute_workflow, save_output)
- [ ] Implement tool execution handlers
- [ ] Build path resolution system
- [ ] Create system prompt builder

### Agent Loading
- [ ] Parse agent.md XML structure
- [ ] Extract critical-actions section
- [ ] Process critical actions at initialization
- [ ] Load config.yaml for variable resolution
- [ ] Build initial message context

### Workflow Execution
- [ ] Load workflow.yaml configuration
- [ ] Resolve workflow variables
- [ ] Load instructions.md file
- [ ] Load template files (if specified)
- [ ] Handle workflow step execution
- [ ] Support template-output tags

### Variable Resolution
- [ ] Resolve {bundle-root} path variable
- [ ] Resolve {core-root} path variable
- [ ] Resolve {config_source}:variable references
- [ ] Resolve {date} system variable
- [ ] Support nested variable resolution

### Error Handling
- [ ] Handle missing files gracefully
- [ ] Validate tool call parameters
- [ ] Prevent infinite loops (max iterations)
- [ ] Log tool executions for debugging
- [ ] Return meaningful error messages

### Optimization
- [ ] Cache loaded files (optional)
- [ ] Implement file size limits
- [ ] Monitor context window usage
- [ ] Stream responses for long-running workflows

---

## Key Differences: OpenAI API vs Claude Code

| Aspect | OpenAI API (Your Implementation) | Claude Code |
|--------|----------------------------------|-------------|
| **Tool System** | Custom function calling definitions | Built-in tool suite (Read, Write, Edit, etc.) |
| **Execution** | Manual agentic loop required | Automatic tool execution loop |
| **File Loading** | Explicit tool calls required | Direct file system access |
| **Context** | Must manually inject tool results | Automatic context management |
| **Pausing** | Loop waits for tool execution | Built-in pause mechanism |
| **State** | Maintained in messages array | Internal state management |

---

## Performance Considerations

### Context Window Management
- **Initial load**: Keep critical-actions minimal (config.yaml only)
- **Workflow load**: Load workflow + instructions + template (~5-10k tokens)
- **Progressive context**: Messages array grows with each tool call
- **Monitor usage**: Track total tokens to avoid exceeding model limits

### Lazy Loading Benefits
- **Startup time**: Fast initialization (only config.yaml)
- **Memory efficiency**: Only active workflow in context
- **Cost savings**: Fewer tokens per request
- **Scalability**: Supports agents with 10+ workflows

### Caching Strategy (Optional)
```javascript
const fileCache = new Map();

async function cachedReadFile(path) {
  if (fileCache.has(path)) {
    return fileCache.get(path);
  }

  const content = await fs.readFile(path, 'utf-8');
  fileCache.set(path, content);
  return content;
}
```

---

## Testing Strategy

### Unit Tests
- Path resolution with various variables
- Tool execution handlers
- Variable resolution in workflow configs
- Critical actions parsing

### Integration Tests
- Full agent initialization flow
- Workflow execution end-to-end
- Tool call loop with multiple iterations
- File saving and reading

### End-to-End Tests
- User invokes agent command
- Workflow loads and executes
- Template populated and saved
- Verify output file contents

---

## Example: Complete Execution Flow

**User Action**: Load Alex agent, invoke `*workflow-request`

**Step 1: Initialize Agent**
```javascript
const agent = await loadAgent('bmad/custom/bundles/requirements-workflow/agents/alex-facilitator.md');
// Parses: name="Alex", title="Requirements Facilitator"
// Extracts critical-actions: Load config.yaml

const criticalContext = await processCriticalActions(agent.criticalActions, bundleRoot);
// Loads: bmad/custom/bundles/requirements-workflow/config.yaml
// Returns: system message with config content
```

**Step 2: Build Context**
```javascript
messages = [
  {
    role: 'system',
    content: 'You are Alex, Requirements Facilitator...'
  },
  {
    role: 'system',
    content: '[Critical Action] Loaded file: config.yaml\n\nuser_name: Bryan...'
  },
  {
    role: 'user',
    content: '*workflow-request'
  }
];
```

**Step 3: First LLM Call**
```javascript
response = await openai.chat.completions.create({
  model: 'gpt-4-turbo',
  messages: messages,
  tools: [read_file, execute_workflow, save_output]
});

// LLM recognizes *workflow-request command
// Generates tool call: execute_workflow
assistantMessage = {
  role: 'assistant',
  content: null,
  tool_calls: [{
    id: 'call_abc123',
    function: {
      name: 'execute_workflow',
      arguments: '{"workflow_path": "{bundle-root}/workflows/intake-workflow/workflow.yaml"}'
    }
  }]
};
```

**Step 4: Execute Tool**
```javascript
toolResult = await executeWorkflow({
  workflow_path: '{bundle-root}/workflows/intake-workflow/workflow.yaml'
});

// Returns:
{
  success: true,
  workflow_name: 'intake-workflow',
  instructions: '# Workflow Instructions\n\n<step n="1">...',
  template: '# Initial Requirements\n\n## Problem Statement...',
  config: { ... }
}
```

**Step 5: Add Tool Result to Context**
```javascript
messages.push({
  role: 'tool',
  tool_call_id: 'call_abc123',
  content: JSON.stringify(toolResult)
});
```

**Step 6: Second LLM Call**
```javascript
// LLM now has workflow instructions and template
// Processes workflow steps
// May generate more tool calls (read_file for additional resources)
// Or returns final response with generated content
```

**Step 7: Save Output (if workflow generates content)**
```javascript
// LLM calls save_output tool
toolCall = {
  function: {
    name: 'save_output',
    arguments: JSON.stringify({
      file_path: '{output_folder}/requirements-2025-10-05.md',
      content: 'Generated requirements document...'
    })
  }
};

await executeSaveOutput({
  file_path: '{output_folder}/requirements-2025-10-05.md',
  content: 'Generated requirements document...'
});
```

---

## Common Pitfalls to Avoid

### 1. Not Using Tool Calling
**Problem**: Treating agent instructions as text documentation
**Solution**: Use OpenAI's function calling with tools defined

### 2. Pre-loading All Files
**Problem**: Loading all workflows at initialization
**Solution**: Use lazy loading - only load on tool call

### 3. Forgetting to Loop
**Problem**: Single LLM call without handling tool responses
**Solution**: Implement while loop that continues until no tool calls

### 4. Ignoring Path Resolution
**Problem**: Hardcoded paths or missing variable replacement
**Solution**: Implement comprehensive path resolution system

### 5. Missing System Prompts
**Problem**: LLM doesn't know to use tools
**Solution**: Explicit system prompt instructions about tool usage

---

## Security Considerations

### File Access Control
- **Restrict reads** to bundle-root and core-root only
- **Prevent path traversal**: Validate resolved paths stay within allowed directories
- **Whitelist directories**: Only allow reads from known safe locations

### Tool Execution Limits
- **Max iterations**: Prevent infinite loops (recommended: 50)
- **Timeout**: Set execution timeout per agent call
- **Rate limiting**: Prevent abuse of tool calls

### Path Validation
```javascript
function validatePath(resolvedPath, bundleRoot, coreRoot) {
  const normalized = path.normalize(resolvedPath);

  // Must be within bundle-root or core-root
  const inBundle = normalized.startsWith(path.normalize(bundleRoot));
  const inCore = normalized.startsWith(path.normalize(coreRoot));

  if (!inBundle && !inCore) {
    throw new Error(`Access denied: Path outside allowed directories: ${normalized}`);
  }

  return normalized;
}
```

---

## API Usage Patterns

### Recommended OpenAI Settings

```javascript
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo',        // or 'gpt-4o' for better tool use
  messages: messages,
  tools: toolDefinitions,
  tool_choice: 'auto',         // Let model decide when to use tools
  temperature: 0.7,            // Balanced creativity/consistency
  max_tokens: 4096,            // Sufficient for most responses
});
```

### Parallel Tool Calling (Optional)
OpenAI supports parallel tool calls. If LLM needs to load multiple files:
```javascript
tool_calls: [
  { function: { name: 'read_file', arguments: '{"file_path": "config.yaml"}' } },
  { function: { name: 'read_file', arguments: '{"file_path": "template.md"}' } }
]
```

Execute in parallel for efficiency:
```javascript
const results = await Promise.all(
  assistantMessage.tool_calls.map(tc => executeToolCall(tc, bundleRoot))
);
```

---

## Migration from Simple API Usage

### Before (Simple API - Doesn't Work)
```javascript
async function askAgent(agentFile, question) {
  const agentContent = await fs.readFile(agentFile, 'utf-8');

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: agentContent },
      { role: 'user', content: question }
    ]
  });

  return response.choices[0].message.content;
}

// Problem: Agent instructions to load files are ignored
```

### After (Agentic Loop - Works)
```javascript
async function askAgent(agentFile, question) {
  // Initialize agent with critical actions
  const agent = await loadAgent(agentFile);
  const context = await processCriticalActions(agent.criticalActions);

  let messages = [
    { role: 'system', content: buildSystemPrompt(agent) },
    ...context.messages,
    { role: 'user', content: question }
  ];

  // Agentic loop
  while (true) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      tools: getToolDefinitions(),
      tool_choice: 'auto'
    });

    const msg = response.choices[0].message;
    messages.push(msg);

    if (msg.tool_calls) {
      // Execute tools and add results
      for (const tc of msg.tool_calls) {
        const result = await executeToolCall(tc);
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result)
        });
      }
      continue;
    }

    return msg.content;
  }
}

// Solution: Tools are executed, files are loaded, agent has full context
```

---

## Debugging and Monitoring

### Logging Strategy
```javascript
function logToolCall(toolCall, result) {
  console.log(`[TOOL] ${toolCall.function.name}`);
  console.log(`  Args: ${toolCall.function.arguments}`);
  console.log(`  Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  if (!result.success) {
    console.error(`  Error: ${result.error}`);
  }
}

function logIteration(iteration, messageCount, hasToolCalls) {
  console.log(`[LOOP] Iteration ${iteration}`);
  console.log(`  Messages: ${messageCount}`);
  console.log(`  Tool Calls: ${hasToolCalls ? 'YES' : 'NO'}`);
}
```

### Metrics to Track
- Tool call frequency per agent type
- Average iterations per agent session
- File load times
- Context window usage
- Tool execution errors

---

## Future Enhancements

### 1. Streaming Support
Stream LLM responses for better UX:
```javascript
const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: messages,
  tools: tools,
  stream: true
});

for await (const chunk of stream) {
  // Handle streaming chunks
  // Buffer tool calls across chunks
}
```

### 2. Agent-to-Agent Communication
Enable agents to invoke other agents:
```javascript
{
  name: 'invoke_agent',
  description: 'Call another agent from the bundle',
  parameters: {
    agent_id: 'casey-analyst',
    message: 'User message to pass'
  }
}
```

### 3. Workflow State Persistence
Save workflow state for resume later:
```javascript
{
  name: 'save_workflow_state',
  description: 'Save current workflow progress',
  parameters: {
    workflow_id: 'intake-workflow-session-123',
    state: { current_step: 3, data: {...} }
  }
}
```

### 4. Batch Processing
Execute workflows on multiple inputs:
```javascript
{
  name: 'execute_workflow_batch',
  description: 'Run workflow on array of inputs',
  parameters: {
    workflow_path: '...',
    inputs: [{...}, {...}, {...}]
  }
}
```

---

## Summary

### What You Need to Build

1. **Agentic Execution Loop** - While loop that handles tool calls until completion
2. **Tool Definitions** - read_file, execute_workflow, save_output minimum
3. **Tool Execution Handlers** - Functions that actually perform file operations
4. **Path Resolution System** - Handle {bundle-root}, {core-root}, {config_source}:var
5. **Critical Actions Processor** - Load files specified in <critical-actions> at init
6. **System Prompt Builder** - Instruct LLM to actively use tools
7. **Variable Resolution** - Resolve workflow config variables from bundle config

### Why This Approach Works

- **Tool calling forces execution** - LLM must explicitly call tools, not just describe
- **Loop enables lazy loading** - Files loaded only when needed via tool calls
- **Context grows dynamically** - Tool results injected as conversation continues
- **Claude Code parity** - Same pause-load-continue pattern

### Expected Behavior

User invokes agent → Agent loads config → User triggers command → Agent calls execute_workflow tool → Workflow files loaded → Instructions executed → Output saved → User receives result

All file loading happens **on-demand via tool calls**, not pre-loaded.

---

## Contact and Support

For questions about this specification:
- Review BUNDLE-SPEC.md for bundle structure details
- Check example implementation in bmad/custom/bundles/requirements-workflow/
- Reference OpenAI function calling documentation

---

**Specification Version**: 1.0
**Date**: 2025-10-05
**Author**: BMAD Architecture Team
