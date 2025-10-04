# Edit Stories - Make Intelligent Changes to User Stories

<critical>The workflow execution engine is governed by: {project_root}/bmad/core/tasks/workflow.md</critical>
<critical>You MUST have already loaded and processed: {project_root}/bmad/sn/workflows/edit-stories/workflow.yaml</critical>
<critical>Load template reference: {project-root}/bmad/sn/templates/story-template.md for structure validation</critical>

<workflow>

<step n="1" goal="Load and analyze existing story">
<action>Ask user for the path to the story file to be edited</action>
<action>Load COMPLETE story file into context</action>
<action>Create backup of original story at {backup_file}</action>
<action>Parse the story structure and extract all sections</action>
<action>Validate story follows template structure</action>

Display story summary:
- **Story File:** {{story_file_path}}
- **Story ID:** [Extract from file]
- **Epic/Feature:** [Extract from file]
- **Sprint:** [Extract from file]
- **Story Points:** [Extract from file]
- **Priority:** [Extract from file]

**Current User Story:**
[Display the As a/I want/So that statement]

**Key Sections Present:**
- Functional Requirements: [Count FRs]
- Technical Requirements: [Present/Not Present]
- Testing Criteria: [Present/Not Present]
- Security & Access: [Present/Not Present]

<action>Confirm backup created at {backup_file}</action>
<ask>Confirm this is the correct story to edit</ask>
</step>

<step n="2" goal="Gather edit requirements">
Ask the user: **What changes need to be made to this story?**

<action>Listen for change requests and categorize them:</action>

**Change Categories:**
1. **Metadata changes** (story points, priority, sprint, assigned dev)
2. **User story changes** (role, capability, business value)
3. **Acceptance criteria changes** (add/modify/remove criteria)
4. **Functional requirement changes** (add/modify/remove FRs)
5. **Technical requirement changes** (fields, business rules, integrations)
6. **UI/UX changes** (forms, lists, UI specs)
7. **Security changes** (roles, permissions, visibility)
8. **Testing changes** (add/modify test scenarios)
9. **Scope changes** (add to scope, move to out-of-scope)
10. **Multiple changes** (combination of above)

<action>For each requested change, capture:
  - What section(s) will be affected
  - What specific content needs to change
  - Whether this is an add, modify, or remove operation
  - The reason for the change (if provided)
</action>

<action>Store all requested changes for processing</action>

Display change summary:
**Changes Requested:**
1. {{change_type_1}}: {{change_description_1}}
   - Affects: {{affected_sections_1}}
   - Operation: {{add_modify_remove_1}}

2. {{change_type_2}}: {{change_description_2}}
   - Affects: {{affected_sections_2}}
   - Operation: {{add_modify_remove_2}}

[Continue for all changes...]

<ask>Are these the changes you want to make? (yes/add more/modify)</ask>
</step>

<step n="3" goal="Analyze impact and detect conflicts">
<action>For each requested change, analyze potential impacts and conflicts</action>

**Conflict Detection Areas:**

1. **User Story Statement Conflicts:**
   - Does change to role/capability/value conflict with existing FRs?
   - Does it contradict the business context?
   - Does it change the core purpose of the story?

2. **Functional Requirement Conflicts:**
   - Do new FRs contradict existing FRs?
   - Are Given/When/Then statements still logical?
   - Do dependencies still make sense?

3. **Technical Requirement Conflicts:**
   - Do field changes conflict with FRs?
   - Do business rules still align with acceptance criteria?
   - Are integration points still valid?

4. **Testing Conflicts:**
   - Do existing tests cover new functionality?
   - Are test scenarios still relevant after changes?
   - Do edge cases need updating?

5. **Scope Conflicts:**
   - Does change expand scope beyond story size limits?
   - Should this be a separate story instead?
   - Does it affect story point estimate?

6. **Dependency Conflicts:**
   - Does change affect dependencies on other stories?
   - Do related stories need updates too?

<action>For each detected conflict or ambiguity, prepare clarification questions</action>

If conflicts/ambiguities detected:

**⚠️ Potential Conflicts Detected:**

**Conflict 1:** {{conflict_description_1}}
- **Current State:** {{current_content_1}}
- **Requested Change:** {{requested_change_1}}
- **Impact:** {{impact_description_1}}

<ask>How should this be resolved?
  a) {{resolution_option_1a}}
  b) {{resolution_option_1b}}
  c) {{resolution_option_1c}}
  d) Custom resolution (you specify)
</ask>

<action>Repeat for each conflict</action>
<action>Capture resolution decisions</action>

If no conflicts detected:
**✓ No conflicts detected. Changes can be applied cleanly.**
</step>

<step n="4" goal="Apply changes intelligently">
<action>For each approved change, apply to the story:</action>

**Change Application Process:**

1. **Metadata Changes:**
   - Update header fields directly
   - Recalculate totals if needed

2. **User Story Changes:**
   - Rewrite As a/I want/So that statement
   - Ensure clarity and completeness

3. **Add Functional Requirements:**
   - Add new FR-X with proper numbering
   - Use Given/When/Then format
   - Include implementation details
   - Ensure consistency with existing FRs

4. **Modify Functional Requirements:**
   - Update specific FR while preserving structure
   - Adjust details as needed
   - Update related test cases

5. **Remove Functional Requirements:**
   - Remove FR and renumber remaining FRs
   - Remove associated test cases
   - Update dependencies

6. **Technical Requirement Changes:**
   - Update Data/Fields section
   - Modify Business Rules
   - Adjust Integration Points
   - Update Performance requirements

7. **UI/UX Changes:**
   - Update affected forms/views/lists
   - Modify UI specifications
   - Ensure consistency with FRs

8. **Security Changes:**
   - Update access roles
   - Modify permissions
   - Adjust data visibility rules

9. **Testing Changes:**
   - Add new test scenarios
   - Update existing tests
   - Add edge cases
   - Ensure coverage of all FRs

10. **Scope Changes:**
    - Update assumptions
    - Modify out-of-scope items
    - Adjust story points if needed

<action>Apply all changes while maintaining template structure</action>
<action>Ensure all {{variables}} are populated (no placeholders)</action>
<action>Preserve markdown formatting</action>
<action>Update "Last Updated" timestamp</action>

<critical>After applying changes, validate the story:
  - All sections from template are present
  - No conflicting information remains
  - All FRs have corresponding tests
  - Story is still coherent and complete
  - Story points still appropriate for scope
</critical>
</step>

<step n="5" goal="Review and confirm changes">
<template-output>edited_story</template-output>

Display the edited story with changes highlighted:

━━━━━━━━━━━━━━━━━━━━━━━
**EDITED STORY PREVIEW**

**Changes Made:**
1. ✏️ {{change_1_summary}}
2. ✏️ {{change_2_summary}}
[Continue for all changes...]

━━━━━━━━━━━━━━━━━━━━━━━

**Updated Story:**
[Display full story with changes]

━━━━━━━━━━━━━━━━━━━━━━━

**Story Point Impact:**
- Original: {{original_story_points}}
- Updated: {{updated_story_points}}
- Change: {{points_delta}}

<ask>Approve changes [c], Make more edits [e], or Revert to original [r]?</ask>

<action>If [c] - proceed to save</action>
<action>If [e] - return to Step 2 for additional changes</action>
<action>If [r] - restore from backup and exit</action>
</step>

<step n="6" goal="Save edited story">
<action>Save updated story to {default_output_file} (overwrites original)</action>
<action>Keep backup file at {backup_file}</action>

Display save confirmation:

**✅ Story Edited Successfully!**

**Updated Story:**
- File: {{story_file_path}}
- Story ID: {{story_id}}
- Changes: {{total_changes}} modifications applied

**Backup:**
- Original saved at: {{backup_file}}

**Changes Summary:**
{{changes_summary_list}}

**Story Point Update:**
{{story_points_change_summary}}

**Next Steps:**
1. Review updated story with team
2. Update related stories if needed (dependencies affected)
3. Adjust sprint backlog if story points changed
4. Update tracking system with changes

<ask>Would you like to:
  - Edit another story [e]
  - View change diff [d]
  - Exit [x]
</ask>

<action>If [d] requested, show side-by-side comparison of backup vs updated</action>
</step>

</workflow>
