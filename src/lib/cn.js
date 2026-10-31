import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Junta classes condicionais e resolve conflitos do Tailwind
// (mesmo utilitário "cn" usado pelos componentes do VengeanceUI).
export function cn(...entradas) {
  return twMerge(clsx(entradas))
}
