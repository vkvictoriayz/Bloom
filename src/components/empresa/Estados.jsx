import Avatar from '../comunidade/Avatar'
import { Aviso } from '../ui/Campo'
import Esqueleto from '../ui/Esqueleto'
import { cn } from '../../lib/cn'

// Estados comuns das páginas da empresa.

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

// Cartão de talento: só dados públicos da comunidade (nome, área,
// interesses, apresentação). Usado em Explorar e no Banco de talentos.
export function CartaoTalento({ talento, acao }) {
  return (
    <article className="cartao flex h-full flex-col p-5">
      <div className="flex items-center gap-3">
        <Avatar nome={talento.nome} tamanho="md" />
        <div className="min-w-0">
          <h3 className="truncate font-bold text-tinta">{talento.nome}</h3>
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
