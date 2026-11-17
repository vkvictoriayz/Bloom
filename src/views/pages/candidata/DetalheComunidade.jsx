import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import { SeletorIcone } from '../../components/IconePerfil'
import { AnexoImagem } from '../../components/comunidade/AnexoImagem'
import Avatar from '../../components/comunidade/Avatar'
import CartaoPublicacao from '../../components/comunidade/CartaoPublicacao'
import { CapaComunidade, IconeComunidade, PilhaAvatares } from '../../components/comunidade/ElementosComunidade'
import { ICONE_TIPO } from '../../components/comunidade/tipos'
import Denunciar from '../../components/conta/Denunciar'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Aviso, Campo, Entrada } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioAcoes, VazioDescricao, VazioIcone, VazioTitulo } from '../../components/ui/Vazio'
import { useSessao } from '../../hooks/useSessao'
import { LIMITE_PUBLICACAO, TIPOS, textoAtividade, textoParticipantes } from '../../services/comunidade'
import { ACEITAR_IMAGEM, prepararImagem } from '../../services/imagemPublicacao'
import { EVENTO_PERFIL, lerPerfil } from '../../services/perfil'
import { useDadosLocais } from '../../hooks/useDadosLocais'
import {
  atualizarComunidade,
  enviarCapaComunidade,
  excluirComunidade,
  lerComunidadeTematica,
  participarComunidade,
  publicarNaComunidade,
  removerCapaComunidade,
  tirarDaComunidade,
} from '../../services/recursos'
import { cn } from '../../lib/cn'

const dataLonga = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

// Caixa para publicar dentro da comunidade (só para participantes).
function NovaPublicacao({ comunidade, aoPublicar }) {
  const sessao = useSessao()
  const perfil = useDadosLocais(() => lerPerfil(sessao?.usuario), [EVENTO_PERFIL])
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('dica')
  const [imagem, setImagem] = useState(null)
  const [estado, setEstado] = useState({ tipo: 'ocioso' })

  async function enviar(e) {
    e.preventDefault()
    if (!texto.trim() && !imagem) return setEstado({ tipo: 'erro', texto: 'Escreva algo ou adicione uma imagem para publicar.' })
    setEstado({ tipo: 'enviando' })
    try {
      const corpo = { texto: texto.trim(), tipo, ...(imagem ? { imagem: imagem.dataUrl, largura: imagem.largura, altura: imagem.altura } : {}) }
      const r = await publicarNaComunidade(comunidade.id, corpo)
      setTexto('')
      setImagem(null)
      setEstado({ tipo: 'ocioso' })
      aoPublicar(r.publicacao)
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-linha bg-branco p-5" aria-label="Publicar na comunidade">
      <div className="flex gap-3">
        <Avatar nome={sessao?.usuario?.nome ?? ''} foto={perfil.foto} tamanho="md" />
        <div className="min-w-0 flex-1">
          <label htmlFor="publicar-comunidade" className="sr-only">
            Publicar em {comunidade.nome}
          </label>
          <textarea
            id="publicar-comunidade"
            rows={texto ? 4 : 2}
            maxLength={LIMITE_PUBLICACAO}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Escreva para ${comunidade.nome}…`}
            className="w-full resize-none rounded-xl border border-transparent bg-papel-2 px-4 py-3 text-[15px] leading-relaxed text-tinta placeholder:text-suave transition-colors hover:border-linha-forte focus:border-vinho focus:bg-branco focus:ring-[3px] focus:ring-vinho/20 focus:outline-none"
          />
        </div>
      </div>
      {imagem && (
        <div className="mt-3 sm:pl-14">
          <AnexoImagem id="imagem-comunidade" valor={imagem} aoMudar={setImagem} desabilitado={estado.tipo === 'enviando'} />
        </div>
      )}
      <div role="radiogroup" aria-label="Tipo de publicação" className="mt-3 -mx-1 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] sm:pl-14">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={tipo === t.id}
            onClick={() => setTipo(t.id)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors',
              tipo === t.id ? 'bg-blush text-vinho' : 'text-tinta-2 hover:bg-papel-2 hover:text-tinta'
            )}
          >
            <Icone nome={ICONE_TIPO[t.id]} tamanho={14} /> {t.rotulo}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3 border-t border-linha pt-3 sm:ml-14">
        {!imagem && (
          <div className="mr-auto -ml-3">
            <AnexoImagem id="imagem-comunidade" valor={null} aoMudar={setImagem} desabilitado={estado.tipo === 'enviando'} />
          </div>
        )}
        <span className="ml-auto text-xs text-suave tabular-nums">
          {texto.length}/{LIMITE_PUBLICACAO}
        </span>
        <Botao type="submit" className="rounded-full px-5" disabled={estado.tipo === 'enviando' || (!texto.trim() && !imagem)}>
          {estado.tipo === 'enviando' ? 'Publicando…' : 'Publicar'}
        </Botao>
      </div>
      {estado.tipo === 'erro' && (
        <Aviso tipo="erro" className="mt-3">
          {estado.texto}
        </Aviso>
      )}
    </form>
  )
}

// Aba "Publicações": caixa de publicar, lista e "ver mais".
function AbaPublicacoes({ comunidade, iniciais, temMaisInicial, souParticipante, aoParticipar }) {
  const [lista, setLista] = useState(iniciais)
  const [pagina, setPagina] = useState(1)
  const [temMais, setTemMais] = useState(temMaisInicial)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function maisPublicacoes() {
    setCarregando(true)
    setErro('')
    try {
      const r = await lerComunidadeTematica(comunidade.id, pagina + 1)
      setLista((atual) => [...atual, ...r.publicacoes.filter((p) => !atual.some((a) => a.id === p.id))])
      setTemMais(r.temMais)
      setPagina((p) => p + 1)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  async function tirar(p) {
    setErro('')
    try {
      await tirarDaComunidade(comunidade.id, p.id)
      setLista((atual) => atual.filter((x) => x.id !== p.id))
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {souParticipante ? (
        <NovaPublicacao comunidade={comunidade} aoPublicar={(p) => setLista((l) => [p, ...l])} />
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-linha-forte bg-branco p-5">
          <p className="flex-1 text-sm text-tinta-2">Participe da comunidade para publicar, comentar com o grupo e receber as novidades.</p>
          <Botao className="rounded-full" onClick={aoParticipar}>
            Participar
          </Botao>
        </div>
      )}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {lista.length ? (
        lista.map((p) => (
          <CartaoPublicacao
            key={p.id}
            publicacao={p}
            aoExcluir={(id) => setLista((l) => l.filter((x) => x.id !== id))}
            acoesExtras={comunidade.minha && !p.minha ? [{ rotulo: 'Tirar da comunidade', icone: 'fechar', aoClicar: () => tirar(p) }] : undefined}
          />
        ))
      ) : (
        <Vazio className="bg-branco">
          <VazioIcone>
            <Icone nome="mensagem" />
          </VazioIcone>
          <VazioTitulo>Nenhuma publicação ainda</VazioTitulo>
          <VazioDescricao>{souParticipante ? 'Comece a conversa: compartilhe uma dica, uma dúvida ou uma conquista.' : 'Participe para fazer a primeira publicação.'}</VazioDescricao>
        </Vazio>
      )}
      {temMais && (
        <Botao variante="secundario" className="self-center rounded-full" onClick={maisPublicacoes} disabled={carregando}>
          {carregando ? 'Carregando…' : 'Ver mais publicações'}
        </Botao>
      )}
    </div>
  )
}

// Aba "Participantes": busca e grade com quem participa.
function AbaParticipantes({ participantes }) {
  const [busca, setBusca] = useState('')
  const alvo = busca.trim().toLowerCase()
  const lista = participantes.filter((p) => p.nome.toLowerCase().includes(alvo))
  return (
    <section className="rounded-2xl border border-linha bg-branco p-5 sm:p-6" aria-label="Participantes">
      <Entrada type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar participante" aria-label="Buscar participante" className="h-10" />
      {lista.length ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {lista.map((p) => (
            <li key={p.id}>
              <Link to={`/candidata/pessoas/${p.id}`} className="flex items-center gap-3 rounded-xl border border-linha p-3 transition-colors hover:border-vinho/40 hover:bg-papel">
                <Avatar nome={p.nome} foto={p.foto} tamanho="md" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-tinta">{p.nome}</span>
                    {p.criadora && <span className="shrink-0 rounded-full bg-blush px-2 py-0.5 text-[10px] font-bold text-vinho uppercase">Criadora</span>}
                  </span>
                  <span className="block text-xs text-suave">Desde {new Date(p.entrouEm).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '')}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-suave">{busca ? 'Ninguém com esse nome.' : 'Nenhum participante com perfil público.'}</p>
      )}
      <p className="mt-4 text-xs text-suave">Quem deixou o perfil oculto não aparece nesta lista.</p>
    </section>
  )
}

// Aba "Sobre": descrição, regras, quem criou. Quem criou edita e exclui aqui.
function AbaSobre({ comunidade, criadora, aoAtualizar, aoExcluir }) {
  const [editando, setEditando] = useState(false)
  const [dados, setDados] = useState({ tema: comunidade.tema, descricao: comunidade.descricao, regras: comunidade.regras })
  const [estado, setEstado] = useState({ tipo: 'ocioso' })
  const [trocandoIcone, setTrocandoIcone] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const campo = (nome) => (e) => setDados((d) => ({ ...d, [nome]: e.target.value }))

  async function salvar(e) {
    e.preventDefault()
    setEstado({ tipo: 'enviando' })
    try {
      const r = await atualizarComunidade(comunidade.id, { tema: dados.tema.trim(), descricao: dados.descricao.trim(), regras: dados.regras.trim() })
      aoAtualizar(r.comunidade)
      setEditando(false)
      setEstado({ tipo: 'ok', texto: 'Comunidade atualizada.' })
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  async function salvarIcone(icone) {
    setEstado({ tipo: 'enviando' })
    try {
      const r = await atualizarComunidade(comunidade.id, { icone })
      aoAtualizar(r.comunidade)
      setTrocandoIcone(false)
      setEstado({ tipo: 'ocioso' })
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-linha bg-branco p-5 sm:p-6">
        {editando ? (
          <form onSubmit={salvar} noValidate className="flex flex-col gap-4">
            <Campo rotulo="Tema">{(p) => <Entrada {...p} maxLength={60} value={dados.tema} onChange={campo('tema')} />}</Campo>
            <Campo rotulo="Descrição" ajuda={`${dados.descricao.length}/500`}>
              {(p) => <AreaTexto {...p} rows={4} maxLength={500} value={dados.descricao} onChange={campo('descricao')} />}
            </Campo>
            <Campo rotulo="Regras da comunidade" ajuda={`${dados.regras.length}/1000 · Uma por linha. Aparecem para quem visita.`}>
              {(p) => <AreaTexto {...p} rows={5} maxLength={1000} value={dados.regras} onChange={campo('regras')} placeholder={'Ex.:\nSeja gentil e respeitosa.\nSem divulgação de cursos pagos.'} />}
            </Campo>
            {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
            <div className="flex flex-wrap gap-2">
              <Botao type="submit" disabled={estado.tipo === 'enviando'}>
                {estado.tipo === 'enviando' ? 'Salvando…' : 'Salvar'}
              </Botao>
              <Botao type="button" variante="fantasma" onClick={() => setEditando(false)}>
                Cancelar
              </Botao>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl text-tinta">Sobre</h2>
              {comunidade.minha && (
                <Botao variante="secundario" tamanho="sm" onClick={() => setEditando(true)}>
                  <Icone nome="editar" tamanho={15} /> Editar
                </Botao>
              )}
            </div>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-tinta-2">{comunidade.descricao}</p>
            <h3 className="mt-6 text-xs font-bold tracking-[0.12em] text-suave uppercase">Regras</h3>
            {comunidade.regras ? (
              <ol className="mt-3 flex flex-col gap-2">
                {comunidade.regras
                  .split('\n')
                  .map((r) => r.replace(/^\s*\d+[.)-]\s*/, '').trim())
                  .filter(Boolean)
                  .map((r, i) => (
                    <li key={i} className="flex gap-3 text-sm text-tinta-2">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blush text-xs font-bold text-vinho">{i + 1}</span>
                      <span className="pt-0.5">{r}</span>
                    </li>
                  ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-suave">{comunidade.minha ? 'Ainda sem regras. Use "Editar" para escrever as regras do grupo.' : 'Esta comunidade ainda não tem regras escritas. Vale o respeito de sempre.'}</p>
            )}
            <dl className="mt-6 grid gap-4 border-t border-linha pt-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-suave">Criada em</dt>
                <dd className="font-semibold text-tinta">{dataLonga(comunidade.criadaEm)}</dd>
              </div>
              <div>
                <dt className="text-suave">Criada por</dt>
                <dd>
                  {criadora ? (
                    <Link to={`/candidata/pessoas/${criadora.id}`} className="inline-flex items-center gap-2 font-semibold text-tinta hover:text-vinho">
                      <Avatar nome={criadora.nome} foto={criadora.foto} tamanho="sm" className="size-7 text-[10px]" /> {criadora.nome}
                    </Link>
                  ) : (
                    <span className="text-tinta-2">Perfil oculto</span>
                  )}
                </dd>
              </div>
            </dl>
            {estado.tipo === 'ok' && (
              <Aviso tipo="sucesso" className="mt-4">
                {estado.texto}
              </Aviso>
            )}
          </>
        )}
      </section>

      {comunidade.minha ? (
        <section className="rounded-2xl border border-linha bg-branco p-5 sm:p-6">
          <h2 className="font-display text-lg text-tinta">Gerenciar</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {!trocandoIcone && (
              <Botao variante="secundario" tamanho="sm" onClick={() => setTrocandoIcone(true)}>
                {comunidade.icone ? 'Trocar ícone' : 'Escolher um ícone'}
              </Botao>
            )}
            {!confirmando ? (
              <Botao variante="fantasma" tamanho="sm" className="text-erro" onClick={() => setConfirmando(true)}>
                <Icone nome="lixeira" tamanho={15} /> Excluir comunidade
              </Botao>
            ) : (
              <span className="flex flex-wrap items-center gap-2 rounded-xl bg-erro-claro px-3 py-2 text-sm">
                <span className="font-semibold text-erro">Excluir? As publicações continuam no feed.</span>
                <Botao tamanho="sm" className="bg-erro hover:bg-erro/90" onClick={aoExcluir}>
                  Excluir
                </Botao>
                <Botao tamanho="sm" variante="fantasma" onClick={() => setConfirmando(false)}>
                  Cancelar
                </Botao>
              </span>
            )}
          </div>
          {trocandoIcone && (
            <div className="mt-4">
              <SeletorIcone publico="comunidade" forma="quadrado" valor={comunidade.icone} aoEscolher={salvarIcone} ocupado={estado.tipo === 'enviando'} aoCancelar={() => setTrocandoIcone(false)} />
            </div>
          )}
          {estado.tipo === 'erro' && !editando && (
            <Aviso tipo="erro" className="mt-3">
              {estado.texto}
            </Aviso>
          )}
        </section>
      ) : (
        <div>
          <Denunciar alvoTipo="comunidade" alvoId={comunidade.id} rotulo="Denunciar comunidade" />
        </div>
      )}
    </div>
  )
}

const ABAS = [
  { id: 'publicacoes', rotulo: 'Publicações', icone: 'mensagem' },
  { id: 'participantes', rotulo: 'Participantes', icone: 'grupo' },
  { id: 'sobre', rotulo: 'Sobre', icone: 'info' },
]

function DetalheComunidade() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [parametros, setParametros] = useSearchParams()
  const aba = ABAS.some((a) => a.id === parametros.get('aba')) ? parametros.get('aba') : 'publicacoes'
  const [estado, setEstado] = useState({ tipo: 'carregando' })
  const [erroAcao, setErroAcao] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const arquivoCapa = useRef(null)

  useEffect(() => {
    let ativo = true
    lerComunidadeTematica(id)
      .then((dados) => ativo && setEstado({ tipo: 'pronto', ...dados }))
      .catch((e) => ativo && setEstado({ tipo: 'erro', texto: e.message }))
    return () => {
      ativo = false
    }
  }, [id])

  useEffect(() => {
    if (estado.comunidade) document.title = `${estado.comunidade.nome} · BLOOM`
  }, [estado.comunidade])

  if (estado.tipo === 'carregando') {
    return (
      <div className="flex flex-col gap-5">
        <Esqueleto className="h-72 rounded-2xl" />
        <Esqueleto className="h-40 rounded-2xl" />
      </div>
    )
  }
  if (estado.tipo === 'erro') {
    return (
      <Vazio className="bg-branco">
        <VazioTitulo>Comunidade não encontrada</VazioTitulo>
        <VazioDescricao>{estado.texto}</VazioDescricao>
        <VazioAcoes>
          <Botao as={Link} to="/candidata/comunidades">
            Ver comunidades
          </Botao>
        </VazioAcoes>
      </Vazio>
    )
  }

  const { comunidade, criadora, participantes } = estado
  const atualizar = (nova) => setEstado((e) => ({ ...e, comunidade: { ...e.comunidade, ...nova } }))

  async function alternar() {
    setErroAcao('')
    setOcupado(true)
    try {
      const r = await participarComunidade(comunidade.id)
      // Recarrega para a lista de participantes refletir a mudança.
      const dados = await lerComunidadeTematica(comunidade.id)
      setEstado({ tipo: 'pronto', ...dados, comunidade: { ...dados.comunidade, participando: r.participando } })
    } catch (e) {
      setErroAcao(e.message)
    } finally {
      setOcupado(false)
    }
  }

  async function trocarCapa(evento) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!arquivo) return
    setErroAcao('')
    setOcupado(true)
    try {
      const preparada = await prepararImagem(arquivo)
      const r = await enviarCapaComunidade(comunidade.id, preparada.dataUrl)
      atualizar({ capa: r.capa })
    } catch (e) {
      setErroAcao(e.message)
    } finally {
      setOcupado(false)
    }
  }

  async function tirarCapa() {
    setErroAcao('')
    try {
      await removerCapaComunidade(comunidade.id)
      atualizar({ capa: null })
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

  const mudarAba = (nova) => setParametros(nova === 'publicacoes' ? {} : { aba: nova }, { replace: true })

  return (
    <div className="flex flex-col gap-5">
      <Link to="/candidata/comunidades" className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-tinta-2 hover:text-vinho">
        <Icone nome="voltar" tamanho={16} /> Comunidades
      </Link>

      {/* Topo: capa, ícone, nome e ações */}
      <header className="overflow-hidden rounded-2xl border border-linha bg-branco">
        <CapaComunidade capa={comunidade.capa} className="h-36 sm:h-52">
          {comunidade.minha && (
            <div className="absolute right-3 bottom-3 flex gap-2">
              <input ref={arquivoCapa} type="file" accept={ACEITAR_IMAGEM} hidden onChange={trocarCapa} />
              <button
                type="button"
                onClick={() => arquivoCapa.current?.click()}
                disabled={ocupado}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/60 disabled:opacity-60"
              >
                <Icone nome="camera" tamanho={14} /> {comunidade.capa ? 'Trocar capa' : 'Adicionar capa'}
              </button>
              {comunidade.capa && (
                <button type="button" onClick={tirarCapa} className="rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/60">
                  Remover
                </button>
              )}
            </div>
          )}
        </CapaComunidade>
        <div className="px-5 pb-5 sm:px-7">
          <div className="relative -mt-10 flex flex-wrap items-end justify-between gap-3 sm:-mt-12">
            <span className="relative z-10 rounded-[22%] ring-4 ring-branco">
              <IconeComunidade comunidade={comunidade} className="size-20 text-2xl sm:size-24 sm:text-3xl" />
            </span>
            <div className="flex flex-wrap gap-2">
              {comunidade.minha ? (
                <Botao variante="secundario" className="rounded-full" onClick={() => mudarAba('sobre')}>
                  <Icone nome="engrenagem" tamanho={16} /> Gerenciar
                </Botao>
              ) : comunidade.participando ? (
                <Botao variante="secundario" className="group rounded-full" onClick={alternar} disabled={ocupado} aria-label="Sair da comunidade">
                  <Icone nome="check" tamanho={16} className="group-hover:hidden" />
                  <span className="group-hover:hidden">Participando</span>
                  <span className="hidden group-hover:inline">Sair</span>
                </Botao>
              ) : (
                <Botao className="rounded-full px-6" onClick={alternar} disabled={ocupado}>
                  <Icone nome="mais" tamanho={16} /> Participar
                </Botao>
              )}
            </div>
          </div>
          <h1 className="mt-3 font-display text-2xl leading-tight text-tinta sm:text-3xl">{comunidade.nome}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-suave">
            <span className="rounded-full bg-blush px-2.5 py-0.5 text-xs font-semibold text-vinho">{comunidade.tema}</span>
            <span>{textoParticipantes(comunidade.participantes)}</span>
            <span aria-hidden="true">·</span>
            <span>{textoAtividade(comunidade)}</span>
          </div>
          <button type="button" onClick={() => mudarAba('participantes')} className="mt-4 flex items-center gap-3 text-left text-sm text-tinta-2 hover:text-vinho">
            <PilhaAvatares pessoas={participantes.slice(0, 5)} total={comunidade.participantes} />
            <span>{participantes.length ? 'Ver quem participa' : 'Seja a primeira a participar'}</span>
          </button>
        </div>
        <nav role="tablist" aria-label="Seções da comunidade" className="flex gap-1 overflow-x-auto border-t border-linha px-3 [scrollbar-width:none] sm:px-5">
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => mudarAba(a.id)}
              className={cn(
                'inline-flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors',
                aba === a.id ? 'border-vinho text-vinho' : 'border-transparent text-tinta-2 hover:text-tinta'
              )}
            >
              <Icone nome={a.icone} tamanho={16} /> {a.rotulo}
              {a.id === 'participantes' && <span className="rounded-full bg-papel-2 px-1.5 text-xs tabular-nums">{comunidade.participantes}</span>}
            </button>
          ))}
        </nav>
      </header>

      {erroAcao && <Aviso tipo="erro">{erroAcao}</Aviso>}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {aba === 'publicacoes' && (
            <AbaPublicacoes comunidade={comunidade} iniciais={estado.publicacoes} temMaisInicial={estado.temMais} souParticipante={comunidade.participando} aoParticipar={alternar} />
          )}
          {aba === 'participantes' && <AbaParticipantes participantes={participantes} />}
          {aba === 'sobre' && <AbaSobre comunidade={comunidade} criadora={criadora} aoAtualizar={atualizar} aoExcluir={excluir} />}
        </div>

        {/* Lateral: resumo, regras e algumas participantes */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24" aria-label="Resumo da comunidade">
          <section className="rounded-2xl border border-linha bg-branco p-5">
            <h2 className="font-display text-lg text-tinta">Sobre o grupo</h2>
            <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-tinta-2">{comunidade.descricao}</p>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-tinta-2">
              <li className="flex items-center gap-2">
                <Icone nome="calendario" tamanho={15} className="text-suave" /> Criada em {dataLonga(comunidade.criadaEm)}
              </li>
              {criadora && (
                <li className="flex items-center gap-2">
                  <Icone nome="estrela" tamanho={15} className="text-suave" /> Criada por{' '}
                  <Link to={`/candidata/pessoas/${criadora.id}`} className="font-semibold text-tinta hover:text-vinho hover:underline">
                    {criadora.nome}
                  </Link>
                </li>
              )}
            </ul>
            {comunidade.regras && aba !== 'sobre' && (
              <button type="button" onClick={() => mudarAba('sobre')} className="mt-4 text-sm font-semibold text-vinho hover:underline">
                Ler as regras do grupo
              </button>
            )}
          </section>
          {aba !== 'participantes' && participantes.length > 0 && (
            <section className="rounded-2xl border border-linha bg-branco p-5">
              <h2 className="font-display text-lg text-tinta">Quem participa</h2>
              <ul className="mt-3 grid grid-cols-4 gap-3">
                {participantes.slice(0, 8).map((p) => (
                  <li key={p.id}>
                    <Link to={`/candidata/pessoas/${p.id}`} className="flex flex-col items-center gap-1 text-center" title={p.nome}>
                      <Avatar nome={p.nome} foto={p.foto} tamanho="md" />
                      <span className="w-full truncate text-[11px] text-tinta-2">{p.nome.split(' ')[0]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {participantes.length > 8 && (
                <button type="button" onClick={() => mudarAba('participantes')} className="mt-3 text-sm font-semibold text-vinho hover:underline">
                  Ver todas ({comunidade.participantes})
                </button>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

export default DetalheComunidade
