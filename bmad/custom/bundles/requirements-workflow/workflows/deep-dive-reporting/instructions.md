# Reporting/Analytics Deep-Dive Instructions

<critical>The workflow execution engine is governed by: {project_root}/bmad/core/tasks/workflow.md</critical>
<critical>You MUST have already loaded and processed: {project_root}/bmad/sn/workflows/deep-dive-reporting/workflow.yaml</critical>

<workflow>

<step n="1" goal="Set up session">
<ask>Do you have initial requirements from Alex's intake? If yes, provide path or details.</ask>
<action>Get BA/Developer name and requestor name</action>
<template-output>session_setup</template-output>
</step>

<step n="2" goal="Refine problem statement">
<action>Create refined summary focused on reporting/analytics needs</action>
<ask response="summary">Input refined problem statement with business context:</ask>
<template-output>summary</template-output>
</step>

<step n="3" goal="Define reporting scope">
<action>Suggest questions about report type:</action>
- "Is this a report, dashboard, or both?"
- "Who is the audience (executives, managers, operational staff)?"
- "What decisions will this information support?"
- "Is this operational reporting or analytics?"

<ask response="reporting_scope">Input responses about reporting scope:</ask>

<action>Suggest questions about report purpose:</action>
- "What questions should this report answer?"
- "What insights are you looking for?"
- "What metrics or KPIs matter most?"

<ask response="reporting_purpose">Input responses about reporting purpose:</ask>
<template-output>reporting_scope</template-output>
</step>

<step n="4" goal="Data sources and metrics">
<action>Suggest questions about data sources:</action>
- "What data needs to be included in the report?"
- "Which ServiceNow tables contain this data?"
- "Do we need data from multiple sources?"
- "Should we include historical or just current data?"

<ask response="input_data">Input responses about data sources:</ask>

<action>Suggest questions about metrics:</action>
- "What specific metrics need to be calculated?"
- "Are there counts, sums, averages, or percentages needed?"
- "Are trend comparisons needed (month-over-month, year-over-year)?"
- "Should metrics be broken down by categories (department, priority, etc.)?"

<ask response="output_data">Input responses about metrics and calculations:</ask>

<action>Suggest questions about data relationships:</action>
- "Does data need to be joined across tables?"
- "Are there reference fields to follow?"
- "Should we include related record data?"

<ask response="data_sources">Input responses about data relationships:</ask>
<template-output>data_requirements</template-output>
</step>

<step n="5" goal="Report structure and visualization">
<action>Suggest questions about report format:</action>
- "Should this be a list report, chart, or combination?"
- "What columns or data points should be displayed?"
- "How should the data be grouped or summarized?"
- "Are there specific sorting or ordering requirements?"

<ask response="report_structure">Input responses about report structure:</ask>

<action>Suggest questions about visualization:</action>
- "What chart types are needed (bar, line, pie, gauge, etc.)?"
- "What should the axes represent?"
- "Should charts be interactive?"
- "Are color coding or indicators needed?"

<ask response="visualization">Input responses about visualization needs:</ask>
<template-output>report_structure</template-output>
</step>

<step n="6" goal="Filtering and parameters">
<action>Suggest questions about filters:</action>
- "What filters should users be able to apply?"
- "Should there be date range filters?"
- "Do users need to filter by department, priority, category, etc.?"
- "Should filters be required or optional?"

<ask response="filters">Input responses about filtering requirements:</ask>

<action>Suggest questions about drill-down:</action>
- "Should users be able to click through to details?"
- "Are multiple levels of detail needed?"
- "Should there be links to source records?"

<ask response="drilldown">Input responses about drill-down capabilities:</ask>
<template-output>filtering_parameters</template-output>
</step>

<step n="7" goal="Dashboard requirements">
<action>If dashboard is needed, suggest questions:</action>
- "How many widgets or tiles should the dashboard have?"
- "What should each widget display?"
- "How should widgets be arranged?"
- "Should the dashboard update in real-time or refresh periodically?"

<ask response="dashboard_layout">Input responses about dashboard requirements (or N/A if report only):</ask>
<template-output>dashboard_requirements</template-output>
</step>

<step n="8" goal="Schedule and distribution">
<action>Suggest questions about frequency:</action>
- "How often should this report run (on-demand, daily, weekly, monthly)?"
- "Should reports be scheduled and delivered automatically?"
- "What time of day should scheduled reports run?"

<ask response="frequency">Input responses about report frequency:</ask>

<action>Suggest questions about distribution:</action>
- "Who should receive the report?"
- "How should reports be delivered (email, portal, notification)?"
- "What format (PDF, Excel, HTML)?"

<ask response="distribution">Input responses about distribution:</ask>
<template-output>schedule_distribution</template-output>
</step>

<step n="9" goal="Usage and access">
<action>Suggest questions about usage:</action>
- "How many people will use this report?"
- "How often will they access it?"
- "Will this be viewed primarily on desktop or mobile?"

<ask response="usage_volume">Input responses about expected usage:</ask>
<ask response="user_count">Number of report users:</ask>
<template-output>volume_frequency</template-output>
</step>

<step n="10" goal="Integrations and dependencies">
<action>Suggest questions about integrations:</action>
- "Does this report need data from external systems?"
- "Should report data feed into other systems?"
- "Are there existing reports this replaces?"

<ask response="external_integrations">Input responses about external integrations:</ask>
<ask response="servicenow_dependencies">Input responses about ServiceNow dependencies:</ask>
<ask response="integrations">Compile integration dependencies:</ask>
<template-output>integrations</template-output>
</step>

<step n="11" goal="Security and access control">
<action>Suggest questions about access:</action>
- "Who should be able to view this report?"
- "Should users only see data relevant to them?"
- "Are there role-based restrictions?"
- "Should certain data be redacted or filtered?"

<ask response="access_control">Input responses about access control:</ask>

<action>Suggest questions about data sensitivity:</action>
- "Does this report contain sensitive data?"
- "Are there privacy or compliance concerns?"
- "Should audit trails track who views the report?"

<ask response="data_sensitivity">Input responses about data sensitivity:</ask>
<ask response="security_access">Compile security requirements:</ask>
<template-output>security_access</template-output>
</step>

<step n="12" goal="Report workflow">
<action>Walk through how users interact with the report</action>
<action>Suggest mapping: access → filter/parameter selection → view results → drill-down → export/share</action>
<ask response="user_workflow">Input complete user workflow for report usage:</ask>
<template-output>user_workflow</template-output>
</step>

<step n="13" goal="Success criteria">
<action>Suggest questions about success:</action>
- "How will you know this report is valuable?"
- "What decisions should it enable?"
- "What's an acceptable report generation time?"
- "How will accuracy be validated?"

<ask response="success_criteria">Input success criteria as checklist:</ask>
<template-output>success_criteria</template-output>
</step>

<step n="14" goal="Functional requirements">
<action>Compile functional requirements</action>
<example>
- [FR-001] Report shall display count of incidents by priority for last 30 days
- [FR-002] Report shall allow filtering by assignment group and date range
- [FR-003] Dashboard shall show trend line of incident volume over time
- [FR-004] Report shall allow drill-down to incident details
- [FR-005] Report shall be scheduled to run weekly and email to management
</example>
<ask response="functional_requirements">List functional requirements in FR-### format:</ask>
<template-output>functional_requirements</template-output>
</step>

<step n="15" goal="Technical considerations">
<action>Identify reporting technical considerations:</action>
- Report vs Performance Analytics
- Reporting engine performance
- Data volume and query optimization
- Export format capabilities
- Scheduled job configuration

<ask response="platform_constraints">Input platform constraints:</ask>
<ask response="complexity">Estimated complexity? (S/M/L/XL)</ask>
<template-output>technical_considerations</template-output>
</step>

<step n="16" goal="Review and validate">
<action>Present summary for review</action>
<ask>Any revisions needed?</ask>
</step>

<step n="17" goal="Review complete requirements document for cohesion">
<action>Read all previously captured outputs from all prior steps</action>
<action>Review the complete set of requirements holistically for logical flow and cohesion</action>

<check>Does the summary align with all gathered details?</check>
<check>Do the functional requirements map clearly to the reporting needs?</check>
<check>Are the data requirements consistent with the functional requirements?</check>
<check>Do security and access requirements align with the data visibility needs?</check>
<check>Are there any contradictions between different sections?</check>
<check>Does the technical complexity estimate match the scope of requirements?</check>
<check>Do all data sources have corresponding field mappings identified?</check>
<check>Does the reporting flow logically support the business questions?</check>

<action>If any issues are found, work with BA/Developer to resolve inconsistencies before generating final document</action>

<ask>Review complete. Any final adjustments needed before generating the document?</ask>
</step>

<step n="18" goal="Generate document">
<action>Set request_id = "RPT-DETAIL-{{date}}"</action>
<ask response="ba_developer_name">BA/Developer name:</ask>
<ask response="requestor_name">Requestor name:</ask>
<action>Save to {{default_output_file}}</action>
<template-output>Complete detailed requirements document</template-output>
</step>

<step n="19" goal="Closing">
<action>Confirm completion and next steps</action>
<ask>Any final notes?</ask>
</step>

</workflow>
