import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'

// Navegação com uma pílula que desliza até o item sob o mouse ou o foco do
// teclado e, ao sair, volta para o item ativo (aria-current="page").
// Adaptado do Spotlight Navbar do VengeanceUI: em vez do brilho e da mola
// do framer-motion, um fundo blush com transição em CSS.
function NavSpotlight({ rotulo, className, children }) {
  const nav = useRef(null)
  const [pilula, setPilula] = useState(null)
  const { pathname, hash } = useLocation()

  const moverPara = useCallback((alvo) => {
    if (!alvo || !nav.current) return setPilula(null)
    const base = nav.current.getBoundingClientRect()
    const caixa = alvo.getBoundingClientRect()
    setPilula({ x: caixa.left - base.left, largura: caixa.width })
  }, [])

  const voltarAoAtivo = useCallback(() => {
    moverPara(nav.current?.querySelector('[aria-current="page"]'))
  }, [moverPara])

  // Reposiciona ao trocar de página e quando a janela muda de tamanho.
  useEffect(() => {
    voltarAoAtivo()
    window.addEventListener('resize', voltarAoAtivo)
    return () => window.removeEventListener('resize', voltarAoAtivo)
  }, [voltarAoAtivo, pathname, hash])

  function aoApontar(e) {
    const link = e.target.closest('a')
    if (link && nav.current.contains(link)) moverPara(link)
  }

  return (
    <nav
      ref={nav}
      aria-label={rotulo}
      className={cn('relative flex items-center', className)}
      onPointerOver={aoApontar}
      onFocus={aoApontar}
      onPointerLeave={voltarAoAtivo}
      onBlur={(e) => !nav.current.contains(e.relatedTarget) && voltarAoAtivo()}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-1/2 left-0 h-9 rounded-full bg-blush transition-[transform,width,opacity] duration-300 ease-bloom',
          pilula ? 'opacity-100' : 'opacity-0'
        )}
        style={pilula ? { width: pilula.largura, transform: `translate(${pilula.x}px, -50%)` } : undefined}
      />
      {children}
    </nav>
  )
}

export default NavSpotlight
