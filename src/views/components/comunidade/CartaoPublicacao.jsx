import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../Icone'
import Botao from '../ui/Botao'
import { Aviso, AreaTexto, Selecao } from '../ui/Campo'
import { AnexoImagem, ImagemPublicacao } from './AnexoImagem'
import Avatar from './Avatar'
import { FormularioDenuncia } from '../conta/Denunciar'
import { ICONE_TIPO } from './tipos'
import {
  comentar,
  curtir,
  editarPublicacao,
  excluirComentario,
  excluirPublicacao,
  LIMITE_COMENTARIO,
  LIMITE_PUBLICACAO,
  lerComentarios,
  seguirPerfil,
  TIPOS,
  tempoRelativo,
} from '../../services/comunidade'
import { cn } from '../../lib/cn'

const rotuloTipo = (id) => TIPOS.find((t) => t.id === id)?.rotulo ?? id
const perfilDa = (id) => `/candidata/pessoas/${id}`

// Fecha um menu ao clicar fora ou apertar Esc.
function useMenu() {
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
  return { aberto, setAberto, caixa }
}

const itemMenu = 'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-tinta-2 hover:bg-papel-2 hover:text-tinta'

// Menu discreto "⋯" de um comentário (só para quem pode excluir).
function MenuComentario({ aoExcluir, aoDenunciar }) {
  const { aberto, setAberto, caixa } = useMenu()
  return (
    <div ref={caixa} className="relative -mt-1 -mr-1.5 shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label="Opções do comentário"
        onClick={() => setAberto((v) => !v)}
        className="grid size-7 place-items-center rounded-full text-suave transition-colors hover:bg-papel-2 hover:text-tinta"
      >
        <Icone nome="mais_opcoes" tamanho={16} />
      </button>
      {aberto && (
        <div role="menu" className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-linha bg-branco py-1 shadow-menu">
          {aoExcluir && (
            <button
              role="menuitem"
              type="button"
              className={cn(itemMenu, 'text-erro hover:text-erro')}
              onClick={() => {
                setAberto(false)
                aoExcluir()
              }}
            >
              <Icone nome="lixeira" tamanho={16} /> Excluir comentário
            </button>
          )}
          {aoDenunciar && (
            <button
              role="menuitem"
              type="button"
              className={itemMenu}
              onClick={() => {
                setAberto(false)
                aoDenunciar()
              }}
            >
              <Icone nome="info" tamanho={16} /> Denunciar comentário
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Menu "⋯" da publicação: copiar o texto (todas); editar e excluir (só a autora).
function MenuPublicacao({ minha, aoCopiar, aoEditar, aoExcluir, aoDenunciar }) {
  const { aberto, setAberto, caixa } = useMenu()
  const item = itemMenu

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
              className={item}
              onClick={() => {
                setAberto(false)
                aoEditar()
              }}
            >
              <Icone nome="editar" tamanho={16} /> Editar publicação
            </button>
          )}
          {!minha && (
            <button
              role="menuitem"
              type="button"
              className={item}
              onClick={() => {
                setAberto(false)
                aoDenunciar()
              }}
            >
              <Icone nome="info" tamanho={16} /> Denunciar publicação
            </button>
          )}
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

// Edição da publicação pela autora: texto, tipo e imagem (manter, trocar ou remover).
function EdicaoPublicacao({ publicacao, aoSalvar, aoCancelar }) {
  const [texto, setTexto] = useState(publicacao.texto)
  const [tipo, setTipo] = useState(publicacao.tipo)
  const [imagem, setImagem] = useState(publicacao.imagem)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  async function salvar(evento) {
    evento.preventDefault()
    if (!texto.trim() && !imagem) return setErro('A publicação precisa de um texto ou de uma imagem.')
    setOcupado(true)
    setErro('')
    try {
      const corpo = { texto, tipo }
      // Só envia a imagem quando mudou: nova (dataUrl) ou removida (null).
      if (imagem?.dataUrl) Object.assign(corpo, { imagem: imagem.dataUrl, largura: imagem.largura, altura: imagem.altura })
      else if (!imagem && publicacao.imagem) corpo.imagem = null
      aoSalvar((await editarPublicacao(publicacao.id, corpo)).publicacao)
    } catch (e) {
      setErro(e.message)
      setOcupado(false)
    }
  }

  return (
    <form onSubmit={salvar} className="mt-4 flex flex-col gap-3" aria-label="Editar publicação">
      <label htmlFor={`editar-${publicacao.id}`} className="sr-only">
        Texto da publicação
      </label>
      <AreaTexto id={`editar-${publicacao.id}`} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={LIMITE_PUBLICACAO} rows={4} className="min-h-28" autoFocus />
      <AnexoImagem id={`imagem-editar-${publicacao.id}`} valor={imagem} aoMudar={setImagem} desabilitado={ocupado} />
      <div className="flex flex-wrap items-center gap-2 border-t border-linha pt-3">
        <Selecao aria-label="Tipo de publicação" value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-10 w-auto">
          {TIPOS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.rotulo}
            </option>
          ))}
        </Selecao>
        <span className="ml-auto text-xs text-suave tabular-nums">
          {texto.length}/{LIMITE_PUBLICACAO}
        </span>
        <Botao tamanho="sm" variante="secundario" onClick={aoCancelar} disabled={ocupado}>
          Cancelar
        </Botao>
        <Botao tamanho="sm" type="submit" disabled={ocupado}>
          {ocupado ? 'Salvando…' : 'Salvar'}
        </Botao>
      </div>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
    </form>
  )
}

// Uma publicação do feed: autora, texto, imagem, curtir, comentar,
// compartilhar e (para a autora) editar e excluir. Tudo ligado à API.
// "aoAtualizar" avisa a lista quando a publicação muda (edição).
function CartaoPublicacao({ publicacao, aoExcluir, aoAtualizar }) {
  const [dados, setDados] = useState(publicacao)
  const [editando, setEditando] = useState(false)
  const [excluindoComentario, setExcluindoComentario] = useState(null)
  const [seguindoAutora, setSeguindoAutora] = useState(Boolean(publicacao.autora.seguindo))
  const [comentariosAbertos, setComentariosAbertos] = useState(false)
  const [comentarios, setComentarios] = useState(null)
  const [novo, setNovo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  // Denúncia aberta: "publicacao" ou o id do comentário.
  const [denunciando, setDenunciando] = useState(null)

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

  async function confirmarExclusaoComentario(comentario) {
    setOcupado(true)
    setErro('')
    try {
      const r = await excluirComentario(comentario.id)
      setComentarios((lista) => lista.filter((c) => c.id !== comentario.id))
      setDados((d) => ({ ...d, comentarios: r.comentarios }))
      setExcluindoComentario(null)
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  async function seguirAutora() {
    setErro('')
    try {
      const r = await seguirPerfil(dados.autora.id)
      setSeguindoAutora(r.seguindo)
      if (r.seguindo) setAviso(`Agora você segue ${dados.autora.nome.split(' ')[0]}.`)
    } catch (e) {
      setErro(e.message)
    }
  }

  function aoSalvarEdicao(nova) {
    setDados(nova)
    setEditando(false)
    setAviso('Publicação atualizada.')
    aoAtualizar?.(nova)
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
          <Link to={perfilDa(dados.autora.id)} className="shrink-0 rounded-full" aria-label={`Ver o perfil de ${dados.autora.nome}`}>
            <Avatar nome={dados.autora.nome} foto={dados.autora.foto} tamanho="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link to={perfilDa(dados.autora.id)} className="truncate font-bold text-tinta hover:text-vinho hover:underline">
                {dados.autora.nome}
              </Link>
              <span className="inline-flex items-center gap-1 rounded-full bg-blush px-2 py-0.5 text-[11px] font-semibold text-vinho">
                <Icone nome={ICONE_TIPO[dados.tipo] ?? 'info'} tamanho={12} /> {rotuloTipo(dados.tipo)}
              </span>
            </p>
            <p className="truncate text-sm text-suave">
              {[dados.autora.area, tempoRelativo(dados.criadaEm), dados.editadaEm && 'editada'].filter(Boolean).join(' · ')}
            </p>
          </div>
          {!dados.minha && !seguindoAutora && (
            <Botao tamanho="sm" variante="secundario" className="h-8 shrink-0 rounded-full px-3" onClick={seguirAutora} aria-label={`Seguir ${dados.autora.nome}`}>
              Seguir
            </Botao>
          )}
          <MenuPublicacao minha={dados.minha} aoCopiar={copiar} aoEditar={() => setEditando(true)} aoExcluir={() => setConfirmando(true)} aoDenunciar={() => setDenunciando('publicacao')} />
        </header>

        {editando ? (
          <EdicaoPublicacao publicacao={dados} aoSalvar={aoSalvarEdicao} aoCancelar={() => setEditando(false)} />
        ) : (
          <>
            {dados.texto && <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line text-tinta">{dados.texto}</p>}
            <ImagemPublicacao imagem={dados.imagem} descricao={`Imagem publicada por ${dados.autora.nome}`} className="mt-4" />
          </>
        )}

        {denunciando === 'publicacao' && <FormularioDenuncia alvoTipo="publicacao" alvoId={dados.id} aoFechar={() => setDenunciando(null)} className="mt-4" />}

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
                  <Link to={perfilDa(c.autora.id)} className="shrink-0 rounded-full" aria-label={`Ver o perfil de ${c.autora.nome}`}>
                    <Avatar nome={c.autora.nome} foto={c.autora.foto} tamanho="sm" />
                  </Link>
                  <div className="min-w-0 flex-1 rounded-xl bg-branco px-3.5 py-2.5">
                    <div className="flex items-start gap-2">
                      <p className="min-w-0 flex-1 text-sm">
                        <Link to={perfilDa(c.autora.id)} className="font-semibold text-tinta hover:text-vinho hover:underline">
                          {c.autora.nome}
                        </Link>{' '}
                        <span className="text-suave">· {tempoRelativo(c.criadoEm)}</span>
                      </p>
                      {(c.podeExcluir || !c.minha) && (
                        <MenuComentario aoExcluir={c.podeExcluir ? () => setExcluindoComentario(c.id) : undefined} aoDenunciar={c.minha ? undefined : () => setDenunciando(c.id)} />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-line text-tinta-2">{c.texto}</p>
                    {denunciando === c.id && <FormularioDenuncia alvoTipo="comentario" alvoId={c.id} aoFechar={() => setDenunciando(null)} className="mt-2" />}
                    {excluindoComentario === c.id && (
                      <div role="alertdialog" aria-label="Confirmar exclusão do comentário" className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-erro-claro px-3 py-2 text-sm">
                        <span className="flex-1 font-semibold text-erro">Excluir este comentário?</span>
                        <Botao tamanho="sm" className="h-8 bg-erro hover:bg-erro/90" onClick={() => confirmarExclusaoComentario(c)} disabled={ocupado}>
                          Excluir
                        </Botao>
                        <Botao tamanho="sm" variante="secundario" className="h-8" onClick={() => setExcluindoComentario(null)}>
                          Cancelar
                        </Botao>
                      </div>
                    )}
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
