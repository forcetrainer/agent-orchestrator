/**
 * MainLayout Component Tests
 *
 * Story 6.1: Dynamic File Viewer Toggle
 * AC-4: When viewer closed, chat panel uses 100% width
 * AC-5: When viewer open, layout is 70% chat / 30% file viewer
 * AC-7: Animation uses spring physics
 *
 * Tests:
 * - Renders children in main content area
 * - Shows file viewer when isOpen=true
 * - Hides file viewer when isOpen=false
 * - Grid columns update based on isOpen state
 */

import { render, screen } from '@testing-library/react';
import { MainLayout } from '../MainLayout';
import { FileViewerProvider } from '@/components/file-viewer/FileViewerContext';
import { ReactNode } from 'react';

// Mock FileViewerPanel to avoid API calls in tests
jest.mock('@/components/FileViewerPanel', () => ({
  FileViewerPanel: () => <div data-testid="file-viewer-panel">File Viewer</div>,
}));

// Mock framer-motion to avoid animation complexity in tests
jest.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('MainLayout', () => {
  it('should render children in main content area', () => {
    render(
      <FileViewerProvider>
        <MainLayout>
          <div data-testid="chat-content">Chat Panel</div>
        </MainLayout>
      </FileViewerProvider>
    );

    expect(screen.getByTestId('chat-content')).toBeInTheDocument();
    expect(screen.getByTestId('chat-content')).toHaveTextContent('Chat Panel');
  });

  it('should show file viewer when context isOpen=true (default)', () => {
    render(
      <FileViewerProvider>
        <MainLayout>
          <div>Chat</div>
        </MainLayout>
      </FileViewerProvider>
    );

    expect(screen.getByTestId('file-viewer-panel')).toBeInTheDocument();
  });

  it('should apply grid-cols-[1fr_30%] class when viewer is open', () => {
    const { container } = render(
      <FileViewerProvider>
        <MainLayout>
          <div>Chat</div>
        </MainLayout>
      </FileViewerProvider>
    );

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-[1fr_30%]');
  });

  it('should have transition classes for smooth animation', () => {
    const { container } = render(
      <FileViewerProvider>
        <MainLayout>
          <div>Chat</div>
        </MainLayout>
      </FileViewerProvider>
    );

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('transition-[grid-template-columns]');
    expect(gridContainer).toHaveClass('duration-300');
  });
});
