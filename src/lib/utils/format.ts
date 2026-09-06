export function formatUnit(unit: string, quantity?: number): string {
  if (!unit) return ''
  const u = unit.toLowerCase().trim()

  if (u === 'unidades' || u === 'unidad') return quantity === 1 ? 'ud' : 'uds'
  if (u === 'litros' || u === 'litro') return 'lt'
  if (u === 'kilogramos' || u === 'kilos' || u === 'kilo') return 'kg'
  if (u === 'gramos' || u === 'gramo') return 'g'
  if (u === 'latas' || u === 'lata') return 'latas'
  if (u === 'botellas' || u === 'botella') return 'bot.'
  if (u === 'cajas' || u === 'caja') return 'cajas'
  if (u === 'paquetes' || u === 'paquete') return 'paq.'

  return unit
}