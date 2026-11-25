import { useEffect, useRef } from 'react'

import BorboletaViva from './BorboletaViva'

function BorboletaHero({ className }) {
  const area = useRef(null)
  const palco = useRef(null)
  const borboleta = useRef(null)

  useEffect(() => {
    const el = area.current
    const b = borboleta.current
    if (!el || !b) return undefined
    const esq = b.querySelector('.bv-esq')
    const dir = b.querySelector('.bv-dir')
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const s = { energia: 0, fase: 0, ultimo: null, alvoX: 0, alvoY: 0, x: 0, y: 0, t: 0, descanso: 0 }
    let quadro = 0

    function mover(e) {
      const r = el.getBoundingClientRect()
      if (s.ultimo) s.energia = Math.min(1.3, s.energia + Math.hypot(e.clientX - s.ultimo.x, e.clientY - s.ultimo.y) / 240)
      s.ultimo = { x: e.clientX, y: e.clientY }
      s.alvoX = (e.clientX - r.left) / r.width - 0.5
      s.alvoY = (e.clientY - r.top) / r.height - 0.5
    }
    function sair() {
      s.ultimo = null
      s.alvoX = 0
      s.alvoY = 0
    }
    function tocar() {
      s.energia = 1.3
    }

    function passo() {
      s.t += 1
      s.energia *= 0.962
      const agitada = s.energia > 0.06
      let angulo
      if (agitada) {
        s.fase += 0.16 + s.energia * 0.3
        angulo = (18 + Math.min(1, s.energia) * 56) * (0.5 - 0.5 * Math.cos(s.fase))
        s.descanso = 0
      } else {
        s.descanso += 1
        const ciclo = s.descanso % 260
        angulo = ciclo < 40 ? 62 * Math.sin((ciclo / 40) * Math.PI) : 4
      }
      esq.style.transform = `rotateY(${angulo.toFixed(1)}deg)`
      dir.style.transform = `rotateY(${(-angulo).toFixed(1)}deg)`
      s.x += (s.alvoX - s.x) * 0.05
      s.y += (s.alvoY - s.y) * 0.05
      const sobe = Math.sin(s.t / 70) * 5 - (agitada ? Math.sin(s.fase) * 3 : 0)
      if (palco.current) {
        palco.current.style.transform = `translate(${(s.x * 40).toFixed(1)}px, ${(s.y * 30 + sobe).toFixed(1)}px) rotate(${(s.x * 12).toFixed(2)}deg) rotateX(${(s.y * -14).toFixed(1)}deg)`
      }
      quadro = requestAnimationFrame(passo)
    }

    if (!reduzir) {
      el.addEventListener('pointermove', mover)
      el.addEventListener('pointerleave', sair)
      el.addEventListener('pointerdown', tocar)
      quadro = requestAnimationFrame(passo)
    }
    return () => {
      cancelAnimationFrame(quadro)
      el.removeEventListener('pointermove', mover)
      el.removeEventListener('pointerleave', sair)
      el.removeEventListener('pointerdown', tocar)
    }
  }, [])

  return (
    <div
      ref={area}
      className={`flex aspect-[3/2] h-full w-full items-center justify-center rounded-xl lg:aspect-auto lg:min-h-[420px] ${className ?? 'bg-papel'}`}
      role="img"
      aria-label="Símbolo da BLOOM: uma borboleta que bate as asas quando você passa o mouse"
    >
      <div ref={palco} className="w-[46%] max-w-[300px] will-change-transform" style={{ perspective: 900 }}>
        <BorboletaViva ref={borboleta} className="w-full" />
      </div>
    </div>
  )
}

export default BorboletaHero
