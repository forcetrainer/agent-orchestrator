/**
 * Tests for OpenAI Function Tool Definitions
 * Story 2.1: OpenAI SDK Integration & Function Tool Definitions
 */

import {
  READ_FILE_TOOL,
  WRITE_FILE_TOOL,
  LIST_FILES_TOOL,
  FUNCTION_TOOLS,
} from '../function-tools';

describe('Function Tools', () => {
  describe('READ_FILE_TOOL', () => {
    it('should export READ_FILE_TOOL with correct schema', () => {
      expect(READ_FILE_TOOL).toBeDefined();
      expect(READ_FILE_TOOL.type).toBe('function');
      expect(READ_FILE_TOOL.function.name).toBe('read_file');
      expect(READ_FILE_TOOL.function.description).toBeTruthy();
      expect(READ_FILE_TOOL.function.parameters).toBeDefined();
    });

    it('should have type "function"', () => {
      expect(READ_FILE_TOOL.type).toBe('function');
    });

    it('should have required parameters defined', () => {
      expect(READ_FILE_TOOL.function.parameters.required).toContain('path');
      expect(READ_FILE_TOOL.function.parameters.properties.path).toBeDefined();
      expect(READ_FILE_TOOL.function.parameters.properties.path.type).toBe('string');
    });

    it('should have valid JSON schema structure', () => {
      expect(READ_FILE_TOOL.function.parameters.type).toBe('object');
      expect(READ_FILE_TOOL.function.parameters.properties).toBeDefined();
      expect(typeof READ_FILE_TOOL.function.parameters.properties).toBe('object');
    });
  });

  describe('WRITE_FILE_TOOL', () => {
    it('should export WRITE_FILE_TOOL with correct schema', () => {
      expect(WRITE_FILE_TOOL).toBeDefined();
      expect(WRITE_FILE_TOOL.type).toBe('function');
      expect(WRITE_FILE_TOOL.function.name).toBe('write_file');
      expect(WRITE_FILE_TOOL.function.description).toBeTruthy();
      expect(WRITE_FILE_TOOL.function.parameters).toBeDefined();
    });

    it('should have type "function"', () => {
      expect(WRITE_FILE_TOOL.type).toBe('function');
    });

    it('should have required parameters defined', () => {
      expect(WRITE_FILE_TOOL.function.parameters.required).toContain('path');
      expect(WRITE_FILE_TOOL.function.parameters.required).toContain('content');
      expect(WRITE_FILE_TOOL.function.parameters.properties.path).toBeDefined();
      expect(WRITE_FILE_TOOL.function.parameters.properties.content).toBeDefined();
      expect(WRITE_FILE_TOOL.function.parameters.properties.path.type).toBe('string');
      expect(WRITE_FILE_TOOL.function.parameters.properties.content.type).toBe('string');
    });

    it('should have valid JSON schema structure', () => {
      expect(WRITE_FILE_TOOL.function.parameters.type).toBe('object');
      expect(WRITE_FILE_TOOL.function.parameters.properties).toBeDefined();
      expect(typeof WRITE_FILE_TOOL.function.parameters.properties).toBe('object');
    });
  });

  describe('LIST_FILES_TOOL', () => {
    it('should export LIST_FILES_TOOL with correct schema', () => {
      expect(LIST_FILES_TOOL).toBeDefined();
      expect(LIST_FILES_TOOL.type).toBe('function');
      expect(LIST_FILES_TOOL.function.name).toBe('list_files');
      expect(LIST_FILES_TOOL.function.description).toBeTruthy();
      expect(LIST_FILES_TOOL.function.parameters).toBeDefined();
    });

    it('should have type "function"', () => {
      expect(LIST_FILES_TOOL.type).toBe('function');
    });

    it('should have required parameters defined', () => {
      expect(LIST_FILES_TOOL.function.parameters.required).toContain('path');
      expect(LIST_FILES_TOOL.function.parameters.properties.path).toBeDefined();
      expect(LIST_FILES_TOOL.function.parameters.properties.path.type).toBe('string');
    });

    it('should have valid JSON schema structure', () => {
      expect(LIST_FILES_TOOL.function.parameters.type).toBe('object');
      expect(LIST_FILES_TOOL.function.parameters.properties).toBeDefined();
      expect(typeof LIST_FILES_TOOL.function.parameters.properties).toBe('object');
    });
  });

  describe('FUNCTION_TOOLS', () => {
    it('should export FUNCTION_TOOLS array with all three tools', () => {
      expect(FUNCTION_TOOLS).toBeDefined();
      expect(Array.isArray(FUNCTION_TOOLS)).toBe(true);
      expect(FUNCTION_TOOLS).toHaveLength(3);
    });

    it('should contain READ_FILE_TOOL', () => {
      expect(FUNCTION_TOOLS).toContain(READ_FILE_TOOL);
    });

    it('should contain WRITE_FILE_TOOL', () => {
      expect(FUNCTION_TOOLS).toContain(WRITE_FILE_TOOL);
    });

    it('should contain LIST_FILES_TOOL', () => {
      expect(FUNCTION_TOOLS).toContain(LIST_FILES_TOOL);
    });

    it('should have "function" type for all tools', () => {
      FUNCTION_TOOLS.forEach((tool) => {
        expect(tool.type).toBe('function');
      });
    });

    it('should have unique function names', () => {
      const names = FUNCTION_TOOLS.map((tool) => tool.function.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(FUNCTION_TOOLS.length);
    });

    it('should have all required fields for OpenAI ChatCompletionTool spec', () => {
      FUNCTION_TOOLS.forEach((tool) => {
        expect(tool.type).toBe('function');
        expect(tool.function).toBeDefined();
        expect(tool.function.name).toBeTruthy();
        expect(tool.function.description).toBeTruthy();
        expect(tool.function.parameters).toBeDefined();
        expect(tool.function.parameters.type).toBe('object');
        expect(tool.function.parameters.properties).toBeDefined();
        expect(tool.function.parameters.required).toBeDefined();
        expect(Array.isArray(tool.function.parameters.required)).toBe(true);
      });
    });
  });
});
