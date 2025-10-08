/**
 * DndWrapper Component
 *
 * Story 6.6: File Reference Attachment UI (Drag & Drop)
 *
 * Client-side wrapper for React DnD provider.
 * Must be a client component to avoid SSR issues with DndProvider.
 */

'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export function DndWrapper({ children }: { children: React.ReactNode }) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}
