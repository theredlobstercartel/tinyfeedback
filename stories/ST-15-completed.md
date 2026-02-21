# ST-15 - Adicionar Notas Internas

## Status: ✅ COMPLETED

## Implementation Date
Implemented during initial project setup (commit 92285ac) as part of foundational schema.

## Components

### 1. Database Migration
- **File:** `supabase/migrations/20250220230000_add_internal_notes.sql`
- **Column:** `internal_notes TEXT`
- **Index:** `idx_feedbacks_internal_notes`

### 2. TypeScript Types
- **File:** `types/index.ts`
- **Feedback interface:** `internal_notes: string | null`
- **UpdateFeedbackInput:** `internal_notes?: string`

### 3. API Endpoint
- **File:** `app/api/feedbacks/[id]/route.ts`
- **Method:** PATCH
- **Validation:** `internal_notes must be a string`

### 4. UI Component
- **File:** `components/feedback/FeedbackDetail.tsx`
- **Features:**
  - Textarea for notes input
  - "PRIVADO" badge indicating private/internal
  - Auto-save functionality
  - Success/error feedback

## Acceptance Criteria
- ✅ AC-01: Campo de notas (Textarea editável)
- ✅ AC-02: Salvar notas (Persistência no banco)

## Test Results
```
Test Files  7 passed (7)
Tests      69 passed (69)
```

## GitHub Issue
- **Issue:** #19
- **Status:** CLOSED
