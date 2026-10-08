export const CATEGORIES = [
  'Despensa',
  'Lácteos y Huevos',
  'Frutas y Verduras',
  'Carnes y Pescados',
  'Bebidas',
  'Limpieza',
  'Aseo Personal',
  'Mascotas',
  'Otros'
] as const

export const LOCATIONS = [
  'Despensa',
  'Refrigerador',
  'Congelador',
  'Baño',
  'Limpieza',
  'Cocina',
  'Bodega',
  'Otro'
] as const

export const UNITS = [
  { value: 'uds', label: 'Unidades (uds)' },
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'gr', label: 'Gramos (gr)' },
  { value: 'lt', label: 'Litros (lt)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'bot', label: 'Botellas (bot)' },
  { value: 'caja', label: 'Cajas (caja)' },
  { value: 'paq', label: 'Paquetes (paq)' },
] as const

export type Category = typeof CATEGORIES[number]
export type Location = typeof LOCATIONS[number]
export type UnitValue = typeof UNITS[number]['value']