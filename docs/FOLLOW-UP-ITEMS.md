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

## Review Process

At the end of each epic:
1. Review all items listed above
2. Prioritize based on impact and effort
3. Create new stories for high-priority items
4. Archive or defer low-priority items
5. Update this document accordingly
