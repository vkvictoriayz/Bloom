import { cn } from '../../lib/cn'

function CartaoBrilho({ children, className, conteudoClassName, duracao = 6, pausado = false, ...resto }) {
  return (
    <div className={cn('cartao-brilho relative isolate overflow-hidden rounded-2xl p-[1.5px]', className)} style={{ '--brilho-duracao': `${duracao}s` }} {...resto}>
      <span aria-hidden="true" className={cn('cartao-brilho-anel absolute -inset-[60%] -z-10', pausado && '[animation-play-state:paused]')} />
      <div className={cn('relative h-full rounded-[calc(1rem-1.5px)] bg-branco', conteudoClassName)}>{children}</div>
    </div>
  )
}

export default CartaoBrilho
