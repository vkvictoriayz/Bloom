import { cn } from '../../lib/cn'

function CabecalhoSecao({ indice, rotulo, titulo, descricao, acao, claro = false, className, id }) {
  return (
    <div className={cn('flex flex-col gap-6 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-2xl">
        {(indice || rotulo) && (
          <p className={cn('mb-4 flex items-center gap-3 text-xs font-semibold tracking-[0.16em] uppercase', claro ? 'text-white/70' : 'text-vinho')}>
            {indice && <span className="tabular-nums">{indice}</span>}
            {indice && rotulo && <span aria-hidden="true" className={cn('h-px w-8', claro ? 'bg-white/40' : 'bg-vinho/40')} />}
            {rotulo}
          </p>
        )}
        <h2 id={id} className={cn('font-display text-3xl leading-[1.1] sm:text-4xl', claro ? 'text-white' : 'text-tinta')}>
          {titulo}
        </h2>
        {descricao && <p className={cn('mt-4 max-w-xl leading-relaxed', claro ? 'text-white/75' : 'text-suave')}>{descricao}</p>}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  )
}

export default CabecalhoSecao
