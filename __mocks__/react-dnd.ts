/**
 * Mock for react-dnd (ESM-only package)
 * Story 6.6: File Reference Attachment UI (Drag & Drop)
 */

export const DndProvider = ({ children }: { children: React.ReactNode }) => children;

export const useDrag = jest.fn(() => [
  { isDragging: false },
  jest.fn(), // drag ref
]);

export const useDrop = jest.fn(() => [
  { isOver: false },
  jest.fn(), // drop ref
]);
