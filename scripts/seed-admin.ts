import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config() // Also load from .env

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_ENV || 'admin'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedAdmin() {
  const adminEmail = 'admin@admin.com'

  console.log(`Seeding admin user: ${adminEmail}`)

  // 1. Check if collaborator exists (created by migration)
  const { data: collaborator, error: collabError } = await supabase
    .from('collaborators')
    .select('id, user_id, email')
    .eq('email', adminEmail)
    .maybeSingle()

  if (collabError) {
    console.error('Error checking collaborator:', collabError)
    return
  }

  if (!collaborator) {
    console.error('Collaborator record not found. Please run migration 008_seed_admin.sql first.')
    return
  }

  // 2. Check if auth user already exists
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('Error listing users:', listError)
    return
  }

  const existingUser = users.users.find(u => u.email === adminEmail)

  if (existingUser) {
    console.log('Admin user already exists. ID:', existingUser.id)
    
    // If collaborator doesn't have user_id linked, link it now
    if (!collaborator.user_id || collaborator.user_id !== existingUser.id) {
      console.log('Linking collaborator to existing auth user...')
      const { error: updateError } = await supabase
        .from('collaborators')
        .update({ user_id: existingUser.id })
        .eq('id', collaborator.id)

      if (updateError) {
        console.error('Error linking collaborator to auth user:', updateError)
      } else {
        console.log('Collaborator record linked to auth user.')
      }
    } else {
      console.log('Collaborator already linked to auth user.')
    }
    
    // Update password if ADMIN_PASSWORD is set
    if (adminPassword && adminPassword !== 'admin') {
      console.log('Updating admin password...')
      const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: adminPassword
      })
      
      if (updatePasswordError) {
        console.error('Error updating password:', updatePasswordError)
      } else {
        console.log('Password updated successfully.')
      }
    }
  } else {
    // 3. Create new auth user
    console.log('Creating new admin auth user...')
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: 'System Admin' }
    })

    if (error) {
      console.error('Error creating admin user:', error)
      return
    }

    if (data.user) {
      console.log('Admin user created successfully. ID:', data.user.id)
      
      // 4. Link collaborator to the new auth user
      const { error: updateError } = await supabase
        .from('collaborators')
        .update({ user_id: data.user.id })
        .eq('id', collaborator.id)

      if (updateError) {
        console.error('Error linking collaborator to auth user:', updateError)
      } else {
        console.log('Collaborator record linked to auth user.')
      }
    }
  }
  
  console.log('✅ Admin user setup complete!')
  console.log(`   Email: ${adminEmail}`)
  console.log(`   Password: ${adminPassword === 'admin' ? 'admin (default - change in production!)' : '*** (from ADMIN_PASSWORD)'}`)
}

seedAdmin().catch(console.error)
