import { Link } from 'react-router-dom'

import Icone from './Icone'
import { Borboleta } from './Logo'
import FaixaMarcas from './ui/FaixaMarcas'
import { cn } from '../lib/cn'

// Alternância rosa e branco, ajustada ao fundo claro da Bloom.
const ROSAS = ['bg-rosa text-white', 'bg-blush text-vinho-escuro', 'bg-vinho text-white', 'bg-[#f0d6de] text-vinho-escuro']
const BRANCO = 'border border-rosa/15 bg-white text-vinho-escuro'

// Carrossel horizontal contínuo de cards. Cada item: { titulo, descricao, icone, para, acao }.
// rotulo: texto do pequeno selo no topo do card (ex.: "Recurso").
function CarrosselAreas({ itens, rotulo = 'Recurso', rotuloRegiao = 'Recursos da Bloom' }) {
  // Com quantidade ímpar, a sequência se repete uma vez para a alternância rosa/branco
  // continuar certa no ponto em que a faixa recomeça.
  const sequencia = itens.length % 2 ? [...itens, ...itens] : itens

  const cartoes = sequencia.map((item, i) => {
    const original = i % itens.length
    const rosa = i % 2 === 0
    return (
      <Link
        key={`${item.titulo}-${i}`}
        to={item.para}
        aria-hidden={i >= itens.length ? true : undefined}
        tabIndex={i >= itens.length ? -1 : undefined}
        className={cn(
          'group relative flex h-56 w-44 flex-col overflow-hidden rounded-lg p-4 shadow-[0_10px_28px_-12px_rgba(94,26,50,0.35)] transition-[transform,box-shadow] duration-300 ease-bloom hover:-translate-y-2 hover:shadow-[0_18px_36px_-14px_rgba(94,26,50,0.45)] sm:h-64 sm:w-52 sm:p-5',
          rosa ? ROSAS[(i / 2) % ROSAS.length] : BRANCO
        )}
      >
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              'grid size-7 place-items-center rounded-full transition-transform duration-300 group-hover:scale-110',
              rosa ? 'bg-white/25' : 'bg-blush text-rosa'
            )}
          >
            <Icone nome={item.icone} tamanho={14} />
          </span>
          <span className="text-[11px] font-semibold tracking-[0.18em] uppercase opacity-70 tabular-nums">
            {rotulo} · {String(original + 1).padStart(2, '0')}
          </span>
        </span>
        <h3 className="mt-auto font-display text-base leading-[1.08] break-words sm:text-[1.15rem]">{item.titulo}</h3>
        <p className="mt-2 line-clamp-4 text-[11px] leading-snug opacity-80 sm:text-xs">{item.descricao}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold opacity-90">
          {item.acao} <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
        </span>
        <Borboleta
          tamanho={120}
          className="pointer-events-none absolute -top-6 -right-8 rotate-[-18deg] opacity-[0.12] transition-transform duration-500 group-hover:rotate-[-8deg]"
        />
      </Link>
    )
  })

  return <FaixaMarcas itens={cartoes} duracao={60} rotulo={rotuloRegiao} className="[&_li]:pr-3 sm:[&_li]:pr-4 [&_ul]:py-4" />
}

export default CarrosselAreas
