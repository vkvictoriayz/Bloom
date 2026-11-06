import { Link, useParams } from 'react-router-dom'

import Icone from '../components/Icone'
import LinhaVaga from '../components/LinhaVaga'
import MarcaEmpresa from '../components/MarcaEmpresa'
import Pagina from '../components/layout/Pagina'
import Botao from '../components/ui/Botao'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../components/ui/Vazio'
import { buscarEmpresa } from '../data/empresas'
import { vagasDaEmpresa } from '../data/vagas'
import { useDadosLocais } from '../hooks/useDadosLocais'
import { useSessao } from '../hooks/useSessao'
import { candidaturaDaVaga, EVENTO_CANDIDATURAS, lerCandidaturas } from '../services/candidaturas'

function EmpresaDetalhe() {
  const { slug } = useParams()
  const empresa = buscarEmpresa(slug)
  const sessao = useSessao()
  const autenticada = Boolean(sessao?.usuario)
  const candidaturas = useDadosLocais(lerCandidaturas, [EVENTO_CANDIDATURAS])

  if (!empresa) {
    return (
      <Pagina titulo="Empresa não encontrada">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <Vazio>
            <VazioTitulo>Empresa não encontrada</VazioTitulo>
            <VazioDescricao>Não encontramos um perfil de empresa neste endereço.</VazioDescricao>
            <VazioAcoes>
              <Botao as={Link} to="/empresas">
                Ver todas as empresas
              </Botao>
            </VazioAcoes>
          </Vazio>
        </div>
      </Pagina>
    )
  }

  const vagas = vagasDaEmpresa(empresa.slug)
  const modalidades = [...new Set(vagas.map((v) => v.modalidade))]
  const areas = [...new Set(vagas.map((v) => v.area))]
  const site = empresa.site ? new URL(empresa.site) : null

  const ficha = [
    ['Segmento', empresa.segmento],
    ['Sede', empresa.sede],
    ['Modalidades', modalidades.join(', ') || 'Sem vagas abertas'],
    ['Áreas com vagas', areas.join(', ') || '—'],
  ]

  return (
    <Pagina titulo={empresa.nome}>
      <section className="relative overflow-hidden" style={{ backgroundColor: empresa.cor, color: empresa.corTexto }}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -bottom-12 font-display text-[12rem] leading-none font-semibold uppercase opacity-15 select-none sm:text-[18rem]"
        >
          {empresa.sigla}
        </span>
        <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6 lg:px-8">
          <Link to="/empresas" className="inline-flex items-center gap-1.5 text-sm font-semibold opacity-80 hover:opacity-100">
            <Icone nome="voltar" tamanho={16} /> Empresas
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 border-b border-linha pb-10 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <MarcaEmpresa empresa={empresa} tamanho="xl" className="relative -mt-14 ring-4 ring-papel" />
            <div>
              <p className="text-sm text-suave">
                {empresa.segmento} · {empresa.sede}
              </p>
              <h1 className="mt-1 font-display text-4xl text-tinta sm:text-5xl">{empresa.nome}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {vagas.length > 0 && (
              <Botao as={Link} to={autenticada ? `/vagas?empresa=${empresa.slug}` : '/login'}>
                Ver vagas ({vagas.length})
              </Botao>
            )}
            <Botao as={Link} to={autenticada ? `/contatos?empresa=${empresa.slug}` : '/login'} variante="secundario">
              <Icone nome="mensagem" tamanho={16} /> Entrar em contato
            </Botao>
          </div>
        </div>

        {!empresa.perfilGerenciado && (
          <p className="mt-6 flex items-start gap-2 rounded-md bg-papel-2 px-4 py-3 text-sm text-tinta-2">
            <Icone nome="info" tamanho={16} className="mt-0.5 shrink-0 text-suave" />
            Informações institucionais públicas reunidas pela Bloom. Esta empresa ainda não gerencia este perfil na plataforma.
          </p>
        )}

        <div className="grid gap-12 py-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <section aria-labelledby="titulo-sobre" className="pb-10">
              <h2 id="titulo-sobre" className="font-display text-2xl">
                Sobre a empresa
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-tinta-2">{empresa.descricao}</p>
            </section>

            <section aria-labelledby="titulo-cultura" className="border-t border-linha py-10">
              <h2 id="titulo-cultura" className="font-display text-2xl">
                Cultura e ambiente de trabalho
              </h2>
              {empresa.cultura ? (
                <p className="mt-4 leading-relaxed text-tinta-2">{empresa.cultura}</p>
              ) : (
                <p className="mt-4 rounded-lg border border-dashed border-linha-forte px-5 py-6 text-sm text-suave">
                  A empresa ainda não compartilhou informações sobre cultura, benefícios e ambiente de trabalho.
                </p>
              )}
            </section>

            <section aria-labelledby="titulo-vagas-empresa" className="border-t border-linha pt-10">
              <h2 id="titulo-vagas-empresa" className="font-display text-2xl">
                Vagas abertas
              </h2>
              {vagas.length === 0 ? (
                <p className="mt-4 text-sm text-suave">Não há vagas abertas desta empresa no momento.</p>
              ) : (
                <div className="mt-2">
                  {vagas.map((vaga) => (
                    <LinhaVaga key={vaga.id} vaga={vaga} candidatura={candidaturaDaVaga(vaga.id, candidaturas)} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-xl border border-linha bg-branco p-6 lg:sticky lg:top-24">
              <h2 className="text-xs font-semibold tracking-[0.14em] text-suave uppercase">Ficha</h2>
              <dl className="mt-4 divide-y divide-linha">
                {ficha.map(([rotulo, valor]) => (
                  <div key={rotulo} className="py-3">
                    <dt className="text-xs text-suave">{rotulo}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-tinta">{valor}</dd>
                  </div>
                ))}
                {site && (
                  <div className="py-3">
                    <dt className="text-xs text-suave">Site oficial</dt>
                    <dd className="mt-0.5">
                      <a href={site.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-vinho hover:underline">
                        {site.hostname.replace(/^www\./, '')} <Icone nome="externo" tamanho={14} />
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </Pagina>
  )
}

export default EmpresaDetalhe
