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

## v2.1 - Consolidation and Clarification (2025-10-09) - PROPOSED

### Problem/Observation
Deep review of v2.0 system prompt revealed several structural issues:

**1. Redundancy and Duplication:**
- Tool usage instructions repeated 3 times (lines 23-29, 101-104, 123)
- Workflow execution rules split across 4 separate sections
- "Wait for results" guidance repeated multiple times

**2. Overuse of "CRITICAL" Labels:**
- 6 sections marked "CRITICAL" diluted the impact
- When everything is critical, nothing is critical

**3. Conflicting/Ambiguous Rules:**
- Unclear distinction between providing 2-3 suggestions vs asking 1 question
- What if `<action>` asks for input? No clear decision rule provided
- "CONVERSATIONAL STYLE" section tried to cover too many concerns at once

**4. Missing Documentation:**
- Template variables like `{{COMMANDS_SECTION}}` had no explanatory comments
- Environment variables listed but not explained when/how to use them

**5. Cognitive Load:**
- Mixed concerns across sections made scanning and comprehension difficult
- No clear decision trees for pattern recognition

**Root Cause**: v2.0 evolved through incremental additions without periodic refactoring. The structure became cluttered and ambiguous over time.

### Change Made
**This is a REFACTOR, not a feature addition.** Core functionality unchanged.

**Consolidation:**
- Combined all tool usage and workflow execution into ONE section (was 4 sections)
- Removed redundant tool usage reminder at end of prompt
- Grouped related concepts (e.g., all user communication rules together)

**Clarification:**
- Reduced "CRITICAL" labels from 6 to 1 (only truly critical section marked)
- Added explicit decision tree for action vs ask distinction:
  ```
  <ask> tag OR action verb = "Ask" → ONE question, wait
  <action> verb = "Suggest/Provide/Offer" → 2-3 suggestions, continue
  ```
- Split "CONVERSATIONAL STYLE" into focused sections: Question Cadence, Step Display, General Style

**Documentation:**
- Added comments explaining what `{{COMMANDS_SECTION}}` and other template vars contain
- Added explanations for environment variables (when/how to use)
- Added visual pattern indicators in Action Tag section (ANALYZE → PRESENT → ASK)

**Reorganization:**
- 7 focused sections (down from 10+ mixed sections)
- Each section has a single, clear purpose
- Logical flow: Identity → Critical Execution → Interpretation → Communication → Formatting → Operations

**Line count increased** (125 → 197) but cognitive load DECREASED because:
- Added decision trees and examples for clarity
- Added explanatory comments for maintenance
- Removed redundancy (higher signal-to-noise ratio)
- Better organization reduces scanning time

### Expected Outcome
- **Same behavior** as v2.0 (no functional changes, just structural cleanup)
- **Reduced ambiguity** - clearer decision rules for agents
- **Easier maintenance** - better documentation, focused sections
- **Better foundation** for future improvements (clean structure to build on)

### Testing Plan
1. **Minimal test**: Run Casey workflow Step 2 with v2.1, verify behavior matches v2.0
2. **Comprehensive test**: Run full workflow comparison v2.0 vs v2.1, document any differences
3. **If identical behavior**: v2.1 is successful consolidation, promote to active
4. **If behavior differs**: Identify root cause, fix, retest

### Actual Result
_[To be filled in after testing]_

### Files Created
- `/lib/agents/prompts/versions/v2.1-consolidated.md` - New proposed prompt
- `/lib/agents/prompts/v2.0-vs-v2.1-comparison.md` - Detailed comparison document

---

## REVERT to v2.0 (2025-10-08)

### Problem/Observation
All v3.x versions (v3.0, v3.1, v3.2, v3.3) failed to improve agent behavior:
- v3.0: Agent became more context-aware but still delegated instead of executing
- v3.1: Fixed delegation but made output too verbose
- v3.2: Improved conciseness but agents still not behaving correctly
- v3.3: Attempted to fix repetition but made behavior worse

User feedback: "The system prompt is definitely not working properly."

**Root Cause Hypothesis**: The incremental additions in v3.x may have created conflicting instructions or cognitive overhead. v2.0 was simpler and may have been more effective despite lacking some features.

### Change Made
- Reverted `system-prompt.md` back to v2.0-action-vs-ask.md
- Updated status to indicate reversion
- Documented all v3.x versions as failed experiments

### Expected Outcome
- More predictable agent behavior with simpler, clearer instructions
- Easier to debug issues with less complex prompt
- Fresh baseline for future improvements

### Actual Result
_[To be filled in after testing]_

---

## v3.3 - Context Awareness and No Repetition (2025-10-08)

### Problem/Observation
v3.2 improved conciseness, but agents are **repeating themselves** unnecessarily:

**Issue 1 - Step headers repeating**:
```
[First message in Step 2]
"Step 2: Refine problem statement
I'll guide you through the requirements session..."

[Second message, still Step 2]
"Step 2: Refine problem statement
I'll guide you through the requirements session..."  ❌ REPETITIVE
```

**Issue 2 - Session intros repeating**:
The critical-action says "Remind at start: 'I'll guide you through...'" but agent shows it on EVERY response, not just at start of SESSION.

**Root Cause**: Ambiguous language about "at start" and "first time":
- "At start of your response" interpreted as "every response" (wrong)
- Should be "first response when entering that step" (correct)
- "Remind at start" interpreted as "every time" (wrong)
- Should be "once at session start" (correct)

**Deeper Issue**: Agent not using conversation history to check if it already said something. LLMs have full context but aren't explicitly told to avoid repetition.

### Change Made
Added two new sections:

**1. UNDERSTANDING "AT START" AND "FIRST TIME" INSTRUCTIONS**
- Clarifies "at start of session" vs "at start of step" vs "at start of response"
- Explicit rule: Show step number FIRST message of that step only
- Explicit rule: Show session reminders FIRST message of session only
- Examples showing correct vs incorrect timing

**2. CONTEXT AWARENESS - Don't Repeat Yourself** (CRITICAL)
- Instructs agent to CHECK conversation history before saying something
- "You have the ENTIRE conversation history in your context"
- Lists what NOT to repeat (step numbers, intros, analysis, questions)
- Exceptions: When user didn't answer, went off-topic, or explicitly asked to repeat
- How to check: "Look back at YOUR previous messages - did you already say this?"
- Examples showing good vs bad context awareness

### Expected Outcome
- Step number and goal shown ONCE when entering new step (not every response in that step)
- Session intro ("I'll guide you...") shown ONCE at session start (not repeated)
- Agent recognizes what it already said and doesn't repeat word-for-word
- Conversations feel natural, not robotic/repetitive
- Matches Claude Code's context-aware, non-repetitive behavior

### Actual Result
**FAILED - Reverted to v3.2**: Made behavior worse, not better. Agent became more confused about when to repeat. The additional instructions about checking conversation history appear to have created cognitive overhead rather than solving the problem. Reverting to v3.2 which had better overall behavior.

**Lesson Learned**: Adding more explicit instructions about repetition may actually increase repetition as the agent tries to follow conflicting rules. The root issue may need to be addressed differently (possibly in agent files or workflow instructions rather than system prompt).

---

## v3.2 - Conciseness and Formatting (2025-10-08) - ACTIVE (Reverted from v3.3)

### Problem/Observation
v3.1 fixed the action execution pattern (agent now analyzes instead of delegates), but output is **too verbose and less clean** than Claude Code:

**Claude Code** (clean, concise):
```
Based on Alex's intake, I can see the core issue is about RCA completion delays.
Here's what I'm seeing from the intake:
- Problem: RCAs not completed on time → delays mitigations → repeat outages
- Goal: Complete RCAs within 5 days of outage resolution
- Solution approach: Automated reminders + escalations

For the refined problem statement, you might want to ask John:
- "Can you describe a recent example where delayed RCA led to a repeat outage?"
[3-4 more contextual questions]
```

**App with v3.1** (verbose, cluttered):
```
I'll guide you through the requirements session by suggesting questions...

Summary (analysis of Alex's intake)
Problem: Root Cause Analyses (RCAs) are not completed in a timely manner, causing repeat outages...
[200+ words of analysis]
Refined problem statement (draft) RCAs are frequently completed late or not at all...
[Another 150 words of pre-written draft]

You might want to ask about:
- Who is the designated escalation contact...
```

**Issues**:
- Information overload (dumps all analysis vs distilling essence)
- Creates drafts/deliverables not requested
- Awkward framing ("I'll guide you..." feels robotic)
- Poor formatting (walls of text vs scannable bullets)
- Over-thorough instead of focused

**Root Cause**: v3.1 says "show your work/analysis" but doesn't specify HOW MUCH or IN WHAT FORMAT. LLM interprets as "show everything thoroughly" rather than "distill to essence concisely."

### Change Made
Added new section after INTERPRETING <action> TAGS: **CONCISENESS AND FORMATTING RULES**

Key additions:
1. **Distill to essence**: 3-5 key bullet points maximum for analysis
2. **Keep bullets SHORT**: One line each, use arrows (→) for cause/effect
3. **Focus on what matters**: Not comprehensive documentation
4. **Clean, scannable formatting**: No walls of text
5. **DO NOT pre-write deliverables**: Unless explicitly asked for a draft
6. **Natural framing**: Skip robotic intros like "I'll guide you through..."

Added concrete GOOD vs BAD examples showing:
- ✅ 3 concise bullets with arrows
- ❌ Multi-paragraph analysis dump with pre-written drafts

### Expected Outcome
- Analysis condensed to 3-5 essential bullet points
- Each bullet one line, scannable
- No pre-written drafts unless asked
- Natural, conversational flow
- Matches Claude Code's conciseness and clarity

### Actual Result
_[To be filled in after testing]_

---

## v3.1 - Action Tag Execution Pattern (2025-10-08) - SUPERSEDED

### Problem/Observation
Even with v3.0's context-awareness improvements, the app still produces fundamentally different output than Claude Code:

**Claude Code** (Step 2 - Refine problem statement):
```
Based on Alex's intake, I can see the core issue is about RCA completion delays.
Here's what I'm seeing from the intake:
- Problem: RCAs not completed on time → delays mitigations → repeat outages
- Goal: Complete RCAs within 5 days of outage resolution
- Solution approach: Automated reminders + escalations

For the refined problem statement, you might want to ask John:
- "Can you describe a recent example where a delayed RCA led to a repeat outage?"
[...more contextual questions...]

Please input the refined problem statement with business context based on your discussion with John:
```

**App with v3.0** (Same step):
```
You lead: please provide a refined problem statement with business context
(one or two short paragraphs) based on the attached intake. Ask John (the requestor)
to confirm or adjust wording. I'll wait for your input before suggesting follow-ups.
```

**Root Cause**: The instruction `<action>Create refined summary focused on ITSM enhancement needs</action>` is being interpreted as "tell the user to create" rather than "I (the agent) should create."

After analyzing all workflow instruction files, we identified THREE distinct `<action>` patterns:
1. **Agent Actions**: "Create", "Compile", "Identify", "Present", "Based on" → Agent executes
2. **Guidance Actions**: "Suggest questions about X:" → Agent provides examples
3. **Meta Actions**: "Explain", "Shift to", "Acknowledge" → Agent says this

The app was treating Type 1 (Agent Actions) as Type 3 (Meta/Instructions to relay to user).

### Change Made
Added new section: **INTERPRETING <action> TAGS - CRITICAL EXECUTION RULES**

This section:
1. Explicitly states that `<action>` tells the AGENT what to do, not what to tell the user
2. Provides pattern recognition for three types of actions with concrete examples
3. Shows correct vs incorrect interpretations with examples
4. Emphasizes the pattern: ANALYZE → PRESENT → THEN ASK (not DELEGATE → ASK)

Key addition:
```
If <action> starts with verbs like "Create", "Compile", "Identify", "Present", "Based on":
→ YOU execute this action using loaded context
→ Show your work/analysis to the user
→ THEN ask for their input/validation
```

### Expected Outcome
- Agent executes actions (analyze, summarize, compile) before asking for input
- Agent demonstrates it has read and understood loaded context
- Agent provides analysis/findings first, then solicits user validation
- Behavior should closely match Claude Code's "collaborative partner" approach

### Actual Result
_[To be filled in after testing]_

---

## v3.0 - Context-Aware Guidance (2025-10-08) - SUPERSEDED

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
**Partial success**: Agent became more context-aware but still didn't execute actions properly. It would delegate tasks to the user rather than performing analysis itself. Led to v3.1 to fix action execution pattern.

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
