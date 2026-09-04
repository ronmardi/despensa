'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface AddProductData {
  name: string
  category: string
  quantity: number
  unit: string
  minThreshold: number
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

  // 3. Insertar el nuevo producto en la tabla items
  const { error: insertError } = await supabase
    .from('items')
    .insert([{
      household_id: householdId,
      name: data.name.trim(),
      category: data.category,
      current_quantity: data.quantity,
      min_threshold: data.minThreshold,
      ideal_quantity: data.quantity > data.minThreshold ? data.quantity : data.minThreshold + 1,
      unit: data.unit
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
      details: `Agregó por primera vez con cantidad inicial de ${data.quantity} ${data.unit}`
    }])

  // 5. Refrescar la página de la despensa
  revalidatePath('/pantry')
  
  return { success: true }
}