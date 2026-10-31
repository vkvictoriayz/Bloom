import { cn } from '../../lib/cn'

// Fotografia responsiva: o navegador escolhe a largura certa pelo "sizes".
// "prioridade" carrega já (cabeçalhos); as demais carregam ao rolar.
function Foto({ foto, sizes = '100vw', prioridade = false, className, posicao = 'center' }) {
  return (
    <img
      src={foto.grande}
      srcSet={`${foto.pequena} 800w, ${foto.grande} 1600w`}
      width={1600}
      height={1067}
      sizes={sizes}
      alt={foto.alt}
      loading={prioridade ? 'eager' : 'lazy'}
      fetchPriority={prioridade ? 'high' : undefined}
      decoding="async"
      className={cn('h-full w-full bg-papel-2 object-cover', className)}
      style={{ objectPosition: posicao }}
    />
  )
}

export default Foto
