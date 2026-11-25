import { useLayoutEffect, useRef, useState } from 'react'

import BorboletaViva from './BorboletaViva'
import { cn } from '../../lib/cn'

const LADO = 340
const ROTA = 'M 60 230 C 40 120, 150 60, 220 110 C 290 160, 250 260, 170 250 C 100 240, 110 150, 180 150 C 250 150, 300 90, 290 50'

function Palco({ compacta, children }) {
  const caixa = useRef(null)
  const [escala, setEscala] = useState(compacta ? 0.5 : 1)
  useLayoutEffect(() => {
    const el = caixa.current
    if (!el) return undefined
    const medir = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      setEscala(Math.max(0.4, Math.min(1.45, (Math.min(width, height) * 0.92) / LADO)))
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [])
  return (
    <div ref={caixa} className="absolute inset-0 grid place-items-center">
      <div className="relative shrink-0" style={{ width: LADO, height: LADO, transform: `scale(${escala})` }}>
        {children}
      </div>
    </div>
  )
}

function CenaVoo({ compacta }) {
  return (
    <div className={cn('absolute inset-0 bg-papel', !compacta && 'pt-6 pb-48')}>
      <div className="relative size-full">
        <Palco compacta={compacta}>
          <svg viewBox={`0 0 ${LADO} ${LADO}`} className="absolute inset-0 size-full" aria-hidden="true">
            <path d={ROTA} fill="none" stroke="#85243d" strokeOpacity="0.18" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 7" />
            <path d={ROTA} fill="none" stroke="#85243d" strokeOpacity="0.55" strokeWidth="1.8" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset="1" style={{ animation: 'desenhar 9s linear infinite' }} />
          </svg>
          <div className="absolute top-0 left-0 w-20" style={{ offsetPath: `path('${ROTA}')`, offsetRotate: 'auto 90deg', animation: 'voo 9s linear infinite' }}>
            <BorboletaViva modo="batendo" ritmo="0.42s" className="w-full" />
          </div>
        </Palco>
      </div>
    </div>
  )
}

function CenaFlorescer({ compacta }) {
  const petalas = [0, 72, 144, 216, 288]
  return (
    <div className={cn('absolute inset-0 bg-papel', !compacta && 'pt-6 pb-48')}>
      <div className="relative size-full">
        <Palco compacta={compacta}>
          <svg viewBox={`0 0 ${LADO} ${LADO}`} className="absolute inset-0 size-full" aria-hidden="true">
            <path d="M170 330 C170 290 162 250 170 210" fill="none" stroke="#5e1a32" strokeWidth="2.5" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset="1" style={{ animation: 'desenhar 1.2s .2s cubic-bezier(.22,1,.36,1) forwards' }} />
            <path d="M168 290 C146 284 136 270 138 258 C152 260 164 272 168 290Z" fill="#9c4a63" style={{ transformOrigin: '168px 290px', animation: 'desabrochar .6s 1s cubic-bezier(.22,1,.36,1) both' }} />
            <g transform="translate(170 205)">
              {petalas.map((a, i) => (
                <g key={a} transform={`rotate(${a})`}>
                  <path d="M0 0 C-14 -10 -14 -34 0 -42 C14 -34 14 -10 0 0Z" fill={i % 2 ? '#c27a90' : '#85243d'} style={{ transformOrigin: '0 0', animation: `desabrochar .7s ${1.2 + i * 0.12}s cubic-bezier(.22,1,.36,1) both` }} />
                </g>
              ))}
              <circle r="7" fill="#f4e4e9" style={{ animation: 'desabrochar .5s 1.9s both' }} />
            </g>
          </svg>
          <div className="absolute left-1/2 w-20 -translate-x-1/2" style={{ top: 112, animation: 'pousar 2.4s 1.8s cubic-bezier(.22,1,.36,1) both' }}>
            <BorboletaViva modo="planando" className="w-full" />
          </div>
        </Palco>
      </div>
    </div>
  )
}

function CenaPouso({ compacta }) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-vinho-escuro', !compacta && 'pt-6 pb-48')}>
      <div className="relative size-full">
        <Palco compacta={compacta}>
          <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-display text-[64px] leading-none font-semibold tracking-[0.14em] text-blush" style={{ animation: 'entrar .9s .2s cubic-bezier(.22,1,.36,1) both' }}>
            BLOOM
          </p>
          <div className="absolute w-16" style={{ left: 129, top: 98, animation: 'chegar 2.6s .6s cubic-bezier(.22,1,.36,1) both' }}>
            <BorboletaViva tom="clara" modo="planando" ritmo="2.8s" className="w-full" />
          </div>
        </Palco>
      </div>
    </div>
  )
}

function CenaPadrao({ compacta }) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-vinho', !compacta && 'pt-6 pb-48')}>
      <svg width="100%" height="100%" className="absolute -top-24 -left-24 h-[calc(100%+12rem)] w-[calc(100%+12rem)]" aria-hidden="true" style={{ animation: 'deslizar-padrao 30s linear infinite' }}>
        <defs>
          <pattern id="padrao-cena" width="96" height="84" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
            <g transform="translate(24 22) scale(0.42)" fill="#ffffff" fillOpacity="0.08">
              <path d="M49.2 45.6C43 30 28 8 5.5 5C3.5 23 20 41 49.2 45.6Z" />
              <path d="M48.6 48.4C40 46.2 31 44.8 23.5 44.6C21 56 26.5 70 35 75.5C40.5 76.5 46 62 48.6 48.4Z" />
              <path d="M50.8 45.6C57 30 72 8 94.5 5C96.5 23 80 41 50.8 45.6Z" />
              <path d="M51.4 48.4C60 46.2 69 44.8 76.5 44.6C79 56 73.5 70 65 75.5C59.5 76.5 54 62 51.4 48.4Z" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#padrao-cena)" />
      </svg>
      <div className="relative size-full">
        <Palco compacta={compacta}>
          <div className="absolute top-1/2 left-1/2 w-36 -translate-x-1/2 -translate-y-1/2">
            <div style={{ animation: 'flutuar 5s ease-in-out infinite' }}>
              <BorboletaViva tom="clara" modo="planando" ritmo="3.6s" className="w-full" />
            </div>
          </div>
        </Palco>
      </div>
    </div>
  )
}

const CENAS = { voo: CenaVoo, florescer: CenaFlorescer, pouso: CenaPouso, padrao: CenaPadrao }

function CenaAcesso({ variante = 'voo', compacta = false, className }) {
  const Cena = CENAS[variante] ?? CenaVoo
  return (
    <div className={cn('relative overflow-hidden', className)} aria-hidden="true">
      <Cena compacta={compacta} />
    </div>
  )
}

export default CenaAcesso
