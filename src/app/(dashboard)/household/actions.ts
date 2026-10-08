'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'

export async function getHouseholdData() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return null

  const { data: household } = await supabase
    .from('households')
    .select('*')
    .eq('id', member.household_id)
    .single()

  if (!household) return null

  const { data: members } = await supabase
    .from('household_members')
    .select('user_id, role')
    .eq('household_id', member.household_id)

  if (!members || members.length === 0) return null

  const userIds = members.map((m) => m.user_id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, email')
    .in('id', userIds)

  const formattedMembers = (profiles || []).map((profile) => {
    const mInfo = members.find((m) => m.user_id === profile.id)
    return {
      id: profile.id,
      full_name: profile.full_name || null,
      avatar_url: profile.avatar_url || null,
      email: profile.email || null,
      role: mInfo?.role || 'member',
    }
  }).sort((a, b) => {
    if (a.role === 'admin' || a.role === 'owner') return -1
    if (b.role === 'admin' || b.role === 'owner') return 1
    return 0
  })

  return {
    household: {
      id: household.id,
      name: household.name,
      invite_code: household.invite_code || household.code || '',
    },
    members: formattedMembers,
    userRole: member.role || 'member',
    currentUserId: user.id,
    userEmail: user.email || '',
  }
}

export async function joinHouseholdAction(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesión no válida.' }

  // Rate Limiting: Máximo 5 intentos en los últimos 15 minutos
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString()
  const { count } = await supabase
    .from('join_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('attempt_time', fifteenMinsAgo)

  if (count && count >= 5) {
    return { success: false, error: 'Demasiados intentos fallidos. Espera 15 minutos.' }
  }

  const cleanCode = inviteCode.trim().toUpperCase()
  if (!cleanCode) return { success: false, error: 'Código no válido.' }

  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('id')
    .eq('invite_code', cleanCode)
    .maybeSingle()

  if (householdError || !household) {
    await supabase.from('join_attempts').insert([{ user_id: user.id }])
    return { success: false, error: 'Código de hogar inválido.' }
  }

  const { error: joinError } = await supabase
    .from('household_members')
    .upsert({ 
      user_id: user.id, 
      household_id: household.id, 
      role: 'member' 
    }, { onConflict: 'user_id' })

  if (joinError) return { success: false, error: joinError.message }

  await supabase.from('join_attempts').delete().eq('user_id', user.id)

  revalidatePath('/pantry')
  revalidatePath('/household')
  return { success: true }
}

export async function createHouseholdAction(name: string = 'Mi Despensa') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesión no válida.' }

  const inviteCode = randomBytes(4).toString('hex').toUpperCase()

  const { data: household, error } = await supabase
    .rpc('create_household_transaction', {
      p_name: name.trim(),
      p_invite_code: inviteCode
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/pantry')
  revalidatePath('/household')
  return { success: true, household }
}

export async function updateHouseholdNameAction(newName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single()

  if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
    return { success: false, error: 'No tienes permisos de administrador.' }
  }

  const trimmed = newName.trim()
  if (!trimmed) return { success: false, error: 'El nombre no puede estar vacío.' }

  const { error } = await supabase
    .from('households')
    .update({ name: trimmed })
    .eq('id', member.household_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/pantry')
  revalidatePath('/household')
  return { success: true }
}

export async function regenerateInviteCodeAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single()

  if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
    return { success: false, error: 'No tienes permisos de administrador.' }
  }

  const newCode = randomBytes(4).toString('hex').toUpperCase()

  const { error } = await supabase
    .from('households')
    .update({ invite_code: newCode })
    .eq('id', member.household_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/household')
  return { success: true, newCode }
}

export async function kickMemberAction(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }

  if (user.id === targetUserId) {
    return { success: false, error: 'No puedes expulsarte a ti mismo.' }
  }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single()

  if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
    return { success: false, error: 'No tienes permisos de administrador.' }
  }

  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('user_id', targetUserId)
    .eq('household_id', member.household_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/household')
  return { success: true }
}

export async function changeRoleAction(targetUserId: string, newRole: 'admin' | 'member') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single()

  if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
    return { success: false, error: 'No tienes permisos de administrador.' }
  }

  const { error } = await supabase
    .from('household_members')
    .update({ role: newRole })
    .eq('user_id', targetUserId)
    .eq('household_id', member.household_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/household')
  return { success: true }
}

export async function leaveHouseholdAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: currentMember, error: memberError } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single()

  if (memberError || !currentMember) {
    return { success: false, error: 'No tienes una despensa asignada.' }
  }

  const householdId = currentMember.household_id

  if (currentMember.role === 'admin' || currentMember.role === 'owner') {
    const { data: allMembers } = await supabase
      .from('household_members')
      .select('id, role')
      .eq('household_id', householdId)

    if (allMembers) {
      const totalMembers = allMembers.length
      const adminCount = allMembers.filter(m => m.role === 'admin' || m.role === 'owner').length

      if (adminCount === 1 && totalMembers > 1) {
        return { 
          success: false, 
          error: 'Eres el único administrador. Nombra a otro miembro como administrador antes de abandonar la despensa.' 
        }
      }

      if (totalMembers === 1) {
        const { error: deleteError } = await supabase.from('households').delete().eq('id', householdId)
        if (deleteError) return { success: false, error: deleteError.message }
        
        revalidatePath('/pantry')
        revalidatePath('/household')
        return { success: true }
      }
    }
  }

  const { error: leaveError } = await supabase
    .from('household_members')
    .delete()
    .eq('user_id', user.id)
    .eq('household_id', householdId)

  if (leaveError) return { success: false, error: leaveError.message }

  revalidatePath('/pantry')
  revalidatePath('/household')
  return { success: true }
}