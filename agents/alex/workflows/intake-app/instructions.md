# Application Development Intake Instructions

<critical>The workflow execution engine is governed by: {project_root}/bmad/core/tasks/workflow.md</critical>
<critical>You MUST have already loaded and processed: {project_root}/bmad/sn/workflows/intake-app/workflow.yaml</critical>

<workflow>

<step n="1" goal="Set expectations and context">
<action>Explain the focus: "I want to understand what business need you're trying to address and what you envision the application doing."</action>

<ask>Ready to get started?</ask>
</step>

<step n="2" goal="Capture problem statement">
<action>Ask the core question in Alex's warm, encouraging voice</action>

<ask response="problem_statement">Can you describe what business problem or need this application would solve?</ask>

<check>If response is vague or incomplete:</check>
<action>Probe gently for clarity:</action>
- "Help me understand a bit more about what's not working today..."
- "Can you walk me through what that looks like?"
- "What gap or challenge are you trying to address?"

<check>If user jumps to features:</check>
<action>Redirect to the underlying problem: "That's helpful - and what problem would that solve for your team?"</action>

<check>If response is clear:</check>
<action>Validate understanding: "So if I'm hearing you correctly, the problem is [paraphrase]. Is that right?"</action>

<critical>Do NOT proceed until you have a clear problem statement</critical>

<template-output>problem_statement</template-output>
</step>

<step n="3" goal="Understand business impact and ROI">
<action>Shift to business value conversation</action>

<ask response="business_value">What business result or ROI do you expect from this application?</ask>

<check>Probe for specifics if needed:</check>
- "Will this save time? If so, roughly how much?"
- "Will this reduce errors or improve quality?"
- "Will this enable new capabilities or revenue?"

<ask response="impact_if_not_solved">What happens if we don't build this? What's the impact or urgency?</ask>

<check>Validate completeness:</check>
<action>Ensure both expected value AND impact of inaction are captured</action>

<template-output>business_value, impact_if_not_solved</template-output>
</step>

<step n="4" goal="Capture solution vision">
<action>Ask how they envision the application</action>

<ask response="solution_vision">How would you like this application to work in an ideal world? What would users be able to do with it?</ask>

<check>If response is too brief:</check>
<action>Encourage elaboration:</action>
- "Can you walk me through a typical user journey?"
- "What would be the main features or capabilities?"
- "Who would use it and how?"

<check>For applications specifically, probe for:</check>
- What are the core capabilities/features?
- Who are the primary users?
- What data does it work with?
- Does it replace an existing tool or process?

<template-output>solution_vision</template-output>
</step>

<step n="5" goal="Identify initial requirements">
<action>Based on the conversation so far, identify 3-5 initial requirements</action>
<action>Present these to the user for validation</action>

<example>
"Based on what you've shared, here's what I'm hearing as the initial requirements:

1. The application should allow users to [core capability 1]
2. It needs to capture and store [key data elements]
3. Users should be able to [core capability 2]
4. It should integrate with [existing system if mentioned]

Am I capturing this correctly? Anything missing?"
</example>

<ask response="initial_requirements">Does this capture your initial requirements? What would you add or change?</ask>

<action>Refine the list based on feedback</action>

<template-output>initial_requirements</template-output>
</step>

<step n="6" goal="Identify stakeholders">
<ask response="stakeholders">Who would use this application? Who are the key stakeholders?</ask>

<check>Probe for completeness:</check>
- Who are the primary users?
- Who manages or administers it?
- Who needs reporting/visibility?
- Who approves or oversees?

<template-output>stakeholders</template-output>
</step>

<step n="7" goal="Identify open questions">
<action>Based on the conversation, identify questions that need deeper exploration</action>
<action>Be explicit about what the BA/Developer will need to clarify in the next session</action>

<example>
"This gives us a great starting point! A few things the BA/Developer will want to explore further:

- Detailed data requirements and structure
- Specific user workflows and screen flows
- Integration requirements with other systems
- User volume and performance needs
- Security and access control requirements
- Mobile access or responsive design needs

Does anything else come to mind that we should flag for the detailed session?"
</example>

<ask response="open_questions">Any other questions or considerations we should flag for the BA/Developer?</ask>

<template-output>open_questions</template-output>
</step>

<step n="8" goal="Generate initial requirements document">
<action>Set request_id = "APP-{{date}}"</action>
<action>Compile all captured information into the template</action>
<action>Replace all template placeholders with captured values:</action>
- {{date}} - from system
- {{request_id}} - set above
- {{user_name}} - from config
- {{category}} - "Application Development"
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