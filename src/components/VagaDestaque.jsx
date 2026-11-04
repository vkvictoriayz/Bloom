import { Link } from 'react-router-dom'

import BotaoSalvar from './BotaoSalvar'
import Icone from './Icone'
import MarcaEmpresa from './MarcaEmpresa'
import Selo from './ui/Selo'
import { formatarPublicacao } from '../data/vagas'

// Vaga em destaque: bloco maior que abre a lista de resultados, com a faixa
// na cor da empresa, cargo em Fraunces e uma ficha de metadados.
function VagaDestaque({ vaga, candidatura }) {
  const empresa = vaga.dadosEmpresa
  const ficha = [
    ['Local', vaga.local],
    ['Modalidade', vaga.modalidade],
    ['Nível', vaga.nivel ?? 'Não informado'],
    ['Publicada', formatarPublicacao(vaga.publicadaHaDias)],
  ]

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-linha bg-branco transition-colors hover:border-linha-forte">
      <span aria-hidden="true" className="h-1.5" style={{ backgroundColor: empresa.cor }} />
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <MarcaEmpresa empresa={empresa} tamanho="md" />
            <div>
              <p className="font-bold text-tinta">{empresa.nomeCurto}</p>
              <p className="text-xs text-suave">{empresa.segmento}</p>
            </div>
          </div>
          <BotaoSalvar vaga={vaga} className="relative z-10 -mt-1 -mr-2" />
        </div>

        <h3 className="mt-6 font-display text-2xl leading-snug text-tinta group-hover:text-vinho">
          <Link
            to={`/vagas/${vaga.id}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-vinho"
          >
            {vaga.titulo}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-suave">{vaga.resumo}</p>

        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-linha pt-5">
          {ficha.map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt className="text-[11px] font-bold tracking-[0.1em] text-suave uppercase">{rotulo}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-tinta">{valor}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="flex flex-wrap gap-1.5">
            {candidatura && (
              <Selo variante="sucesso">
                <Icone nome="check" /> Candidatura enviada
              </Selo>
            )}
            {vaga.competencias.slice(0, 3).map((tecnologia) => (
              <Selo key={tecnologia} variante="contorno">
                {tecnologia}
              </Selo>
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-vinho">
            Ver vaga <Icone nome="seta" tamanho={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </article>
  )
}

export default VagaDestaque
