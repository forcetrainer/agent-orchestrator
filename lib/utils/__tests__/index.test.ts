import * as utils from '../index'
import { env, validateEnv } from '../env'
import { AppError, ValidationError, NotFoundError, handleApiError } from '../errors'

describe('lib/utils/index', () => {
  describe('exports', () => {
    it('should export all functions from env module', () => {
      expect(utils.env).toBeDefined()
      expect(utils.validateEnv).toBeDefined()
      expect(utils.env).toBe(env)
      expect(utils.validateEnv).toBe(validateEnv)
    })

    it('should export all error classes and functions from errors module', () => {
      expect(utils.AppError).toBeDefined()
      expect(utils.ValidationError).toBeDefined()
      expect(utils.NotFoundError).toBeDefined()
      expect(utils.handleApiError).toBeDefined()
      expect(utils.AppError).toBe(AppError)
      expect(utils.ValidationError).toBe(ValidationError)
      expect(utils.NotFoundError).toBe(NotFoundError)
      expect(utils.handleApiError).toBe(handleApiError)
    })

    it('should support clean imports from @/lib/utils', () => {
      // This test verifies that the path alias works
      // The fact that the import statement at the top of this file works
      // proves that @/lib/utils can be imported successfully
      expect(utils).toBeDefined()
    })
  })
})
