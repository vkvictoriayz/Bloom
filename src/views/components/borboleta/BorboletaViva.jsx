import { forwardRef } from 'react'

import { cn } from '../../lib/cn'

const TONS = {
  vinho: { cima: '#85243d', baixo: '#9c4a63', corpo: '#5e1a32' },
  clara: { cima: '#ffffff', baixo: '#f4e4e9', corpo: '#f4e4e9' },
  rosa: { cima: '#9c4a63', baixo: '#c27a90', corpo: '#5e1a32' },
}

const BorboletaViva = forwardRef(function BorboletaViva({ tom = 'vinho', modo = 'parada', ritmo, className, style }, ref) {
  const c = TONS[tom] ?? TONS.vinho
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn('borboleta-viva relative inline-block aspect-[5/4]', modo === 'batendo' && 'bv-batendo', modo === 'planando' && 'bv-planando', className)}
      style={{ ...(ritmo ? { '--bv-ritmo': ritmo } : {}), ...style }}
    >
      <span className="bv-asa bv-esq absolute inset-y-0 left-0 w-1/2">
        <svg viewBox="0 0 50 80" className="size-full overflow-visible">
          <path d="M49.2 45.6C43 30 28 8 5.5 5C3.5 23 20 41 49.2 45.6Z" fill={c.cima} />
          <path d="M48.6 48.4C40 46.2 31 44.8 23.5 44.6C21 56 26.5 70 35 75.5C40.5 76.5 46 62 48.6 48.4Z" fill={c.baixo} />
        </svg>
      </span>
      <span className="bv-asa bv-dir absolute inset-y-0 right-0 w-1/2">
        <svg viewBox="50 0 50 80" className="size-full overflow-visible">
          <path d="M50.8 45.6C57 30 72 8 94.5 5C96.5 23 80 41 50.8 45.6Z" fill={c.cima} />
          <path d="M51.4 48.4C60 46.2 69 44.8 76.5 44.6C79 56 73.5 70 65 75.5C59.5 76.5 54 62 51.4 48.4Z" fill={c.baixo} />
        </svg>
      </span>
      <svg viewBox="0 0 100 80" className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <ellipse cx="50" cy="48" rx="1.6" ry="10" fill={c.corpo} />
        <path d="M49.5 38.5C48.4 33.5 46 30 43.5 28.5M50.5 38.5C51.6 33.5 54 30 56.5 28.5" fill="none" stroke={c.corpo} strokeWidth="0.8" strokeLinecap="round" />
      </svg>
    </span>
  )
})

export default BorboletaViva
