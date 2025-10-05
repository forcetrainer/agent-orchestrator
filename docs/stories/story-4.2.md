# Story 4.2: Implement Path Variable Resolution System

Status: Draft

## Story

As a **developer**,
I want **to resolve BMAD path variables in file paths**,
so that **agents can use {bundle-root}, {core-root}, and {project-root} to navigate files**.

## Acceptance Criteria

**AC-4.2.1:** Resolve {bundle-root} to `bmad/custom/bundles/{bundle-name}/`

**AC-4.2.2:** Resolve {core-root} to `bmad/core/`

**AC-4.2.3:** Resolve {project-root} to application root directory

**AC-4.2.4:** Resolve {config_source}:variable_name by loading bundle config.yaml

**AC-4.2.5:** Support nested variable resolution (variables within variables)

**AC-4.2.6:** Resolution happens before executing file operation tools

**AC-4.2.7:** Invalid variable references return clear error messages

**AC-4.2.8:** Path resolution function unit tested with all variable types

## Tasks / Subtasks

- [ ] **Task 1: Create Path Resolver Module** (AC: 4.2.1, 4.2.2, 4.2.3)
  - [ ] Subtask 1.1: Create `lib/pathResolver.ts` file
  - [ ] Subtask 1.2: Define PathContext interface with bundleRoot, coreRoot, projectRoot, bundleConfig properties
  - [ ] Subtask 1.3: Implement resolvePath(pathTemplate, context) function signature
  - [ ] Subtask 1.4: Add regex-based replacement for {bundle-root} variable
  - [ ] Subtask 1.5: Add regex-based replacement for {core-root} variable
  - [ ] Subtask 1.6: Add regex-based replacement for {project-root} variable
  - [ ] Subtask 1.7: Escape special regex characters in variable names

- [ ] **Task 2: Config Variable Resolution** (AC: 4.2.4, 4.2.5)
  - [ ] Subtask 2.1: Add pattern matching for {config_source}:variable_name syntax
  - [ ] Subtask 2.2: Extract variable name from config reference pattern
  - [ ] Subtask 2.3: Look up variable value in context.bundleConfig
  - [ ] Subtask 2.4: Replace config reference with resolved value
  - [ ] Subtask 2.5: Support nested resolution (re-run resolution on replaced values)
  - [ ] Subtask 2.6: Throw clear error if config variable not found

- [ ] **Task 3: System Variable Resolution** (AC: 4.2.5)
  - [ ] Subtask 3.1: Add resolution for {date} variable (format: YYYY-MM-DD)
  - [ ] Subtask 3.2: Add resolution for {user_name} variable from config
  - [ ] Subtask 3.3: Support other system variables as needed (output_folder, etc.)
  - [ ] Subtask 3.4: Apply system variable resolution after config variables

- [ ] **Task 4: Path Normalization and Validation** (AC: 4.2.6, 4.2.7)
  - [ ] Subtask 4.1: Use path.normalize() to clean resolved paths
  - [ ] Subtask 4.2: Create validatePathSecurity(resolvedPath, context) function
  - [ ] Subtask 4.3: Check resolved path is within allowed directories (bundleRoot or coreRoot)
  - [ ] Subtask 4.4: Prevent path traversal attacks (reject paths containing '..')
  - [ ] Subtask 4.5: Throw clear error messages for security violations
  - [ ] Subtask 4.6: Log security violations for monitoring

- [ ] **Task 5: Resolution Order and Strategy** (AC: 4.2.5)
  - [ ] Subtask 5.1: Define resolution order: config references → system variables → path variables
  - [ ] Subtask 5.2: Implement iterative resolution for nested variables
  - [ ] Subtask 5.3: Add max iteration limit (e.g., 10) to prevent infinite loops
  - [ ] Subtask 5.4: Detect circular variable references and throw error

- [ ] **Task 6: Integration with File Operations** (AC: 4.2.6)
  - [ ] Subtask 6.1: Export resolvePath function from module
  - [ ] Subtask 6.2: Export PathContext interface for use by other modules
  - [ ] Subtask 6.3: Create helper function createPathContext(bundleName, bundleConfig) to build PathContext
  - [ ] Subtask 6.4: Document integration points for Story 4.5 (file operations refactor)
  - [ ] Subtask 6.5: Add TypeScript types for all exported functions and interfaces

- [ ] **Task 7: Bundle Config Loading** (AC: 4.2.4)
  - [ ] Subtask 7.1: Create loadBundleConfig(bundleRoot) async function
  - [ ] Subtask 7.2: Read config.yaml from {bundle-root}/config.yaml
  - [ ] Subtask 7.3: Parse YAML content using yaml library
  - [ ] Subtask 7.4: Cache parsed config to avoid repeated file reads
  - [ ] Subtask 7.5: Handle missing config.yaml gracefully (return empty config)

- [ ] **Task 8: Error Handling and Logging** (AC: 4.2.7)
  - [ ] Subtask 8.1: Throw descriptive errors for undefined variables
  - [ ] Subtask 8.2: Log path resolution steps for debugging (input → output)
  - [ ] Subtask 8.3: Include variable context in error messages
  - [ ] Subtask 8.4: Differentiate between security errors and resolution errors

- [ ] **Task 9: Unit Testing - Path Variables** (AC: 4.2.1, 4.2.2, 4.2.3, 4.2.8)
  - [ ] Subtask 9.1: Test {bundle-root} resolves to correct bundle directory
  - [ ] Subtask 9.2: Test {core-root} resolves to bmad/core
  - [ ] Subtask 9.3: Test {project-root} resolves to process.cwd()
  - [ ] Subtask 9.4: Test multiple path variables in single path
  - [ ] Subtask 9.5: Test path variables with subdirectories (e.g., {bundle-root}/workflows/intake)

- [ ] **Task 10: Unit Testing - Config Variables** (AC: 4.2.4, 4.2.5, 4.2.8)
  - [ ] Subtask 10.1: Test {config_source}:variable resolves from bundleConfig
  - [ ] Subtask 10.2: Test nested variable resolution (variable value contains another variable)
  - [ ] Subtask 10.3: Test error when config variable not found
  - [ ] Subtask 10.4: Test config variable combined with path variables

- [ ] **Task 11: Unit Testing - Security** (AC: 4.2.7, 4.2.8)
  - [ ] Subtask 11.1: Test path traversal attack blocked (../../etc/passwd)
  - [ ] Subtask 11.2: Test paths outside allowed directories rejected
  - [ ] Subtask 11.3: Test security validation with symbolic links (if applicable)
  - [ ] Subtask 11.4: Verify error messages don't leak sensitive path information

- [ ] **Task 12: Integration Testing** (AC: 4.2.6, 4.2.8)
  - [ ] Subtask 12.1: Test resolution in realistic agent context (full PathContext)
  - [ ] Subtask 12.2: Test with actual bundle structure and config.yaml
  - [ ] Subtask 12.3: Test integration with file operation tools (prepare for Story 4.5)
  - [ ] Subtask 12.4: Test performance with complex path resolution scenarios

## Dev Notes

### Architecture Patterns and Constraints

**Core Resolution Pattern:**
The path resolver is a foundational utility that bridges BMAD's file-based architecture with the OpenAI agent execution environment. It enables agents to use portable path variables instead of hardcoded absolute paths.

**Resolution Order (Critical):**
1. **Config references first** - {config_source}:variable_name replaced with config.yaml values
2. **System variables second** - {date}, {user_name} replaced with runtime values
3. **Path variables third** - {bundle-root}, {core-root}, {project-root} replaced with absolute paths
4. **Nested resolution** - If replaced value contains variables, re-run resolution (max 10 iterations)

**Why This Order Matters:**
Config variables may reference system variables (e.g., `output_folder: "{project-root}/output"`), and path variables should be the final step to produce absolute paths.

**Security-First Design:**
Path resolution MUST validate security BEFORE any file operation executes. The validatePathSecurity function enforces:
- All resolved paths must be within bundleRoot OR coreRoot
- Path traversal attempts (..) are rejected
- Normalization prevents tricks like `bundle/../../../etc/passwd`

**Integration with Story 4.1:**
The agentic execution loop (Story 4.1) calls file operation tools, which will use this path resolver (Story 4.5 refactor). The resolver must be synchronous or async-compatible to fit into the tool execution flow.

**Integration with Story 4.3:**
Critical actions processor loads bundle config.yaml and passes it to path resolver for {config_source} references.

### Component Locations and File Paths

**Primary Implementation:**
- `lib/pathResolver.ts` - Main path resolution module (create new)

**Dependencies:**
- Node.js `path` module - For path.normalize() and path.resolve()
- `yaml` library - For parsing config.yaml files
- `fs/promises` - For reading config.yaml asynchronously

**Integration Points:**
- Called by: `lib/tools/fileOperations.ts` (Story 4.5) - before every read_file, write_file, list_files
- Called by: `lib/agents/criticalActions.ts` (Story 4.3) - when loading files during initialization
- Used by: `lib/agents/agenticLoop.ts` (Story 4.1) - indirectly through tool execution

**Bundle Structure Context:**
```
bmad/custom/bundles/
  requirements-workflow/           <-- {bundle-root} when this bundle is active
    bundle.yaml
    config.yaml                    <-- Source for {config_source}:variable
    agents/
      alex.md
    workflows/
      intake/
        workflow.yaml
bmad/core/                         <-- {core-root} always
  tasks/
    workflow.md
```

### Testing Requirements

**Unit Tests (Required):**
1. **Path variable resolution** - Each variable type ({bundle-root}, {core-root}, {project-root})
2. **Config variable resolution** - {config_source}:variable_name
3. **System variable resolution** - {date}, {user_name}
4. **Nested resolution** - Variables within variables
5. **Security validation** - Path traversal, out-of-bounds paths
6. **Error handling** - Undefined variables, circular references
7. **Edge cases** - Empty paths, special characters, multiple variables

**Integration Tests (Required):**
1. Real bundle structure with config.yaml
2. Complex path resolution scenarios
3. Integration with file operations (prepare for Story 4.5)

**Test Data:**
- Sample bundle directory structure
- Sample config.yaml with variables
- Attack vectors for security testing

### Project Structure Notes

**Alignment with unified-project-structure.md:**
- Path resolver is a utility module in `lib/` directory (follows Next.js App Router structure)
- Separation of concerns: path resolution is independent of file I/O (can be unit tested without file system)
- Module exports clear TypeScript interfaces for type safety

**Potential Conflicts:**
- None identified - this is a new utility module with no existing implementation

**Dependencies from Epic 2:**
- Epic 2 file operations (readFileContent, writeFileContent, listFiles) did NOT have path variable support
- Story 4.5 will refactor these to use the path resolver created in this story

### References

**Technical Specifications:**
- [AGENT-EXECUTION-SPEC.md](../AGENT-EXECUTION-SPEC.md#path-resolution-system) - Section 5: Path Resolution System
- [EPIC4-TECH-SPEC.md](../EPIC4-TECH-SPEC.md#story-42-path-variable-resolution-system) - Story 4.2 Implementation (lines 319-405)
- [BUNDLE-SPEC.md](../BUNDLE-SPEC.md) - Section 3: Path Variables

**Product Requirements:**
- [PRD.md](../PRD.md) - FR-6: File Operation Tools with Path Variable Resolution (lines 160-171)
- [epics.md](../epics.md) - Epic 4 Story 4.2 (lines 848-871)

**Related Architecture:**
- [solution-architecture.md](../solution-architecture.md) - File System Architecture section

**Dependencies on Other Stories:**
- Story 4.1: Agentic Execution Loop (complete) - provides context for where path resolver fits
- Story 4.3: Critical Actions Processor (parallel) - loads bundle config for {config_source} resolution
- Story 4.5: File Operations Refactor (blocked by this story) - will integrate path resolver

**Completion Blockers:**
None - this story can be implemented independently. Story 4.3 can provide config.yaml loading, or this story can include a temporary loadBundleConfig helper.

## Change Log

| Date       | Version | Description   | Author |
| ---------- | ------- | ------------- | ------ |
| 2025-10-05 | 0.1     | Initial draft | Bryan  |

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML/JSON will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
