'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface AddProductData {
  name: string
  category: string
  location?: string
  quantity: number
  unit: string
  minThreshold: number
  emoji?: string | null
}

export async function addProductAction(data: AddProductData) {
  const supabase = await createClient()
  
  // 1. Obtener el usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Usuario no autenticado' }

  // 2. Obtener el hogar al que pertenece el usuario
  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return { success: false, error: 'No estás asignado a ningún hogar' }
  }

  const householdId = member.household_id
  const userEmail = user.email || 'Usuario'
  const location = data.location || 'Despensa'

  // 3. Insertar el nuevo producto en la tabla items
  const { error: insertError } = await supabase
    .from('items')
    .insert([{
      household_id: householdId,
      name: data.name.trim(),
      category: data.category,
      location: location,
      current_quantity: data.quantity,
      min_threshold: data.minThreshold,
      ideal_quantity: data.quantity > data.minThreshold ? data.quantity : data.minThreshold + 1,
      unit: data.unit,
      emoji: data.emoji,
      last_updated_by: user.id
    }])

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  // 4. Guardar registro en el Historial de Actividad
  await supabase
    .from('activity_logs')
    .insert([{
      household_id: householdId,
      user_email: userEmail,
      item_name: data.name.trim(),
      action_type: 'ADD',
      details: `Agregó por primera vez (${data.quantity} ${data.unit}) en ${location}`
    }])

  // 5. Refrescar páginas dependientes
  revalidatePath('/pantry')
  revalidatePath('/history')
  revalidatePath('/shopping-list')
  
  return { success: true }
}

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

  // Llamada atómica a la base de datos (RPC) SEGURA (usa auth.uid() internamente)
  const { data: newQuantity, error: updateError } = await supabase
    .rpc('increment_item_quantity', {
      p_item_id: itemId,
      p_delta: difference
    })

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
  data: { 
    name: string
    category: string
    location?: string
    unit: string
    min_threshold: number
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
    details: `Editó el producto (Nombre: ${data.name}, Cat: ${data.category}, Ubicación: ${data.location || 'Despensa'}, Unidad: ${data.unit})`,
    user_email: user.email
  }])

  revalidatePath('/pantry')
  revalidatePath('/history')
  revalidatePath('/shopping-list')
  return { success: true }
}