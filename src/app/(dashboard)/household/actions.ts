'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function joinHouseholdAction(inviteCode: string) {
  const supabase = await createClient()

  // 1. Obtener y verificar el usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Sesión no válida. Vuelve a iniciar sesión.' }
  }

  const cleanCode = inviteCode.trim().toUpperCase()

  // 2. Buscar el hogar correspondiente al código de invitación
  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('id')
    .eq('invite_code', cleanCode)
    .single()

  if (householdError || !household) {
    return { success: false, error: 'El código de invitación no existe o es inválido.' }
  }

  // 3. Eliminar vinculaciones previas del usuario si ya pertenece a otro hogar
  await supabase
    .from('household_members')
    .delete()
    .eq('user_id', user.id)

  // 4. Insertar el nuevo registro con el UUID de usuario garantizado
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