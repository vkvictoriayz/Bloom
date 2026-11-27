import { forwardRef, useId } from 'react'
import { cn } from '../../lib/cn'

export const estiloControle =
  'w-full rounded-md border border-linha-forte bg-branco px-3.5 text-sm text-tinta placeholder:text-suave transition-colors hover:border-suave focus:border-vinho focus:ring-[3px] focus:ring-vinho/30 focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-papel-2 disabled:text-suave aria-invalid:border-erro'

export const Entrada = forwardRef(function Entrada({ className, ...props }, ref) {
  return <input ref={ref} className={cn(estiloControle, 'h-11', className)} {...props} />
})

export const AreaTexto = forwardRef(function AreaTexto({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(estiloControle, 'min-h-28 py-3 leading-relaxed', className)} {...props} />
})

export const Selecao = forwardRef(function Selecao({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(estiloControle, 'h-11 cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  )
})

export function Campo({ rotulo, opcional, obrigatorio, ajuda, erro, acessorio, rotuloOculto, className, children }) {
  const id = useId()
  const idAjuda = `${id}-ajuda`
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className={cn('flex items-baseline justify-between gap-3', rotuloOculto && 'sr-only')}>
        <label htmlFor={id} className="text-sm font-semibold text-tinta-2">
          {rotulo}
          {obrigatorio && (
            <>
              <span className="ml-0.5 text-rosa" aria-hidden="true">*</span>
              <span className="sr-only"> (obrigatório)</span>
            </>
          )}
          {opcional && <span className="ml-1 font-normal text-suave">(opcional)</span>}
        </label>
        {acessorio}
      </div>
      {children({
        id,
        'aria-describedby': ajuda || erro ? idAjuda : undefined,
        'aria-invalid': erro ? true : undefined,
      })}
      {(erro || ajuda) && (
        <p id={idAjuda} className={cn('text-xs', erro ? 'text-erro' : 'text-suave')}>
          {erro || ajuda}
        </p>
      )}
    </div>
  )
}

export function Aviso({ tipo = 'info', className, children, ...props }) {
  const cores = {
    info: 'border-linha bg-papel-2 text-tinta-2',
    sucesso: 'border-sucesso/25 bg-sucesso-claro text-sucesso',
    erro: 'border-erro/25 bg-erro-claro text-erro',
    alerta: 'border-alerta/25 bg-alerta-claro text-alerta',
  }
  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={cn('rounded-md border px-4 py-3 text-sm leading-relaxed', cores[tipo], className)}
      {...props}
    >
      {children}
    </div>
  )
}
