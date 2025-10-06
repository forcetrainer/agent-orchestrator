Solution Vision

ServiceNow will pull AI-agent inventory data from the EDP using the schema provided by the EDP team. This is a one-way data flow (EDP → ServiceNow). The data fields to import will match the EDP schema; ServiceNow should create or update CMDB records for each AI agent based on that schema.

Notes:
- Triggering mechanism, frequency (real-time vs scheduled), and error-handling behavior to be defined in the detailed session.
- EDP team will provide the exact schema and endpoint details.