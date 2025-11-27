# ScoutzOS API Endpoints Specification v1
## Complete List of All Backend Routes

**Last Updated:** November 27, 2025  
**API Base:** `/api`

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new user account |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | End session |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Complete password reset |
| GET | `/api/auth/session` | Get current session |
| GET | `/api/auth/callback` | OAuth callback |

---

## Phase 1: Deal Intelligence Core

### Investors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/investors` | List all investors |
| POST | `/api/investors` | Create investor |
| GET | `/api/investors/[id]` | Get investor detail |
| PUT | `/api/investors/[id]` | Update investor |
| DELETE | `/api/investors/[id]` | Delete investor |
| GET | `/api/investors/[id]/portfolio` | Get portfolio scan |
| GET | `/api/investors/[id]/matches` | Get matched deals |

### Buy Boxes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/buy-boxes` | List all buy boxes |
| POST | `/api/buy-boxes` | Create buy box |
| GET | `/api/buy-boxes/[id]` | Get buy box detail |
| PUT | `/api/buy-boxes/[id]` | Update buy box |
| DELETE | `/api/buy-boxes/[id]` | Delete buy box |
| GET | `/api/buy-boxes/[id]/deals` | Get matching deals |

### Deals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deals` | List all deals |
| POST | `/api/deals` | Create deal manually |
| GET | `/api/deals/[id]` | Get deal detail |
| PUT | `/api/deals/[id]` | Update deal |
| DELETE | `/api/deals/[id]` | Delete deal |
| POST | `/api/deals/import` | Import deals from CSV |
| POST | `/api/deals/scrape` | Scrape deal from URL |
| POST | `/api/deals/[id]/recalculate` | Recalculate metrics |
| GET | `/api/deals/[id]/matches` | Get investor matches |
| POST | `/api/deals/[id]/swipe` | Record swipe action |
| GET | `/api/deals/saved` | Get saved deals |

### Deal Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deals/[id]/analysis` | Get deal analysis |
| POST | `/api/deals/[id]/analysis` | Create analysis |
| PUT | `/api/deals/[id]/analysis` | Update analysis |
| GET | `/api/deals/[id]/comps` | Get rent/sale comps |

### Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/matches/rebuild` | Rebuild all matches |
| GET | `/api/matches/deal/[id]` | Get matches for deal |
| GET | `/api/matches/investor/[id]` | Get matches for investor |

### AI Advisor

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/advisor/deal` | AI analysis of single deal |
| POST | `/api/advisor/portfolio` | AI analysis of portfolio |
| POST | `/api/advisor/compare` | AI comparison of deals |

---

## Phase 2: PMS + CRM

### Properties

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties` | List all properties |
| POST | `/api/properties` | Create property |
| GET | `/api/properties/[id]` | Get property detail |
| PUT | `/api/properties/[id]` | Update property |
| DELETE | `/api/properties/[id]` | Delete property |
| GET | `/api/properties/[id]/units` | Get property units |
| GET | `/api/properties/[id]/financials` | Get property P&L |
| GET | `/api/properties/[id]/documents` | Get property docs |
| POST | `/api/properties/[id]/documents` | Upload document |

### Units

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/units` | List all units |
| POST | `/api/units` | Create unit |
| GET | `/api/units/[id]` | Get unit detail |
| PUT | `/api/units/[id]` | Update unit |
| DELETE | `/api/units/[id]` | Delete unit |
| PUT | `/api/units/[id]/status` | Update unit status |

### Tenant Profiles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tenants` | List all tenants |
| POST | `/api/tenants` | Create tenant |
| GET | `/api/tenants/[id]` | Get tenant detail |
| PUT | `/api/tenants/[id]` | Update tenant |
| DELETE | `/api/tenants/[id]` | Delete tenant |
| POST | `/api/tenants/[id]/screen` | Initiate screening |
| GET | `/api/tenants/[id]/screening` | Get screening results |
| POST | `/api/tenants/[id]/invite` | Invite to portal |

### Leases

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leases` | List all leases |
| POST | `/api/leases` | Create lease |
| GET | `/api/leases/[id]` | Get lease detail |
| PUT | `/api/leases/[id]` | Update lease |
| DELETE | `/api/leases/[id]` | Delete lease |
| POST | `/api/leases/[id]/sign` | Send for signature |
| POST | `/api/leases/[id]/renew` | Initiate renewal |
| POST | `/api/leases/[id]/terminate` | Terminate lease |
| GET | `/api/leases/[id]/document` | Generate lease PDF |
| POST | `/api/leases/[id]/compliance-check` | AI compliance check |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List all transactions |
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions/[id]` | Get transaction detail |
| PUT | `/api/transactions/[id]` | Update transaction |
| DELETE | `/api/transactions/[id]` | Void transaction |

### Rent Collection

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rent/charge` | Create rent charge |
| POST | `/api/rent/charge-all` | Charge all due rent |
| POST | `/api/rent/late-fees` | Apply late fees |
| POST | `/api/rent/payment` | Record payment |
| GET | `/api/rent/ledger` | Get rent ledger |
| GET | `/api/rent/receivables` | Get aged receivables |

### Disbursements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/disbursements` | List disbursements |
| POST | `/api/disbursements` | Create disbursement |
| PUT | `/api/disbursements/[id]/approve` | Approve disbursement |
| POST | `/api/disbursements/[id]/process` | Process payment |
| GET | `/api/disbursements/[id]/statement` | Generate statement |

### Maintenance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/work-orders` | List work orders |
| POST | `/api/work-orders` | Create work order |
| GET | `/api/work-orders/[id]` | Get work order detail |
| PUT | `/api/work-orders/[id]` | Update work order |
| PUT | `/api/work-orders/[id]/status` | Update status |
| POST | `/api/work-orders/[id]/assign` | Assign to vendor |
| POST | `/api/work-orders/[id]/complete` | Mark complete |
| POST | `/api/work-orders/[id]/triage` | AI triage |

### Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vendors` | List vendors |
| POST | `/api/vendors` | Create vendor |
| GET | `/api/vendors/[id]` | Get vendor detail |
| PUT | `/api/vendors/[id]` | Update vendor |
| DELETE | `/api/vendors/[id]` | Delete vendor |
| POST | `/api/vendors/[id]/rate` | Submit rating |

### CRM Leads

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | List leads |
| POST | `/api/leads` | Create lead |
| GET | `/api/leads/[id]` | Get lead detail |
| PUT | `/api/leads/[id]` | Update lead |
| DELETE | `/api/leads/[id]` | Delete lead |
| PUT | `/api/leads/[id]/stage` | Update pipeline stage |
| POST | `/api/leads/[id]/convert` | Convert to tenant |
| POST | `/api/leads/[id]/score` | AI lead scoring |

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | List conversations |
| POST | `/api/conversations` | Create conversation |
| GET | `/api/conversations/[id]` | Get conversation thread |
| POST | `/api/conversations/[id]/reply` | Send reply |
| POST | `/api/conversations/ai-respond` | AI generate response |

### Showings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/showings` | List showings |
| POST | `/api/showings` | Schedule showing |
| PUT | `/api/showings/[id]` | Update showing |
| PUT | `/api/showings/[id]/status` | Update status |

### Listings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings` | List listings |
| POST | `/api/listings` | Create listing |
| PUT | `/api/listings/[id]` | Update listing |
| POST | `/api/listings/[id]/syndicate` | Syndicate listing |
| POST | `/api/listings/[id]/description` | AI generate description |

### AI Assistants

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/leasing/respond` | AI leasing response |
| POST | `/api/ai/tenant/respond` | AI tenant response |
| POST | `/api/ai/maintenance/triage` | AI maintenance triage |

---

## Phase 3: Marketplaces

### Vendor Marketplace

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marketplace/vendors` | Browse vendors |
| POST | `/api/marketplace/vendors/join` | Vendor signup |
| GET | `/api/marketplace/vendors/[id]` | Vendor profile |
| POST | `/api/marketplace/vendors/[id]/bid` | Submit bid |
| POST | `/api/marketplace/vendors/job/[id]/accept` | Accept job |
| POST | `/api/marketplace/vendors/job/[id]/complete` | Complete job |

### Lender Marketplace

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marketplace/lenders` | List lenders |
| POST | `/api/marketplace/lenders/prequal` | Pre-qualification |
| GET | `/api/marketplace/lenders/match` | Get matched lenders |
| POST | `/api/marketplace/lenders/apply` | Submit application |
| GET | `/api/marketplace/lenders/dscr` | Calculate DSCR |

### Partner Marketplace

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marketplace/partners` | List partners |
| POST | `/api/marketplace/partners/[id]/contact` | Request contact |

### Deal Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions/deals` | Get current plan |
| POST | `/api/subscriptions/deals` | Subscribe to tier |
| PUT | `/api/subscriptions/deals` | Change tier |
| DELETE | `/api/subscriptions/deals` | Cancel subscription |

### Deal Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | Get alert preferences |
| PUT | `/api/alerts` | Update preferences |

---

## Webhooks (Incoming)

| Source | Endpoint | Description |
|--------|----------|-------------|
| Stripe | `/api/webhooks/stripe` | Payment events |
| DocuSign | `/api/webhooks/docusign` | Signature events |
| Twilio | `/api/webhooks/twilio` | SMS/Voice events |
| Plaid | `/api/webhooks/plaid` | Bank events |

---

## Notes

- All endpoints require authentication unless noted
- All endpoints respect RLS policies
- Pagination: `?page=1&limit=20`
- Sorting: `?sort=created_at&order=desc`
- Filtering: `?status=active&property_id=xxx`
- Error format: `{ error: string, code: string, details?: object }`
