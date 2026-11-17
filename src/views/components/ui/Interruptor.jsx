import { cn } from '../../lib/cn'

function Interruptor({ ligado, aoMudar, rotulo, desativado }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      disabled={desativado}
      onClick={() => aoMudar(!ligado)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        ligado ? 'bg-vinho' : 'bg-linha-forte'
      )}
    >
      <span className={cn('inline-block size-5 rounded-full bg-branco shadow transition-transform', ligado ? 'translate-x-5.5' : 'translate-x-0.5')} />
    </button>
  )
}

export default Interruptor
