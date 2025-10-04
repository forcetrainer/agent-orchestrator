/**
 * Mock for react-markdown (ESM-only package)
 * Story 3.3 - Task 6: Testing infrastructure
 *
 * This mock provides a functional markdown parser for tests
 * that renders actual HTML elements for accurate testing.
 */

import React from 'react';

interface ReactMarkdownProps {
  children: string;
  remarkPlugins?: any[];
  components?: Record<string, React.ComponentType<any>>;
}

const ReactMarkdown: React.FC<ReactMarkdownProps> = ({ children, components = {} }) => {
  const content = children || '';

  // Simple markdown parser for testing
  // Converts markdown to HTML elements using provided component overrides

  // Helper to render with custom component or default
  const renderWithComponent = (tag: string, props: any, defaultTag: string) => {
    const Component = components[tag] || defaultTag;
    if (typeof Component === 'string') {
      return React.createElement(Component, props);
    }
    return React.createElement(Component, props);
  };

  // Split content into lines for parsing
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockLang = '';

  lines.forEach((line, idx) => {
    // Code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.slice(3);
        codeBlockContent = '';
      } else {
        inCodeBlock = false;
        const preProps = { key: `pre-${idx}`, children: renderWithComponent('code',
          { className: `language-${codeBlockLang}`, children: codeBlockContent.trim() }, 'code') };
        elements.push(renderWithComponent('pre', preProps, 'pre'));
        codeBlockContent = '';
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent += line + '\n';
      return;
    }

    // Headings
    const h6Match = line.match(/^###### (.+)$/);
    const h5Match = line.match(/^##### (.+)$/);
    const h4Match = line.match(/^#### (.+)$/);
    const h3Match = line.match(/^### (.+)$/);
    const h2Match = line.match(/^## (.+)$/);
    const h1Match = line.match(/^# (.+)$/);

    if (h6Match) {
      elements.push(renderWithComponent('h6', { key: `h6-${idx}`, children: h6Match[1] }, 'h6'));
      return;
    }
    if (h5Match) {
      elements.push(renderWithComponent('h5', { key: `h5-${idx}`, children: h5Match[1] }, 'h5'));
      return;
    }
    if (h4Match) {
      elements.push(renderWithComponent('h4', { key: `h4-${idx}`, children: h4Match[1] }, 'h4'));
      return;
    }
    if (h3Match) {
      elements.push(renderWithComponent('h3', { key: `h3-${idx}`, children: h3Match[1] }, 'h3'));
      return;
    }
    if (h2Match) {
      elements.push(renderWithComponent('h2', { key: `h2-${idx}`, children: h2Match[1] }, 'h2'));
      return;
    }
    if (h1Match) {
      elements.push(renderWithComponent('h1', { key: `h1-${idx}`, children: h1Match[1] }, 'h1'));
      return;
    }

    // Tables
    if (line.includes('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      if (cells.length > 0 && !line.match(/^[\s\-|]+$/)) {
        // Simple table row
        const tdElements = cells.map((cell, i) =>
          renderWithComponent('td', { key: `td-${idx}-${i}`, children: cell }, 'td')
        );
        elements.push(renderWithComponent('table', { key: `table-${idx}`, children:
          renderWithComponent('tbody', { children:
            renderWithComponent('tr', { children: tdElements }, 'tr')
          }, 'tbody')
        }, 'table'));
      }
      return;
    }

    // Lists
    if (line.match(/^- /)) {
      const listItem = line.slice(2);
      elements.push(renderWithComponent('ul', { key: `ul-${idx}`, children:
        renderWithComponent('li', { children: parseInlineMarkdown(listItem, components) }, 'li')
      }, 'ul'));
      return;
    }
    if (line.match(/^\d+\. /)) {
      const listItem = line.replace(/^\d+\. /, '');
      elements.push(renderWithComponent('ol', { key: `ol-${idx}`, children:
        renderWithComponent('li', { children: parseInlineMarkdown(listItem, components) }, 'li')
      }, 'ol'));
      return;
    }

    // Empty lines
    if (line.trim() === '') {
      return;
    }

    // Paragraphs with inline markdown
    elements.push(renderWithComponent('p', { key: `p-${idx}`, children: parseInlineMarkdown(line, components) }, 'p'));
  });

  return <>{elements}</>;
};

// Parse inline markdown (bold, italic, code, links)
function parseInlineMarkdown(text: string, components: Record<string, React.ComponentType<any>> = {}): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      const Component = components['strong'] || 'strong';
      parts.push(React.createElement(Component, { key: key++ }, boldMatch[1]));
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic *text*
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      const Component = components['em'] || 'em';
      parts.push(React.createElement(Component, { key: key++ }, italicMatch[1]));
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline code `text`
    const codeMatch = remaining.match(/^`(.+?)`/);
    if (codeMatch) {
      const Component = components['code'] || 'code';
      parts.push(React.createElement(Component, { key: key++ }, codeMatch[1]));
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Links [text](url)
    const linkMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/);
    if (linkMatch) {
      const Component = components['a'] || 'a';
      parts.push(React.createElement(Component, { key: key++, href: linkMatch[2] }, linkMatch[1]));
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Regular text
    const nextSpecial = remaining.search(/[\*`\[]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial > 0) {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    } else {
      // Special char that didn't match - skip it
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    }
  }

  return <>{parts}</>;
}

export default ReactMarkdown;
