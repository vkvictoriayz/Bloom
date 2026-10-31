import { cn } from '../../lib/cn'

// Bloco de carregamento (Skeleton do VengeanceUI).
function Esqueleto({ className, ...props }) {
  return <div className={cn('animate-pulse rounded-md bg-papel-2', className)} aria-hidden="true" {...props} />
}

export default Esqueleto
