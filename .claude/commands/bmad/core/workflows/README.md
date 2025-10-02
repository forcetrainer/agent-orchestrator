# CORE Workflows

## Available Workflows in core

**bmad-init**
- Path: `bmad/core/workflows/bmad-init/workflow.yaml`
- BMAD system initialization and maintenance workflow for agent manifest generation and system configuration

**party-mode**
- Path: `bmad/core/workflows/party-mode/workflow.yaml`
- Orchestrates group discussions between all installed BMAD agents, enabling natural multi-agent conversations


## Execution

When running any workflow:
1. LOAD {project-root}/bmad/core/tasks/workflow.md
2. Pass the workflow path as 'workflow-config' parameter
3. Follow workflow.md instructions EXACTLY
4. Save outputs after EACH section

## Modes
- Normal: Full interaction
- #yolo: Skip optional steps
