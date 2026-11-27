import { useEffect, useRef, useState } from 'react'

import BorboletaViva from './BorboletaViva'
import { cn } from '../../lib/cn'

/**
 * Borboleta decorativa da identidade Bloom.
 * Usa a BorboletaViva (asas animadas) e acrescenta: aparição suave ao entrar na tela,
 * flutuação discreta, rotação e transparência. Sempre decorativa (aria-hidden, sem clique).
 *
 * Posicione pelo className (ex.: "top-10 -right-12 w-64"); o elemento já é absolute.
 */
function BorboletaDecorativa({
  className,
  tom = 'suave',
  modo = 'planando',
  ritmo = '5s',
  opacidade = 0.5,
  rotacao = 0,
  flutuar = true,
  duracaoFlutuar = '9s',
  atraso = '0s',
}) {
  const ref = useRef(null)
  const [visivel, setVisivel] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const alvo = ref.current
    if (!alvo || typeof IntersectionObserver === 'undefined') return
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true)
          observador.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    )
    observador.observe(alvo)
    return () => observador.disconnect()
  }, [])

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none absolute block select-none', className)}
      style={{ rotate: `${rotacao}deg` }}
    >
      <span
        className="block transition-[opacity,transform] duration-[1400ms] ease-bloom motion-reduce:transition-none"
        style={{
          opacity: visivel ? opacidade : 0,
          transform: visivel ? 'none' : 'translateY(18px) scale(0.88)',
          transitionDelay: atraso,
        }}
      >
        <span
          className={cn('block', flutuar && 'motion-safe:animate-[flutuar_var(--bd-flutuar)_ease-in-out_infinite]')}
          style={{ '--bd-flutuar': duracaoFlutuar, animationDelay: atraso }}
        >
          <BorboletaViva tom={tom} modo={modo} ritmo={ritmo} className="w-full" />
        </span>
      </span>
    </span>
  )
}

export default BorboletaDecorativa
