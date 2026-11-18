import { Link, useSearchParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import Avatar from '../../components/comunidade/Avatar'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import { IlustracaoConexoes } from '../../components/ilustracoes/Ilustracoes'
import Botao from '../../components/ui/Botao'
import { Selecao } from '../../components/ui/Campo'
import Selo from '../../components/ui/Selo'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { dataCurta, listarCandidaturasEmpresa, listarVagasEmpresa, STATUS_CANDIDATURA, VISUAL_CANDIDATURA } from '../../services/empresa'
import { cn } from '../../lib/cn'

const COR_ETAPA = { Recebida: '#b03a57', 'Em análise': '#c88f2e', 'Em entrevista': '#7b55b0', Aprovada: '#3f8a5a', Reprovada: '#928086' }
const ICONE_ETAPA = { Recebida: 'candidaturas', 'Em análise': 'relogio', 'Em entrevista': 'mensagem', Aprovada: 'trofeu', Reprovada: 'fechar' }
const PASSOS = ['Recebida', 'Em análise', 'Em entrevista', 'Aprovada']

function diasDesde(data) {
  if (!data) return ''
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const d = Math.round((hoje.getTime() - new Date(`${String(data).slice(0, 10)}T00:00:00`).getTime()) / 864e5)
  return d <= 0 ? 'hoje' : d === 1 ? 'há 1 dia' : `há ${d} dias`
}

function Progresso({ status }) {
  if (status === 'Reprovada') return <span className="text-xs text-suave">Processo encerrado</span>
  const atual = PASSOS.indexOf(status)
  return (
    <span className="flex items-center gap-1" aria-label={`Etapa ${atual + 1} de ${PASSOS.length}`}>
      {PASSOS.map((p, i) => (
        <span key={p} className="h-1.5 w-6 rounded-full" style={{ background: i <= atual ? COR_ETAPA[status] : 'var(--color-papel-2)' }} />
      ))}
    </span>
  )
}

function QuadroEtapas({ candidaturas }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {STATUS_CANDIDATURA.map((s) => {
        const daEtapa = candidaturas.filter((c) => c.status === s)
        return (
          <section key={s} aria-label={VISUAL_CANDIDATURA[s].rotulo} className="flex flex-col overflow-hidden rounded-xl border border-linha bg-papel">
            <div aria-hidden="true" className="h-1" style={{ background: COR_ETAPA[s] }} />
            <header className="flex items-center justify-between gap-2 border-b border-linha px-4 py-3">
              <Selo variante={VISUAL_CANDIDATURA[s].variante}>{VISUAL_CANDIDATURA[s].rotulo}</Selo>
              <span className="text-sm font-semibold text-tinta-2 tabular-nums">{daEtapa.length}</span>
            </header>
            <ul className="flex flex-col gap-2 p-3">
              {daEtapa.map((c) => (
                <li key={c.id}>
                  <Link to={`/empresa/candidaturas/${c.id}`} className="flex items-center gap-3 rounded-lg border border-linha bg-branco p-3 hover:border-vinho/40">
                    <Avatar nome={c.candidata.nome} foto={c.candidata.foto} tamanho="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-tinta">{c.candidata.nome}</span>
                      <span className="block truncate text-xs text-suave">{c.vaga.titulo}</span>
                    </span>
                  </Link>
                </li>
              ))}
              {daEtapa.length === 0 && <li className="px-1 py-2 text-xs text-suave">Ninguém nesta etapa.</li>}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function Candidaturas() {
  const [parametros, setParametros] = useSearchParams()
  const vaga = parametros.get('vaga') ?? ''
  const status = parametros.get('status') ?? ''
  const porEtapa = parametros.get('modo') === 'etapas'
  const r = useCarregar(() => listarCandidaturasEmpresa({ vaga }), [vaga])
  const todas = r.tipo === 'pronto' ? r.dados.candidaturas : []
  const lista = status ? todas.filter((c) => c.status === status) : todas
  const vagas = useCarregar(() => listarVagasEmpresa())

  function definir(chave, valor) {
    const p = new URLSearchParams(parametros)
    if (valor) p.set(chave, valor)
    else p.delete(chave)
    setParametros(p, { replace: true })
  }

  return (
    <>
      <TituloPagina titulo="Candidaturas recebidas" descricao="Quem se candidatou às vagas da empresa e em que etapa está cada processo." />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" role="group" aria-label="Filtrar por etapa">
        {STATUS_CANDIDATURA.map((s) => {
          const qtd = todas.filter((c) => c.status === s).length
          const ativo = status === s
          return (
            <button
              key={s}
              type="button"
              aria-pressed={ativo}
              onClick={() => definir('status', ativo ? '' : s)}
              className={cn('relative overflow-hidden rounded-2xl border bg-branco p-4 text-left transition-colors', ativo ? 'border-vinho ring-2 ring-vinho/15' : 'border-linha hover:border-vinho/40')}
            >
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ background: COR_ETAPA[s] }} />
              <span className="flex items-center justify-between gap-2">
                <span className="grid size-9 place-items-center rounded-xl" style={{ background: `${COR_ETAPA[s]}1f`, color: COR_ETAPA[s] }} aria-hidden="true">
                  <Icone nome={ICONE_ETAPA[s]} tamanho={16} />
                </span>
                <span className="text-xs font-semibold text-suave tabular-nums">{todas.length ? Math.round((qtd / todas.length) * 100) : 0}%</span>
              </span>
              <span className="mt-3 block font-display text-2xl leading-none text-tinta tabular-nums">{r.tipo === 'pronto' ? qtd : '–'}</span>
              <span className="mt-1 block truncate text-xs font-semibold text-tinta-2">{VISUAL_CANDIDATURA[s].rotulo}</span>
            </button>
          )
        })}
      </div>

      <div className="mb-4 flex w-fit rounded-full border border-linha bg-branco p-1" role="group" aria-label="Forma de exibir">
        {[
          ['', 'Lista'],
          ['etapas', 'Por etapa'],
        ].map(([valor, rotulo]) => (
          <button
            key={rotulo}
            type="button"
            aria-pressed={(parametros.get('modo') ?? '') === valor}
            onClick={() => definir('modo', valor)}
            className={cn(
              'h-9 rounded-full px-4 text-sm font-semibold transition-colors',
              (parametros.get('modo') ?? '') === valor ? 'bg-vinho text-white' : 'text-tinta-2 hover:text-tinta'
            )}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <Selecao aria-label="Filtrar por vaga" value={vaga} onChange={(e) => definir('vaga', e.target.value)}>
          <option value="">Todas as vagas</option>
          {vagas.tipo === 'pronto' &&
            vagas.dados.vagas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.titulo}
              </option>
            ))}
        </Selecao>
        <Selecao aria-label="Filtrar por status" value={status} onChange={(e) => definir('status', e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_CANDIDATURA.map((s) => (
            <option key={s} value={s}>
              {VISUAL_CANDIDATURA[s].rotulo}
            </option>
          ))}
        </Selecao>
      </div>

      {r.tipo === 'carregando' && <Carregando />}
      {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {r.tipo === 'pronto' &&
        (lista.length === 0 ? (
          <Vazio className="bg-branco">
            <IlustracaoConexoes className="max-w-[220px]" />
            <VazioTitulo>{vaga || status ? 'Nenhuma candidatura com esses filtros' : 'Nenhuma candidatura ainda'}</VazioTitulo>
            <VazioDescricao>As candidaturas aparecem aqui assim que alguém se candidatar a uma vaga aberta da empresa.</VazioDescricao>
            <VazioAcoes>
              <Botao as={Link} to="/empresa/vagas" variante="secundario">
                Ver vagas
              </Botao>
            </VazioAcoes>
          </Vazio>
        ) : porEtapa ? (
          <QuadroEtapas candidaturas={lista} />
        ) : (
          <ul className="cartao divide-y divide-linha overflow-hidden">
            {lista.map((c) => {
              const visual = VISUAL_CANDIDATURA[c.status] ?? { variante: 'neutro', rotulo: c.status }
              return (
                <li key={c.id}>
                  <Link to={`/empresa/candidaturas/${c.id}`} className="relative grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 p-5 hover:bg-papel sm:grid-cols-[auto_1fr_auto_auto]">
                    <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ background: COR_ETAPA[c.status] }} />
                    <span className="relative">
                      <Avatar nome={c.candidata.nome} foto={c.candidata.foto} />
                      {c.status === 'Recebida' && <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-vinho ring-2 ring-branco" title="Nova" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-tinta">{c.candidata.nome}</span>
                      <span className="block truncate text-sm text-suave">
                        {[c.candidata.titulo || c.candidata.area, c.vaga.titulo].filter(Boolean).join(' · ')}
                      </span>
                      <span className="mt-1.5 block">
                        <Progresso status={c.status} />
                      </span>
                    </span>
                    <span className="col-start-2 text-sm text-tinta-2 sm:col-start-auto sm:text-right">
                      {dataCurta(c.data)}
                      <span className="block text-xs text-suave">{diasDesde(c.data)}</span>
                    </span>
                    <span className="col-start-2 flex items-center gap-2 sm:col-start-auto">
                      <Selo variante={visual.variante}>{visual.rotulo}</Selo>
                      <Icone nome="seta" tamanho={16} className="text-suave" />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ))}
    </>
  )
}

export default Candidaturas
