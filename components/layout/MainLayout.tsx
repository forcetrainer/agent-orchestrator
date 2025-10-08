'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFileViewer } from '../file-viewer/FileViewerContext';
import { FileViewerPanel } from '../FileViewerPanel';

/**
 * MainLayout Component
 *
 * Story 6.1: Dynamic File Viewer Toggle
 * AC-4: When viewer closed, chat panel uses 100% width
 * AC-5: When viewer open, layout is 70% chat / 30% file viewer
 * AC-7: Animation uses spring physics (natural feel, not linear)
 *
 * Grid layout component with dynamic columns based on file viewer state.
 * Uses Framer Motion for smooth spring-based animations.
 */

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isOpen } = useFileViewer();

  return (
    <div className="flex h-screen">
      {/* Chat panel - expands to full width when viewer closed */}
      <div className="flex-1 min-w-0">{children}</div>

      {/* File viewer panel - animated collapse/expand */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.aside
            key="file-viewer"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '40%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 300,
            }}
            className="overflow-hidden min-w-[400px]"
          >
            <div className="w-full h-full">
              <FileViewerPanel />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
