'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getHouseholdData() {
  const supabase = await createClient()

  // 1. Obtener el usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Buscar la membresía del usuario
  const { data: member } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single()

  if (!member) return null

  // 3. Obtener los detalles del hogar
  const { data: household } = await supabase
    .from('households')
    .select('*')
    .eq('id', member.household_id)
    .single()

  if (!household) return null

  // 4. Obtener todos los miembros vinculados
  const { data: members } = await supabase
    .from('household_members')
    .select('*')
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

  // 1. Verificar sesión activa
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Sesión no válida. Vuelve a iniciar sesión.' }
  }

  const cleanCode = inviteCode.trim().toUpperCase()

  // 2. Validar código de invitación
  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('id')
    .eq('invite_code', cleanCode)
    .single()

  if (householdError || !household) {
    return { success: false, error: 'El código de invitación no existe o es inválido.' }
  }

  // 3. Limpiar vinculaciones previas
  await supabase
    .from('household_members')
    .delete()
    .eq('user_id', user.id)

  // 4. Vincular al nuevo hogar
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
  revalidatePath('/household')
  return { success: true }
}