import { cn } from '../lib/cn'

export function Borboleta({ tamanho = 28, className = '' }) {
  return (
    <svg
      className={className}
      width={tamanho}
      height={tamanho * 0.8}
      viewBox="0 0 100 80"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M49.2 45.6C43 30 28 8 5.5 5C3.5 23 20 41 49.2 45.6Z" />
      <path d="M48.6 48.4C40 46.2 31 44.8 23.5 44.6C21 56 26.5 70 35 75.5C40.5 76.5 46 62 48.6 48.4Z" />
      <path d="M50.8 45.6C57 30 72 8 94.5 5C96.5 23 80 41 50.8 45.6Z" />
      <path d="M51.4 48.4C60 46.2 69 44.8 76.5 44.6C79 56 73.5 70 65 75.5C59.5 76.5 54 62 51.4 48.4Z" />
    </svg>
  )
}

function Logo({ variante = 'escura', tamanho = 26, className = '' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5',
        variante === 'clara' ? 'text-white' : 'text-vinho',
        className
      )}
    >
      <Borboleta tamanho={tamanho} />
      <span className="font-display text-[1.3rem] leading-none font-semibold tracking-[0.14em]">BLOOM</span>
    </span>
  )
}

export default Logo
