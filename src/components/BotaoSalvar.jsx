import Icone from './Icone'
import { useDadosLocais } from '../hooks/useDadosLocais'
import { alternarSalva, EVENTO_SALVAS, lerSalvas } from '../services/salvas'
import { cn } from '../lib/cn'

// Coração que salva/remove a vaga. Lê e grava direto no armazenamento,
// então todas as telas abertas ficam em sincronia.
function BotaoSalvar({ vaga, comTexto = false, className }) {
  const salvas = useDadosLocais(lerSalvas, [EVENTO_SALVAS])
  const salva = salvas.includes(String(vaga.id))
  const rotulo = salva ? 'Remover das vagas salvas' : 'Salvar vaga'

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        alternarSalva(vaga.id)
      }}
      aria-pressed={salva}
      aria-label={comTexto ? undefined : `${rotulo}: ${vaga.titulo}`}
      title={rotulo}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors',
        comTexto ? 'h-10 border border-linha-forte bg-branco px-4 hover:border-tinta' : 'size-10 hover:bg-blush',
        salva ? 'text-vinho' : 'text-suave hover:text-vinho',
        className
      )}
    >
      <Icone nome="coracao" preenchido={salva} tamanho={comTexto ? 18 : 20} />
      {comTexto && (salva ? 'Salva' : 'Salvar')}
    </button>
  )
}

export default BotaoSalvar
