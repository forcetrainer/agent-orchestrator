/**
 * Screen Reader Announcer Utility
 *
 * Story 6.6: File Reference Attachment UI (Drag & Drop)
 * AC-9: Screen reader announces "File attached: {filename}"
 *
 * Provides a utility to announce messages to screen readers using ARIA live regions.
 * Announcements are polite (non-interrupting) and transient (removed after delivery).
 */

/**
 * Announces a message to screen readers using an ARIA live region.
 *
 * Creates a temporary live region element, announces the message, and removes it
 * after the announcement has been delivered (1 second delay).
 *
 * @param message - The message to announce to screen readers
 *
 * @example
 * announceToScreenReader('File attached: readme.md');
 * announceToScreenReader('File removed: config.json');
 */
export function announceToScreenReader(message: string): void {
  // Create a visually hidden live region element
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only'; // Visually hidden but accessible to screen readers
  announcement.textContent = message;

  // Add to document body
  document.body.appendChild(announcement);

  // Remove after announcement has been delivered
  // Screen readers typically process live regions within 500ms, but we use 1s to be safe
  setTimeout(() => {
    if (announcement.parentNode) {
      document.body.removeChild(announcement);
    }
  }, 1000);
}
