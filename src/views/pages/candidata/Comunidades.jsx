import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import { IconeAvatar, SeletorIcone } from '../../components/IconePerfil'
import TituloPagina from '../../components/candidata/TituloPagina'
import { CapaComunidade, IconeComunidade, PilhaAvatares } from '../../components/comunidade/ElementosComunidade'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Aviso, Campo, Entrada } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioAcoes, VazioDescricao, VazioIcone, VazioTitulo } from '../../components/ui/Vazio'
import { textoAtividade, textoParticipantes } from '../../services/comunidade'
import { criarComunidade, listarComunidades, participarComunidade } from '../../services/recursos'
import { cn } from '../../lib/cn'

function NovaComunidade({ aoCancelar }) {
  const navigate = useNavigate()
  const [dados, setDados] = useState({ nome: '', tema: '', descricao: '' })
  const [icone, setIcone] = useState(null)
  const [escolhendoIcone, setEscolhendoIcone] = useState(false)
  const [estado, setEstado] = useState({ tipo: 'ocioso' })
  const campo = (nome) => (e) => setDados((d) => ({ ...d, [nome]: e.target.value }))

  async function enviar(e) {
    e.preventDefault()
    if (dados.nome.trim().length < 3) return setEstado({ tipo: 'erro', texto: 'Dê um nome à comunidade (ao menos 3 letras).' })
    if (dados.tema.trim().length < 2) return setEstado({ tipo: 'erro', texto: 'Informe o tema.' })
    if (dados.descricao.trim().length < 10) return setEstado({ tipo: 'erro', texto: 'Descreva a comunidade (ao menos 10 caracteres).' })
    setEstado({ tipo: 'enviando' })
    try {
      const r = await criarComunidade({ nome: dados.nome.trim(), tema: dados.tema.trim(), descricao: dados.descricao.trim(), ...(icone ? { icone } : {}) })
      navigate(`/comunidades/${r.comunidade.id}`)
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="mb-6 flex flex-col gap-4 rounded-xl border border-linha bg-branco p-6">
      <h2 className="font-display text-xl text-tinta">Nova comunidade</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome">
          {(p) => <Entrada {...p} maxLength={80} placeholder="Ex.: Mulheres em Dados" value={dados.nome} onChange={campo('nome')} />}
        </Campo>
        <Campo rotulo="Tema">
          {(p) => <Entrada {...p} maxLength={60} placeholder="Ex.: Ciência de dados" value={dados.tema} onChange={campo('tema')} />}
        </Campo>
      </div>
      <Campo rotulo="Descrição" ajuda={`${dados.descricao.length}/500 · Para quem é e sobre o que vocês vão conversar.`}>
        {(p) => <AreaTexto {...p} rows={3} maxLength={500} value={dados.descricao} onChange={campo('descricao')} />}
      </Campo>
      <div>
        <p className="text-sm font-semibold text-tinta-2">
          Ícone <span className="font-normal text-suave">(opcional)</span>
        </p>
        {escolhendoIcone ? (
          <div className="mt-2">
            <SeletorIcone
              publico="comunidade"
              forma="quadrado"
              valor={icone}
              rotuloBotao="Usar este ícone"
              aoEscolher={(valor) => {
                setIcone(valor)
                setEscolhendoIcone(false)
              }}
              aoCancelar={() => setEscolhendoIcone(false)}
            />
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {icone && <IconeAvatar valor={icone} forma="quadrado" className="size-12" />}
            <Botao type="button" variante="secundario" tamanho="sm" onClick={() => setEscolhendoIcone(true)}>
              {icone ? 'Trocar ícone' : 'Escolher um ícone'}
            </Botao>
            {icone && (
              <Botao type="button" variante="fantasma" tamanho="sm" onClick={() => setIcone(null)}>
                Remover
              </Botao>
            )}
          </div>
        )}
      </div>
      {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" disabled={estado.tipo === 'enviando'}>
          {estado.tipo === 'enviando' ? 'Criando…' : 'Criar comunidade'}
        </Botao>
        <Botao type="button" variante="fantasma" onClick={aoCancelar}>
          Cancelar
        </Botao>
      </div>
    </form>
  )
}

function CartaoComunidade({ c, aoParticipar, ocupada }) {
  return (
    <li className="group flex flex-col overflow-hidden rounded-2xl border border-linha bg-branco transition-shadow hover:shadow-md">
      <Link to={`/comunidades/${c.id}`} tabIndex={-1} aria-hidden="true">
        <CapaComunidade capa={c.capa} className="h-24" />
      </Link>
      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="relative -mt-7 flex items-end justify-between gap-3">
          <Link to={`/comunidades/${c.id}`} tabIndex={-1} aria-hidden="true" className="relative z-10 rounded-[22%] ring-4 ring-branco">
            <IconeComunidade comunidade={c} className="size-14 text-lg" />
          </Link>
          {c.participando ? (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-sucesso-claro px-2.5 py-1 text-xs font-semibold text-sucesso">
              <Icone nome="check" tamanho={13} /> {c.minha ? 'Você criou' : 'Participando'}
            </span>
          ) : (
            <Botao tamanho="sm" className="mb-1 h-8 rounded-full px-4" onClick={() => aoParticipar(c)} disabled={ocupada} aria-label={`Participar de ${c.nome}`}>
              {ocupada ? 'Entrando…' : 'Participar'}
            </Botao>
          )}
        </div>
        <h2 className="mt-3 font-display text-lg leading-snug text-tinta">
          <Link to={`/comunidades/${c.id}`} className="hover:text-vinho hover:underline">
            {c.nome}
          </Link>
        </h2>
        <span className="mt-1 w-fit rounded-full bg-blush px-2.5 py-0.5 text-[11px] font-semibold text-vinho">{c.tema}</span>
        <p className="mt-3 mb-4 line-clamp-2 text-sm text-tinta-2">{c.descricao}</p>
        <div className="mt-auto flex items-center gap-3 border-t border-linha pt-4">
          <PilhaAvatares pessoas={c.amostra} total={c.participantes} />
          <span className="min-w-0 text-xs text-suave">
            <span className="block font-semibold text-tinta-2">{textoParticipantes(c.participantes)}</span>
            <span className="block truncate">{textoAtividade(c)}</span>
          </span>
        </div>
      </div>
    </li>
  )
}

const ABAS = [
  { id: 'descobrir', rotulo: 'Descobrir', icone: 'busca' },
  { id: 'minhas', rotulo: 'Minhas comunidades', icone: 'grupo' },
]

function Comunidades() {
  const [parametros, setParametros] = useSearchParams()
  const aba = parametros.get('aba') === 'minhas' ? 'minhas' : 'descobrir'
  const [busca, setBusca] = useState('')
  const [estado, setEstado] = useState({ tipo: 'carregando' })
  const [ocupada, setOcupada] = useState(null)
  const [erroAcao, setErroAcao] = useState('')
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    let ativo = true
    const espera = setTimeout(
      () =>
        listarComunidades({ filtro: aba, busca: busca.trim() })
          .then((r) => ativo && setEstado({ tipo: 'pronto', lista: r.comunidades }))
          .catch((e) => ativo && setEstado({ tipo: 'erro', texto: e.message })),
      busca ? 300 : 0
    )
    return () => {
      ativo = false
      clearTimeout(espera)
    }
  }, [aba, busca])

  async function participar(c) {
    setOcupada(c.id)
    setErroAcao('')
    try {
      const r = await participarComunidade(c.id)
      setEstado((e) => ({ ...e, lista: e.lista.map((x) => (x.id === c.id ? { ...x, participando: r.participando, participantes: r.participantes } : x)) }))
    } catch (e) {
      setErroAcao(e.message)
    } finally {
      setOcupada(null)
    }
  }

  const lista = estado.lista ?? []

  return (
    <>
      <TituloPagina
        titulo="Comunidades"
        descricao="Grupos por tema para trocar dicas, tirar dúvidas e se apoiar com outras mulheres da tecnologia."
        acoes={
          !criando && (
            <Botao onClick={() => setCriando(true)}>
              <Icone nome="mais" tamanho={16} /> Criar comunidade
            </Botao>
          )
        }
      />
      {criando && <NovaComunidade aoCancelar={() => setCriando(false)} />}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Quais comunidades mostrar" className="flex rounded-full border border-linha bg-branco p-1">
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => setParametros(a.id === 'descobrir' ? {} : { aba: a.id }, { replace: true })}
              className={cn(
                'inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors sm:flex-none',
                aba === a.id ? 'bg-vinho text-white' : 'text-tinta-2 hover:text-tinta'
              )}
            >
              <Icone nome={a.icone} tamanho={15} /> {a.rotulo}
            </button>
          ))}
        </div>
        <Entrada type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou tema" aria-label="Buscar comunidade" className="h-10 sm:max-w-72" />
      </div>

      {erroAcao && (
        <Aviso tipo="erro" className="mb-4">
          {erroAcao}
        </Aviso>
      )}
      {estado.tipo === 'carregando' && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Esqueleto key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      )}
      {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
      {estado.tipo === 'pronto' &&
        (lista.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {lista.map((c) => (
              <CartaoComunidade key={c.id} c={c} aoParticipar={participar} ocupada={ocupada === c.id} />
            ))}
          </ul>
        ) : (
          !criando && (
            <Vazio className="bg-branco">
              <VazioIcone>
                <Icone nome="grupo" />
              </VazioIcone>
              <VazioTitulo>
                {busca ? 'Nenhuma comunidade encontrada' : aba === 'minhas' ? 'Você ainda não participa de comunidades' : 'Você já participa de todas as comunidades'}
              </VazioTitulo>
              <VazioDescricao>
                {busca
                  ? 'Tente outro nome ou tema, ou crie uma comunidade sobre esse assunto.'
                  : aba === 'minhas'
                    ? 'Encontre um grupo em Descobrir ou crie o seu.'
                    : 'Que tal criar uma nova sobre um tema que ainda não existe?'}
              </VazioDescricao>
              <VazioAcoes>
                {aba === 'minhas' && !busca ? (
                  <Botao onClick={() => setParametros({}, { replace: true })}>Descobrir comunidades</Botao>
                ) : (
                  <Botao onClick={() => setCriando(true)}>Criar comunidade</Botao>
                )}
              </VazioAcoes>
            </Vazio>
          )
        ))}
    </>
  )
}

export default Comunidades
