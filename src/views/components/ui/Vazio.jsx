import { cn } from '../../lib/cn'

export function Vazio({ className, ...props }) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-linha-forte px-6 py-10 text-center text-balance md:py-14',
        className
      )}
      {...props}
    />
  )
}

export function VazioIcone({ className, ...props }) {
  return (
    <div
      className={cn('grid size-12 place-items-center rounded-full bg-blush text-vinho', className)}
      aria-hidden="true"
      {...props}
    />
  )
}

export function VazioTitulo({ className, ...props }) {
  return <p className={cn('font-display text-xl text-tinta', className)} {...props} />
}

export function VazioDescricao({ className, ...props }) {
  return <p className={cn('max-w-sm text-sm leading-relaxed text-suave', className)} {...props} />
}

export function VazioAcoes({ className, ...props }) {
  return <div className={cn('mt-1 flex flex-wrap items-center justify-center gap-3', className)} {...props} />
}
