# Story 4.9: Validate Bundled Agents End-to-End

Status: Approved

## Story

As a **developer**,
I want **to validate that bundled agents work correctly with new architecture**,
So that **we confirm agents behave like they do in Claude Code**.

## Acceptance Criteria

**AC-4.9.1:** Load bundled agent from `bmad/custom/bundles/requirements-workflow/`

**AC-4.9.2:** Agent initializes successfully, executes critical actions

**AC-4.9.3:** User sends message that triggers workflow requiring file loads

**AC-4.9.4:** Verify in logs: read_file tool called multiple times for different instruction files

**AC-4.9.5:** Verify execution pauses at each tool call, waits for result, then continues

**AC-4.9.6:** Agent successfully completes workflow using dynamically loaded instructions

**AC-4.9.7:** Path variables ({bundle-root}, {core-root}) resolve correctly in logs

**AC-4.9.8:** Agent behavior matches expected BMAD patterns (similar to Claude Code execution)

**AC-4.9.9:** Document any remaining compatibility issues discovered

## Tasks / Subtasks

- [ ] **Task 1: Prepare Test Environment** (AC: 4.9.1)
  - [ ] Subtask 1.1: Verify requirements-workflow bundle exists at `bmad/custom/bundles/requirements-workflow/`
  - [ ] Subtask 1.2: Verify bundle.yaml manifest is valid and lists Alex, Casey, or Pixel as entry_point agents
  - [ ] Subtask 1.3: Verify bundle config.yaml contains required variables (user_name, communication_language, output_folder)
  - [ ] Subtask 1.4: Select test agent (Alex, Casey, or Pixel) for validation
  - [ ] Subtask 1.5: Identify a workflow command that requires multiple file loads (e.g., *intake-workflow, *deep-dive-workflow, *build-stories)

- [ ] **Task 2: Execute Agent Initialization** (AC: 4.9.1, 4.9.2)
  - [ ] Subtask 2.1: Load selected agent via /api/agents endpoint
  - [ ] Subtask 2.2: Call /api/agent/initialize with selected agent_id
  - [ ] Subtask 2.3: Verify agent.md file loads from bundle
  - [ ] Subtask 2.4: Verify critical-actions section executes (config.yaml loaded)
  - [ ] Subtask 2.5: Verify system prompt built with persona, role, identity, principles
  - [ ] Subtask 2.6: Verify greeting message returned with available commands

- [ ] **Task 3: Execute Workflow with File Loading** (AC: 4.9.3, 4.9.4, 4.9.5)
  - [ ] Subtask 3.1: Send workflow command message via /api/chat (e.g., "*intake-workflow" or equivalent from selected agent)
  - [ ] Subtask 3.2: Enable detailed logging in agenticLoop.ts to capture all tool calls
  - [ ] Subtask 3.3: Monitor console logs for execute_workflow tool call
  - [ ] Subtask 3.4: Verify workflow.yaml loads from {bundle-root}/workflows/{workflow-name}/
  - [ ] Subtask 3.5: Verify read_file tool called for instructions.md
  - [ ] Subtask 3.6: Verify read_file tool called for template.md (if workflow has template: true)
  - [ ] Subtask 3.7: Count total tool calls in logs - should be at least 2-3 for a typical workflow
  - [ ] Subtask 3.8: Verify execution pauses after each tool call (messages array grows with tool results)
  - [ ] Subtask 3.9: Verify workflow completes without errors

- [ ] **Task 4: Validate Path Resolution** (AC: 4.9.7)
  - [ ] Subtask 4.1: Examine logs for resolved paths containing `bmad/custom/bundles/requirements-workflow/`
  - [ ] Subtask 4.2: Verify {bundle-root} resolved to correct bundle directory
  - [ ] Subtask 4.3: Verify {core-root} resolved to `bmad/core/` (if core files accessed)
  - [ ] Subtask 4.4: Verify {config_source}:variable resolved from config.yaml
  - [ ] Subtask 4.5: Verify no unresolved path variables in logs

- [ ] **Task 5: Validate Behavior Against BMAD Patterns** (AC: 4.9.6, 4.9.8)
  - [ ] Subtask 5.1: Verify agent responds with workflow instructions or elicitation (not just "I will load the workflow")
  - [ ] Subtask 5.2: Verify agent processes workflow steps in order (if observable in response)
  - [ ] Subtask 5.3: Verify agent uses loaded template structure (if template-based workflow)
  - [ ] Subtask 5.4: Compare behavior to expected BMAD pattern: command → load workflow → execute steps → generate output
  - [ ] Subtask 5.5: Verify agent greeting includes available commands from <cmds> section

- [ ] **Task 6: Document Findings and Compatibility Issues** (AC: 4.9.9)
  - [ ] Subtask 6.1: Create validation report documenting test results
  - [ ] Subtask 6.2: Document any tool calls that failed or behaved unexpectedly
  - [ ] Subtask 6.3: Document any path resolution issues encountered
  - [ ] Subtask 6.4: Document any differences between OpenAI execution and expected Claude Code behavior
  - [ ] Subtask 6.5: Document workarounds or fixes applied during testing
  - [ ] Subtask 6.6: Add findings to docs/FOLLOW-UP-ITEMS.md or create validation-report-story-4.9.md

- [ ] **Task 7: Testing and Verification** (AC: All)
  - [ ] Subtask 7.1: Test with at least one bundled agent (Alex, Casey, or Pixel)
  - [ ] Subtask 7.2: Test with at least one workflow command that loads multiple files
  - [ ] Subtask 7.3: Verify all 9 acceptance criteria met
  - [ ] Subtask 7.4: Re-test with different agent if first test reveals issues
  - [ ] Subtask 7.5: Verify fixes for any issues discovered

## Dev Notes

- **Architectural Validation:** This story validates the complete Epic 4 architecture end-to-end, confirming that all previous stories (4.1-4.8) integrate correctly
- **Real-World Testing:** Uses actual production-ready bundled agents (Alex, Casey, Pixel) from requirements-workflow bundle
- **Critical Success Indicator:** Successful completion proves OpenAI API compatibility with BMAD agents using lazy-loading pattern
- **Testing Standards:** Manual testing with detailed log inspection required - no automated tests for this story
- **Logging Requirements:** Enable verbose logging in agenticLoop.ts, pathResolver.ts, and criticalActions.ts to capture all execution details

### Project Structure Notes

**Alignment with Bundle Structure:**
- Test environment: `bmad/custom/bundles/requirements-workflow/`
- Bundle manifest: `bmad/custom/bundles/requirements-workflow/bundle.yaml`
- Test agents: Alex, Casey, or Pixel (all have entry_point: true per BUNDLE-SPEC.md)
- Workflows: Multiple workflows under `workflows/` subdirectory
- Config: `bmad/custom/bundles/requirements-workflow/config.yaml`

**Expected File Access Pattern:**
1. Agent initialization: Load `agents/{agent-name}.md` → Parse critical-actions → Load `config.yaml`
2. Workflow execution: User sends command → execute_workflow tool called → Load `workflow.yaml` → Load `instructions.md` → Load `template.md` (if exists)
3. Path resolution: All paths use {bundle-root} and resolve to `bmad/custom/bundles/requirements-workflow/`

**Detected Dependencies:**
- Epic 4 Stories 4.1-4.8 must be complete and working
- Bundled agents must exist in project (requirements-workflow bundle confirmed)
- All path resolution infrastructure must be operational
- System prompt builder must correctly instruct OpenAI to use tools

### References

**Epic and Technical Specifications:**
- [Source: docs/epics.md#Story-4.9] - Story acceptance criteria and technical notes
- [Source: docs/EPIC4-TECH-SPEC.md#Section-8] - Testing Strategy for Epic 4
- [Source: docs/EPIC4-TECH-SPEC.md#Section-10] - Rollout Plan - Gate 3 validation requirements
- [Source: docs/AGENT-EXECUTION-SPEC.md#Section-3] - Agentic Execution Loop expected behavior
- [Source: docs/AGENT-EXECUTION-SPEC.md#Example-Complete-Execution-Flow] - Step-by-step execution pattern
- [Source: docs/BUNDLE-SPEC.md#Example-Bundle-requirements-workflow] - Real-world bundle structure reference
- [Source: docs/BUNDLE-SPEC.md#Section-3-Path-Variables] - Path variable resolution rules

**Architecture Components:**
- [Source: docs/EPIC4-TECH-SPEC.md#Story-4.1] - Agentic Execution Loop implementation (lib/agents/agenticLoop.ts)
- [Source: docs/EPIC4-TECH-SPEC.md#Story-4.2] - Path Variable Resolution System (lib/pathResolver.ts)
- [Source: docs/EPIC4-TECH-SPEC.md#Story-4.3] - Critical Actions Processor (lib/agents/criticalActions.ts)
- [Source: docs/EPIC4-TECH-SPEC.md#Story-4.4] - Bundle Structure Discovery (lib/agents/bundleScanner.ts)
- [Source: docs/EPIC4-TECH-SPEC.md#Story-4.8] - System Prompt Builder (lib/agents/systemPromptBuilder.ts)

**Success Criteria:**
- [Source: docs/prd.md#Goals] - Primary Goal: "Prove that lazy-loading instruction pattern is viable with OpenAI function calling"
- [Source: docs/prd.md#FR-2] - "Agent Loading and Initialization" functional requirement
- [Source: docs/EPIC4-TECH-SPEC.md#Section-1.3] - Epic 4 success criteria checklist

**Testing Guidance:**
- This is equivalent to Epic 3 Story 3.9 (lazy-loading validation) but with correct architecture
- Monitor console logs to verify tool execution flow matches AGENT-EXECUTION-SPEC.md patterns
- Compare behavior to same agent running in Claude Code if possible
- Focus on validating pause-load-continue pattern works correctly

## Change Log

| Date       | Version | Description   | Author |
| ---------- | ------- | ------------- | ------ |
| 2025-10-05 | 0.1     | Initial draft | Bryan  |

## Dev Agent Record

### Context Reference

- [Story Context 4.9](/Users/bryan.inagaki/Documents/development/agent-orchestrator/docs/story-context-4.9.xml) - Generated 2025-10-05

### Agent Model Used

Claude 3.5 Sonnet (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
