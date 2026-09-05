'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto' //

export async function getHouseholdData() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single()

  if (!member) return null

  const { data: household } = await supabase
    .from('households')
    .select('*')
    .eq('id', member.household_id)
    .single()

  if (!household) return null

  const { data: members } = await supabase
    .from('household_members')
    .select('*, profiles(full_name, avatar_url)')
    .eq('household_id', member.household_id)

  return {
    household,
    members: members || [],
    userRole: member.role,
    currentUserId: user.id,
    userEmail: user.email,
  }
}

export async function joinHouseholdAction(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Sesión no válida.' }

  const cleanCode = inviteCode.trim().toUpperCase()

  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('id')
    .eq('invite_code', cleanCode)
    .single()

  if (householdError || !household) return { success: false, error: 'Código inválido.' }

  await supabase.from('household_members').delete().eq('user_id', user.id)

  const { error: joinError } = await supabase
    .from('household_members')
    .insert([{ household_id: household.id, user_id: user.id, role: 'member' }])

  if (joinError) return { success: false, error: joinError.message }

  revalidatePath('/pantry')
  revalidatePath('/household')
  return { success: true }
}

export async function createHouseholdAction(name: string = 'Mi Despensa') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesión no válida.' }

  // Generación criptográficamente segura (8 caracteres)
  const inviteCode = randomBytes(4).toString('hex').toUpperCase()

  // Para hacer esto transaccional y evitar que el usuario se quede sin hogar si algo falla,
  // verificamos si se crea el hogar ANTES de borrar su membresía actual.
  const { data: newHousehold, error: hError } = await supabase
    .from('households')
    .insert([{ name, invite_code: inviteCode }])
    .select()
    .single()

  if (hError || !newHousehold) return { success: false, error: hError?.message }

  // Borramos la membresía antigua solo cuando el nuevo hogar ya existe
  await supabase.from('household_members').delete().eq('user_id', user.id)

  const { error: joinError } = await supabase
    .from('household_members')
    .insert([{ household_id: newHousehold.id, user_id: user.id, role: 'admin' }])

  if (joinError) return { success: false, error: joinError.message }

  revalidatePath('/pantry')
  revalidatePath('/household')
  return { success: true }
}

export async function leaveHouseholdAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesión no válida.' }

  const { error } = await supabase.from('household_members').delete().eq('user_id', user.id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/pantry')
  revalidatePath('/household')
  return { success: true }
}