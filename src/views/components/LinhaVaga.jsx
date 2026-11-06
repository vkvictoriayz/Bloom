import { Link } from 'react-router-dom'

import BotaoSalvar from './BotaoSalvar'
import Icone from './Icone'
import MarcaEmpresa from './MarcaEmpresa'
import Selo from './ui/Selo'
import { formatarPublicacao } from '../data/vagas'
import { cn } from '../lib/cn'

// Vaga em formato de linha de lista (não card): a hierarquia vem da
// tipografia — cargo, depois empresa, depois metadados.
// "compacta" é a versão usada no painel inicial.
function LinhaVaga({ vaga, candidatura, compacta = false, className }) {
  const empresa = vaga.dadosEmpresa

  return (
    <article
      className={cn(
        'group relative grid grid-cols-[auto_1fr_auto] items-start gap-x-4 gap-y-2 border-b border-linha py-5 transition-colors',
        !compacta && 'sm:gap-x-5 sm:py-6',
        className
      )}
    >
      <MarcaEmpresa empresa={empresa} tamanho={compacta ? 'sm' : 'md'} />

      <div className="min-w-0">
        <p className="text-sm text-suave">{empresa?.nomeCurto}</p>
        <h3 className={cn('mt-0.5 font-semibold text-tinta', compacta ? 'text-[15px]' : 'text-base sm:text-lg')}>
          <Link
            to={`/vagas/${vaga.id}`}
            className="after:absolute after:inset-0 after:content-[''] group-hover:text-vinho focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:outline-2 focus-visible:after:outline-vinho"
          >
            {vaga.titulo}
          </Link>
        </h3>

        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta-2">
          <span className="inline-flex items-center gap-1">
            <Icone nome="local" tamanho={15} className="text-suave" />
            {vaga.local}
          </span>
          <span aria-hidden="true" className="text-linha-forte">/</span>
          <span>{vaga.modalidade}</span>
          {vaga.nivel && (
            <>
              <span aria-hidden="true" className="text-linha-forte">/</span>
              <span>{vaga.nivel}</span>
            </>
          )}
        </p>

        {!compacta && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {vaga.competencias.slice(0, 4).map((tecnologia) => (
              <Selo key={tecnologia} variante="contorno">
                {tecnologia}
              </Selo>
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-end gap-2">
        <span className="text-xs whitespace-nowrap text-suave tabular-nums">{formatarPublicacao(vaga.publicadaHaDias)}</span>
        <div className="flex items-center gap-1">
          {candidatura && (
            <Selo variante="sucesso" className="max-sm:hidden">
              <Icone nome="check" /> Candidatura enviada
            </Selo>
          )}
          <BotaoSalvar vaga={vaga} className="-mr-2" />
        </div>
        {candidatura && (
          <Selo variante="sucesso" className="sm:hidden">
            <Icone nome="check" /> Enviada
          </Selo>
        )}
      </div>
    </article>
  )
}

export default LinhaVaga
