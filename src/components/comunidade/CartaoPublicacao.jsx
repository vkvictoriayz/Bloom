import { useState } from 'react'

import Icone from '../Icone'
import Botao from '../ui/Botao'
import { Aviso, AreaTexto } from '../ui/Campo'
import Selo from '../ui/Selo'
import Avatar from './Avatar'
import { comentar, curtir, excluirPublicacao, LIMITE_COMENTARIO, lerComentarios, TIPOS, tempoRelativo } from '../../services/comunidade'
import { cn } from '../../lib/cn'

const rotuloTipo = (id) => TIPOS.find((t) => t.id === id)?.rotulo ?? id

// Uma publicação do feed, com curtir, comentários e (para a autora) excluir.
function CartaoPublicacao({ publicacao, aoExcluir }) {
  const [dados, setDados] = useState(publicacao)
  const [comentariosAbertos, setComentariosAbertos] = useState(false)
  const [comentarios, setComentarios] = useState(null)
  const [novo, setNovo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
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

  const acao =
    'inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-tinta-2 transition-colors hover:bg-papel-2 hover:text-tinta'

  return (
    <article className="rounded-xl border border-linha bg-branco p-5 sm:p-6" aria-label={`Publicação de ${dados.autora.nome}`}>
      <header className="flex items-start gap-3">
        <Avatar nome={dados.autora.nome} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-tinta">{dados.autora.nome}</p>
          <p className="truncate text-sm text-suave">
            {[dados.autora.area, tempoRelativo(dados.criadaEm)].filter(Boolean).join(' · ')}
          </p>
        </div>
        <Selo variante="vinho">{rotuloTipo(dados.tipo)}</Selo>
      </header>

      <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line text-tinta">{dados.texto}</p>

      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-linha pt-3">
        <button type="button" onClick={aoCurtir} aria-pressed={dados.curtiu} className={cn(acao, dados.curtiu && 'text-vinho')}>
          <Icone nome="coracao" tamanho={18} className={dados.curtiu ? 'fill-current' : ''} />
          {dados.curtiu ? 'Curtida' : 'Curtir'} <span className="tabular-nums">{dados.curtidas}</span>
        </button>
        <button type="button" onClick={alternarComentarios} aria-expanded={comentariosAbertos} className={acao}>
          <Icone nome="mensagem" tamanho={18} />
          Comentar <span className="tabular-nums">{dados.comentarios}</span>
        </button>

        {dados.minha &&
          (confirmando ? (
            <span className="ml-auto flex items-center gap-2 text-sm">
              <span className="text-tinta-2">Excluir esta publicação?</span>
              <Botao tamanho="sm" onClick={excluir} disabled={ocupado}>
                Excluir
              </Botao>
              <Botao tamanho="sm" variante="secundario" onClick={() => setConfirmando(false)}>
                Cancelar
              </Botao>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmando(true)} className={cn(acao, 'ml-auto')}>
              <Icone nome="lixeira" tamanho={18} /> Excluir
            </button>
          ))}
      </div>

      {erro && (
        <Aviso tipo="erro" className="mt-3">
          {erro}
        </Aviso>
      )}

      {comentariosAbertos && (
        <div className="mt-4 border-t border-linha pt-4">
          {comentarios === null ? (
            <p className="text-sm text-suave">Carregando comentários…</p>
          ) : comentarios.length === 0 ? (
            <p className="text-sm text-suave">Ainda não há comentários. Comece a conversa.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {comentarios.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <Avatar nome={c.autora.nome} tamanho="sm" />
                  <div className="min-w-0 flex-1 rounded-md bg-papel-2 px-3.5 py-2.5">
                    <p className="text-sm">
                      <span className="font-semibold text-tinta">{c.autora.nome}</span>{' '}
                      <span className="text-suave">· {tempoRelativo(c.criadoEm)}</span>
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-line text-tinta-2">{c.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={enviarComentario} className="mt-4 flex flex-col gap-2">
            <label htmlFor={`comentario-${dados.id}`} className="sr-only">
              Escreva um comentário
            </label>
            <AreaTexto
              id={`comentario-${dados.id}`}
              value={novo}
              onChange={(e) => setNovo(e.target.value)}
              maxLength={LIMITE_COMENTARIO}
              placeholder="Escreva um comentário"
              className="min-h-20"
            />
            <Botao type="submit" tamanho="sm" className="self-end" disabled={!novo.trim() || ocupado}>
              Comentar
            </Botao>
          </form>
        </div>
      )}
    </article>
  )
}

export default CartaoPublicacao
