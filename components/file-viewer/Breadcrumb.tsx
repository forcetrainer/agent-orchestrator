'use client';

/**
 * Breadcrumb Component
 * Story 5.6 AC-2: Breadcrumb trail shows current file path
 *
 * Displays clickable breadcrumb trail for current file path.
 * Replaces session UUIDs with human-readable names from metadata.
 * Each segment is clickable to navigate to parent directories.
 */

import type { SessionMetadata } from '@/lib/files/manifestReader';

export interface BreadcrumbSegment {
  name: string;
  path: string;
}

export interface BreadcrumbProps {
  currentFilePath: string; // e.g., "uuid-123/requirements/prd.md"
  onNavigate?: (path: string) => void; // Callback when segment clicked
  sessionMetadata?: SessionMetadata; // From Story 5.2.1 for human-readable names
  treeData?: any; // Tree structure to extract displayNames
}

/**
 * Parse file path into breadcrumb segments
 * Replaces first segment (session UUID) with human-readable name from metadata
 */
function parsePath(
  filePath: string,
  treeData?: any
): BreadcrumbSegment[] {
  const segments = filePath.split('/');
  const result: BreadcrumbSegment[] = [];

  // Walk the tree to find display names
  let currentNode = treeData;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const cumulativePath = segments.slice(0, i + 1).join('/');

    // Try to find displayName from tree
    let displayName = segment;
    if (currentNode?.children) {
      const child = currentNode.children.find((c: any) => c.name === segment);
      if (child) {
        displayName = child.displayName || child.name;
        currentNode = child;
      }
    }

    result.push({
      name: displayName,
      path: cumulativePath,
    });
  }

  return result;
}

export function Breadcrumb({
  currentFilePath,
  onNavigate,
  treeData,
}: BreadcrumbProps) {
  if (!currentFilePath) {
    return null;
  }

  const segments = parsePath(currentFilePath, treeData);

  // Truncate if too many segments (>5)
  const shouldTruncate = segments.length > 5;
  const displaySegments = shouldTruncate
    ? [
        segments[0],
        { name: '...', path: '' },
        ...segments.slice(segments.length - 3),
      ]
    : segments;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-600">
      {displaySegments.map((segment, index) => {
        const isLast = index === displaySegments.length - 1;
        const isEllipsis = segment.name === '...';

        return (
          <div key={segment.path || `ellipsis-${index}`} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400" aria-hidden="true">
                /
              </span>
            )}

            {isEllipsis ? (
              <span className="text-gray-400">...</span>
            ) : isLast ? (
              <span className="font-medium text-gray-900" aria-current="page">
                {segment.name}
              </span>
            ) : (
              <button
                onClick={() => onNavigate?.(segment.path)}
                className="hover:text-gray-900 hover:underline transition-colors"
                aria-label={`Navigate to ${segment.name}`}
              >
                {segment.name}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
