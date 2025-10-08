/**
 * Tests for FileAttachment Component
 * Story 6.6: File Reference Attachment UI (Drag & Drop)
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileAttachment } from '../FileAttachment';

describe('FileAttachment', () => {
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    mockOnRemove.mockClear();
  });

  // AC-3, AC-4: Pill renders with filename and remove button
  it('renders pill with filename', () => {
    render(
      <FileAttachment
        filename="test.txt"
        filepath="/path/to/test.txt"
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText('test.txt')).toBeInTheDocument();
  });

  // AC-4: Pill shows remove button (× icon)
  it('renders remove button with × icon', () => {
    render(
      <FileAttachment
        filename="test.txt"
        filepath="/path/to/test.txt"
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByRole('button', { name: /remove test.txt/i });
    expect(removeButton).toBeInTheDocument();
    expect(removeButton).toHaveTextContent('×');
  });

  // AC-6: Clicking × calls onRemove callback
  it('calls onRemove when remove button clicked', async () => {
    const user = userEvent.setup();

    render(
      <FileAttachment
        filename="test.txt"
        filepath="/path/to/test.txt"
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByRole('button', { name: /remove test.txt/i });
    await user.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  // Accessibility: Remove button has proper aria-label
  it('has accessible label on remove button', () => {
    render(
      <FileAttachment
        filename="readme.md"
        filepath="/path/to/readme.md"
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByRole('button', { name: 'Remove readme.md' });
    expect(removeButton).toHaveAttribute('aria-label', 'Remove readme.md');
  });

  // Visual: Displays filepath in title attribute for tooltip
  it('shows filepath in title attribute', () => {
    const { container } = render(
      <FileAttachment
        filename="test.txt"
        filepath="/absolute/path/to/test.txt"
        onRemove={mockOnRemove}
      />
    );

    const pill = container.querySelector('[title="/absolute/path/to/test.txt"]');
    expect(pill).toBeInTheDocument();
  });

  // Visual: Uses blue accent colors (design system consistency)
  it('applies blue accent styling', () => {
    render(
      <FileAttachment
        filename="test.txt"
        filepath="/path/to/test.txt"
        onRemove={mockOnRemove}
      />
    );

    const filename = screen.getByText('test.txt');
    expect(filename).toHaveClass('text-blue-800');
  });
});
