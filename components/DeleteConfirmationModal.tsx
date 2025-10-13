'use client';

// components/DeleteConfirmationModal.tsx
// Story 10.4: Conversation Sidebar UI - Delete Confirmation Modal
// Task 5: Create DeleteConfirmationModal component (AC: 8)

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Delete confirmation modal for conversation deletion.
 *
 * Features:
 * - Confirmation modal prevents accidental deletion (AC-10.4-8)
 * - Calls DELETE /api/conversations/:id on confirm (AC-10.4-8)
 * - Loading state during deletion
 * - Error handling with error message display
 * - Escape key to close, click outside to close (Headless UI default)
 *
 * Design System:
 * - Modal backdrop: semi-transparent black/30
 * - Modal panel: bg-white rounded-lg shadow-xl
 * - Warning icon: ExclamationTriangleIcon text-red-600
 * - Delete button: bg-red-600 hover:bg-red-700 (semantic destructive color)
 * - Cancel button: bg-white border border-slate-300 hover:bg-slate-50
 * - Border radius: rounded-lg (8px geometric design system)
 * - Text: text-sm text-slate-600 for description
 *
 * @param isOpen - Whether modal is visible
 * @param onClose - Callback to close modal
 * @param onConfirm - Async callback to delete conversation (returns Promise)
 * @param conversationTitle - Title/preview of conversation being deleted
 */

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  conversationTitle: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  conversationTitle,
}: DeleteConfirmationModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    } finally {
      setDeleting(false);
    }
  }

  function handleClose() {
    if (!deleting) {
      setError(null);
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md bg-white rounded-lg p-6 shadow-xl">
          {/* Header with Warning Icon */}
          <div className="flex items-center gap-3 mb-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Delete Conversation
            </Dialog.Title>
          </div>

          {/* Description */}
          <Dialog.Description className="text-sm text-slate-600 mb-6">
            Are you sure you want to delete &quot;{conversationTitle}&quot;? This will
            permanently delete the conversation and all associated files. This
            action cannot be undone.
          </Dialog.Description>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            {/* Cancel Button */}
            <button
              onClick={handleClose}
              disabled={deleting}
              className="
                px-4 py-2 text-sm font-medium text-slate-700
                bg-white border border-slate-300 rounded-lg
                hover:bg-slate-50 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1
              "
            >
              Cancel
            </button>

            {/* Delete Button (Destructive) */}
            <button
              onClick={handleConfirm}
              disabled={deleting}
              className="
                px-4 py-2 text-sm font-medium text-white
                bg-red-600 rounded-lg
                hover:bg-red-700 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:ring-2 focus:ring-red-500 focus:ring-offset-1
              "
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
