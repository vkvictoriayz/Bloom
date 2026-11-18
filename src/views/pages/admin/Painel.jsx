import { Link, useSearchParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import { BarraPartes, Indicador, BarrasRanking, Cartao, Faisca, GraficoBarras, GraficoLinhas, Rosca, Tendencia } from '../../components/admin/Graficos'
import { agruparSemanas, CORES } from '../../components/admin/cores'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import { dataHora, lerPainel } from '../../services/admin'
import { STATUS_CANDIDATURA } from '../../services/empresa'
import { cn } from '../../lib/cn'

const PERIODOS = [7, 14, 30, 90]
const TIPOS_PUBLICACAO = { dica: 'Dicas', conquista: 'Conquistas', projeto: 'Projetos', duvida: 'Dúvidas', experiencia: 'Experiências', oportunidade: 'Oportunidades' }
const SITUACOES = { verificado: 'Verificado', pendente: 'Pendente', nao_verificado: 'Não verificado', aberta: 'Aberta', resolvida: 'Resolvida', arquivada: 'Arquivada', descartada: 'Descartada' }
const CORES_SITUACAO = { verificado: CORES[2], resolvida: CORES[2], Aberta: CORES[2], pendente: CORES[1], aberta: CORES[1], Pausada: CORES[1], nao_verificado: CORES[0], Encerrada: CORES[0], arquivada: CORES[3], descartada: CORES[3], Rascunho: CORES[3] }
const nomeBonito = (v) => SITUACOES[v] ?? (v ? String(v)[0].toUpperCase() + String(v).slice(1).replace(/_/g, ' ') : 'Não informado')
const partesDe = (lista) => lista.map((l, i) => ({ rotulo: nomeBonito(l.rotulo), total: l.total, cor: CORES_SITUACAO[l.rotulo] ?? CORES[i % CORES.length] }))
const diaCurto = (iso) => {
  const [, m, d] = String(iso).split('-')
  return `${d}/${m}`
}

function FiltroPeriodo({ dias, aoMudar }) {
  return (
    <div role="radiogroup" aria-label="Período" className="inline-flex rounded-full border border-linha bg-branco p-1">
      {PERIODOS.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={dias === p}
          onClick={() => aoMudar(p)}
          className={cn('h-8 rounded-full px-3.5 text-sm font-semibold transition-colors', dias === p ? 'bg-vinho text-white' : 'text-tinta-2 hover:bg-papel-2')}
        >
          {p} dias
        </button>
      ))}
    </div>
  )
}

function EstadoPoucosDados({ children }) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-linha-forte bg-papel px-6 py-8 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-blush text-vinho" aria-hidden="true">
        <Icone nome="grafico" tamanho={18} />
      </span>
      <p className="max-w-sm text-sm text-tinta-2">{children}</p>
    </div>
  )
}

function Painel() {
  const [parametros, setParametros] = useSearchParams()
  const dias = PERIODOS.includes(Number(parametros.get('periodo'))) ? Number(parametros.get('periodo')) : 30
  const r = useCarregar(() => lerPainel(dias), [dias])

  function mudarPeriodo(p) {
    const n = new URLSearchParams(parametros)
    if (p === 30) n.delete('periodo')
    else n.set('periodo', String(p))
    setParametros(n, { replace: true })
  }

  const cabecalho = (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold tracking-[0.14em] text-vinho uppercase">Administração</p>
        <h1 className="mt-1 font-display text-4xl text-tinta">Painel da Bloom</h1>
        <p className="mt-1 text-sm text-suave">Indicadores calculados direto do banco de dados.</p>
      </div>
      <FiltroPeriodo dias={dias} aoMudar={mudarPeriodo} />
    </header>
  )

  if (r.tipo === 'carregando') {
    return (
      <>
        {cabecalho}
        <Carregando quantidade={3} altura="h-40" />
      </>
    )
  }
  if (r.tipo === 'erro') {
    return (
      <>
        {cabecalho}
        <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />
      </>
    )
  }

  const d = r.dados
  const t = d.totais
  const g = d.graficos
  const c = g.comparativo
  const inicioPeriodo = g.periodo.desde
  const fotos = d.historico.filter((h) => h.data >= inicioPeriodo)
  const fotosAntes = d.historico.filter((h) => h.data >= g.periodo.anteriorDesde && h.data < inicioPeriodo)
  const novasNoPeriodo = fotos.reduce((a, h) => a + (h.novasUsuarias ?? 0) + (h.novasEmpresas ?? 0), 0)
  const novasAntes = fotosAntes.reduce((a, h) => a + (h.novasUsuarias ?? 0) + (h.novasEmpresas ?? 0), 0)
  const cobreTudo = d.historico[0] && d.historico[0].data <= inicioPeriodo
  const premiumTotal = g.contas.usuarias.premium + g.contas.empresas.premium

  const pendencias = [
    d.pendencias.denuncias > 0 && { texto: `${d.pendencias.denuncias} ${d.pendencias.denuncias === 1 ? 'denúncia aberta' : 'denúncias abertas'}`, para: '/admin/denuncias', icone: 'info' },
    d.pendencias.representantes > 0 && {
      texto: `${d.pendencias.representantes} ${d.pendencias.representantes === 1 ? 'empresa aguarda' : 'empresas aguardam'} confirmação do representante`,
      para: '/admin/empresas?representante=pendente',
      icone: 'predio',
    },
    d.suspensas.usuarias > 0 && { texto: `${d.suspensas.usuarias} ${d.suspensas.usuarias === 1 ? 'candidata suspensa' : 'candidatas suspensas'}`, para: '/admin/candidatas?situacao=suspensas', icone: 'perfil' },
    d.suspensas.empresas > 0 && { texto: `${d.suspensas.empresas} ${d.suspensas.empresas === 1 ? 'empresa suspensa' : 'empresas suspensas'}`, para: '/admin/empresas?situacao=suspensas', icone: 'predio' },
  ].filter(Boolean)

  const barras = agruparSemanas(g.vagasECandidaturas.dias, [g.vagasECandidaturas.vagas, g.vagasECandidaturas.candidaturas])
  const a = g.atividade
  const confirmacao = (x) => [
    { rotulo: 'Confirmado', total: x.confirmados, cor: CORES[2] },
    { rotulo: 'Pendente', total: x.pendentes, cor: CORES[1] },
  ]
  const cpf = [
    { rotulo: 'Verificado', total: d.cpf.verificado ?? 0, cor: CORES[2] },
    { rotulo: 'Pendente', total: d.cpf.pendente ?? 0, cor: CORES[1] },
    { rotulo: 'Não verificado', total: d.cpf.nao_verificado ?? 0, cor: CORES[0] },
  ]
  const rotuloPeriodo = `${diaCurto(g.periodo.desde)} a ${diaCurto(g.periodo.ate)}`

  return (
    <>
      {cabecalho}

      {pendencias.length > 0 && (
        <section aria-label="Pendências" className="mb-6 flex flex-wrap gap-2">
          {pendencias.map((p) => (
            <Link key={p.para} to={p.para} className="inline-flex items-center gap-2 rounded-full bg-alerta-claro px-3.5 py-2 text-sm font-semibold text-alerta hover:underline">
              <Icone nome={p.icone} tamanho={15} /> {p.texto} <Icone nome="seta" tamanho={13} />
            </Link>
          ))}
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6">
        <Indicador
          icone="perfil"
          rotulo="Candidatas"
          valor={t.usuarias}
          detalhe={d.suspensas.usuarias ? `${d.suspensas.usuarias} suspensas` : 'Contas de candidatas'}
          faisca={<Faisca valores={d.historico.map((h) => h.usuarias)} cor={CORES[0]} />}
          para="/admin/candidatas"
        />
        <Indicador
          icone="predio"
          rotulo="Empresas"
          valor={t.empresas}
          detalhe={d.suspensas.empresas ? `${d.suspensas.empresas} suspensas` : 'Contas de empresas'}
          faisca={<Faisca valores={d.historico.map((h) => h.empresas)} cor={CORES[1]} />}
          para="/admin/empresas"
        />
        <Indicador
          icone="maleta"
          rotulo="Vagas publicadas"
          valor={t.vagas}
          tendencia={<Tendencia atual={c.vagas.atual} anterior={c.vagas.anterior} rotulo={`${c.vagas.atual} no período`} />}
          detalhe={`${t.vagasAbertas} abertas agora`}
          para="/admin/vagas"
        />
        <Indicador
          icone="candidaturas"
          rotulo="Candidaturas"
          valor={t.candidaturas}
          tendencia={<Tendencia atual={c.candidaturas.atual} anterior={c.candidaturas.anterior} rotulo={`${c.candidaturas.atual} no período`} />}
          faisca={<Faisca valores={g.vagasECandidaturas.candidaturas} cor={CORES[3]} />}
        />
        <Indicador
          icone="coroa"
          rotulo="Contas Premium"
          valor={premiumTotal}
          detalhe={`${g.contas.usuarias.premium} ${g.contas.usuarias.premium === 1 ? 'candidata' : 'candidatas'} · ${g.contas.empresas.premium} ${g.contas.empresas.premium === 1 ? 'empresa' : 'empresas'}`}
          para="/admin/pagamentos"
        />
        <Indicador
          icone="mais"
          rotulo="Novos cadastros"
          valor={novasNoPeriodo}
          tendencia={cobreTudo && fotosAntes.length ? <Tendencia atual={novasNoPeriodo} anterior={novasAntes} /> : null}
          detalhe={cobreTudo ? `Nos últimos ${dias} dias` : d.historico[0] ? `Registros desde ${diaCurto(d.historico[0].data)}` : 'Sem registros diários ainda'}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Cartao titulo="Evolução dos cadastros" descricao="Total de contas registrado a cada dia pelo painel.">
          {fotos.length >= 2 ? (
            <GraficoLinhas
              dias={fotos.map((h) => h.data)}
              legenda="ultimo"
              titulo="Total de contas por dia"
              series={[
                { nome: 'Candidatas', cor: CORES[0], valores: fotos.map((h) => h.usuarias) },
                { nome: 'Empresas', cor: CORES[1], valores: fotos.map((h) => h.empresas) },
              ]}
            />
          ) : (
            <EstadoPoucosDados>O painel guarda uma foto dos totais uma vez por dia. A linha aparece quando houver pelo menos dois dias registrados neste período.</EstadoPoucosDados>
          )}
        </Cartao>
        <Cartao titulo="Tipos de conta" descricao="Contas gratuitas e Premium, por perfil.">
          <Rosca
            rotuloCentro="contas"
            partes={[
              { rotulo: 'Candidatas', total: g.contas.usuarias.gratuitas, cor: CORES[0] },
              { rotulo: 'Candidatas Premium', total: g.contas.usuarias.premium, cor: CORES[3] },
              { rotulo: 'Empresas', total: g.contas.empresas.gratuitas, cor: CORES[1] },
              { rotulo: 'Empresas Premium', total: g.contas.empresas.premium, cor: CORES[2] },
            ]}
          />
        </Cartao>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Cartao titulo="Vagas publicadas x candidaturas" descricao={`${dias > 14 ? 'Por semana' : 'Por dia'}, de ${rotuloPeriodo}.`}>
          {c.vagas.atual + c.candidaturas.atual === 0 ? (
            <EstadoPoucosDados>Nenhuma vaga publicada nem candidatura enviada neste período.</EstadoPoucosDados>
          ) : (
            <GraficoBarras
              grupos={barras.rotulos}
              titulos={barras.titulos}
              titulo="Vagas publicadas e candidaturas no período"
              series={[
                { nome: 'Vagas publicadas', cor: CORES[1], valores: barras.valores[0] },
                { nome: 'Candidaturas', cor: CORES[3], valores: barras.valores[1] },
              ]}
            />
          )}
        </Cartao>
        <Cartao titulo="Atividade de candidatas e empresas" descricao="Candidatas: publicações, comentários, mensagens e candidaturas. Empresas: publicações, mensagens, vagas e convites.">
          {g.atividadePorConta.candidatas.concat(g.atividadePorConta.empresas).every((v) => !v) ? (
            <EstadoPoucosDados>Ainda não há atividade registrada neste período.</EstadoPoucosDados>
          ) : (
            <GraficoLinhas
              dias={g.atividadePorConta.dias}
              titulo="Ações por dia de candidatas e empresas"
              series={[
                { nome: 'Candidatas', cor: CORES[0], valores: g.atividadePorConta.candidatas },
                { nome: 'Empresas', cor: CORES[1], valores: g.atividadePorConta.empresas },
              ]}
            />
          )}
        </Cartao>
      </div>

      <Cartao className="mt-6" titulo="Atividade na rede" descricao={`Publicações, comentários, mensagens e candidaturas por dia, de ${rotuloPeriodo}. Passe o mouse para ver cada dia.`}>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Publicações', c.publicacoes],
            ['Mensagens', c.mensagens],
            ['Candidaturas', c.candidaturas],
            ['Vagas', c.vagas],
          ].map(([rotulo, v]) => (
            <div key={rotulo} className="rounded-xl bg-papel px-4 py-3">
              <p className="text-xs text-suave">{rotulo}</p>
              <p className="font-display text-2xl text-tinta tabular-nums">{v.atual}</p>
              <Tendencia atual={v.atual} anterior={v.anterior} rotulo="" />
            </div>
          ))}
        </div>
        <GraficoLinhas
          dias={a.dias}
          titulo="Atividade por dia no período"
          series={[
            { nome: 'Publicações', cor: CORES[0], valores: a.publicacoes },
            { nome: 'Comentários', cor: CORES[1], valores: a.comentarios },
            { nome: 'Mensagens', cor: CORES[2], valores: a.mensagens },
            { nome: 'Candidaturas', cor: CORES[3], valores: a.candidaturas },
          ]}
        />
      </Cartao>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Cartao titulo="Candidaturas por etapa" descricao="Situação de todas as candidaturas.">
          <BarrasRanking itens={STATUS_CANDIDATURA.map((s) => ({ rotulo: s, total: d.candidaturasPorStatus[s] ?? 0 }))} cor={CORES[3]} vazio="Nenhuma candidatura ainda." />
        </Cartao>
        <Cartao titulo="Vagas abertas por área" descricao="Áreas com mais vagas recebendo candidaturas.">
          <BarrasRanking itens={g.vagasPorArea} vazio="Nenhuma vaga aberta." />
        </Cartao>
        <Cartao titulo="Candidaturas por área" descricao="Onde as candidatas mais se candidatam.">
          <BarrasRanking itens={g.candidaturasPorArea} cor={CORES[3]} vazio="Nenhuma candidatura ainda." />
        </Cartao>
        <Cartao titulo="Vagas por situação" descricao="Todas as vagas cadastradas.">
          <BarraPartes partes={partesDe(g.vagasPorStatus)} vazio="Nenhuma vaga cadastrada." />
          <div className="mt-6 border-t border-linha pt-5">
            <BarraPartes rotulo="Modalidade das vagas abertas" partes={partesDe(g.vagasPorModalidade)} vazio="Nenhuma vaga aberta." />
          </div>
        </Cartao>
        <Cartao titulo="Publicações por tipo" descricao="O que a comunidade mais compartilha.">
          <BarrasRanking itens={g.publicacoesPorTipo.map((p) => ({ ...p, rotulo: TIPOS_PUBLICACAO[p.rotulo] ?? nomeBonito(p.rotulo) }))} vazio="Nenhuma publicação ainda." />
        </Cartao>
        <Cartao titulo="Comunidades mais ativas" descricao="Por número de integrantes.">
          <BarrasRanking itens={g.comunidadesMaisAtivas} cor={CORES[2]} unidade="integrantes" vazio="Nenhuma comunidade criada." />
        </Cartao>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Cartao titulo="Confiança e verificação" descricao="Quanto da base já confirmou e-mail, CPF e representante legal.">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            <BarraPartes rotulo="E-mail das candidatas" partes={confirmacao(g.emails.usuarias)} />
            <BarraPartes rotulo="E-mail das empresas" partes={confirmacao(g.emails.empresas)} />
            <BarraPartes rotulo="CPF das candidatas" partes={cpf} />
            <BarraPartes rotulo="Representante das empresas" partes={partesDe(g.representantes)} />
          </div>
        </Cartao>
        <Cartao titulo="Denúncias" descricao="Motivos mais frequentes e andamento da moderação.">
          {g.denunciasPorMotivo.length === 0 ? (
            <p className="inline-flex items-center gap-1.5 text-sm text-sucesso">
              <Icone nome="check" tamanho={16} /> Nenhuma denúncia recebida.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              <BarrasRanking itens={g.denunciasPorMotivo.map((m) => ({ ...m, rotulo: nomeBonito(m.rotulo) }))} cor={CORES[0]} />
              <BarraPartes partes={partesDe(g.denunciasPorSituacao)} rotulo="Situação" />
            </div>
          )}
        </Cartao>
      </div>

      <section aria-labelledby="titulo-acoes" className="mt-6 rounded-xl border border-linha bg-branco p-6">
        <div className="flex items-end justify-between gap-3">
          <h2 id="titulo-acoes" className="font-display text-xl text-tinta">
            Atividade recente da equipe
          </h2>
          <Link to="/admin/registro" className="inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
            Ver registro <Icone nome="seta" tamanho={14} />
          </Link>
        </div>
        {d.acoesRecentes.length === 0 ? (
          <p className="mt-3 text-sm text-suave">Nenhuma ação registrada ainda.</p>
        ) : (
          <ol className="relative mt-4 flex flex-col gap-4 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-linha">
            {d.acoesRecentes.map((ac) => (
              <li key={ac.id} className="flex gap-3">
                <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-blush text-xs font-bold text-vinho ring-4 ring-branco" aria-hidden="true">
                  {ac.admin?.[0]?.toUpperCase() ?? 'A'}
                </span>
                <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-sm">
                  <span className="min-w-0">
                    <span className="font-semibold text-tinta">{ac.admin}</span> <span className="text-tinta-2">{ac.acao.toLowerCase()}</span>
                    {ac.detalhes && <span className="block truncate text-xs text-suave">{ac.detalhes}</span>}
                  </span>
                  <span className="text-xs text-suave tabular-nums">{dataHora(ac.em)}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  )
}

export default Painel
