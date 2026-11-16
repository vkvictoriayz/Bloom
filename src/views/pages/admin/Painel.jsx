import { useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import { dataHora, dinheiro, lerPainel } from '../../services/admin'
import { STATUS_CANDIDATURA } from '../../services/empresa'

function Numero({ rotulo, valor, detalhe, para }) {
  const conteudo = (
    <>
      <dt className="text-sm text-suave">{rotulo}</dt>
      <dd className="mt-1 font-display text-3xl text-tinta tabular-nums">{valor}</dd>
      {detalhe && <dd className="mt-1 text-xs text-tinta-2">{detalhe}</dd>}
    </>
  )
  return para ? (
    <Link to={para} className="block rounded-xl border border-linha bg-branco p-4 transition-colors hover:border-vinho/40">
      {conteudo}
    </Link>
  ) : (
    <div className="rounded-xl border border-linha bg-branco p-4">{conteudo}</div>
  )
}

const diaCurto = (iso) => {
  const [, m, d] = String(iso).split('-')
  return `${d}/${m}`
}

// Contas na plataforma (candidatas + empresas) por dia, a partir das fotos
// diárias do painel. Uma série só: sem legenda; o título diz o que é.
function GraficoContas({ historico }) {
  const [foco, setFoco] = useState(null)
  if (historico.length < 2) {
    return <p className="text-sm text-suave">O gráfico aparece a partir do segundo dia de registros. O painel guarda uma foto dos totais por dia.</p>
  }
  const valores = historico.map((h) => h.usuarias + h.empresas)
  const maximo = Math.max(...valores, 1)
  const ativo = foco ?? historico.length - 1
  return (
    <figure>
      <div className="flex items-baseline justify-between gap-3">
        <figcaption className="text-sm text-tinta-2">
          <span className="font-semibold text-tinta">{diaCurto(historico[ativo].data)}</span>: {valores[ativo]} contas ({historico[ativo].usuarias} candidatas, {historico[ativo].empresas} empresas)
        </figcaption>
        <span className="text-xs text-suave tabular-nums">máx. {maximo}</span>
      </div>
      <div className="mt-3 flex h-40 items-end gap-[2px] border-b border-linha" aria-hidden="true">
        {historico.map((h, i) => (
          <div
            key={h.data}
            className="flex h-full flex-1 cursor-default items-end"
            onMouseEnter={() => setFoco(i)}
            onMouseLeave={() => setFoco(null)}
            title={`${diaCurto(h.data)}: ${valores[i]} contas`}
          >
            <div className={i === ativo ? 'w-full rounded-t bg-vinho' : 'w-full rounded-t bg-vinho/45'} style={{ height: `${Math.max(2, (valores[i] / maximo) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-suave tabular-nums" aria-hidden="true">
        <span>{diaCurto(historico[0].data)}</span>
        <span>{diaCurto(historico.at(-1).data)}</span>
      </div>
      <table className="sr-only">
        <caption>Contas na plataforma por dia</caption>
        <thead>
          <tr>
            <th>Dia</th>
            <th>Candidatas</th>
            <th>Empresas</th>
          </tr>
        </thead>
        <tbody>
          {historico.map((h) => (
            <tr key={h.data}>
              <td>{diaCurto(h.data)}</td>
              <td>{h.usuarias}</td>
              <td>{h.empresas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

function Painel() {
  const r = useCarregar(lerPainel)

  if (r.tipo === 'carregando') return <Carregando quantidade={3} altura="h-32" />
  if (r.tipo === 'erro') {
    return (
      <>
        <TituloPagina titulo="Painel" />
        <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />
      </>
    )
  }
  const d = r.dados
  const t = d.totais
  const novasHoje = d.historico.at(-1)
  const pendencias = [
    d.pendencias.representantes > 0 && {
      texto: `${d.pendencias.representantes} ${d.pendencias.representantes === 1 ? 'empresa aguarda' : 'empresas aguardam'} a confirmação do representante`,
      para: '/admin/empresas?representante=pendente',
    },
    d.suspensas.usuarias > 0 && { texto: `${d.suspensas.usuarias} ${d.suspensas.usuarias === 1 ? 'candidata suspensa' : 'candidatas suspensas'}`, para: '/admin/candidatas?situacao=suspensas' },
    d.suspensas.empresas > 0 && { texto: `${d.suspensas.empresas} ${d.suspensas.empresas === 1 ? 'empresa suspensa' : 'empresas suspensas'}`, para: '/admin/empresas?situacao=suspensas' },
  ].filter(Boolean)

  return (
    <>
      <TituloPagina titulo="Painel" descricao="Números atuais da Bloom, tirados direto do banco." />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero rotulo="Candidatas" valor={t.usuarias} detalhe={novasHoje?.novasUsuarias ? `+${novasHoje.novasUsuarias} hoje` : undefined} para="/admin/candidatas" />
        <Numero rotulo="Empresas" valor={t.empresas} detalhe={novasHoje?.novasEmpresas ? `+${novasHoje.novasEmpresas} hoje` : undefined} para="/admin/empresas" />
        <Numero rotulo="Vagas abertas" valor={t.vagasAbertas} detalhe={`${t.vagas} no total`} para="/admin/vagas?status=Aberta" />
        <Numero rotulo="Candidaturas" valor={t.candidaturas} />
        <Numero rotulo="Publicações" valor={t.publicacoes} para="/admin/publicacoes" />
        <Numero rotulo="Comunidades" valor={t.comunidades} para="/admin/comunidades" />
        <Numero rotulo="Assinaturas Premium ativas" valor={d.premium.assinaturasAtivas} para="/admin/pagamentos" />
        <Numero rotulo="Pagamentos aprovados" valor={dinheiro(d.premium.receitaAprovada)} para="/admin/pagamentos" />
      </dl>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="titulo-contas-dia" className="rounded-xl border border-linha bg-branco p-6">
          <h2 id="titulo-contas-dia" className="font-display text-xl text-tinta">
            Contas por dia
          </h2>
          <p className="mt-1 mb-4 text-xs text-suave">Candidatas e empresas cadastradas, nos últimos {d.historico.length} dias registrados.</p>
          <GraficoContas historico={d.historico} />
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="titulo-pendencias" className="rounded-xl border border-linha bg-branco p-6">
            <h2 id="titulo-pendencias" className="font-display text-xl text-tinta">
              Para revisar
            </h2>
            {pendencias.length === 0 ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-sucesso">
                <Icone nome="check" tamanho={16} /> Nada pendente.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {pendencias.map((p) => (
                  <li key={p.para}>
                    <Link to={p.para} className="flex items-center justify-between gap-2 rounded-lg bg-alerta-claro px-3 py-2 text-sm font-semibold text-alerta hover:underline">
                      {p.texto} <Icone nome="seta" tamanho={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="titulo-etapas" className="rounded-xl border border-linha bg-branco p-6">
            <h2 id="titulo-etapas" className="font-display text-xl text-tinta">
              Candidaturas por etapa
            </h2>
            <dl className="mt-3 divide-y divide-linha text-sm">
              {STATUS_CANDIDATURA.map((s) => (
                <div key={s} className="flex justify-between py-2">
                  <dt className="text-tinta-2">{s}</dt>
                  <dd className="font-semibold text-tinta tabular-nums">{d.candidaturasPorStatus[s] ?? 0}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-suave">
              CPF verificado: {d.cpf.verificado ?? 0} · não verificado: {d.cpf.nao_verificado ?? 0} · pendente: {d.cpf.pendente ?? 0}
            </p>
          </section>
        </div>
      </div>

      <section aria-labelledby="titulo-acoes" className="mt-6 rounded-xl border border-linha bg-branco p-6">
        <div className="flex items-end justify-between gap-3">
          <h2 id="titulo-acoes" className="font-display text-xl text-tinta">
            Últimas ações da equipe
          </h2>
          <Link to="/admin/registro" className="inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
            Ver registro <Icone nome="seta" tamanho={14} />
          </Link>
        </div>
        {d.acoesRecentes.length === 0 ? (
          <p className="mt-3 text-sm text-suave">Nenhuma ação registrada ainda.</p>
        ) : (
          <ul className="mt-3 divide-y divide-linha">
            {d.acoesRecentes.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="font-semibold text-tinta">{a.admin}</span> <span className="text-tinta-2">{a.acao.toLowerCase()}</span>
                  {a.detalhes && <span className="block truncate text-xs text-suave">{a.detalhes}</span>}
                </span>
                <span className="text-xs text-suave tabular-nums">{dataHora(a.em)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default Painel
