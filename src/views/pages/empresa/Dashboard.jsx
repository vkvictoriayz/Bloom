import { Link, useOutletContext } from 'react-router-dom'

import Icone from '../../components/Icone'
import { BarraPartes, Cartao, Faisca, GraficoBarras, Indicador, Rosca } from '../../components/admin/Graficos'
import { agruparSemanas, CORES } from '../../components/admin/cores'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import Botao from '../../components/ui/Botao'
import Selo from '../../components/ui/Selo'
import { dataCurta, lerDashboard, VISUAL_VAGA } from '../../services/empresa'

const ETAPAS = [
  { chave: 'recebidas', rotulo: 'Recebidas', status: 'Recebida', cor: '#b03a57' },
  { chave: 'emAnalise', rotulo: 'Em análise', status: 'Em análise', cor: '#c88f2e' },
  { chave: 'emEntrevista', rotulo: 'Em entrevista', status: 'Em entrevista', cor: '#7b55b0' },
  { chave: 'aprovadas', rotulo: 'Aprovadas', status: 'Aprovada', cor: '#3f8a5a' },
]

const porcento = (a, b) => (b ? Math.round((a / b) * 100) : 0)

function Petalas({ className }) {
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden="true">
      <g fill="currentColor">
        <path d="M49.2 45.6C43 30 28 8 5.5 5C3.5 23 20 41 49.2 45.6Z" />
        <path d="M48.6 48.4C40 46.2 31 44.8 23.5 44.6C21 56 26.5 70 35 75.5C40.5 76.5 46 62 48.6 48.4Z" />
        <path d="M50.8 45.6C57 30 72 8 94.5 5C96.5 23 80 41 50.8 45.6Z" />
        <path d="M51.4 48.4C60 46.2 69 44.8 76.5 44.6C79 56 73.5 70 65 75.5C59.5 76.5 54 62 51.4 48.4Z" />
      </g>
    </svg>
  )
}

function Funil({ t }) {
  const total = t.candidaturas
  const avancaram = [t.candidaturas, t.emAnalise + t.emEntrevista + t.aprovadas, t.emEntrevista + t.aprovadas, t.aprovadas]
  const rotulos = ['Candidaturas', 'Chegaram à análise', 'Chegaram à entrevista', 'Aprovadas']
  if (!total) return <p className="text-sm text-suave">O funil aparece quando a primeira candidatura chegar.</p>
  return (
    <ol className="flex flex-col gap-3">
      {avancaram.map((v, i) => (
        <li key={rotulos[i]}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-tinta-2">{rotulos[i]}</span>
            <span className="font-semibold text-tinta tabular-nums">
              {v} <span className="font-normal text-suave">· {porcento(v, total)}%</span>
            </span>
          </div>
          <div className="mt-1.5 flex justify-center">
            {v ? <div className="h-7 rounded-[4px] transition-all" style={{ width: `${Math.max(6, porcento(v, total))}%`, background: ETAPAS[i].cor, opacity: 0.9 - i * 0.08 }} /> : <div className="h-7 w-full rounded-[4px] border border-dashed border-linha-forte" />}
          </div>
        </li>
      ))}
      <li className="mt-1 text-xs text-suave">{t.reprovadas} {t.reprovadas === 1 ? 'candidatura não selecionada' : 'candidaturas não selecionadas'}.</li>
    </ol>
  )
}

function CartaoVaga({ v }) {
  const pct = v.limiteCandidaturas ? Math.min(100, porcento(v.candidaturas, v.limiteCandidaturas)) : null
  const visual = VISUAL_VAGA[v.status]
  return (
    <li className="cartao flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blush text-vinho" aria-hidden="true">
          <Icone nome="maleta" tamanho={20} />
        </span>
        <div className="min-w-0 flex-1">
          <Link to={`/empresa/vagas/${v.id}`} className="block truncate font-semibold text-tinta hover:text-vinho">
            {v.titulo}
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-suave">
            <Selo variante={visual?.variante}>{visual?.rotulo ?? v.status}</Selo>
            {[v.modalidade, v.dataPublicacao && `desde ${dataCurta(v.dataPublicacao)}`].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-4 gap-2 text-center">
        {[
          ['Candidaturas', v.candidaturas],
          ['Em processo', v.emProcesso],
          ['Aprovadas', v.aprovadas],
          ['Salvas', v.interessadas],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-lg bg-papel px-1 py-2">
            <dd className="font-display text-xl text-tinta tabular-nums">{valor}</dd>
            <dt className="text-[11px] text-suave">{rotulo}</dt>
          </div>
        ))}
      </dl>
      {pct !== null ? (
        <div>
          <div className="flex justify-between text-xs text-suave">
            <span>Limite de candidatas</span>
            <span className="tabular-nums">
              {v.candidaturas}/{v.limiteCandidaturas}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-papel-2" aria-hidden="true">
            <div className="h-full rounded-full bg-vinho" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : (
        <Link to={`/empresa/candidaturas?vaga=${v.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
          Ver candidaturas <Icone nome="seta" tamanho={14} />
        </Link>
      )}
    </li>
  )
}

function Dashboard() {
  const contexto = useOutletContext()
  const nome = contexto?.perfil?.empresa.nome
  const r = useCarregar(lerDashboard)

  if (r.tipo === 'carregando') return <Carregando quantidade={3} altura="h-32" />
  if (r.tipo === 'erro') return <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />

  const t = r.dados.totais
  const serie = r.dados.serie
  const semanas = serie ? agruparSemanas(serie.dias, [serie.candidaturas]) : null
  const noMes = serie ? serie.candidaturas.reduce((a, b) => a + b, 0) : 0

  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">Painel de recrutamento</h1>
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-vinho-escuro via-vinho to-rosa px-6 py-7 text-white sm:px-8">
        <Petalas className="pointer-events-none absolute -top-6 -right-6 w-56 text-white/10" />
        <Petalas className="pointer-events-none absolute right-40 -bottom-10 hidden w-32 rotate-12 text-white/10 md:block" />
        <p className="relative text-xs font-bold tracking-[0.14em] text-white/70 uppercase">Painel de recrutamento</p>
        <h2 className="relative mt-1 font-display text-3xl sm:text-4xl">{nome ? `Olá, ${nome}` : 'Seu recrutamento'}</h2>
        <p className="relative mt-2 max-w-xl text-white/85">
          {t.recebidas
            ? `${t.recebidas} ${t.recebidas === 1 ? 'candidatura aguarda' : 'candidaturas aguardam'} sua análise. ${noMes} ${noMes === 1 ? 'chegou' : 'chegaram'} nos últimos 30 dias.`
            : t.candidaturas
              ? 'Todas as candidaturas já foram analisadas. Bom trabalho!'
              : 'Publique uma vaga para começar a receber candidaturas de mulheres da tecnologia.'}
        </p>
        <div className="relative mt-5 flex flex-wrap gap-2">
          {t.recebidas > 0 && (
            <Botao as={Link} to="/empresa/candidaturas?status=Recebida" className="bg-white text-vinho hover:bg-blush">
              Analisar candidaturas <Icone nome="seta" tamanho={16} />
            </Botao>
          )}
          <Botao as={Link} to="/empresa/vagas/criar" variante="secundario" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
            <Icone nome="mais" tamanho={16} /> Nova vaga
          </Botao>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <Indicador icone="maleta" rotulo="Vagas ativas" valor={t.vagasAtivas} detalhe={`${t.vagasPublicadas} publicadas · ${t.rascunhos} ${t.rascunhos === 1 ? 'rascunho' : 'rascunhos'}`} para="/empresa/vagas?status=Aberta" />
        <Indicador icone="candidaturas" rotulo="Candidaturas" valor={t.candidaturas} detalhe={`${noMes} nos últimos 30 dias`} faisca={<Faisca valores={serie?.candidaturas} cor={CORES[0]} />} para="/empresa/candidaturas" />
        <Indicador icone="relogio" rotulo="Em análise" valor={t.emAnalise} detalhe={`${t.recebidas} aguardando início`} para="/empresa/candidaturas?status=Em%20an%C3%A1lise" />
        <Indicador icone="mensagem" rotulo="Em entrevista" valor={t.emEntrevista} para="/empresa/candidaturas?status=Em%20entrevista" />
        <Indicador icone="trofeu" rotulo="Aprovadas" valor={t.aprovadas} detalhe={t.candidaturas ? `${porcento(t.aprovadas, t.candidaturas)}% das candidaturas` : undefined} para="/empresa/candidaturas?status=Aprovada" />
        <Indicador icone="coracao" rotulo="Vagas salvas" valor={t.interessadas} detalhe="Vezes que candidatas salvaram suas vagas" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Cartao titulo="Candidaturas recebidas" descricao="Por semana, nos últimos 30 dias.">
          {noMes === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-linha-forte bg-papel px-6 py-8 text-center">
              <span className="grid size-10 place-items-center rounded-full bg-blush text-vinho" aria-hidden="true">
                <Icone nome="grafico" tamanho={18} />
              </span>
              <p className="max-w-sm text-sm text-tinta-2">Nenhuma candidatura nos últimos 30 dias.</p>
            </div>
          ) : (
            <GraficoBarras grupos={semanas.rotulos} titulos={semanas.titulos} titulo="Candidaturas por semana" series={[{ nome: 'Candidaturas', cor: CORES[0], valores: semanas.valores[0] }]} />
          )}
        </Cartao>
        <Cartao titulo="Etapas do processo" descricao="Onde está cada candidatura agora.">
          <Rosca
            rotuloCentro="candidaturas"
            vazio="Nenhuma candidatura ainda."
            partes={[...ETAPAS.map((e) => ({ rotulo: e.rotulo, total: t[e.chave], cor: e.cor })), { rotulo: 'Não selecionadas', total: t.reprovadas, cor: '#928086' }]}
          />
        </Cartao>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Cartao titulo="Funil de seleção" descricao="Quantas candidaturas avançaram em cada etapa.">
          <Funil t={t} />
        </Cartao>
        <Cartao titulo="Alcance da empresa" descricao="Como a empresa aparece para as candidatas.">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['convite', 'Convites enviados', t.convites, '/empresa/explorar', 'rede'],
              ['publicacoes', 'Publicações', t.publicacoes, '/empresa/perfil', 'megafone'],
              ['salvas', 'Vagas salvas', t.interessadas, '/empresa/vagas', 'coracao'],
            ].map(([chave, rotulo, valor, para, icone]) => (
              <Link key={chave} to={para} className="flex flex-col items-center gap-2 rounded-xl bg-papel px-2 py-4 text-center transition-colors hover:bg-blush">
                <span className="grid size-9 place-items-center rounded-full bg-branco text-vinho" aria-hidden="true">
                  <Icone nome={icone} tamanho={16} />
                </span>
                <span className="font-display text-2xl text-tinta tabular-nums">{valor}</span>
                <span className="text-xs text-suave">{rotulo}</span>
              </Link>
            ))}
          </div>
          {r.dados.modalidades?.length > 0 && (
            <div className="mt-6 border-t border-linha pt-5">
              <BarraPartes rotulo="Vagas ativas por modalidade" partes={r.dados.modalidades.map((m, i) => ({ ...m, cor: CORES[i % CORES.length] }))} />
            </div>
          )}
        </Cartao>
      </div>

      <section aria-labelledby="titulo-desempenho">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 id="titulo-desempenho" className="font-display text-2xl text-tinta">
            Desempenho das vagas
          </h2>
          <Link to="/empresa/vagas" className="inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
            Gerenciar vagas <Icone nome="seta" tamanho={14} />
          </Link>
        </div>
        {r.dados.vagas.length ? (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {r.dados.vagas.map((v) => (
              <CartaoVaga key={v.id} v={v} />
            ))}
          </ul>
        ) : (
          <p className="cartao p-6 text-sm text-suave">Publique uma vaga para acompanhar o desempenho aqui.</p>
        )}
      </section>
    </div>
  )
}

export default Dashboard
