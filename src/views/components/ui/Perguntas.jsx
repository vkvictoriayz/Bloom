import { useId, useState } from 'react'
import { cn } from '../../lib/cn'

function Perguntas({ itens, className }) {
  const [aberto, setAberto] = useState(null)
  const base = useId()

  return (
    <ul className={cn('border-t border-linha', className)}>
      {itens.map((item, i) => {
        const ativo = aberto === i
        const idPainel = `${base}-painel-${i}`
        return (
          <li key={item.pergunta} className="border-b border-linha">
            <button
              type="button"
              aria-expanded={ativo}
              aria-controls={idPainel}
              onClick={() => setAberto(ativo ? null : i)}
              className={cn(
                'flex w-full items-center gap-4 border-l-2 py-5 pr-2 pl-5 text-left text-base font-semibold transition-colors md:text-lg',
                ativo ? 'border-vinho text-tinta' : 'border-transparent text-tinta-2 hover:border-linha-forte hover:text-tinta'
              )}
            >
              <span className="flex-1">{item.pergunta}</span>
              <span
                aria-hidden="true"
                className={cn('font-display text-3xl leading-none text-vinho transition-transform duration-200', ativo && 'rotate-45')}
              >
                +
              </span>
            </button>
            <div
              id={idPainel}
              role="region"
              aria-label={item.pergunta}
              className={cn(
                'grid border-l-2 transition-[grid-template-rows] duration-300',
                ativo ? 'grid-rows-[1fr] border-vinho' : 'grid-rows-[0fr] border-transparent'
              )}
            >
              <div className="overflow-hidden" inert={!ativo}>
                <p className="max-w-2xl pr-4 pb-6 pl-5 leading-relaxed text-suave">{item.resposta}</p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default Perguntas
