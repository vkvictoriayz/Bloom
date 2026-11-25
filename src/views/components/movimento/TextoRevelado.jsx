import { motion, useReducedMotion } from 'framer-motion'

const SUAVE = [0.22, 1, 0.36, 1]

function TextoRevelado({ texto, atraso = 0, por = 'palavra', className, aoCarregar = false }) {
  const reduzir = useReducedMotion()
  if (reduzir) return <span className={className}>{texto}</span>
  const partes = por === 'letra' ? texto.split('') : texto.split(' ')
  const intervalo = por === 'letra' ? 0.02 : 0.06
  const disparo = aoCarregar ? { animate: 'mostrar' } : { whileInView: 'mostrar', viewport: { once: true, margin: '-40px' } }
  return (
    <motion.span
      className={className}
      style={{ display: 'inline' }}
      initial="oculto"
      {...disparo}
      variants={{ oculto: {}, mostrar: { transition: { staggerChildren: intervalo, delayChildren: atraso } } }}
      aria-label={texto}
    >
      {partes.map((parte, i) => (
        <span key={i} aria-hidden="true" className="relative inline-block overflow-hidden pb-[0.08em] align-top">
          <motion.span
            className="inline-block will-change-transform"
            variants={{ oculto: { y: '110%' }, mostrar: { y: '0%', transition: { duration: 0.7, ease: SUAVE } } }}
          >
            {por === 'letra' ? (parte === ' ' ? ' ' : parte) : i < partes.length - 1 ? `${parte} ` : parte}
          </motion.span>
        </span>
      ))}
    </motion.span>
  )
}

export default TextoRevelado
