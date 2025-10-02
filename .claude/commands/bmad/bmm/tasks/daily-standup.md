<!-- Powered by BMAD-CORE™ -->

# Daily Standup v1.0

```xml
<task id="bmad/bmm/tasks/daily-standup.md" name="Daily Standup">
  <llm critical="true">
    <i>MANDATORY: Execute ALL steps in the flow section IN EXACT ORDER</i>
    <i>DO NOT skip steps or change the sequence</i>
    <i>HALT immediately when halt-conditions are met</i>
    <i>Each andlt;actionandgt; within andlt;stepandgt; is a REQUIRED action to complete that step</i>
    <i>Sections outside flow (validation, output, critical-context) provide essential context - review and apply throughout execution</i>
  </llm>
  <flow>
    <step n="1" title="Project Context Discovery">
      <action>Check for stories folder at /Users/bryan.inagaki/Documents/development/agent-orchestrator/{output_folder}/stories/ directory</action>
      <action>Find current story by identifying highest numbered story file</action>
      <action>Read story status (In Progress, Ready for Review, etc.)</action>
      <action>Extract agent notes from Dev Agent Record, TEA Results, PO Notes sections</action>
      <action>Check for next story references from epics</action>
      <action>Identify blockers from story sections</action>
    </step>

    <step n="2" title="Initialize Standup with Context">
      <output>
🏃 DAILY STANDUP - Story-{{number}}: {{title}}

Current Sprint Status:
- Active Story: story-{{number}} ({{status}} - {{percentage}}% complete)
- Next in Queue: story-{{next-number}}: {{next-title}}
- Blockers: {{blockers-from-story}}

Team assembled based on story participants:
{{ List Agents from /Users/bryan.inagaki/Documents/development/agent-orchestrator//bmad/_cfg/agent-party.xml }}
      </output>
    </step>

    <step n="3" title="Structured Standup Discussion">
      <action>Each agent provides three items referencing real story data</action>
      <action>What I see: Their perspective on current work, citing story sections (1-2 sentences)</action>
      <action>What concerns me: Issues from their domain or story blockers (1-2 sentences)</action>
      <action>What I suggest: Actionable recommendations for progress (1-2 sentences)</action>
    </step>

    <step n="4" title="Create Standup Summary">
      <output>
📋 STANDUP SUMMARY:
Key Items from Story File:
- {{completion-percentage}}% complete ({{tasks-complete}}/{{total-tasks}} tasks)
- Blocker: {{main-blocker}}
- Next: {{next-story-reference}}

Action Items:
- {daily-standup}: {{action-item}}
- {daily-standup}: {{action-item}}
- {daily-standup}: {{action-item}}

Need extended discussion? Use *party-mode for detailed breakout.
      </output>
    </step>
  </flow>

  <agent-selection>
  <activation critical="MANDATORY">
    <init>
      <step n="1">Load persona from this current file containing this activation you are reading now</step>
      <step n="2">Override with /Users/bryan.inagaki/Documents/development/agent-orchestrator//bmad/_cfg/agents/bmm-daily-standup.md if exists (replace, not merge)</step>
      <step n="3">Execute critical-actions section if present in current agent XML</step>
      <step n="4">Show greeting + numbered list of ALL commands IN ORDER from current agent's cmds section</step>
      <step n="5">CRITICAL HALT. AWAIT user input. NEVER continue without it.</step>
    </init>
    <commands critical="MANDATORY">
      <input>Number → cmd[n] | Text → fuzzy match *commands</input>
      <extract>exec, tmpl, data, action, run-workflow, validate-workflow</extract>
      <handlers>
        <handler type="run-workflow">
          When command has: run-workflow="path/to/x.yaml" You MUST:
          1. CRITICAL: Always LOAD /Users/bryan.inagaki/Documents/development/agent-orchestrator//bmad/core/tasks/workflow.md
          2. READ its entire contents - the is the CORE OS for EXECUTING modules
          3. Pass the yaml path as 'workflow-config' parameter to those instructions
          4. Follow workflow.md instructions EXACTLY as written
          5. Save outputs after EACH section (never batch)
        </handler>
        <handler type="validate-workflow">
          When command has: validate-workflow="path/to/workflow.yaml" You MUST:
          1. You MUST LOAD the file at: /Users/bryan.inagaki/Documents/development/agent-orchestrator//bmad/core/tasks/validate-workflow.md
          2. READ its entire contents and EXECUTE all instructions in that file
          3. Pass the workflow, and also check the workflow location for a checklist.md to pass as the checklist
          4. The workflow should try to identify the file to validate based on checklist context or else you will ask the user to specify
        </handler>
        <handler type="action">
          When command has: action="#id" → Find prompt with id="id" in current agent XML, execute its content
          When command has: action="text" → Execute the text directly as a critical action prompt
        </handler>
        <handler type="data">
          When command has: data="path/to/x.json|yaml|yml"
          Load the file, parse as JSON/YAML, make available as {data} to subsequent operations
        </handler>
        <handler type="tmpl">
          When command has: tmpl="path/to/x.md"
          Load file, parse as markdown with {{mustache}} templates, make available to action/exec/workflow
        </handler>
        <handler type="exec">
          When command has: exec="path"
          Actually LOAD and EXECUTE the file at that path - do not improvise
        </handler>
      </handlers>
    </commands>
    <rules critical="MANDATORY">
      Stay in character until *exit
      Number all option lists, use letters for sub-options
      Load files ONLY when executing
    </rules>
  </activation>
    <context type="prd-review">
      <i>Primary: Sarah (PO), Mary (Analyst), Winston (Architect)</i>
      <i>Secondary: Murat (TEA), James (Dev)</i>
    </context>
    <context type="story-planning">
      <i>Primary: Sarah (PO), Bob (SM), James (Dev)</i>
      <i>Secondary: Murat (TEA)</i>
    </context>
    <context type="architecture-review">
      <i>Primary: Winston (Architect), James (Dev), Murat (TEA)</i>
      <i>Secondary: Sarah (PO)</i>
    </context>
    <context type="implementation">
      <i>Primary: James (Dev), Murat (TEA), Winston (Architect)</i>
      <i>Secondary: Sarah (PO)</i>
    </context>
  </agent-selection>

  <llm critical="true">
    <i>This task extends party-mode with agile-specific structure</i>
    <i>Time-box responses (standup = brief)</i>
    <i>Focus on actionable items from real story data when available</i>
    <i>End with clear next steps</i>
    <i>No deep dives (suggest breakout if needed)</i>
    <i>If no stories folder detected, run general standup format</i>
  </llm>
</task>
```
