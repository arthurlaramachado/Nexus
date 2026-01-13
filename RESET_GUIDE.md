# Database Reset & Rebuild Guide

This guide explains how to reset and rebuild the database schema.

## 1. Apply the New Schema

1.  Go to the **Supabase Dashboard** -> **SQL Editor**.
2.  Open the file `supabase/migrations/000_reset_db.sql` from your project.
3.  Copy the entire content and run it to drop all existing tables.
4.  Open the file `supabase/migrations/001_create_db.sql` from your project.
5.  Copy the entire content and run it to create all tables, functions, and policies.

**Note:** This will drop all existing tables and recreate them fresh.

## 2. Verify the Setup

1.  **Check Tables:** Ensure `roles`, `collaborators`, `clients`, `contracts`, etc., exist in the Table Editor.
2.  **Check Triggers:** Verify `on_auth_user_created` exists on the `auth.users` table.

## 3. Test Signup

1.  Go to your application (localhost).
2.  Sign up a new user.
3.  Check the database:
    *   **auth.users**: User should exist.
    *   **roles**: Should have an 'Admin' role (global, no organization).
    *   **collaborators**: Should have 1 record linking the User and 'Admin' Role.

## 4. Key Changes

*   **No Organizations**: The system no longer uses organizations. All data is global, filtered by role permissions.
*   **Simplified Roles**: `roles` is now a global table. `collaborators` references `roles(id)`.
*   **Trigger Safety**: The signup trigger now uses `SECURITY DEFINER` correctly and creates Admin role and collaborator for new users.
*   **Permission-Based Security**: Row Level Security (RLS) uses role-based permissions to control access to data.


