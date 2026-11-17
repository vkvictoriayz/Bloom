import { useRef, useState } from 'react'

import Icone from '../Icone'
import { urlImagem } from '../../services/api'
import { ACEITAR_IMAGEM, prepararImagem } from '../../services/imagemPublicacao'
import { cn } from '../../lib/cn'

const botaoAcao =
  'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-tinta-2 transition-colors hover:bg-papel-2 hover:text-tinta disabled:opacity-60'

export function ImagemPublicacao({ imagem, descricao, className }) {
  if (!imagem) return null
  const proporcao = imagem.largura && imagem.altura ? Math.min(2, Math.max(0.8, imagem.largura / imagem.altura)) : 4 / 3
  const src = urlImagem(imagem.url ?? imagem.dataUrl)
  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className={cn('block overflow-hidden rounded-xl border border-linha bg-papel-2', className)}
      style={{ aspectRatio: proporcao }}
      aria-label="Abrir a imagem em tamanho original"
    >
      <img src={src} alt={descricao} loading="lazy" decoding="async" width={imagem.largura || undefined} height={imagem.altura || undefined} className="h-full w-full object-contain" />
    </a>
  )
}

export function AnexoImagem({ valor, aoMudar, desabilitado = false, id = 'anexo-imagem' }) {
  const entrada = useRef(null)
  const [preparando, setPreparando] = useState(false)
  const [erro, setErro] = useState('')

  async function escolher(evento) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!arquivo) return
    setErro('')
    setPreparando(true)
    try {
      aoMudar(await prepararImagem(arquivo))
    } catch (e) {
      setErro(e.message)
    } finally {
      setPreparando(false)
    }
  }

  return (
    <div>
      <input ref={entrada} id={id} type="file" accept={ACEITAR_IMAGEM} className="sr-only" tabIndex={-1} onChange={escolher} />
      {valor ? (
        <figure className="relative">
          <ImagemPublicacao imagem={valor} descricao="Prévia da imagem escolhida" />
          <figcaption className="mt-2 flex flex-wrap items-center gap-1">
            <span className="mr-auto text-xs text-suave">Prévia da imagem</span>
            <button type="button" className={botaoAcao} disabled={desabilitado || preparando} onClick={() => entrada.current?.click()}>
              <Icone nome="imagem" tamanho={16} /> Trocar
            </button>
            <button type="button" className={cn(botaoAcao, 'hover:text-erro')} disabled={desabilitado || preparando} onClick={() => aoMudar(null)}>
              <Icone nome="lixeira" tamanho={16} /> Remover
            </button>
          </figcaption>
        </figure>
      ) : (
        <button type="button" className={botaoAcao} disabled={desabilitado || preparando} onClick={() => entrada.current?.click()} aria-describedby={`${id}-ajuda`}>
          <Icone nome="imagem" tamanho={17} /> {preparando ? 'Preparando…' : 'Imagem'}
        </button>
      )}
      <span id={`${id}-ajuda`} className="sr-only">
        Opcional. JPG, PNG ou WebP, até 10 MB.
      </span>
      {erro && (
        <p role="alert" className="mt-2 text-sm text-erro">
          {erro}
        </p>
      )}
    </div>
  )
}
