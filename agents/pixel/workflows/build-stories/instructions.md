# Build Stories - Transform Requirements into User Stories

<critical>IMMEDIATELY load and read the COMPLETE file: bmad/core/tasks/workflow.md - This file contains the execution engine rules you MUST follow</critical>
<critical>You MUST have already loaded and processed: {project_root}/bmad/sn/workflows/build-stories/workflow.yaml</critical>

<workflow>

<step n="1" goal="Load and analyze requirements document">
<action>Confirm requirements document path has been loaded from critical-actions</action>
<action>If not loaded, ask user for path to detailed requirements document</action>
<action>Load COMPLETE requirements document into context</action>
<action>Parse and understand the full scope of requirements</action>
<action>Identify major functional areas and features</action>
<action>Note any technical constraints, integrations, or dependencies</action>

Display summary:
- **Requirements Document:** {{requirements_doc_path}}
- **Project/Feature:** [Extract from requirements]
- **Request Type:** [Workflow/Integration/Portal/etc.]
- **Major Features Identified:** [List high-level features]

<ask>Confirm this is the correct requirements document and understanding is accurate</ask>
</step>

<step n="2" goal="Gather story metadata and configuration">
Ask user for the following:

**Epic/Feature Information:**
- What is the Epic name? (Store as {{epic_name}})
- What Sprint is this for? (Store as {{sprint_number}})

**Story Planning:**
- Are there existing stories for this epic? If yes, what's the highest story number so far?
- What's the preferred story size? (Small: 1-3 points, Medium: 5-8 points, Large: 13+ points)

<action>Store all metadata for use in story generation</action>
<action>Note: Story numbers will be proposed during breakdown based on logical flow and any existing stories</action>
</step>

<step n="3" goal="Break down requirements into story candidates and create epic overview">
<action>Analyze requirements document and identify logical story breakdown</action>

Consider these story sizing principles:
- Each story should be completable within a single sprint
- Stories should deliver independent value when possible
- Break complex features into: Setup/Configuration, Core Functionality, Edge Cases, Integration
- Consider dependencies between stories

<action>Propose story numbers based on:
  - Logical implementation order
  - Dependencies (foundational stories get lower numbers)
  - Existing story numbers (if provided)
  - Leave room for future insertions (can use substories like 1.5, 2.5 if needed later)
</action>

<action>Create initial story breakdown with:
  - Proposed story number (e.g., 1, 2, 3, etc.)
  - Story title
  - Brief description (1-2 sentences)
  - Estimated story points (1, 2, 3, 5, 8, 13)
  - Dependencies (if any)
  - Key deliverables
  - Rationale for story number assignment
</action>

<critical>Load COMPLETE epic template: pixel/templates/epic-template.md</critical>

<action>Populate epic template with all variables:

**Header:**
- epic_name: {{epic_name}}
- sprint_number: {{sprint_number}}
- date: {{date}}
- user_name: {{user_name}}

**Overview:**
- epic_overview: [1-2 paragraph summary from requirements]
- timeline: [Extract from requirements or ask]
- complexity: [Low/Medium/High based on story analysis]
- success_criteria: [Extract from requirements - key metrics]

**Epic Summary:**
- total_stories: [Count from breakdown]
- total_story_points: [Sum of all story points]
- story_point_breakdown: [List each story with points]
- sprint_capacity: [Ask user or default to 60]
- epic_utilization_percent: [Calculate percentage]

**Story List:**
For each story, create a section with:
- Story number and title
- Story points
- Priority (High/Medium/Low)
- Dependencies
- Focus area
- Summary (2-3 sentences)
- Key deliverables (bulleted list)
- File reference (story-XX.md)

**Dependencies:**
- dependency_map: [Visual ASCII tree showing story dependencies]
- implementation_order: [Linear, parallel, or hybrid description]

**Requirements Coverage:**
- requirements_coverage: [Map each functional requirement to story numbers]
- success_criteria_coverage: [Checklist mapping success criteria to stories]

**Technical Decisions:**
- pending_decisions: [List decisions needed from teams]
- pending_inputs: [List external inputs needed]

**Next Steps:**
- before_dev_starts: [Prerequisites before development can begin]
- sprint_execution_plan: [Week-by-week breakdown suggestion]

**Risks:**
- identified_risks: [Key risks with mitigation strategies]
- success_factors: [What will make this epic successful]

**Contact:**
- requestor: [Extract from requirements or ask]
- requirements_doc_path: {{requirements_doc_path}}
</action>

<template-output>epic_overview</template-output>

Display epic overview for approval:

━━━━━━━━━━━━━━━━━━━━━━━
**EPIC OVERVIEW - {{epic_name}}**

[Display full rendered epic document]

━━━━━━━━━━━━━━━━━━━━━━━

<ask>Approve epic breakdown [c] or Request changes [e]?</ask>

<action>If changes requested:
  - Gather feedback on what to adjust (story count, sizing, dependencies, etc.)
  - Regenerate epic with changes
  - Re-present for approval
</action>

<action>Once approved:
  - Save epic to {epic_summary_file}
  - Confirm save location to user
  - Inform user: "Epic overview approved! Now proceeding to write detailed user stories for each item."
</action>
</step>

<step n="4" goal="Write stories using template" for-each="story in story_breakdown">
<critical>Load COMPLETE template file: pixel/templates/story-template.md</critical>
<critical>Use this template as the EXACT structure for every story - all sections must be populated</critical>

For each approved story, populate the story template:

<action>Set story-specific variables (replace ALL {{variables}} in template):

**Header Variables:**
  - story_id: Story {{story_number}} (e.g., Story 1, Story 2, Story 1.5 for substories)
  - date: {{date}} (current date)
  - epic_name: {{epic_name}}
  - sprint_number: {{sprint_number}}
  - story_points: [Suggest based on complexity, ask for confirmation]
  - priority: [Determine from requirements or ask - High/Medium/Low]
  - assigned_developer: "TBD" (will be assigned during sprint planning)

**Metadata Variables:**
  - creator_name: {{user_name}} (from config)
  - last_updated_date: {{date}} (current date)
  - status: "Draft - Ready for Review"
  - target_environment: "Development" (default for initial stories)

**Reference Variables:**
  - requirements_doc_link: {{requirements_doc_path}}
  - design_doc_link: "TBD" (add if design docs created)
  - related_story_ids: [Identify from dependencies]
  - kb_article_links: [Add if relevant KB articles exist, otherwise "None"]
</action>

<action>Write User Story statement:
  - user_role: [Extract from requirements - who will use this]
  - capability: [What they want to do]
  - business_value: [Why they need it - from requirements]
</action>

<action>Populate Acceptance Criteria:
  - Business Context: Extract relevant context from requirements doc
  - Related Requirements: Reference specific sections from requirements doc
  - Dependencies: Note any technical or story dependencies
</action>

<action>Write Functional Requirements (FR-1, FR-2, etc.):
  - Use Given/When/Then format
  - Extract from detailed requirements
  - Include specific platform details (table names, field names if specified)
  - Add implementation details as bullet points

For EACH Functional Requirement, populate:
  - functional_requirement_N_title: [Descriptive title for FR]
  - precondition_N: [The Given state - what must be true before]
  - action_N: [The When action - what the user does]
  - expected_result_N: [The Then outcome - what should happen]
  - detail_Na, detail_Nb, detail_Nc: [Implementation specifics]

Note: Template shows FR-1, FR-2, FR-3 as examples. Add more FRs as needed by following the same pattern.
</action>

<action>Populate Technical Requirements:

**Data/Fields:**
  - field_requirement_1, field_requirement_2, field_requirement_3: [Specific field requirements - add more as needed]
  - Example: "Create field 'u_approval_status' (Choice) on incident table with values: Pending, Approved, Rejected"

**Business Rules:**
  - business_rule_1, business_rule_2: [Business logic and validation rules - add more as needed]
  - Example: "When incident priority is Critical, auto-assign to Tier 3 support"

**Integration Points:**
  - integration_1, integration_2: [External systems or APIs - add more as needed or set to "None"]
  - Example: "REST integration with Asset Management System via MID Server"

**Performance/Scale:**
  - performance_requirement: [Volume/performance requirements from requirements doc or set to "Standard performance expectations"]
  - Example: "Handle 500 concurrent users, process 10,000 records/hour"
</action>

<action>Populate UI/UX Requirements:

**UI/UX Details:**
  - ui_ux_details: [Overall UI/UX specifications from requirements]
  - Example: "Add new section to incident form for approval workflow. Use read-only fields for status display."

**Affected Forms/Views:**
  - form_1, form_2: [Specific forms that will be modified - add more as needed or set to "None"]
  - Example: "Incident form (default view), Change Request form (ITIL view)"

**Affected Lists:**
  - list_1: [Lists that will be modified - add more as needed or set to "None"]
  - Example: "Incident list - add 'Approval Status' column"
</action>

<action>Populate Security & Access Control:

**Access Roles:**
  - access_roles: [Who can access this functionality - extract from requirements]
  - Example: "incident_manager, itil_admin, approval_coordinator"

**Permissions:**
  - permissions: [Specific permissions required]
  - Example: "Read: all users with incident role, Write: incident_manager only, Delete: itil_admin only"

**Data Visibility:**
  - data_visibility_rules: [Data visibility and ACL rules]
  - Example: "Users can only see incidents in their assignment group. Managers can see all incidents in their department."
</action>

<action>Write Testing Criteria:

**Unit Testing:**
  - unit_test_1, unit_test_2: [Platform-specific tests - add more as needed]
  - Example: "Test business rule fires when priority changes to Critical"
  - Example: "Test ACL prevents non-managers from editing approved incidents"

**Integration Testing:**
  - integration_test_1, integration_test_2: [End-to-end scenarios - add more as needed]
  - Example: "Test full approval workflow from request to completion"
  - Example: "Test integration with Asset Management API returns correct data"

**UAT Scenarios:**
  - uat_scenario_1, uat_scenario_2, uat_scenario_3: [Business user test cases - add more as needed]
  - Example: "Manager approves incident and verifies email notification sent"
  - Example: "Requester views approval status in portal"

**Edge Cases/Negative Testing:**
  - edge_case_1, edge_case_2: [Error handling, validation, boundary conditions - add more as needed]
  - Example: "Test behavior when approval times out after 48 hours"
  - Example: "Test validation when required field is blank"
</action>

<action>Set Definition of Done:
  - Use standard DoD checklist (template includes standard items)
  - additional_done_criteria: [Add story-specific completion criteria beyond standard DoD]
  - target_environment: "Development" (default, will promote through test to prod)
  - Example additional criteria: "Approval matrix documented in wiki", "Training materials created for managers"
</action>

<action>Add Notes & Assumptions:

**Additional Notes:**
  - additional_notes: [Any important context, decisions, or notes for developers]
  - Example: "This story builds on the approval framework from Story 1. Ensure Story 1 is deployed first."

**Assumptions:**
  - assumption_1, assumption_2: [Key assumptions made - add more as needed]
  - Example: "Assumes all managers have email addresses in their user profiles"
  - Example: "Assumes approval SLA is 48 business hours (not configurable in v1)"

**Out of Scope:**
  - out_of_scope_1, out_of_scope_2: [What is explicitly NOT included - add more as needed]
  - Example: "Bulk approval of multiple incidents (future enhancement)"
  - Example: "Integration with external approval tools (phase 2)"
</action>

<action>Add References:
  - requirements_doc_link: {{requirements_doc_path}} (already set in Header Variables)
  - design_doc_link: [Add if design docs exist, otherwise "TBD"]
  - related_story_ids: [List stories this one depends on or is related to]
  - kb_article_links: [Relevant KB articles, best practices, or "None"]
</action>

<critical>Generate the complete story by:
  1. Taking the loaded story-template.md structure
  2. Replacing ALL {{variables}} with populated values
  3. Ensuring NO placeholders remain (all {{variable}} markers must be replaced)
  4. Following the EXACT section structure from the template
  5. Maintaining all markdown formatting from template

**Pre-Save Validation Checklist:**
- [ ] All header variables populated (story_id, epic_name, sprint_number, story_points, priority, assigned_developer)
- [ ] User story statement complete (user_role, capability, business_value)
- [ ] All FRs have titles, preconditions, actions, expected results, and details
- [ ] Technical requirements sections complete (fields, business rules, integrations, performance)
- [ ] UI/UX requirements specified (ui_ux_details, forms, lists)
- [ ] Security & access control defined (access_roles, permissions, data_visibility_rules)
- [ ] All test types have scenarios (unit, integration, UAT, edge cases)
- [ ] Definition of done includes target_environment and additional_done_criteria
- [ ] Notes & assumptions documented (additional_notes, assumptions, out_of_scope)
- [ ] All references included (requirements_doc_link, design_doc_link, related_story_ids, kb_article_links)
- [ ] Metadata complete (creator_name, last_updated_date, status)
- [ ] NO {{variable}} placeholders remain in the document
</critical>

<template-output>individual_story</template-output>

Display completed story for review:

━━━━━━━━━━━━━━━━━━━━━━━
**Story {{story_number}}: {{story_title}}**

[Display full rendered story]

━━━━━━━━━━━━━━━━━━━━━━━

<ask>Approve story [c] or Edit [e]?</ask>

<action>If edit requested, make changes and re-display</action>
<action>When approved, save story to {default_output_file}</action>
<action>Confirm save location to user</action>
</step>

<step n="5" goal="Update epic overview with completion status">
<action>Update the epic overview document saved in step 3</action>
<action>Change status from "Pending Approval - Epic Structure Review" to "Complete - Ready for Sprint Planning"</action>
<action>Confirm all stories have been written and saved</action>
</step>

<step n="6" goal="Workflow completion">
Display completion summary:

**✅ Story Building Complete!**

**Stories Created:** {{total_stories}}
**Total Story Points:** {{total_points}}
**Epic:** {{epic_name}}
**Sprint:** {{sprint_number}}

**Epic Overview:**
- {epic_summary_file}

**Story Files:**
- Location: {sn_projects_folder}/{{project_slug}}-{{date}}/3-stories/
- Files: story-01.md, story-02.md, story-03.md, etc.

**Next Steps:**
1. Review epic overview and stories with development team
2. Refine story points during sprint planning
3. Assign stories to developers
4. Load into sprint backlog

<ask>Would you like to:
  - Create more stories [m]
  - Edit existing stories (use *edit-stories command) [e]
  - Exit [x]
</ask>
</step>

</workflow>
