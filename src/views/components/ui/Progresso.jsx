import { cn } from '../../lib/cn'

function Progresso({ valor = 0, rotulo, className }) {
  const limitado = Math.max(0, Math.min(100, valor))

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={limitado}
      aria-label={rotulo}
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-blush', className)}
    >
      <div
        className="h-full rounded-full bg-vinho transition-[width] duration-500"
        style={{ width: `${limitado}%` }}
      />
    </div>
  )
}

export default Progresso
