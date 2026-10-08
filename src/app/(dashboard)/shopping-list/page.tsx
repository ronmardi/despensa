'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completePurchasesAction(purchases: { id: string, name: string, added_qty: number, new_total: number }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return { success: false, error: 'Sin hogar asignado' }

  for (const item of purchases) {
    // Defensa en profundidad: Forzamos la validación del household_id en el servidor
    const { error: updateError } = await supabase
      .from('items')
      .update({ current_quantity: item.new_total })
      .eq('id', item.id)
      .eq('household_id', member.household_id)

    if (!updateError) {
      // Registro en el historial
      await supabase.from('activity_logs').insert([{
        household_id: member.household_id,
        item_name: item.name,
        action_type: 'INCREASE',
        details: `Compró ${item.added_qty} unidades. Total actualizado: ${item.new_total}`,
        user_email: user.email
      }])
    }
  }

  revalidatePath('/pantry')
  revalidatePath('/shopping-list')
  revalidatePath('/history')
  return { success: true }
}

// ==========================================
// ACCIONES PARA ÍTEMS MANUALES (EXTRAS)
// ==========================================

export async function addExtraItemAction(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()

  if (!member) return { success: false, error: 'Sin hogar' }

  const { error } = await supabase.from('shopping_extras').insert([{
    household_id: member.household_id,
    name: name.trim(),
    added_by: user.id
  }])

  if (error) return { success: false, error: error.message }
  revalidatePath('/shopping-list')
  return { success: true }
}

export async function toggleExtraItemAction(id: string, isChecked: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shopping_extras')
    .update({ is_checked: isChecked })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/shopping-list')
  return { success: true }
}

export async function deleteExtraItemAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('shopping_extras').delete().eq('id', id)
  
  if (error) return { success: false, error: error.message }
  revalidatePath('/shopping-list')
  return { success: true }
}