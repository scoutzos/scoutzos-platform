# ScoutzOS Screen Inventory v1
## Complete List of All Application Screens

**Last Updated:** November 27, 2025  
**Total Screens:** 85+

---

## Phase 1: Deal Intelligence Core

### Authentication
| Screen | Route | Description |
|--------|-------|-------------|
| Login | `/login` | Email/password or magic link login |
| Signup | `/signup` | New user registration |
| Forgot Password | `/forgot-password` | Password reset flow |
| Callback | `/auth/callback` | OAuth callback handler |

### Dashboard
| Screen | Route | Description |
|--------|-------|-------------|
| Main Dashboard | `/` | Portfolio overview, key metrics, alerts |

### Investors
| Screen | Route | Description |
|--------|-------|-------------|
| Investors List | `/investors` | Table of all investors |
| New Investor | `/investors/new` | Create investor form |
| Investor Detail | `/investors/[id]` | Investor profile + portfolio scan |

### Buy Boxes
| Screen | Route | Description |
|--------|-------|-------------|
| Buy Boxes List | `/buy-boxes` | All buy boxes |
| New Buy Box | `/buy-boxes/new` | Create buy box form |
| Buy Box Detail | `/buy-boxes/[id]` | Buy box criteria + matched deals |

### Deals
| Screen | Route | Description |
|--------|-------|-------------|
| Deals List | `/deals` | All deals with filters |
| New Deal | `/deals/new` | Manual deal entry |
| Deal Import | `/deals/import` | CSV/URL import |
| Deal Detail | `/deals/[id]` | Deal info + metrics + matches + AI advisor |
| Deal Analysis | `/deals/[id]/analyze` | Full underwriting workspace |
| Saved Deals | `/deals/saved` | Swiped-right deals |

### Settings
| Screen | Route | Description |
|--------|-------|-------------|
| Account Settings | `/settings` | User profile, preferences |
| Team Settings | `/settings/team` | Team members, roles |
| Billing | `/settings/billing` | Subscription, payment |

---

## Phase 2: PMS + CRM

### Properties
| Screen | Route | Description |
|--------|-------|-------------|
| Properties List | `/properties` | All properties |
| New Property | `/properties/new` | Add property form |
| Property Detail | `/properties/[id]` | Property overview + units + financials |
| Property Documents | `/properties/[id]/documents` | Property docs |
| Property Financials | `/properties/[id]/financials` | P&L, statements |

### Units
| Screen | Route | Description |
|--------|-------|-------------|
| Units List | `/properties/[id]/units` | Units within property |
| Unit Detail | `/units/[id]` | Unit info + tenant + lease |

### Tenants
| Screen | Route | Description |
|--------|-------|-------------|
| Tenants List | `/tenants` | All tenants |
| New Tenant | `/tenants/new` | Add tenant wizard |
| Tenant Detail | `/tenants/[id]` | Tenant profile + history |
| Tenant Screening | `/tenants/[id]/screening` | Screening results |

### Leases
| Screen | Route | Description |
|--------|-------|-------------|
| Leases List | `/leases` | All leases |
| New Lease | `/leases/new` | Create lease wizard |
| Lease Detail | `/leases/[id]` | Lease terms + documents |
| Lease Renewal | `/leases/[id]/renew` | Renewal workflow |

### Payments
| Screen | Route | Description |
|--------|-------|-------------|
| Transactions | `/payments` | All transactions |
| Rent Ledger | `/payments/ledger` | Rent roll + balances |
| Owner Disbursements | `/payments/disbursements` | Owner payouts |
| Bank Reconciliation | `/payments/reconciliation` | Reconciliation UI |

### Maintenance
| Screen | Route | Description |
|--------|-------|-------------|
| Work Orders List | `/maintenance` | All work orders |
| New Work Order | `/maintenance/new` | Create work order |
| Work Order Detail | `/maintenance/[id]` | WO details + status |
| Vendors List | `/maintenance/vendors` | All vendors |
| Vendor Detail | `/maintenance/vendors/[id]` | Vendor profile |

### CRM
| Screen | Route | Description |
|--------|-------|-------------|
| Leads List | `/crm/leads` | All leads |
| Lead Detail | `/crm/leads/[id]` | Lead profile + timeline |
| Leads Kanban | `/crm/leads/kanban` | Pipeline board |
| Unified Inbox | `/crm/inbox` | All conversations |
| Showings | `/crm/showings` | Showing calendar |

### Listings
| Screen | Route | Description |
|--------|-------|-------------|
| Listings List | `/listings` | All active listings |
| New Listing | `/listings/new` | Create listing wizard |
| Syndication Dashboard | `/listings/syndication` | Platform performance |

### Tenant Portal
| Screen | Route | Description |
|--------|-------|-------------|
| Tenant Dashboard | `/portal` | Tenant home |
| Tenant Payments | `/portal/payments` | Pay rent |
| Tenant Maintenance | `/portal/maintenance` | Submit/track requests |
| Tenant Lease | `/portal/lease` | View lease |
| Tenant Documents | `/portal/documents` | Upload/download docs |
| Tenant Messages | `/portal/messages` | Chat with management |

---

## Phase 3: Marketplaces

### Vendor Marketplace
| Screen | Route | Description |
|--------|-------|-------------|
| Vendor Directory | `/marketplace/vendors` | Browse vendors |
| Vendor Profile | `/marketplace/vendors/[id]` | Vendor detail |
| Vendor Onboarding | `/marketplace/vendors/join` | Vendor signup |
| Vendor Dashboard | `/vendor/dashboard` | Vendor-facing home |

### Lender Marketplace
| Screen | Route | Description |
|--------|-------|-------------|
| Lender Directory | `/marketplace/lenders` | Browse lenders |
| Pre-Qualification | `/marketplace/lenders/prequal` | Pre-qual wizard |
| Loan Comparison | `/marketplace/lenders/compare` | Side-by-side |
| DSCR Calculator | `/marketplace/lenders/dscr` | DSCR tool |

### Partner Marketplace
| Screen | Route | Description |
|--------|-------|-------------|
| Partner Directory | `/marketplace/partners` | Browse partners |
| Partner Detail | `/marketplace/partners/[id]` | Partner profile |

### Deal Flow
| Screen | Route | Description |
|--------|-------|-------------|
| Deal Swipe | `/deals/swipe` | Tinder-style matching |
| Deal Alerts | `/deals/alerts` | Alert preferences |
| Subscriptions | `/deals/subscriptions` | Tier selection |

---

## Phase 4: Launch

### Marketing Site
| Screen | Route | Description |
|--------|-------|-------------|
| Homepage | `/` (marketing) | Landing page |
| Features | `/features` | Feature overview |
| Pricing | `/pricing` | Pricing tiers |
| About | `/about` | Company info |
| Blog | `/blog` | Content hub |
| Contact | `/contact` | Contact form |

---

## Reports (Available Throughout)

| Screen | Route | Description |
|--------|-------|-------------|
| Portfolio Dashboard | `/reports/portfolio` | Full portfolio metrics |
| Property P&L | `/reports/property/[id]` | Per-property financials |
| Rent Roll | `/reports/rent-roll` | All units + rent status |
| Aged Receivables | `/reports/receivables` | Outstanding balances |
| Owner Statement | `/reports/owner-statement` | Monthly owner report |
| Schedule E Export | `/reports/schedule-e` | Tax export |
| 1099 Report | `/reports/1099` | Vendor payments |

---

## Notes

- All screens require authentication except marketing site
- Tenant portal is separate auth context
- Vendor dashboard is separate auth context
- Mobile-responsive required for all screens
- Dark mode optional (Phase 4)
