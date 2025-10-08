'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FileViewerContextType {
  isOpen: boolean;
  toggle: () => void;
}

const FileViewerContext = createContext<FileViewerContextType | undefined>(undefined);

export function FileViewerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true); // Default: viewer open

  // Keyboard shortcut handler: Ctrl/Cmd + B
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl (Windows/Linux) or Cmd (Mac) + B
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        // Prevent if user is typing in input/textarea
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }

        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <FileViewerContext.Provider value={{ isOpen, toggle }}>
      {children}
    </FileViewerContext.Provider>
  );
}

export function useFileViewer(): FileViewerContextType {
  const context = useContext(FileViewerContext);
  if (context === undefined) {
    throw new Error('useFileViewer must be used within a FileViewerProvider');
  }
  return context;
}
