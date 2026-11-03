import { useEffect, useRef, useState } from 'react'

import Icone from '../Icone'
import Botao from '../ui/Botao'
import { Aviso, AreaTexto } from '../ui/Campo'
import Avatar from './Avatar'
import { ICONE_TIPO } from './tipos'
import { comentar, curtir, excluirPublicacao, LIMITE_COMENTARIO, lerComentarios, TIPOS, tempoRelativo } from '../../services/comunidade'
import { cn } from '../../lib/cn'

const rotuloTipo = (id) => TIPOS.find((t) => t.id === id)?.rotulo ?? id

// Menu "⋯" da publicação: copiar o texto (todas) e excluir (só a autora).
function MenuPublicacao({ minha, aoCopiar, aoExcluir }) {
  const [aberto, setAberto] = useState(false)
  const caixa = useRef(null)

  useEffect(() => {
    if (!aberto) return
    const fora = (e) => !caixa.current?.contains(e.target) && setAberto(false)
    const esc = (e) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  const item = 'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-tinta-2 hover:bg-papel-2 hover:text-tinta'

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label="Mais opções da publicação"
        onClick={() => setAberto((v) => !v)}
        className="grid size-9 place-items-center rounded-full text-suave transition-colors hover:bg-papel-2 hover:text-tinta"
      >
        <Icone nome="mais_opcoes" tamanho={20} />
      </button>
      {aberto && (
        <div role="menu" className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-linha bg-branco py-1 shadow-menu">
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={() => {
              setAberto(false)
              aoCopiar()
            }}
          >
            <Icone nome="documento" tamanho={16} /> Copiar texto
          </button>
          {minha && (
            <button
              role="menuitem"
              type="button"
              className={cn(item, 'text-erro hover:text-erro')}
              onClick={() => {
                setAberto(false)
                aoExcluir()
              }}
            >
              <Icone nome="lixeira" tamanho={16} /> Excluir publicação
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Uma publicação do feed: autora, texto, curtir, comentar, compartilhar e
// (para a autora) excluir. Tudo ligado à API da comunidade.
function CartaoPublicacao({ publicacao, aoExcluir }) {
  const [dados, setDados] = useState(publicacao)
  const [comentariosAbertos, setComentariosAbertos] = useState(false)
  const [comentarios, setComentarios] = useState(null)
  const [novo, setNovo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  async function aoCurtir() {
    setErro('')
    try {
      const r = await curtir(dados.id)
      setDados((d) => ({ ...d, curtiu: r.curtiu, curtidas: r.curtidas }))
    } catch (e) {
      setErro(e.message)
    }
  }

  async function alternarComentarios() {
    const abrir = !comentariosAbertos
    setComentariosAbertos(abrir)
    if (abrir && comentarios === null) {
      try {
        setComentarios((await lerComentarios(dados.id)).comentarios)
      } catch (e) {
        setErro(e.message)
        setComentarios([])
      }
    }
  }

  async function enviarComentario(evento) {
    evento.preventDefault()
    if (!novo.trim() || ocupado) return
    setOcupado(true)
    setErro('')
    try {
      const r = await comentar(dados.id, novo)
      setComentarios((lista) => [...(lista ?? []), r.comentario])
      setDados((d) => ({ ...d, comentarios: r.comentarios }))
      setNovo('')
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  async function excluir() {
    setOcupado(true)
    setErro('')
    try {
      await excluirPublicacao(dados.id)
      aoExcluir(dados.id)
    } catch (e) {
      setErro(e.message)
      setOcupado(false)
      setConfirmando(false)
    }
  }

  // Compartilhar: usa o compartilhamento do aparelho quando existe;
  // senão, copia o texto da publicação.
  async function compartilhar() {
    const texto = `${dados.autora.nome} na Bloom:\n\n${dados.texto}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Publicação na Bloom', text: texto })
        return
      }
      await navigator.clipboard.writeText(texto)
      setAviso('Texto copiado para compartilhar.')
    } catch (e) {
      if (e?.name !== 'AbortError') setAviso('Não foi possível compartilhar. Copie o texto manualmente.')
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(dados.texto)
      setAviso('Texto copiado.')
    } catch {
      setAviso('Não foi possível copiar o texto.')
    }
  }

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 2500)
    return () => clearTimeout(t)
  }, [aviso])

  const acao =
    'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-tinta-2 transition-colors hover:bg-blush hover:text-vinho'

  return (
    <article className="rounded-2xl border border-linha bg-branco" aria-label={`Publicação de ${dados.autora.nome}`}>
      <div className="p-5 sm:p-6">
        <header className="flex items-start gap-3">
          <Avatar nome={dados.autora.nome} tamanho="md" />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate font-bold text-tinta">{dados.autora.nome}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blush px-2 py-0.5 text-[11px] font-semibold text-vinho">
                <Icone nome={ICONE_TIPO[dados.tipo] ?? 'info'} tamanho={12} /> {rotuloTipo(dados.tipo)}
              </span>
            </p>
            <p className="truncate text-sm text-suave">{[dados.autora.area, tempoRelativo(dados.criadaEm)].filter(Boolean).join(' · ')}</p>
          </div>
          <MenuPublicacao minha={dados.minha} aoCopiar={copiar} aoExcluir={() => setConfirmando(true)} />
        </header>

        <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line text-tinta">{dados.texto}</p>

        {confirmando && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-erro-claro px-4 py-3 text-sm">
            <span className="flex-1 font-semibold text-erro">Excluir esta publicação? Não dá para desfazer.</span>
            <Botao tamanho="sm" className="bg-erro hover:bg-erro/90" onClick={excluir} disabled={ocupado}>
              Excluir
            </Botao>
            <Botao tamanho="sm" variante="secundario" onClick={() => setConfirmando(false)}>
              Cancelar
            </Botao>
          </div>
        )}

        <div className="-mx-2 mt-4 flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={aoCurtir}
            aria-pressed={dados.curtiu}
            aria-label={`${dados.curtiu ? 'Descurtir' : 'Curtir'} (${dados.curtidas} curtidas)`}
            className={cn(acao, dados.curtiu && 'text-vinho')}
          >
            <Icone nome="coracao" tamanho={19} preenchido={dados.curtiu} />
            <span className="tabular-nums">{dados.curtidas}</span>
          </button>
          <button
            type="button"
            onClick={alternarComentarios}
            aria-expanded={comentariosAbertos}
            aria-label={`Comentários (${dados.comentarios})`}
            className={cn(acao, comentariosAbertos && 'bg-blush text-vinho')}
          >
            <Icone nome="mensagem" tamanho={19} />
            <span className="tabular-nums">{dados.comentarios}</span>
          </button>
          <button type="button" onClick={compartilhar} aria-label="Compartilhar publicação" className={acao}>
            <Icone nome="compartilhar" tamanho={18} />
          </button>
          {aviso && (
            <span role="status" className="ml-auto text-xs font-semibold text-sucesso">
              {aviso}
            </span>
          )}
        </div>

        {erro && (
          <Aviso tipo="erro" className="mt-3">
            {erro}
          </Aviso>
        )}
      </div>

      {comentariosAbertos && (
        <div className="border-t border-linha bg-papel/60 px-5 py-5 sm:px-6">
          {comentarios === null ? (
            <p className="text-sm text-suave">Carregando comentários…</p>
          ) : comentarios.length === 0 ? (
            <p className="text-sm text-suave">Ainda não há comentários. Comece a conversa.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {comentarios.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <Avatar nome={c.autora.nome} tamanho="sm" />
                  <div className="min-w-0 flex-1 rounded-xl bg-branco px-3.5 py-2.5">
                    <p className="text-sm">
                      <span className="font-semibold text-tinta">{c.autora.nome}</span> <span className="text-suave">· {tempoRelativo(c.criadoEm)}</span>
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-line text-tinta-2">{c.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={enviarComentario} className="mt-4 flex items-end gap-2">
            <label htmlFor={`comentario-${dados.id}`} className="sr-only">
              Escreva um comentário
            </label>
            <AreaTexto
              id={`comentario-${dados.id}`}
              value={novo}
              onChange={(e) => setNovo(e.target.value)}
              maxLength={LIMITE_COMENTARIO}
              placeholder="Escreva um comentário"
              className="min-h-11 flex-1 resize-none rounded-xl py-2.5"
              rows={1}
            />
            <Botao type="submit" disabled={!novo.trim() || ocupado}>
              Comentar
            </Botao>
          </form>
        </div>
      )}
    </article>
  )
}

export default CartaoPublicacao
