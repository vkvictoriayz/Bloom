import Icone from '../Icone'
import { cn } from '../../lib/cn'

function SeloPremium({ className, compacto = false }) {
  return (
    <span
      title="Conta Premium"
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-vinho to-rosa font-bold text-white shadow-sm',
        compacto ? 'size-5 justify-center' : 'px-2.5 py-0.5 text-[11px] tracking-wide uppercase',
        className
      )}
    >
      <Icone nome="coroa" tamanho={compacto ? 11 : 12} />
      {compacto ? <span className="sr-only">Premium</span> : 'Premium'}
    </span>
  )
}

export default SeloPremium
