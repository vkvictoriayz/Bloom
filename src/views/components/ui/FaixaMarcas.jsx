import { cn } from '../../lib/cn'

// Faixa contínua (LogoSlider do VengeanceUI). A lista é duplicada e desliza
// exatamente -50%; cada item usa padding (não gap), então o laço não salta.
// Pausa no hover/foco; com movimento reduzido vira uma lista que quebra linha.
function FaixaMarcas({ itens, duracao = 50, rotulo, className }) {
  return (
    <div
      role="region"
      aria-label={rotulo}
      className={cn(
        'group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:[mask-image:none]',
        className
      )}
      style={{ '--faixa-duracao': `${duracao}s` }}
    >
      <ul className="flex w-max animate-faixa group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:gap-y-4">
        {itens.map((item, i) => (
          <li key={i} className="shrink-0 pr-4">
            {item}
          </li>
        ))}
        {itens.map((item, i) => (
          <li key={`copia-${i}`} className="shrink-0 pr-4 motion-reduce:hidden" aria-hidden="true" inert>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FaixaMarcas
