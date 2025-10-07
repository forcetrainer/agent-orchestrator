# Portal/UI Customization Intake Instructions

<critical>The workflow execution engine is governed by: {project_root}/bmad/core/tasks/workflow.md</critical>
<critical>You MUST have already loaded and processed: {project_root}/bmad/sn/workflows/intake-portal/workflow.yaml</critical>

<workflow>

<step n="1" goal="Set expectations and context">
<action>Explain the focus: "I want to understand what you're trying to accomplish with this portal change and who it's for."</action>

<ask>Ready to get started?</ask>
</step>

<step n="2" goal="Capture problem statement">
<action>Ask the core question in Alex's warm, encouraging voice</action>

<ask response="problem_statement">Can you describe what problem you're trying to solve or what need you're addressing with this portal/UI customization?</ask>

<check>If user jumps to design details (colors, layouts, etc.):</check>
<action>Acknowledge and redirect: "Got it - and what problem would that solve for users? What's not working with the current experience?"</action>

<check>If response is vague or incomplete:</check>
<action>Probe gently for clarity:</action>
- "Help me understand a bit more about what users are struggling with today..."
- "What feedback have you received about the current portal/UI?"
- "Can you give me an example of when users get stuck or frustrated?"

<check>If response is clear:</check>
<action>Validate understanding: "So if I'm hearing you correctly, the problem is [paraphrase]. Is that right?"</action>

<critical>Do NOT proceed until you have a clear problem statement</critical>

<action>Update the output file by replacing {{problem_statement}} with the captured response</action>
</step>

<step n="3" goal="Understand business impact and ROI">
<action>Shift to business value conversation</action>

<ask response="business_value">What business result or ROI do you expect from this portal/UI improvement?</ask>

<check>Probe for specifics if needed:</check>
- "Will this improve user adoption or satisfaction?"
- "Will this reduce support calls or training time?"
- "Will this enable users to complete tasks faster or more easily?"
- "Will this improve accessibility or reach new audiences?"

<ask response="impact_if_not_solved">What happens if we don't make these changes? What's the impact or urgency?</ask>

<check>Validate completeness:</check>
<action>Ensure both expected value AND impact of inaction are captured</action>

<action>Update the output file by replacing {{business_value}} and {{impact_if_not_solved}} with the captured responses</action>
</step>

<step n="4" goal="Capture solution vision">
<action>Ask how they envision the improved portal/UI</action>

<ask response="solution_vision">How would you like the portal/UI to work in an ideal world? What would users experience?</ask>

<check>If response is too brief:</check>
<action>Encourage elaboration:</action>
- "Can you walk me through what a user would see and do?"
- "What would be different from today's experience?"
- "Are there any examples or inspiration from other sites/portals?"

<check>For portal/UI specifically, probe for:</check>
- What pages or sections need to change?
- Who are the target users?
- What tasks should be easier or faster?
- Is this new functionality or redesign of existing?
- Mobile/responsive design important?
- Accessibility requirements?

<action>Update the output file by replacing {{solution_vision}} with the captured response</action>
</step>

<step n="5" goal="Identify initial requirements">
<action>Based on the conversation so far, identify 3-5 initial requirements</action>
<action>Present these to the user for validation</action>

<example>
"Based on what you've shared, here's what I'm hearing as the initial requirements:

1. Update [specific page/section] to [improvement]
2. Make it easier for users to [specific task]
3. Target audience is [user type/role]
4. Must work on [desktop/mobile/both]
5. [Any specific functionality or features mentioned]

Am I capturing this correctly? Anything missing?"
</example>

<ask response="initial_requirements">Does this capture your initial requirements? What would you add or change?</ask>

<action>Refine the list based on feedback</action>

<action>Update the output file by replacing {{initial_requirements}} with the refined list</action>
</step>

<step n="6" goal="Identify stakeholders">
<ask response="stakeholders">Who would use this portal/UI? Who are the key stakeholders?</ask>

<check>Probe for completeness:</check>
- Who are the primary users?
- Who manages/owns the portal?
- Who needs to approve design changes?
- Any user groups with special needs (accessibility)?

<action>Update the output file by replacing {{stakeholders}} with the captured response</action>
</step>

<step n="7" goal="Identify open questions">
<action>Based on the conversation, identify questions that need deeper exploration</action>
<action>Be explicit about what the BA/Developer will need to clarify in the next session</action>

<example>
"This gives us a great starting point! A few things the BA/Developer will want to explore further:

- Detailed user journey and wireframes/mockups
- Branding and style guide requirements
- Specific widgets or components needed
- Content strategy and copy
- Browser and device compatibility requirements
- Performance and load time expectations
- User testing approach

Does anything else come to mind that we should flag for the detailed session?"
</example>

<ask response="open_questions">Any other questions or considerations we should flag for the BA/Developer?</ask>

<action>Update the output file by replacing {{open_questions}} with the captured response</action>
</step>

<step n="8" goal="Finalize and review requirements document for cohesion">
<action>Set request_id = "POR-{{date}}"</action>
<action>Read the complete output file</action>
<action>Replace any remaining placeholders:</action>
- {{date}} - from system
- {{request_id}} - set above
- {{user_name}} - from config
- {{category}} - "Portal/UI Customization"

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
3. That session will dive deeper into the design details and create a complete requirements document
4. From there, your request will move into the development pipeline

Your request ID is: {{request_id}}

The document has been saved to: {{default_output_file}}

Is there anything else you'd like to add before we wrap up?"
</example>

<ask>Any final questions or thoughts?</ask>

<action>Provide final encouragement and sign off warmly</action>
</step>

</workflow>