import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import TituloPagina from '../../components/candidata/TituloPagina'
import { useRecurso } from '../../components/candidata/useRecurso'
import Avatar from '../../components/comunidade/Avatar'
import CartaoPublicacao from '../../components/comunidade/CartaoPublicacao'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Aviso, Selecao } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { LIMITE_PUBLICACAO, TIPOS } from '../../services/comunidade'
import { DISPONIVEL, excluirComunidade, lerComunidadeTematica, participarComunidade, publicarNaComunidade } from '../../services/recursos'

// Caixa para publicar dentro da comunidade (só para participantes).
function NovaPublicacao({ comunidadeId, aoPublicar }) {
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('dica')
  const [estado, setEstado] = useState({ tipo: 'ocioso' })

  async function enviar(e) {
    e.preventDefault()
    if (!texto.trim()) return setEstado({ tipo: 'erro', texto: 'Escreva algo para publicar.' })
    setEstado({ tipo: 'enviando' })
    try {
      const r = await publicarNaComunidade(comunidadeId, { texto: texto.trim(), tipo })
      setTexto('')
      setEstado({ tipo: 'ocioso' })
      aoPublicar(r.publicacao)
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-xl border border-linha bg-branco p-5">
      <label htmlFor="publicar-comunidade" className="text-sm font-semibold text-tinta-2">
        Publicar na comunidade
      </label>
      <AreaTexto id="publicar-comunidade" rows={3} maxLength={LIMITE_PUBLICACAO} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Compartilhe uma dica, dúvida ou conquista com o grupo." />
      <div className="flex flex-wrap items-center gap-2">
        <Selecao aria-label="Tipo de publicação" value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-auto">
          {TIPOS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.rotulo}
            </option>
          ))}
        </Selecao>
        <Botao type="submit" className="ml-auto" disabled={estado.tipo === 'enviando' || !texto.trim()}>
          {estado.tipo === 'enviando' ? 'Publicando…' : 'Publicar'}
        </Botao>
      </div>
      {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
    </form>
  )
}

function DetalheComunidade() {
  const { id } = useParams()
  const navigate = useNavigate()
  const r = useRecurso(DISPONIVEL.comunidades, () => lerComunidadeTematica(id), [id])
  const [participando, setParticipando] = useState(null)
  const [novas, setNovas] = useState([])
  const [removidas, setRemovidas] = useState([])
  const [erroAcao, setErroAcao] = useState('')
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  if (r.estado === 'carregando') return <Esqueleto className="h-64 rounded-xl" />
  if (r.estado === 'erro' || !r.dados?.comunidade) {
    return (
      <Vazio className="bg-branco">
        <VazioTitulo>Comunidade não encontrada</VazioTitulo>
        <VazioDescricao>{r.erro ?? 'Esta comunidade não existe ou foi removida.'}</VazioDescricao>
        <VazioAcoes>
          <Botao as={Link} to="/candidata/comunidades">
            Ver comunidades
          </Botao>
        </VazioAcoes>
      </Vazio>
    )
  }

  const { comunidade, participantes = [], publicacoes = [] } = r.dados
  const souParticipante = participando ?? comunidade.participando
  const lista = [...novas, ...publicacoes].filter((p) => !removidas.includes(p.id))

  async function alternar() {
    setErroAcao('')
    try {
      const resposta = await participarComunidade(comunidade.id)
      setParticipando(resposta.participando)
    } catch (e) {
      setErroAcao(e.message)
    }
  }

  async function excluir() {
    setErroAcao('')
    try {
      await excluirComunidade(comunidade.id)
      navigate('/candidata/comunidades', { replace: true })
    } catch (e) {
      setErroAcao(e.message)
    }
  }

  return (
    <>
      <TituloPagina
        titulo={comunidade.nome}
        descricao={`${comunidade.tema} · ${comunidade.participantes} ${comunidade.participantes === 1 ? 'participante' : 'participantes'}`}
        voltar={{ para: '/candidata/comunidades', rotulo: 'Comunidades' }}
        acoes={
          comunidade.minha ? (
            confirmandoExclusao ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-tinta-2">Excluir a comunidade? As publicações continuam no feed.</span>
                <Botao tamanho="sm" className="bg-erro hover:bg-erro/90" onClick={excluir}>
                  Excluir
                </Botao>
                <Botao tamanho="sm" variante="fantasma" onClick={() => setConfirmandoExclusao(false)}>
                  Cancelar
                </Botao>
              </div>
            ) : (
              <Botao variante="secundario" onClick={() => setConfirmandoExclusao(true)}>
                Excluir comunidade
              </Botao>
            )
          ) : (
            <Botao variante={souParticipante ? 'secundario' : 'primario'} onClick={alternar}>
              {souParticipante ? 'Sair da comunidade' : 'Participar'}
            </Botao>
          )
        }
      />
      {erroAcao && <Aviso tipo="erro" className="mb-4">{erroAcao}</Aviso>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-linha bg-branco p-6">
            <h2 className="font-display text-xl text-tinta">Sobre</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-tinta-2">{comunidade.descricao}</p>
          </section>
          {souParticipante ? (
            <NovaPublicacao comunidadeId={comunidade.id} aoPublicar={(p) => setNovas((l) => [p, ...l])} />
          ) : (
            <p className="rounded-xl border border-dashed border-linha-forte p-4 text-sm text-tinta-2">Participe da comunidade para publicar nela.</p>
          )}
          {lista.length ? (
            lista.map((p) => <CartaoPublicacao key={p.id} publicacao={p} aoExcluir={(idPub) => setRemovidas((l) => [...l, idPub])} />)
          ) : (
            <p className="text-center text-sm text-suave">Nenhuma publicação nesta comunidade ainda.</p>
          )}
        </div>
        <section className="rounded-xl border border-linha bg-branco p-6 lg:self-start">
          <h2 className="font-display text-xl text-tinta">Participantes</h2>
          {participantes.length ? (
            <ul className="mt-3 divide-y divide-linha">
              {participantes.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <Avatar nome={p.nome} foto={p.foto} tamanho="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.nome}</span>
                  {p.criadora && <span className="text-xs text-suave">criou</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-suave">Nenhum participante com perfil público.</p>
          )}
        </section>
      </div>
    </>
  )
}

export default DetalheComunidade
