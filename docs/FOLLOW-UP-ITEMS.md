# Follow-up Items & Improvements

This document tracks non-blocking issues, optimizations, and improvements identified during development and manual testing. These items should be reviewed at the end of each epic for potential incorporation into future stories.

---

## Epic 4: Agent Execution Architecture & Bundle System

### Story 4.8: System Prompt Builder

**Performance Issue - getAgentById() Bundle Scanning**
- **Location**: `lib/agents/loader.ts:146`
- **Issue**: `getAgentById()` calls `discoverBundles()` on every invocation, causing full bundle directory scan on every chat message
- **Impact**: Performance degradation during chat - bundle scanner runs repeatedly showing "test-bundle" errors in logs
- **Recommendation**: Implement caching mechanism similar to `loadAgents()` to avoid redundant file system scans
- **Related Stories**: Story 4.6 (Bundle Discovery), Story 4.7 (Agent Initialization)
- **Priority**: Medium - affects performance but not functionality
- **Discovered**: Manual testing during Story 4.8 completion

---

### Story 4.9: Validate Bundled Agents End-to-End

**UX Issue - Command Descriptions Show Workflow File Paths**
- **Location**: `lib/agents/systemPromptBuilder.ts:100-111` (commands section generation)
- **Issue**: Agent greeting displays workflow file paths in command descriptions instead of clean user-facing descriptions
- **Example Output**:
  ```
  *itsm-request — Gather requirements for ITSM enhancements (loads: workflows/intake-itsm/workflow.yaml).
  *workflow-request — Gather requirements for workflow automation (loads: workflows/intake-workflow/workflow.yaml).
  ```
- **Expected Output**:
  ```
  *itsm-request — Gather requirements for ITSM enhancements
  *workflow-request — Gather requirements for workflow automation
  ```
- **Impact**: Minor UX issue - exposes internal implementation details to users, looks unprofessional
- **Root Cause**: System prompt builder extracts `run-workflow` attribute from agent XML and appends it to command description
- **Recommendation**:
  - Option 1: Don't append workflow path to command descriptions (simplest fix)
  - Option 2: Make it configurable via agent XML (e.g., `show-workflow-path="false"`)
  - Option 3: Only show workflow path in debug/verbose mode
- **Related Stories**: Story 4.8 (System Prompt Builder)
- **Priority**: Low - cosmetic issue, not blocking functionality
- **Discovered**: Manual testing during Story 4.9 post-review validation (2025-10-05)

**Potential Issue - File Writing Verification Needed**
- **Location**: File output operations (likely `lib/tools/fileOperations.ts` - `executeSaveOutput`)
- **Issue**: Need to verify that workflow file writing works correctly and follows BMAD patterns
- **Context**: User noted this as something to watch during manual testing but did not provide specific failure case
- **Impact**: Unknown - no specific error observed yet
- **Recommendation**:
  - Test workflow commands that generate output files (e.g., template-based workflows)
  - Verify files are written to correct paths with correct content
  - Check that `save_output` tool is being called correctly by agents
  - Ensure path resolution works for output file paths (e.g., `{output_folder}/file.md`)
- **Related Stories**: Story 4.5 (File Operation Tools), workflow execution patterns
- **Priority**: Medium - needs verification but no confirmed issue yet
- **Discovered**: Manual testing during Story 4.9 post-review validation (2025-10-05)
- **Next Steps**: Continue manual testing with workflows that write files, document any issues found

---

## Review Process

At the end of each epic:
1. Review all items listed above
2. Prioritize based on impact and effort
3. Create new stories for high-priority items
4. Archive or defer low-priority items
5. Update this document accordingly
