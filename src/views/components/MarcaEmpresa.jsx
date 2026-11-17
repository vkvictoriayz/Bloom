import { IconeAvatar } from './IconePerfil'
import { ehIcone } from '../data/icones'
import { cn } from '../lib/cn'
import { urlImagem } from '../services/api'

const TAMANHOS = {
  sm: 'size-10 rounded-md',
  md: 'size-12 rounded-md',
  lg: 'size-20 rounded-lg',
  xl: 'size-28 rounded-xl',
}

const LADO_PX = { sm: 40, md: 48, lg: 80, xl: 112 }

function tamanhoFonte(sigla, tamanho) {
  const lado = LADO_PX[tamanho]
  return Math.min(lado * 0.26, (lado * 0.84) / (sigla.length * 0.66))
}

function MarcaEmpresa({ empresa, tamanho = 'md', className }) {
  if (!empresa) return null

  if (ehIcone(empresa.foto) && !empresa.logo) return <IconeAvatar valor={empresa.foto} forma="quadrado" className={cn(TAMANHOS[tamanho], className)} />
  const logo = urlImagem(ehIcone(empresa.foto) ? empresa.logo : empresa.foto || empresa.logo)
  if (logo) {
    return (
      <span className={cn('grid shrink-0 place-items-center overflow-hidden border border-linha bg-branco p-1.5', TAMANHOS[tamanho], className)}>
        <img src={logo} alt="" className="h-full w-full object-contain" />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn('grid shrink-0 place-items-center font-bold tracking-wide uppercase', TAMANHOS[tamanho], className)}
      style={{ backgroundColor: empresa.cor, color: empresa.corTexto, fontSize: tamanhoFonte(empresa.sigla, tamanho) }}
    >
      {empresa.sigla}
    </span>
  )
}

export default MarcaEmpresa
