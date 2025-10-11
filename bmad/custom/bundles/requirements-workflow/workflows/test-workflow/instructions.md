# Test Workflow Instructions

<workflow>

<step n="1" goal="Ask user for confirmation">
<ask>Ready to test? Type 'yes' to proceed.</ask>
</step>

<step n="2" goal="Save test file">
<action>Use save_output with ONLY the filename "this_is_test_file.md" and content "This is a test file"</action>
<action>The file should automatically save to the session folder</action>

<ask>File saved! Did it work?</ask>
</step>

</workflow>
