# TinyFeedback Database Schema

## Overview

This directory contains the database schema and migrations for TinyFeedback, a feedback widget application built on PostgreSQL with Supabase.

## Schema Structure

### Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts for dashboard access |
| `teams` | Teams for collaboration |
| `team_members` | Team membership with roles (owner, admin, member) |
| `projects` | Projects that use the feedback widget |
| `feedbacks` | All feedback entries (NPS, suggestions, bugs) |
| `notifications` | Email notification queue |
| `quotas` | Monthly feedback quotas per project |

### Enums

| Enum | Values |
|------|--------|
| `user_plan` | free, pro |
| `feedback_type` | nps, suggestion, bug |
| `feedback_status` | new, analyzing, implemented, archived |
| `notification_type` | new_feedback, status_change, digest, quota_alert |
| `notification_status` | pending, sent, failed |
| `bug_priority` | low, medium, high |

### Views

| View | Description |
|------|-------------|
| `current_quotas` | Current month quotas with status (ok, warning, grace_period, exceeded) |
| `project_stats` | Aggregated statistics per project |
| `team_projects` | Projects with team information |

### Functions

| Function | Description |
|----------|-------------|
| `update_updated_at()` | Auto-updates the `updated_at` timestamp |
| `generate_api_key()` | Generates unique API keys with `tf_` prefix |
| `check_and_update_quota(project_id)` | Checks and updates quota for a project |
| `auto_classify_bug_priority()` | Auto-classifies bug priority based on keywords |
| `calculate_nps(project_id, days)` | Calculates NPS score for a project |
| `increment_feedback_quota()` | Increments quota count on new feedback |

### Triggers

| Trigger | Table | Description |
|---------|-------|-------------|
| `users_updated_at` | users | Auto-updates timestamp |
| `teams_updated_at` | teams | Auto-updates timestamp |
| `team_members_updated_at` | team_members | Auto-updates timestamp |
| `projects_updated_at` | projects | Auto-updates timestamp |
| `feedbacks_updated_at` | feedbacks | Auto-updates timestamp |
| `quotas_updated_at` | quotas | Auto-updates timestamp |
| `classify_bug_priority` | feedbacks | Auto-classifies bug priority on insert |
| `increment_quota` | feedbacks | Increments quota on new feedback |

### Indexes

Key indexes for performance:
- `idx_projects_api_key` - API key lookups
- `idx_projects_user_id` - User's projects
- `idx_feedbacks_project_id` - Feedbacks by project
- `idx_feedbacks_project_created` - Feedbacks by project, sorted by date
- `idx_feedbacks_created_at` - Time-based queries
- `idx_quotas_project_month` - Quota lookups

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Team members can access team projects based on role
- Widget can insert feedbacks (validated via API key)

## Setup Instructions

### Local Development

1. Start Supabase locally:
```bash
supabase start
```

2. Run migrations:
```bash
supabase db reset
```

3. Seed data:
```bash
supabase db seed
```

### Production/Staging

1. Link to remote project:
```bash
supabase link --project-ref <project-ref>
```

2. Push migrations:
```bash
supabase db push
```

## File Structure

```
supabase/
├── migrations/
│   └── 00000000000000_init.sql    # Initial schema
├── seed.sql                          # Development seed data
└── config.toml                       # Supabase configuration
```

## API Key Format

API keys follow the format: `tf_<60 hex characters>`
- Example: `tf_a1b2c3d4e5f6...` (64 chars total)
- Generated using `gen_random_bytes(30)` encoded as hex

## Data Types

### Feedback Content JSONB Structure

**NPS:**
```json
{
  "score": 9,
  "comment": "Great product!"
}
```

**Suggestion:**
```json
{
  "title": "Add dark mode",
  "description": "Would love to have dark mode support",
  "category": "Feature"
}
```

**Bug:**
```json
{
  "description": "App crashes when clicking save",
  "contactEmail": "user@example.com",
  "includeTechnicalInfo": true
}
```

### Status History JSONB Structure
```json
[
  {
    "status": "new",
    "changed_by": "system",
    "changed_at": "2024-01-15T10:00:00Z"
  },
  {
    "status": "analyzing",
    "changed_by": "user-uuid",
    "changed_at": "2024-01-16T14:30:00Z",
    "note": "Looking into this"
  }
]
```

## Quota System

- Free tier: 100 feedbacks/month
- Pro tier: Unlimited
- Grace period: 24 hours when limit exceeded
- Status values: ok, warning (>80%), grace_period, exceeded

## Testing

Run tests to verify schema integrity:

```bash
# Test database connection
supabase db test

# Verify migrations apply cleanly
supabase db reset
```
