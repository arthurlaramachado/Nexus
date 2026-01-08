# Database Reset & Rebuild Guide

We have completely simplified the database schema to fix signup issues and provide a solid foundation for multi-tenancy.

## 1. Apply the New Schema

1.  Go to the **Supabase Dashboard** -> **SQL Editor**.
2.  Open the file `supabase/migrations/000_complete_rebuild.sql` from your project.
3.  Copy the entire content.
4.  Paste it into the Supabase SQL Editor.
5.  **Run** the script.

**Note:** This will drop all existing tables (`organizations`, `collaborators`, etc.) and recreate them fresh.

## 2. Verify the Setup

1.  **Check Tables:** Ensure `organizations`, `roles`, `collaborators`, `clients`, etc., exist in the Table Editor.
2.  **Check Triggers:** Verify `on_auth_user_created` exists on the `auth.users` table.

## 3. Test Signup

1.  Go to your application (localhost).
2.  Sign up a new user.
3.  Check the database:
    *   **auth.users**: User should exist.
    *   **organizations**: Should have 1 record named `"{email}'s Organization"`.
    *   **roles**: Should have an 'Admin' role linked to that organization.
    *   **collaborators**: Should have 1 record linking the User, Organization, and 'Admin' Role.

## 4. Key Changes

*   **Single Migration**: Everything is in `000_complete_rebuild.sql`.
*   **Simplified Roles**: `roles` is now a dedicated table. `collaborators` references `roles(id)`.
*   **Trigger Safety**: The signup trigger now uses `SECURITY DEFINER` correctly and constraints are deferred to prevent "User not found" errors.
*   **API-First Security**: Complex permission logic is moved to `lib/auth/helpers.ts` and API routes, keeping SQL policies simple (Organization Membership).

