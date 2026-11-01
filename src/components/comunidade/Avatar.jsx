import { iniciais } from '../../hooks/useSessao'
import { cn } from '../../lib/cn'

// Foto da integrante: por enquanto, as iniciais sobre um fundo de marca.
const TAMANHOS = { sm: 'size-9 text-xs', md: 'size-11 text-sm', lg: 'size-16 text-xl' }

function Avatar({ nome, tamanho = 'md', className }) {
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
