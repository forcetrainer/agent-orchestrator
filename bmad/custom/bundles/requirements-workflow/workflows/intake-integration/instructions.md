# System Integration Intake Instructions

<critical>The workflow execution engine is governed by: {project_root}/bmad/core/tasks/workflow.md</critical>
<critical>You MUST have already loaded and processed: {project_root}/bmad/sn/workflows/intake-integration/workflow.yaml</critical>

<workflow>

<step n="0" goal="Initialize output file from template">
<critical>The workflow has already loaded the template content - it is available in the workflow data you received from execute_workflow</critical>
<action>Locate the template content from the workflow result (it was loaded from the template path in workflow.yaml)</action>
<action>Save the complete template content to the default_output_file using save_output (path: "output.md")</action>
<critical>This creates a working file that you will read and update throughout the workflow</critical>
<action>Throughout this workflow, you will read the file, replace placeholders, and save it back after each step</action>
</step>

<step n="1" goal="Set expectations and context">
<action>Explain the focus: "I want to understand what systems you need to connect and what business problem that solves."</action>

<ask>Ready to get started?</ask>
</step>

<step n="2" goal="Capture problem statement">
<action>Ask the core question in Alex's warm, encouraging voice</action>

<ask response="problem_statement">Can you describe what problem you're trying to solve by integrating these systems?</ask>

<check>If user jumps straight to "I need to connect X to Y":</check>
<action>Acknowledge and redirect: "Got it - and what problem does connecting those systems solve? What's not working today?"</action>

<check>If response is vague or incomplete:</check>
<action>Probe gently for clarity:</action>
- "Help me understand a bit more about what's happening today without this integration..."
- "What manual work or issues would this solve?"
- "Can you give me an example of when this causes problems?"

<check>If response is clear:</check>
<action>Validate understanding: "So if I'm hearing you correctly, the problem is [paraphrase]. Is that right?"</action>

<critical>Do NOT proceed until you have a clear problem statement</critical>

<action>Update the output file by replacing {{problem_statement}} with the captured response</action>
</step>

<step n="3" goal="Understand business impact and ROI">
<action>Shift to business value conversation</action>

<ask response="business_value">What business result or ROI do you expect from this integration?</ask>

<check>Probe for specifics if needed:</check>
- "Will this eliminate manual data entry? How much time?"
- "Will this improve data accuracy or timeliness?"
- "Will this enable new capabilities or better decisions?"

<ask response="impact_if_not_solved">What happens if we don't build this integration? What's the impact or urgency?</ask>

<check>Validate completeness:</check>
<action>Ensure both expected value AND impact of inaction are captured</action>

<action>Update the output file by replacing {{business_value}} and {{impact_if_not_solved}} with the captured responses</action>
</step>

<step n="4" goal="Capture solution vision">
<action>Ask how they envision the integration working</action>

<ask response="solution_vision">How would you like this integration to work in an ideal world? What should happen automatically?</ask>

<check>If response is too brief:</check>
<action>Encourage elaboration:</action>
- "Can you walk me through what would trigger the integration?"
- "What data needs to flow from where to where?"
- "How often should this happen - real-time, scheduled, or on-demand?"

<check>For integrations specifically, probe for:</check>
- What systems are being connected? (names/types)
- What data needs to sync or transfer?
- What direction does data flow? (one-way, two-way)
- What triggers the integration? (event, schedule, manual)
- What should happen if there's an error?

<action>Update the output file by replacing {{solution_vision}} with the captured response</action>
</step>

<step n="5" goal="Identify initial requirements">
<action>Based on the conversation so far, identify 3-5 initial requirements</action>
<action>Present these to the user for validation</action>

<example>
"Based on what you've shared, here's what I'm hearing as the initial requirements:

1. Connect [System A] to [System B]
2. Sync [specific data elements] between systems
3. Integration should trigger when [event/schedule]
4. Data should flow [one-way from A to B / two-way]
5. [Any error handling or notification requirements mentioned]

Am I capturing this correctly? Anything missing?"
</example>

<ask response="initial_requirements">What would you add or change to these requirements?</ask>

<action>Refine the list based on feedback</action>

<action>Update the output file by replacing {{initial_requirements}} with the refined list</action>
</step>

<step n="6" goal="Identify stakeholders">
<ask response="stakeholders">Who would use or benefit from this integration? Who are the key stakeholders?</ask>

<check>Probe for completeness:</check>
- Who manages the source system?
- Who manages the target system?
- Who uses the data in each system?
- Who needs to be notified of integration issues?
- Who owns the business process?

<action>Update the output file by replacing {{stakeholders}} with the captured response</action>
</step>

<step n="7" goal="Identify open questions">
<action>Based on the conversation, identify questions that need deeper exploration</action>
<action>Be explicit about what the BA/Developer will need to clarify in the next session</action>

<example>
"This gives us a great starting point! A few things the BA/Developer will want to explore further:

- Technical details of both systems (APIs, authentication, etc.)
- Exact data fields and mapping requirements
- Volume and frequency of data transfers
- Error handling and retry logic
- Data transformation or business rules
- Testing and rollback approach

Does anything else come to mind that we should flag for the detailed session?"
</example>

<ask response="open_questions">Any other questions or considerations we should flag for the BA/Developer?</ask>

<action>Update the output file by replacing {{open_questions}} with the captured response</action>
</step>

<step n="8" goal="Finalize and review requirements document for cohesion">
<action>Set request_id = "INT-{{date}}"</action>
<action>Read the complete output file</action>
<action>Replace any remaining placeholders:</action>
- {{date}} - from system
- {{request_id}} - set above
- {{user_name}} - from config
- {{category}} - "System Integration"

<action>Review the entire document holistically for logical flow and cohesion</action>
<check>Do all sections connect logically?</check>
<check>Does the solution vision align with the problem statement?</check>
<check>Do the initial requirements clearly address the business value?</check>
<check>Are there any contradictions or disconnects between sections?</check>
<check>Does the narrative flow naturally from problem → impact → solution → requirements?</check>

<action>If any issues are found, edit the document to ensure cohesion and logical consistency</action>

<template-output>
Display the complete, cohesive requirements document to the user for final approval.
Ask: "I've reviewed the document for logical flow and consistency. What edits or changes would you like to make?"
</template-output>
</step>

<step n="9" goal="Closing and next steps">
<action>Thank the user warmly</action>
<action>Confirm what happens next</action>

<example>
"Thank you {{user_name}}! I've captured all of this in an initial requirements document. Here's what happens next:

1. A BA or Developer will review your request
2. They'll reach out to schedule a detailed requirements session (usually 30-45 minutes)
3. That session will dive deeper into the technical details and create a complete requirements document
4. From there, your request will move into the development pipeline

Your request ID is: {{request_id}}

The document has been saved to: {{default_output_file}}

Is there anything else you'd like to add before we wrap up?"
</example>

<ask>Any final questions or thoughts?</ask>

<action>Provide final encouragement and sign off warmly</action>
</step>

</workflow>