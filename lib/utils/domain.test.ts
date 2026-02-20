import { describe, it, expect } from 'vitest';
import { validateDomain, normalizeDomain } from './domain';

describe('Domain Validation', () => {
  describe('validateDomain', () => {
    // AC-03: Validação de domínios válidos
    it('should accept valid domain names', () => {
      expect(validateDomain('example.com').valid).toBe(true);
      expect(validateDomain('sub.example.com').valid).toBe(true);
      expect(validateDomain('my-site.org').valid).toBe(true);
      expect(validateDomain('localhost').valid).toBe(true);
    });

    it('should reject URLs with protocols', () => {
      expect(validateDomain('http://example.com').valid).toBe(false);
      expect(validateDomain('https://example.com').valid).toBe(false);
      expect(validateDomain('http://example.com').error).toBe('Remove o protocolo (http:// ou https://)');
    });

    it('should reject URLs with paths', () => {
      expect(validateDomain('example.com/path').valid).toBe(false);
      expect(validateDomain('example.com/path/to/page').valid).toBe(false);
      expect(validateDomain('example.com/path').error).toBe('Remove o caminho (/path)');
    });

    it('should reject domains with ports', () => {
      expect(validateDomain('example.com:8080').valid).toBe(false);
      expect(validateDomain('example.com:3000').valid).toBe(false);
      expect(validateDomain('example.com:8080').error).toBe('Remove a porta (:8080)');
    });

    it('should reject empty domains', () => {
      expect(validateDomain('').valid).toBe(false);
      expect(validateDomain('   ').valid).toBe(false);
      expect(validateDomain('').error).toBe('Domínio é obrigatório');
    });

    it('should reject invalid characters', () => {
      expect(validateDomain('example..com').valid).toBe(false);
      expect(validateDomain('example .com').valid).toBe(false);
      expect(validateDomain('-example.com').valid).toBe(false);
    });

    it('should reject duplicate domains in list', () => {
      const existingDomains = ['example.com', 'test.com'];
      expect(validateDomain('example.com', existingDomains).valid).toBe(false);
      expect(validateDomain('example.com', existingDomains).error).toBe('Domínio já existe na lista');
    });
  });

  describe('normalizeDomain', () => {
    it('should convert to lowercase', () => {
      expect(normalizeDomain('EXAMPLE.COM')).toBe('example.com');
      expect(normalizeDomain('Sub.Domain.Org')).toBe('sub.domain.org');
    });

    it('should trim whitespace', () => {
      expect(normalizeDomain('  example.com  ')).toBe('example.com');
      expect(normalizeDomain(' example.com')).toBe('example.com');
    });
  });
});
