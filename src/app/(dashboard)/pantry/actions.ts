'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  // 1. Actualización atómica asegurando que pertenece a su hogar (Defensa en profundidad)
  const { error: updateError } = await supabase
    .from('items')
    .update({ current_quantity: newQuantity })
    .eq('id', itemId)
    .eq('household_id', member.household_id)

  if (updateError) return { success: false, error: updateError.message }

  // 2. Registrar actividad de forma segura en el servidor
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

  // Borrado con verificación de household_id
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