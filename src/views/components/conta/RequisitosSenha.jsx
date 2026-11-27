import Icone from '../Icone'
import { REQUISITOS_SENHA } from '../../utils/senha'
import { cn } from '../../lib/cn'

// Lista viva dos requisitos da senha: cada item fica marcado assim que é atendido.
function RequisitosSenha({ senha, id, className }) {
  const atendidos = REQUISITOS_SENHA.filter((r) => r.ok(senha)).length
  return (
    <div id={id} className={cn('rounded-2xl border border-rosa/10 bg-blush/25 p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-tinta-2">Sua senha precisa ter</p>
        <p className="text-xs text-suave tabular-nums" aria-live="polite">
          {atendidos} de {REQUISITOS_SENHA.length}
        </p>
      </div>
      {/* Barra de progresso */}
      <div className="mt-2.5 flex gap-1" aria-hidden="true">
        {REQUISITOS_SENHA.map((r, i) => (
          <span
            key={r.id}
            className={cn('h-1 flex-1 rounded-full transition-colors duration-300', i < atendidos ? 'bg-rosa' : 'bg-rosa/15')}
          />
        ))}
      </div>
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {REQUISITOS_SENHA.map((r) => {
          const ok = r.ok(senha)
          return (
            <li key={r.id} className={cn('flex items-center gap-2 text-xs transition-colors duration-300', ok ? 'text-vinho-escuro' : 'text-suave')}>
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-4 shrink-0 place-items-center rounded-full border transition-[background-color,border-color,transform] duration-300',
                  ok ? 'scale-100 border-rosa bg-rosa text-white' : 'scale-90 border-rosa/30 bg-white'
                )}
              >
                {ok && <Icone nome="check" tamanho={10} />}
              </span>
              {r.rotulo}
              <span className="sr-only">{ok ? '(atendido)' : '(pendente)'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default RequisitosSenha
