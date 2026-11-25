import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import { cn } from '../../lib/cn'

function PalavrasAlternadas({ palavras, intervalo = 2800, className }) {
  const [indice, setIndice] = useState(0)
  const reduzir = useReducedMotion()

  useEffect(() => {
    if (reduzir || palavras.length < 2) return undefined
    const t = setInterval(() => setIndice((i) => (i + 1) % palavras.length), intervalo)
    return () => clearInterval(t)
  }, [palavras.length, intervalo, reduzir])

  const atual = palavras[indice]
  return (
    <span className={cn('relative inline-block align-bottom', className)} style={{ perspective: 800, minHeight: '1.1em' }}>
      <span className="sr-only">{palavras.join(', ')}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={atual}
          aria-hidden="true"
          className="inline-block whitespace-nowrap"
          initial="entrar"
          animate="ficar"
          exit="sair"
          variants={{ entrar: {}, ficar: { transition: { staggerChildren: 0.035 } }, sair: { transition: { staggerChildren: 0.02 } } }}
        >
          {atual.split('').map((letra, i) => (
            <motion.span
              key={`${letra}-${i}`}
              className="inline-block"
              style={{ transformOrigin: '50% 100%' }}
              variants={{
                entrar: { rotateX: 80, y: '0.35em', opacity: 0 },
                ficar: { rotateX: 0, y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.2, 0.65, 0.3, 0.9] } },
                sair: { rotateX: -70, y: '-0.3em', opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
              }}
            >
              {letra === ' ' ? ' ' : letra}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export default PalavrasAlternadas
