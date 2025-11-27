# ScoutzOS Query Patterns Library v1
## Reusable Database Operations

**Last Updated:** November 27, 2025  
**Database:** Supabase (PostgreSQL)  
**Client:** @supabase/supabase-js

---

## Connection Setup

```typescript
// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side with service role (bypasses RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

---

## Common Patterns

### Get User's Tenant ID

```typescript
async function getUserTenantId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data?.tenant_id;
}
```

### List with Pagination

```typescript
interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function listWithPagination<T>(
  table: string,
  params: PaginationParams = {}
): Promise<{ data: T[]; count: number }> {
  const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from(table)
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to);

  if (error) throw error;
  return { data: data as T[], count: count || 0 };
}
```

### Upsert with Deduplication

```typescript
async function upsertDeal(deal: DealInput): Promise<Deal> {
  // Normalize address for deduplication
  const normalizedAddress = normalizeAddress(deal.address_line1);
  
  const { data, error } = await supabase
    .from('deals')
    .upsert(
      {
        ...deal,
        address_normalized: normalizedAddress,
      },
      {
        onConflict: 'tenant_id,address_normalized',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

## Properties Module

### List Properties with Units Count

```typescript
async function listPropertiesWithUnits(tenantId: string) {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      units:units(count)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

### Get Property with All Relations

```typescript
async function getPropertyFull(propertyId: string) {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      units (*),
      property_intelligence (*),
      property_loans (*),
      documents (*)
    `)
    .eq('id', propertyId)
    .single();

  if (error) throw error;
  return data;
}
```

### Property Financial Summary

```typescript
async function getPropertyFinancials(propertyId: string, period: { start: Date; end: Date }) {
  const { data, error } = await supabase
    .from('transactions')
    .select('type, category, amount')
    .eq('property_id', propertyId)
    .gte('transaction_date', period.start.toISOString())
    .lte('transaction_date', period.end.toISOString());

  if (error) throw error;

  const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  return {
    income,
    expenses,
    net: income - expenses,
    byCategory: groupByCategory(data),
  };
}
```

---

## Tenants & Leases Module

### Get Active Lease for Unit

```typescript
async function getActiveLease(unitId: string) {
  const { data, error } = await supabase
    .from('leases')
    .select(`
      *,
      tenant_profile:tenant_profiles(*)
    `)
    .eq('unit_id', unitId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}
```

### Leases Expiring Soon

```typescript
async function getLeasesExpiringSoon(tenantId: string, daysAhead: number = 60) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('leases')
    .select(`
      *,
      property:properties(address_line1, city, state),
      unit:units(unit_number),
      tenant:tenant_profiles(first_name, last_name, email)
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .lte('end_date', futureDate.toISOString())
    .order('end_date', { ascending: true });

  if (error) throw error;
  return data;
}
```

### Rent Roll

```typescript
async function getRentRoll(tenantId: string) {
  const { data, error } = await supabase
    .from('leases')
    .select(`
      id,
      rent_amount,
      start_date,
      end_date,
      status,
      property:properties(id, address_line1, city),
      unit:units(id, unit_number),
      tenant:tenant_profiles(id, first_name, last_name)
    `)
    .eq('tenant_id', tenantId)
    .in('status', ['active', 'pending_signature'])
    .order('property_id');

  if (error) throw error;
  return data;
}
```

---

## Financial Module

### Create Journal Entry (Double-Entry)

```typescript
interface JournalLine {
  account_id: string;
  debit_amount?: number;
  credit_amount?: number;
  property_id?: string;
  unit_id?: string;
  memo?: string;
}

async function createJournalEntry(
  tenantId: string,
  description: string,
  lines: JournalLine[],
  referenceType?: string,
  referenceId?: string
) {
  // Validate debits = credits
  const totalDebits = lines.reduce((sum, l) => sum + (l.debit_amount || 0), 0);
  const totalCredits = lines.reduce((sum, l) => sum + (l.credit_amount || 0), 0);
  
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new Error('Journal entry must balance: debits must equal credits');
  }

  // Create header
  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      tenant_id: tenantId,
      entry_date: new Date().toISOString().split('T')[0],
      description,
      reference_type: referenceType,
      reference_id: referenceId,
      status: 'posted',
      posted_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (entryError) throw entryError;

  // Create lines
  const lineInserts = lines.map(line => ({
    journal_entry_id: entry.id,
    ...line,
  }));

  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert(lineInserts);

  if (linesError) throw linesError;

  return entry;
}
```

### Record Rent Payment

```typescript
async function recordRentPayment(
  tenantId: string,
  leaseId: string,
  amount: number,
  paymentMethod: string
) {
  // Get lease details
  const { data: lease } = await supabase
    .from('leases')
    .select('property_id, unit_id, tenant_profile_id')
    .eq('id', leaseId)
    .single();

  // Create transaction
  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      tenant_id: tenantId,
      property_id: lease.property_id,
      unit_id: lease.unit_id,
      lease_id: leaseId,
      tenant_profile_id: lease.tenant_profile_id,
      type: 'income',
      category: 'rent',
      amount,
      transaction_date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethod,
    })
    .select()
    .single();

  if (error) throw error;

  // Create journal entry
  await createJournalEntry(
    tenantId,
    `Rent payment - Lease ${leaseId}`,
    [
      { account_id: ACCOUNTS.OPERATING_CASH, debit_amount: amount, property_id: lease.property_id },
      { account_id: ACCOUNTS.ACCOUNTS_RECEIVABLE, credit_amount: amount, property_id: lease.property_id },
    ],
    'payment',
    transaction.id
  );

  return transaction;
}
```

### Aged Receivables

```typescript
async function getAgedReceivables(tenantId: string) {
  const today = new Date();
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      property:properties(address_line1),
      tenant:tenant_profiles(first_name, last_name)
    `)
    .eq('tenant_id', tenantId)
    .eq('category', 'rent')
    .eq('reconciled', false)
    .lt('amount', 0); // Outstanding charges are negative

  if (error) throw error;

  // Bucket by age
  const buckets = {
    current: [] as any[],    // 0-30 days
    days31_60: [] as any[],
    days61_90: [] as any[],
    over90: [] as any[],
  };

  data.forEach(item => {
    const daysOld = Math.floor((today.getTime() - new Date(item.transaction_date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysOld <= 30) buckets.current.push(item);
    else if (daysOld <= 60) buckets.days31_60.push(item);
    else if (daysOld <= 90) buckets.days61_90.push(item);
    else buckets.over90.push(item);
  });

  return buckets;
}
```

---

## Deals Module

### Deal with Metrics and Matches

```typescript
async function getDealFull(dealId: string) {
  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      metrics:deal_metrics(*),
      analyses:deal_analyses(*),
      matches:deal_investor_matches(
        *,
        buy_box:buy_boxes(
          *,
          investor:investors(name)
        )
      )
    `)
    .eq('id', dealId)
    .single();

  if (error) throw error;
  return data;
}
```

### Match Deals to Buy Boxes

```typescript
async function matchDealsToBoxes(tenantId: string) {
  // Get all active buy boxes
  const { data: buyBoxes } = await supabase
    .from('buy_boxes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  // Get all unmatched deals
  const { data: deals } = await supabase
    .from('deals')
    .select('*, metrics:deal_metrics(*)')
    .eq('tenant_id', tenantId)
    .in('status', ['new', 'analyzing']);

  const matches = [];

  for (const deal of deals) {
    for (const box of buyBoxes) {
      const score = calculateMatchScore(deal, box);
      if (score > 0) {
        matches.push({
          deal_id: deal.id,
          buy_box_id: box.id,
          match_score: score,
          match_reasons: getMatchReasons(deal, box),
        });
      }
    }
  }

  // Upsert matches
  if (matches.length > 0) {
    await supabase
      .from('deal_investor_matches')
      .upsert(matches, { onConflict: 'deal_id,buy_box_id' });
  }

  return matches;
}
```

---

## Maintenance Module

### Work Orders by Status

```typescript
async function getWorkOrdersByStatus(tenantId: string) {
  const { data, error } = await supabase
    .from('work_orders')
    .select(`
      *,
      property:properties(address_line1),
      unit:units(unit_number),
      vendor:vendors(company_name)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return {
    new: data.filter(wo => wo.status === 'new'),
    assigned: data.filter(wo => wo.status === 'assigned'),
    in_progress: data.filter(wo => wo.status === 'in_progress'),
    pending_approval: data.filter(wo => wo.status === 'pending_approval'),
    completed: data.filter(wo => wo.status === 'completed'),
  };
}
```

---

## CRM Module

### Leads with Time in Stage

```typescript
async function getLeadsWithMetrics(tenantId: string) {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      property:properties(address_line1),
      conversations:conversations(count)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Calculate time in stage
  return data.map(lead => ({
    ...lead,
    days_in_stage: Math.floor(
      (Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}
```

---

## RLS Helpers

### Check Tenant Access

```typescript
// This is handled by RLS, but useful for debugging
async function checkTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', userId)
    .eq('tenant_id', tenantId)
    .single();

  return !!data;
}
```

---

## Notes

- All queries respect RLS automatically when using anon key
- Use service role key only for admin operations
- Always handle errors appropriately
- Consider adding request timeout for long queries
- Log slow queries for optimization
