import Avatar from '../comunidade/Avatar'
import Capa from '../candidata/Capa'
import { Aviso } from '../ui/Campo'
import Esqueleto from '../ui/Esqueleto'
import { cn } from '../../lib/cn'

export function Carregando({ quantidade = 3, altura = 'h-24', className }) {
  return (
    <div className={cn('flex flex-col gap-3', className)} aria-busy="true" aria-label="Carregando">
      {Array.from({ length: quantidade }).map((_, i) => (
        <Esqueleto key={i} className={cn('rounded-2xl', altura)} />
      ))}
    </div>
  )
}

export function ErroAoCarregar({ erro, aoTentar }) {
  return (
    <Aviso tipo="erro">
      {erro}{' '}
      {aoTentar && (
        <button type="button" className="font-semibold underline underline-offset-4" onClick={aoTentar}>
          Tentar de novo
        </button>
      )}
    </Aviso>
  )
}

export function CartaoTalento({ talento, acao }) {
  return (
    <article className="cartao flex h-full flex-col overflow-hidden px-5 pb-5 transition-colors hover:border-linha-forte">
      <Capa imagem={talento.capa} className="-mx-5 h-16 w-[calc(100%+2.5rem)] rounded-none sm:h-16" />
      <div className="-mt-7 flex items-end gap-3">
        <span className="relative z-10 rounded-full ring-4 ring-branco">
          <Avatar nome={talento.nome} foto={talento.foto} tamanho="md" />
        </span>
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 font-bold text-tinta">
            <span className="truncate">{talento.nome}</span>
          </h3>
          <p className="truncate text-sm text-suave">{talento.area || 'Área não informada'}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-tinta-2">{talento.bio || 'Sem apresentação publicada.'}</p>
      {talento.interesses?.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Interesses">
          {talento.interesses.slice(0, 5).map((i) => (
            <li key={i} className="rounded-full bg-papel-2 px-2.5 py-0.5 text-xs font-semibold text-tinta-2">
              {i}
            </li>
          ))}
        </ul>
      )}
      {acao && <div className="mt-4">{acao}</div>}
    </article>
  )
}
