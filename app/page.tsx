import { ChatPanel } from '@/components/chat/ChatPanel';
import { MainLayout } from '@/components/layout/MainLayout';

/**
 * Home Page - Main Chat Interface
 *
 * Story 3.1: Basic Chat UI Layout
 * Story 6.1: Dynamic File Viewer Toggle - Uses MainLayout for grid-based split-pane
 * Renders ChatPanel component in full-screen layout with toggleable file viewer
 */
export default function Home() {
  return (
    <MainLayout>
      <ChatPanel />
    </MainLayout>
  );
}
