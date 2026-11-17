import { cva } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const seloVariantes = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold [&>svg]:size-3.5',
  {
    variants: {
      variante: {
        neutro: 'bg-papel-2 text-tinta-2',
        vinho: 'bg-blush text-vinho',
        sucesso: 'bg-sucesso-claro text-sucesso',
        alerta: 'bg-alerta-claro text-alerta',
        erro: 'bg-erro-claro text-erro',
        contorno: 'border border-linha text-suave',
      },
    },
    defaultVariants: { variante: 'neutro' },
  }
)

function Selo({ variante, className, ...props }) {
  return <span className={cn(seloVariantes({ variante }), className)} {...props} />
}

export default Selo
