# Application Development Deep-Dive Instructions

<critical>The workflow execution engine is governed by: {project_root}/bmad/core/tasks/workflow.md</critical>
<critical>You MUST have already loaded and processed: {project_root}/bmad/sn/workflows/deep-dive-app/workflow.yaml</critical>

<workflow>

<step n="1" goal="Set up session">
<ask>Do you have the initial requirements document from Alex's intake session? If yes, provide the path or key details.</ask>

<check>If initial requirements provided:</check>
<action>Read and summarize the initial requirements</action>
<action>Use this as foundation for deep-dive questions</action>

<check>If no initial requirements:</check>
<action>Start from scratch with comprehensive discovery</action>

<action>Ask for BA/Developer name and requestor name for documentation</action>

<template-output>session_setup</template-output>
</step>

<step n="2" goal="Refine problem statement and create summary">
<action>Work with BA/Developer to create refined summary focused on application needs</action>

<action>Suggest to BA/Developer: "Let's start by confirming what the application needs to accomplish and why existing solutions don't meet the need."</action>

<ask response="summary">Please input the refined problem statement with business context:</ask>

<template-output>summary</template-output>
</step>

<step n="3" goal="Define application scope and purpose">
<action>Guide BA/Developer through application-specific scoping questions</action>

<action>Suggest questions about application type:</action>
- "Is this a completely new application or enhancing an existing one?"
- "Should this be a scoped application or part of global scope?"
- "What's the primary purpose of this application?"
- "Who is the target audience (IT staff, end users, managers)?"

<ask response="app_scope">Input the user's responses about application scope and purpose:</ask>

<action>Suggest questions about core functionality:</action>
- "What are the main things users need to do with this application?"
- "What business processes will this support?"
- "What makes this different from out-of-box ServiceNow capabilities?"

<ask response="core_functionality">Input the user's responses about core functionality:</ask>

<template-output>app_scope_functionality</template-output>
</step>

<step n="4" goal="Data model and structure">
<action>Guide BA/Developer through data model discovery</action>

<action>Suggest questions about data entities:</action>
- "What types of records or objects will this application manage?"
- "What's the main information you need to track?"
- "Are there relationships between different types of data?"
- "Should any data extend existing ServiceNow tables?"

<ask response="data_entities">Input the user's responses about data entities and objects:</ask>

<action>Suggest questions about data fields:</action>
- "For each record type, what information needs to be captured?"
- "Which fields are required vs optional?"
- "Are there any calculated or derived fields?"
- "What field types are needed (text, numbers, dates, references, etc.)?"

<ask response="input_data">Input the user's responses about required data fields:</ask>

<action>Suggest questions about data relationships:</action>
- "Do records relate to existing ServiceNow data (users, groups, CIs, etc.)?"
- "Are there parent-child relationships within the application?"
- "Should there be related lists or connections between record types?"

<ask response="data_sources">Input the user's responses about data relationships and sources:</ask>

<action>Suggest questions about data display:</action>
- "What information do users need to see in list views?"
- "What should be visible on the form when editing a record?"
- "Are there different views for different user roles?"

<ask response="output_data">Input the user's responses about data display requirements:</ask>

<template-output>data_requirements</template-output>
</step>

<step n="5" goal="User interface and experience">
<action>Guide BA/Developer through UI/UX requirements</action>

<action>Suggest questions about forms and views:</action>
- "What forms do users need (create, edit, view)?"
- "Should forms have multiple sections or views?"
- "Are there required fields or validation rules?"
- "Do you need related lists on forms?"

<ask response="forms_views">Input the user's responses about forms and views:</ask>

<action>Suggest questions about lists and filtering:</action>
- "What list views are needed?"
- "What columns should appear in lists?"
- "What filtering and sorting capabilities are needed?"
- "Should there be saved filters or personalized views?"

<ask response="lists_filtering">Input the user's responses about lists and filtering:</ask>

<action>Suggest questions about navigation:</action>
- "Where should this appear in the ServiceNow navigator?"
- "What menu structure makes sense?"
- "Should there be quick links or dashboards?"

<ask response="navigation">Input the user's responses about navigation and menus:</ask>

<template-output>ui_ux_requirements</template-output>
</step>

<step n="6" goal="Business logic and automation">
<action>Guide BA/Developer through business logic discovery</action>

<action>Suggest questions about business rules:</action>
- "What should happen automatically when records are created or updated?"
- "Are there fields that auto-populate based on other data?"
- "What validation rules are needed?"
- "Should certain actions trigger notifications or workflows?"

<ask response="business_rules">Input the user's responses about business rules and automation:</ask>

<action>Suggest questions about workflows/flows:</action>
- "Are there approval processes needed?"
- "Should certain status changes trigger automatic actions?"
- "Are there scheduled jobs or recurring processes?"

<ask response="workflows_flows">Input the user's responses about workflows and flows:</ask>

<template-output>business_logic</template-output>
</step>

<step n="7" goal="Volume and frequency analysis">
<action>Guide BA/Developer through usage questions</action>

<action>Suggest questions about volume:</action>
- "How many records will be created per day/week/month?"
- "What's the expected growth over time?"
- "How much data will this application store?"

<ask response="usage_volume">Input the user's responses about expected data volume:</ask>

<action>Suggest questions about usage patterns:</action>
- "How many concurrent users?"
- "What are peak usage times?"
- "Is usage steady or seasonal/cyclical?"

<ask response="frequency">Input the user's responses about usage patterns:</ask>

<action>Suggest questions about users:</action>
- "How many people will use this application?"
- "What user roles or groups need access?"
- "Will external users need access?"

<ask response="user_count">Input the user's responses about user base:</ask>

<template-output>volume_frequency</template-output>
</step>

<step n="8" goal="Integrations and dependencies">
<action>Guide BA/Developer through integration discovery</action>

<action>Suggest questions about external integrations:</action>
- "Does this need to integrate with systems outside ServiceNow?"
- "Should data sync with external databases or APIs?"
- "Are there third-party services to connect to?"

<ask response="external_integrations">Input the user's responses about external integrations:</ask>

<action>Suggest questions about ServiceNow integrations:</action>
- "Does this interact with other ServiceNow applications or modules?"
- "Should this trigger existing workflows or processes?"
- "Are there existing tables or records this needs to reference?"

<ask response="servicenow_dependencies">Input the user's responses about ServiceNow dependencies:</ask>

<action>Compile integrations list</action>
<ask response="integrations">Compiled integrations and dependencies (edit if needed):</ask>

<template-output>integrations</template-output>
</step>

<step n="9" goal="Security and access control">
<action>Guide BA/Developer through security questions</action>

<action>Suggest questions about roles and permissions:</action>
- "What roles should exist for this application?"
- "Who can create, read, update, delete records?"
- "Are there admin vs user vs viewer roles?"
- "Should permissions vary by record type or data?"

<ask response="access_control">Input the user's responses about roles and access control:</ask>

<action>Suggest questions about data security:</action>
- "Is any of this data sensitive or confidential?"
- "Are there compliance requirements?"
- "Should certain fields be restricted or encrypted?"
- "Do you need audit trails or change tracking?"

<ask response="data_sensitivity">Input the user's responses about data sensitivity and compliance:</ask>

<action>Compile security requirements</action>
<ask response="security_access">Compiled security and access requirements (edit if needed):</ask>

<template-output>security_access</template-output>
</step>

<step n="10" goal="User workflow and scenarios">
<action>Guide BA/Developer through end-to-end user workflow mapping</action>

<action>Suggest: "Let's walk through how users will interact with this application from start to finish. What are the main scenarios?"</action>

<action>Prompt for key scenarios:</action>
- Creating a new record
- Updating/managing records
- Searching and reporting
- Administrative tasks
- Exception handling

<ask response="user_workflow">Input the complete user workflows for main scenarios:</ask>

<template-output>user_workflow</template-output>
</step>

<step n="11" goal="Reporting and dashboards">
<action>Guide BA/Developer through reporting requirements</action>

<action>Suggest questions about reports:</action>
- "What reports are needed?"
- "Who needs to see what information?"
- "How often will reports be run?"
- "Should reports be scheduled or on-demand?"

<ask response="reporting_needs">Input the user's responses about reporting needs:</ask>

<action>Suggest questions about dashboards:</action>
- "Are dashboards or KPIs needed?"
- "What metrics should be tracked and displayed?"
- "Who are the dashboard audiences?"

<ask response="dashboard_needs">Input the user's responses about dashboard needs:</ask>

<template-output>reporting_requirements</template-output>
</step>

<step n="12" goal="Define success criteria">
<action>Guide BA/Developer through success criteria definition</action>

<action>Suggest questions about success metrics:</action>
- "How will you measure if this application is successful?"
- "What adoption rate are you targeting?"
- "What performance requirements exist?"
- "How will you know users are satisfied?"

<ask response="success_criteria">Input success criteria as a checklist:</ask>

<template-output>success_criteria</template-output>
</step>

<step n="13" goal="Identify functional requirements">
<action>Based on all gathered information, compile discrete functional requirements</action>
<action>Format as numbered list with FR-### identifiers</action>

<example>
- [FR-001] System shall provide form to create asset requests with required fields
- [FR-002] System shall auto-populate requestor information from current user
- [FR-003] System shall route requests to appropriate approver based on asset type
- [FR-004] System shall send email notifications on status changes
- [FR-005] System shall provide dashboard showing pending requests by status
</example>

<ask response="functional_requirements">List the functional requirements in FR-### format:</ask>

<template-output>functional_requirements</template-output>
</step>

<step n="14" goal="ServiceNow technical considerations">
<action>Apply ServiceNow platform expertise to identify technical considerations</action>

<action>Consider platform aspects:</action>
- Scoped vs global application
- Table structure and extensions
- UI policy and client script needs
- ACL requirements
- Performance implications
- Upgrade considerations

<ask response="platform_constraints">Input any known platform constraints or technical considerations:</ask>

<action>Estimate complexity:</action>
- Small (S): Simple CRUD app, few tables, basic forms/lists
- Medium (M): Multiple tables, business rules, integrations, reporting
- Large (L): Complex data model, extensive automation, external integrations
- Extra Large (XL): Multiple integrations, advanced features, significant custom development

<ask response="complexity">What's the estimated complexity? (S/M/L/XL)</ask>

<template-output>technical_considerations</template-output>
</step>

<step n="15" goal="Review and validate">
<action>Present summary for BA/Developer review</action>
<ask>Does the BA/Developer want to revise anything before generating the final document?</ask>
</step>

<step n="16" goal="Review complete requirements document for cohesion">
<action>Read all previously captured outputs from all prior steps</action>
<action>Review the complete set of requirements holistically for logical flow and cohesion</action>

<check>Does the summary align with all gathered details?</check>
<check>Do the functional requirements map clearly to the user workflow?</check>
<check>Are the data requirements consistent with the functional requirements?</check>
<check>Do security and access requirements align with the user workflow?</check>
<check>Are there any contradictions between different sections?</check>
<check>Does the technical complexity estimate match the scope of requirements?</check>
<check>Do all integrations have corresponding data sources identified?</check>
<check>Does the workflow narrative flow logically from start to completion?</check>

<action>If any issues are found, work with BA/Developer to resolve inconsistencies before generating final document</action>

<ask>Review complete. Any final adjustments needed before generating the document?</ask>
</step>

<step n="17" goal="Generate detailed requirements document">
<action>Set request_id = "APP-DETAIL-{{date}}"</action>
<ask response="ba_developer_name">BA/Developer name:</ask>
<ask response="requestor_name">Requestor name:</ask>

<action>Compile all information into detailed requirements template</action>
<action>Save to {{default_output_file}}</action>

<template-output>Complete detailed requirements document</template-output>
</step>

<step n="18" goal="Closing and next steps">
<action>Confirm completion and outline next steps</action>

<example>
**Document saved to:** {{default_output_file}}
**Request ID:** {{request_id}}
**Complexity:** {{complexity}}

**Next Steps:**
1. Review document with requestor
2. Get stakeholder sign-off
3. Convert to user stories/work items
4. Scope for sprint/release planning
</example>

<ask>Any final notes or follow-up items?</ask>
</step>

</workflow>
