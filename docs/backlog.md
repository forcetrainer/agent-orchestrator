# Engineering Backlog

This backlog collects cross-cutting or future action items that emerge from reviews and planning.

Routing guidance:

- Use this file for non-urgent optimizations, refactors, or follow-ups that span multiple stories/epics.
- Must-fix items to ship a story belong in that story's `Tasks / Subtasks`.
- Same-epic improvements may also be captured under the epic Tech Spec `Post-Review Follow-ups` section.

| Date | Story | Epic | Type | Severity | Owner | Status | Notes |
| ---- | ----- | ---- | ---- | -------- | ----- | ------ | ----- |
| 2025-10-05 | 4.6 | 4 | Tech Debt | Low | TBD | Open | Add JSDoc documentation for bundle metadata flow - types/api.ts, AgentSelector.tsx, ChatPanel.tsx |
| 2025-10-05 | 4.6 | 4 | Tech Debt | Low | TBD | Open | Review InitializeRequest bundle params usage - app/api/agent/initialize/route.ts:15-19. Document or implement in Story 4.7 |
| 2025-10-05 | 4.6 | 4 | Enhancement | Low | TBD | Open | Enhance empty state message with developer guidance - AgentSelector.tsx:145-148. Link to BUNDLE-SPEC.md |
| 2025-10-05 | 4.12 | 4 | TechDebt | Low | TBD | Open | Validate internal markdown links (e.g., #3-agentic-execution-loop) resolve correctly in GitHub renderer and other common viewers. Files: README.md, ARCHITECTURE.md, TROUBLESHOOTING.md |
| 2025-10-05 | 4.12 | 4 | TechDebt | Low | TBD | Open | Replace user-specific path `/Users/bryan/agent-orchestrator/` with `{project-root}` placeholder in examples. File: ARCHITECTURE.md:517 |
| 2025-10-05 | 4.12 | 4 | TechDebt | Low | TBD | Open | Add language tags to remaining code blocks for consistent syntax highlighting (e.g., ```bash, ```typescript). File: TROUBLESHOOTING.md |
