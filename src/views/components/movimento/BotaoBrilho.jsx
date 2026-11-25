import { forwardRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { cn } from '../../lib/cn'

const LinkMovel = motion.create(Link)

const BotaoBrilho = forwardRef(function BotaoBrilho({ to, children, className, variante = 'cheio', ...resto }, ref) {
  const reduzir = useReducedMotion()
  const Componente = to ? LinkMovel : motion.button
  const cheio = variante === 'cheio'
  return (
    <Componente
      ref={ref}
      to={to}
      {...resto}
      whileHover={reduzir ? undefined : { scale: 1.02 }}
      whileTap={reduzir ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.5 }}
      className={cn(
        'group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full px-6 text-base font-semibold',
        cheio ? 'bg-vinho text-white hover:bg-vinho-escuro' : 'border border-linha-forte bg-branco text-tinta hover:border-vinho',
        'transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-vinho/30 disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {!reduzir && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full p-px"
          style={{
            background: `linear-gradient(-75deg, transparent 30%, ${cheio ? 'rgba(255,255,255,0.7)' : 'rgba(133,36,61,0.55)'} 50%, transparent 70%)`,
            backgroundSize: '200% 100%',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
          }}
          initial={{ backgroundPosition: '100% 0', opacity: 0 }}
          animate={{ backgroundPosition: ['100% 0', '0% 0'], opacity: [0, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear', repeatDelay: 2.2 }}
        />
      )}
      {!reduzir && cheio && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/20 opacity-0 transition-[left,opacity] duration-700 ease-out group-hover:left-[120%] group-hover:opacity-100" />
      )}
    </Componente>
  )
})

export default BotaoBrilho
