import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

import Icone from './Icone'
import { Borboleta } from './Logo'
import { cn } from '../lib/cn'

const ETAPAS = [
  { rotulo: 'Candidatura enviada', detalhe: 'Você enviou currículo e apresentação.', icone: 'documento' },
  { rotulo: 'Em análise', detalhe: 'A empresa abriu sua candidatura.', icone: 'olho' },
  { rotulo: 'Entrevista', detalhe: 'Conversa marcada pelas mensagens.', icone: 'mensagem' },
  { rotulo: 'Aprovada', detalhe: 'Parabéns! A empresa vai entrar em contato.', icone: 'trofeu' },
]

function PreviaJornada() {
  const ref = useRef(null)
  const visivel = useInView(ref, { once: true, margin: '-80px' })
  const reduzir = useReducedMotion()
  const ativo = reduzir || visivel

  return (
    <div ref={ref} className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-papel p-6 sm:p-10">
      <Borboleta tamanho={300} className="pointer-events-none absolute -right-16 -bottom-20 rotate-[-12deg] text-blush" />
      <figure className="relative w-full max-w-sm">
        <figcaption className="mb-3 text-xs font-bold tracking-[0.14em] text-suave uppercase">Exemplo de acompanhamento</figcaption>
        <div className="rounded-2xl border border-linha bg-branco p-5 shadow-[0_18px_40px_-28px_rgba(94,26,50,0.45)]">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blush text-vinho" aria-hidden="true">
              <Icone nome="maleta" tamanho={20} />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-tinta">Desenvolvedora Front-end Júnior</span>
              <span className="block text-xs text-suave">Remoto · CLT</span>
            </span>
          </div>
          <ol className="relative mt-5 flex flex-col gap-4">
            <span aria-hidden="true" className="absolute top-3 bottom-3 left-[15px] w-px bg-linha" />
            <motion.span
              aria-hidden="true"
              className="absolute top-3 left-[15px] w-px origin-top bg-vinho"
              style={{ bottom: 12 }}
              initial={{ scaleY: reduzir ? 1 : 0 }}
              animate={{ scaleY: ativo ? 1 : 0 }}
              transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />
            {ETAPAS.map((e, i) => (
              <motion.li
                key={e.rotulo}
                className="relative flex gap-3"
                initial={{ opacity: reduzir ? 1 : 0.35 }}
                animate={{ opacity: ativo ? 1 : 0.35 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.6 }}
              >
                <motion.span
                  className={cn('relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-branco')}
                  initial={{ backgroundColor: reduzir ? '#85243d' : '#f3ebe7', color: reduzir ? '#ffffff' : '#6b5f63' }}
                  animate={ativo ? { backgroundColor: '#85243d', color: '#ffffff' } : {}}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.6 }}
                >
                  <Icone nome={e.icone} tamanho={14} />
                </motion.span>
                <span className="pt-0.5">
                  <span className="block text-sm font-semibold text-tinta">{e.rotulo}</span>
                  <span className="block text-xs text-suave">{e.detalhe}</span>
                </span>
              </motion.li>
            ))}
          </ol>
        </div>
      </figure>
    </div>
  )
}

export default PreviaJornada
