# SCOUTZOS_MASTER_PROJECT_STATE.md
## Single Source of Truth â€“ Architecture, Schema, Decisions & Active Work
**Last Updated:** November 27, 2025  
**Current Phase:** Phase 0 (Business Setup)  
**Project Start Date:** December 1, 2025  
**Target Launch Date:** April 14, 2026

---

# SECTION A â€” CORE SYSTEM ARCHITECTURE (DO NOT EDIT WITHOUT EXPLICIT APPROVAL)

## 1. System Overview

ScoutzOS is an AI-powered operating system for U.S. real estate investors and landlords managing 1-250+ rental units. It combines software and services into a unified platform handling the entire investment lifecycle: deal discovery, underwriting, acquisition, property management, tenant relations, accounting, tax optimization, and portfolio growth.

**Vision:** "Give landlords the power to self-manage OR have HomeScoutz manage for themâ€”all on one platform."

**Two Operating Modes:**
- **Self-Manage Mode:** Landlord uses software to manage everything themselves
- **HomeScoutz Managed Mode:** HomeScoutz team handles operations (8-12% of rent)

## 2. High-Level Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                         FRONTEND                                 â”‚
â”‚  Next.js 14+ (App Router) + TypeScript + Tailwind CSS           â”‚
â”‚  Deployed on Vercel                                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                      API LAYER                                   â”‚
â”‚  Next.js API Routes + Supabase Edge Functions                   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                      DATABASE                                    â”‚
â”‚  Supabase (PostgreSQL) + Row Level Security                     â”‚
â”‚  45 Tables across 12 modules                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                      AI LAYER                                    â”‚
â”‚  OpenAI GPT-4 for: Deal Analysis, Tenant Chat, Portfolio Advice â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                   INTEGRATIONS                                   â”‚
â”‚  Stripe | Plaid | Twilio | DocuSign | RapidAPI | TransUnion    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## 3. Module Breakdown

| Module | Purpose | Phase |
|--------|---------|-------|
| **Deal Intelligence Core** | Buy boxes, deal scraping, underwriting, AI advisor | Phase 1 |
| **Property Management System** | Properties, units, tenants, leases, rent collection | Phase 2 |
| **CRM & Pipelines** | Leads, unified inbox, showings, conversion | Phase 2 |
| **AI Leasing Assistant** | 24/7 lead response, screening, scheduling | Phase 2 |
| **AI Tenant Assistant** | Tenant support, maintenance intake, renewals | Phase 2 |
| **Maintenance Engine** | Work orders, vendors, AI triage, completion | Phase 2 |
| **Accounting Engine** | Double-entry ledger, reconciliation, reports | Phase 2 |
| **Vendor Marketplace** | 21 categories, bidding, payments, ratings | Phase 3 |
| **Lender Marketplace** | Your brokerage first, DSCR calculator, referrals | Phase 3 |
| **Partner Marketplace** | Title, insurance, 1031, cost seg referrals | Phase 3 |
| **Deal Flow & Subscriptions** | Multi-source aggregation, swipe matching, tiers | Phase 3 |
| **Tax Strategy** | REPS tracking, cost seg, 1031 planning (deferred) | Future |

## 4. Domain Rules (Business Logic That Must Not Drift)

1. **Multi-tenancy:** Every record belongs to a `tenant_id` (the PM company/owner, not the renter)
2. **Your brokerage first:** Lender marketplace always prioritizes your mortgage brokerage
3. **PM free incentive:** Purchases through HomeScoutz get 1-3 years free PM
4. **Accounting:** Double-entry only. Debits must equal credits. No modifications, only voids.
5. **Security deposits:** Must be held in separate trust account (1010 vs 1000)
6. **Late fees:** Respect grace period from lease before charging
7. **Owner disbursements:** Require PM review before processing
8. **Vendor payments:** Platform takes 10-15% fee

## 5. Brand Structure

- **ScoutzOS:** The software platform (SaaS)
- **HomeScoutz:** The property management brand (services)
- HomeScoutz white-labels ScoutzOS. Platform built generalized first.

---

# SECTION B â€” DATABASE SCHEMA & LEDGER (LOCKED)

## 1. Database Schema Summary

**Total Tables:** 45  
**Schema File:** `ScoutzOS_Database_Schema_v2.sql` (1,025 lines)

### Core Tables by Module

**Foundation:**
- `tenants` - Multi-tenancy (PM companies/owners)
- `users` - Linked to Supabase auth, roles

**Properties:**
- `properties` - Physical properties
- `units` - Individual units within properties
- `property_intelligence` - 128+ data points (Property 360)
- `property_loans` - Mortgage details
- `refi_opportunities` - Detected refi options

**Tenants & Leases:**
- `tenant_profiles` - Renter information (not multi-tenancy tenants)
- `co_tenants` - Additional people on lease
- `leases` - Lease agreements

**Financial:**
- `transactions` - All financial transactions
- `accounts` - Chart of accounts
- `journal_entries` - Double-entry headers
- `journal_entry_lines` - Debit/credit lines
- `owner_contributions` - Owner funding
- `owner_disbursements` - Owner payments

**Maintenance:**
- `work_orders` - Maintenance requests
- `vendors` - Service providers
- `vendor_bids` - Job bids

**CRM:**
- `leads` - All lead types
- `conversations` - Unified inbox
- `showings` - Scheduled showings

**Deals:**
- `deals` - Property opportunities
- `deal_analyses` - Underwriting results
- `buy_boxes` - Investor criteria
- `deal_matches` - Match scores
- `investor_partnerships` - Deal partnerships

**Lending:**
- `loan_prequals` - Pre-qualification data

**Documents:**
- `documents` - All document storage

**Automation:**
- `automation_rules` - Workflow triggers
- `automation_logs` - Execution logs
- `ai_logs` - AI interaction logs

## 2. Critical Constraints

- All tables have `tenant_id` for multi-tenancy
- RLS enabled on all tables
- `updated_at` triggers on all mutable tables
- Journal entries: SUM(debits) = SUM(credits) enforced
- Posted entries cannot be modified (only voided)

## 3. Double-Entry Accounting Rules

**Account Types:**
| Type | Normal Balance | Increases With |
|------|----------------|----------------|
| Asset | Debit | Debit |
| Liability | Credit | Credit |
| Equity | Credit | Credit |
| Revenue | Credit | Credit |
| Expense | Debit | Debit |

**Account Numbering:**
- 1000-1999: Assets
- 2000-2999: Liabilities
- 3000-3999: Equity
- 4000-4999: Revenue
- 5000-5999: Operating Expenses
- 6000-6999: Other Expenses

**Key Accounts:**
- 1000: Operating Cash
- 1010: Security Deposit Trust
- 1100: Accounts Receivable
- 2100: Security Deposits Held
- 4000: Rental Income
- 4100: Late Fees
- 5100: Repairs & Maintenance

---

# SECTION C â€” NAMING CONVENTIONS (LOCKED)

## 1. Database Naming

- Tables: `snake_case` plural (`properties`, `tenant_profiles`)
- Columns: `snake_case` (`created_at`, `tenant_id`)
- Foreign keys: `{table_singular}_id` (`property_id`, `user_id`)
- Enums: lowercase with underscores (`self_manage`, `under_contract`)

## 2. API Endpoint Patterns

```
/api/{module}/{action}
/api/{module}/[id]/{action}

Examples:
/api/deals/recalculate
/api/matches/rebuild
/api/advisor/deal
/api/advisor/portfolio
```

## 3. Frontend Naming

- Components: `PascalCase` (`DealCard.tsx`, `PropertyList.tsx`)
- Pages: `page.tsx` in route folder
- Utilities: `camelCase` (`underwriting.ts`, `dealMatches.ts`)
- Hooks: `use{Name}` (`useDeals`, `useInvestor`)

## 4. File Structure

```
scoutzos/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ layout.tsx
â”‚   â”œâ”€â”€ page.tsx
â”‚   â”œâ”€â”€ (auth)/
â”‚   â”‚   â””â”€â”€ login/page.tsx
â”‚   â”œâ”€â”€ investors/
â”‚   â”‚   â”œâ”€â”€ page.tsx
â”‚   â”‚   â”œâ”€â”€ new/page.tsx
â”‚   â”‚   â””â”€â”€ [id]/page.tsx
â”‚   â”œâ”€â”€ deals/
â”‚   â”œâ”€â”€ buy-boxes/
â”‚   â”œâ”€â”€ properties/
â”‚   â””â”€â”€ api/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ layout/
â”‚   â”œâ”€â”€ forms/
â”‚   â”œâ”€â”€ tables/
â”‚   â””â”€â”€ cards/
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ supabaseClient.ts
â”‚   â”œâ”€â”€ auth.ts
â”‚   â”œâ”€â”€ underwriting.ts
â”‚   â”œâ”€â”€ matching.ts
â”‚   â””â”€â”€ advisorPrompt.ts
â””â”€â”€ types/
```

## 5. Git Commit Patterns

```
feat: Add deal underwriting calculations
fix: Correct RLS policy for properties
refactor: Extract DealCard component
docs: Update API documentation
chore: Update dependencies
```

---

# SECTION D â€” PROJECT DECISION LOG (APPEND ONLY)

## [DATE: 2025-11-27]

### Decisions Made Today

1. **Stack confirmed:** Next.js 14+ / TypeScript / Tailwind / Supabase / Vercel
2. **No Prisma initially:** Use Supabase client directly
3. **Accounting built-in:** Not QuickBooks integration, full double-entry in-house
4. **Dual-brand stealth mode:** Personal brand + ScoutzOS anonymous until merge Week 14
5. **PM incentive:** Free 1-3 years for purchases through HomeScoutz
6. **Pricing philosophy:** Low price + high volume, no free tier (14-day trial)
7. **Minimum pricing:** $3.50/unit to cover costs with 40% margin

### Important Findings

- External reviewer identified need for Phase 0.5 (Technical Blueprint)
- Tasks must be 1-4 hours max, production-grade, no additional research needed
- 60+ customer discovery conversations required before launch

### Architecture Documents Created

1. ScoutzOS_Master_Scope_Document.docx
2. ScoutzOS_Systems_Architecture.docx
3. ScoutzOS_Permission_Security_Model.docx
4. ScoutzOS_Accounting_Ledger_Spec.docx
5. ScoutzOS_Development_Notes.docx

### Master Playbook Status

- **Total Tasks:** 1,055
- Phase 0: 60 tasks
- Phase 0.5: 120 tasks
- Phase 1: 417 tasks
- Phase 2: 145 tasks
- Phase 3: 105 tasks
- Phase 4: 116 tasks
- Content & GTM: 92 tasks

### Blockers

None currently. Ready to begin Phase 0 on December 1, 2025.

### Tomorrow's Goals

1. Import playbook to Zoho Projects
2. Complete Phase 0 business setup tasks
3. Begin customer discovery outreach

### Knowledge to Carry Forward

- V0 product is "ScoutzOS Deal Intelligence Core" (investors, buy boxes, deals, underwriting, matching, AI advisor)
- No tenants/leases/maintenance in V0
- RapidAPI Zillow credentials ready
- Project directory: ~/Desktop/scoutzos

---

# SECTION E â€” PROJECT ROADMAP

## Timeline Overview

| Phase | Description | Duration | Dates |
|-------|-------------|----------|-------|
| Phase 0 | Business Setup | 1 week | Dec 1-7, 2025 |
| Phase 0.5 | Technical Blueprint | 1 week | Dec 8-14, 2025 |
| Phase 1 | MVP Deal Intelligence | 4 weeks | Dec 15 - Jan 11, 2026 |
| Phase 2 | PMS + CRM | 4 weeks | Jan 12 - Feb 8, 2026 |
| Phase 3 | Marketplaces | 5 weeks | Feb 9 - Mar 13, 2026 |
| Phase 4 | Launch | 4 weeks | Mar 16 - Apr 14, 2026 |
| Content | Parallel Track | 19 weeks | Dec 1 - Apr 12, 2026 |

## Key Milestones

| Date | Milestone |
|------|-----------|
| Dec 7, 2025 | Phase 0 complete - Business ready |
| Dec 14, 2025 | Phase 0.5 complete - Architecture locked |
| Jan 11, 2026 | Phase 1 complete - MVP shipped |
| Feb 8, 2026 | Phase 2 complete - Full PMS live |
| Mar 13, 2026 | Phase 3 complete - Marketplaces operational |
| Mar 12, 2026 | THE MERGE - Founder reveal |
| Apr 7, 2026 | Soft launch to waitlist |
| Apr 9, 2026 | Public launch |
| Apr 11, 2026 | Product Hunt launch |
| Apr 14, 2026 | Phase 4 complete - ScoutzOS LIVE |

---

# SECTION F â€” ACTIVE WORK SURFACE (EDIT HERE)

## 1. Features Currently Being Built

*Empty - Phase 0 not yet started*

## 2. Drafts of Screens / Components

*Empty - Phase 0 not yet started*

## 3. WIP API Endpoints

*Empty - Phase 0 not yet started*

## 4. AI Prompts (Draft / WIP)

*Empty - Phase 0 not yet started*

## 5. Queries / DB Work In Progress

*Empty - Phase 0 not yet started*

## 6. Notes for Tomorrow's Session

- Begin Phase 0: LLC formation, EIN, business banking
- Set up personal brand profiles (Twitter, LinkedIn, BiggerPockets)
- Create ScoutzOS waitlist landing page

---

# SECTION G â€” GLOBAL TODO ITEMS

1. Finalize pricing tiers (founder still deciding)
2. Select e-signature provider (DocuSign vs HelloSign)
3. Select tenant screening provider (TransUnion vs RentPrep)
4. Determine walk-in payment provider (PayNearMe vs similar)

---

# SECTION H â€” PARKING LOT (IDEAS TO REVISIT LATER)

- REPS hour tracking (750hr, 50%, reports)
- Solar potential analysis
- HOA reserve fund health
- STR/Vacation module
- Student Housing module
- Corporate Housing module
- Co-living module
- Mobile Home Parks
- Self Storage (âŒ Never)

---

# SECTION I â€” RISKS & MITIGATIONS

| Risk | Severity | Mitigation |
|------|----------|------------|
| Solo founder bandwidth | High | AI assistance, strict task sizing, weekly reviews |
| Scope creep | High | 633 features already scoped and decided |
| Technical debt | Medium | Phase 0.5 architecture lock, weekly audits |
| Customer discovery gaps | Medium | 60+ conversations before launch |
| Launch timing | Medium | Buffer built into timeline |

---

# SECTION J â€” LINKS TO KEY DOCUMENTS

| Document | Location |
|----------|----------|
| Master Scope Document | Project files |
| Database Schema v2 | `ScoutzOS_Database_Schema_v2.sql` |
| Accounting Ledger Spec | `ScoutzOS_Accounting_Ledger_Spec.docx` |
| Development Notes | `ScoutzOS_Development_Notes.docx` |
| Master Playbook | `ScoutzOS_FINAL_Master_Playbook.csv` |
| Content & GTM Plan | `ScoutzOS_Content_GTM_Only.csv` |

---

# SECTION K â€” CHANGE CONTROL

## Rules for Modifying Sections Aâ€“C

1. Cannot be changed without explicit decision
2. Changes require:
   - Justification
   - Impact analysis
   - New version date
3. All changes logged in Section D (Decision Log)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-27 | Initial creation |

---

**THIS FILE IS THE PROJECT BRAIN â€” UPDATE NIGHTLY**

Upload this file into Claude at the start of every work session.
