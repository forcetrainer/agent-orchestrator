# Engineering Backlog

This backlog collects cross-cutting or future action items that emerge from reviews and planning.

Routing guidance:

- Use this file for non-urgent optimizations, refactors, or follow-ups that span multiple stories/epics.
- Must-fix items to ship a story belong in that story's `Tasks / Subtasks`.
- Same-epic improvements may also be captured under the epic Tech Spec `Post-Review Follow-ups` section.

| Date | Story | Epic | Type | Severity | Owner | Status | Notes |
| ---- | ----- | ---- | ---- | -------- | ----- | ------ | ----- |
| 2025-10-05 | 4.8 | 4 | Bug | Medium | TBD | Open | getAgentById() calls discoverBundles() on every invocation causing redundant bundle scans during chat. Implement caching mechanism. File: lib/agents/loader.ts:146 |
| 2025-10-05 | 4.9 | 4 | Enhancement | Low | TBD | Open | Command descriptions show workflow file paths (e.g., "loads: workflows/intake-itsm/workflow.yaml") - exposes internal details. Remove or make configurable. File: lib/agents/systemPromptBuilder.ts:100-111 |
| 2025-10-05 | 4.9 | 4 | TechDebt | Medium | TBD | Open | Verify workflow file writing operations work correctly and follow BMAD patterns. Test template-based workflows, path resolution. File: lib/tools/fileOperations.ts (executeSaveOutput) |
| 2025-10-05 | 4.6 | 4 | Tech Debt | Low | TBD | Open | Add JSDoc documentation for bundle metadata flow - types/api.ts, AgentSelector.tsx, ChatPanel.tsx |
| 2025-10-05 | 4.6 | 4 | Tech Debt | Low | TBD | Open | Review InitializeRequest bundle params usage - app/api/agent/initialize/route.ts:15-19. Document or implement in Story 4.7 |
| 2025-10-05 | 4.6 | 4 | Enhancement | Low | TBD | Open | Enhance empty state message with developer guidance - AgentSelector.tsx:145-148. Link to BUNDLE-SPEC.md |
| 2025-10-05 | 4.12 | 4 | TechDebt | Low | TBD | Open | Validate internal markdown links (e.g., #3-agentic-execution-loop) resolve correctly in GitHub renderer and other common viewers. Files: README.md, ARCHITECTURE.md, TROUBLESHOOTING.md |
| 2025-10-05 | 4.12 | 4 | TechDebt | Low | TBD | Open | Replace user-specific path `/Users/bryan/agent-orchestrator/` with `{project-root}` placeholder in examples. File: ARCHITECTURE.md:517 |
| 2025-10-05 | 4.12 | 4 | TechDebt | Low | TBD | Open | Add language tags to remaining code blocks for consistent syntax highlighting (e.g., ```bash, ```typescript). File: TROUBLESHOOTING.md |
| 2025-10-06 | 5.0 | 5 | Bug | High | Bryan | Resolved | ✅ Agent metadata extraction from workflow author field implemented. Manifests now correctly show agent name, title, and bundle. File: lib/tools/fileOperations.ts:230-231 (AC 5.0.3) |
| 2025-10-06 | 5.0 | 5 | TechDebt | Medium | TBD | Open | Add formal unit test suite for session discovery (lib/agents/__tests__/sessionDiscovery.test.ts) and path security (lib/__tests__/pathResolver.security.test.ts). Currently only smoke tests exist. (AC 5.0.6, 5.0.7) |
| 2025-10-06 | 5.0 | 5 | Bug | Medium | TBD | Open | Connect workflow finalization hook to call finalizeSession() on workflow completion. Manifests may remain in "running" status. File: lib/agents/sessionDiscovery.ts:206 (AC 5.0.3) |
| 2025-10-06 | 5.0 | 5 | Enhancement | Low | TBD | Open | Validate concurrent write safety for registerOutput() - add stress test with 10+ simultaneous writes. Consider file locking if race conditions found. File: lib/agents/sessionDiscovery.ts:163 (AC 5.0.7) |
| 2025-10-06 | 5.0 | 5 | Enhancement | Low | TBD | Open | Add integration test for cross-agent discovery (Alex → Casey → Pixel workflow chain). Verify related_sessions linking works correctly. (AC 5.0.6) |
| 2025-10-07 | 5.2.1 | 5 | Enhancement | Medium | Frontend | Open | Consider timezone-aware timestamp formatting based on user locale. Current: hardcoded UTC. Suggested: Intl.DateTimeFormat with user's timezone or config. File: lib/files/manifestReader.ts:138 |
| 2025-10-07 | 5.2.1 | 5 | TechDebt | Medium | Product + Frontend | Open | Complete Task 5: Dedicated metadata panel UI when UX design finalized. Current: metadata attached, UUID in title tooltip. Blocked by: UX design requirements. |
| 2025-10-07 | 5.2.1 | 5 | Enhancement | Low | Frontend | Open | Add test for very long agent titles/workflow names (>100 chars) to verify CSS truncation. File: components/__tests__/DirectoryTree.test.tsx. Effort: 15min. |
| 2025-10-07 | 5.2.1 | 5 | Documentation | Low | TBD | Open | Add ADR documenting decision to defer Task 5 metadata panel. Rationale: metadata attached, no UX design, not blocking. Location: docs/adrs/adr-005-session-metadata-display.md |
