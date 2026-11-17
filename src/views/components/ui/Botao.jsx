import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const botaoVariantes = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors duration-150 [&_.icone-seta]:transition-transform [&_.icone-seta]:duration-200 [&_.icone-seta]:ease-(--ease-bloom) hover:[&_.icone-seta]:translate-x-1 disabled:cursor-not-allowed disabled:opacity-55 [&_svg]:shrink-0',
  {
    variants: {
      variante: {
        primario: 'bg-vinho text-white hover:bg-vinho-escuro active:bg-vinho-escuro active:brightness-90',
        secundario: 'border border-linha-forte bg-branco text-tinta hover:border-tinta hover:bg-papel-2 active:bg-papel-2',
        fantasma: 'text-tinta-2 hover:bg-papel-2 hover:text-tinta active:bg-linha',
        claro: 'bg-branco text-vinho-escuro hover:bg-blush',
        contornoClaro: 'border border-white/40 text-white hover:border-white hover:bg-white/10',
        link: 'text-vinho underline-offset-4 hover:underline',
      },
      tamanho: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-[15px]',
        icone: 'size-10',
      },
    },
    compoundVariants: [{ variante: 'link', className: 'h-auto px-0' }],
    defaultVariants: { variante: 'primario', tamanho: 'md' },
  }
)

const Botao = forwardRef(function Botao(
  { as: Componente = 'button', variante, tamanho, className, type, ...props },
  ref
) {
  return (
    <Componente
      ref={ref}
      type={Componente === 'button' ? type ?? 'button' : type}
      className={cn(botaoVariantes({ variante, tamanho }), className)}
      {...props}
    />
  )
})

export default Botao
