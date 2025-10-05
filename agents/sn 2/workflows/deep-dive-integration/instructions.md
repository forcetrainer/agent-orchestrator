# System Integration Deep-Dive Instructions

<critical>IMMEDIATELY load and read the COMPLETE file: bmad/core/tasks/workflow.md - This file contains the execution engine rules you MUST follow</critical>
<critical>You MUST have already loaded and processed: {project_root}/bmad/sn/workflows/deep-dive-integration/workflow.yaml</critical>

<workflow>

<step n="1" goal="Set up session">
<ask>Do you have initial requirements from Alex's intake? If yes, provide path or details.</ask>
<action>Get BA/Developer name and requestor name</action>
<template-output>session_setup</template-output>
</step>

<step n="2" goal="Refine problem statement">
<action>Create refined summary focused on integration needs</action>
<ask response="summary">Input refined problem statement with business context:</ask>
<template-output>summary</template-output>
</step>

<step n="3" goal="Define integration scope">
<action>Suggest questions about integration type:</action>
- "What systems need to connect to ServiceNow?"
- "What direction is the data flow (inbound, outbound, bi-directional)?"
- "Is this real-time or batch integration?"
- "What triggers the integration?"

<ask response="integration_scope">Input responses about integration scope and type:</ask>

<action>Suggest questions about integration purpose:</action>
- "What business process requires this integration?"
- "What data needs to be shared?"
- "What actions should trigger in each system?"

<ask response="integration_purpose">Input responses about integration purpose:</ask>
<template-output>integration_scope</template-output>
</step>

<step n="4" goal="Data mapping and transformation">
<action>Suggest questions about source data:</action>
- "What data comes from the external system?"
- "What format is the data in (JSON, XML, CSV, etc.)?"
- "What fields/attributes are available?"
- "How is the data structured?"

<ask response="input_data">Input responses about source data:</ask>

<action>Suggest questions about target data:</action>
- "Where does this data go in ServiceNow (which tables/fields)?"
- "Does data need transformation or mapping?"
- "Are there required fields that might not be provided?"
- "How should missing or invalid data be handled?"

<ask response="output_data">Input responses about target data and mappings:</ask>

<action>Suggest questions about data sources:</action>
- "What's the authoritative source for each data element?"
- "Are there lookup tables or reference data needed?"
- "Should ServiceNow data sync back to the external system?"

<ask response="data_sources">Input responses about data sources and sync:</ask>
<template-output>data_requirements</template-output>
</step>

<step n="5" goal="Integration method and technology">
<action>Suggest questions about integration approach:</action>
- "Does the external system have an API?"
- "What authentication method is required?"
- "Are there existing ServiceNow integration options (IntegrationHub spokes, etc.)?"
- "Should this use REST, SOAP, JDBC, file transfer, or other method?"

<ask response="integration_method">Input responses about integration method and technology:</ask>

<action>Suggest questions about error handling:</action>
- "What should happen if the integration fails?"
- "Should there be retry logic?"
- "How should errors be logged and reported?"
- "Who needs to be notified of integration failures?"

<ask response="error_handling">Input responses about error handling:</ask>
<template-output>integration_method</template-output>
</step>

<step n="6" goal="Volume and frequency">
<action>Suggest questions about data volume:</action>
- "How many records will be processed per day/hour?"
- "What's the expected growth over time?"
- "Are there peak times or batch windows?"
- "What's the size of a typical data payload?"

<ask response="usage_volume">Input responses about data volume:</ask>

<action>Suggest questions about frequency:</action>
- "How often does data need to sync (real-time, hourly, daily, etc.)?"
- "Are there specific timing requirements or SLAs?"
- "Should this run continuously or on a schedule?"

<ask response="frequency">Input responses about frequency and timing:</ask>

<ask response="user_count">How many people/processes depend on this integration?</ask>
<template-output>volume_frequency</template-output>
</step>

<step n="7" goal="Integration dependencies">
<action>Suggest questions about external systems:</action>
- "What external systems are involved?"
- "Who owns/maintains those systems?"
- "Are there API rate limits or throttling?"
- "What's the availability/uptime of external systems?"

<ask response="external_integrations">Input responses about external system dependencies:</ask>

<action>Suggest questions about ServiceNow dependencies:</action>
- "Does this integration depend on other ServiceNow processes?"
- "Will this trigger workflows or business rules?"
- "Are there other integrations that might conflict?"

<ask response="servicenow_dependencies">Input responses about ServiceNow dependencies:</ask>

<ask response="integrations">Compile full list of integration dependencies:</ask>
<template-output>integrations</template-output>
</step>

<step n="8" goal="Security and credentials">
<action>Suggest questions about authentication:</action>
- "What authentication is required (API keys, OAuth, basic auth, etc.)?"
- "How are credentials managed and stored?"
- "Are there IP whitelisting or firewall requirements?"
- "What security protocols are required?"

<ask response="authentication">Input responses about authentication and security:</ask>

<action>Suggest questions about data security:</action>
- "Is the data being transferred sensitive?"
- "Should communication be encrypted?"
- "Are there compliance requirements (GDPR, HIPAA, etc.)?"
- "Who has access to integration logs?"

<ask response="data_sensitivity">Input responses about data security and compliance:</ask>

<ask response="security_access">Compile security and access requirements:</ask>
<template-output>security_access</template-output>
</step>

<step n="9" goal="Integration workflow">
<action>Walk through end-to-end integration flow</action>
<action>Suggest mapping out: trigger → authentication → data retrieval → transformation → loading → validation → notification</action>

<ask response="user_workflow">Input the complete integration workflow steps:</ask>
<template-output>user_workflow</template-output>
</step>

<step n="10" goal="Success criteria and monitoring">
<action>Suggest questions about success:</action>
- "How will you know the integration is working correctly?"
- "What's an acceptable error rate?"
- "What performance metrics matter (latency, throughput, etc.)?"
- "How will the integration be monitored?"

<ask response="success_criteria">Input success criteria as checklist:</ask>
<template-output>success_criteria</template-output>
</step>

<step n="11" goal="Functional requirements">
<action>Compile functional requirements from all gathered information</action>
<example>
- [FR-001] System shall pull employee data from HR system API every 6 hours
- [FR-002] System shall map employee ID to sys_user records
- [FR-003] System shall update user department and manager fields
- [FR-004] System shall log all integration transactions
- [FR-005] System shall notify IT admins of integration failures
</example>
<ask response="functional_requirements">List functional requirements in FR-### format:</ask>
<template-output>functional_requirements</template-output>
</step>

<step n="12" goal="Technical considerations">
<action>Identify ServiceNow integration technical considerations:</action>
- Integration Hub vs scripted REST/SOAP
- Transform maps and field mapping
- Scheduled jobs vs event-driven
- Monitoring and logging approach
- Performance and scalability

<ask response="platform_constraints">Input platform constraints and technical considerations:</ask>
<ask response="complexity">Estimated complexity? (S/M/L/XL)</ask>
<template-output>technical_considerations</template-output>
</step>

<step n="13" goal="Review and validate">
<action>Present summary for review</action>
<ask>Any revisions needed before generating the document?</ask>
</step>

<step n="14" goal="Generate document">
<action>Set request_id = "INT-DETAIL-{{date}}"</action>
<ask response="ba_developer_name">BA/Developer name:</ask>
<ask response="requestor_name">Requestor name:</ask>
<action>Compile into detailed requirements template and save to {{default_output_file}}</action>
<template-output>Complete detailed requirements document</template-output>
</step>

<step n="15" goal="Closing">
<action>Confirm completion and next steps</action>
<ask>Any final notes or follow-up items?</ask>
</step>

</workflow>
