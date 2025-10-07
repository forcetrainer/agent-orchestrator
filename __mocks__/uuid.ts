// Mock for uuid package (ES Module issues with Jest)
export function v4(): string {
  return 'mock-uuid-' + Math.random().toString(36).substr(2, 9);
}
