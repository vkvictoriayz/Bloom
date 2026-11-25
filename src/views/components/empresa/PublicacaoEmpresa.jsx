import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

import Icone from '../Icone'
import Avatar from '../comunidade/Avatar'
import { ICONE_TIPO } from '../comunidade/tipos'
import { ImagemPublicacao } from '../comunidade/AnexoImagem'
import SeloPremium from '../conta/SeloPremium'
import EnviarPublicacao from '../mensagens/EnviarPublicacao'
import Botao from '../ui/Botao'
import { AreaTexto, Aviso, Selecao } from '../ui/Campo'
import { editarPublicacaoEmpresa, excluirPublicacaoEmpresa, fotoEmpresa } from '../../services/empresa'
import { LIMITE_PUBLICACAO, TIPOS, tempoRelativo } from '../../services/comunidade'
import { cn } from '../../lib/cn'

const rotuloTipo = (id) => TIPOS.find((t) => t.id === id)?.rotulo ?? id

function TextoComTags({ texto }) {
  return texto.split(/(#[\p{L}\p{N}_]+)/u).map((parte, i) =>
    parte.startsWith('#') ? (
      <strong key={i} className="font-semibold text-vinho">
        {parte}
      </strong>
    ) : (
      parte
    )
  )
}

const acao = 'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-tinta-2 transition-colors hover:bg-blush hover:text-vinho'

function PublicacaoEmpresa({ publicacao, gerenciavel = false, aoMudar, aoExcluir }) {
  const [dados, setDados] = useState(publicacao)
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState({ texto: publicacao.texto, tipo: publicacao.tipo })
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)

  const contexto = useOutletContext()
  const autor = dados.autor ?? { id: contexto?.perfil?.empresa.id, nome: dados.empresa?.nome, foto: fotoEmpresa(contexto?.perfil), detalhe: 'Empresa' }
  const daEmpresa = (dados.origem ?? 'empresa') === 'empresa'
  const linkAutor = daEmpresa ? (gerenciavel ? '/empresa/perfil' : autor.id ? `/empresas/${autor.id}` : null) : autor.id ? `/empresa/talentos/${autor.id}` : null

  useEffect(() => {
    if (!aviso) return undefined
    const t = setTimeout(() => setAviso(''), 2500)
    return () => clearTimeout(t)
  }, [aviso])

  async function salvar(e) {
    e.preventDefault()
    if (!rascunho.texto.trim()) return setErro('Escreva algo para publicar.')
    setOcupado(true)
    setErro('')
    try {
      const r = await editarPublicacaoEmpresa(dados.id, rascunho)
      setDados((d) => ({ ...d, ...r.publicacao }))
      setEditando(false)
      aoMudar?.()
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setOcupado(false)
    }
  }

  async function excluir() {
    setOcupado(true)
    setErro('')
    try {
      await excluirPublicacaoEmpresa(dados.id)
      aoExcluir?.(dados.id)
    } catch (falha) {
      setErro(falha.message)
      setOcupado(false)
      setConfirmando(false)
    }
  }

  function compartilhar() {
    setEnviando(true)
  }
  const referencia = daEmpresa ? `e${String(dados.id).replace(/^e/, '')}` : `u${String(dados.id).replace(/^u/, '')}`

  const nomeAutor = linkAutor ? (
    <Link to={linkAutor} className="truncate font-bold text-tinta hover:text-vinho hover:underline">
      {autor.nome}
    </Link>
  ) : (
    <span className="truncate font-bold text-tinta">{autor.nome}</span>
  )

  return (
    <article className="animar-entrada overflow-hidden rounded-2xl border border-linha bg-branco transition-shadow hover:shadow-[0_6px_24px_-12px_rgba(78,18,38,0.25)]" aria-label={`Publicação de ${autor.nome}`}>
      {enviando && <EnviarPublicacao daEmpresa referencia={referencia} previa={{ autor: autor.nome, texto: dados.texto }} aoFechar={() => setEnviando(false)} />}
      {daEmpresa && dados.tipo === 'oportunidade' && <div aria-hidden="true" className="h-1 bg-gradient-to-r from-vinho via-rosa to-blush" />}
      <div className="p-5 sm:p-6">
        <header className="flex items-start gap-3">
          {linkAutor ? (
            <Link to={linkAutor} className={cn('shrink-0', daEmpresa ? 'rounded-xl' : 'rounded-full')} aria-label={`Ver o perfil de ${autor.nome}`}>
              <Avatar nome={autor.nome} foto={autor.foto} className={daEmpresa ? 'rounded-xl' : undefined} />
            </Link>
          ) : (
            <Avatar nome={autor.nome} foto={autor.foto} className={daEmpresa ? 'rounded-xl' : undefined} />
          )}
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {nomeAutor}
              {daEmpresa && autor.premium && <SeloPremium compacto />}
              <span className="inline-flex items-center gap-1 rounded-full bg-blush px-2 py-0.5 text-[11px] font-semibold text-vinho">
                <Icone nome={ICONE_TIPO[dados.tipo] ?? 'info'} tamanho={12} /> {rotuloTipo(dados.tipo)}
              </span>
            </p>
            <p className="truncate text-sm text-suave">
              {[daEmpresa ? 'Empresa' : autor.detalhe || 'Integrante da Bloom', tempoRelativo(dados.criadaEm), dados.editadaEm && 'editada'].filter(Boolean).join(' · ')}
            </p>
          </div>
          {gerenciavel && !editando && (
            <div className="flex shrink-0 gap-1">
              <Botao variante="fantasma" tamanho="icone" aria-label="Editar publicação" onClick={() => setEditando(true)}>
                <Icone nome="editar" />
              </Botao>
              <Botao variante="fantasma" tamanho="icone" aria-label="Excluir publicação" onClick={() => setConfirmando(true)}>
                <Icone nome="lixeira" />
              </Botao>
            </div>
          )}
        </header>

        {editando ? (
          <form onSubmit={salvar} className="mt-4 flex flex-col gap-3">
            <label htmlFor={`editar-${dados.id}`} className="sr-only">
              Texto da publicação
            </label>
            <AreaTexto id={`editar-${dados.id}`} rows={4} maxLength={LIMITE_PUBLICACAO} value={rascunho.texto} onChange={(e) => setRascunho((r) => ({ ...r, texto: e.target.value }))} />
            <div className="flex flex-wrap items-center gap-2">
              <Selecao aria-label="Tipo" value={rascunho.tipo} onChange={(e) => setRascunho((r) => ({ ...r, tipo: e.target.value }))} className="h-10 w-auto">
                {TIPOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.rotulo}
                  </option>
                ))}
              </Selecao>
              <Botao type="submit" tamanho="sm" disabled={ocupado}>
                Salvar
              </Botao>
              <Botao tamanho="sm" variante="fantasma" onClick={() => setEditando(false)}>
                Cancelar
              </Botao>
            </div>
          </form>
        ) : (
          <>
            {dados.texto && (
              <p className="mt-4 text-[15px] leading-relaxed break-words whitespace-pre-line text-tinta">
                <TextoComTags texto={dados.texto} />
              </p>
            )}
            <ImagemPublicacao imagem={dados.imagem} descricao={`Imagem publicada por ${autor.nome}`} className="mt-4" />
          </>
        )}

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

        {!editando && dados.id !== 'previa' && (
          <div className="-mx-2 mt-4 flex flex-wrap items-center gap-1 border-t border-linha pt-3">
            {!daEmpresa && (
              <>
                <span className="inline-flex h-9 items-center gap-1.5 px-3 text-sm text-suave" aria-label={`${dados.curtidas} curtidas`}>
                  <Icone nome="coracao" tamanho={18} /> <span className="tabular-nums">{dados.curtidas}</span>
                </span>
                <span className="inline-flex h-9 items-center gap-1.5 px-3 text-sm text-suave" aria-label={`${dados.comentarios} comentários`}>
                  <Icone nome="mensagem" tamanho={18} /> <span className="tabular-nums">{dados.comentarios}</span>
                </span>
              </>
            )}
            <button type="button" onClick={compartilhar} className={acao} aria-label="Enviar publicação pela Bloom" title="Enviar pela Bloom">
              <Icone nome="compartilhar" tamanho={17} /> <span className="max-sm:sr-only">Enviar</span>
            </button>
            {!daEmpresa && autor.id && (
              <Link to={`/empresa/talentos/${autor.id}`} className={cn(acao, 'ml-auto text-vinho')}>
                <Icone nome="perfil" tamanho={17} /> Ver perfil
              </Link>
            )}
            {daEmpresa && !gerenciavel && autor.id && (
              <Link to={`/empresas/${autor.id}`} className={cn(acao, 'ml-auto text-vinho')}>
                <Icone nome="predio" tamanho={17} /> Ver empresa
              </Link>
            )}
            {aviso && (
              <span role="status" className="ml-auto text-xs font-semibold text-sucesso">
                {aviso}
              </span>
            )}
          </div>
        )}
        {erro && (
          <Aviso tipo="erro" className="mt-3">
            {erro}
          </Aviso>
        )}
      </div>
    </article>
  )
}

export default PublicacaoEmpresa
