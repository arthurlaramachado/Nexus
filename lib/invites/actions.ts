'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// Generate a random token
function generateToken() {
  return crypto.randomUUID().replace(/-/g, '').toUpperCase()
}

// 1. Create Invite Action
export async function createInvite(email: string, roleId: string) {
  const supabase = await createClient()
  
  // Verify permissions
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  // Create token and expiration (1 hour)
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

  // Check if collaborator already exists
  const { data: existing } = await supabase
    .from('collaborators')
    .select('id, status')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'active') {
      throw new Error('User is already an active collaborator')
    }
    
    // Update existing invited/inactive collaborator
    const { error } = await supabase
      .from('collaborators')
      .update({
        role_id: roleId,
        status: 'invited',
        invite_token: token,
        expires_at: expiresAt,
        full_name: email.split('@')[0] // Temporary name
      })
      .eq('id', existing.id)

    if (error) throw error
  } else {
    // Create new collaborator
    const { error } = await supabase
      .from('collaborators')
      .insert({
        email,
        role_id: roleId,
        status: 'invited',
        invite_token: token,
        expires_at: expiresAt,
        full_name: email.split('@')[0] // Temporary name
      })

    if (error) throw error
  }

  revalidatePath('/dashboard/collaborators')
  return { success: true }
}

// 2. Validate Token Action (for Join Page)
export async function validateInviteToken(token: string) {
  const supabase = await createClient()

  // Use the public RLS policy we created to find the invite
  const { data: collaborator, error } = await supabase
    .from('collaborators')
    .select('*, roles(name)')
    .eq('invite_token', token)
    .eq('status', 'invited')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !collaborator) {
    return { valid: false, error: 'Invalid or expired invite link' }
  }

  return { valid: true, collaborator }
}

// 3. Complete Signup Action
export async function completeSignup(token: string, fullName: string, password: string) {
  // 1. Validate token again
  const validation = await validateInviteToken(token)
  if (!validation.valid || !validation.collaborator) {
    throw new Error('Invalid invite')
  }

  const { email, id: collaboratorId } = validation.collaborator
  const adminClient = createAdminClient()

  // 2. Create Auth User (auto-confirmed)
  // We check if user exists first to handle cases where auth user exists but collaborator is invited (re-invite)
  let userId: string

  // Try to create user first; if already exists, update instead
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  })

  if (createError && createError.message?.includes('already been registered')) {
    // User exists — find by email and update
    const { data: existingUsers } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      filter: email
    } as any)
    const existingUser = existingUsers?.users?.[0]
    if (!existingUser) throw new Error('Failed to find existing user')
    userId = existingUser.id
    await adminClient.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { full_name: fullName }
    })
  } else if (createError) {
    throw createError
  } else {
    if (!newUser.user) throw new Error('Failed to create user')
    userId = newUser.user.id
  }

  // Update collaborator record via admin client (user isn't logged in yet)
  const { error: updateError } = await adminClient
    .from('collaborators')
    .update({
      user_id: userId,
      full_name: fullName,
      status: 'active',
      invite_token: null,
      expires_at: null
    })
    .eq('id', collaboratorId)

  if (updateError) throw updateError

  return { success: true, email }
}
