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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesión no válida.' }

  // 1. Rate Limiting: Máximo 5 intentos en los últimos 15 minutos
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

  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('id')
    .eq('invite_code', cleanCode)
    .single()

  if (householdError || !household) {
    // Registrar intento fallido
    await supabase.from('join_attempts').insert([{ user_id: user.id }])
    return { success: false, error: 'Código inválido.' }
  }

  // 2. Operación Atómica (Upsert): Actualiza si existe, inserta si no.
  const { error: joinError } = await supabase
    .from('household_members')
    .upsert({ 
      user_id: user.id, 
      household_id: household.id, 
      role: 'member' 
    }, { onConflict: 'user_id' })

  if (joinError) return { success: false, error: joinError.message }

  // Limpiar intentos tras un éxito
  await supabase.from('join_attempts').delete().eq('user_id', user.id)

  revalidatePath('/pantry')
  revalidatePath('/household')
  return { success: true }
}

export async function createHouseholdAction(name: string = 'Mi Despensa') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesión no válida.' }

  // Generación criptográficamente segura (8 caracteres hex)
  const inviteCode = randomBytes(4).toString('hex').toUpperCase()

  // Llamada atómica a la base de datos (RPC) SEGURA
  const { data: household, error } = await supabase
    .rpc('create_household_transaction', {
      p_name: name.trim(),
      p_invite_code: inviteCode
      // Se elimina p_user_id; la RPC lo determina con auth.uid() en Postgres
    })

  if (error) return { success: false, error: error.message }

  revalidatePath('/pantry')
  revalidatePath('/household')
  return { success: true, household }
}

export async function leaveHouseholdAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  // 1. Obtener los datos actuales del usuario en el hogar
  const { data: currentMember, error: memberError } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single()

  if (memberError || !currentMember) {
    return { success: false, error: 'No tienes una despensa asignada.' }
  }

  const householdId = currentMember.household_id

  // 2. Verificaciones de seguridad para el administrador
  if (currentMember.role === 'admin') {
    const { data: allMembers } = await supabase
      .from('household_members')
      .select('id, role')
      .eq('household_id', householdId)

    if (allMembers) {
      const totalMembers = allMembers.length
      const adminCount = allMembers.filter(m => m.role === 'admin').length

      // CASO A: Es el único admin, pero hay más personas en el hogar.
      if (adminCount === 1 && totalMembers > 1) {
        return { 
          success: false, 
          error: 'Eres el único administrador. Nombra a otro miembro como administrador antes de abandonar la despensa.' 
        }
      }

      // CASO B: Es la última persona en la despensa.
      if (totalMembers === 1) {
        const { error: deleteError } = await supabase.from('households').delete().eq('id', householdId)
        if (deleteError) return { success: false, error: deleteError.message }
        
        revalidatePath('/pantry')
        revalidatePath('/household')
        return { success: true }
      }
    }
  }

  // 3. Si no es admin, o hay más admins, simplemente borramos su membresía
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