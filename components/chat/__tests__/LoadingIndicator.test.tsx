import { render, screen } from '@testing-library/react';
import { LoadingIndicator } from '../LoadingIndicator';

/**
 * LoadingIndicator Component Tests
 * Story 3.6 - Task 5: Unit tests for LoadingIndicator component
 *
 * AC-6.2: Indicator shows "Agent is thinking..." or similar message
 * AC-6.5: Visual cue is clear but not distracting (subtle animation)
 */
describe('LoadingIndicator', () => {
  // Subtask 5.1: Test component renders with "Agent is thinking..." text
  it('renders with "Agent is thinking" text', () => {
    render(<LoadingIndicator />);
    expect(screen.getByText(/Agent is thinking/i)).toBeInTheDocument();
  });

  // Subtask 5.2: Test animation is present and loops continuously
  it('has animated dots with bounce animation', () => {
    const { container } = render(<LoadingIndicator />);
    const dots = container.querySelectorAll('.animate-bounce-dot');
    expect(dots).toHaveLength(3);
  });

  // Subtask 5.2: Test animation delays are staggered
  it('has staggered animation delays on dots', () => {
    const { container } = render(<LoadingIndicator />);
    const dots = container.querySelectorAll('.animate-bounce-dot');

    expect(dots[0]).toHaveClass('animation-delay-0');
    expect(dots[1]).toHaveClass('animation-delay-200');
    expect(dots[2]).toHaveClass('animation-delay-400');
  });

  // Subtask 5.3: Test ARIA live region for accessibility
  it('has aria-live="polite" for screen reader support', () => {
    const { container } = render(<LoadingIndicator />);
    const loadingDiv = container.querySelector('[aria-live="polite"]');
    expect(loadingDiv).toBeInTheDocument();
  });

  // Subtask 5.3: Test role and aria-label for accessibility
  it('has role="status" and aria-label for accessibility', () => {
    const { container } = render(<LoadingIndicator />);
    const loadingDiv = container.querySelector('[role="status"]');
    expect(loadingDiv).toBeInTheDocument();
    expect(loadingDiv).toHaveAttribute('aria-label', 'Agent is thinking');
  });

  // Subtask 5.4: Test styling matches agent message appearance
  it('matches agent message styling (left-aligned, gray background)', () => {
    const { container } = render(<LoadingIndicator />);
    const loadingDiv = container.querySelector('.bg-gray-200');

    // Check for agent message styles
    expect(loadingDiv).toBeInTheDocument();
    expect(loadingDiv).toHaveClass('mr-auto'); // Left-aligned
    expect(loadingDiv).toHaveClass('max-w-[75%]'); // Max width like messages
    expect(loadingDiv).toHaveClass('rounded-lg'); // Rounded corners
    expect(loadingDiv).toHaveClass('px-4', 'py-3'); // Padding like messages
  });

  // Subtask 5.5: Snapshot test for consistent rendering
  it('matches snapshot', () => {
    const { container } = render(<LoadingIndicator />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
