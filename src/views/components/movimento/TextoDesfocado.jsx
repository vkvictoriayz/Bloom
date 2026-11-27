import { motion, useReducedMotion } from 'framer-motion'

/**
 * Texto que aparece palavra por palavra, saindo do desfoque.
 * Inspirado em "Blur Text" (React Bits), com o ritmo e a suavidade da Bloom.
 * O texto completo fica disponível para leitores de tela (as palavras animadas são decorativas).
 */
function TextoDesfocado({ texto, atraso = 0.08, className }) {
  const reduzir = useReducedMotion()
  if (reduzir || typeof texto !== 'string') return <span className={className}>{texto}</span>

  const palavras = texto.split(' ')
  return (
    <span className={className}>
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true">
        {palavras.map((palavra, i) => (
          <motion.span
            key={`${palavra}-${i}`}
            className="inline-block whitespace-pre"
            initial={{ opacity: 0, filter: 'blur(10px)', y: 6 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 + i * atraso, ease: [0.22, 1, 0.36, 1] }}
          >
            {palavra}
            {i < palavras.length - 1 ? ' ' : ''}
          </motion.span>
        ))}
      </span>
    </span>
  )
}

export default TextoDesfocado
