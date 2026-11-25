import { cn } from '../../lib/cn'

function Esqueleto({ className, ...props }) {
  return <div className={cn('reflexo-carregando relative overflow-hidden rounded-md bg-papel-2', className)} aria-hidden="true" {...props} />
}

export default Esqueleto
