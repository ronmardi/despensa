'use server'

import { createClient } from '@/lib/supabase/server'

interface AddProductInput {
  name: string
  category: string
  quantity: number
  unit: string
  minThreshold: number
}

export async function addProductAction(input: AddProductInput) {
  const supabase = await createClient()

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  // 2. Asegurar Perfil (SOLUCIÓN AL ERROR DE DUPLICADO APLICADA AQUÍ)
  // El 'upsert' inserta el perfil, pero si el 'id' ya existe, simplemente lo ignora sin lanzar error.
  await supabase
    .from('profiles')
    .upsert(
      { id: user.id, email: user.email },
      { onConflict: 'id', ignoreDuplicates: true }
    )

  // 3. Buscar u Obtener Hogar
  let householdId: string | null = null

  const { data: members } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)

  if (members && members.length > 0) {
    householdId = members[0].household_id
  } else {
    // Crear hogar en el servidor
    const { data: newHousehold, error: createError } = await supabase
      .from('households')
      .insert([{ name: 'Mi Despensa', created_by: user.id }])
      .select('id')
      .single()

    if (createError || !newHousehold) {
      return { success: false, error: createError?.message || 'Error al crear el hogar' }
    }

    await supabase.from('household_members').insert([{
      household_id: newHousehold.id,
      user_id: user.id,
      role: 'admin'
    }])

    householdId = newHousehold.id
  }

  // 4. Insertar Producto
  const { error: insertError } = await supabase.from('items').insert([{
    household_id: householdId,
    name: input.name,
    category: input.category,
    current_quantity: input.quantity,
    ideal_quantity: input.quantity,
    min_threshold: input.minThreshold,
    unit: input.unit
  }])

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  return { success: true }
}