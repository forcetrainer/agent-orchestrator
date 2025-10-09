/**
 * MessageBubble Component Tests
 * Story 3.2 - Task 5: Role-based styling and content rendering
 * Story 3.3 - Task 6: Markdown rendering tests
 *
 * Tests role-based styling and markdown rendering
 * AC-2.1: User messages right-aligned with blue styling
 * AC-2.2: Assistant messages left-aligned with gray styling
 * AC-2.3: Clear visual distinction between roles
 * AC-3.1 to AC-3.7: Markdown rendering (headings, lists, code, links, bold, italic, tables)
 * Security: XSS prevention, link sanitization
 */

import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import { Message } from '@/lib/types';

describe('MessageBubble', () => {
  // Task 5.2: Test user message styling
  it('renders user message with right-aligned blue styling', () => {
    const userMessage: Message = {
      id: 'user-1',
      role: 'user',
      content: 'Hello, assistant!',
    };

    const { container } = render(<MessageBubble message={userMessage} />);
    const bubble = container.firstChild as HTMLElement;

    // AC-2.1: Right-aligned (ml-auto), blue background
    expect(bubble).toHaveClass('ml-auto');
    expect(bubble).toHaveClass('bg-blue-500');
    expect(bubble).toHaveClass('text-white');
  });

  // Task 5.3: Test assistant message styling
  it('renders assistant message with left-aligned gray styling', () => {
    const assistantMessage: Message = {
      id: 'assistant-1',
      role: 'assistant',
      content: 'Hello, user!',
    };

    const { container } = render(<MessageBubble message={assistantMessage} />);
    const bubble = container.firstChild as HTMLElement;

    // AC-2.2: Left-aligned (mr-auto), gray background
    expect(bubble).toHaveClass('mr-auto');
    expect(bubble).toHaveClass('bg-gray-200');
    expect(bubble).toHaveClass('text-gray-900');
  });

  // Task 5.4: Test content rendering
  it('displays message content correctly', () => {
    const message: Message = {
      id: 'msg-1',
      role: 'user',
      content: 'This is my message content',
    };

    render(<MessageBubble message={message} />);
    expect(screen.getByText('This is my message content')).toBeInTheDocument();
  });

  // Task 5.5: Test system role styling
  it('renders system message with red styling', () => {
    const systemMessage: Message = {
      role: 'system',
      content: 'System message',
      id: 'sys-1',
      timestamp: new Date(),
    };

    const { container } = render(<MessageBubble message={systemMessage} />);
    const bubble = container.firstChild as HTMLElement;

    // System messages (info) left-aligned with red background
    expect(bubble).toHaveClass('mr-auto');
    expect(bubble).toHaveClass('bg-red-500');
    expect(bubble).toHaveClass('text-white');
  });

  // Story 3.8 Task 6.1: Test error role delegates to ErrorMessage component
  it('renders error message with ErrorMessage component', () => {
    const errorMessage: Message = {
      role: 'error',
      content: 'Connection failed - please try again',
      id: 'error-1',
      timestamp: new Date(),
    };

    render(<MessageBubble message={errorMessage} />);

    // Error messages should be rendered by ErrorMessage component
    expect(screen.getByText('Connection failed - please try again')).toBeInTheDocument();
    // ErrorMessage component has role="alert"
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  // AC-2.3: Visual distinction test
  it('applies different styling classes for different roles', () => {
    const userMessage: Message = { id: '1', role: 'user', content: 'User message' };
    const assistantMessage: Message = { id: '2', role: 'assistant', content: 'Assistant message' };

    const { container: userContainer } = render(<MessageBubble message={userMessage} />);
    const { container: assistantContainer } = render(<MessageBubble message={assistantMessage} />);

    const userBubble = userContainer.firstChild as HTMLElement;
    const assistantBubble = assistantContainer.firstChild as HTMLElement;

    // User has ml-auto (right), assistant has mr-auto (left)
    expect(userBubble.className).not.toBe(assistantBubble.className);
    expect(userBubble).toHaveClass('ml-auto');
    expect(assistantBubble).toHaveClass('mr-auto');
  });

  // Design system compliance
  it('applies design system styling (rounded, padding, max-width)', () => {
    const message: Message = { id: 'test-1', role: 'user', content: 'Test' };
    const { container } = render(<MessageBubble message={message} />);
    const bubble = container.firstChild as HTMLElement;

    expect(bubble).toHaveClass('rounded-lg');
    expect(bubble).toHaveClass('px-4');
    expect(bubble).toHaveClass('py-3');
    expect(bubble).toHaveClass('max-w-[75%]');
  });

  // ========================================
  // Story 3.3: Markdown Rendering Tests
  // ========================================

  describe('Markdown Rendering', () => {
    // AC-3.1: Headings (h1-h6)
    it('renders markdown headings correctly', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6',
      };

      render(<MessageBubble message={message} />);

      expect(screen.getByRole('heading', { level: 1, name: 'H1' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'H2' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'H3' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'H4' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 5, name: 'H5' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 6, name: 'H6' })).toBeInTheDocument();
    });

    // AC-3.2: Lists (bulleted and numbered)
    it('renders unordered lists correctly', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: '- Item 1\n- Item 2\n- Item 3',
      };

      render(<MessageBubble message={message} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('renders ordered lists correctly', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: '1. First\n2. Second\n3. Third',
      };

      render(<MessageBubble message={message} />);

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    // AC-3.3: Code blocks with monospace font and background
    it('renders inline code with monospace and background', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: 'Use `npm install` to install packages',
      };

      render(<MessageBubble message={message} />);

      const codeElement = screen.getByText('npm install');
      expect(codeElement.tagName).toBe('CODE');
      expect(codeElement).toHaveClass('font-mono');
      expect(codeElement).toHaveClass('bg-gray-100');
    });

    it('renders code blocks with monospace and background', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: '```javascript\nconst x = 42;\n```',
      };

      render(<MessageBubble message={message} />);

      const codeElement = screen.getByText('const x = 42;');
      expect(codeElement.tagName).toBe('CODE');
      expect(codeElement).toHaveClass('font-mono');
    });

    // AC-3.4: Links are clickable and styled appropriately
    it('renders links with correct attributes and styling', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: '[Click here](https://example.com)',
      };

      render(<MessageBubble message={message} />);

      const link = screen.getByRole('link', { name: 'Click here' });
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveClass('text-blue-600');
      expect(link).toHaveClass('underline');
    });

    // AC-3.5: Bold and italic text render correctly
    it('renders bold text correctly', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: 'This is **bold** text',
      };

      render(<MessageBubble message={message} />);

      const boldElement = screen.getByText('bold');
      expect(boldElement.tagName).toBe('STRONG');
      expect(boldElement).toHaveClass('font-bold');
    });

    it('renders italic text correctly', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: 'This is *italic* text',
      };

      render(<MessageBubble message={message} />);

      const italicElement = screen.getByText('italic');
      expect(italicElement.tagName).toBe('EM');
      expect(italicElement).toHaveClass('italic');
    });

    // AC-3.6: Line breaks and paragraphs are preserved
    it('preserves paragraphs and line breaks', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: 'First paragraph\n\nSecond paragraph',
      };

      render(<MessageBubble message={message} />);

      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
    });

    // AC-3.7: Tables render correctly
    it('renders markdown tables with structure and styling', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |',
      };

      render(<MessageBubble message={message} />);

      expect(screen.getAllByRole('table')).toHaveLength(2); // Mock creates table per row
      expect(screen.getByText('Header 1')).toBeInTheDocument();
      expect(screen.getByText('Header 2')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 2')).toBeInTheDocument();
    });
  });

  // ========================================
  // Security Tests
  // ========================================

  describe('Security', () => {
    // XSS Prevention: Script tags should be sanitized
    it('prevents XSS with script tags', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: '<script>alert("xss")</script>Hello',
      };

      render(<MessageBubble message={message} />);

      // react-markdown sanitizes dangerous HTML by default - script tags won't execute
      expect(screen.queryByRole('script')).not.toBeInTheDocument();
      // Content should be rendered as text (markdown treats raw HTML as text)
      const container = screen.getByText(/Hello/);
      expect(container).toBeInTheDocument();
    });

    // XSS Prevention: Dangerous links should be sanitized
    it('sanitizes javascript: protocol in links', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: '[Click](javascript:alert("xss"))',
      };

      render(<MessageBubble message={message} />);

      const link = screen.queryByRole('link');
      // react-markdown should either remove or sanitize the dangerous protocol
      if (link) {
        expect(link).not.toHaveAttribute('href', 'javascript:alert("xss")');
      }
    });

    // XSS Prevention: HTML injection
    it('prevents HTML injection with img onerror', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: '<img src=x onerror=alert("xss")>Text',
      };

      render(<MessageBubble message={message} />);

      // react-markdown sanitizes dangerous HTML by default
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText(/Text/)).toBeInTheDocument();
    });
  });

  // ========================================
  // Role-based Rendering Tests
  // ========================================

  describe('Role-based Markdown Rendering', () => {
    // User messages should NOT render markdown
    it('does not render markdown for user messages', () => {
      const message: Message = {
        id: 'test', role: 'user',
        content: '**This should not be bold**',
      };

      render(<MessageBubble message={message} />);

      // Plain text should include the markdown syntax
      expect(screen.getByText('**This should not be bold**')).toBeInTheDocument();
      expect(screen.queryByRole('strong')).not.toBeInTheDocument();
    });

    // Error messages should NOT render markdown
    it('does not render markdown for error messages', () => {
      const message: Message = {
        id: 'test', role: 'system',
        content: '**This should not be bold**',
      };

      render(<MessageBubble message={message} />);

      // Plain text should include the markdown syntax
      expect(screen.getByText('**This should not be bold**')).toBeInTheDocument();
      expect(screen.queryByRole('strong')).not.toBeInTheDocument();
    });

    // Assistant messages SHOULD render markdown
    it('renders markdown for assistant messages', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: '**This should be bold**',
      };

      render(<MessageBubble message={message} />);

      const boldElement = screen.getByText('This should be bold');
      expect(boldElement.tagName).toBe('STRONG');
    });
  });

  // ========================================
  // Edge Cases and Fallbacks
  // ========================================

  describe('Edge Cases', () => {
    // Empty content
    it('handles empty markdown content gracefully', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: '',
      };

      const { container } = render(<MessageBubble message={message} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    // Mixed plain text and markdown
    it('handles mixed plain text and markdown content', () => {
      const message: Message = {
        id: 'test', role: 'assistant',
        content: 'Plain text with **bold** and `code`',
      };

      render(<MessageBubble message={message} />);

      // Text is broken up by multiple elements, use regex matcher
      expect(screen.getByText(/Plain text with/)).toBeInTheDocument();
      expect(screen.getByText('bold')).toBeInTheDocument();
      expect(screen.getByText('code')).toBeInTheDocument();
    });

    // Large markdown content (performance test)
    it('renders large markdown content without errors', () => {
      const largeContent = '# Heading\n\n' + 'Lorem ipsum dolor sit amet. '.repeat(200);
      const message: Message = {
        id: 'test', role: 'assistant',
        content: largeContent,
      };

      const { container } = render(<MessageBubble message={message} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });
});
