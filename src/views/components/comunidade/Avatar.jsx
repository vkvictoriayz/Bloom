import { IconeAvatar } from '../IconePerfil'
import { ehIcone } from '../../data/icones'
import { iniciais } from '../../hooks/useSessao'
import { cn } from '../../lib/cn'
import { urlImagem } from '../../services/api'

const TAMANHOS = { sm: 'size-9 text-xs', md: 'size-11 text-sm', lg: 'size-16 text-xl', xl: 'size-28 text-4xl sm:size-36' }

function Avatar({ nome, foto, tamanho = 'md', className }) {
  if (ehIcone(foto)) return <IconeAvatar valor={foto} className={cn(TAMANHOS[tamanho], className)} />
  if (foto) {
    return <img src={urlImagem(foto)} alt="" className={cn('shrink-0 rounded-full object-cover ring-1 ring-linha-forte', TAMANHOS[tamanho], className)} />
  }
  return (
    <span
      aria-hidden="true"
      className={cn('grid shrink-0 place-items-center rounded-full bg-blush font-bold text-vinho-escuro ring-1 ring-linha-forte', TAMANHOS[tamanho], className)}
    >
      {iniciais(nome) || '?'}
    </span>
  )
}

export default Avatar
