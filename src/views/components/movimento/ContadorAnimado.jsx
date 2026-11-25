import { useEffect, useRef, useState } from 'react'
import { useInView, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

import { cn } from '../../lib/cn'

function ContadorAnimado({ valor, duracao = 1.4, prefixo = '', sufixo = '', casas = 0, className }) {
  const ref = useRef(null)
  const visivel = useInView(ref, { once: true, margin: '-60px' })
  const reduzir = useReducedMotion()
  const bruto = useMotionValue(0)
  const mola = useSpring(bruto, { duration: duracao * 1000, bounce: 0 })
  const [exibido, setExibido] = useState(0)

  useEffect(() => {
    if (visivel) bruto.set(Number(valor) || 0)
  }, [visivel, valor, bruto])

  useEffect(() => mola.on('change', (v) => setExibido(v)), [mola])

  const numero = reduzir ? Number(valor) || 0 : exibido
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefixo}
      {numero.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}
      {sufixo}
    </span>
  )
}

export default ContadorAnimado
