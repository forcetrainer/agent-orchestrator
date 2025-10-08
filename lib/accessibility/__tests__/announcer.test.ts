/**
 * Tests for Screen Reader Announcer Utility
 * Story 6.6: File Reference Attachment UI (Drag & Drop)
 * AC-9: Screen reader announces "File attached: {filename}"
 */

import { announceToScreenReader } from '../announcer';

describe('announceToScreenReader', () => {
  beforeEach(() => {
    // Clear any existing announcement elements
    document.body.innerHTML = '';
  });

  it('creates a live region element with proper ARIA attributes', () => {
    announceToScreenReader('Test message');

    const liveRegion = document.querySelector('[role="status"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('sets the message as text content', () => {
    const message = 'File attached: readme.md';
    announceToScreenReader(message);

    const liveRegion = document.querySelector('[role="status"]');
    expect(liveRegion).toHaveTextContent(message);
  });

  it('applies sr-only class for visual hiding', () => {
    announceToScreenReader('Test message');

    const liveRegion = document.querySelector('[role="status"]');
    expect(liveRegion).toHaveClass('sr-only');
  });

  it('removes the announcement element after 1 second', () => {
    jest.useFakeTimers();

    announceToScreenReader('Test message');

    // Element should exist immediately
    let liveRegion = document.querySelector('[role="status"]');
    expect(liveRegion).toBeInTheDocument();

    // Fast-forward time by 1 second
    jest.advanceTimersByTime(1000);

    // Element should be removed
    liveRegion = document.querySelector('[role="status"]');
    expect(liveRegion).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('handles multiple announcements sequentially', () => {
    announceToScreenReader('First message');
    announceToScreenReader('Second message');

    // Both should be present initially
    const liveRegions = document.querySelectorAll('[role="status"]');
    expect(liveRegions.length).toBe(2);
    expect(liveRegions[0]).toHaveTextContent('First message');
    expect(liveRegions[1]).toHaveTextContent('Second message');
  });

  it('announces file attachment message', () => {
    const filename = 'config.json';
    announceToScreenReader(`File attached: ${filename}`);

    const liveRegion = document.querySelector('[role="status"]');
    expect(liveRegion).toHaveTextContent('File attached: config.json');
  });

  it('announces file removal message', () => {
    const filename = 'readme.md';
    announceToScreenReader(`File removed: ${filename}`);

    const liveRegion = document.querySelector('[role="status"]');
    expect(liveRegion).toHaveTextContent('File removed: readme.md');
  });
});
