# System Prompt Review Summary
**Date**: 2025-10-09
**Reviewer**: Claude Code
**Subject**: System Prompt v2.0 Structure and Quality Review

---

## Executive Summary

Conducted deep review of `/lib/agents/prompts/system-prompt.md` (v2.0). Found **7 categories of issues** ranging from redundancy to conflicting rules. Created **v2.1 (PROPOSED)** as a consolidation and clarification refactor with **same core functionality** but better structure.

**Key Finding**: v2.0 works but has accumulated structural debt from incremental changes. v2.1 addresses this without adding new features (learning from v3.x failures).

---

## Issues Found in v2.0

### 🔴 High Priority

1. **Redundancy (3 instances)**
   - Tool usage instructions: lines 23-29, 101-104, 123
   - "Wait for results": mentioned 4+ times
   - **Impact**: Cognitive overhead, harder to maintain

2. **Conflicting Rules**
   - Lines 88-89: "provide 2-3 items"
   - Lines 90-91: "ask ONE question"
   - Lines 96: "ask ONE clear question"
   - **Problem**: What if `<action>` asks for input? Unclear which rule applies.

3. **Overuse of "CRITICAL" Label**
   - 6 sections marked CRITICAL
   - **Impact**: Dilutes meaning, agents may ignore

### 🟡 Medium Priority

4. **Workflow Execution Split Across 4 Sections**
   - Lines 23-29, 56-70, 63-70, 72-79
   - **Impact**: Hard to find all related rules, risk of missing something

5. **Missing Documentation**
   - `{{COMMANDS_SECTION}}` - no explanation
   - Environment variables - listed but not explained
   - **Impact**: Harder for maintainers to understand template

6. **"CONVERSATIONAL STYLE" Does Too Much**
   - Lines 82-99 mix: step numbers, action tags, ask tags, general rules, context usage
   - **Impact**: Hard to scan, mixed concerns

### 🟢 Low Priority

7. **Length of File Naming Examples**
   - Lines 41-52 could be condensed
   - **Impact**: Minor - examples are helpful but verbose

---

## v2.1 Solution Overview

### Approach: Refactor, Not Rewrite

**Philosophy**: Learn from v3.x failures. Don't add features, just clean up structure.

### Changes Made

| Category | Change | v2.0 | v2.1 |
|----------|--------|------|------|
| **Consolidation** | Tool usage + workflow execution | 4 sections | 1 section |
| **Clarity** | "CRITICAL" labels | 6 | 1 |
| **Decision Rules** | Action vs ask logic | Ambiguous prose | Explicit decision tree |
| **Structure** | Total sections | 10+ (mixed) | 7 (focused) |
| **Documentation** | Template var comments | None | Added |

### What Stayed the Same

✅ Sequential step execution
✅ Action tag interpretation (Agent/Guidance/Meta patterns)
✅ Conditional logic handling
✅ File naming requirements
✅ Output conciseness guidelines
✅ Tool activation pattern

**No functional changes = no new bugs**

---

## Side-by-Side Example

### v2.0 Structure (Scattered)
```
1. Agent identity
2. CRITICAL: Tool usage
3. CRITICAL: File naming
4. Workflow execution pattern
5. CRITICAL: Workflow execution rules  ← Redundant with #4
6. Conditional logic
7. CONVERSATIONAL STYLE (mixed concerns)
   - When to show step numbers
   - How to handle <action> tags
   - How to handle <ask> tags
   - General conversational rules
   - Context usage
8. Available tools
9. Environment variables
10. CRITICAL: Efficiency rule
11. CRITICAL: User communication rule
12. "Remember: tools..." ← Redundant with #2
```

### v2.1 Structure (Focused)
```
1. Agent identity
2. CRITICAL: Tool Usage and Workflow Execution  ← Consolidated #2, #4, #5, #6, #12
3. Action Tag Interpretation  ← Extracted from #7, added decision trees
4. User Communication  ← Extracted from #7, #11
   - Question Cadence
   - Step Number Display
   - General Style
5. Output Formatting  ← Extracted from #7
6. File Operations  ← #3 + #11
7. Available Tools + Environment  ← #8, #9 with docs
8. Efficiency Notes  ← #10, demoted from CRITICAL
```

Each section has ONE job.

---

## Decision Tree Example (New in v2.1)

One of the clearest improvements - explicit decision logic:

```
When you see workflow instructions:

┌─────────────────────────────────────┐
│ Is it an <ask> tag?                 │
│ OR                                  │
│ <action> with verb "Ask user for"?  │
└─────────────────────────────────────┘
         │
         ├─ YES → Ask ONE question, STOP, wait for response
         │
         └─ NO → Check <action> verb:
                  │
                  ├─ "Suggest/Provide/Offer" → Provide 2-3 suggestions
                  │
                  ├─ "Create/Compile/Identify" → Execute action, show 3-5 bullets, ask
                  │
                  └─ "Explain/Shift/Acknowledge" → Say this for context
```

v2.0 described this in prose across multiple sections. v2.1 makes it visually clear.

---

## Testing Recommendation

### Before Deploying v2.1

**Goal**: Verify v2.1 produces identical behavior to v2.0

**Minimal Test** (~5 minutes):
1. Copy v2.1 to `system-prompt.md`
2. Load Casey agent
3. Run `*workflow-request` with intake file
4. Check Step 2 response for:
   - ✅ Step header shown once
   - ✅ 3-5 contextual bullets
   - ✅ 2-3 example questions
   - ✅ ONE direct question
   - ✅ No redundant reminders

**Comprehensive Test** (~20 minutes):
- Run same workflow with v2.0, capture all responses
- Run same workflow with v2.1, capture all responses
- Diff the outputs
- If identical → v2.1 is successful refactor
- If different → investigate root cause

### If Tests Pass

```bash
# Promote v2.1 to active
cp lib/agents/prompts/versions/v2.1-consolidated.md lib/agents/prompts/system-prompt.md

# Update README
# Update version table in README

# Commit
git add lib/agents/prompts/
git commit -m "[PROMPT-v2.1] Consolidate and clarify system prompt structure"
```

---

## Why v3.x Failed (Lessons Applied)

From CHANGELOG analysis:

| Version | Approach | Result | Lesson |
|---------|----------|--------|--------|
| v3.0 | Added context awareness | Made delegation worse | Don't add features without fixing core issues |
| v3.1 | Fixed delegation | Made output verbose | One fix can expose another issue |
| v3.2 | Added conciseness rules | Still broken | Output formatting doesn't fix behavior |
| v3.3 | Added meta-instructions | Created cognitive overhead | If instructions need a glossary, rewrite them |

**v2.1 Approach**: Don't add anything. Just reorganize what already works.

---

## Files Created

1. **`versions/v2.1-consolidated.md`**
   The proposed new system prompt (197 lines, down from 125 but clearer)

2. **`v2.0-vs-v2.1-comparison.md`**
   Detailed side-by-side comparison with metrics and examples

3. **`CHANGELOG.md`** (updated)
   Added v2.1 entry with full problem/change/expected outcome documentation

4. **`REVIEW-SUMMARY.md`** (this file)
   Executive summary of review findings and recommendations

---

## Recommendation

**Proceed with v2.1 testing** using the testing plan above.

**Rationale**:
- v2.0 has structural issues that will make future improvements harder
- v2.1 is a low-risk refactor (no new features = no new failure modes)
- Better foundation for future work
- Addresses real maintainability issues (redundancy, ambiguity, documentation)

**Next Steps**:
1. Review v2.1 content yourself
2. Run minimal test (5 min)
3. If behavior matches, run comprehensive test (20 min)
4. If tests pass, promote to active
5. If tests fail, investigate differences and adjust

---

## Questions to Consider

1. **Is line count increase acceptable?**
   v2.0: 125 lines | v2.1: 197 lines (+57%)
   But: Added examples, decision trees, comments = lower cognitive load despite more lines

2. **Should we test both prompts in production first?**
   Could add version selector to `systemPromptBuilder.ts` for A/B testing

3. **Are there other issues you've observed that v2.1 doesn't address?**
   This review was based on structure/clarity - behavioral issues may need different fixes

4. **Timeline for testing?**
   Recommend testing within next 2-3 days while review findings are fresh

---

## Appendix: Quick Reference

**Current file**: `/lib/agents/prompts/system-prompt.md` (v2.0)
**Proposed file**: `/lib/agents/prompts/versions/v2.1-consolidated.md`
**Comparison doc**: `/lib/agents/prompts/v2.0-vs-v2.1-comparison.md`
**Version history**: `/lib/agents/prompts/CHANGELOG.md`

**To test v2.1**:
```bash
cp lib/agents/prompts/versions/v2.1-consolidated.md lib/agents/prompts/system-prompt.md
# Run your test scenarios
# Revert if needed: git checkout lib/agents/prompts/system-prompt.md
```
