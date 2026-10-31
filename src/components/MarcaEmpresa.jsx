import { cn } from '../lib/cn'

const TAMANHOS = {
  sm: 'size-10 rounded-md',
  md: 'size-12 rounded-md',
  lg: 'size-20 rounded-lg',
  xl: 'size-28 rounded-xl',
}

const LADO_PX = { sm: 40, md: 48, lg: 80, xl: 112 }

// Siglas longas ("ipiranga") encolhem para caber no quadro.
function tamanhoFonte(sigla, tamanho) {
  const lado = LADO_PX[tamanho]
  return Math.min(lado * 0.26, (lado * 0.84) / (sigla.length * 0.66))
}

// Marca da empresa: o logo oficial quando a empresa o envia (PERFIL_EMPRESA.logo)
// e, até lá, a sigla na cor institucional — nunca uma imagem de terceiros.
function MarcaEmpresa({ empresa, tamanho = 'md', className }) {
  if (!empresa) return null

  if (empresa.logo) {
    return (
      <span className={cn('grid shrink-0 place-items-center overflow-hidden border border-linha bg-branco p-1.5', TAMANHOS[tamanho], className)}>
        <img src={empresa.logo} alt="" className="h-full w-full object-contain" />
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
