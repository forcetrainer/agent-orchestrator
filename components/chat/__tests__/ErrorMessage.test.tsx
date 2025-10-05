/**
 * ErrorMessage Component Tests
 * Story 3.8 - Task 6: Unit tests for error handling
 *
 * Tests error message component styling and accessibility
 * AC-8.2: Error messages are clearly styled (red/warning color)
 * AC-8.3: Errors explain what went wrong in plain language
 */

import { render, screen } from '@testing-library/react';
import { ErrorMessage } from '../ErrorMessage';
import { Message } from '@/lib/types';

describe('ErrorMessage', () => {
  // Task 6.1: Test ErrorMessage component renders with correct styling
  it('renders error message with red/warning styling', () => {
    const errorMessage: Message = {
      id: 'error-1',
      role: 'error',
      content: 'Connection failed - please try again',
      timestamp: new Date(),
    };

    const { container } = render(<ErrorMessage message={errorMessage} />);
    const errorElement = container.firstChild as HTMLElement;

    // AC-8.2: Red/warning color styling
    expect(errorElement).toHaveClass('border-red-400');
    expect(errorElement).toHaveClass('bg-red-50');
    expect(errorElement).toHaveClass('text-red-900');
  });

  it('renders with warning icon for accessibility', () => {
    const errorMessage: Message = {
      id: 'error-1',
      role: 'error',
      content: 'An error occurred',
      timestamp: new Date(),
    };

    const { container } = render(<ErrorMessage message={errorMessage} />);

    // Should have SVG warning icon
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true'); // Decorative icon
  });

  it('has proper accessibility attributes', () => {
    const errorMessage: Message = {
      id: 'error-1',
      role: 'error',
      content: 'Server error occurred',
      timestamp: new Date(),
    };

    const { container } = render(<ErrorMessage message={errorMessage} />);
    const errorElement = container.firstChild as HTMLElement;

    // Accessibility: role="alert" for screen readers
    expect(errorElement).toHaveAttribute('role', 'alert');
    expect(errorElement).toHaveAttribute('aria-live', 'assertive');
  });

  it('displays error message content as plain text', () => {
    const errorMessage: Message = {
      id: 'error-1',
      role: 'error',
      content: 'Connection failed - please try again',
      timestamp: new Date(),
    };

    render(<ErrorMessage message={errorMessage} />);

    // AC-8.3: Plain language error message
    expect(screen.getByText('Connection failed - please try again')).toBeInTheDocument();
  });

  it('does not render markdown in error messages', () => {
    const errorMessage: Message = {
      id: 'error-1',
      role: 'error',
      content: '**This should not be bold**',
      timestamp: new Date(),
    };

    render(<ErrorMessage message={errorMessage} />);

    // Plain text should include the markdown syntax (not rendered)
    expect(screen.getByText('**This should not be bold**')).toBeInTheDocument();
    expect(screen.queryByRole('strong')).not.toBeInTheDocument();
  });

  it('is left-aligned (mr-auto)', () => {
    const errorMessage: Message = {
      id: 'error-1',
      role: 'error',
      content: 'Error message',
      timestamp: new Date(),
    };

    const { container } = render(<ErrorMessage message={errorMessage} />);
    const errorElement = container.firstChild as HTMLElement;

    // Error messages are left-aligned like agent messages
    expect(errorElement).toHaveClass('mr-auto');
  });

  it('has distinct visual styling (border + background + icon)', () => {
    const errorMessage: Message = {
      id: 'error-1',
      role: 'error',
      content: 'Test error',
      timestamp: new Date(),
    };

    const { container } = render(<ErrorMessage message={errorMessage} />);
    const errorElement = container.firstChild as HTMLElement;

    // Not color-only: has border, background, and icon
    expect(errorElement).toHaveClass('border-2'); // Visual border
    expect(errorElement).toHaveClass('bg-red-50'); // Background color
    expect(container.querySelector('svg')).toBeInTheDocument(); // Warning icon
  });

  it('handles long error messages', () => {
    const longMessage = 'This is a very long error message that might wrap multiple lines in the UI. ' +
      'It should still be displayed correctly with proper styling and accessibility.';

    const errorMessage: Message = {
      id: 'error-1',
      role: 'error',
      content: longMessage,
      timestamp: new Date(),
    };

    render(<ErrorMessage message={errorMessage} />);
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('handles empty error messages gracefully', () => {
    const errorMessage: Message = {
      id: 'error-1',
      role: 'error',
      content: '',
      timestamp: new Date(),
    };

    const { container } = render(<ErrorMessage message={errorMessage} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies max-width constraint for readability', () => {
    const errorMessage: Message = {
      id: 'error-1',
      role: 'error',
      content: 'Error message',
      timestamp: new Date(),
    };

    const { container } = render(<ErrorMessage message={errorMessage} />);
    const errorElement = container.firstChild as HTMLElement;

    // Max width 75% like other messages
    expect(errorElement).toHaveClass('max-w-[75%]');
  });
});
