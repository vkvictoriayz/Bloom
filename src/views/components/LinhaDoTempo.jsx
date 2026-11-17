import Icone from './Icone'
import { ETAPAS, situacao } from '../services/candidaturas'
import { cn } from '../lib/cn'

function LinhaDoTempo({ candidatura, compacta = false }) {
  const { etapasConcluidas, etapaAtual, grupo, rotulo, detalheAtual } = situacao(candidatura)
  const final = grupo === 'aprovada' || grupo === 'recusada'

  return (
    <ol className={cn('grid', compacta ? 'grid-cols-3 gap-2' : 'gap-0 sm:grid-cols-3')}>
      {ETAPAS.map((etapa, i) => {
        const concluida = i < etapasConcluidas
        const atual = i === etapaAtual
        const ultimaFinal = final && i === ETAPAS.length - 1

        let detalhe = 'Aguardando'
        if (i === 0) detalhe = candidatura.data ?? 'Registrada'
        else if (ultimaFinal) detalhe = rotulo
        else if (concluida) detalhe = 'Concluída'
        else if (atual) detalhe = detalheAtual ?? 'Aguardando a empresa'
        if (grupo === 'encerrada' && i > 0) detalhe = 'Vaga encerrada'

        return (
          <li key={etapa} className={cn('relative flex gap-3', compacta ? 'flex-col' : 'pb-5 sm:flex-col sm:pb-0')}>
            <div className={cn('flex items-center', compacta ? 'gap-2' : 'flex-col sm:flex-row sm:gap-2')}>
              <span
                className={cn(
                  'grid shrink-0 place-items-center rounded-full border-2',
                  compacta ? 'size-4' : 'size-6',
                  concluida && !ultimaFinal && 'border-vinho bg-vinho text-white',
                  ultimaFinal && grupo === 'aprovada' && 'border-sucesso bg-sucesso text-white',
                  ultimaFinal && grupo === 'recusada' && 'border-erro bg-erro text-white',
                  !concluida && atual && 'border-vinho bg-branco',
                  !concluida && !atual && 'border-linha-forte bg-branco'
                )}
                aria-hidden="true"
              >
                {concluida && !compacta && <Icone nome="check" tamanho={14} />}
              </span>
              {i < ETAPAS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    concluida && i + 1 < etapasConcluidas ? 'bg-vinho' : 'bg-linha-forte',
                    compacta ? 'h-px flex-1' : 'absolute top-6 left-[11px] h-[calc(100%-24px)] w-0.5 sm:static sm:h-0.5 sm:w-auto sm:flex-1'
                  )}
                />
              )}
            </div>
            <div className={cn(compacta && 'sr-only')}>
              <p className={cn('text-sm font-semibold', concluida || atual ? 'text-tinta' : 'text-suave')}>{etapa}</p>
              <p className="text-xs text-suave">{detalhe}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default LinhaDoTempo
