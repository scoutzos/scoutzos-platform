# ScoutzOS

ScoutzOS is an AI-powered operating system for U.S. real estate investors and landlords managing 1-250+ rental units. It combines software and services into a unified platform handling the entire investment lifecycle: deal discovery, underwriting, acquisition, property management, tenant relations, accounting, tax optimization, and portfolio growth.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Payments:** Stripe
- **AI:** OpenAI GPT-4

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app`: Application routes and pages.
- `src/components`: Reusable UI components.
- `src/lib`: Utility functions and libraries.
- `src/types`: TypeScript type definitions.
- `scoutzos_docs`: Project documentation and architecture.

## Documentation

For more details on the architecture and database schema, please refer to the files in the `scoutzos_docs` directory:
- `SCOUTZOS_MASTER_PROJECT_STATE.md`
- `ScoutzOS_Database_Schema_v2.sql`
- `api_endpoints_v1.md`
