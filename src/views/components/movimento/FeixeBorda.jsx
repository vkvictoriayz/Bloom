import { motion, useReducedMotion } from 'framer-motion'

/**
 * Feixe de luz que percorre a borda do elemento pai (que precisa ser relative e ter cantos arredondados).
 * Inspirado em "Border Beam" (Magic UI), em tons de rosa da Bloom e bem discreto.
 */
function FeixeBorda({ raio = 40, tamanho = 140, duracao = 9, de = '#e3a1b5', ate = '#9c4a63' }) {
  const reduzir = useReducedMotion()
  if (reduzir) return null
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
    >
      <motion.div
        className="absolute aspect-square"
        style={{
          width: tamanho,
          offsetPath: `rect(0 auto auto 0 round ${raio}px)`,
          background: `linear-gradient(to left, ${de}, ${ate}, transparent)`,
        }}
        initial={{ offsetDistance: '0%' }}
        animate={{ offsetDistance: '100%' }}
        transition={{ repeat: Infinity, ease: 'linear', duration: duracao }}
      />
    </div>
  )
}

export default FeixeBorda
