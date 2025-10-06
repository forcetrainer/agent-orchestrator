# Troubleshooting Guide - Agent Execution & Bundle System

This guide helps diagnose and fix common issues with Epic 4's agent execution architecture and bundle system.

---

## Common Issue: Agent Doesn't Load Files

**Symptoms:**
- Agent acknowledges file load instruction but doesn't actually load the file
- Workflow fails because required files are missing from context
- Agent says "I'll load the file" but then can't access the content

**Cause:**
The agent's system prompt doesn't include explicit instructions to use tools, or the agentic execution loop isn't properly configured.

**Solution:**

1. **Verify system prompt includes tool usage instructions:**
   - Check `lib/agents/systemPromptBuilder.ts`
   - System prompt MUST explicitly tell LLM to use tools, not just acknowledge them
   - Example: "When you need to load a file, you MUST use the read_file tool"

2. **Verify agentic loop is running:**
   - Check logs for `[agenticLoop] Iteration X/Y` messages
   - If no iterations logged, the agentic loop isn't being used
   - Ensure `lib/agents/agenticLoop.ts` is being called, not a simple API wrapper

3. **Verify tool definitions are passed to OpenAI:**
   - Check that `tools` parameter is included in `openai.chat.completions.create()` call
   - Verify tool definitions include `read_file`, `execute_workflow`, `save_output`
   - Check `lib/tools/toolDefinitions.ts` for proper tool schemas

**Debugging Tips:**
```bash
# Enable debug logging
export DEBUG=agent:*

# Check if tools are being called
grep "Tool call:" logs/agent-execution.log

# Verify tool results are being injected
grep "Tool result:" logs/agent-execution.log
```

---

## Common Issue: Path Variables Not Resolving

**Symptoms:**
- Error: "Unable to resolve variables in path: {bundle-root}/..."
- Error: "Config variable not found: output_folder"
- Files not found at expected paths

**Cause:**
Path variables aren't being resolved before file operations, or config.yaml isn't loaded during critical actions.

**Solution:**

1. **Verify config.yaml is loaded in critical actions:**
   ```xml
   <critical-actions>
     <i>Load into memory {bundle-root}/config.yaml and set variables: user_name, output_folder</i>
   </critical-actions>
   ```
   - Config MUST be loaded before other critical actions that reference config variables
   - Check agent.md file for <critical-actions> section

2. **Check path resolution order:**
   - Path resolution order: config references → system variables → path variables → nested
   - If using `{config_source}:variable_name`, ensure config is loaded first
   - See: `lib/pathResolver.ts` lines 362-370 for resolution order

3. **Verify bundle root is set correctly:**
   ```typescript
   // Check PathContext
   const context = {
     bundleRoot: 'bmad/custom/bundles/{bundle-name}',  // Must be correct
     coreRoot: 'bmad/core',
     projectRoot: process.cwd(),
     bundleConfig: { /* loaded config */ }
   };
   ```

4. **Test path resolution manually:**
   ```typescript
   import { resolvePath, createPathContext } from '@/lib/pathResolver';

   const context = createPathContext('requirements-workflow');
   const resolved = resolvePath('{bundle-root}/workflows/intake.yaml', context);
   console.log('Resolved path:', resolved);
   ```

**Debugging Tips:**
```bash
# Check what variables are in config
cat bmad/custom/bundles/{bundle-name}/config.yaml

# Check if path resolution is being called
grep "resolvePath" logs/agent-execution.log

# Check for path resolution errors
grep "Unable to resolve variables" logs/agent-execution.log
```

**Common Mistakes:**
- Using `{project-root}/bmad/sn/` instead of `{bundle-root}/` (deprecated Epic 2 path)
- Referencing config variable before config.yaml is loaded in critical actions
- Typos in variable names (e.g., `{bundl-root}` instead of `{bundle-root}`)

---

## Common Issue: Critical Actions Failing

**Symptoms:**
- Error: "Critical action failed: Load into memory..."
- Agent initialization halts
- Agent never becomes available for user interaction

**Cause:**
Critical actions are failing during agent initialization, usually due to missing files or malformed instructions.

**Solution:**

1. **Check file paths in critical actions:**
   - Verify files exist at specified paths
   - Use `{bundle-root}/` prefix for bundle files
   - Example: `{bundle-root}/config.yaml` not `config.yaml`

2. **Verify critical actions syntax:**
   ```xml
   <!-- Correct -->
   <critical-actions>
     <i>Load into memory {bundle-root}/config.yaml and set variables: user_name</i>
     <i>Remember the user's name is {user_name}</i>
   </critical-actions>

   <!-- Incorrect - missing path prefix -->
   <critical-actions>
     <i>Load into memory config.yaml</i>  ❌ Missing {bundle-root}/
   </critical-actions>
   ```

3. **Check execution order:**
   - Config file MUST be loaded before instructions that use config variables
   - Critical actions execute in order (top to bottom)
   - If instruction uses `{user_name}`, config with `user_name` must be loaded first

4. **Verify file permissions:**
   ```bash
   # Check if files are readable
   ls -la bmad/custom/bundles/{bundle-name}/config.yaml
   ```

**Debugging Tips:**
```bash
# Check critical actions processing
grep "criticalActions" logs/agent-execution.log

# Check which files are being loaded
grep "Loaded file:" logs/agent-execution.log

# Check for critical action failures
grep "Critical action failed" logs/agent-execution.log
```

---

## Common Issue: Workflow Execution Hangs

**Symptoms:**
- Workflow starts but never completes
- Agent stuck in loop, repeating same tool calls
- Hits MAX_ITERATIONS limit (50 iterations)

**Cause:**
Infinite loop in agentic execution, usually due to LLM repeatedly requesting the same resource.

**Solution:**

1. **Check iteration count:**
   - If hitting MAX_ITERATIONS (50), there's likely an infinite loop
   - Review logs for repeated tool calls

2. **Verify tool results are being injected:**
   ```typescript
   // In agenticLoop.ts, verify this pattern:
   for (const toolCall of assistantMessage.tool_calls) {
     const result = await executeToolCall(toolCall, pathContext);

     // THIS IS CRITICAL - must inject result
     messages.push({
       role: 'tool',
       tool_call_id: toolCall.id,
       content: JSON.stringify(result),
     });
   }
   ```

3. **Check for tool execution errors:**
   - If tools fail silently, LLM may retry indefinitely
   - Verify tool results include `success: true/false`
   - Check error messages are being returned to LLM

4. **Review system prompt:**
   - System prompt should instruct LLM to proceed after tool results
   - Avoid instructions that cause endless file loading

**Debugging Tips:**
```bash
# Check iteration count
grep "Iteration [0-9]*/50" logs/agent-execution.log

# Check for repeated tool calls (same file requested multiple times)
grep "Tool call: read_file" logs/agent-execution.log | sort | uniq -c

# Check for tool result injection
grep "Tool result:" logs/agent-execution.log
```

**Manual Testing:**
```typescript
// Test the agentic loop with minimal example
import { executeAgent } from '@/lib/agents/agenticLoop';

try {
  const result = await executeAgent('test-agent', 'Hello', []);
  console.log('Iterations:', result.iterations);  // Should be < 50
  console.log('Success:', result.success);
} catch (err) {
  console.error('Loop failed:', err.message);
}
```

---

## Common Issue: Bundle Not Found

**Symptoms:**
- Error: "Bundle not found: {bundle-name}"
- Agent doesn't appear in agent selection menu
- Bundle.yaml not being recognized

**Cause:**
Bundle structure is incorrect or bundle.yaml has syntax errors.

**Solution:**

1. **Verify bundle directory structure:**
   ```
   bmad/custom/bundles/{bundle-name}/
   ├── bundle.yaml          ✅ Required
   ├── config.yaml          ✅ Required for multi-agent bundles
   └── agents/              ✅ Required
       └── agent.md
   ```

2. **Validate bundle.yaml syntax:**
   ```yaml
   type: bundle                    # or 'standalone'
   name: your-bundle-name          # Must match directory name
   version: 1.0.0
   description: "Bundle description"

   agents:
     - id: agent-id
       name: Agent Name
       title: Agent Title
       file: agents/agent.md       # Path relative to bundle root
       entry_point: true           # At least one agent must have this
   ```

3. **Check for YAML syntax errors:**
   ```bash
   # Validate YAML syntax
   npm install -g js-yaml
   js-yaml bmad/custom/bundles/{bundle-name}/bundle.yaml
   ```

4. **Verify entry_point is set:**
   - At least one agent must have `entry_point: true`
   - Without entry_point, agent won't appear in selection menu

**Debugging Tips:**
```bash
# Check if bundle directory exists
ls -la bmad/custom/bundles/{bundle-name}/

# Validate bundle.yaml
cat bmad/custom/bundles/{bundle-name}/bundle.yaml

# Check bundle scanner logs
grep "Bundle scan" logs/agent-execution.log
```

---

## Common Issue: Security Violation Errors

**Symptoms:**
- Error: "Security violation: Access denied"
- Error: "Security violation: Path outside allowed directories"
- Files exist but can't be read

**Cause:**
Path security validation prevents access to files outside allowed directories (bundleRoot, coreRoot, projectRoot).

**Solution:**

1. **Verify path is within allowed directories:**
   - Allowed: `{bundle-root}/`, `{core-root}/`, `{project-root}/`
   - Not allowed: `/etc/`, `/Users/{user}/Desktop/`, `../../`

2. **Check for path traversal attempts:**
   ```bash
   # These will be blocked:
   {bundle-root}/../../../etc/passwd  ❌ Path traversal
   /etc/passwd                         ❌ Outside allowed dirs

   # These will work:
   {bundle-root}/config.yaml          ✅ Within bundle
   {core-root}/tasks/workflow.md      ✅ Within core
   ```

3. **Review symbolic links:**
   - Symbolic links are followed and validated
   - If symlink points outside allowed directories, access is denied
   - Check logs for "Symbolic link resolved" warnings

4. **Verify security validation is working:**
   ```typescript
   // In pathResolver.ts
   validatePathSecurity(resolvedPath, context);
   ```

**Debugging Tips:**
```bash
# Check for security violations
grep "Security violation" logs/agent-execution.log

# Check for symlink warnings
grep "Symbolic link resolved" logs/agent-execution.log

# Verify resolved path
console.log('Resolved path:', resolvedPath);
console.log('Bundle root:', context.bundleRoot);
console.log('Starts with bundle root?', resolvedPath.startsWith(context.bundleRoot));
```

---

## Debugging Checklist

When encountering issues, work through this checklist:

### 1. Check Logs
```bash
# Enable debug logging
export DEBUG=agent:*

# Check agent execution logs
tail -f logs/agent-execution.log

# Check for errors
grep "Error\|Failed\|Security violation" logs/agent-execution.log
```

### 2. Verify Path Resolution
```typescript
// Test path resolution
import { resolvePath, createPathContext } from '@/lib/pathResolver';

const context = createPathContext('your-bundle-name');
console.log('Bundle root:', context.bundleRoot);

const testPath = '{bundle-root}/config.yaml';
const resolved = resolvePath(testPath, context);
console.log('Resolved:', resolved);
```

### 3. Test Critical Actions
```bash
# Check if config is being loaded
grep "Parsed config.yaml" logs/agent-execution.log

# Check which critical actions are executing
grep "Critical action" logs/agent-execution.log
```

### 4. Verify Agentic Loop
```bash
# Check iteration count (should be 1-10 for most workflows)
grep "Iteration [0-9]*/50" logs/agent-execution.log

# Check tool calls
grep "Tool call:" logs/agent-execution.log

# Check tool results
grep "Tool result:" logs/agent-execution.log
```

### 5. Validate Bundle Structure
```bash
# Check bundle.yaml exists and is valid
cat bmad/custom/bundles/{bundle-name}/bundle.yaml

# Check agent files exist
ls -la bmad/custom/bundles/{bundle-name}/agents/

# Check config.yaml exists
cat bmad/custom/bundles/{bundle-name}/config.yaml
```

---

## Getting Help

If you're still stuck after working through this guide:

1. **Check the specs:**
   - [AGENT-EXECUTION-SPEC.md](./AGENT-EXECUTION-SPEC.md) - Agentic execution architecture (includes detailed execution flow examples in appendix)
   - [BUNDLE-SPEC.md](./BUNDLE-SPEC.md) - Bundle structure and manifest format

2. **Review the implementation:**
   - `lib/agents/agenticLoop.ts` - Main execution loop
   - `lib/pathResolver.ts` - Path variable resolution
   - `lib/agents/criticalActions.ts` - Critical actions processor

3. **Check existing tests:**
   - `lib/agents/__tests__/agenticLoop.test.ts`
   - `lib/__tests__/pathResolver.test.ts`
   - `lib/agents/__tests__/criticalActions.test.ts`

4. **Enable verbose logging:**
   ```typescript
   // In agenticLoop.ts, systemPromptBuilder.ts, pathResolver.ts, criticalActions.ts
   console.log('[module] Detailed debug message');
   ```

---

## Quick Reference

### Path Variables
- `{bundle-root}` → `bmad/custom/bundles/{bundle-name}/`
- `{core-root}` → `bmad/core/`
- `{project-root}` → Project root directory
- `{config_source}:variable_name` → Value from config.yaml

### Resolution Order
1. Config references
2. System variables
3. Path variables
4. Nested resolution (repeat 1-3)

### Common Commands
```bash
# Test agent execution
npm run dev

# Run tests
npm test

# Check bundle structure
ls -la bmad/custom/bundles/{bundle-name}/

# Validate YAML
js-yaml bundle.yaml
```

---

**Last Updated:** 2025-10-05
**Related Specs:** [AGENT-EXECUTION-SPEC.md](./AGENT-EXECUTION-SPEC.md), [BUNDLE-SPEC.md](./BUNDLE-SPEC.md)
