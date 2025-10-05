# Review Epic - Comprehensive Quality Assurance for Story Sets

<critical>The workflow execution engine is governed by: {project_root}/bmad/core/tasks/workflow.md</critical>
<critical>You MUST have already loaded and processed: {project_root}/bmad/sn/workflows/review-epic/workflow.yaml</critical>
<critical>Load template reference: {bundle-root}/templates/story-template.md for validation</critical>

<workflow>

<step n="1" goal="Load epic and all related artifacts">
<action>Ask user for the epic folder path containing all story files</action>
<action>Ask user for the original requirements document path</action>
<action>Load COMPLETE requirements document into context</action>
<action>Discover all story files in the epic folder (story-*.md)</action>
<action>Load COMPLETE content of each story file</action>
<action>Parse and extract key information from each story</action>

Display epic overview:
**Epic Review - Initial Load**

- **Epic Name:** {{epic_name}}
- **Epic Folder:** {{epic_folder_path}}
- **Requirements Doc:** {{requirements_doc_path}}
- **Stories Found:** {{total_story_count}}

**Story Inventory:**
- Story 1: {{story_1_title}} ({{story_1_points}} points)
- Story 2: {{story_2_title}} ({{story_2_points}} points)
- Story 3: {{story_3_title}} ({{story_3_points}} points)
[Continue for all stories...]

**Total Story Points:** {{total_points}}

<ask>Confirm this is the correct epic to review</ask>
</step>

<step n="2" goal="Analyze story completeness and quality">
<action>For each story, perform quality checks:</action>

**Quality Criteria per Story:**

1. **Template Compliance:**
   - All required sections present?
   - All {{variables}} replaced with actual content?
   - Proper markdown formatting?
   - No placeholder text remaining?

2. **User Story Quality:**
   - Clear "As a/I want/So that" statement?
   - Role is specific and realistic?
   - Capability is clear and measurable?
   - Business value is articulated?

3. **Acceptance Criteria Completeness:**
   - Business context provided?
   - Related requirements referenced?
   - Dependencies documented?

4. **Functional Requirements Quality:**
   - All FRs use Given/When/Then format?
   - FRs are specific and testable?
   - Implementation details provided?
   - No conflicting FRs?

5. **Technical Requirements Completeness:**
   - Data/Fields specified for ServiceNow?
   - Business rules documented?
   - Integration points identified?
   - Performance requirements clear?

6. **UI/UX Specifications:**
   - Affected forms/views/lists documented?
   - UI requirements clear?

7. **Security & Access Control:**
   - Roles defined?
   - Permissions specified?
   - Data visibility rules clear?

8. **Testing Coverage:**
   - Unit tests defined?
   - Integration tests defined?
   - UAT scenarios documented?
   - Edge cases covered?
   - Tests cover all FRs?

9. **Definition of Done:**
   - Standard DoD items present?
   - Story-specific criteria added?
   - Target environment specified?

10. **Clarity & Completeness:**
    - Can a developer implement without clarification?
    - Are there ambiguities?
    - Is scope clear?

<action>Score each story on quality (1-10 scale)</action>
<action>Document any quality issues found</action>

<template-output>story_quality_analysis</template-output>

Display quality analysis:

**📊 Story Quality Analysis**

**Story 1** - {{story_1_title}} - Quality Score: {{quality_score_1}}/10
✓ Strengths: {{story_1_strengths}}
⚠️ Issues: {{story_1_issues}}

**Story 2** - {{story_2_title}} - Quality Score: {{quality_score_2}}/10
✓ Strengths: {{story_2_strengths}}
⚠️ Issues: {{story_2_issues}}

[Continue for all stories...]

**Overall Epic Quality Score:** {{average_quality_score}}/10

<ask>Continue to dependency analysis? [c]</ask>
</step>

<step n="3" goal="Validate logical ordering and dependencies">
<action>Analyze story numbering and dependencies</action>

**Dependency Analysis:**

For each story:
1. **Extract declared dependencies** from Dependencies section
2. **Identify implicit dependencies** from story content:
   - Does story require data model from another story?
   - Does story depend on configuration from another story?
   - Does story build on functionality from another story?
   - Does story reference fields/rules/integrations from another story?

3. **Validate dependency ordering:**
   - Story X depends on Story Y → Y must have lower number than X
   - Flag circular dependencies (Story A depends on B, B depends on A)
   - Flag forward dependencies (Story 2 depends on Story 5)

4. **Identify missing dependencies:**
   - Story should have dependency but doesn't list it
   - Story has technical prerequisite not documented

<action>Build dependency graph for visualization</action>
<action>Detect ordering violations</action>

<template-output>dependency_analysis</template-output>

Display dependency findings:

**🔗 Dependency Analysis**

**Dependency Map:**
```
Story 1 (Foundation)
  ↓ required by Story 2, Story 3

Story 2 (Core Feature)
  ↓ required by Story 4
  ⚠️ VIOLATION: Also depends on Story 3 (later story)

Story 3 (Configuration)
  ↓ required by Story 2, Story 5

Story 4 (Integration)
  ↓ No downstream dependencies

Story 5 (Enhancement)
  ⚠️ VIOLATION: Depends on Story 7 (not yet created)
```

**❌ Ordering Violations Detected: {{violation_count}}**

**Violation 1:** Story {{story_x}} depends on Story {{story_y}}
- **Problem:** Story {{story_y}} comes AFTER Story {{story_x}} ({{story_y}} > {{story_x}})
- **Impact:** Story {{story_x}} cannot be implemented until Story {{story_y}} is complete
- **Recommendation:**
  a) Renumber: Story {{story_y}} → Story {{new_number_y}}, Story {{story_x}} → Story {{new_number_x}}
  b) Remove dependency and make Story {{story_x}} independent
  c) Split Story {{story_x}} into two stories

**Violation 2:** Circular dependency detected
- **Problem:** Story {{story_a}} depends on Story {{story_b}}, but Story {{story_b}} also depends on Story {{story_a}}
- **Impact:** Neither story can be started without the other
- **Recommendation:**
  a) Create Story {{story_a}}.5 with shared foundation
  b) Refactor to remove circular dependency
  c) Merge into single story

[Continue for all violations...]

**⚠️ Missing Dependencies Detected: {{missing_count}}**

**Missing 1:** Story {{story_n}} uses fields from Story {{story_m}} but doesn't list dependency
- **Evidence:** Story {{story_n}} references {{field_name}} created in Story {{story_m}}
- **Recommendation:** Add "Depends on Story {{story_m}}" to Story {{story_n}}

[Continue for all missing dependencies...]

<ask>Review dependency issues and proposed resolutions? (continue/fix now)</ask>

<action>If "fix now" - prompt for which issues to fix and how</action>
<action>If "continue" - proceed to requirements coverage analysis</action>
</step>

<step n="4" goal="Verify requirements coverage">
<action>Compare requirements document against all stories</action>

**Requirements Coverage Analysis:**

1. **Extract all requirements from requirements document:**
   - Functional requirements
   - Technical requirements
   - UI/UX requirements
   - Integration requirements
   - Security requirements
   - Performance requirements

2. **Map requirements to stories:**
   - Which story(ies) address each requirement?
   - Are any requirements not covered by any story?
   - Are any requirements covered by multiple stories (potential duplication)?

3. **Check for scope creep:**
   - Are there stories that don't trace back to requirements?
   - Have stories added functionality not in requirements?

4. **Validate completeness:**
   - Are all requirements fully addressed?
   - Are requirements only partially implemented?

<action>Build requirements traceability matrix</action>

<template-output>requirements_coverage</template-output>

Display coverage analysis:

**📋 Requirements Traceability Matrix**

**Requirement 1:** {{requirement_1_description}}
- ✅ Covered by: Story {{story_x}}, Story {{story_y}}
- Coverage: Complete

**Requirement 2:** {{requirement_2_description}}
- ⚠️ Covered by: Story {{story_z}}
- Coverage: Partial (missing {{missing_aspect}})

**Requirement 3:** {{requirement_3_description}}
- ❌ NOT COVERED by any story
- Impact: Critical functionality gap

**Requirement 4:** {{requirement_4_description}}
- ⚠️ Covered by: Story {{story_a}}, Story {{story_b}}, Story {{story_c}}
- Coverage: Duplicate (potential waste)

[Continue for all requirements...]

**Coverage Summary:**
- Total Requirements: {{total_requirements}}
- Fully Covered: {{fully_covered_count}} ({{coverage_percentage}}%)
- Partially Covered: {{partially_covered_count}}
- Not Covered: {{not_covered_count}}
- Duplicated: {{duplicated_count}}

**❌ Gaps Detected: {{gap_count}}**

**Gap 1:** {{gap_description_1}}
- **Requirement:** {{missing_requirement_1}}
- **Impact:** {{gap_impact_1}}
- **Recommendation:** Create Story {{suggested_story_number}} to address this requirement

**Gap 2:** {{gap_description_2}}
- **Requirement:** {{missing_requirement_2}}
- **Impact:** {{gap_impact_2}}
- **Recommendation:** Expand Story {{existing_story}} to include this requirement

[Continue for all gaps...]

**⚠️ Scope Creep Detected: {{scope_creep_count}}**

**Creep 1:** Story {{story_n}} includes {{functionality}} not in requirements
- **Recommendation:**
  a) Remove from story (stick to requirements)
  b) Add to out-of-scope section
  c) Get requirements updated to include this

[Continue for all scope creep items...]

<ask>Review coverage gaps and scope issues? (continue/address now)</ask>
</step>

<step n="5" goal="Validate story sizing and sprint feasibility">
<action>Analyze story points and sprint planning</action>

**Story Sizing Validation:**

1. **Check story point consistency:**
   - Are similar stories sized similarly?
   - Are story points appropriate for scope?
   - Are any stories too large (>13 points)?

2. **Validate sprint capacity:**
   - Total story points: {{total_points}}
   - Typical sprint capacity: {{sprint_capacity}} points
   - Number of sprints needed: {{sprints_needed}}

3. **Identify unbalanced stories:**
   - Stories that should be split
   - Stories that could be combined

<template-output>sizing_analysis</template-output>

Display sizing analysis:

**📏 Story Sizing Analysis**

**Total Epic Points:** {{total_points}}
**Estimated Sprints:** {{sprints_needed}} (assuming {{sprint_capacity}} points/sprint)

**Oversized Stories (>13 points):**
- Story {{story_x}}: {{points_x}} points - **TOO LARGE**
  - Recommendation: Split into Story {{story_x}}.1 and Story {{story_x}}.2

**Undersized Stories (<2 points):**
- Story {{story_y}}: {{points_y}} point - **TOO SMALL**
  - Recommendation: Combine with Story {{story_z}}

**Sizing Inconsistencies:**
- Story {{story_a}} ({{points_a}} points) has more FRs than Story {{story_b}} ({{points_b}} points)
  - Review: Should Story {{story_a}} be higher or Story {{story_b}} be lower?

<ask>Review sizing recommendations? (continue/adjust now)</ask>
</step>

<step n="6" goal="Perform ServiceNow platform validation">
<action>Review stories for ServiceNow-specific considerations</action>

**Platform Validation Checks:**

1. **Table/Field Naming:**
   - Are table names valid ServiceNow naming conventions?
   - Are field names following best practices?
   - Are custom tables properly prefixed?

2. **Technical Feasibility:**
   - Can requirements be implemented in ServiceNow?
   - Are there platform limitations to consider?
   - Are integrations using standard ServiceNow patterns?

3. **Best Practices:**
   - Are business rules over-used (performance)?
   - Are UI policies preferred over client scripts?
   - Are ACLs properly defined?

4. **Technical Debt Considerations:**
   - Are there maintenance implications?
   - Are there upgrade considerations?
   - Are customizations minimal and necessary?

<template-output>platform_validation</template-output>

Display platform findings:

**🛠️ ServiceNow Platform Validation**

**⚠️ Platform Concerns: {{platform_concern_count}}**

**Concern 1:** Story {{story_x}} - {{concern_description_1}}
- **Issue:** {{technical_issue_1}}
- **Impact:** {{impact_1}}
- **Recommendation:** {{recommendation_1}}

[Continue for all platform concerns...]

<ask>Review platform concerns? (continue)</ask>
</step>

<step n="7" goal="Generate comprehensive review report">
<action>Compile all findings into review report</action>

<template-output>review_report</template-output>

**Epic Review Report Structure:**

```markdown
# Epic Review Report - {{epic_name}}
**Date:** {{date}}
**Reviewer:** Pixel (Story Developer)
**Total Stories:** {{total_story_count}}
**Total Points:** {{total_points}}

## Executive Summary
- Overall Quality Score: {{average_quality_score}}/10
- Critical Issues: {{critical_issue_count}}
- Warnings: {{warning_count}}
- Recommendations: {{recommendation_count}}
- Epic Status: {{ready_status}} (Ready/Needs Work/Major Issues)

## Story Quality Analysis
[Full quality analysis from Step 2]

## Dependency Analysis
[Full dependency analysis from Step 3]
- Ordering Violations: {{violation_count}}
- Missing Dependencies: {{missing_count}}
- Recommended Renumbering: [list]

## Requirements Coverage
[Full coverage analysis from Step 4]
- Coverage: {{coverage_percentage}}%
- Gaps: {{gap_count}}
- Scope Creep: {{scope_creep_count}}

## Story Sizing
[Full sizing analysis from Step 5]
- Estimated Sprints: {{sprints_needed}}
- Oversized Stories: {{oversized_count}}
- Sizing Issues: {{sizing_issue_count}}

## Platform Validation
[Full platform validation from Step 6]
- Platform Concerns: {{platform_concern_count}}

## Critical Issues (Must Fix)
1. {{critical_issue_1}}
2. {{critical_issue_2}}
[Continue...]

## Warnings (Should Fix)
1. {{warning_1}}
2. {{warning_2}}
[Continue...]

## Recommendations
1. {{recommendation_1}}
2. {{recommendation_2}}
[Continue...]

## Action Items
- [ ] {{action_item_1}}
- [ ] {{action_item_2}}
- [ ] {{action_item_3}}
[Continue...]

## Next Steps
{{next_steps}}
```

<action>Save review report to {review_report_file}</action>

Display report summary:

━━━━━━━━━━━━━━━━━━━━━━━
**📊 EPIC REVIEW COMPLETE**
━━━━━━━━━━━━━━━━━━━━━━━

**Epic:** {{epic_name}}
**Overall Status:** {{ready_status}}

**Quality Score:** {{average_quality_score}}/10

**Issues Found:**
- 🔴 Critical: {{critical_issue_count}}
- 🟡 Warnings: {{warning_count}}
- 🔵 Recommendations: {{recommendation_count}}

**Key Findings:**
- Dependency Violations: {{violation_count}}
- Requirements Gaps: {{gap_count}}
- Sizing Issues: {{sizing_issue_count}}
- Platform Concerns: {{platform_concern_count}}

**Reports Generated:**
- Review Report: {{review_report_file}}
- Issues Log: {{issues_log_file}}

━━━━━━━━━━━━━━━━━━━━━━━

<ask>Would you like to:
  - View detailed report [v]
  - Fix critical issues now [f]
  - Export action items [e]
  - Exit [x]
</ask>
</step>

<step n="8" goal="Optional - Guided issue resolution" optional="true">
If user selected [f] - Fix critical issues:

<action>Present critical issues one by one</action>
<action>For each issue, offer resolution options</action>
<action>Guide user through fixes</action>
<action>Update affected story files</action>
<action>Re-run affected validation checks</action>

**Issue Resolution Process:**

**Critical Issue 1:** {{issue_description}}
- **Affected Stories:** {{affected_stories}}
- **Recommended Fix:** {{recommended_fix}}

<ask>Apply recommended fix? (yes/custom/skip)</ask>

<action>If yes - apply fix and update story files</action>
<action>If custom - gather custom resolution and apply</action>
<action>If skip - move to next issue</action>

**✓ Issue 1 Resolved**

[Continue for all critical issues...]

<action>After all fixes, generate updated review report</action>
<action>Show before/after comparison</action>
</step>

<step n="9" goal="Workflow completion">
Display final summary:

**✅ Epic Review Complete!**

**Epic:** {{epic_name}}
**Stories Reviewed:** {{total_story_count}}
**Final Status:** {{final_status}}

**Reports:**
- 📄 Review Report: {{review_report_file}}
- 📝 Issues Log: {{issues_log_file}}

**Summary:**
- Quality improved from {{initial_score}} to {{final_score}}
- Critical issues resolved: {{resolved_count}}/{{critical_issue_count}}
- Epic is {{ready_status}} for development

**Next Steps:**
1. Address remaining issues in issues log
2. Share review report with team
3. Update sprint planning with findings
4. Proceed to development or iterate on stories

<ask>Epic review session complete. Exit? [y]</ask>
</step>

</workflow>
