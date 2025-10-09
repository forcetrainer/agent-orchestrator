# System Prompt Changelog

This file tracks all changes to the system prompt template used by the agent orchestrator.

## Format
Each entry includes:
- **Version & Date**: Version number and when the change was made
- **Problem/Observation**: What behavior prompted the change
- **Change Made**: Specific modifications to the prompt
- **Expected Outcome**: What we hope to achieve
- **Actual Result**: Observed behavior after deployment (filled in after testing)

---

## v3.0 - Context-Aware Guidance (2025-10-08)

### Problem/Observation
When comparing Claude Code vs App behavior with Casey workflows:
- **Claude Code**: Proactively provides contextual example questions even when `<action>` doesn't explicitly say "Suggest questions"
  - Example: In Step 2 (Refine problem statement), Claude Code reads the intake file and offers specific, contextual questions for the BA to ask
- **App**: Only provides questions when `<action>` explicitly contains keywords like "Suggest questions..."
  - Same Step 2 just asks for input without providing helpful guidance

The v2.0 prompt only triggered helpful behavior when `<action>` contained specific keywords ("Suggest questions...", "Guide through...", etc.). This was too restrictive and didn't match Claude Code's more intelligent, context-aware behavior.

### Change Made
Enhanced the CONVERSATIONAL STYLE section to:
1. Make the agent proactively helpful for ALL `<action>` tags in workflows, not just those with specific keywords
2. Encourage reviewing and referencing loaded context (intake files, requirements docs)
3. Explicitly instruct to provide contextual, specific guidance based on actual loaded content
4. Distinguish between "guidance mode" (offering suggestions/examples) vs "input mode" (asking direct questions)

Specific additions:
- Added: "Review any attached or loaded context files and reference specific details when relevant"
- Added: "When `<action>` tags describe activities involving information gathering, proactively provide contextual examples/questions/suggestions"
- Added: "Make guidance specific to loaded content, not generic placeholders"
- Added: "Frame suggestions as helpful guidance, not mandatory questions"

### Expected Outcome
- Agent should provide helpful example questions in Step 2 (and similar steps) even without explicit "Suggest questions" keyword
- Questions should be contextual and reference actual content from loaded files
- Should maintain distinction between offering guidance vs asking direct questions

### Actual Result
_[To be filled in after testing]_

---

## v2.0 - Action vs Ask Distinction (2025-10-XX)

### Problem/Observation
Agents were not distinguishing between:
- Providing guidance/suggestions to the BA (multiple items acceptable)
- Asking the BA directly for input (one question at a time)

This led to overwhelming users with too many questions at once.

### Change Made
Added explicit distinction in CONVERSATIONAL STYLE section:
- When `<action>` tags suggest providing guidance → MAY provide multiple related items
- When `<ask>` tags request input → Ask ONE question and wait

### Expected Outcome
- Agents would provide multiple example questions when in "guidance mode"
- Agents would ask one direct question when in "input mode"
- Better user experience by avoiding question barrage

### Actual Result
- Worked for `<action>` tags with explicit keywords ("Suggest questions...")
- Did NOT work for `<action>` tags without those keywords
- Led to creation of v3.0

---

## v1.0 - Baseline (Initial Implementation)

### Description
Initial system prompt based on AGENT-EXECUTION-SPEC.md hypothesis.

Key sections:
- Agent identity/persona injection
- Tool usage instructions (read_file, execute_workflow, save_output)
- Workflow execution pattern
- File naming requirements
- Conditional logic handling
- Basic conversational style

### Known Issues
- No distinction between guidance and direct questions
- Generic, not context-aware
