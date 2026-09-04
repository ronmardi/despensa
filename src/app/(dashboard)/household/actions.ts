'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getHouseholdData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id, role, households(name, invite_code)')
    .eq('user_id', user.id)
    .single()

  if (!member) return null

  const { data: members } = await supabase
    .from('household_members')
    .select('role, user_id, profiles(full_name, email)')
    .eq('household_id', member.household_id)

  return {
    householdId: member.household_id,
    householdName: (member.households as any)?.name || 'Mi Despensa',
    inviteCode: (member.households as any)?.invite_code || '',
    userRole: member.role,
    members: members || []
  }
}

export async function joinHouseholdAction(code: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Usuario no autenticado' }

  const cleanCode = code.trim().toUpperCase()

  const { data: household, error: findError } = await supabase
    .from('households')
    .select('id')
    .eq('invite_code', cleanCode)
    .single()

  if (findError || !household) {
    return { success: false, error: 'Código de invitación inválido o no encontrado' }
  }

  await supabase
    .from('household_members')
    .delete()
    .eq('user_id', user.id)

  const { error: joinError } = await supabase
    .from('household_members')
    .insert([{
      household_id: household.id,
      user_id: user.id,
      role: 'member'
    }])

  if (joinError) {
    return { success: false, error: joinError.message }
  }

  revalidatePath('/pantry')
  return { success: true }
}