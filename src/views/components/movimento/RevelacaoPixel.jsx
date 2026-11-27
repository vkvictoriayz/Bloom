import { useEffect, useRef } from 'react'

import { cn } from '../../lib/cn'

/**
 * Campo de pixels que cobre o conteúdo e se dissolve numa onda, revelando-o.
 * Adaptado de "tap-reveal" (VengeanceUI, Ashutoshx7, licença MIT; veja LICENCAS-TERCEIROS.md):
 * - sem o selo "Tap to reveal" nem o botão de esconder;
 * - paleta clara em tons de rosa da Bloom (sem tema escuro);
 * - revela sozinho ao abrir; clicar/tocar cobre de novo e revela a partir do ponto clicado.
 * Com prefers-reduced-motion, o conteúdo aparece direto, sem o campo de pixels.
 */

const PALETA = {
  base: '#fbeff3',
  tons: ['#f8e3ea', '#f4d7e0', '#eecad6'],
  cintilar: '#e3a1b5',
  clarao: '#c27a90',
}
const MAX_CELULAS = 40000

function hash(valor) {
  let n = Math.imul(valor ^ 0x9e3779b9, 0x85ebca6b)
  n ^= n >>> 13
  n = Math.imul(n, 0xc2b2ae35)
  n ^= n >>> 16
  return n >>> 0
}

function RevelacaoPixel({ children, className, conteudoClassName, celula: celulaPedida = 7, duracao = 1100, atrasoInicial = 450 }) {
  const raiz = useRef(null)
  const tela = useRef(null)

  useEffect(() => {
    const root = raiz.current
    const canvas = tela.current
    const ctx = canvas?.getContext('2d')
    if (!root || !canvas || !ctx) return

    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let estado = 'coberto' // coberto | revelando | aberto
    let largura = 0
    let altura = 0
    let colunas = 0
    let linhas = 0
    let celula = celulaPedida
    let quadroRevelar = 0
    let quadroCintilar = 0
    let proximoCintilar = 0
    let temporizador = 0
    const cintilando = new Map()
    const semente = 2166136261

    const tomDe = (i) => {
      const h = hash(i + semente) % 10
      return PALETA.tons[h < 6 ? 0 : h < 9 ? 1 : 2]
    }
    const pintar = (i, cor) => {
      const x = (i % colunas) * celula
      const y = Math.floor(i / colunas) * celula
      ctx.fillStyle = PALETA.base
      ctx.fillRect(x, y, celula, celula)
      ctx.fillStyle = cor
      ctx.fillRect(x, y, celula - 1, celula - 1)
    }
    const limpar = (i) => ctx.clearRect((i % colunas) * celula, Math.floor(i / colunas) * celula, celula, celula)
    const pintarTudo = () => {
      cintilando.clear()
      ctx.fillStyle = PALETA.base
      ctx.fillRect(0, 0, largura, altura)
      for (let i = 0, n = colunas * linhas; i < n; i++) pintar(i, tomDe(i))
    }

    const cintilar = (agora) => {
      quadroCintilar = 0
      if (estado !== 'coberto') return
      cintilando.forEach((ate, i) => {
        if (agora > ate) {
          pintar(i, tomDe(i))
          cintilando.delete(i)
        }
      })
      if (agora > proximoCintilar && colunas * linhas > 0) {
        for (let k = 0; k < 3; k++) {
          const i = Math.floor(Math.random() * colunas * linhas)
          pintar(i, Math.random() < 0.5 ? PALETA.cintilar : PALETA.tons[2])
          cintilando.set(i, agora + 380 + Math.random() * 420)
        }
        proximoCintilar = agora + 80 + Math.random() * 110
      }
      quadroCintilar = requestAnimationFrame(cintilar)
    }
    const iniciarCintilar = () => {
      if (!quadroCintilar) quadroCintilar = requestAnimationFrame(cintilar)
    }

    const abrir = () => {
      cancelAnimationFrame(quadroRevelar)
      estado = 'aberto'
      ctx.clearRect(0, 0, largura, altura)
    }

    const revelar = (origem) => {
      if (estado !== 'coberto') return
      estado = 'revelando'
      cintilando.clear()
      const ox = origem?.x ?? largura / 2
      const oy = origem?.y ?? altura / 2
      const alcance =
        Math.max(Math.hypot(ox, oy), Math.hypot(largura - ox, oy), Math.hypot(ox, altura - oy), Math.hypot(largura - ox, altura - oy)) || 1
      const clarao = Math.min(80, duracao * 0.12)
      const variacao = duracao * 0.2
      const espalhar = Math.max(0, duracao - clarao - variacao)
      const total = colunas * linhas
      const inicio = new Float32Array(total)
      const ordem = new Uint32Array(total)
      for (let i = 0; i < total; i++) {
        const cx = (i % colunas) * celula + celula / 2
        const cy = Math.floor(i / colunas) * celula + celula / 2
        inicio[i] = (Math.hypot(cx - ox, cy - oy) / alcance) * espalhar + ((hash(i ^ semente) % 1000) / 1000) * variacao
        ordem[i] = i
      }
      ordem.sort((a, b) => inicio[a] - inicio[b])
      let acesos = 0
      let limpos = 0
      let comeco = -1
      const quadro = (agora) => {
        if (comeco < 0) comeco = agora
        const passado = agora - comeco
        while (acesos < total && inicio[ordem[acesos]] <= passado) pintar(ordem[acesos++], PALETA.clarao)
        while (limpos < acesos && inicio[ordem[limpos]] + clarao <= passado) limpar(ordem[limpos++])
        if (limpos < total) quadroRevelar = requestAnimationFrame(quadro)
        else abrir()
      }
      quadroRevelar = requestAnimationFrame(quadro)
    }

    const cobrir = () => {
      cancelAnimationFrame(quadroRevelar)
      estado = 'coberto'
      pintarTudo()
      iniciarCintilar()
    }

    const medir = () => {
      const l = root.clientWidth
      const a = root.clientHeight
      if (l === largura && a === altura) return
      largura = l
      altura = a
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(largura * dpr)
      canvas.height = Math.round(altura * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      celula = Math.max(celulaPedida, Math.ceil(Math.sqrt((largura * altura) / MAX_CELULAS)))
      colunas = Math.ceil(largura / celula)
      linhas = Math.ceil(altura / celula)
      if (estado === 'coberto') pintarTudo()
      else abrir()
    }

    const aoClicar = (e) => {
      if (reduzir || estado === 'revelando') return
      const r = root.getBoundingClientRect()
      const ponto = { x: e.clientX - r.left, y: e.clientY - r.top }
      cobrir()
      clearTimeout(temporizador)
      temporizador = setTimeout(() => revelar(ponto), 420)
    }

    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(root)

    if (reduzir) {
      abrir()
    } else {
      iniciarCintilar()
      temporizador = setTimeout(() => revelar(null), atrasoInicial)
      root.addEventListener('pointerdown', aoClicar)
    }

    return () => {
      clearTimeout(temporizador)
      cancelAnimationFrame(quadroRevelar)
      cancelAnimationFrame(quadroCintilar)
      observador.disconnect()
      root.removeEventListener('pointerdown', aoClicar)
    }
  }, [celulaPedida, duracao, atrasoInicial])

  return (
    <div ref={raiz} className={cn('relative isolate overflow-hidden', className)}>
      <div className={cn('relative z-[1] size-full', conteudoClassName)}>{children}</div>
      <canvas ref={tela} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] block size-full" />
    </div>
  )
}

export default RevelacaoPixel
