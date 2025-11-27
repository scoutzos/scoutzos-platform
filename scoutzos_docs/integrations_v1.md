# ScoutzOS Integrations Specification v1
## Third-Party Service Integration Details

**Last Updated:** November 27, 2025

---

## Integration Overview

| Service | Purpose | Phase | Priority |
|---------|---------|-------|----------|
| Supabase Auth | Authentication | 1 | Critical |
| Stripe | Payments | 2 | Critical |
| Plaid | Bank connections | 2 | High |
| Twilio | SMS/Voice | 2 | High |
| SendGrid | Email | 2 | High |
| DocuSign/HelloSign | E-signatures | 2 | High |
| TransUnion/RentPrep | Tenant screening | 2 | High |
| RapidAPI Zillow | Property data | 1 | High |
| OpenAI | AI features | 1 | Critical |
| InvestorLift | Wholesale deals | 3 | Medium |

---

## Supabase Auth

### Configuration

```typescript
// Already configured via supabaseClient.ts
```

### Supported Auth Methods

1. Email/Password
2. Magic Link (passwordless)
3. OAuth (optional: Google, etc.)

### Session Management

```typescript
// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Handle sign in
  } else if (event === 'SIGNED_OUT') {
    // Handle sign out
  }
});
```

---

## Stripe

### Purpose

- Tenant rent payments (ACH, card)
- Subscription billing for SaaS
- Vendor payouts (Stripe Connect)
- Platform fees

### Setup

```bash
npm install stripe @stripe/stripe-js
```

### Environment Variables

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Key Integrations

#### Create Customer

```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function createStripeCustomer(email: string, name: string) {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      tenant_profile_id: '...',
    },
  });
}
```

#### Create Payment Intent (Rent Payment)

```typescript
async function createRentPayment(customerId: string, amount: number) {
  return await stripe.paymentIntents.create({
    amount: amount * 100, // cents
    currency: 'usd',
    customer: customerId,
    payment_method_types: ['card', 'us_bank_account'],
    metadata: {
      type: 'rent',
      lease_id: '...',
    },
  });
}
```

#### Set Up Autopay

```typescript
async function setupAutopay(customerId: string, paymentMethodId: string) {
  // Attach payment method
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  // Set as default
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}
```

#### Stripe Connect (Vendor Payouts)

```typescript
async function createVendorAccount(vendorEmail: string) {
  return await stripe.accounts.create({
    type: 'express',
    email: vendorEmail,
    capabilities: {
      transfers: { requested: true },
    },
  });
}

async function payVendor(vendorAccountId: string, amount: number) {
  return await stripe.transfers.create({
    amount: amount * 100,
    currency: 'usd',
    destination: vendorAccountId,
  });
}
```

### Webhook Events

Handle these webhook events:

- `payment_intent.succeeded` - Record payment
- `payment_intent.payment_failed` - Handle failure
- `invoice.paid` - Subscription payment
- `customer.subscription.updated` - Subscription change
- `transfer.created` - Vendor payout

---

## Plaid

### Purpose

- Bank account verification
- Transaction import for reconciliation
- Income verification (optional)

### Setup

```bash
npm install plaid
```

### Environment Variables

```
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox|development|production
```

### Key Integrations

#### Create Link Token

```typescript
import { PlaidApi, Configuration, PlaidEnvironments } from 'plaid';

const plaid = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV!],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
}));

async function createLinkToken(userId: string) {
  const response = await plaid.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'ScoutzOS',
    products: ['auth', 'transactions'],
    country_codes: ['US'],
    language: 'en',
  });
  return response.data.link_token;
}
```

#### Exchange Public Token

```typescript
async function exchangeToken(publicToken: string) {
  const response = await plaid.itemPublicTokenExchange({
    public_token: publicToken,
  });
  return response.data.access_token;
}
```

#### Get Transactions

```typescript
async function getTransactions(accessToken: string, startDate: string, endDate: string) {
  const response = await plaid.transactionsGet({
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
  });
  return response.data.transactions;
}
```

---

## Twilio

### Purpose

- SMS notifications
- Voice calls
- Call recording and transcription

### Setup

```bash
npm install twilio
```

### Environment Variables

```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

### Key Integrations

#### Send SMS

```typescript
import twilio from 'twilio';
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSMS(to: string, body: string) {
  return await client.messages.create({
    body,
    to,
    from: process.env.TWILIO_PHONE_NUMBER,
  });
}
```

#### Make Voice Call

```typescript
async function makeCall(to: string, twimlUrl: string) {
  return await client.calls.create({
    to,
    from: process.env.TWILIO_PHONE_NUMBER,
    url: twimlUrl,
    record: true,
  });
}
```

### Webhook Endpoints

- `/api/webhooks/twilio/sms` - Incoming SMS
- `/api/webhooks/twilio/voice` - Incoming calls
- `/api/webhooks/twilio/recording` - Recording complete

---

## SendGrid

### Purpose

- Transactional emails
- Marketing emails
- Email tracking (opens, clicks)

### Setup

```bash
npm install @sendgrid/mail
```

### Environment Variables

```
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=hello@scoutzos.com
```

### Key Integrations

```typescript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

async function sendEmail(to: string, subject: string, html: string) {
  return await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject,
    html,
  });
}

async function sendTemplateEmail(to: string, templateId: string, dynamicData: object) {
  return await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    templateId,
    dynamicTemplateData: dynamicData,
  });
}
```

---

## DocuSign / HelloSign

### Purpose

- Lease e-signatures
- Document signing workflows

### HelloSign Setup

```bash
npm install hellosign-sdk
```

### Environment Variables

```
HELLOSIGN_API_KEY=...
HELLOSIGN_CLIENT_ID=...
```

### Key Integrations

```typescript
import HelloSign from 'hellosign-sdk';
const hellosign = new HelloSign({ key: process.env.HELLOSIGN_API_KEY });

async function sendForSignature(
  templateId: string,
  signers: { email: string; name: string; role: string }[],
  customFields: object
) {
  return await hellosign.signatureRequest.sendWithTemplate({
    template_id: templateId,
    signers,
    custom_fields: customFields,
  });
}
```

---

## TransUnion SmartMove / RentPrep

### Purpose

- Tenant credit checks
- Background checks
- Eviction history

### Environment Variables

```
SMARTMOVE_API_KEY=...
# or
RENTPREP_API_KEY=...
```

### Key Integrations

```typescript
// Pseudo-code - actual API varies by provider
async function initiateScreening(tenant: {
  firstName: string;
  lastName: string;
  email: string;
  ssn: string;
  dob: string;
  address: string;
}) {
  // Send screening request
  // Provider emails tenant for consent
  // Webhook notifies when complete
}
```

---

## RapidAPI Zillow

### Purpose

- Property data
- Rent estimates
- Sale comps

### Environment Variables

```
RAPIDAPI_KEY=065d734bc6mshbae103ca604ee3ep11a7b9jsnd2ff3a62e8bd
RAPIDAPI_HOST=zillow-com1.p.rapidapi.com
```

### Key Integrations

```typescript
async function getPropertyDetails(address: string) {
  const response = await fetch(
    `https://zillow-com1.p.rapidapi.com/property?address=${encodeURIComponent(address)}`,
    {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST!,
      },
    }
  );
  return await response.json();
}

async function getRentEstimate(address: string) {
  const response = await fetch(
    `https://zillow-com1.p.rapidapi.com/rentEstimate?address=${encodeURIComponent(address)}`,
    {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST!,
      },
    }
  );
  return await response.json();
}
```

---

## OpenAI

### Purpose

- Deal analysis
- Tenant/leasing chat
- Maintenance triage
- Content generation

### Setup

```bash
npm install openai
```

### Environment Variables

```
OPENAI_API_KEY=...
```

### Key Integrations

```typescript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function chat(systemPrompt: string, userMessage: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
  });
  return response.choices[0].message.content;
}

async function chatWithJson(systemPrompt: string, userMessage: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
  });
  return JSON.parse(response.choices[0].message.content!);
}
```

---

## InvestorLift

### Purpose

- Wholesale deal aggregation

### Phase 3 Integration

```typescript
// API details TBD - document when implementing
```

---

## PayNearMe (WIPS)

### Purpose

- Walk-in rent payments at retail locations

### Phase 2 Integration

```typescript
// API details TBD - document when implementing
```

---

## Webhook Security

### Verify Webhook Signatures

Always verify webhook signatures to prevent spoofing:

```typescript
// Stripe
import { buffer } from 'micro';

export async function POST(req: Request) {
  const body = await buffer(req);
  const sig = req.headers.get('stripe-signature')!;
  
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  
  // Process event
}
```

---

## Rate Limiting

Be aware of rate limits:

| Service | Rate Limit |
|---------|------------|
| RapidAPI Zillow | 500/month (free) |
| OpenAI | Varies by tier |
| Twilio | 1 msg/sec default |
| SendGrid | Varies by plan |

Implement queuing for high-volume operations.
