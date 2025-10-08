/**
 * FileAttachment Component
 *
 * Story 6.6: File Reference Attachment UI (Drag & Drop)
 * AC-3: Dropped file appears as pill/chip in input area above text field
 * AC-4: Pill shows filename and has remove button (× icon)
 * AC-6: Clicking × on pill removes attachment
 *
 * Displays an attached file as a pill/chip with a remove button.
 * Used in MessageInput to show files that have been attached via drag-drop.
 */

export interface FileAttachmentProps {
  /** Display name of the file */
  filename: string;
  /** Absolute file path */
  filepath: string;
  /** Callback when remove button is clicked */
  onRemove: () => void;
}

/**
 * FileAttachment pill component
 *
 * Renders a blue rounded pill with file icon, filename, and remove button.
 * Follows existing design system (blue accent colors, rounded-full).
 */
export function FileAttachment({ filename, filepath, onRemove }: FileAttachmentProps) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full text-sm transition-colors hover:bg-blue-200"
      title={filepath}
    >
      {/* File icon (paperclip emoji) */}
      <span className="text-blue-800" aria-hidden="true">
        📎
      </span>

      {/* Filename */}
      <span className="text-blue-800 font-medium truncate max-w-[200px]">
        {filename}
      </span>

      {/* Remove button - AC-4, AC-6 */}
      <button
        onClick={onRemove}
        className="text-blue-600 hover:text-blue-800 font-bold text-lg leading-none ml-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
        aria-label={`Remove ${filename}`}
        type="button"
      >
        ×
      </button>
    </div>
  );
}
