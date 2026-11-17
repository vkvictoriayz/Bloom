import Icone from './Icone'
import { cn } from '../lib/cn'

// Selo "Verificada": o vínculo de quem administra a conta com a empresa foi
// confirmado (pelo domínio do e-mail ou pela equipe da Bloom).
function SeloVerificada({ className, compacto = false }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center gap-1 rounded-full bg-sucesso-claro px-2 py-0.5 text-[11px] font-bold text-sucesso', className)}
      title="Empresa verificada: o vínculo de quem administra a conta foi confirmado"
    >
      <Icone nome="check" tamanho={12} />
      {compacto ? <span className="sr-only">Empresa verificada</span> : 'Verificada'}
    </span>
  )
}

export default SeloVerificada
