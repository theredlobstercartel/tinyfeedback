export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a domain name
 * @param domain - The domain to validate
 * @param existingDomains - Optional array of existing domains to check for duplicates
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateDomain(
  domain: string,
  existingDomains: string[] = []
): ValidationResult {
  const normalized = normalizeDomain(domain);

  // Check for empty domain
  if (!normalized) {
    return { valid: false, error: 'Domínio é obrigatório' };
  }

  // Check for protocol
  if (normalized.includes('://')) {
    return { valid: false, error: 'Remove o protocolo (http:// ou https://)' };
  }

  // Check for path
  if (normalized.includes('/')) {
    return { valid: false, error: 'Remove o caminho (/path)' };
  }

  // Check for port
  if (normalized.includes(':')) {
    return { valid: false, error: 'Remove a porta (:8080)' };
  }

  // Check for duplicate in existing list
  if (existingDomains.some(d => d.toLowerCase() === normalized)) {
    return { valid: false, error: 'Domínio já existe na lista' };
  }

  // Basic domain regex validation
  // Allows: example.com, sub.example.com, localhost, my-site.org
  // Disallows: -example.com, example..com, example .com
  const domainRegex = /^(?!-)[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!domainRegex.test(normalized)) {
    return { valid: false, error: 'Domínio inválido' };
  }

  return { valid: true };
}

/**
 * Normalizes a domain name (lowercase, trim)
 * @param domain - The domain to normalize
 * @returns Normalized domain string
 */
export function normalizeDomain(domain: string): string {
  return domain.toLowerCase().trim();
}
