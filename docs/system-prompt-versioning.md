# System Prompt Versioning Implementation

**Date**: 2025-10-08
**Status**: Active
**Purpose**: Track and manage system prompt changes to achieve Claude Code-like behavior

---

## Overview

The agent orchestrator's system prompt is critical for determining agent behavior. This document describes the versioning system implemented to track changes as we reverse-engineer Claude Code's behavior through observation and iteration.

## Problem Statement

**Observation**: Claude Code and the app produce different outputs for the same agent workflows, despite using similar system prompts.

**Example** (Casey Deep-Dive Step 2):
- **Claude Code**: Proactively provides contextual example questions based on loaded intake files
- **App**: Only asks for input without providing guidance

**Root Cause**: The system prompt is the "operating system" for agent behavior, and small differences can have significant impact. Since Claude Code's exact prompt is unknown, we need to iterate and track changes systematically.

## Solution: Version-Controlled System Prompt

### Architecture

```
lib/agents/prompts/
├── README.md              # Usage documentation
├── CHANGELOG.md           # Detailed version history
├── system-prompt.md       # Current active template (v3.0)
└── versions/              # Historical versions
    ├── v2.0-action-vs-ask.md
    └── v3.0-context-aware.md
```

### Key Features

1. **External Template File**: System prompt lives in `system-prompt.md`, not hardcoded in TypeScript
2. **Variable Interpolation**: Uses `{{PLACEHOLDERS}}` for agent-specific values
3. **Version History**: Each version saved with descriptive name
4. **Change Tracking**: CHANGELOG.md documents problem → change → result
5. **Test Script**: Validates template loads and interpolates correctly

## Implementation Details

### systemPromptBuilder.ts Changes

**Before** (hardcoded):
```typescript
export function buildSystemPrompt(agent: Agent): string {
  return `You are ${agent.name}...
  // 200+ lines of hardcoded text
  `;
}
```

**After** (template-based):
```typescript
function loadPromptTemplate(): string {
  const templatePath = join(process.cwd(), 'lib/agents/prompts/system-prompt.md');
  return readFileSync(templatePath, 'utf-8');
}

export function buildSystemPrompt(agent: Agent): string {
  const template = loadPromptTemplate();
  return template
    .replace(/{{AGENT_NAME}}/g, agent.name)
    .replace(/{{AGENT_TITLE}}/g, agent.title)
    // ... more replacements
}
```

### Template Variables

| Placeholder | Source | Example |
|-------------|--------|---------|
| `{{AGENT_NAME}}` | agent.name | "Casey" |
| `{{AGENT_TITLE}}` | agent.title | "Business Analyst" |
| `{{PERSONA_ROLE}}` | `<role>` tag | "Senior Business Analyst" |
| `{{PERSONA_IDENTITY}}` | `<identity>` tag | "I gather detailed requirements..." |
| `{{PERSONA_COMMUNICATION_STYLE}}` | `<communication_style>` tag | "Professional, thorough..." |
| `{{PERSONA_PRINCIPLES}}` | `<principles>` tag | "I believe in..." |
| `{{COMMANDS_SECTION}}` | Generated from `<cmds>` | "*workflow - Run workflow" |
| `{{PROJECT_ROOT}}` | env.PROJECT_ROOT | "/Users/.../project" |
| `{{AGENT_PATH}}` | agent.path | "agents/casey" |

## Version History

### v3.1 - Action Tag Execution Pattern (2025-10-08) - CURRENT

**Problem**: Even with v3.0's context-aware improvements, the app didn't execute actions like Claude Code does.

**Root Cause**: `<action>Create refined summary</action>` was interpreted as "tell the user to create" rather than "I should create."

**Analysis**: After examining all workflow files, identified THREE distinct `<action>` patterns:
1. **Agent Execution**: "Create", "Compile", "Identify" → Agent performs action
2. **Guidance**: "Suggest questions about X:" → Agent provides examples
3. **Meta**: "Explain", "Shift to" → Agent says this for context

**Solution**: Added **INTERPRETING <action> TAGS - CRITICAL EXECUTION RULES** section with:
- Pattern recognition for three action types
- Concrete examples with ✅ CORRECT vs ❌ WRONG responses
- Explicit instruction: ANALYZE → PRESENT FINDINGS → THEN ASK (not DELEGATE → ASK)

**Expected**: Agent performs analysis/summarization before asking for input, matching Claude Code's collaborative approach

**Testing**: Use scripts/test-system-prompt.ts to verify v3.1 features present

---

### v3.0 - Context-Aware Guidance (2025-10-08) - SUPERSEDED

**Problem**: App not providing example questions like Claude Code does, even when `<action>` tag doesn't explicitly say "Suggest questions"

**Changes**:
1. Enhanced CONVERSATIONAL STYLE section to be proactive for ALL `<action>` tags
2. Added explicit instruction to review and reference loaded context files
3. Added guidance to make suggestions specific to actual content, not generic
4. Added distinction between guidance mode (suggestions) vs input mode (direct questions)

**Expected**: Agent provides helpful, contextual questions in Step 2 and similar steps

**Status**: Testing in progress

### v2.0 - Action vs Ask Distinction (Previous)

**Problem**: Agents overwhelming users with too many questions at once

**Changes**: Added distinction between `<action>` (guidance mode) and `<ask>` (input mode)

**Result**: Worked for explicit keywords, but missed implicit guidance opportunities

### v1.0 - Baseline (Initial)

Initial implementation based on AGENT-EXECUTION-SPEC.md hypothesis

## Workflow for Making Changes

### 1. Identify Behavioral Difference
- Compare Claude Code vs App outputs
- Document specific differences
- Note which workflow/step/scenario

### 2. Hypothesize Prompt Change
- What instruction might cause Claude Code's behavior?
- How can we make it explicit in the prompt?

### 3. Update CHANGELOG First
```markdown
## vX.X - Short Title (DATE)

### Problem/Observation
[What you observed...]

### Change Made
[Specific edits...]

### Expected Outcome
[What should happen...]

### Actual Result
_[Leave blank until tested]_
```

### 4. Edit system-prompt.md
Make your changes using proper `{{VARIABLES}}`

### 5. Test
```bash
# Verify template loads
npx tsx scripts/test-system-prompt.ts

# Test actual behavior
npm run dev
# Navigate to agent, run test scenario
```

### 6. Document Results
Update CHANGELOG.md "Actual Result" section

### 7. Create Version Snapshot
```bash
cp lib/agents/prompts/system-prompt.md \
   lib/agents/prompts/versions/vX.X-short-name.md
```

### 8. Commit
```bash
git add lib/agents/prompts/
git commit -m "[PROMPT-vX.X] Short description"
```

## Testing Strategy

### Quick Validation
```bash
npx tsx scripts/test-system-prompt.ts
```

Checks:
- Template loads successfully
- Variables interpolate correctly
- v3.0 features present

### Behavioral Testing

**Scenario**: Casey Deep-Dive Step 2
1. Load Casey agent
2. Attach intake file with specific requirements
3. Invoke deep-dive workflow
4. Check Step 2 response:
   - ✅ Shows step number and goal
   - ✅ References specific details from intake
   - ✅ Provides contextual example questions
   - ✅ Doesn't ask direct question (that comes after)

### Comparison Testing

Run same scenario in:
1. Claude Code (baseline)
2. App with previous version
3. App with new version

Compare:
- Tone and helpfulness
- Context awareness
- Specific vs generic guidance

## Debug Tips

### View Full System Prompt
Add to `lib/agents/agenticLoop.ts`:
```typescript
console.log('[systemPrompt]', systemPrompt);
```

### Check Template Path
```bash
ls -la lib/agents/prompts/system-prompt.md
```

### Validate Variable Replacement
Search generated prompt for any unreplaced `{{VARIABLES}}`

## Benefits

1. **Traceable**: Every change documented with rationale
2. **Reversible**: Can revert to any previous version
3. **Comparable**: Easy to diff versions
4. **Collaborative**: Clear documentation for team
5. **Debuggable**: Can see exact prompt sent to OpenAI
6. **Iterative**: Safe to experiment and refine

## Future Enhancements

Potential additions:
- A/B testing framework
- Automated behavioral testing
- Prompt diff viewer
- Performance metrics per version
- Auto-backup before changes

## References

- **Template**: `lib/agents/prompts/system-prompt.md`
- **Changelog**: `lib/agents/prompts/CHANGELOG.md`
- **Builder**: `lib/agents/systemPromptBuilder.ts`
- **Test**: `scripts/test-system-prompt.ts`
- **Spec**: `docs/AGENT-EXECUTION-SPEC.md`

---

**Remember**: The system prompt is our best approximation of Claude Code's behavior, not an exact specification. We're reverse-engineering through observation, so iterative refinement is expected and encouraged.
