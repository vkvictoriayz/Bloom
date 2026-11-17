import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Icone from '../components/Icone'
import LinhaVaga from '../components/LinhaVaga'
import MarcaEmpresa from '../components/MarcaEmpresa'
import SeloVerificada from '../components/SeloVerificada'
import Pagina from '../components/layout/Pagina'
import Botao from '../components/ui/Botao'
import { Aviso } from '../components/ui/Campo'
import Esqueleto from '../components/ui/Esqueleto'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../components/ui/Vazio'
import { useSessao } from '../hooks/useSessao'
import { urlImagem } from '../services/api'
import { lerPerfilPublicoEmpresa, textoVagas } from '../services/publico'

// Endereço com https:// (o perfil pode ter sido salvo sem ele).
function linkExterno(valor) {
  if (!valor) return null
  try {
    return new URL(/^https?:\/\//i.test(valor) ? valor : `https://${valor}`)
  } catch {
    return null
  }
}

function NaoEncontrada({ texto }) {
  return (
    <Pagina titulo="Empresa não encontrada">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <Vazio>
          <VazioTitulo>Empresa não encontrada</VazioTitulo>
          <VazioDescricao>{texto ?? 'Não encontramos um perfil de empresa neste endereço.'}</VazioDescricao>
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

// Perfil público de uma empresa cadastrada (/empresas/:id), visível sem login.
function EmpresaDetalhe() {
  const { slug: id } = useParams()
  const sessao = useSessao()
  const candidata = sessao?.usuario?.tipo === 'usuaria'
  const idValido = /^\d+$/.test(id)
  const [estado, setEstado] = useState({ tipo: 'carregando' })

  useEffect(() => {
    if (!idValido) return undefined
    let ativo = true
    lerPerfilPublicoEmpresa(id)
      .then((r) => ativo && setEstado({ tipo: 'pronto', ...r }))
      .catch((e) => ativo && setEstado(/não encontrada/i.test(e.message) ? { tipo: 'ausente' } : { tipo: 'erro', texto: e.message }))
    return () => {
      ativo = false
    }
  }, [id, idValido])

  if (!idValido || estado.tipo === 'ausente') return <NaoEncontrada />
  if (estado.tipo === 'erro') {
    return (
      <Pagina titulo="Empresa">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <Aviso tipo="erro">{estado.texto}</Aviso>
        </div>
      </Pagina>
    )
  }
  if (estado.tipo === 'carregando') {
    return (
      <Pagina titulo="Empresa">
        <Esqueleto className="h-48 rounded-none" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Esqueleto className="h-40" />
        </div>
      </Pagina>
    )
  }

  const { empresa, vagas } = estado
  const modalidades = [...new Set(vagas.map((v) => v.modalidade).filter((m) => m && m !== 'Não informada'))]
  const areas = [...new Set(vagas.map((v) => v.area).filter((a) => a && a !== 'Não informada'))]
  const site = linkExterno(empresa.site)
  const linkedin = linkExterno(empresa.linkedin)
  const paraVagas = candidata ? `/candidata/vagas?empresa=${empresa.id}` : '/login'

  const ficha = [
    ['Área de atuação', empresa.areaAtuacao || '—'],
    ['Localização', empresa.localizacao || '—'],
    ['Modalidades', modalidades.join(', ') || (vagas.length ? '—' : 'Sem vagas abertas')],
    ['Áreas com vagas', areas.join(', ') || '—'],
  ]

  return (
    <Pagina titulo={empresa.nome}>
      <section className="relative overflow-hidden bg-vinho text-white">
        {empresa.capa ? (
          <img src={urlImagem(empresa.capa)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -bottom-12 font-display text-[12rem] leading-none font-semibold uppercase opacity-15 select-none sm:text-[18rem]"
          >
            {empresa.sigla}
          </span>
        )}
        <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6 lg:px-8">
          <Link to="/empresas" className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-sm font-semibold backdrop-blur-sm hover:bg-black/40">
            <Icone nome="voltar" tamanho={16} /> Empresas
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 border-b border-linha pb-10 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <MarcaEmpresa empresa={empresa} tamanho="xl" className="relative -mt-14 ring-4 ring-papel" />
            <div>
              <p className="text-sm text-suave">{[empresa.areaAtuacao, empresa.localizacao].filter(Boolean).join(' · ') || 'Empresa na Bloom'}</p>
              <h1 className="mt-1 flex flex-wrap items-center gap-3 font-display text-4xl text-tinta sm:text-5xl">
                {empresa.nome} {empresa.verificada && <SeloVerificada className="text-xs" />}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {vagas.length > 0 && (
              <Botao as={Link} to={paraVagas}>
                Ver vagas ({vagas.length})
              </Botao>
            )}
            {site && (
              <Botao as="a" href={site.href} target="_blank" rel="noreferrer" variante="secundario">
                Site oficial <Icone nome="externo" tamanho={15} />
              </Botao>
            )}
          </div>
        </div>

        <div className="grid gap-12 py-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <section aria-labelledby="titulo-sobre" className="pb-10">
              <h2 id="titulo-sobre" className="font-display text-2xl">
                Sobre a empresa
              </h2>
              {empresa.descricao ? (
                <p className="mt-4 max-w-2xl text-lg leading-relaxed whitespace-pre-line text-tinta-2">{empresa.descricao}</p>
              ) : (
                <p className="mt-4 text-sm text-suave">A empresa ainda não escreveu a apresentação.</p>
              )}
            </section>

            <section aria-labelledby="titulo-cultura" className="border-t border-linha py-10">
              <h2 id="titulo-cultura" className="font-display text-2xl">
                Cultura e ambiente de trabalho
              </h2>
              {empresa.informacoes ? (
                <p className="mt-4 leading-relaxed whitespace-pre-line text-tinta-2">{empresa.informacoes}</p>
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
                <>
                  <div className="mt-2">
                    {vagas.map((vaga) => (
                      <LinhaVaga key={vaga.id} vaga={vaga} />
                    ))}
                  </div>
                  {!candidata && (
                    <p className="mt-4 text-sm text-tinta-2">
                      <Link to="/cadastro" className="font-semibold text-vinho hover:underline">
                        Crie sua conta
                      </Link>{' '}
                      ou{' '}
                      <Link to="/login" className="font-semibold text-vinho hover:underline">
                        entre
                      </Link>{' '}
                      para se candidatar.
                    </p>
                  )}
                </>
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
                <div className="py-3">
                  <dt className="text-xs text-suave">Vagas</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-tinta">{textoVagas(vagas.length)}</dd>
                </div>
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
                {linkedin && (
                  <div className="py-3">
                    <dt className="text-xs text-suave">LinkedIn</dt>
                    <dd className="mt-0.5">
                      <a href={linkedin.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-vinho hover:underline">
                        Página da empresa <Icone nome="externo" tamanho={14} />
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              {empresa.verificada ? (
                <p className="mt-4 flex items-start gap-2 text-xs text-suave">
                  <Icone nome="check" tamanho={14} className="mt-px shrink-0 text-sucesso" /> O vínculo de quem administra esta conta com a empresa foi confirmado.
                </p>
              ) : (
                <p className="mt-4 text-xs text-suave">CNPJ consultado na Receita no cadastro. O vínculo de quem administra a conta ainda não foi confirmado.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Pagina>
  )
}

export default EmpresaDetalhe
