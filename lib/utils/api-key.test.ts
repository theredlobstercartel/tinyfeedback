import { describe, it, expect } from 'vitest';
import { generateApiKey } from './api-key';

describe('generateApiKey', () => {
  it('should generate an API key with correct prefix', () => {
    const apiKey = generateApiKey();
    expect(apiKey.startsWith('tf_live_')).toBe(true);
  });

  it('should generate unique API keys', () => {
    const apiKey1 = generateApiKey();
    const apiKey2 = generateApiKey();
    expect(apiKey1).not.toBe(apiKey2);
  });

  it('should generate API key with correct length', () => {
    const apiKey = generateApiKey();
    // prefix (8) + random (24) = 32 characters
    expect(apiKey.length).toBe(32);
  });

  it('should only contain valid characters', () => {
    const apiKey = generateApiKey();
    // Should match pattern: tf_live_[a-z0-9]{24}
    expect(apiKey).toMatch(/^tf_live_[a-z0-9]{24}$/);
  });
});
