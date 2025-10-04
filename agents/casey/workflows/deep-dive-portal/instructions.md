# Portal/UI Customization Deep-Dive Instructions

<critical>The workflow execution engine is governed by: {project_root}/bmad/core/tasks/workflow.md</critical>
<critical>You MUST have already loaded and processed: {project_root}/bmad/sn/workflows/deep-dive-portal/workflow.yaml</critical>

<workflow>

<step n="1" goal="Set up session">
<ask>Do you have initial requirements from Alex's intake? If yes, provide path or details.</ask>
<action>Get BA/Developer name and requestor name</action>
<template-output>session_setup</template-output>
</step>

<step n="2" goal="Refine problem statement">
<action>Create refined summary focused on portal/UI needs</action>
<ask response="summary">Input refined problem statement with business context:</ask>
<template-output>summary</template-output>
</step>

<step n="3" goal="Define portal scope">
<action>Suggest questions about portal type:</action>
- "Is this for Service Portal or Employee/Customer Service Center?"
- "Is this a new portal, new page, or widget customization?"
- "Who is the audience (employees, customers, partners)?"
- "What portal theme or branding is needed?"

<ask response="portal_scope">Input responses about portal scope:</ask>

<action>Suggest questions about purpose:</action>
- "What tasks should users be able to accomplish?"
- "What's the user journey or workflow?"
- "How does this fit with existing portal pages?"

<ask response="portal_purpose">Input responses about portal purpose:</ask>
<template-output>portal_scope</template-output>
</step>

<step n="4" goal="Page layout and structure">
<action>Suggest questions about page design:</action>
- "What pages are needed?"
- "What should be on each page?"
- "What's the layout (single column, multi-column, dashboard)?"
- "Are there different views for different user roles?"

<ask response="page_layout">Input responses about page layout:</ask>

<action>Suggest questions about widgets:</action>
- "What widgets or components are needed?"
- "Should we use existing widgets or create custom ones?"
- "How should widgets be arranged?"
- "What data should each widget display?"

<ask response="widgets">Input responses about widgets and components:</ask>
<template-output>page_structure</template-output>
</step>

<step n="5" goal="Data and content requirements">
<action>Suggest questions about data display:</action>
- "What information needs to be shown to users?"
- "Where does this data come from (which tables)?"
- "Should data be filtered based on the user?"
- "Is this data real-time or can it be cached?"

<ask response="input_data">Input responses about data sources:</ask>

<action>Suggest questions about user interactions:</action>
- "What can users do (view, create, edit, submit)?"
- "What forms or inputs are needed?"
- "What happens when users submit data?"

<ask response="output_data">Input responses about user interactions and outputs:</ask>

<ask response="data_sources">What ServiceNow tables and data sources are used?</ask>
<template-output>data_requirements</template-output>
</step>

<step n="6" goal="Branding and UX">
<action>Suggest questions about branding:</action>
- "Should this match existing ServiceNow branding or custom branding?"
- "Are there specific colors, logos, or styling requirements?"
- "What's the desired look and feel?"

<ask response="branding">Input responses about branding requirements:</ask>

<action>Suggest questions about user experience:</action>
- "What's the desired user flow?"
- "Should navigation be prominent or minimal?"
- "Are there accessibility requirements?"
- "What devices should this support (desktop, mobile, tablet)?"

<ask response="ux_requirements">Input responses about UX requirements:</ask>
<template-output>branding_ux</template-output>
</step>

<step n="7" goal="Functionality and interactivity">
<action>Suggest questions about functionality:</action>
- "What actions can users take?"
- "Are there workflows triggered from the portal?"
- "Should there be search or filtering capabilities?"
- "Are notifications or alerts needed?"

<ask response="functionality">Input responses about functionality:</ask>

<action>Suggest questions about client-side behavior:</action>
- "Should any validation happen before submission?"
- "Are there dynamic fields or conditional logic?"
- "Should data load without page refresh?"

<ask response="client_behavior">Input responses about client-side behavior:</ask>
<template-output>functionality</template-output>
</step>

<step n="8" goal="Volume and usage">
<action>Suggest questions about usage:</action>
- "How many users will access this portal?"
- "What's the expected concurrent user count?"
- "Are there peak usage times?"

<ask response="usage_volume">Input responses about usage volume:</ask>
<ask response="frequency">How often will users access this (daily, weekly, on-demand)?</ask>
<ask response="user_count">Total number of portal users:</ask>
<template-output>volume_frequency</template-output>
</step>

<step n="9" goal="Integrations and dependencies">
<action>Suggest questions about integrations:</action>
- "Does the portal need to connect to external systems?"
- "Should this integrate with other ServiceNow modules?"
- "Are there third-party widgets or services needed?"

<ask response="external_integrations">Input responses about external integrations:</ask>
<ask response="servicenow_dependencies">Input responses about ServiceNow dependencies:</ask>
<ask response="integrations">Compile integration dependencies:</ask>
<template-output>integrations</template-output>
</step>

<step n="10" goal="Security and access">
<action>Suggest questions about access control:</action>
- "Who should be able to access this portal/page?"
- "Are there role-based views or restrictions?"
- "Should users only see their own data?"
- "Is authentication required?"

<ask response="access_control">Input responses about access control:</ask>

<action>Suggest questions about data security:</action>
- "Is any displayed data sensitive?"
- "Should certain information be masked?"
- "Are there compliance requirements?"

<ask response="data_sensitivity">Input responses about data security:</ask>
<ask response="security_access">Compile security requirements:</ask>
<template-output>security_access</template-output>
</step>

<step n="11" goal="User workflow">
<action>Walk through end-to-end user journey on the portal</action>
<action>Suggest mapping: landing → navigation → action → submission → confirmation</action>
<ask response="user_workflow">Input complete user workflow through the portal:</ask>
<template-output>user_workflow</template-output>
</step>

<step n="12" goal="Success criteria">
<action>Suggest questions about success:</action>
- "How will you measure portal success?"
- "What's the target adoption rate?"
- "What performance metrics matter (page load time, etc.)?"
- "How will you gather user feedback?"

<ask response="success_criteria">Input success criteria as checklist:</ask>
<template-output>success_criteria</template-output>
</step>

<step n="13" goal="Functional requirements">
<action>Compile functional requirements</action>
<example>
- [FR-001] Portal page shall display user's open incidents in table widget
- [FR-002] Portal page shall allow users to create new incident from form widget
- [FR-003] Portal shall use company branding with custom logo and colors
- [FR-004] Portal shall be responsive for mobile and desktop
- [FR-005] Portal shall filter incidents by logged-in user
</example>
<ask response="functional_requirements">List functional requirements in FR-### format:</ask>
<template-output>functional_requirements</template-output>
</step>

<step n="14" goal="Technical considerations">
<action>Identify portal technical considerations:</action>
- Service Portal vs CSM/ESM portal
- Widget development (OOB vs custom)
- AngularJS/Angular framework
- Performance and caching
- Mobile responsiveness

<ask response="platform_constraints">Input platform constraints:</ask>
<ask response="complexity">Estimated complexity? (S/M/L/XL)</ask>
<template-output>technical_considerations</template-output>
</step>

<step n="15" goal="Review and validate">
<action>Present summary for review</action>
<ask>Any revisions needed?</ask>
</step>

<step n="16" goal="Generate document">
<action>Set request_id = "PORTAL-DETAIL-{{date}}"</action>
<ask response="ba_developer_name">BA/Developer name:</ask>
<ask response="requestor_name">Requestor name:</ask>
<action>Save to {{default_output_file}}</action>
<template-output>Complete detailed requirements document</template-output>
</step>

<step n="17" goal="Closing">
<action>Confirm completion and next steps</action>
<ask>Any final notes?</ask>
</step>

</workflow>
