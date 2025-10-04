import { log } from '../logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;
  let originalEnv: string | undefined;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    if (originalEnv !== undefined) {
      process.env = { ...process.env, NODE_ENV: originalEnv as any };
    }
  });

  describe('INFO level', () => {
    it('logs INFO messages to console.log', () => {
      log('INFO', 'test-operation', { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.objectContaining({ key: 'value' })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-operation'),
        expect.any(Object)
      );
    });

    it('includes timestamp in log output', () => {
      log('INFO', 'test-operation', { data: 'test' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        expect.any(Object)
      );
    });
  });

  describe('ERROR level', () => {
    it('logs ERROR messages to console.error', () => {
      const error = new Error('Test error');
      log('ERROR', 'test-operation', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        error
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-operation'),
        expect.any(Error)
      );
    });

    it('includes full error details including stack trace', () => {
      const error = new Error('Test error with stack');
      log('ERROR', 'error-operation', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        error
      );
    });
  });

  describe('DEBUG level', () => {
    it('logs DEBUG messages in development environment', () => {
      process.env = { ...process.env, NODE_ENV: 'development' };
      log('DEBUG', 'test-operation', { debug: 'data' });

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.objectContaining({ debug: 'data' })
      );
    });

    it('does not log DEBUG messages in production environment', () => {
      process.env = { ...process.env, NODE_ENV: 'production' };
      log('DEBUG', 'test-operation', { debug: 'data' });

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('does not log DEBUG messages when NODE_ENV is undefined', () => {
      const { NODE_ENV, ...envWithoutNodeEnv } = process.env;
      process.env = envWithoutNodeEnv as any;
      log('DEBUG', 'test-operation', { debug: 'data' });

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe('Log format and structure', () => {
    it('includes operation context in log output', () => {
      log('INFO', 'conversation:create', { id: '123' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('conversation:create'),
        expect.any(Object)
      );
    });

    it('handles different data types', () => {
      log('INFO', 'test', 'string data');
      log('INFO', 'test', 42);
      log('INFO', 'test', { nested: { object: true } });
      log('INFO', 'test', ['array', 'data']);

      expect(consoleLogSpy).toHaveBeenCalledTimes(4);
    });

    it('preserves data structure in logs', () => {
      const complexData = {
        user: 'test',
        metadata: { timestamp: 123, tags: ['a', 'b'] },
      };

      log('INFO', 'test-operation', complexData);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String),
        complexData
      );
    });
  });
});
