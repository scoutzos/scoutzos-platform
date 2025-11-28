# SCOUTZOS SESSION SYSTEM v3.3

## Overview

This document provides instructions and context for AI assistants working on the ScoutzOS platform codebase.

---

## PARKING LOT

Items identified but deferred for future sessions:

| Item | Description | Priority | Notes |
|------|-------------|----------|-------|
| RLS Policies Review | Review and optimize Row Level Security policies | Medium | Check for performance bottlenecks |
| Test Coverage | Add unit/integration tests for critical paths | Medium | Focus on API routes first |
| Error Boundaries | Add React error boundaries to key components | Low | Improve UX for runtime errors |
| Analytics Dashboard | User engagement metrics visualization | Low | Depends on analytics events |
| Mobile Responsiveness | Audit and fix mobile layout issues | Medium | Priority pages: deals, dashboard |
| Notification System | Email/SMS notifications for deal updates | Low | Requires external service integration |

---

## MULTI-TOOL FRICTION HANDLING

**Claude should automatically do these things:**

When Claude detects the user has been working with another AI tool (Claude Code, Antigravity, etc.):
1. Run `git status` to check for uncommitted changes
2. Run `rm -rf .next` to clear stale cache
3. Restart the dev server if needed
4. Verify the app works before proceeding

When Claude makes changes via bash/file tools:
1. Always verify changes were saved with `git status`
2. Clear .next cache after modifying code
3. Test that the server compiles before moving on

**Common fixes Claude should apply automatically:**
- "Environment variables not found" → `rm -rf .next && npm run dev`
- Changes not appearing → Check if files were actually modified
- 404 errors → Restart dev server
- Middleware errors → Clear cache and restart

This reduces friction for the user and prevents repeated manual troubleshooting.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Auth**: Supabase Auth
- **PDF Generation**: @react-pdf/renderer

---

## Key Directories

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── deals/             # Deal management pages
│   ├── buy-boxes/         # Buy box management
│   └── ...
├── components/            # React components
│   ├── deals/            # Deal-specific components
│   ├── layout/           # Layout components (Navbar, etc.)
│   └── ui/               # Reusable UI components
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase client setup
│   └── services/         # Business logic services
└── types/                 # TypeScript type definitions
```

---

## Database Schema

Key tables:
- `tenants` - Multi-tenant organization data
- `users` - User accounts (linked to tenants)
- `deals` - Property deals/listings
- `deal_metrics` - Calculated metrics for deals
- `buy_boxes` - Investment criteria configurations
- `notifications` - User notifications

---

## Common Commands

```bash
# Start dev server
npm run dev

# Clear cache and restart
rm -rf .next && npm run dev

# Git workflow
git status
git add .
git commit -m "message"
git push origin main
```

---

## Changelog

### v3.3 (2025-11-28)
- Added PARKING LOT section for deferred items
- Added MULTI-TOOL FRICTION HANDLING section
- Initial document creation

### v3.2
- Zillow API integration (zillow56.p.rapidapi.com)
- Enhanced property field mapping (beds, baths, sqft, year_built, photos)

### v3.1
- Deal import functionality (CSV + Zillow search)
- Tenant-aware data operations

### v3.0
- Initial ScoutzOS platform setup
- Auth, Deals, Buy Boxes with Supabase
