/**
 * FileViewerContext and useFileViewer Hook Tests
 *
 * Story 6.1: Dynamic File Viewer Toggle
 * AC-6: Keyboard shortcut `Ctrl/Cmd + B` toggles file viewer
 * AC-8: Viewer state persists during session
 *
 * Tests:
 * - Toggle function changes isOpen state
 * - Keyboard shortcut (Ctrl+B, Cmd+B) triggers toggle
 * - Keyboard shortcut ignored when typing in input/textarea
 * - State persists across re-renders
 */

import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { FileViewerProvider, useFileViewer } from '../FileViewerContext';
import { ReactNode } from 'react';

describe('FileViewerContext', () => {
  describe('useFileViewer hook', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <FileViewerProvider>{children}</FileViewerProvider>
    );

    it('should initialize with isOpen=true', () => {
      const { result } = renderHook(() => useFileViewer(), { wrapper });
      expect(result.current.isOpen).toBe(true);
    });

    it('should toggle isOpen state when toggle() is called', () => {
      const { result } = renderHook(() => useFileViewer(), { wrapper });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useFileViewer());
      }).toThrow('useFileViewer must be used within a FileViewerProvider');

      consoleError.mockRestore();
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should toggle on Ctrl+B keypress', () => {
      const TestComponent = () => {
        const { isOpen } = useFileViewer();
        return <div data-testid="status">{isOpen ? 'open' : 'closed'}</div>;
      };

      render(
        <FileViewerProvider>
          <TestComponent />
        </FileViewerProvider>
      );

      expect(screen.getByTestId('status')).toHaveTextContent('open');

      // Simulate Ctrl+B
      fireEvent.keyDown(window, { key: 'b', ctrlKey: true });

      expect(screen.getByTestId('status')).toHaveTextContent('closed');
    });

    it('should toggle on Cmd+B keypress (Mac)', () => {
      const TestComponent = () => {
        const { isOpen } = useFileViewer();
        return <div data-testid="status">{isOpen ? 'open' : 'closed'}</div>;
      };

      render(
        <FileViewerProvider>
          <TestComponent />
        </FileViewerProvider>
      );

      expect(screen.getByTestId('status')).toHaveTextContent('open');

      // Simulate Cmd+B (metaKey for Mac)
      fireEvent.keyDown(window, { key: 'b', metaKey: true });

      expect(screen.getByTestId('status')).toHaveTextContent('closed');
    });

    it('should NOT toggle when typing in input field', () => {
      const TestComponent = () => {
        const { isOpen } = useFileViewer();
        return (
          <>
            <input data-testid="input" />
            <div data-testid="status">{isOpen ? 'open' : 'closed'}</div>
          </>
        );
      };

      render(
        <FileViewerProvider>
          <TestComponent />
        </FileViewerProvider>
      );

      const input = screen.getByTestId('input');
      expect(screen.getByTestId('status')).toHaveTextContent('open');

      // Focus input and simulate Ctrl+B
      input.focus();
      fireEvent.keyDown(input, { key: 'b', ctrlKey: true });

      // Should NOT toggle (still open)
      expect(screen.getByTestId('status')).toHaveTextContent('open');
    });

    it('should NOT toggle when typing in textarea field', () => {
      const TestComponent = () => {
        const { isOpen } = useFileViewer();
        return (
          <>
            <textarea data-testid="textarea" />
            <div data-testid="status">{isOpen ? 'open' : 'closed'}</div>
          </>
        );
      };

      render(
        <FileViewerProvider>
          <TestComponent />
        </FileViewerProvider>
      );

      const textarea = screen.getByTestId('textarea');
      expect(screen.getByTestId('status')).toHaveTextContent('open');

      // Focus textarea and simulate Ctrl+B
      textarea.focus();
      fireEvent.keyDown(textarea, { key: 'b', ctrlKey: true });

      // Should NOT toggle (still open)
      expect(screen.getByTestId('status')).toHaveTextContent('open');
    });

    it('should NOT toggle when typing in contentEditable element', () => {
      const TestComponent = () => {
        const { isOpen } = useFileViewer();
        return (
          <>
            <div contentEditable data-testid="editable" />
            <div data-testid="status">{isOpen ? 'open' : 'closed'}</div>
          </>
        );
      };

      render(
        <FileViewerProvider>
          <TestComponent />
        </FileViewerProvider>
      );

      const editable = screen.getByTestId('editable');
      expect(screen.getByTestId('status')).toHaveTextContent('open');

      // Focus editable and simulate Ctrl+B with bubbling to window
      editable.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      Object.defineProperty(event, 'target', { value: editable, enumerable: true });
      window.dispatchEvent(event);

      // Should NOT toggle (still open)
      expect(screen.getByTestId('status')).toHaveTextContent('open');
    });
  });

  describe('State persistence', () => {
    it('should persist state during session (same provider instance)', () => {
      const TestComponent = () => {
        const { isOpen, toggle } = useFileViewer();
        return (
          <>
            <button onClick={toggle} data-testid="toggle">
              Toggle
            </button>
            <div data-testid="status">{isOpen ? 'open' : 'closed'}</div>
          </>
        );
      };

      render(
        <FileViewerProvider>
          <TestComponent />
        </FileViewerProvider>
      );

      expect(screen.getByTestId('status')).toHaveTextContent('open');

      // Toggle to closed
      fireEvent.click(screen.getByTestId('toggle'));
      expect(screen.getByTestId('status')).toHaveTextContent('closed');

      // Toggle back to open
      fireEvent.click(screen.getByTestId('toggle'));
      expect(screen.getByTestId('status')).toHaveTextContent('open');

      // State persists within the same session (same provider instance)
      // AC-8: Viewer state persists during session
    });
  });
});
