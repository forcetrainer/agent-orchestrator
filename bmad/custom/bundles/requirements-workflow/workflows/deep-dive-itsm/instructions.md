# ITSM Enhancement Deep-Dive Instructions

<critical>The workflow execution engine is governed by: {project_root}/bmad/core/tasks/workflow.md</critical>
<critical>You MUST have already loaded and processed: {project_root}/bmad/sn/workflows/deep-dive-itsm/workflow.yaml</critical>

<workflow>

<step n="1" goal="Set up session">
<ask>Do you have initial requirements from Alex's intake? If yes, provide path or details.</ask>
<action>Get BA/Developer name and requestor name</action>
<template-output>session_setup</template-output>
</step>

<step n="2" goal="Refine problem statement">
<action>Create refined summary focused on ITSM enhancement needs</action>
<ask response="summary">Input refined problem statement with business context:</ask>
<template-output>summary</template-output>
</step>

<step n="3" goal="Define ITSM scope">
<action>Suggest questions about ITSM module:</action>
- "Which ITSM process is this for (Incident, Problem, Change, etc.)?"
- "Is this modifying existing functionality or adding new capability?"
- "What's not working with the current ITSM setup?"
- "Is this configuration or customization?"

<ask response="itsm_scope">Input responses about ITSM scope:</ask>

<action>Suggest questions about enhancement type:</action>
- "What needs to change (fields, workflow, automation, forms, etc.)?"
- "Is this a new state/status, field, business rule, or workflow?"
- "Are you enhancing one module or multiple?"

<ask response="enhancement_type">Input responses about enhancement type:</ask>
<template-output>itsm_scope</template-output>
</step>

<step n="4" goal="Current state and pain points">
<action>Suggest questions about current process:</action>
- "How does the current ITSM process work?"
- "What are the specific pain points?"
- "What workarounds are people using?"
- "What steps are manual that should be automated?"

<ask response="current_state">Input responses about current state and pain points:</ask>
<template-output>current_state</template-output>
</step>

<step n="5" goal="Desired future state">
<action>Suggest questions about future state:</action>
- "How should the enhanced process work?"
- "What should happen automatically?"
- "What should change about the user experience?"
- "What new capabilities are needed?"

<ask response="future_state">Input responses about desired future state:</ask>
<template-output>future_state</template-output>
</step>

<step n="6" goal="Data and field requirements">
<action>Suggest questions about data needs:</action>
- "What new fields need to be added?"
- "What existing fields need to change?"
- "Are there new choices/options needed for dropdowns?"
- "Should any fields be required, read-only, or calculated?"

<ask response="input_data">Input responses about field and data requirements:</ask>

<action>Suggest questions about data display:</action>
- "How should forms be laid out?"
- "What should be visible to different roles?"
- "Are related lists needed?"
- "What information needs to be prominent?"

<ask response="output_data">Input responses about data display:</ask>

<action>Suggest questions about data sources:</action>
- "Where does data come from (user input, other tables, integrations)?"
- "Should any data auto-populate?"
- "Are there reference fields to other records?"

<ask response="data_sources">Input responses about data sources:</ask>
<template-output>data_requirements</template-output>
</step>

<step n="7" goal="Workflow and state management">
<action>Suggest questions about states/statuses:</action>
- "What states or statuses are needed?"
- "What are the valid transitions between states?"
- "What triggers a state change?"
- "Who can change states?"

<ask response="state_management">Input responses about state management:</ask>

<action>Suggest questions about workflow:</action>
- "What approvals are needed?"
- "What automated actions should occur at each stage?"
- "Are there SLA requirements?"
- "What notifications should be sent and when?"

<ask response="workflow_automation">Input responses about workflow and automation:</ask>
<template-output>workflow_requirements</template-output>
</step>

<step n="8" goal="Assignment and routing">
<action>Suggest questions about assignment:</action>
- "How should tickets be assigned?"
- "Should assignment be automatic or manual?"
- "What are the assignment rules?"
- "Are there multiple tiers or levels of support?"

<ask response="assignment_rules">Input responses about assignment and routing:</ask>

<action>Suggest questions about escalation:</action>
- "When should escalation occur?"
- "Who gets escalations?"
- "Are there different escalation paths?"

<ask response="escalation">Input responses about escalation:</ask>
<template-output>assignment_routing</template-output>
</step>

<step n="9" goal="Notifications and communications">
<action>Suggest questions about notifications:</action>
- "Who needs to be notified at each stage?"
- "What should notifications say?"
- "Should there be email, in-app, or both?"
- "Are reminder notifications needed?"

<ask response="notifications">Input responses about notification requirements:</ask>
<template-output>notification_requirements</template-output>
</step>

<step n="10" goal="Volume and frequency">
<action>Suggest questions about usage:</action>
- "How many tickets per day/week?"
- "Expected growth over time?"
- "Peak times or periods?"

<ask response="usage_volume">Input responses about volume:</ask>
<ask response="frequency">How often are tickets created/updated?</ask>
<ask response="user_count">How many people use this ITSM module?</ask>
<template-output>volume_frequency</template-output>
</step>

<step n="11" goal="Integrations and dependencies">
<action>Suggest questions about integrations:</action>
- "Does this need to integrate with monitoring tools?"
- "Should tickets auto-create from external sources?"
- "Are there CMDB dependencies?"
- "Should this trigger actions in other modules?"

<ask response="external_integrations">Input responses about external integrations:</ask>
<ask response="servicenow_dependencies">Input responses about ServiceNow dependencies:</ask>
<ask response="integrations">Compile integration dependencies:</ask>
<template-output>integrations</template-output>
</step>

<step n="12" goal="Security and access">
<action>Suggest questions about access:</action>
- "Who can create, read, update, and delete records?"
- "Are there role-based field restrictions?"
- "Should users only see their own tickets or their group's?"
- "What admin capabilities are needed?"

<ask response="access_control">Input responses about access control:</ask>

<action>Suggest questions about data security:</action>
- "Is any ITSM data sensitive?"
- "Are there compliance requirements?"
- "Should certain fields or attachments be restricted?"

<ask response="data_sensitivity">Input responses about data security:</ask>
<ask response="security_access">Compile security requirements:</ask>
<template-output>security_access</template-output>
</step>

<step n="13" goal="ITSM user workflow">
<action>Walk through end-to-end ITSM process</action>
<action>Suggest mapping: creation → assignment → work in progress → resolution → closure</action>
<ask response="user_workflow">Input complete ITSM workflow including all actors and steps:</ask>
<template-output>user_workflow</template-output>
</step>

<step n="14" goal="Reporting and metrics">
<action>Suggest questions about metrics:</action>
- "What KPIs or metrics need to be tracked?"
- "What reports are needed?"
- "How will performance be measured?"

<ask response="reporting_needs">Input responses about reporting needs:</ask>
<template-output>reporting_requirements</template-output>
</step>

<step n="15" goal="Success criteria">
<action>Suggest questions about success:</action>
- "How will you know this enhancement is successful?"
- "What adoption rate are you targeting?"
- "What efficiency gains are expected?"
- "How will user satisfaction be measured?"

<ask response="success_criteria">Input success criteria as checklist:</ask>
<template-output>success_criteria</template-output>
</step>

<step n="16" goal="Functional requirements">
<action>Compile functional requirements</action>
<example>
- [FR-001] Incident form shall include new "Business Impact" field (dropdown)
- [FR-002] System shall automatically escalate Priority 1 incidents after 2 hours
- [FR-003] System shall notify manager when incident assigned to their group
- [FR-004] System shall prevent closure without resolution notes
- [FR-005] System shall create Problem record when 3+ related incidents exist
</example>
<ask response="functional_requirements">List functional requirements in FR-### format:</ask>
<template-output>functional_requirements</template-output>
</step>

<step n="17" goal="Technical considerations">
<action>Identify ITSM technical considerations:</action>
- Impact on existing workflows and business rules
- Custom fields vs extending base tables
- Update set management
- Testing requirements for ITSM changes
- Training needs for support staff

<ask response="platform_constraints">Input platform constraints:</ask>
<ask response="complexity">Estimated complexity? (S/M/L/XL)</ask>
<template-output>technical_considerations</template-output>
</step>

<step n="18" goal="Review and validate">
<action>Present summary for review</action>
<ask>Any revisions needed?</ask>
</step>

<step n="19" goal="Generate document">
<action>Set request_id = "ITSM-DETAIL-{{date}}"</action>
<ask response="ba_developer_name">BA/Developer name:</ask>
<ask response="requestor_name">Requestor name:</ask>
<action>Save to {{default_output_file}}</action>
<template-output>Complete detailed requirements document</template-output>
</step>

<step n="20" goal="Closing">
<action>Confirm completion and next steps</action>
<ask>Any final notes?</ask>
</step>

</workflow>
