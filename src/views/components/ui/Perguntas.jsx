import { useId, useState } from 'react'

import Icone from '../Icone'
import { cn } from '../../lib/cn'

function Perguntas({ itens, className }) {
  const [aberto, setAberto] = useState(0)
  const base = useId()

  return (
    <ul className={cn('flex flex-col gap-3', className)}>
      {itens.map((item, i) => {
        const ativo = aberto === i
        const idPainel = `${base}-painel-${i}`
        return (
          <li
            key={item.pergunta}
            className={cn('rounded-2xl border bg-branco transition-colors duration-300', ativo ? 'border-vinho/40' : 'border-linha hover:border-linha-forte')}
          >
            <button type="button" aria-expanded={ativo} aria-controls={idPainel} onClick={() => setAberto(ativo ? null : i)} className="group flex w-full items-center gap-4 p-4 text-left sm:p-5">
              <span
                aria-hidden="true"
                className={cn('grid size-11 shrink-0 place-items-center rounded-full transition-colors duration-300', ativo ? 'bg-vinho text-white' : 'bg-blush text-vinho group-hover:bg-vinho/15')}
              >
                {item.icone ? <Icone nome={item.icone} tamanho={19} /> : <span className="font-display text-base">{i + 1}</span>}
              </span>
              <span className={cn('flex-1 font-display text-lg leading-snug transition-colors sm:text-xl', ativo ? 'text-vinho-escuro' : 'text-tinta')}>{item.pergunta}</span>
              <span aria-hidden="true" className={cn('relative size-8 shrink-0 rounded-full border transition-colors duration-300', ativo ? 'border-vinho bg-vinho text-white' : 'border-linha-forte text-vinho')}>
                <span className="absolute top-1/2 left-1/2 h-[1.5px] w-3 -translate-x-1/2 -translate-y-1/2 bg-current" />
                <span className={cn('absolute top-1/2 left-1/2 h-3 w-[1.5px] -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-300', ativo && 'scale-y-0')} />
              </span>
            </button>
            <div id={idPainel} role="region" aria-label={item.pergunta} className={cn('grid transition-[grid-template-rows] duration-300 ease-out', ativo ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
              <div className="overflow-hidden" inert={!ativo}>
                <p className="mx-4 mb-5 border-l-2 border-blush pl-4 leading-relaxed text-tinta-2 sm:mr-16 sm:ml-[4.75rem]">{item.resposta}</p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default Perguntas
