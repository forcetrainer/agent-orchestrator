# BMAD Custom Bundles

This directory contains user-created agent bundles that are isolated from the core BMAD system.

## Directory Structure

```
bmad/custom/
└── bundles/
    └── {bundle-name}/
        ├── bundle.yaml          # Bundle manifest
        ├── agents/              # Agent files
        ├── workflows/           # Bundle workflows
        ├── templates/           # Bundle templates
        └── config.yaml          # Bundle configuration
```

## Security Model

**Protected (Read-Only):**
- `bmad/core/` - Core BMAD system tasks and workflows
- `bmad/bmm/` - BMAD core modules
- `bmad/cis/` - BMAD core modules
- `bmad/bmb/` - BMAD builder tools

**User Space (Upload Target):**
- `bmad/custom/bundles/` - All user-created agent bundles

## Bundle Types

### Multi-Agent Bundle
Contains multiple collaborative agents that work together.

Example: `requirements-workflow` bundle
- Alex (Requirements Facilitator)
- Casey (Requirements Analyst)
- Pixel (Story Developer)

### Standalone Agent
Contains a single agent with optional workflows.

Example structure:
```
bundles/my-agent/
├── bundle.yaml
├── agent.md
└── workflows/ (optional)
```

## Path Resolution

Bundles use two path variables:

- `{bundle-root}` - Resolves to the bundle's directory
  - Example: `bmad/custom/bundles/requirements-workflow/`
  - Used for: Local resources (workflows, templates, config)

- `{core-root}` - Resolves to BMAD core directory
  - Example: `bmad/core/`
  - Used for: Core tasks and workflows (read-only)

## Bundle Manifest (bundle.yaml)

Required fields:
```yaml
type: bundle | standalone
name: bundle-name
version: 1.0.0
description: "Bundle description"

# For multi-agent bundles
agents:
  - id: agent-id
    name: Agent Name
    file: agents/agent-file.md
    entry_point: true

# For standalone
agent:
  id: agent-id
  file: agent.md

resources:
  workflows: workflows/
  templates: templates/
  config: config.yaml

core_dependencies:
  - bmad/core/tasks/workflow.md
```

## Server Deployment

When deploying to server:

1. Server loads BMAD core (protected, read-only)
2. User uploads bundle to `bmad/custom/bundles/`
3. Server scans `bundle.yaml` to register agents
4. Server resolves `{bundle-root}` and `{core-root}` paths
5. Agents become available to end users

## Creating New Bundles

Use the BMAD bundle creation workflow:
```
/bmad:bmb:workflows:build-agent
```

This ensures proper structure and path resolution.
