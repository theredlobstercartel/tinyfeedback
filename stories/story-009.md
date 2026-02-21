# Story: ST-09 - Configurar CORS e Domínios Permitidos

**Issue:** #13  
**Epic:** Widget de Coleta de Feedback  
**Priority:** Must | Points: 3

## Description
Como founder, quero limitar quais domínios podem usar meu widget, para segurança e controle.

## Acceptance Criteria

### AC-01: Configurar domínios
- **Given:** founder nas configurações
- **When:** adiciona domínios permitidos
- **Then:** widget só aceita requisições desses domínios

### AC-02: CORS validation
- **Given:** requisição de domínio não permitido
- **When:** tenta enviar feedback
- **Then:** requisição é bloqueada com erro 403

## Implementation Summary

### Database Changes
- Migration: `20250221020000_add_allowed_domains.sql`
- Added `allowed_domains TEXT[]` column to `projects` table
- Added GIN index for efficient domain lookups

### API Changes
- **Domain Management API:** `app/api/projects/[id]/domains/route.ts`
  - `PATCH` - Add/remove domains from whitelist
  - `GET` - Retrieve project domains
  
- **Widget Feedback API:** `app/api/widget/feedback/route.ts`
  - Validates Origin/Referer headers against `allowed_domains`
  - Returns 403 for unauthorized domains
  - Supports subdomain matching (e.g., `sub.example.com` matches `example.com`)
  - Empty `allowed_domains` allows all domains (backward compatible)

### UI Components
- **DomainManager:** `components/settings/DomainManager.tsx`
  - Add domain input with validation
  - List existing domains with delete action
  - Visual feedback for errors

### Utilities
- **Domain Validation:** `lib/utils/domain.ts`
  - `validateDomain()` - Validates domain format
  - `normalizeDomain()` - Normalizes domain for storage

### Tests
- **API Tests:** `app/api/widget/feedback/route.test.ts` (10 tests)
  - CORS validation for authorized/unauthorized domains
  - Subdomain matching
  - Empty domain list behavior
  - Referer header fallback
  - CORS headers in responses
  
- **Domain API Tests:** `app/api/projects/[id]/domains/route.test.ts` (7 tests)
- **Domain Utility Tests:** `lib/utils/domain.test.ts` (9 tests)
- **UI Tests:** `components/settings/DomainManager.test.tsx` (9 tests)

## Security Features
1. **Domain Whitelist:** Only listed domains can submit feedback
2. **Subdomain Support:** Subdomains automatically inherit parent domain permissions
3. **Dual Header Check:** Checks both `Origin` and `Referer` headers
4. **CORS Headers:** Proper CORS headers on all responses
5. **API Key Authentication:** Combined with domain validation for security

## Files Modified/Created
```
supabase/migrations/20250221020000_add_allowed_domains.sql   (new)
app/api/widget/feedback/route.test.ts                        (new)
```

## Test Results
All 79 tests passing:
- 10 CORS/feedback API tests
- 7 Domain management API tests  
- 9 Domain utility tests
- 9 DomainManager component tests
- 44 Other existing tests
