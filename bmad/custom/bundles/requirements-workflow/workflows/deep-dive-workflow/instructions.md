# Workflow Automation Deep-Dive Instructions

<critical>The workflow execution engine is governed by: {project_root}/bmad/core/tasks/workflow.md</critical>
<critical>You MUST have already loaded and processed: {project_root}/bmad/sn/workflows/deep-dive-workflow/workflow.yaml</critical>

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
<action>Based on initial requirements (if available) or starting fresh, work with BA/Developer to create refined summary</action>

<action>Suggest to BA/Developer: "Let's start by confirming the core problem and business context. Ask the user to walk through the problem statement again - often new details emerge in the second conversation."</action>

<ask response="summary">Please input the refined problem statement with business context:</ask>

<check>If summary seems incomplete:</check>
<action>Prompt: "You might want to ask about the current workaround process or what triggered this request timing-wise."</action>

<template-output>summary</template-output>
</step>

<step n="3" goal="Gather workflow-specific details">
<action>Guide BA/Developer through workflow automation specific questions</action>

<action>Suggest questions for workflow triggers and initiation:</action>
- "What should trigger this workflow to start?"
- "Who can initiate this workflow?"
- "Are there conditions that must be met before it starts?"
- "How will users access or start this workflow?"

<ask response="workflow_triggers">Input the user's responses about workflow triggers and initiation:</ask>

<action>Suggest questions for approval routing:</action>
- "Who needs to approve at each stage?"
- "What happens if someone rejects?"
- "Are there different approval paths based on conditions (amount, department, etc.)?"
- "What's the escalation process if approvals aren't completed?"

<ask response="approval_routing">Input the user's responses about approval routing and logic:</ask>

<action>Suggest questions for notifications:</action>
- "Who needs to be notified at each stage?"
- "What information should notifications include?"
- "Should notifications go to individuals, groups, or roles?"
- "Are there any notification timing requirements?"

<ask response="notifications">Input the user's responses about notification requirements:</ask>

<template-output>workflow_specifics</template-output>
</step>

<step n="4" goal="Data requirements discovery">
<action>Guide BA/Developer through data gathering questions</action>

<action>Suggest questions about input data:</action>
- "What information needs to be captured when the workflow starts?"
- "Are there forms users need to fill out?"
- "What data do approvers need to see to make decisions?"
- "Should any data be pre-populated from other systems?"

<ask response="input_data">Input the user's responses about required input data:</ask>

<action>Suggest questions about output data:</action>
- "What information needs to be tracked throughout the workflow?"
- "What status information needs to be visible?"
- "What data needs to be stored when the workflow completes?"
- "What reports or dashboards will consume this data?"

<ask response="output_data">Input the user's responses about output and tracking data:</ask>

<action>Suggest questions about data sources:</action>
- "Where does this data currently exist?"
- "Do we need to pull data from other ServiceNow tables?"
- "Are there external systems we need to query?"
- "Should we validate data against existing records?"

<ask response="data_sources">Input the user's responses about data sources and validation:</ask>

<template-output>data_requirements</template-output>
</step>

<step n="5" goal="Volume and frequency analysis">
<action>Guide BA/Developer through usage questions</action>

<action>Suggest questions about volume:</action>
- "How many times per day/week/month will this workflow run?"
- "What's the expected volume in the first 6 months? In a year?"
- "Are there peak periods or seasonal variations?"

<ask response="usage_volume">Input the user's responses about expected usage volume:</ask>

<action>Suggest questions about frequency and timing:</action>
- "Is this a real-time process or can it run in batches?"
- "Are there SLA requirements for how fast this needs to complete?"
- "Should this run during business hours only?"

<ask response="frequency">Input the user's responses about frequency and timing:</ask>

<action>Suggest questions about users:</action>
- "How many people will use this workflow?"
- "Which departments or teams?"
- "Will external users (vendors, customers) be involved?"

<ask response="user_count">Input the user's responses about user base:</ask>

<template-output>volume_frequency</template-output>
</step>

<step n="6" goal="Integrations and dependencies">
<action>Guide BA/Developer through integration discovery</action>

<action>Suggest questions about system integrations:</action>
- "Does this need to connect to any external systems?"
- "Should this trigger actions in other systems (email, Slack, etc.)?"
- "Do we need to read from or write to external databases?"
- "Are there APIs we need to call?"

<ask response="external_integrations">Input the user's responses about external integrations:</ask>

<action>Suggest questions about ServiceNow dependencies:</action>
- "What other ServiceNow processes or workflows does this interact with?"
- "Does this replace or extend an existing workflow?"
- "Should this trigger other ServiceNow workflows?"
- "Are there existing business rules or scripts that might conflict?"

<ask response="servicenow_dependencies">Input the user's responses about ServiceNow dependencies:</ask>

<action>Compile integrations list</action>
<ask response="integrations">Compiled integrations and dependencies (edit if needed):</ask>

<template-output>integrations</template-output>
</step>

<step n="7" goal="Security and access control">
<action>Guide BA/Developer through security questions</action>

<action>Suggest questions about access:</action>
- "Who should be able to view workflow records?"
- "Who can initiate the workflow?"
- "Who can modify or cancel in-progress workflows?"
- "Are there any role-based restrictions?"

<ask response="access_control">Input the user's responses about access control:</ask>

<action>Suggest questions about data sensitivity:</action>
- "Does this workflow handle sensitive data (PII, financial, etc.)?"
- "Are there compliance requirements (GDPR, HIPAA, SOX, etc.)?"
- "Should any fields be encrypted or redacted?"
- "Are there audit logging requirements?"

<ask response="data_sensitivity">Input the user's responses about data sensitivity and compliance:</ask>

<action>Compile security and access requirements</action>
<ask response="security_access">Compiled security and access requirements (edit if needed):</ask>

<template-output>security_access</template-output>
</step>

<step n="8" goal="Complete user workflow mapping">
<action>Guide BA/Developer through end-to-end workflow mapping</action>

<action>Suggest: "Now let's map out the complete workflow from start to finish. Ask the user to walk through every step, including what happens at each stage, who's involved, and what they see."</action>

<action>Prompt for key workflow stages:</action>
- Initiation/Request submission
- Approval stage(s)
- Execution/Processing
- Completion/Notification
- Exception handling

<ask response="user_workflow_steps">Input the complete step-by-step user workflow. Use numbered or bulleted format:</ask>

<check>Validate completeness:</check>
<action>Review the workflow with BA/Developer</action>
<action>Prompt: "Are we missing any steps? What happens in error scenarios or rejections?"</action>

<ask response="exception_handling">What happens in exception scenarios (rejections, errors, timeouts)?</ask>

<action>Compile complete user workflow including exception handling</action>
<ask response="user_workflow">Complete user workflow (edit if needed):</ask>

<template-output>user_workflow</template-output>
</step>

<step n="9" goal="Define success criteria">
<action>Guide BA/Developer through success criteria definition</action>

<action>Suggest questions about measurable success:</action>
- "How will you know this workflow is working correctly?"
- "What metrics or KPIs will you track?"
- "What does success look like 3 months after launch?"
- "How will you measure user satisfaction?"

<ask response="success_metrics">Input the user's responses about success criteria and metrics:</ask>

<action>Suggest questions about acceptance criteria:</action>
- "What must be true for you to accept this as complete?"
- "Are there performance requirements (response time, throughput)?"
- "What error rate is acceptable?"

<ask response="acceptance_criteria">Input the user's responses about acceptance criteria:</ask>

<action>Format as checklist</action>
<ask response="success_criteria">Compiled success criteria as checklist (edit if needed):</ask>

<template-output>success_criteria</template-output>
</step>

<step n="10" goal="Identify functional requirements">
<action>Based on all gathered information, work with BA/Developer to identify discrete functional requirements</action>

<action>Review all previous responses and extract specific functional requirements</action>
<action>Format as numbered list with FR-### identifiers</action>

<example>
- [FR-001] System shall trigger workflow when incident priority is Critical
- [FR-002] System shall route approval to department manager based on requestor's department
- [FR-003] System shall send email notification to requestor when approval is granted
- [FR-004] System shall enforce 24-hour SLA for approval response
</example>

<ask response="functional_requirements">List the functional requirements in FR-### format:</ask>

<check>Validate completeness:</check>
<action>Review requirements with BA/Developer</action>
<action>Prompt: "Do these requirements cover everything we discussed? Are any too vague?"</action>

<template-output>functional_requirements</template-output>
</step>

<step n="11" goal="ServiceNow technical considerations">
<action>Apply ServiceNow platform expertise to identify technical considerations</action>

<action>Consider platform constraints based on gathered information:</action>
- Workflow engine vs Flow Designer capabilities
- Integration hub requirements
- Custom table needs
- Script complexity
- Performance implications

<action>Suggest to BA/Developer: "Based on what we've gathered, here are some platform considerations..."</action>

<ask response="platform_constraints">Input any known platform constraints or technical considerations:</ask>

<action>Estimate complexity based on requirements:</action>
- Small (S): Simple workflow, existing tables, no integrations
- Medium (M): Multiple approval stages, some customization, basic integrations
- Large (L): Complex routing logic, new tables, external integrations
- Extra Large (XL): Multiple integrations, extensive custom dev, significant architectural changes

<ask response="complexity">What's the estimated complexity? (S/M/L/XL)</ask>

<template-output>technical_considerations</template-output>
</step>

<step n="12" goal="Review and validate with BA/Developer">
<action>Present a summary of all gathered requirements</action>
<action>Ask BA/Developer to review for completeness</action>

<example>
Let's review what we've captured:

**Summary:** [brief summary]
**Data Requirements:** [inputs/outputs/sources]
**Volume:** [usage patterns]
**Integrations:** [connected systems]
**Security:** [access and compliance]
**Workflow Steps:** [numbered steps]
**Success Criteria:** [checklist]
**Functional Requirements:** [FR list count]
**Complexity:** [S/M/L/XL]

Is anything missing or needing clarification?
</example>

<ask>Does the BA/Developer want to revise anything before generating the final document?</ask>

<check>If revisions needed:</check>
<action>Allow BA/Developer to update any section</action>
</step>

<step n="13" goal="Review complete requirements document for cohesion">
<action>Read all previously captured outputs from steps 2-12</action>
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

<step n="14" goal="Generate detailed requirements document">
<action>Set request_id = "WF-DETAIL-{{date}}"</action>
<action>Get BA/Developer name</action>
<ask response="ba_developer_name">BA/Developer name for the document:</ask>
<action>Get requestor name</action>
<ask response="requestor_name">Requestor/User name for the document:</ask>

<action>Compile all captured information into the detailed requirements template</action>
<action>Replace all template placeholders with captured values:</action>
- {{date}} - from system
- {{request_id}} - set above
- {{ba_developer_name}} - from this step
- {{requestor_name}} - from this step
- {{category}} - "Workflow Automation"
- {{summary}} - from step 2
- {{input_data}} - from step 4
- {{output_data}} - from step 4
- {{data_sources}} - from step 4
- {{functional_requirements}} - from step 10
- {{usage_volume}} - from step 5
- {{frequency}} - from step 5
- {{user_count}} - from step 5
- {{integrations}} - from step 6
- {{security_access}} - from step 7
- {{user_workflow}} - from step 8
- {{success_criteria}} - from step 9
- {{platform_constraints}} - from step 11
- {{complexity}} - from step 11

<action>Save completed document to {{default_output_file}}</action>

<template-output>Complete detailed requirements document</template-output>
</step>

<step n="15" goal="Closing and next steps">
<action>Confirm completion with BA/Developer</action>

<example>
Great work! We've completed the detailed requirements gathering for this workflow automation request.

**Document saved to:** {{default_output_file}}
**Request ID:** {{request_id}}
**Complexity:** {{complexity}}

**Next Steps:**
1. Review the document with the requestor for final validation
2. Get stakeholder sign-off on requirements
3. Convert requirements to ServiceNow user stories/work items
4. Assign to development team based on complexity estimate

The requirements are now ready for story creation and development planning.
</example>

<ask>Any final notes or follow-up items to capture?</ask>

<action>Thank BA/Developer for thorough requirements gathering</action>
</step>

</workflow>
