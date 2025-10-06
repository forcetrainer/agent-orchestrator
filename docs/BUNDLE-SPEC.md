# BMAD Agent Bundle Specification v1.0

## Overview

BMAD Agent Bundles are self-contained packages that contain one or more AI agents, their workflows, templates, and configuration. Bundles are designed to be uploaded to a server where they can be loaded and executed by end users.

---

## Directory Structure

### Multi-Agent Bundle
```
bmad/custom/bundles/{bundle-name}/
├── bundle.yaml                 # REQUIRED: Bundle manifest
├── config.yaml                 # REQUIRED: Bundle configuration
├── agents/                     # REQUIRED: Agent files directory
│   ├── {agent-1}.md
│   ├── {agent-2}.md
│   └── {agent-n}.md
├── workflows/                  # OPTIONAL: Bundle-specific workflows
│   ├── {workflow-name}/
│   │   ├── workflow.yaml
│   │   └── instructions.md
│   └── ...
└── templates/                  # OPTIONAL: Templates used by workflows
    ├── {template-1}.md
    └── {template-n}.md
```

### Standalone Agent Bundle
```
bmad/custom/bundles/{bundle-name}/
├── bundle.yaml                 # REQUIRED: Bundle manifest
├── config.yaml                 # OPTIONAL: Bundle configuration
├── agent.md                    # REQUIRED: Single agent file
└── workflows/                  # OPTIONAL: Agent workflows
    └── ...
```

---

## File Specifications

### 1. bundle.yaml (REQUIRED)

The bundle manifest defines the bundle type, agents, and dependencies.

#### Multi-Agent Bundle Example
```yaml
# Bundle metadata
type: bundle                    # REQUIRED: "bundle" for multi-agent
name: requirements-workflow     # REQUIRED: Unique bundle identifier (kebab-case)
version: 1.0.0                  # REQUIRED: Semantic version
description: "Bundle description"  # REQUIRED: Human-readable description
author: "Author Name"           # OPTIONAL: Creator name
created: 2025-10-05            # OPTIONAL: Creation date

# Agent definitions
agents:                         # REQUIRED: Array of agents in bundle
  - id: agent-id               # REQUIRED: Unique agent identifier (kebab-case)
    name: Agent Name           # REQUIRED: Display name
    title: Agent Title         # REQUIRED: Role/title
    file: agents/agent-file.md # REQUIRED: Relative path from bundle root
    entry_point: true          # REQUIRED: Can users start here? (true/false)
    description: "Agent desc"  # OPTIONAL: What this agent does

  - id: another-agent
    name: Another
    title: Another Title
    file: agents/another.md
    entry_point: false
    description: "Called by other agents"

# Bundle resources
resources:                      # OPTIONAL: Bundle resource directories
  workflows: workflows/         # Path to workflows directory
  templates: templates/         # Path to templates directory
  config: config.yaml          # Path to config file

# Core dependencies (read-only from server)
core_dependencies:              # OPTIONAL: Required core BMAD files
  - bmad/core/tasks/workflow.md
  - bmad/core/tasks/adv-elicit.md
```

#### Standalone Agent Bundle Example
```yaml
type: standalone               # REQUIRED: "standalone" for single agent
name: data-analyst
version: 1.0.0
description: "Data analysis agent"

# Single agent definition
agent:                         # REQUIRED: Single agent object
  id: data-analyst
  name: Data Analyst
  title: Data Analysis Expert
  file: agent.md              # Agent file in bundle root

resources:
  workflows: workflows/        # OPTIONAL

core_dependencies:
  - bmad/core/tasks/workflow.md
```

---

### 2. config.yaml (REQUIRED for multi-agent, OPTIONAL for standalone)

Bundle-specific configuration variables.

```yaml
# Bundle Configuration
# Used by agents and workflows within the bundle

# User settings
user_name: Bryan
communication_language: English

# Output settings
output_folder: "{project-root}/docs"
sn_projects_folder: "{output_folder}/sn-projects"

# Project metadata
project_name: "ServiceNow Requirements Workflow"

# Feature flags
src_impact: false              # If true, affects source code

# Custom variables
# Add any bundle-specific variables here
custom_variable: "value"
```

**Variable Types:**
- String literals: `"value"`
- Path references: `"{project-root}/path/to/folder"`
- Nested references: `"{config_source}:variable_name"`

---

### 3. Agent Files (.md)

Agent files define AI agent personas, commands, and behavior.

#### Agent File Structure
```xml
<!-- Powered by BMAD-CORE™ -->

# Agent Title

<agent id="bmad/custom/bundles/{bundle-name}/agents/{agent-file}.md"
       name="AgentName"
       title="Agent Title"
       icon="🤖">

  <persona>
    <role>Role Title + Specialization</role>

    <identity>
    Background, expertise, experience. What makes this agent unique.
    2-4 sentences describing the agent's professional identity.
    </identity>

    <communication_style>
    How the agent communicates. Tone, approach, style.
    2-3 sentences describing communication patterns.
    </communication_style>

    <principles>
    Core beliefs and operating principles.
    Start with "I believe..." or "I operate..."
    5-8 lines of guiding principles.
    </principles>
  </persona>

  <critical-actions>
    <i>Load into memory {bundle-root}/config.yaml and set variables: var1, var2, var3</i>
    <i>Remember the user's name is {user_name}</i>
    <i>ALWAYS communicate in {communication_language}</i>
    <i>Any initialization actions or constraints</i>
  </critical-actions>

  <cmds>
    <c cmd="*help">Show numbered cmd list</c>
    <c cmd="*yolo">Toggle Yolo Mode</c>

    <c cmd="*command-name"
       run-workflow="{bundle-root}/workflows/workflow-name/workflow.yaml">
      Command description
    </c>

    <c cmd="*another-command"
       exec="{core-root}/tasks/task-name.md">
      Execute a core task
    </c>

    <c cmd="*exit">Exit with confirmation</c>
  </cmds>
</agent>
```

**Agent File Requirements:**
- `id`: Full path from project root
- `name`: Short display name (1-2 words)
- `title`: Role description
- `icon`: Single emoji representing the agent
- All `<persona>` sections required
- At minimum: `*help`, `*exit` commands

---

### 4. Workflow Files

Workflows are stored in `workflows/{workflow-name}/` directories.

#### workflow.yaml Structure
```yaml
# Workflow Configuration
name: "workflow-name"
description: "What this workflow does"
author: "Author Name"

# Variable resolution
config_source: "{bundle-root}/config.yaml"
output_folder: "{config_source}:output_folder"
user_name: "{config_source}:user_name"
communication_language: "{config_source}:communication_language"
date: system-generated

# Workflow components
installed_path: "{bundle-root}/workflows/{workflow-name}"
template: "{bundle-root}/templates/template-name.md"
instructions: "{installed_path}/instructions.md"

# Output configuration
default_output_file: "{output_folder}/{filename}.md"

# Workflow type
template: true   # true = generates document, false = action workflow
```

#### instructions.md Structure
```markdown
# Workflow Instructions

<workflow>

<step n="1" goal="Step description">
<action>What to do</action>
<check>Condition to verify</check>
<ask>Question for user</ask>

<template-output>section_name</template-output>
</step>

<step n="2" goal="Next step">
...
</step>

</workflow>
```

---

## Path Variables

Bundles use special path variables that are resolved at runtime.

### Bundle-Scoped Variables

**`{bundle-root}`**
- Resolves to: `bmad/custom/bundles/{bundle-name}/`
- Use for: Local bundle resources (workflows, templates, config)
- Example: `{bundle-root}/workflows/intake/workflow.yaml`
- Scope: Bundle-local files only

**`{config_source}`**
- Resolves to: Path specified in workflow config_source field
- Use for: Loading configuration variables
- Example: `{config_source}:user_name`
- Scope: Configuration reference

**`{installed_path}`**
- Resolves to: Path specified in workflow installed_path field
- Use for: Workflow-local files
- Example: `{installed_path}/instructions.md`
- Scope: Workflow-local files

### System-Wide Variables

**`{core-root}`**
- Resolves to: `bmad/core/`
- Use for: Core BMAD tasks and workflows (read-only)
- Example: `{core-root}/tasks/workflow.md`
- Scope: BMAD core system files

**`{project-root}`**
- Resolves to: Absolute path to BMAD installation
- Use for: Cross-bundle references (discouraged)
- Example: `{project-root}/bmad/custom/bundles/other-bundle/`
- Scope: Entire project

### Configuration Variables

Variables loaded from config.yaml:
- `{user_name}` - User's name
- `{communication_language}` - Language for agent communication
- `{output_folder}` - Where to save generated files
- `{agent_outputs_folder}` - Where agent session outputs are saved (default: `{project-root}/data/agent-outputs`)
- `{project_name}` - Project identifier
- Custom variables defined in bundle config.yaml

### System-Generated Variables
- `{date}` - Current date (system-generated at runtime)
- `{session_id}` - UUID v4 session identifier (auto-generated by workflow engine)

---

## Session-Based Output Management

BMAD workflows use a session-based output system that isolates agent outputs in unique session directories. This enables discoverability, traceability, and security.

### Session Directory Structure

All agent outputs are stored in session-specific directories:

```
{agent_outputs_folder}/
└── {session-uuid}/
    ├── manifest.json
    └── [agent-generated files and subdirectories]
```

### Session Variables in Workflows

Workflows should include these session-related variables:

```yaml
# Session variables (auto-populated by workflow engine)
session_id: ""  # Engine generates UUID v4
session_folder: "{config_source}:agent_outputs_folder/{{session_id}}"
manifest_file: "{session_folder}/manifest.json"

# Output file paths (agent-specific)
default_output_file: "{session_folder}/output.md"
```

### Manifest Auto-Generation

The workflow engine automatically creates and manages `manifest.json` in each session folder:

**On workflow start:**
- Generates UUID v4 for session
- Creates session folder
- Writes initial manifest with status: "running"

**On workflow completion:**
- Updates manifest with completion timestamp
- Sets final status: "completed", "failed", or "cancelled"

### Session Discovery

Agents can discover outputs from other agents using session discovery APIs:

```typescript
// Find sessions by agent and workflow
findSessions({
  agent: "casey",
  workflow: /^deep-dive-/,
  status: "completed"
})
```

For complete session output specification, see: **docs/SESSION-OUTPUT-SPEC.md**

---

## Variable Resolution Order

1. **Load config_source** - Read bundle config.yaml
2. **Resolve config references** - Replace `{config_source}:var` with values
3. **Resolve system variables** - Replace `{date}` with current date
4. **Resolve path variables** - Replace `{bundle-root}`, `{core-root}`, etc.
5. **Ask user for unknowns** - Prompt for any unresolved variables

---

## Bundle Types

### Type: `bundle` (Multi-Agent)
- Contains multiple agents that may collaborate
- Shared resources (workflows, templates)
- Agents can call each other's workflows
- Use when: Agents work together on related tasks

### Type: `standalone` (Single Agent)
- Contains one agent
- Optional workflows
- Self-contained functionality
- Use when: Agent operates independently

---

## Security Model

### Protected Directories (Read-Only on Server)
```
bmad/core/          # Core BMAD tasks and workflows
bmad/bmm/           # BMAD core modules
bmad/cis/           # BMAD core modules
bmad/bmb/           # BMAD builder tools
```

### User Space (Upload Target)
```
bmad/custom/bundles/    # User-created bundles
```

**Rules:**
1. Bundles can only read from `{core-root}` (never write)
2. Bundles can read/write within `{bundle-root}`
3. Bundles should NOT reference other bundles
4. Server enforces path restrictions

---

## Server Integration

### Loading Bundles

Server scans `bmad/custom/bundles/` and:
1. Reads each `bundle.yaml`
2. Validates bundle structure
3. Registers agents with entry_point: true
4. Resolves path variables
5. Makes agents available to users

### Path Resolution on Server

```javascript
// Pseudocode
function resolvePath(path, bundleName) {
  return path
    .replace('{bundle-root}', `bmad/custom/bundles/${bundleName}`)
    .replace('{core-root}', 'bmad/core')
    .replace('{project-root}', SERVER_ROOT);
}
```

### Agent Discovery

```javascript
// Load all bundles
function loadBundles() {
  const bundleDirs = scanDirectory('bmad/custom/bundles/');

  bundleDirs.forEach(bundleDir => {
    const manifest = readYAML(`${bundleDir}/bundle.yaml`);

    if (manifest.type === 'bundle') {
      // Multi-agent bundle
      manifest.agents.forEach(agent => {
        if (agent.entry_point) {
          registerAgent({
            id: agent.id,
            name: agent.name,
            title: agent.title,
            path: `${bundleDir}/${agent.file}`,
            bundle: manifest.name
          });
        }
      });
    } else if (manifest.type === 'standalone') {
      // Standalone agent
      registerAgent({
        id: manifest.agent.id,
        name: manifest.agent.name,
        title: manifest.agent.title,
        path: `${bundleDir}/${manifest.agent.file}`,
        bundle: manifest.name
      });
    }
  });
}
```

---

## Validation Requirements

### Bundle Validation Checklist

- [ ] `bundle.yaml` exists and is valid YAML
- [ ] `type` is either "bundle" or "standalone"
- [ ] `name` is unique and kebab-case
- [ ] `version` follows semantic versioning
- [ ] All agent files referenced in manifest exist
- [ ] At least one agent has `entry_point: true`
- [ ] All workflow paths are valid
- [ ] All template paths are valid
- [ ] No references to `{project-root}/bmad/sn/` (deprecated)
- [ ] All `{bundle-root}` paths resolve correctly
- [ ] config.yaml exists if referenced

### Agent File Validation

- [ ] Valid XML structure
- [ ] `<agent>` tag has id, name, title, icon attributes
- [ ] `<persona>` contains: role, identity, communication_style, principles
- [ ] `<cmds>` contains at minimum: *help, *exit
- [ ] All workflow paths use `{bundle-root}` not `{project-root}/bmad/sn/`
- [ ] Agent id matches file path

---

## Example Bundle: requirements-workflow

Real-world multi-agent bundle structure:

```
bmad/custom/bundles/requirements-workflow/
├── bundle.yaml
├── config.yaml
├── agents/
│   ├── alex-facilitator.md      # Entry point: Gathers initial requirements
│   ├── casey-analyst.md          # Entry point: Guides deep-dive sessions
│   └── pixel-story-developer.md  # Entry point: Creates user stories
├── workflows/
│   ├── intake-workflow/
│   │   ├── workflow.yaml
│   │   └── instructions.md
│   ├── deep-dive-workflow/
│   │   ├── workflow.yaml
│   │   └── instructions.md
│   ├── build-stories/
│   │   ├── workflow.yaml
│   │   └── instructions.md
│   └── ... (12 more workflows)
└── templates/
    ├── initial-requirements.md
    ├── detailed-requirements.md
    ├── epic-template.md
    └── story-template.md
```

**Workflow:**
1. User starts with Alex → Gathers initial requirements
2. User moves to Casey → Deep-dive analysis
3. User works with Pixel → Creates user stories
4. All agents share templates and config
5. All workflows use `{bundle-root}` for resources

---

## Migration from Old Structure

Old structure (deprecated):
```
bmad/sn/
├── agents/
├── workflows/
└── templates/
```

New structure (current):
```
bmad/custom/bundles/requirements-workflow/
├── bundle.yaml
├── agents/
├── workflows/
└── templates/
```

**Migration steps:**
1. Create bundle directory in `bmad/custom/bundles/{name}/`
2. Copy agents, workflows, templates
3. Replace all `{project-root}/bmad/sn/` with `{bundle-root}/`
4. Create bundle.yaml manifest
5. Validate all paths resolve correctly

---

## Best Practices

1. **Use {bundle-root} not {project-root}** - Keep bundles portable
2. **One bundle = one purpose** - Don't mix unrelated agents
3. **Mark entry points correctly** - Users should know where to start
4. **Include descriptions** - Help users understand what each agent does
5. **Validate before upload** - Test all paths and workflows locally
6. **Version appropriately** - Use semantic versioning for changes
7. **Document dependencies** - List all core dependencies in manifest
8. **Keep config minimal** - Only include necessary variables
9. **Use meaningful names** - kebab-case, descriptive identifiers
10. **Test path resolution** - Ensure all paths work on clean install

---

## Common Patterns

### Collaborative Agent Pattern
Agents work together in sequence:
- Agent A gathers info → saves to file
- Agent B loads file → processes → saves output
- Agent C loads output → finalizes
- All use shared templates and config

### Independent Agent Pattern
Single agent with multiple workflows:
- Agent has diverse capabilities
- Each workflow is independent
- User chooses workflow based on task

### Workflow Chain Pattern
Workflows that invoke other workflows:
```yaml
<invoke-workflow>{bundle-root}/workflows/next-step/workflow.yaml</invoke-workflow>
```

---

## Troubleshooting

### Path Resolution Errors
- Verify `{bundle-root}` is used consistently
- Check bundle.yaml paths match actual files
- Ensure config_source points to valid config.yaml

### Agent Not Loading
- Check bundle.yaml syntax (valid YAML)
- Verify agent file exists at specified path
- Ensure entry_point is set to true
- Validate agent XML structure

### Workflow Fails
- Check config.yaml has all required variables
- Verify template paths exist
- Ensure instructions.md exists in workflow directory
- Check core dependencies are available

### Variable Not Resolving
- Verify variable defined in config.yaml
- Check syntax: `{config_source}:variable_name`
- Ensure config_source points to correct file

---

## Version History

- **v1.0** (2025-10-05) - Initial specification
  - Bundle structure defined
  - Path variable system
  - Multi-agent and standalone support
  - Server integration model

---

## Reference Implementation

See: `bmad/custom/bundles/requirements-workflow/` for a complete example of a multi-agent bundle following this specification.
