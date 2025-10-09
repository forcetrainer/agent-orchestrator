# System Prompt Version Control

This directory contains the versioned system prompt templates used by the agent orchestrator.

## Structure

```
lib/agents/prompts/
├── README.md              # This file
├── CHANGELOG.md           # Detailed version history with observations and results
├── system-prompt.md       # Current active version (symlink to versions/vX.X)
└── versions/              # All historical versions
    ├── v2.0-action-vs-ask.md
    └── v3.0-context-aware.md
```

## Current Version

**v3.2 - Conciseness and Formatting** (2025-10-08) - Reverted from v3.3

Key features:
- Distills analysis to essence: 3-5 bullet points maximum (not information dumps)
- Clean, scannable formatting with arrows (→) for cause/effect
- NO pre-written drafts or deliverables unless explicitly requested
- Natural framing: skip robotic intros like "I'll guide you through..."
- Focuses on UNDERSTANDING the context, not DOCUMENTING everything read
- Matches Claude Code's concise, focused communication style

**Note**: v3.3 was attempted to fix repetition issues but made behavior worse. Reverted to v3.2.

## Making Changes

### 1. Update the Active Template

Edit `system-prompt.md` with your changes. Use these placeholders for interpolation:

- `{{AGENT_NAME}}` - Agent's name
- `{{AGENT_TITLE}}` - Agent's title
- `{{PERSONA_ROLE}}` - From `<role>` tag
- `{{PERSONA_IDENTITY}}` - From `<identity>` tag
- `{{PERSONA_COMMUNICATION_STYLE}}` - From `<communication_style>` tag
- `{{PERSONA_PRINCIPLES}}` - From `<principles>` tag
- `{{COMMANDS_SECTION}}` - Auto-generated from `<cmds>` section
- `{{PROJECT_ROOT}}` - Project root path
- `{{AGENT_PATH}}` - Agent directory path

### 2. Document Your Changes

**Before testing**, update `CHANGELOG.md`:

```markdown
## vX.X - Short Title (YYYY-MM-DD)

### Problem/Observation
What behavior prompted this change? What differences did you observe between Claude Code and the app?

### Change Made
Specific modifications to the prompt. Include before/after snippets if helpful.

### Expected Outcome
What should this change achieve?

### Actual Result
_[Leave blank - fill in after testing]_
```

### 3. Create Version Snapshot

After confirming the changes work:

```bash
# Create versioned copy
cp system-prompt.md versions/vX.X-short-name.md
```

### 4. Test the Changes

Run your test scenarios comparing:
- Claude Code behavior (baseline)
- Previous app version
- New app version

Document results in CHANGELOG.md under "Actual Result"

### 5. Commit with Tagged Message

```bash
git add lib/agents/prompts/
git commit -m "[PROMPT-vX.X] Short description of change"
```

## Testing Strategy

### Quick Test
Compare same workflow step between Claude Code and app:
1. Load Casey agent
2. Provide intake file
3. Observe Step 2 response
4. Check: Does it provide contextual example questions?

### Comprehensive Test
Run full workflow comparison:
- Same agent, same inputs
- Log all responses
- Compare tone, helpfulness, context awareness

### Debug Logging
To see the full system prompt being sent:
1. Add `console.log('[systemPrompt]', systemPrompt)` in `agenticLoop.ts`
2. Check that template is loading correctly
3. Verify variable interpolation

## Version History Summary

| Version | Date | Key Feature | Status |
|---------|------|-------------|--------|
| v3.3 | 2025-10-08 | Context awareness, no repetition | Failed - Reverted |
| v3.2 | 2025-10-08 | Conciseness and formatting | Active |
| v3.1 | 2025-10-08 | Action tag execution pattern | Superseded |
| v3.0 | 2025-10-08 | Context-aware guidance | Superseded |
| v2.0 | 2025-10-XX | Action vs Ask distinction | Superseded |
| v1.0 | Initial | Baseline implementation | Superseded |

## Troubleshooting

### Template Not Loading
- Check file path: `lib/agents/prompts/system-prompt.md` must exist
- Check permissions: File must be readable
- Check syntax: Ensure no malformed `{{VARIABLES}}`

### Variables Not Interpolating
- Ensure placeholder matches exactly: `{{AGENT_NAME}}` not `{{agent_name}}`
- Check systemPromptBuilder.ts has the correct `.replace()` calls

### Behavior Not Changing
- Verify the change is in `system-prompt.md`, not just `versions/`
- Clear any caches
- Restart dev server
- Check that template is actually being loaded (add debug log)

## Philosophy

The system prompt is the "operating system" for agent behavior. Small changes can have significant effects.

**Guidelines:**
- Make one conceptual change at a time
- Document observations before and after
- Test thoroughly before committing
- When in doubt, create a new version rather than modifying existing

**Remember:** Claude Code's exact system prompt is unknown. We're reverse-engineering behavior through observation and iteration.
