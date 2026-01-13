#!/usr/bin/env node
/**
 * Post-build script for Vercel
 * This script runs after the build to ensure the admin user exists
 * 
 * Usage: node scripts/post-build.js
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - ADMIN_PASSWORD (or ADMIN_ENV for backwards compatibility)
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_ENV

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!adminPassword) {
  console.warn('⚠️  ADMIN_PASSWORD not set. Using default password "admin".')
  console.warn('⚠️  Set ADMIN_PASSWORD in Vercel environment variables for production!')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedAdmin() {
  const adminEmail = 'admin@admin.com'
  const password = adminPassword || 'admin'

  console.log(`🔧 Seeding admin user: ${adminEmail}`)

  try {
    // 1. Check if collaborator exists
    const { data: collaborator, error: collabError } = await supabase
      .from('collaborators')
      .select('id, user_id, email')
      .eq('email', adminEmail)
      .maybeSingle()

    if (collabError) {
      console.error('❌ Error checking collaborator:', collabError.message)
      return
    }

    if (!collaborator) {
      console.warn('⚠️  Collaborator record not found.')
      console.warn('⚠️  Make sure migration 008_seed_admin.sql has been run.')
      return
    }

    // 2. Check if auth user exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      return
    }

    const existingUser = users.users.find(u => u.email === adminEmail)

    if (existingUser) {
      console.log('✅ Admin user already exists. ID:', existingUser.id)
      
      // Link collaborator if needed
      if (!collaborator.user_id || collaborator.user_id !== existingUser.id) {
        console.log('🔗 Linking collaborator to auth user...')
        const { error: updateError } = await supabase
          .from('collaborators')
          .update({ user_id: existingUser.id })
          .eq('id', collaborator.id)

        if (updateError) {
          console.error('❌ Error linking:', updateError.message)
        } else {
          console.log('✅ Collaborator linked successfully.')
        }
      }
      
      // Update password if provided
      if (adminPassword) {
        console.log('🔐 Updating admin password...')
        const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: password
        })
        
        if (updatePasswordError) {
          console.error('❌ Error updating password:', updatePasswordError.message)
        } else {
          console.log('✅ Password updated successfully.')
        }
      }
    } else {
      // 3. Create new auth user
      console.log('👤 Creating new admin auth user...')
      const { data, error } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: 'System Admin' }
      })

      if (error) {
        console.error('❌ Error creating admin user:', error.message)
        return
      }

      if (data.user) {
        console.log('✅ Admin user created. ID:', data.user.id)
        
        // 4. Link collaborator
        const { error: updateError } = await supabase
          .from('collaborators')
          .update({ user_id: data.user.id })
          .eq('id', collaborator.id)

        if (updateError) {
          console.error('❌ Error linking collaborator:', updateError.message)
        } else {
          console.log('✅ Collaborator linked successfully.')
        }
      }
    }
    
    console.log('✅ Admin setup complete!')
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

seedAdmin()
