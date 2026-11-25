import { Link, useOutletContext } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import Capa from '../../components/candidata/Capa'
import Avatar from '../../components/comunidade/Avatar'
import SeloPremium from '../../components/conta/SeloPremium'
import ContadorAnimado from '../../components/movimento/ContadorAnimado'
import { BarraPartes, BarrasRanking } from '../../components/admin/Graficos'
import { CORES } from '../../components/admin/cores'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import PublicacaoEmpresa from '../../components/empresa/PublicacaoEmpresa'
import { useCarregar } from '../../components/empresa/useCarregar'
import Botao from '../../components/ui/Botao'
import Selo from '../../components/ui/Selo'
import { fotoEmpresa, listarPublicacoesEmpresa, listarVagasEmpresa, VISUAL_VAGA } from '../../services/empresa'
import { tempoRelativo } from '../../services/comunidade'

function Petala({ className }) {
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

function Indicador({ icone, rotulo, valor, detalhe, para }) {
  return (
    <Link to={para} className="group relative overflow-hidden rounded-2xl border border-linha bg-branco p-5 transition-colors hover:border-vinho/40">
      <Petala className="absolute -top-3 -right-4 w-24 text-blush transition-transform group-hover:rotate-6" />
      <span className="relative grid size-10 place-items-center rounded-xl bg-blush text-vinho">
        <Icone nome={icone} tamanho={20} />
      </span>
      <p className="relative mt-4 font-display text-3xl text-tinta tabular-nums">{typeof valor === 'number' ? <ContadorAnimado valor={valor} /> : valor}</p>
      <p className="relative text-sm font-semibold text-tinta-2">{rotulo}</p>
      {detalhe && <p className="relative mt-0.5 text-xs text-suave">{detalhe}</p>}
    </Link>
  )
}

function Anel({ valor }) {
  const raio = 42
  const volta = 2 * Math.PI * raio
  return (
    <svg viewBox="0 0 100 100" className="size-28 shrink-0" role="img" aria-label={`Perfil ${valor}% completo`}>
      <circle cx="50" cy="50" r={raio} fill="none" stroke="var(--color-blush)" strokeWidth="9" />
      <circle
        cx="50"
        cy="50"
        r={raio}
        fill="none"
        stroke="var(--color-vinho)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${(valor / 100) * volta} ${volta}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="50" dy="0.35em" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--color-tinta)">
        {valor}%
      </text>
    </svg>
  )
}

function Completude({ dados }) {
  const { perfil } = dados
  const itens = [
    ['Logo ou foto', Boolean(fotoEmpresa(dados))],
    ['Imagem de capa', Boolean(dados.imagens?.capa)],
    ['Área de atuação', Boolean(perfil.areaAtuacao)],
    ['Descrição', Boolean(perfil.descricao)],
    ['Localização', Boolean(perfil.localizacao)],
    ['Site', Boolean(perfil.site)],
    ['LinkedIn', Boolean(perfil.linkedin)],
    ['Informações extras', Boolean(perfil.informacoes)],
  ]
  const feitos = itens.filter(([, ok]) => ok).length
  const valor = Math.round((feitos / itens.length) * 100)
  return (
    <section className="cartao p-6" aria-labelledby="titulo-completude">
      <h2 id="titulo-completude" className="font-display text-2xl text-tinta">
        Força do perfil
      </h2>
      <p className="mt-1 text-sm text-suave">Perfis completos passam mais confiança para as candidatas.</p>
      <div className="mt-5 flex flex-col items-center gap-5">
        <Anel valor={valor} />
        <ul className="grid w-full grid-cols-2 gap-x-3 gap-y-2 text-sm">
          {itens.map(([rotulo, ok]) => (
            <li key={rotulo} className={ok ? 'inline-flex items-center gap-1.5 text-tinta-2' : 'inline-flex items-center gap-1.5 text-suave'}>
              <span className={ok ? 'grid size-4 place-items-center rounded-full bg-sucesso text-branco' : 'size-4 rounded-full border-2 border-linha-forte'} aria-hidden="true">
                {ok && <Icone nome="check" tamanho={10} />}
              </span>
              {rotulo}
              <span className="sr-only">{ok ? '(preenchido)' : '(faltando)'}</span>
            </li>
          ))}
        </ul>
      </div>
      {valor < 100 && (
        <Botao as={Link} to="/empresa/perfil/editar" variante="secundario" tamanho="sm" className="mt-5">
          Completar perfil <Icone nome="seta" tamanho={14} />
        </Botao>
      )}
    </section>
  )
}

function AtividadeRecente({ vagas, publicacoes }) {
  const eventos = [
    ...vagas.filter((v) => v.dataPublicacao).map((v) => ({ id: `v${v.id}`, em: v.dataPublicacao, icone: 'maleta', texto: `Vaga publicada: ${v.titulo}`, para: `/empresa/vagas/${v.id}` })),
    ...publicacoes.map((p) => ({ id: `p${p.id}`, em: p.criadaEm, icone: 'megafone', texto: p.texto.length > 70 ? `${p.texto.slice(0, 70)}…` : p.texto, para: null })),
  ]
    .sort((a, b) => new Date(b.em) - new Date(a.em))
    .slice(0, 5)
  return (
    <section className="cartao p-6" aria-labelledby="titulo-atividade">
      <h2 id="titulo-atividade" className="font-display text-xl text-tinta">
        Atividade recente
      </h2>
      {eventos.length === 0 ? (
        <p className="mt-3 text-sm text-suave">As vagas e publicações da empresa aparecem aqui.</p>
      ) : (
        <ol className="relative mt-4 flex flex-col gap-4 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-linha">
          {eventos.map((e) => {
            const corpo = (
              <>
                <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-blush text-vinho ring-4 ring-branco" aria-hidden="true">
                  <Icone nome={e.icone} tamanho={14} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-tinta-2">{e.texto}</span>
                  <span className="block text-xs text-suave">{tempoRelativo(e.em)}</span>
                </span>
              </>
            )
            return (
              <li key={e.id}>
                {e.para ? (
                  <Link to={e.para} className="flex gap-3 hover:text-vinho">
                    {corpo}
                  </Link>
                ) : (
                  <div className="flex gap-3">{corpo}</div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function Perfil() {
  const { perfil: dados, erroPerfil, recarregarPerfil } = useOutletContext()
  const vagas = useCarregar(() => listarVagasEmpresa())
  const pubs = useCarregar(listarPublicacoesEmpresa)

  if (erroPerfil) {
    return (
      <>
        <TituloPagina titulo="Perfil da empresa" />
        <ErroAoCarregar erro={erroPerfil} aoTentar={recarregarPerfil} />
      </>
    )
  }
  if (!dados) return <Carregando quantidade={2} altura="h-48" />

  const { empresa, perfil, numeros } = dados
  let host = ''
  try {
    host = perfil.site ? new URL(perfil.site).hostname.replace(/^www\./, '') : ''
  } catch {
    host = ''
  }
  const listaVagas = vagas.tipo === 'pronto' ? vagas.dados.vagas : []
  const porVaga = [...listaVagas]
    .filter((v) => v.status !== 'Rascunho')
    .sort((a, b) => b.candidaturas - a.candidaturas)
    .slice(0, 5)
    .map((v) => ({ rotulo: v.titulo, total: v.candidaturas }))
  const modalidades = new Map()
  listaVagas.filter((v) => v.status === 'Aberta').forEach((v) => modalidades.set(v.modalidade || 'Não informada', (modalidades.get(v.modalidade || 'Não informada') ?? 0) + 1))
  const partesModalidade = [...modalidades.entries()].map(([rotulo, total], i) => ({ rotulo, total, cor: CORES[i % CORES.length] }))

  return (
    <>
      <TituloPagina titulo="Perfil da empresa" descricao="É assim que sua empresa aparece na Bloom." />

      <section className="cartao overflow-hidden">
        <Capa imagem={dados.imagens?.capa} className="rounded-none" />
        <div className="relative px-6 pb-7 sm:px-8">
          <Petala className="pointer-events-none absolute right-6 bottom-4 hidden w-40 text-blush/70 lg:block" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Avatar nome={empresa.nome} foto={fotoEmpresa(dados)} tamanho="xl" className="relative z-10 -mt-14 rounded-2xl bg-branco ring-4 ring-branco sm:-mt-16 [&]:rounded-2xl" />
            <div className="flex flex-wrap gap-2 self-start sm:self-auto">
              <Botao as={Link} to={`/empresas/${empresa.id}`} variante="fantasma" tamanho="sm">
                <Icone nome="olho" tamanho={16} /> Ver como candidata
              </Botao>
              <Botao as={Link} to="/empresa/perfil/editar" variante="secundario" tamanho="sm">
                <Icone nome="editar" tamanho={16} /> Editar perfil
              </Botao>
            </div>
          </div>
          <div className="relative mt-4 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl leading-tight text-tinta">{empresa.nome}</h1>
            {empresa.premium && <SeloPremium />}
          </div>
          {perfil.areaAtuacao && (
            <p className="relative mt-2 inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1 text-sm font-semibold text-vinho">
              <Icone nome="broto" tamanho={14} /> {perfil.areaAtuacao}
            </p>
          )}
          <ul className="relative mt-4 flex flex-wrap gap-2 text-sm text-tinta-2">
            {perfil.localizacao && (
              <li className="inline-flex items-center gap-1.5 rounded-full border border-linha px-3 py-1">
                <Icone nome="local" tamanho={16} className="text-vinho" /> {perfil.localizacao}
              </li>
            )}
            {host && (
              <li>
                <a href={perfil.site} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-linha px-3 py-1 font-semibold text-vinho hover:bg-blush">
                  <Icone nome="link" tamanho={16} /> {host}
                </a>
              </li>
            )}
            {perfil.linkedin && (
              <li>
                <a href={perfil.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-linha px-3 py-1 font-semibold text-vinho hover:bg-blush">
                  <Icone nome="externo" tamanho={16} /> LinkedIn
                </a>
              </li>
            )}
            <li className="inline-flex items-center gap-1.5 rounded-full border border-linha px-3 py-1">
              <Icone nome="email" tamanho={16} className="text-vinho" /> {perfil.emailContato || empresa.email}
            </li>
          </ul>
          <p className={perfil.descricao ? 'relative mt-5 max-w-3xl leading-relaxed text-tinta-2' : 'relative mt-5 text-sm text-suave'}>
            {perfil.descricao || 'Adicione uma descrição para apresentar a empresa às candidatas.'}
          </p>
          {perfil.informacoes && <p className="relative mt-3 max-w-3xl text-sm leading-relaxed whitespace-pre-line text-tinta-2">{perfil.informacoes}</p>}
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Indicador icone="maleta" rotulo="Vagas abertas" valor={numeros.vagasAbertas} detalhe={vagas.tipo === 'pronto' ? `${listaVagas.length} no total` : undefined} para="/empresa/vagas" />
        <Indicador icone="candidaturas" rotulo="Candidaturas" valor={numeros.candidaturas} detalhe={numeros.pendentes ? `${numeros.pendentes} aguardando análise` : 'Tudo analisado'} para="/empresa/candidaturas" />
        <Indicador icone="megafone" rotulo="Publicações" valor={numeros.publicacoes} detalhe="No feed da Bloom" para="/empresa/feed" />
        <Indicador icone="grafico" rotulo="Painel" valor={<Icone nome="seta" tamanho={28} />} detalhe="Métricas de recrutamento" para="/empresa/dashboard" />
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex min-w-0 flex-col gap-4" aria-labelledby="titulo-publicacoes">
          <div className="flex items-center justify-between gap-3">
            <h2 id="titulo-publicacoes" className="font-display text-2xl text-tinta">
              Publicações da empresa
            </h2>
            <Botao as={Link} to="/empresa/feed" tamanho="sm">
              <Icone nome="mais" tamanho={16} /> Nova publicação
            </Botao>
          </div>
          {pubs.tipo === 'carregando' && <Carregando quantidade={2} altura="h-32" />}
          {pubs.tipo === 'erro' && <ErroAoCarregar erro={pubs.erro} aoTentar={pubs.recarregar} />}
          {pubs.tipo === 'pronto' &&
            (pubs.dados.publicacoes.length === 0 ? (
              <div className="cartao flex flex-col items-center gap-3 px-6 py-10 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-blush text-vinho" aria-hidden="true">
                  <Icone nome="megafone" tamanho={26} />
                </span>
                <p className="font-display text-xl text-tinta">Sua empresa ainda não publicou</p>
                <p className="max-w-sm text-sm text-suave">Divulgue vagas, eventos e novidades no feed para aparecer para as integrantes da Bloom.</p>
                <Botao as={Link} to="/empresa/feed" variante="secundario" tamanho="sm">
                  Escrever no feed
                </Botao>
              </div>
            ) : (
              pubs.dados.publicacoes.map((p) => <PublicacaoEmpresa key={p.id} publicacao={p} gerenciavel aoExcluir={pubs.recarregar} />)
            ))}
        </section>

        <aside className="flex flex-col gap-5">
          <Completude dados={dados} />
          <section className="cartao p-6" aria-labelledby="titulo-por-vaga">
            <h2 id="titulo-por-vaga" className="font-display text-xl text-tinta">
              Candidaturas por vaga
            </h2>
            <p className="mt-1 mb-5 text-sm text-suave">As vagas que mais atraem candidatas.</p>
            {vagas.tipo === 'carregando' && <Carregando quantidade={2} altura="h-10" />}
            {vagas.tipo === 'erro' && <ErroAoCarregar erro={vagas.erro} aoTentar={vagas.recarregar} />}
            {vagas.tipo === 'pronto' && <BarrasRanking itens={porVaga} cor="#85243d" vazio="Publique uma vaga para ver as candidaturas aqui." />}
            {partesModalidade.length > 0 && (
              <div className="mt-6 border-t border-linha pt-5">
                <BarraPartes partes={partesModalidade} rotulo="Vagas abertas por modalidade" />
              </div>
            )}
          </section>
          <section className="cartao p-6" aria-labelledby="titulo-vagas-perfil">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="titulo-vagas-perfil" className="font-display text-xl text-tinta">
                Vagas divulgadas
              </h2>
              <Link to="/empresa/vagas" className="text-sm font-semibold text-vinho hover:underline">
                Gerenciar
              </Link>
            </div>
            {vagas.tipo === 'pronto' && listaVagas.length === 0 && (
              <p className="text-sm text-suave">
                Nenhuma vaga ainda.{' '}
                <Link to="/empresa/vagas/criar" className="font-semibold text-vinho hover:underline">
                  Criar a primeira
                </Link>
              </p>
            )}
            <ul className="flex flex-col gap-2">
              {listaVagas.slice(0, 4).map((v) => (
                <li key={v.id}>
                  <Link to={`/empresa/vagas/${v.id}`} className="flex items-center gap-3 rounded-xl border border-linha p-3 transition-colors hover:border-vinho/40 hover:bg-papel">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blush text-vinho" aria-hidden="true">
                      <Icone nome="maleta" tamanho={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-tinta">{v.titulo}</span>
                      <span className="block truncate text-xs text-suave">{[v.modalidade, `${v.candidaturas} ${v.candidaturas === 1 ? 'candidatura' : 'candidaturas'}`].filter(Boolean).join(' · ')}</span>
                    </span>
                    <Selo variante={VISUAL_VAGA[v.status]?.variante}>{v.status}</Selo>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <AtividadeRecente vagas={listaVagas} publicacoes={pubs.tipo === 'pronto' ? pubs.dados.publicacoes : []} />
        </aside>
      </div>
    </>
  )
}

export default Perfil
