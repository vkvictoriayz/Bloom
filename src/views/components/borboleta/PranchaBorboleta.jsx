import { motion, useReducedMotion } from 'framer-motion'

import { cn } from '../../lib/cn'

/**
 * Borboleta da Bloom como ilustração de prancha botânica:
 * traço de nanquim (vinho) com manchas de cor chapadas e levemente fora de registro,
 * como numa impressão risográfica. O traço se desenha uma vez ao abrir; depois fica parado.
 * No hover, a cor desliza alguns milímetros em relação ao traço (efeito de impressão).
 */

const ASAS_SUPERIORES = ['M49.2 45.6C43 30 28 8 5.5 5C3.5 23 20 41 49.2 45.6Z', 'M50.8 45.6C57 30 72 8 94.5 5C96.5 23 80 41 50.8 45.6Z']
const ASAS_INFERIORES = [
  'M48.6 48.4C40 46.2 31 44.8 23.5 44.6C21 56 26.5 70 35 75.5C40.5 76.5 46 62 48.6 48.4Z',
  'M51.4 48.4C60 46.2 69 44.8 76.5 44.6C79 56 73.5 70 65 75.5C59.5 76.5 54 62 51.4 48.4Z',
]

// Nervuras (metade esquerda; a direita é espelhada).
const NERVURAS_ESQ = [
  'M47.6 43.6C39 32.5 27 18.5 12 9.5',
  'M47.2 44.2C37 37.5 25 30.5 9.5 22.5',
  'M47.4 44.8C40 41.5 30 37.5 19.5 34.6',
  'M48 49.6C43 55 37.5 63 34 71.5',
  'M47.8 49.2C40.5 50 32.5 52 26.5 56.5',
]
const espelhar = (d) => d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${(100 - Number(x)).toFixed(1)} ${y}`)
const NERVURAS = [...NERVURAS_ESQ, ...NERVURAS_ESQ.map(espelhar)]

const ANTENAS = ['M49.4 39C48 33.5 45.5 29.5 42.5 27.5', 'M50.6 39C52 33.5 54.5 29.5 57.5 27.5']

// Pequenos pontos de tinta ao redor (pólen), posicionados à mão.
const PONTOS = [
  [16, 70, 0.7],
  [84, 66, 0.55],
  [9, 47, 0.45],
  [91, 39, 0.6],
  [30, 79, 0.4],
  [70, 3, 0.5],
]

const TINTA = '#6e1e39'

function PranchaBorboleta({ className, desenhar = true }) {
  const reduzir = useReducedMotion()
  const animar = desenhar && !reduzir
  const traco = (i) =>
    animar
      ? { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 1.6, delay: 0.15 + i * 0.06, ease: [0.65, 0, 0.35, 1] } }
      : {}

  return (
    <svg viewBox="-2 -2 104 84" className={cn('group/prancha overflow-visible', className)} role="img" aria-label="Ilustração da borboleta da Bloom">
      {/* Manchas de cor: deslocadas do traço, como impressão fora de registro */}
      <g className="transition-transform duration-[900ms] ease-out group-hover/prancha:translate-x-[1.4px] group-hover/prancha:translate-y-[1.2px] motion-reduce:transition-none">
      <motion.g
        transform="translate(2.2 1.6)"
        initial={animar ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.1 }}
      >
        {ASAS_SUPERIORES.map((d) => (
          <path key={d} d={d} fill="#efbccb" />
        ))}
        {ASAS_INFERIORES.map((d) => (
          <path key={d} d={d} fill="#f6d6c9" />
        ))}
      </motion.g>
      </g>

      {/* Traço de nanquim */}
      <g fill="none" stroke={TINTA} strokeLinecap="round" strokeLinejoin="round">
        {[...ASAS_SUPERIORES, ...ASAS_INFERIORES].map((d, i) => (
          <motion.path key={d} d={d} strokeWidth={0.55} {...traco(i)} />
        ))}
        {NERVURAS.map((d, i) => (
          <motion.path key={d} d={d} strokeWidth={0.28} opacity={0.75} {...traco(4 + i * 0.4)} />
        ))}
        {ANTENAS.map((d, i) => (
          <motion.path key={d} d={d} strokeWidth={0.4} {...traco(2 + i)} />
        ))}
        <motion.ellipse cx="50" cy="50" rx="1.25" ry="11" strokeWidth={0.5} fill={TINTA} {...traco(1)} />
      </g>
      <circle cx="42.5" cy="27.5" r="0.75" fill={TINTA} />
      <circle cx="57.5" cy="27.5" r="0.75" fill={TINTA} />
      {PONTOS.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={TINTA} opacity="0.35" />
      ))}
    </svg>
  )
}

export default PranchaBorboleta
