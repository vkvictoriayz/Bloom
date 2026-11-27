import { Link } from 'react-router-dom'

import Icone from './Icone'
import { Borboleta } from './Logo'
import MarcaEmpresa from './MarcaEmpresa'
import SeloVerificada from './SeloVerificada'
import { textoVagas } from '../services/publico'
import { cn } from '../lib/cn'

// Cartão de empresa usado na home (carrossel) e na página /empresas.
function CartaoEmpresaVitrine({ empresa, className }) {
  const vagas = empresa.ultimasVagas ?? []

  return (
    <Link
      to={`/empresas/${empresa.id}`}
      className={cn(
        'group relative isolate flex flex-col overflow-hidden rounded-[1.75rem] border border-rosa/10 bg-white/85 p-6 shadow-[0_14px_36px_-28px_rgba(94,26,50,0.5)] backdrop-blur-md',
        'transition-[transform,box-shadow,border-color] duration-500 ease-bloom hover:-translate-y-1.5 hover:border-rosa/30 hover:shadow-[0_22px_44px_-28px_rgba(94,26,50,0.6)]',
        className
      )}
    >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-blush/70 to-transparent" />
      <Borboleta
        tamanho={110}
        className="pointer-events-none absolute -top-4 -right-6 -z-10 rotate-[-16deg] text-rosa/[0.1] transition-transform duration-700 ease-bloom group-hover:rotate-[-6deg]"
      />

      <div className="flex items-start justify-between gap-3">
        <MarcaEmpresa
          empresa={empresa}
          tamanho="lg"
          className="size-16 rounded-2xl border-rosa/10 shadow-[0_10px_22px_-12px_rgba(94,26,50,0.45)] ring-4 ring-white"
        />
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-full border border-rosa/20 bg-white/80 text-vinho-escuro transition-colors duration-300 group-hover:border-rosa group-hover:bg-rosa group-hover:text-white"
        >
          <Icone nome="seta" tamanho={15} className="-rotate-45" />
        </span>
      </div>

      <h3 className="mt-5 flex items-center gap-2 font-display text-[1.35rem] leading-tight text-tinta">
        <span className="truncate">{empresa.nome}</span>
        {empresa.verificada && <SeloVerificada compacto className="px-1 py-1" />}
      </h3>
      <p className="mt-1 truncate text-sm text-suave">{empresa.areaAtuacao || 'Empresa na Bloom'}</p>

      {vagas.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-2" aria-label="Vagas abertas">
          {vagas.slice(0, 2).map((vaga) => (
            <li key={vaga.id} className="flex items-center gap-2.5 rounded-xl border border-rosa/10 bg-papel/80 px-3 py-2">
              <Icone nome="maleta" tamanho={14} className="shrink-0 text-rosa" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-tinta">{vaga.titulo}</span>
              {vaga.modalidade && <span className="shrink-0 text-[11px] text-suave">{vaga.modalidade}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 line-clamp-2 text-sm leading-relaxed text-tinta-2">
          {empresa.descricao || 'A empresa ainda não escreveu a apresentação.'}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs">
        <span className="inline-flex min-w-0 items-center gap-1 text-suave">
          {empresa.localizacao && (
            <>
              <Icone nome="local" tamanho={13} className="shrink-0" />
              <span className="truncate">{empresa.localizacao}</span>
            </>
          )}
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 font-semibold',
            empresa.vagasAbertas ? 'bg-blush text-vinho-escuro' : 'bg-papel-2 text-suave'
          )}
        >
          {textoVagas(empresa.vagasAbertas)}
        </span>
      </div>
    </Link>
  )
}

export default CartaoEmpresaVitrine
