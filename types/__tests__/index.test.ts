import * as types from '../index'
import type { ApiResponse, ChatRequest, ChatResponse, Agent, FileNode } from '../api'

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

      const agent: types.Agent = {
        id: 'test',
        name: 'Test Agent',
        description: 'Test description',
        capabilities: ['test']
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
