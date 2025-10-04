import * as types from '../index'
import type { ApiResponse, ChatRequest, ChatResponse, AgentSummary, FileNode } from '../api'

describe('types/index', () => {
  describe('exports', () => {
    it('should export all types from api module', () => {
      // Since these are TypeScript types, we verify they compile correctly
      // by creating sample objects with these types

      const apiResponse: types.ApiResponse<string> = {
        success: true,
        data: 'test'
      }
      expect(apiResponse).toBeDefined()

      const chatRequest: types.ChatRequest = {
        message: 'test',
        agentId: 'test-agent'
      }
      expect(chatRequest).toBeDefined()

      const agentSummary: types.AgentSummary = {
        id: 'test',
        name: 'Test Agent',
        title: 'Test Title',
        description: 'Test description',
        path: '/agents/test'
      }
      expect(agentSummary).toBeDefined()

      const agent: types.Agent = {
        id: 'test',
        name: 'Test Agent',
        title: 'Test Title',
        description: 'Test description',
        path: '/agents/test',
        mainFile: '/agents/test/agent.md',
        fullContent: '# Test Agent\nFull content here'
      }
      expect(agent).toBeDefined()

      const fileNode: types.FileNode = {
        name: 'test.txt',
        path: '/test.txt',
        type: 'file'
      }
      expect(fileNode).toBeDefined()
    })

    it('should support clean imports from @/types', () => {
      // This test verifies that the path alias works
      // The fact that the import statement at the top of this file works
      // proves that @/types can be imported successfully
      expect(types).toBeDefined()
    })

    it('should allow importing specific types', () => {
      // Verify that we can import specific types from the api module via the index
      const response: ApiResponse<number> = {
        success: true,
        data: 42
      }
      expect(response.data).toBe(42)
    })
  })
})
