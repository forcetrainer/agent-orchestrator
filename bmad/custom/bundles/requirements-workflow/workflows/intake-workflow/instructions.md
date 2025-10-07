# Workflow Automation Intake Instructions

<critical>The workflow execution engine is governed by: {project_root}/bmad/core/tasks/workflow.md</critical>
<critical>You MUST have already loaded and processed: {project_root}/bmad/sn/workflows/intake-workflow/workflow.yaml</critical>

<workflow>

<step n="1" goal="Set expectations and context">
<action>Explain the focus: "I want to understand what problem you're trying to solve and how you envision the solution working."</action>

<ask>Ready to get started?</ask>
</step>

<step n="2" goal="Capture problem statement">
<action>Ask the core question in Alex's warm, encouraging voice</action>

<ask response="problem_statement">Can you describe what problem you're trying to solve with this workflow automation?</ask>

<check>If response is vague or incomplete:</check>
<action>Probe gently for clarity:</action>
- "Help me understand a bit more about what's not working today..."
- "Can you walk me through what that looks like?"
- "Can you give me an example of when this happens?"

<check>If response is clear:</check>
<action>Validate understanding: "So if I'm hearing you correctly, the problem is [paraphrase]. Is that right?"</action>

<critical>Do NOT proceed until you have a clear problem statement</critical>

<action>Update the output file by replacing {{problem_statement}} with the captured response</action>
</step>

<step n="3" goal="Understand business impact and ROI">
<action>Shift to business value conversation</action>

<ask response="business_value">What business result or ROI do you expect from solving this?</ask>

<check>If user focuses only on features:</check>
<action>Redirect to outcomes: "That's helpful - and what will that enable your team or business to do differently?"</action>

<ask response="impact_if_not_solved">What happens if we don't solve this? What's the impact or urgency?</ask>

<check>Validate completeness:</check>
<action>Ensure both expected value AND impact of inaction are captured</action>

<action>Update the output file by replacing {{business_value}} and {{impact_if_not_solved}} with the captured responses</action>
</step>

<step n="4" goal="Capture solution vision">
<action>Ask how they envision the solution</action>

<ask response="solution_vision">How would you like this workflow to work in an ideal world?</ask>

<check>If response is too brief:</check>
<action>Encourage elaboration:</action>
- "Can you walk me through the steps you imagine?"
- "Who would be involved at each stage?"
- "What would trigger this workflow to start?"

<check>For workflow automation specifically, probe for:</check>
- What triggers the workflow?
- Who needs to be involved (approvals, notifications)?
- What are the key steps/stages?
- What's the expected outcome?

<action>Update the output file by replacing {{solution_vision}} with the captured response</action>
</step>

<step n="5" goal="Identify initial requirements">
<action>Based on the conversation so far, identify 3-5 initial requirements</action>
<action>Present these to the user for validation</action>

<example>
"Based on what you've shared, here's what I'm hearing as the initial requirements:

1. The workflow should trigger when [X happens]
2. It needs to route to [Y people/roles] for approval
3. Notifications should go to [Z stakeholders]
4. The process should track [specific data/status]

Am I capturing this correctly? Anything missing?"
</example>

<ask response="initial_requirements">Does this capture your initial requirements? What would you add or change?</ask>

<action>Refine the list based on feedback</action>

<action>Update the output file by replacing {{initial_requirements}} with the refined list</action>
</step>

<step n="6" goal="Identify stakeholders">
<ask response="stakeholders">Who else would use or benefit from this workflow automation? Who are the key stakeholders?</ask>

<check>Probe for completeness:</check>
- Who initiates/requests?
- Who approves?
- Who receives notifications?
- Who uses the output?

<action>Update the output file by replacing {{stakeholders}} with the captured response</action>
</step>

<step n="7" goal="Identify open questions">
<action>Based on the conversation, identify questions that need deeper exploration</action>
<action>Be explicit about what the BA/Developer will need to clarify in the next session</action>

<example>
"This gives us a great starting point! A few things the BA/Developer will want to explore further:

- Specific approval logic and routing rules
- Integration requirements with other systems
- Volume and frequency of workflow executions
- Any existing processes this replaces
- Success metrics and reporting needs

Does anything else come to mind that we should flag for the detailed session?"
</example>

<ask response="open_questions">Any other questions or considerations we should flag for the BA/Developer?</ask>

<action>Update the output file by replacing {{open_questions}} with the captured response</action>
</step>

<step n="8" goal="Finalize and review requirements document for cohesion">
<action>Set request_id = "WF-{{date}}"</action>
<action>Read the complete output file</action>
<action>Replace any remaining placeholders:</action>
- {{date}} - from system
- {{request_id}} - set above
- {{user_name}} - from config
- {{category}} - "Workflow Automation"

<action>Review the entire document holistically for logical flow and cohesion</action>
<check>Do all sections connect logically?</check>
<check>Does the solution vision align with the problem statement?</check>
<check>Do the initial requirements clearly address the business value?</check>
<check>Are there any contradictions or disconnects between sections?</check>
<check>Does the narrative flow naturally from problem → impact → solution → requirements?</check>

<action>If any issues are found, edit the document to ensure cohesion and logical consistency</action>

<template-output>
Display the complete, cohesive requirements document to the user for final approval.
Ask: "I've reviewed the document for logical flow and consistency. Does this accurately capture everything we discussed? Any final edits needed?"
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