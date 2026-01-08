# NexusCS - Customer Success Management

A modern Customer Success Management (CSM) platform built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Multi-tenancy:** Organization-based isolation. Users belong to organizations.
- **Client Management:** Track client details, status, and industry.
- **Contract Tracking:** Manage contracts, renewals, and values.
- **Team Collaboration:** Assign collaborators to contracts with specific roles.
- **Role-Based Access Control (RBAC):** Flexible role system defined per organization (e.g., Admin, Manager, CSM).
- **Audit Logging:** Immutable history of all changes for compliance.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod
- **Language:** TypeScript

## Setup

1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Environment Variables:**
   Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Database Setup:**
   Run the migration script in `supabase/migrations/000_complete_rebuild.sql` via the Supabase SQL Editor. This will create all necessary tables, triggers, and RLS policies.

   See `RESET_GUIDE.md` for detailed instructions on applying the schema.

5. **Run the development server:**
   ```bash
   npm run dev
   ```

## Architecture

- **Organizations:** The root entity. All data is scoped to an organization.
- **Collaborators:** Users are linked to organizations via the `collaborators` table.
- **Roles:** Defined within an organization to control permissions (e.g., 'Admin').
- **Security:** Row Level Security (RLS) ensures users can only access data belonging to their organization.

## License

ISC
