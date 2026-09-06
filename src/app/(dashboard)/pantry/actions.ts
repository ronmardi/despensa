'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function createHouseholdAction(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const inviteCode = generateInviteCode()

  // 1. Crear registro del hogar
  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert([{ name, invite_code: inviteCode, owner_id: user.id }])
    .select()
    .single()

  if (householdError) return { success: false, error: householdError.message }

  // 2. Vincular usuario en household_members
  const { error: memberError } = await supabase
    .from('household_members')
    .insert([{ household_id: household.id, user_id: user.id, role: 'owner' }])

  if (memberError) return { success: false, error: memberError.message }

  // 3. Registrar actividad inicial
  await supabase.from('activity_logs').insert([{
    household_id: household.id,
    item_name: name,
    action_type: 'CREATE_HOUSEHOLD',
    details: `Creó el hogar "${name}"`,
    user_email: user.email
  }])

  return { success: true, household }
}

export async function joinHouseholdAction(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  // 1. Buscar hogar por código de invitación
  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('id, name')
    .eq('invite_code', inviteCode.trim().toUpperCase())
    .single()

  if (householdError || !household) {
    return { success: false, error: 'Código de invitación inválido o no encontrado' }
  }

  // 2. Unir al usuario como miembro
  const { error: memberError } = await supabase
    .from('household_members')
    .insert([{ household_id: household.id, user_id: user.id, role: 'member' }])

  if (memberError) return { success: false, error: memberError.message }

  // 3. Registrar actividad
  await supabase.from('activity_logs').insert([{
    household_id: household.id,
    item_name: household.name,
    action_type: 'JOIN_HOUSEHOLD',
    details: `Se unió al hogar`,
    user_email: user.email
  }])

  return { success: true }
}

export async function updateItemQuantityAction(itemId: string, newQuantity: number, itemName: string, difference: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return { success: false, error: 'Sin hogar asignado' }

  const { error: updateError } = await supabase
    .from('items')
    .update({ current_quantity: newQuantity })
    .eq('id', itemId)
    .eq('household_id', member.household_id)

  if (updateError) return { success: false, error: updateError.message }

  const actionType = difference > 0 ? 'INCREASE' : 'DECREASE'
  const actionText = difference > 0 ? 'Agregó' : 'Consumió'
  const diffAbs = Math.abs(difference)
  
  await supabase.from('activity_logs').insert([{
    household_id: member.household_id,
    item_name: itemName,
    action_type: actionType,
    details: `${actionText} ${diffAbs} unidades. Total: ${newQuantity}`,
    user_email: user.email
  }])

  revalidatePath('/pantry')
  revalidatePath('/history')
  revalidatePath('/shopping-list')
  return { success: true }
}

export async function deleteItemAction(itemId: string, itemName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return { success: false, error: 'Sin hogar asignado' }

  const { error: deleteError } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId)
    .eq('household_id', member.household_id)

  if (deleteError) return { success: false, error: deleteError.message }

  await supabase.from('activity_logs').insert([{
    household_id: member.household_id,
    item_name: itemName,
    action_type: 'DELETE',
    details: `Eliminó el producto de la despensa.`,
    user_email: user.email
  }])

  revalidatePath('/pantry')
  revalidatePath('/history')
  revalidatePath('/shopping-list')
  return { success: true }
}

export async function editItemAction(
  itemId: string,
  data: { name: string; category: string; unit: string; min_threshold: number }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return { success: false, error: 'Sin hogar asignado' }

  const { error: updateError } = await supabase
    .from('items')
    .update({
      name: data.name,
      category: data.category,
      unit: data.unit,
      min_threshold: data.min_threshold
    })
    .eq('id', itemId)
    .eq('household_id', member.household_id)

  if (updateError) return { success: false, error: updateError.message }

  await supabase.from('activity_logs').insert([{
    household_id: member.household_id,
    item_name: data.name,
    action_type: 'UPDATE',
    details: `Editó el producto (Nombre: ${data.name}, Cat: ${data.category}, Unidad: ${data.unit})`,
    user_email: user.email
  }])

  revalidatePath('/pantry')
  revalidatePath('/history')
  revalidatePath('/shopping-list')
  return { success: true }
}