import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import BotaoSalvar from '../components/BotaoSalvar'
import Icone from '../components/Icone'
import LinhaDoTempo from '../components/LinhaDoTempo'
import LinhaVaga from '../components/LinhaVaga'
import MarcaEmpresa from '../components/MarcaEmpresa'
import Pagina from '../components/layout/Pagina'
import Botao from '../components/ui/Botao'
import { Aviso } from '../components/ui/Campo'
import Selo from '../components/ui/Selo'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../components/ui/Vazio'
import { buscarVaga, ehIniciante, formatarPublicacao, vagasDaEmpresa } from '../data/vagas'
import { useDadosLocais } from '../hooks/useDadosLocais'
import { candidatar, candidaturaDaVaga, EVENTO_CANDIDATURAS, lerCandidaturas, situacao } from '../services/candidaturas'

function Secao({ titulo, children }) {
  return (
    <section className="border-t border-linha py-8 first:border-t-0 first:pt-0">
      <h2 className="font-display text-2xl text-tinta">{titulo}</h2>
      <div className="mt-4 leading-relaxed text-tinta-2">{children}</div>
    </section>
  )
}

function DetalhesVaga() {
  const { id } = useParams()
  const vaga = buscarVaga(id)
  const candidaturas = useDadosLocais(lerCandidaturas, [EVENTO_CANDIDATURAS])
  const candidatura = vaga ? candidaturaDaVaga(vaga.id, candidaturas) : null
  const [mensagem, setMensagem] = useState(null)

  if (!vaga) {
    return (
      <Pagina titulo="Vaga não encontrada">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <Vazio>
            <VazioTitulo>Vaga não encontrada</VazioTitulo>
            <VazioDescricao>Não encontramos uma oportunidade com este endereço. Ela pode ter sido encerrada.</VazioDescricao>
            <VazioAcoes>
              <Botao as={Link} to="/vagas">
                Ver todas as vagas
              </Botao>
            </VazioAcoes>
          </Vazio>
        </div>
      </Pagina>
    )
  }

  const empresa = vaga.dadosEmpresa
  const outras = vagasDaEmpresa(vaga.empresa).filter((v) => v.id !== vaga.id)

  function handleCandidatar() {
    const resultado = candidatar(vaga)
    if (!resultado.ok) {
      setMensagem({ tipo: 'erro', texto: 'Não foi possível registrar a candidatura neste navegador. Verifique se o armazenamento está liberado.' })
    } else if (resultado.jaExistia) {
      setMensagem({ tipo: 'info', texto: 'Você já tinha se candidatado a esta vaga.' })
    } else {
      setMensagem({ tipo: 'sucesso', texto: 'Candidatura registrada. Acompanhe o andamento em Candidaturas.' })
    }
  }

  const fichas = [
    ['Modalidade', vaga.modalidade],
    ['Contrato', vaga.contrato],
    ['Nível', vaga.nivel],
    ['Área', vaga.area],
    ['Remuneração', vaga.salario],
    ['Publicada', formatarPublicacao(vaga.publicadaHaDias)],
  ].filter(([, valor]) => valor)

  return (
    <Pagina titulo={vaga.titulo}>
      <div className="border-b border-linha bg-branco">
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-10 sm:px-6 lg:px-8 lg:pb-14">
          <nav aria-label="Trilha" className="text-sm text-suave">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/vagas" className="link-linha hover:text-tinta">
                  Vagas
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="truncate text-tinta-2">
                {vaga.titulo}
              </li>
            </ol>
          </nav>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
            <MarcaEmpresa empresa={empresa} tamanho="lg" />
            <div className="min-w-0 flex-1">
              <Link to={`/empresas/${empresa.slug}`} className="link-linha font-semibold text-vinho">
                {empresa.nome}
              </Link>
              <h1 className="mt-2 font-display text-3xl leading-tight text-tinta sm:text-[2.75rem]">{vaga.titulo}</h1>
              <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-tinta-2">
                <span className="inline-flex items-center gap-1.5">
                  <Icone nome="local" className="text-suave" /> {vaga.local}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icone nome="maleta" className="text-suave" /> {vaga.modalidade} · {vaga.contrato}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icone nome="relogio" className="text-suave" /> {formatarPublicacao(vaga.publicadaHaDias)}
                </span>
              </p>
              {ehIniciante(vaga) && (
                <Selo variante="vinho" className="mt-4">
                  <Icone nome="broto" /> Boa para começar
                </Selo>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8">
        <article className="lg:col-span-7">
          <Secao titulo="Sobre a vaga">
            <p>{vaga.descricao}</p>
          </Secao>

          {vaga.responsabilidades?.length > 0 && (
            <Secao titulo="Responsabilidades">
              <ul className="flex flex-col gap-3">
                {vaga.responsabilidades.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-vinho" />
                    {item}
                  </li>
                ))}
              </ul>
            </Secao>
          )}

          {vaga.requisitos?.length > 0 && (
            <Secao titulo="Requisitos">
              <ul className="flex flex-col gap-3">
                {vaga.requisitos.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-vinho" />
                    {item}
                  </li>
                ))}
              </ul>
            </Secao>
          )}

          <Secao titulo="Tecnologias e competências">
            <div className="flex flex-wrap gap-2">
              {vaga.competencias.map((item) => (
                <Link
                  key={item}
                  to={`/vagas?tec=${encodeURIComponent(item)}`}
                  className="rounded-full border border-linha-forte bg-branco px-3 py-1.5 text-sm font-medium hover:border-vinho hover:text-vinho"
                >
                  {item}
                </Link>
              ))}
            </div>
          </Secao>

          {!vaga.responsabilidades && (
            <p className="mt-2 text-sm text-suave">A empresa ainda não detalhou responsabilidades e requisitos desta vaga.</p>
          )}
        </article>

        <aside className="lg:col-span-4 lg:col-start-9">
          <div className="flex flex-col gap-6 lg:sticky lg:top-24">
            <div className="rounded-xl border border-linha bg-branco p-6">
              {candidatura ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-tinta">Sua candidatura</p>
                    <Selo variante={situacao(candidatura).variante}>{situacao(candidatura).rotulo}</Selo>
                  </div>
                  <div className="mt-5">
                    <LinhaDoTempo candidatura={candidatura} />
                  </div>
                  <Botao as={Link} to="/minhas-candidaturas" variante="secundario" className="mt-2 w-full">
                    Acompanhar candidaturas
                  </Botao>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl text-tinta">Pronta para dar esse passo?</p>
                  <p className="mt-2 text-sm text-suave">Envie sua candidatura e acompanhe cada etapa em Candidaturas.</p>
                  <Botao tamanho="lg" className="mt-5 w-full" onClick={handleCandidatar}>
                    Candidatar-se
                  </Botao>
                </>
              )}
              <BotaoSalvar vaga={vaga} comTexto className="mt-3 w-full" />

              {mensagem && (
                <Aviso tipo={mensagem.tipo} className="mt-4">
                  {mensagem.texto}
                </Aviso>
              )}

              <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-linha pt-6">
                {fichas.map(([rotulo, valor]) => (
                  <div key={rotulo}>
                    <dt className="text-xs text-suave">{rotulo}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-tinta">{valor}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <Link to={`/empresas/${empresa.slug}`} className="group flex items-center gap-4 rounded-xl border border-linha bg-branco p-5 transition-colors hover:border-linha-forte">
              <MarcaEmpresa empresa={empresa} tamanho="sm" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{empresa.nome}</span>
                <span className="block text-sm text-suave">{empresa.segmento}</span>
              </span>
              <Icone nome="seta" className="text-suave transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </aside>

        {outras.length > 0 && (
          <section aria-labelledby="titulo-outras" className="lg:col-span-12">
            <h2 id="titulo-outras" className="border-b border-tinta pb-3 font-display text-2xl">
              Outras vagas na {empresa.nomeCurto}
            </h2>
            {outras.map((outra) => (
              <LinhaVaga key={outra.id} vaga={outra} candidatura={candidaturaDaVaga(outra.id, candidaturas)} />
            ))}
          </section>
        )}
      </div>
    </Pagina>
  )
}

export default DetalhesVaga
