'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateItemQuantityAction(itemId: string, itemName: string, difference: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return { success: false, error: 'Sin hogar asignado' }

  // 1. Llamada atómica a la base de datos (RPC) SEGURA
  const { data: newQuantity, error: updateError } = await supabase
    .rpc('increment_item_quantity', {
      p_item_id: itemId,
      p_delta: difference
      // Se elimina p_household_id; la RPC lo determina con auth.uid() en Postgres
    })

  if (updateError) return { success: false, error: updateError.message }

  // 2. Registrar actividad con el nuevo total devuelto por el servidor
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
  data: { 
    name: string; 
    category: string; 
    location?: string; 
    unit: string; 
    min_threshold: number; 
    emoji?: string | null 
  }
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
      location: data.location,
      unit: data.unit,
      min_threshold: data.min_threshold,
      emoji: data.emoji
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