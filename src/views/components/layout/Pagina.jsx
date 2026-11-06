import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import Cabecalho from './Cabecalho'
import Rodape from './Rodape'
import { cn } from '../../lib/cn'

// Moldura comum: link de pular, cabeçalho, conteúdo e rodapé.
// Também cuida da rolagem: topo ao trocar de página e âncoras (/#secao).
function Pagina({ titulo, className, children }) {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (titulo) document.title = `${titulo} · BLOOM`
  }, [titulo])

  useEffect(() => {
    if (hash) {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only z-[60] rounded-md bg-vinho px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <Cabecalho />
      <main id="conteudo" tabIndex={-1} className={cn('flex-1 focus:outline-none', className)}>
        {children}
      </main>
      <Rodape />
    </div>
  )
}

export default Pagina
