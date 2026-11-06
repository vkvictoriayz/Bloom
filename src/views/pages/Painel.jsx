import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../components/Icone'
import LinhaDoTempo from '../components/LinhaDoTempo'
import LinhaVaga from '../components/LinhaVaga'
import MarcaEmpresa from '../components/MarcaEmpresa'
import BuscaVagas from '../components/layout/BuscaVagas'
import CabecalhoPagina from '../components/layout/CabecalhoPagina'
import { fotos } from '../data/imagens'
import Pagina from '../components/layout/Pagina'
import Botao from '../components/ui/Botao'
import ListaRevelacao from '../components/ui/ListaRevelacao'
import Progresso from '../components/ui/Progresso'
import Selo from '../components/ui/Selo'
import { Vazio, VazioAcoes, VazioDescricao, VazioIcone, VazioTitulo } from '../components/ui/Vazio'
import { empresas } from '../data/empresas'
import { listarVagas } from '../data/vagas'
import { useDadosLocais } from '../hooks/useDadosLocais'
import { primeiroNome, useSessao } from '../hooks/useSessao'
import { candidaturaDaVaga, EVENTO_CANDIDATURAS, lerCandidaturas, situacao } from '../services/candidaturas'
import { completude, EVENTO_PERFIL, lerPerfil } from '../services/perfil'
import { EVENTO_SALVAS, lerSalvas } from '../services/salvas'

function saudacao(data = new Date()) {
  const hora = data.getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

// Recomenda pela sobreposição real entre as competências do perfil e as
// tecnologias da vaga. Sem competências no perfil, não há recomendação.
function recomendar(vagas, perfil) {
  const minhas = new Set(perfil.tecnicas.map((t) => t.toLowerCase()))
  if (!minhas.size) return null
  return vagas
    .map((vaga) => ({ vaga, comuns: vaga.competencias.filter((c) => minhas.has(c.toLowerCase())) }))
    .filter((item) => item.comuns.length > 0)
    .sort((a, b) => b.comuns.length - a.comuns.length || a.vaga.publicadaHaDias - b.vaga.publicadaHaDias)
    .slice(0, 3)
}

function TituloBloco({ children, acao }) {
  return (
    <div className="mb-2 flex items-end justify-between gap-4 border-b border-tinta pb-3">
      <h2 className="font-display text-2xl text-tinta">{children}</h2>
      {acao}
    </div>
  )
}

function Painel() {
  const sessao = useSessao()
  const usuario = sessao?.usuario
  const candidaturas = useDadosLocais(lerCandidaturas, [EVENTO_CANDIDATURAS])
  const salvas = useDadosLocais(lerSalvas, [EVENTO_SALVAS])
  const perfil = useDadosLocais(() => lerPerfil(usuario), [EVENTO_PERFIL])

  const vagas = useMemo(() => listarVagas(), [])
  const recentes = useMemo(() => [...vagas].sort((a, b) => a.publicadaHaDias - b.publicadaHaDias).slice(0, 4), [vagas])
  const recomendadas = recomendar(vagas, perfil)
  const { percentual, pendentes } = completude(perfil)

  const grupos = candidaturas.reduce(
    (acc, c) => ({ ...acc, [situacao(c).grupo]: (acc[situacao(c).grupo] ?? 0) + 1 }),
    {}
  )
  const ultimas = [...candidaturas].reverse().slice(0, 3)

  // Data e saudação ficam fixas durante a visita (não mudam a cada render).
  const [{ ola }] = useState(() => {
    const agora = new Date()
    return {
      ola: saudacao(agora),
    }
  })

  return (
    <Pagina titulo="Início">
      {/* ── Saudação e busca ─────────────────────────────────── */}
      <CabecalhoPagina
        variante="retangular"
        foto={fotos.painel}
        posicaoFoto="85% center"
        titulo={
          <>
            {ola}, <em className="text-vinho">{primeiroNome(usuario?.nome) || 'boas-vindas'}.</em>
          </>
        }
        rodape={
          <nav aria-label="Acessos rápidos">
            <ul className="grid grid-cols-2 border-y border-linha md:grid-cols-4">
              {[
                { rotulo: 'Vagas', para: '/vagas', icone: 'maleta' },
                { rotulo: 'Candidaturas', para: '/minhas-candidaturas', icone: 'candidaturas' },
                { rotulo: 'Vagas salvas', para: '/vagas-salvas', icone: 'coracao' },
                { rotulo: 'Meu perfil', para: '/perfil', icone: 'perfil' },
              ].map((item) => (
                <li key={item.rotulo} className="border-linha not-first:border-l max-md:[&:nth-child(3)]:border-l-0 max-md:[&:nth-child(n+3)]:border-t">
                  <Link to={item.para} className="group flex items-center justify-between gap-3 px-3 py-4 text-tinta transition-colors hover:bg-branco hover:text-vinho sm:px-5">
                    <span className="flex items-center gap-3">
                      <Icone nome={item.icone} tamanho={20} className="shrink-0 text-vinho" />
                      <span className="text-sm font-bold">{item.rotulo}</span>
                    </span>
                    <Icone nome="seta" tamanho={16} className="hidden text-suave transition-transform group-hover:translate-x-1 sm:block" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        }
      >
        <BuscaVagas destaque className="max-w-xl" />
      </CabecalhoPagina>

      <div className="mx-auto grid max-w-7xl gap-14 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-16">
        {/* ── Coluna principal ───────────────────────────────── */}
        <div className="flex flex-col gap-14 lg:col-span-8">
          <section aria-labelledby="titulo-recomendadas">
            <TituloBloco>
              <span id="titulo-recomendadas">Recomendadas para você</span>
            </TituloBloco>

            {recomendadas === null ? (
              <div className="mt-4 flex flex-col gap-4 rounded-lg bg-papel-2 p-6 sm:flex-row sm:items-center">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-branco text-vinho" aria-hidden="true">
                  <Icone nome="broto" tamanho={22} />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-tinta">Recomendações começam pelo seu perfil</p>
                  <p className="mt-1 text-sm text-suave">
                    Adicione suas competências técnicas e mostramos as vagas que usam as mesmas tecnologias.
                  </p>
                </div>
                <Botao as={Link} to="/perfil#competencias" variante="secundario">
                  Adicionar competências
                </Botao>
              </div>
            ) : recomendadas.length === 0 ? (
              <p className="mt-4 rounded-lg bg-papel-2 p-6 text-sm text-suave">
                Nenhuma vaga aberta usa as competências do seu perfil no momento. Veja as{' '}
                <Link to="/vagas" className="font-semibold text-vinho underline-offset-4 hover:underline">
                  vagas recentes
                </Link>{' '}
                ou amplie suas competências.
              </p>
            ) : (
              <div>
                {recomendadas.map(({ vaga, comuns }) => (
                  <div key={vaga.id}>
                    <LinhaVaga vaga={vaga} candidatura={candidaturaDaVaga(vaga.id, candidaturas)} compacta className="border-b-0 pb-2" />
                    <p className="border-b border-linha pb-4 pl-14 text-xs text-suave">
                      Combina com: <span className="font-semibold text-tinta-2">{comuns.join(', ')}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="titulo-recentes">
            <TituloBloco
              acao={
                <Link to="/vagas" className="link-linha text-sm font-semibold text-vinho">
                  Ver todas
                </Link>
              }
            >
              <span id="titulo-recentes">Vagas recentes</span>
            </TituloBloco>
            {recentes.map((vaga) => (
              <LinhaVaga key={vaga.id} vaga={vaga} candidatura={candidaturaDaVaga(vaga.id, candidaturas)} />
            ))}
          </section>
        </div>

        {/* ── Coluna lateral ─────────────────────────────────── */}
        <aside className="flex flex-col gap-10 lg:col-span-4">
          <section aria-labelledby="titulo-minhas" className="rounded-xl border border-linha bg-branco p-6">
            <div className="flex items-center justify-between">
              <h2 id="titulo-minhas" className="font-display text-xl">
                Suas candidaturas
              </h2>
              {candidaturas.length > 0 && (
                <Link to="/minhas-candidaturas" className="link-linha text-sm font-semibold text-vinho">
                  Acompanhar
                </Link>
              )}
            </div>

            {candidaturas.length === 0 ? (
              <Vazio className="mt-5 border-0 bg-papel px-4 py-8">
                <VazioIcone>
                  <Icone nome="candidaturas" />
                </VazioIcone>
                <VazioTitulo className="text-lg">Nenhuma candidatura ainda</VazioTitulo>
                <VazioDescricao>Quando você se candidatar, o andamento de cada processo aparece aqui.</VazioDescricao>
                <VazioAcoes>
                  <Botao as={Link} to="/vagas" tamanho="sm">
                    Explorar vagas
                  </Botao>
                </VazioAcoes>
              </Vazio>
            ) : (
              <>
                <dl className="mt-5 grid grid-cols-3 divide-x divide-linha border-y border-linha py-4 text-center">
                  {[
                    ['Em andamento', grupos.andamento ?? 0],
                    ['Aprovadas', grupos.aprovada ?? 0],
                    ['Encerradas', (grupos.recusada ?? 0) + (grupos.encerrada ?? 0)],
                  ].map(([rotulo, valor]) => (
                    <div key={rotulo} className="flex flex-col-reverse">
                      <dt className="mt-1 text-xs text-suave">{rotulo}</dt>
                      <dd className="font-display text-3xl text-tinta tabular-nums">{valor}</dd>
                    </div>
                  ))}
                </dl>
                <ul className="mt-2">
                  {ultimas.map((c) => {
                    const info = situacao(c)
                    return (
                      <li key={c.id} className="border-b border-linha py-4 last:border-b-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-tinta">{c.cargo}</p>
                            <p className="text-xs text-suave">
                              {c.empresa} · {c.data}
                            </p>
                          </div>
                          <Selo variante={info.variante}>{info.rotulo}</Selo>
                        </div>
                        <div className="mt-3">
                          <LinhaDoTempo candidatura={c} compacta />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </section>

          <section aria-labelledby="titulo-perfil" className="rounded-xl bg-vinho-escuro p-6 text-white">
            <div className="flex items-baseline justify-between">
              <h2 id="titulo-perfil" className="font-display text-xl">
                Seu perfil
              </h2>
              <span className="font-display text-4xl tabular-nums">{percentual}%</span>
            </div>
            <Progresso valor={percentual} rotulo="Completude do perfil" className="mt-4 bg-white/15 [&>div]:bg-white" />
            {pendentes.length > 0 ? (
              <>
                <p className="mt-5 text-sm text-white/70">Próximos passos para completar:</p>
                <ul className="mt-2">
                  {pendentes.slice(0, 3).map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/perfil#${item.ancora}`}
                        className="flex items-center justify-between border-b border-white/10 py-2.5 text-sm text-white/90 hover:text-white"
                      >
                        {item.rotulo}
                        <Icone nome="seta" tamanho={16} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-5 text-sm text-white/75">Seu perfil está completo. Mantenha-o atualizado.</p>
            )}
            <Botao as={Link} to="/perfil" variante="claro" className="mt-6 w-full">
              Abrir meu perfil
            </Botao>
          </section>

          <Link
            to="/vagas-salvas"
            className="group flex items-center justify-between rounded-xl border border-linha bg-branco p-6 transition-colors hover:border-linha-forte"
          >
            <span className="flex items-center gap-3">
              <Icone nome="coracao" className="text-vinho" tamanho={22} />
              <span>
                <span className="block font-semibold">Vagas salvas</span>
                <span className="block text-sm text-suave">
                  {salvas.length === 0 ? 'Nenhuma vaga salva' : `${salvas.length} ${salvas.length === 1 ? 'vaga' : 'vagas'}`}
                </span>
              </span>
            </span>
            <Icone nome="seta" className="text-suave transition-transform group-hover:translate-x-1" />
          </Link>
        </aside>

        {/* ── Empresas ───────────────────────────────────────── */}
        <section aria-labelledby="titulo-empresas-painel" className="lg:col-span-12">
          <TituloBloco
            acao={
              <Link to="/empresas" className="link-linha text-sm font-semibold text-vinho">
                Todas as empresas
              </Link>
            }
          >
            <span id="titulo-empresas-painel">Empresas para conhecer</span>
          </TituloBloco>
          <ListaRevelacao
            className="border-t-0"
            itens={empresas.slice(0, 5).map((empresa, i) => {
              const abertas = vagas.filter((v) => v.empresa === empresa.slug).length
              return {
                id: empresa.slug,
                numero: String(i + 1).padStart(2, '0'),
                titulo: empresa.nome,
                subtitulo: `${empresa.segmento} · ${empresa.sede}`,
                detalhe: abertas ? `${abertas} ${abertas === 1 ? 'vaga' : 'vagas'}` : 'Sem vagas abertas',
                para: `/empresas/${empresa.slug}`,
                midia: <MarcaEmpresa empresa={empresa} tamanho="sm" />,
              }
            })}
          />
        </section>
      </div>
    </Pagina>
  )
}

export default Painel
