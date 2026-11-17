import { IconeAvatar } from '../IconePerfil'
import Avatar from './Avatar'
import { iniciais } from '../../hooks/useSessao'
import { urlImagem } from '../../services/api'
import { cn } from '../../lib/cn'

export function CapaComunidade({ capa, className, children }) {
  return (
    <div className={cn('relative overflow-hidden bg-linear-to-br from-vinho via-vinho-escuro to-tinta', className)}>
      {capa ? (
        <img src={urlImagem(`/imagens/${capa}`)} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-[0.12]">
          <defs>
            <pattern id="pontos-comunidade" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.6" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pontos-comunidade)" />
        </svg>
      )}
      {children}
    </div>
  )
}

export function IconeComunidade({ comunidade, className }) {
  if (comunidade.icone) return <IconeAvatar valor={comunidade.icone} forma="quadrado" className={className} />
  return (
    <span aria-hidden="true" className={cn('grid shrink-0 place-items-center rounded-[22%] bg-blush font-display text-vinho', className)}>
      {iniciais(comunidade.nome)}
    </span>
  )
}

export function PilhaAvatares({ pessoas = [], total = pessoas.length, tamanho = 'sm', className }) {
  const resto = Math.max(0, total - pessoas.length)
  if (!pessoas.length && !resto) return null
  return (
    <span className={cn('flex items-center', className)} aria-label={`${total} ${total === 1 ? 'participante' : 'participantes'}`}>
      {pessoas.map((p, i) => (
        <span key={p.id} className={cn('rounded-full ring-2 ring-branco', i > 0 && '-ml-2.5')} title={p.nome}>
          <Avatar nome={p.nome} foto={p.foto} tamanho={tamanho} className="size-8 text-[11px]" />
        </span>
      ))}
      {resto > 0 && (
        <span className="-ml-2.5 grid size-8 place-items-center rounded-full bg-papel-2 text-[11px] font-bold text-tinta-2 ring-2 ring-branco">+{resto}</span>
      )}
    </span>
  )
}
