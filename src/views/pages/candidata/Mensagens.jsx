import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import TituloPagina from '../../components/candidata/TituloPagina'
import { useRecurso } from '../../components/candidata/useRecurso'
import Icone from '../../components/Icone'
import MarcaEmpresa from '../../components/MarcaEmpresa'
import Avatar from '../../components/comunidade/Avatar'
import Botao from '../../components/ui/Botao'
import { Aviso, Entrada } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { lerPerfis, tempoRelativo } from '../../services/comunidade'
import { abrirConversaCandidata, DISPONIVEL, listarConversas, listarConversasCandidatas } from '../../services/recursos'
import { cn } from '../../lib/cn'

// Lista de conversas (com busca). "empresa" mostra a marca da empresa no
// lugar da foto; "vazio" é o texto quando não há conversa.
function ListaConversas({ conversas, base, empresa = false, vazio }) {
  const [busca, setBusca] = useState('')
  const alvo = busca.trim().toLowerCase()
  const filtradas = conversas.filter((c) => c.participante.nome.toLowerCase().includes(alvo))

  return (
    <div className="rounded-xl border border-linha bg-branco">
      <div className="border-b border-linha p-4">
        <Entrada type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar conversa" aria-label="Buscar conversa" />
      </div>
      {filtradas.length === 0 ? (
        <Vazio className="border-0">
          <VazioTitulo>{busca ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}</VazioTitulo>
          <VazioDescricao>{busca ? 'Tente outro nome.' : vazio}</VazioDescricao>
        </Vazio>
      ) : (
        <ul className="divide-y divide-linha">
          {filtradas.map((c) => (
            <li key={c.id}>
              <Link to={`${base}/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-papel">
                {empresa ? (
                  <MarcaEmpresa empresa={{ foto: c.participante.foto, sigla: c.participante.nome.slice(0, 2), cor: '#f4e4e9', corTexto: '#85243d' }} tamanho="md" />
                ) : (
                  <Avatar nome={c.participante.nome} foto={c.participante.foto} />
                )}
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate', c.naoLidas ? 'font-bold text-tinta' : 'font-semibold text-tinta-2')}>{c.participante.nome}</span>
                  {c.vaga && <span className="block truncate text-xs text-vinho">{c.vaga}</span>}
                  <span className={cn('block truncate text-sm', c.naoLidas ? 'font-semibold text-tinta' : 'text-suave')}>{c.ultimaMensagem}</span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="text-xs text-suave">{tempoRelativo(c.atualizadaEm)}</span>
                  {c.naoLidas > 0 && (
                    <span className="rounded-full bg-vinho px-2 text-xs font-bold text-white" aria-label={`${c.naoLidas} não lidas`}>
                      {c.naoLidas}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Começar conversa com outra candidata: busca pelo nome, área ou interesse.
function NovaConversa({ aoFechar }) {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [pessoas, setPessoas] = useState(null)
  const [erro, setErro] = useState('')
  const [abrindo, setAbrindo] = useState(null)

  useEffect(() => {
    let ativo = true
    const espera = setTimeout(
      () =>
        lerPerfis({ busca })
          .then((r) => ativo && setPessoas(r.perfis))
          .catch((e) => ativo && setErro(e.message)),
      busca ? 250 : 0
    )
    return () => {
      ativo = false
      clearTimeout(espera)
    }
  }, [busca])

  async function abrir(pessoa) {
    setAbrindo(pessoa.id)
    setErro('')
    try {
      const r = await abrirConversaCandidata(pessoa.id)
      navigate(`/candidata/mensagens/candidatas/${r.conversa.id}`)
    } catch (e) {
      setErro(e.message)
      setAbrindo(null)
    }
  }

  // Quem eu sigo aparece primeiro.
  const lista = (pessoas ?? []).slice().sort((a, b) => Number(b.seguindo) - Number(a.seguindo)).slice(0, 12)

  return (
    <section aria-labelledby="titulo-nova-conversa" className="mb-4 rounded-xl border border-linha bg-branco p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="titulo-nova-conversa" className="font-display text-xl text-tinta">
          Nova conversa
        </h2>
        <Botao variante="fantasma" tamanho="sm" onClick={aoFechar}>
          Fechar
        </Botao>
      </div>
      <Entrada type="search" autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar candidata por nome, área ou interesse" aria-label="Buscar candidata" className="mt-3" />
      {erro && (
        <Aviso tipo="erro" className="mt-3">
          {erro}
        </Aviso>
      )}
      {pessoas === null && !erro ? (
        <p className="mt-3 text-sm text-suave">Carregando…</p>
      ) : lista.length === 0 ? (
        <p className="mt-3 text-sm text-suave">{busca ? 'Nenhuma candidata encontrada.' : 'Ainda não há outras candidatas com perfil público.'}</p>
      ) : (
        <ul className="mt-2 divide-y divide-linha">
          {lista.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <Avatar nome={p.nome} foto={p.foto} tamanho="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-tinta">{p.nome}</span>
                <span className="block truncate text-xs text-suave">{[p.area, p.seguindo && 'você segue'].filter(Boolean).join(' · ') || 'Área não informada'}</span>
              </span>
              <Botao tamanho="sm" variante="secundario" disabled={abrindo !== null} onClick={() => abrir(p)}>
                {abrindo === p.id ? 'Abrindo…' : 'Conversar'}
              </Botao>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Mensagens da candidata: abas "Candidatas" (conversas entre integrantes) e
// "Empresas" (contato profissional, ligado às candidaturas).
function MensagensCandidata() {
  const [parametros, setParametros] = useSearchParams()
  const aba = parametros.get('aba') === 'empresas' ? 'empresas' : 'candidatas'
  const [novaConversa, setNovaConversa] = useState(false)
  const candidatas = useRecurso(true, listarConversasCandidatas)
  const empresas = useRecurso(DISPONIVEL.mensagens, listarConversas)

  const naoLidas = (r) => (r.estado === 'pronto' ? (r.dados.conversas ?? []).reduce((t, c) => t + c.naoLidas, 0) : 0)
  const abas = [
    { id: 'candidatas', rotulo: 'Candidatas', icone: 'grupo', total: naoLidas(candidatas) },
    { id: 'empresas', rotulo: 'Empresas', icone: 'predio', total: naoLidas(empresas) },
  ]
  const atual = aba === 'candidatas' ? candidatas : empresas

  return (
    <>
      <TituloPagina
        titulo="Mensagens"
        descricao="Converse com outras mulheres da tecnologia e com as empresas dos seus processos seletivos."
        acoes={
          aba === 'candidatas' &&
          !novaConversa && (
            <Botao onClick={() => setNovaConversa(true)}>
              <Icone nome="mais" tamanho={16} /> Nova conversa
            </Botao>
          )
        }
      />

      <div role="tablist" aria-label="Tipo de conversa" className="mb-5 grid grid-cols-2 rounded-xl border border-linha bg-branco p-1 sm:inline-grid sm:w-auto">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={aba === a.id}
            onClick={() => setParametros(a.id === 'candidatas' ? {} : { aba: a.id }, { replace: true })}
            className={cn(
              'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors',
              aba === a.id ? 'bg-vinho text-white' : 'text-tinta-2 hover:bg-papel-2 hover:text-tinta'
            )}
          >
            <Icone nome={a.icone} tamanho={16} /> {a.rotulo}
            {a.total > 0 && (
              <span className={cn('rounded-full px-1.5 text-xs font-bold tabular-nums', aba === a.id ? 'bg-white text-vinho' : 'bg-vinho text-white')} aria-label={`${a.total} não lidas`}>
                {a.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {aba === 'candidatas' && novaConversa && <NovaConversa aoFechar={() => setNovaConversa(false)} />}

      {atual.estado === 'carregando' && !atual.anterior && <Esqueleto className="h-64 rounded-xl" />}
      {atual.estado === 'erro' && <Aviso tipo="erro">{atual.erro}</Aviso>}
      {atual.estado === 'pronto' &&
        (aba === 'candidatas' ? (
          <ListaConversas conversas={atual.dados.conversas ?? []} base="/candidata/mensagens/candidatas" vazio="Comece uma conversa pelo botão “Nova conversa” ou pelo perfil de outra integrante." />
        ) : (
          <ListaConversas conversas={atual.dados.conversas ?? []} base="/candidata/mensagens" empresa vazio="Uma conversa com empresa começa pela página de uma candidatura, com o botão de mensagem." />
        ))}
    </>
  )
}

// Lista de conversas com candidatas, vista pela empresa (só conversas de
// processos seletivos).
function MensagensEmpresa({ base, descricao }) {
  const r = useRecurso(DISPONIVEL.mensagens, listarConversas)
  return (
    <>
      <TituloPagina titulo="Mensagens" descricao={descricao} />
      {r.estado === 'carregando' && <Esqueleto className="h-64 rounded-xl" />}
      {r.estado === 'erro' && <Aviso tipo="erro">{r.erro}</Aviso>}
      {r.estado === 'pronto' && <ListaConversas conversas={r.dados.conversas ?? []} base={base} vazio="Uma conversa começa pela página de uma candidatura, com o botão de mensagem." />}
    </>
  )
}

// "base" é a rota da área: a candidata vê as duas abas; a empresa, só as
// conversas dos processos seletivos (a API separa pelo tipo da conta).
export function Mensagens({ base = '/candidata/mensagens', descricao }) {
  if (base === '/candidata/mensagens') return <MensagensCandidata />
  return <MensagensEmpresa base={base} descricao={descricao ?? 'Converse com as candidatas das suas vagas.'} />
}

export default Mensagens
