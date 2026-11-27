import { useRef, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'

import BorboletaViva from './BorboletaViva'
import { cn } from '../../lib/cn'

/**
 * Borboleta interativa da Bloom (mesmo desenho da BorboletaViva / logo).
 *
 * - Aproximação do mouse: inclina e se aproxima de leve.
 * - Mouse sobre as asas: bate as asas. Ao sair, volta a planar.
 * - Mouse longe: volta suavemente ao centro (molas).
 * - Flutuação contínua e aparição suave ao carregar.
 * - Pétalas que acompanham o movimento com atraso.
 * - Clique/toque: pequeno voo e volta.
 * - prefers-reduced-motion: fica parada, sem seguir o mouse nem voar.
 *
 * Ocupa todo o espaço do elemento pai (que define o tamanho). A borboleta fica centralizada.
 */

// Pétalas: posição base (% do contêiner), tamanho, atraso do seguimento e cor.
const PETALAS = [
  { x: 22, y: 30, tam: 14, mola: 28, fator: 1.4, giro: -30, cor: '#e3a1b5' },
  { x: 78, y: 24, tam: 10, mola: 22, fator: 1.7, giro: 40, cor: '#c27a90' },
  { x: 84, y: 66, tam: 16, mola: 18, fator: 1.2, giro: 15, cor: '#f2c9d5' },
  { x: 16, y: 72, tam: 11, mola: 24, fator: 1.6, giro: -55, cor: '#c27a90' },
  { x: 62, y: 84, tam: 8, mola: 20, fator: 1.9, giro: 70, cor: '#e3a1b5' },
  { x: 38, y: 14, tam: 7, mola: 26, fator: 2.0, giro: -10, cor: '#f2c9d5' },
]

function Petala({ p, x, y, reduzir }) {
  const px = useSpring(useTransform(x, (v) => v * p.fator), { stiffness: p.mola, damping: 12 })
  const py = useSpring(useTransform(y, (v) => v * p.fator), { stiffness: p.mola, damping: 12 })
  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{ left: `${p.x}%`, top: `${p.y}%`, x: reduzir ? 0 : px, y: reduzir ? 0 : py }}
    >
      <svg
        viewBox="0 0 20 30"
        width={p.tam}
        height={p.tam * 1.5}
        className="motion-safe:animate-[flutuar_6s_ease-in-out_infinite]"
        style={{ rotate: `${p.giro}deg`, animationDelay: `${p.giro / 20}s` }}
      >
        <path d="M10 1C16 8 18 18 10 29C2 18 4 8 10 1Z" fill={p.cor} opacity="0.75" />
      </svg>
    </motion.span>
  )
}

function BorboletaInterativa({ className, tamanho = 'w-[min(58%,20rem,36vh)]', tom = 'vinho', petalas = true, rotulo }) {
  const reduzir = useReducedMotion()
  const area = useRef(null)
  const corpo = useRef(null)
  const [asas, setAsas] = useState('planando')
  const voando = useRef(false)

  // Deslocamento em direção ao mouse (com molas para suavizar).
  const alvoX = useMotionValue(0)
  const alvoY = useMotionValue(0)
  const alvoGiro = useMotionValue(0)
  const x = useSpring(alvoX, { stiffness: 70, damping: 15, mass: 0.9 })
  const y = useSpring(alvoY, { stiffness: 70, damping: 15, mass: 0.9 })
  const giro = useSpring(alvoGiro, { stiffness: 90, damping: 12 })

  // Voo do clique (animado por quadros-chave, somado ao deslocamento).
  const vooX = useMotionValue(0)
  const vooY = useMotionValue(0)
  const vooGiro = useMotionValue(0)
  const escala = useMotionValue(1)
  const totalX = useTransform([x, vooX], ([a, b]) => a + b)
  const totalY = useTransform([y, vooY], ([a, b]) => a + b)
  const totalGiro = useTransform([giro, vooGiro], ([a, b]) => a + b)
  // A sombra diminui quando a borboleta sobe.
  const sombraEscala = useTransform(totalY, [-180, 0], [0.5, 1])
  const sombraOpacidade = useTransform(totalY, [-180, 0], [0.3, 1])

  function aoMover(e) {
    if (reduzir || voando.current || !corpo.current) return
    const r = corpo.current.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    const raio = r.width * 1.3
    const distancia = Math.hypot(dx, dy)
    if (distancia > raio) return voltar()
    const forca = 1 - distancia / raio
    alvoX.set(dx * 0.14 * forca)
    alvoY.set(dy * 0.1 * forca - 10 * forca)
    alvoGiro.set((dx / raio) * 12)
  }

  function voltar() {
    alvoX.set(0)
    alvoY.set(0)
    alvoGiro.set(0)
  }

  async function voar() {
    if (reduzir || voando.current) return
    voando.current = true
    voltar()
    setAsas('batendo')
    const opcoes = { duration: 1.9, ease: 'easeInOut' }
    await Promise.all([
      animate(vooX, [0, 30, 90, 50, -40, -20, 0], opcoes),
      animate(vooY, [0, -70, -140, -175, -110, -30, 0], opcoes),
      animate(vooGiro, [0, 10, 22, -6, -20, -8, 0], opcoes),
      animate(escala, [1, 0.94, 0.84, 0.8, 0.88, 0.97, 1], opcoes),
    ])
    voando.current = false
    setAsas('planando')
  }

  return (
    <div
      ref={area}
      className={cn('relative size-full select-none', className)}
      onPointerMove={aoMover}
      onPointerLeave={() => {
        voltar()
        if (!voando.current) setAsas('planando')
      }}
    >
      {petalas && PETALAS.map((p, i) => <Petala key={i} p={p} x={totalX} y={totalY} reduzir={reduzir} />)}

      <div className="absolute inset-0 grid place-items-center">
        <motion.div
          className={cn('relative', tamanho)}
          initial={reduzir ? false : { opacity: 0, scale: 0.82, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Sombra suave no "chão" */}
          <motion.span
            aria-hidden="true"
            className="absolute -bottom-[18%] left-1/2 h-[10%] w-[60%] -translate-x-1/2 rounded-[50%] bg-vinho/15 blur-xl"
            style={{ scale: sombraEscala, opacity: sombraOpacidade }}
          />
          <div className="motion-safe:animate-[flutuar_7s_ease-in-out_infinite]">
            <motion.div
              ref={corpo}
              role={rotulo ? 'img' : undefined}
              aria-label={rotulo}
              aria-hidden={rotulo ? undefined : true}
              className={cn('relative', !reduzir && 'cursor-pointer')}
              style={{ x: totalX, y: totalY, rotate: totalGiro, scale: escala }}
              onPointerEnter={() => !reduzir && setAsas('batendo')}
              onPointerLeave={() => !voando.current && setAsas('planando')}
              onClick={voar}
            >
              <BorboletaViva
                tom={tom}
                modo={reduzir ? 'parada' : asas}
                ritmo={asas === 'batendo' ? '0.5s' : '3.6s'}
                className="w-full drop-shadow-[0_18px_30px_rgba(94,26,50,0.25)]"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default BorboletaInterativa
