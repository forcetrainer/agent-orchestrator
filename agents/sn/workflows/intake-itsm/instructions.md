# ITSM Enhancement Intake Instructions

<critical>The workflow execution engine is governed by: {project_root}/bmad/core/tasks/workflow.md</critical>
<critical>You MUST have already loaded and processed: {project_root}/bmad/sn/workflows/intake-itsm/workflow.yaml</critical>

<workflow>

<step n="1" goal="Set expectations and context">
<action>Explain the focus: "I want to understand what's not working well in your current ITSM process and what you'd like to improve."</action>

<ask>Ready to get started?</ask>
</step>

<step n="2" goal="Capture problem statement">
<action>Ask the core question in Alex's warm, encouraging voice</action>

<ask response="problem_statement">Can you describe what problem or pain point you're experiencing with the current ITSM process (Incident, Problem, Change, etc.)?</ask>

<check>If user mentions multiple ITSM modules:</check>
<action>Focus the conversation: "Let's focus on the most pressing issue first. Which one is causing the biggest problem?"</action>

<check>If response is vague or incomplete:</check>
<action>Probe gently for clarity:</action>
- "Help me understand a bit more about what's frustrating or not working..."
- "Can you walk me through what happens today that you'd like to change?"
- "Can you give me an example of when this causes problems?"

<check>If response is clear:</check>
<action>Validate understanding: "So if I'm hearing you correctly, the problem is [paraphrase]. Is that right?"</action>

<critical>Do NOT proceed until you have a clear problem statement</critical>

<template-output>problem_statement</template-output>
</step>

<step n="3" goal="Understand business impact and ROI">
<action>Shift to business value conversation</action>

<ask response="business_value">What business result or ROI do you expect from improving this ITSM process?</ask>

<check>Probe for specifics if needed:</check>
- "Will this reduce ticket resolution time?"
- "Will this improve compliance or audit readiness?"
- "Will this reduce errors or rework?"
- "Will this improve user or technician satisfaction?"

<ask response="impact_if_not_solved">What happens if we don't fix this? What's the impact or urgency?</ask>

<check>Validate completeness:</check>
<action>Ensure both expected value AND impact of inaction are captured</action>

<template-output>business_value, impact_if_not_solved</template-output>
</step>

<step n="4" goal="Capture solution vision">
<action>Ask how they envision the improved ITSM process</action>

<ask response="solution_vision">How would you like this ITSM process to work in an ideal world? What would be different?</ask>

<check>If response is too brief:</check>
<action>Encourage elaboration:</action>
- "Can you walk me through the improved process step by step?"
- "What would users or technicians experience differently?"
- "What would be automated or streamlined?"

<check>For ITSM specifically, probe for:</check>
- Which ITSM module(s)? (Incident, Problem, Change, Request, etc.)
- What part of the process needs improvement?
- Who is affected? (end users, technicians, managers)
- Is this about forms, workflows, automation, notifications, or reporting?
- Any compliance or SLA considerations?

<template-output>solution_vision</template-output>
</step>

<step n="5" goal="Identify initial requirements">
<action>Based on the conversation so far, identify 3-5 initial requirements</action>
<action>Present these to the user for validation</action>

<example>
"Based on what you've shared, here's what I'm hearing as the initial requirements:

1. Enhance [specific ITSM module/process]
2. [Specific improvement - e.g., add field, automate step, improve routing]
3. Target users: [technicians/end users/managers]
4. [Any specific automation or workflow changes mentioned]
5. [Any reporting or visibility requirements mentioned]

Am I capturing this correctly? Anything missing?"
</example>

<ask response="initial_requirements">Does this capture your initial requirements? What would you add or change?</ask>

<action>Refine the list based on feedback</action>

<template-output>initial_requirements</template-output>
</step>

<step n="6" goal="Identify stakeholders">
<ask response="stakeholders">Who would be affected by or benefit from this ITSM enhancement? Who are the key stakeholders?</ask>

<check>Probe for completeness:</check>
- Who uses the current process? (end users, technicians, approvers)
- Who manages or oversees this ITSM area?
- Any compliance or audit stakeholders?
- Who trains or supports users?

<template-output>stakeholders</template-output>
</step>

<step n="7" goal="Identify open questions">
<action>Based on the conversation, identify questions that need deeper exploration</action>
<action>Be explicit about what the BA/Developer will need to clarify in the next session</action>

<example>
"This gives us a great starting point! A few things the BA/Developer will want to explore further:

- Detailed process flow and approval chains
- Form field requirements and business rules
- Integration with other ITSM modules or external systems
- Service catalog or knowledge base impact
- SLA and notification requirements
- Change management and rollout approach
- Training needs for end users and technicians

Does anything else come to mind that we should flag for the detailed session?"
</example>

<ask response="open_questions">Any other questions or considerations we should flag for the BA/Developer?</ask>

<template-output>open_questions</template-output>
</step>

<step n="8" goal="Generate initial requirements document">
<action>Set request_id = "ITSM-{{date}}"</action>
<action>Compile all captured information into the template</action>
<action>Replace all template placeholders with captured values:</action>
- {{date}} - from system
- {{request_id}} - set above
- {{user_name}} - from config
- {{category}} - "ITSM Enhancement"
- {{problem_statement}} - from step 2
- {{business_value}} - from step 3
- {{impact_if_not_solved}} - from step 3
- {{solution_vision}} - from step 4
- {{initial_requirements}} - from step 5
- {{stakeholders}} - from step 6
- {{open_questions}} - from step 7
<action>Save completed document to {{default_output_file}}</action>

<template-output>Complete requirements document</template-output>
</step>

<step n="9" goal="Closing and next steps">
<action>Thank the user warmly</action>
<action>Confirm what happens next</action>

<example>
"Thank you {{user_name}}! I've captured all of this in an initial requirements document. Here's what happens next:

1. A BA or Developer will review your request
2. They'll reach out to schedule a detailed requirements session (usually 30-45 minutes)
3. That session will dive deeper into the process and technical details and create a complete requirements document
4. From there, your request will move into the development pipeline

Your request ID is: {{request_id}}

The document has been saved to: {{default_output_file}}

Is there anything else you'd like to add before we wrap up?"
</example>

<ask>Any final questions or thoughts?</ask>

<action>Provide final encouragement and sign off warmly</action>
</step>

</workflow>