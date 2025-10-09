#!/bin/bash
# Test Cleanup Script
# Removes low-value tests per new testing strategy (docs/solution-architecture.md Section 15)

set -e

echo "🧹 Agent Orchestrator Test Cleanup"
echo "=================================="
echo ""
echo "This script will delete low-value tests and reduce test suite size by ~60-70%"
echo "Backup recommended before running!"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled"
    exit 1
fi

echo ""
echo "📊 Current test stats:"
find . -name "*.test.ts" -o -name "*.test.tsx" | grep -v node_modules | wc -l
find . -name "*.test.ts" -o -name "*.test.tsx" | grep -v node_modules | xargs wc -l | tail -1

echo ""
echo "🗑️  Deleting low-value tests..."
echo ""

# Category 1: Tests for re-exports and trivial code
echo "  → Removing re-export tests..."
rm -f lib/utils/__tests__/index.test.ts
echo "    ✓ lib/utils/__tests__/index.test.ts (32 lines)"

# Category 2: UI component rendering tests
echo "  → Removing UI rendering tests..."
rm -f components/chat/__tests__/MessageInput.test.tsx
echo "    ✓ components/chat/__tests__/MessageInput.test.tsx (65 lines)"

rm -f components/chat/__tests__/LoadingIndicator.test.tsx
echo "    ✓ components/chat/__tests__/LoadingIndicator.test.tsx (68 lines)"

rm -f components/chat/__tests__/ErrorMessage.test.tsx
echo "    ✓ components/chat/__tests__/ErrorMessage.test.tsx (167 lines)"

rm -f components/chat/__tests__/InputField.test.tsx
echo "    ✓ components/chat/__tests__/InputField.test.tsx (if exists)"

# Category 3: Legacy/deprecated tests
echo "  → Removing legacy tests..."
rm -f lib/files/__tests__/reader.test.ts
echo "    ✓ lib/files/__tests__/reader.test.ts (marked as LEGACY EPIC 2 TEST)"

# Category 4: Simple CRUD/pass-through tests
echo "  → Removing trivial CRUD tests..."
rm -f lib/utils/__tests__/conversations.test.ts
echo "    ✓ lib/utils/__tests__/conversations.test.ts (simple Map operations)"

rm -f lib/utils/__tests__/logger.test.ts
echo "    ✓ lib/utils/__tests__/logger.test.ts (console.log wrappers)"

rm -f lib/files/__tests__/lister.test.ts
echo "    ✓ lib/files/__tests__/lister.test.ts (simple fs.readdir wrapper)"

rm -f lib/utils/__tests__/errors.test.ts
echo "    ✓ lib/utils/__tests__/errors.test.ts (Error class constructors)"

# Category 5: Type/validation tests better handled by TypeScript
echo "  → Removing type validation tests..."
rm -f types/__tests__/index.test.ts
echo "    ✓ types/__tests__/index.test.ts (type exports)"

# Category 6: Overly specific UI integration tests
echo "  → Removing detailed UI integration tests..."
rm -f components/__tests__/ChatPanelFileViewerIntegration.test.tsx
echo "    ✓ components/__tests__/ChatPanelFileViewerIntegration.test.tsx"

rm -f components/__tests__/DragDropIntegration.test.tsx
echo "    ✓ components/__tests__/DragDropIntegration.test.tsx"

rm -f components/__tests__/FileContentDisplay.test.tsx
echo "    ✓ components/__tests__/FileContentDisplay.test.tsx"

rm -f components/__tests__/DirectoryTree.test.tsx
echo "    ✓ components/__tests__/DirectoryTree.test.tsx"

rm -f components/__tests__/FileViewerPanel.test.tsx
echo "    ✓ components/__tests__/FileViewerPanel.test.tsx"

# Category 7: Component tests with excessive setup
echo "  → Removing high-setup component tests..."
rm -f components/chat/__tests__/MessageBubble.test.tsx
echo "    ✓ components/chat/__tests__/MessageBubble.test.tsx"

rm -f components/chat/__tests__/MessageList.test.tsx
echo "    ✓ components/chat/__tests__/MessageList.test.tsx"

rm -f components/chat/__tests__/AgentSelector.test.tsx
echo "    ✓ components/chat/__tests__/AgentSelector.test.tsx"

rm -f components/chat/__tests__/AgentSelector.toggle.test.tsx
echo "    ✓ components/chat/__tests__/AgentSelector.toggle.test.tsx"

rm -f components/chat/__tests__/FileAttachment.test.tsx
echo "    ✓ components/chat/__tests__/FileAttachment.test.tsx"

rm -f components/chat/__tests__/ChatPanel.test.tsx
echo "    ✓ components/chat/__tests__/ChatPanel.test.tsx"

rm -f components/file-viewer/__tests__/Breadcrumb.test.tsx
echo "    ✓ components/file-viewer/__tests__/Breadcrumb.test.tsx"

rm -f components/file-viewer/__tests__/FileViewerContext.test.tsx
echo "    ✓ components/file-viewer/__tests__/FileViewerContext.test.tsx"

rm -f components/layout/__tests__/MainLayout.test.tsx
echo "    ✓ components/layout/__tests__/MainLayout.test.tsx"

# Category 8: Simple wrapper tests
echo "  → Removing simple wrapper tests..."
rm -f lib/openai/__tests__/client.test.ts
echo "    ✓ lib/openai/__tests__/client.test.ts (OpenAI SDK wrapper)"

rm -f lib/openai/__tests__/chat.test.ts
echo "    ✓ lib/openai/__tests__/chat.test.ts (calls client)"

rm -f lib/accessibility/__tests__/announcer.test.ts
echo "    ✓ lib/accessibility/__tests__/announcer.test.ts"

rm -f lib/chat/__tests__/fileContext.test.ts
echo "    ✓ lib/chat/__tests__/fileContext.test.ts"

# Category 9: File operation tests (keep security tests only)
echo "  → Removing non-security file operation tests..."
rm -f lib/files/__tests__/writer.test.ts
echo "    ✓ lib/files/__tests__/writer.test.ts (keep security.test.ts instead)"

rm -f lib/files/__tests__/treeBuilder.test.ts
echo "    ✓ lib/files/__tests__/treeBuilder.test.ts"

rm -f lib/files/__tests__/manifestReader.test.ts
echo "    ✓ lib/files/__tests__/manifestReader.test.ts"

rm -f lib/files/__tests__/filenameValidator.test.ts
echo "    ✓ lib/files/__tests__/filenameValidator.test.ts (merged into operations)"

rm -f lib/sessions/__tests__/chatSessions.test.ts
echo "    ✓ lib/sessions/__tests__/chatSessions.test.ts"

# Category 10: API route tests with excessive validation tests
echo "  → Removing excessive API validation tests..."
rm -f app/api/agents/__tests__/route.test.ts
echo "    ✓ app/api/agents/__tests__/route.test.ts (simple list endpoint)"

rm -f app/api/files/tree/__tests__/route.test.ts
echo "    ✓ app/api/files/tree/__tests__/route.test.ts"

rm -f app/api/files/content/__tests__/route.test.ts
echo "    ✓ app/api/files/content/__tests__/route.test.ts"

rm -f app/api/agent/initialize/__tests__/route.test.ts
echo "    ✓ app/api/agent/initialize/__tests__/route.test.ts"

# Clean up empty test directories
echo ""
echo "🧼 Cleaning up empty test directories..."
find . -type d -name __tests__ -empty -delete 2>/dev/null || true
echo "    ✓ Removed empty __tests__ directories"

echo ""
echo "📊 New test stats:"
find . -name "*.test.ts" -o -name "*.test.tsx" | grep -v node_modules | wc -l
find . -name "*.test.ts" -o -name "*.test.tsx" | grep -v node_modules | xargs wc -l | tail -1

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📝 Tests kept (high-value):"
echo "   - lib/__tests__/pathResolver.security.test.ts (security)"
echo "   - lib/__tests__/pathResolver.test.ts (business logic)"
echo "   - lib/__tests__/pathResolver.integration.test.ts (integration)"
echo "   - lib/agents/__tests__/agenticLoop.test.ts (critical business logic)"
echo "   - lib/agents/__tests__/parser.test.ts (business logic)"
echo "   - lib/agents/__tests__/loader.test.ts (business logic)"
echo "   - lib/agents/__tests__/systemPromptBuilder.test.ts (business logic)"
echo "   - lib/agents/__tests__/criticalActions.test.ts (business logic)"
echo "   - lib/agents/__tests__/bundleScanner.test.ts (business logic)"
echo "   - lib/tools/__tests__/fileOperations.test.ts (security + business logic)"
echo "   - lib/utils/__tests__/validation.test.ts (security)"
echo "   - lib/sessions/__tests__/naming.test.ts (business logic)"
echo "   - app/api/chat/__tests__/route.test.ts (integration - needs refactoring)"
echo "   - __tests__/integration/api.integration.test.ts (integration)"
echo ""
echo "⚠️  Next step: Refactor app/api/chat/__tests__/route.test.ts"
echo "   Currently 460 lines → reduce to ~50 lines (2-3 critical tests)"
echo "   See: docs/solution-architecture.md Section 15.8"
echo ""
