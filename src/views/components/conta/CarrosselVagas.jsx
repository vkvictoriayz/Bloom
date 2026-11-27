import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../Icone'
import { listarEmpresasPublicas } from '../../services/publico'
import { cn } from '../../lib/cn'

const MAX_VAGAS = 8
const INTERVALO = 4800

// Vagas reais: as últimas vagas abertas de cada empresa cadastrada (lista pública de empresas).
function useVagasEmDestaque() {
  const [vagas, setVagas] = useState([])
  useEffect(() => {
    let ativo = true
    listarEmpresasPublicas({ comVagas: true })
      .then(({ empresas }) => {
        if (!ativo) return
        const lista = empresas.flatMap((e) =>
          (e.ultimasVagas ?? []).map((v) => ({ ...v, empresaId: e.id, empresa: e.nome, local: e.localizacao }))
        )
        setVagas(lista.slice(0, MAX_VAGAS))
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [])
  return vagas
}

function CartaoVaga({ vaga, ativo, oculto }) {
  return (
    <article
      aria-hidden={oculto || undefined}
      className={cn(
        'flex h-[15.5rem] w-[15.25rem] shrink-0 flex-col rounded-[1.4rem] border p-6 transition-[background-color,color,border-color,box-shadow] duration-700 ease-bloom',
        ativo
          ? 'border-transparent bg-rosa text-white shadow-[0_24px_50px_-24px_rgba(94,26,50,0.65)]'
          : 'border-white/70 bg-white/55 text-vinho-escuro shadow-[0_18px_40px_-30px_rgba(94,26,50,0.45)] backdrop-blur-md'
      )}
    >
      <span className="flex items-center gap-2.5">
        <span className={cn('grid size-8 place-items-center rounded-full', ativo ? 'bg-white/20' : 'bg-blush/80 text-rosa')} aria-hidden="true">
          <Icone nome="maleta" tamanho={15} />
        </span>
        <span className={cn('text-[10px] font-semibold tracking-[0.2em] uppercase', ativo ? 'text-white/80' : 'text-vinho-escuro/70')}>
          Vaga{vaga.modalidade ? ` · ${vaga.modalidade}` : ''}
        </span>
      </span>
      <h3 className="mt-5 line-clamp-2 font-display text-[1.45rem] leading-[1.15]">{vaga.titulo}</h3>
      <p className={cn('mt-2.5 line-clamp-2 text-sm leading-relaxed', ativo ? 'text-white/80' : 'text-tinta-2')}>
        Na {vaga.empresa}
        {vaga.local ? `, ${vaga.local}` : ''}.
      </p>
      <Link
        to={`/empresas/${vaga.empresaId}`}
        tabIndex={oculto ? -1 : undefined}
        className={cn('group mt-auto inline-flex w-fit items-center gap-1.5 text-sm font-semibold', ativo ? 'text-white' : 'text-vinho-escuro')}
      >
        Ver vaga <Icone nome="seta" tamanho={15} className="transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </article>
  )
}

function BotaoSeta({ direcao, aoClicar }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label={direcao === 'anterior' ? 'Vaga anterior' : 'Próxima vaga'}
      className="grid size-10 place-items-center rounded-full border border-vinho-escuro/25 bg-white/40 text-vinho-escuro backdrop-blur-sm transition-colors duration-300 hover:border-rosa hover:bg-white/80"
    >
      <Icone nome="seta" tamanho={16} className={direcao === 'anterior' ? 'rotate-180' : undefined} />
    </button>
  )
}

// Carrossel de vagas em destaque: 3 cartões à vista, o primeiro em foco (rosa cheio).
// Avança sozinho; pausa com o mouse em cima ou com foco dentro. Sem autoplay se reduzir movimentos.
function CarrosselVagas({ className }) {
  const vagas = useVagasEmDestaque()
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)
  const total = vagas.length

  useEffect(() => {
    if (total < 2 || pausado || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setIndice((i) => (i + 1) % total), INTERVALO)
    return () => clearInterval(id)
  }, [total, pausado])

  if (!total) return null
  const ir = (i) => setIndice((i + total) % total)

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Vagas em destaque"
      className={cn('w-full', className)}
      onPointerEnter={() => setPausado(true)}
      onPointerLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <p className="mb-6 text-xs font-semibold tracking-[0.3em] text-vinho-escuro uppercase">Vagas em destaque</p>

      <div className="-mx-4 overflow-hidden px-4 py-6 [mask-image:linear-gradient(to_right,black_82%,transparent)]">
        <div
          className="flex gap-5 transition-transform duration-700 ease-bloom motion-reduce:transition-none"
          style={{ transform: `translateX(calc(-${indice} * (15.25rem + 1.25rem)))` }}
        >
          {/* As duas primeiras se repetem no fim para a janela nunca ficar com espaço vazio. */}
          {[...vagas, ...(total >= 3 ? vagas.slice(0, 2) : [])].map((vaga, i) => (
            <CartaoVaga key={`${vaga.empresaId}-${vaga.id}-${i}`} vaga={vaga} ativo={i === indice} oculto={i < indice || i > indice + 2} />
          ))}
        </div>
      </div>

      {total > 1 && (
        <div className="mt-4 flex items-center gap-5 pl-[min(19rem,32%)]">
          <BotaoSeta direcao="anterior" aoClicar={() => ir(indice - 1)} />
          <div className="flex items-center gap-2">
            {vagas.map((vaga, i) => (
              <button
                key={`${vaga.empresaId}-${vaga.id}`}
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ir para a vaga ${i + 1}: ${vaga.titulo}`}
                aria-current={i === indice || undefined}
                className={cn('h-1.5 rounded-full transition-all duration-500', i === indice ? 'w-5 bg-vinho-escuro' : 'w-1.5 bg-vinho-escuro/25 hover:bg-vinho-escuro/50')}
              />
            ))}
          </div>
          <BotaoSeta direcao="proxima" aoClicar={() => ir(indice + 1)} />
        </div>
      )}
    </section>
  )
}

export default CarrosselVagas
