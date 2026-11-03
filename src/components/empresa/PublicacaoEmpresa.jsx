import { useState } from 'react'

import Icone from '../Icone'
import Avatar from '../comunidade/Avatar'
import { ICONE_TIPO } from '../comunidade/tipos'
import Botao from '../ui/Botao'
import { AreaTexto, Aviso, Selecao } from '../ui/Campo'
import { editarPublicacaoEmpresa, excluirPublicacaoEmpresa } from '../../services/empresa'
import { LIMITE_PUBLICACAO, TIPOS, tempoRelativo } from '../../services/comunidade'

const rotuloTipo = (id) => TIPOS.find((t) => t.id === id)?.rotulo ?? id

// Publicação no feed da empresa. Mesma estrutura do cartão do feed da
// candidata (autor, tipo, tempo, texto, contagens). Publicações das
// integrantes são só leitura para empresas; as da própria empresa podem ser
// editadas e excluídas (o backend confere a autoria).
function PublicacaoEmpresa({ publicacao, gerenciavel = false, aoMudar, aoExcluir }) {
  const [dados, setDados] = useState(publicacao)
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState({ texto: publicacao.texto, tipo: publicacao.tipo })
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  const autor = dados.autor ?? { nome: dados.empresa?.nome, detalhe: 'Empresa' }
  const daEmpresa = (dados.origem ?? 'empresa') === 'empresa'

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

  return (
    <article className="cartao p-5 sm:p-6" aria-label={`Publicação de ${autor.nome}`}>
      <header className="flex items-start gap-3">
        <Avatar nome={autor.nome} className={daEmpresa ? 'rounded-xl' : undefined} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate font-bold text-tinta">{autor.nome}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blush px-2 py-0.5 text-[11px] font-semibold text-vinho">
              <Icone nome={ICONE_TIPO[dados.tipo] ?? 'info'} tamanho={12} /> {rotuloTipo(dados.tipo)}
            </span>
          </p>
          <p className="truncate text-sm text-suave">
            {[autor.detalhe, tempoRelativo(dados.criadaEm), dados.editadaEm && 'editada'].filter(Boolean).join(' · ')}
          </p>
        </div>
        {gerenciavel && !editando && (
          <div className="flex gap-1">
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
        <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line text-tinta">{dados.texto}</p>
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

      {!daEmpresa && (
        <p className="mt-4 flex gap-4 text-sm text-suave">
          <span className="inline-flex items-center gap-1.5">
            <Icone nome="coracao" tamanho={16} /> {dados.curtidas}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icone nome="mensagem" tamanho={16} /> {dados.comentarios}
          </span>
        </p>
      )}
      {erro && (
        <Aviso tipo="erro" className="mt-3">
          {erro}
        </Aviso>
      )}
    </article>
  )
}

export default PublicacaoEmpresa
