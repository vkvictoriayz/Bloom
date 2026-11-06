import { useRef } from 'react'
import { cn } from '../../lib/cn'

// Abas acessíveis (Tabs do VengeanceUI): as setas do teclado trocam de aba.
// O conteúdo de cada aba usa id="painel-<id>" e aria-labelledby="aba-<id>".
function Abas({ abas, ativa, aoTrocar, rotulo, className }) {
  const refs = useRef([])

  function aoTeclar(e, i) {
    const passo = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!passo) return
    e.preventDefault()
    const proxima = (i + passo + abas.length) % abas.length
    aoTrocar(abas[proxima].id)
    refs.current[proxima]?.focus()
  }

  return (
    <div role="tablist" aria-label={rotulo} className={cn('flex flex-wrap gap-x-6 border-b border-linha', className)}>
      {abas.map((aba, i) => {
        const selecionada = aba.id === ativa
        return (
          <button
            key={aba.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`aba-${aba.id}`}
            aria-selected={selecionada}
            aria-controls={`painel-${aba.id}`}
            tabIndex={selecionada ? 0 : -1}
            onClick={() => aoTrocar(aba.id)}
            onKeyDown={(e) => aoTeclar(e, i)}
            className={cn(
              '-mb-px flex shrink-0 items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors',
              selecionada ? 'border-vinho text-tinta' : 'border-transparent text-suave hover:text-tinta'
            )}
          >
            {aba.rotulo}
            {aba.contagem !== undefined && (
              <span className={cn('rounded-full px-2 py-0.5 text-xs tabular-nums', selecionada ? 'bg-vinho text-white' : 'bg-papel-2 text-suave')}>
                {aba.contagem}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default Abas
