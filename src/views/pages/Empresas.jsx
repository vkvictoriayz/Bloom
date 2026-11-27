import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import CartaoEmpresaVitrine from '../components/CartaoEmpresaVitrine'
import Icone from '../components/Icone'
import MarcaEmpresa from '../components/MarcaEmpresa'
import SeloVerificada from '../components/SeloVerificada'
import BorboletaViva from '../components/borboleta/BorboletaViva'
import Pagina from '../components/layout/Pagina'
import Botao from '../components/ui/Botao'
import { Aviso } from '../components/ui/Campo'
import Esqueleto from '../components/ui/Esqueleto'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../components/ui/Vazio'
import { listarEmpresasPublicas, textoVagas } from '../services/publico'
import { cn } from '../lib/cn'

const detalhe = (e) => [e.areaAtuacao, e.localizacao].filter(Boolean).join(' · ') || 'Empresa na Bloom'

const VIDRO = 'border border-rosa/10 bg-white/70 shadow-[0_14px_36px_-28px_rgba(94,26,50,0.45)] backdrop-blur-md'
const SOBRETITULO = 'text-xs font-semibold tracking-[0.28em] text-rosa uppercase'

// Painel simples: uma borboleta e algumas empresas cadastradas.
function VitrineMarcas({ empresas }) {
  const lista = empresas.slice(0, 4)
  return (
    <div className="flex size-full flex-col">
      <div className="flex items-center gap-4">
        <span className="w-14 shrink-0 text-rosa">
          <BorboletaViva tom="rosa" className="w-full" />
        </span>
        <div>
          <p className="font-display text-2xl leading-tight text-tinta">Empresas na Bloom</p>
          <p className="text-sm text-suave">Algumas das empresas cadastradas</p>
        </div>
      </div>

      <ul className="mt-6 flex flex-1 flex-col divide-y divide-rosa/10">
        {lista.map((empresa) => (
          <li key={empresa.id}>
            <Link to={`/empresas/${empresa.id}`} className="group flex items-center gap-4 py-3.5">
              <MarcaEmpresa empresa={empresa} tamanho="md" className="rounded-xl border-rosa/10" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-tinta transition-colors group-hover:text-vinho">{empresa.nome}</span>
                <span className="block truncate text-sm text-suave">{empresa.areaAtuacao || 'Empresa na Bloom'}</span>
              </span>
              <span className="shrink-0 text-sm text-tinta-2">{textoVagas(empresa.vagasAbertas)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LinhaDiretorio({ empresa }) {
  return (
    <Link
      to={`/empresas/${empresa.id}`}
      className={cn(
        'group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-3 rounded-[1.5rem] p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:p-5 lg:grid-cols-[auto_minmax(0,0.9fr)_minmax(0,1.3fr)_auto] lg:gap-x-8',
        'transition-[transform,box-shadow,border-color] duration-500 ease-bloom hover:-translate-y-0.5 hover:border-rosa/30 hover:shadow-[0_20px_40px_-28px_rgba(94,26,50,0.55)]',
        VIDRO
      )}
    >
      <MarcaEmpresa empresa={empresa} tamanho="lg" className="size-16 rounded-2xl border-rosa/10 ring-4 ring-white sm:size-[4.5rem]" />
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 font-display text-xl leading-tight text-tinta transition-colors group-hover:text-vinho-escuro sm:text-2xl">
          <span className="truncate">{empresa.nome}</span>
          {empresa.verificada && <SeloVerificada compacto className="px-1 py-1" />}
        </h3>
        <p className="mt-1 truncate text-sm text-suave">{detalhe(empresa)}</p>
      </div>
      <p className="col-span-2 line-clamp-2 text-sm leading-relaxed text-tinta-2 sm:col-span-3 lg:col-span-1">
        {empresa.descricao || 'A empresa ainda não escreveu a apresentação.'}
      </p>
      <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:col-start-3 sm:row-start-1 lg:col-start-4">
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap',
            empresa.vagasAbertas ? 'bg-blush text-vinho-escuro' : 'bg-papel-2 text-suave'
          )}
        >
          {textoVagas(empresa.vagasAbertas)}
        </span>
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-full border border-rosa/20 bg-white text-vinho-escuro transition-colors duration-300 group-hover:border-rosa group-hover:bg-rosa group-hover:text-white"
        >
          <Icone nome="seta" tamanho={16} />
        </span>
      </div>
    </Link>
  )
}

function Empresas() {
  const [parametros, setParametros] = useSearchParams()
  const busca = parametros.get('busca') ?? ''
  const area = parametros.get('area') ?? ''
  const comVagas = parametros.get('vagas') === '1'
  const [estado, setEstado] = useState({ tipo: 'carregando' })

  function definir(chave, valor) {
    const proximos = new URLSearchParams(parametros)
    if (valor) proximos.set(chave, valor)
    else proximos.delete(chave)
    setParametros(proximos, { replace: true })
  }

  useEffect(() => {
    let ativo = true
    const espera = setTimeout(
      () =>
        listarEmpresasPublicas({ busca: busca.trim(), area, comVagas })
          .then((r) => ativo && setEstado({ tipo: 'pronto', ...r }))
          .catch((e) => ativo && setEstado({ tipo: 'erro', texto: e.message })),
      busca ? 300 : 0
    )
    return () => {
      ativo = false
      clearTimeout(espera)
    }
  }, [busca, area, comVagas])

  const lista = estado.empresas ?? []
  const filtrando = Boolean(busca || area || comVagas)
  const totalVagas = lista.reduce((soma, e) => soma + e.vagasAbertas, 0)
  const verificadas = lista.filter((e) => e.verificada).length
  const destaques = lista.filter((e) => e.vagasAbertas > 0).slice(0, 6)

  const descricao =
    estado.tipo !== 'pronto'
      ? 'Empresas que contratam mulheres na tecnologia pela Bloom.'
      : estado.total === 0
        ? 'As empresas aparecem aqui assim que se cadastram na Bloom.'
        : `${estado.total} ${estado.total === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}${filtrando ? '' : `, com ${totalVagas} ${totalVagas === 1 ? 'vaga aberta' : 'vagas abertas'} em tecnologia`}.`

  return (
    <Pagina titulo="Empresas" className="overflow-x-clip bg-papel">
      {/* Abertura */}
      <section className="relative isolate">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_70%_at_80%_20%,rgba(244,228,233,0.95),transparent_70%)]" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-12 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:px-8 lg:pt-16 lg:pb-16">
          <div>
            <p className={SOBRETITULO}>Empresas</p>
            <h1 className="mt-3 font-display text-[2.6rem] leading-[1.05] text-tinta sm:text-6xl">
              Descubra onde construir sua <em className="text-rosa">carreira.</em>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-tinta-2">{descricao}</p>

            {/* Busca e filtros */}
            <div className={cn('mt-8 rounded-[1.75rem] p-2', VIDRO)}>
              <div className="relative">
                <Icone nome="busca" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-rosa" />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => definir('busca', e.target.value)}
                  placeholder="Buscar empresa, área ou cidade"
                  aria-label="Buscar empresas"
                  className="h-12 w-full rounded-full border border-transparent bg-papel pr-4 pl-11 text-[15px] text-tinta placeholder:text-suave transition-colors focus:border-rosa/40 focus:bg-white focus:ring-[3px] focus:ring-rosa/20 focus:outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 px-1 pb-1">
                <div className="relative">
                  <select
                    aria-label="Área de atuação"
                    value={area}
                    onChange={(e) => definir('area', e.target.value)}
                    className={cn(
                      'h-10 cursor-pointer appearance-none rounded-full border py-0 pr-9 pl-4 text-sm font-medium transition-colors focus:ring-[3px] focus:ring-rosa/20 focus:outline-none',
                      area ? 'border-rosa bg-rosa text-white' : 'border-rosa/20 bg-white text-tinta-2 hover:border-rosa/40'
                    )}
                  >
                    <option value="">Todas as áreas</option>
                    {(estado.areas ?? []).map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                  <svg viewBox="0 0 12 12" aria-hidden="true" className={cn('pointer-events-none absolute top-1/2 right-3.5 size-3 -translate-y-1/2', area ? 'text-white' : 'text-suave')}>
                    <path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <label
                  className={cn(
                    'inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-rosa/20',
                    comVagas ? 'border-rosa bg-rosa text-white' : 'border-rosa/20 bg-white text-tinta-2 hover:border-rosa/40'
                  )}
                >
                  <input type="checkbox" checked={comVagas} onChange={(e) => definir('vagas', e.target.checked ? '1' : '')} className="sr-only" />
                  <Icone nome={comVagas ? 'check' : 'maleta'} tamanho={15} />
                  Só empresas com vagas abertas
                </label>
                {filtrando && (
                  <button
                    type="button"
                    onClick={() => setParametros({}, { replace: true })}
                    className="h-10 rounded-full px-3 text-sm font-medium text-rosa underline-offset-4 hover:underline"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {estado.tipo === 'pronto' && estado.total > 0 && !filtrando && (
              <dl className="mt-8 grid max-w-lg grid-cols-3 gap-3">
                {[
                  [estado.total, estado.total === 1 ? 'empresa' : 'empresas'],
                  [totalVagas, totalVagas === 1 ? 'vaga aberta' : 'vagas abertas'],
                  [verificadas, verificadas === 1 ? 'verificada' : 'verificadas'],
                ].map(([valor, rotulo]) => (
                  <div key={rotulo} className="rounded-2xl border border-rosa/10 bg-white/60 px-4 py-3">
                    <dt className="sr-only">{rotulo}</dt>
                    <dd className="font-display text-3xl leading-none text-vinho-escuro tabular-nums">{valor}</dd>
                    <dd className="mt-1.5 text-xs text-suave">{rotulo}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Mosaico de marcas */}
          <div className="relative hidden lg:block">
            <div className="rounded-[2rem] border border-rosa/10 bg-white p-7 sm:p-8">
              <VitrineMarcas empresas={lista} />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        {estado.tipo === 'carregando' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Esqueleto key={i} className="h-72 rounded-[1.75rem]" />
            ))}
          </div>
        )}
        {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}

        {estado.tipo === 'pronto' && estado.total === 0 && (
          <Vazio>
            <VazioTitulo>Ainda não há empresas na Bloom</VazioTitulo>
            <VazioDescricao>Quando as primeiras empresas se cadastrarem, elas aparecem aqui com as vagas abertas.</VazioDescricao>
            <VazioAcoes>
              <Botao as={Link} to="/empresa/cadastro">
                Cadastrar minha empresa
              </Botao>
            </VazioAcoes>
          </Vazio>
        )}

        {estado.tipo === 'pronto' && estado.total > 0 && (
          <>
            {!filtrando && destaques.length > 0 && (
              <section aria-labelledby="titulo-mosaico" className="mb-16 lg:mb-20">
                <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className={SOBRETITULO}>Em destaque</p>
                    <h2 id="titulo-mosaico" className="mt-2 font-display text-3xl text-tinta sm:text-4xl">
                      Contratando agora
                    </h2>
                  </div>
                  <p className="text-sm text-suave">Ordenadas pelo número de vagas abertas</p>
                </div>
                <ul className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5', destaques.length === 4 ? 'xl:grid-cols-4' : 'lg:grid-cols-3')}>
                  {destaques.map((empresa) => (
                    <li key={empresa.id} className="h-full">
                      <CartaoEmpresaVitrine empresa={empresa} className="h-full" />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="titulo-diretorio">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className={SOBRETITULO}>{filtrando ? 'Busca' : 'Todas as empresas'}</p>
                  <h2 id="titulo-diretorio" className="mt-2 font-display text-3xl text-tinta">
                    {filtrando ? 'Resultados' : 'Diretório'}
                  </h2>
                </div>
                <p className="rounded-full border border-rosa/15 bg-white/70 px-3 py-1 text-sm text-tinta-2 tabular-nums" aria-live="polite">
                  {lista.length} {lista.length === 1 ? 'empresa' : 'empresas'}
                </p>
              </div>

              {lista.length === 0 ? (
                <Vazio className="mt-8">
                  <VazioTitulo>Nenhuma empresa encontrada</VazioTitulo>
                  <VazioDescricao>Tente outro nome ou remova algum filtro.</VazioDescricao>
                  <VazioAcoes>
                    <Botao variante="secundario" onClick={() => setParametros({}, { replace: true })}>
                      Limpar filtros
                    </Botao>
                  </VazioAcoes>
                </Vazio>
              ) : (
                <ul className="flex flex-col gap-3">
                  {lista.map((empresa) => (
                    <li key={empresa.id}>
                      <LinhaDiretorio empresa={empresa} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <p className="mt-10 flex items-start gap-2.5 rounded-2xl border border-rosa/10 bg-white/60 px-4 py-3 text-xs leading-relaxed text-suave">
          <Icone nome="info" tamanho={16} className="mt-px shrink-0 text-rosa" />
          Perfis escritos pelas próprias empresas cadastradas na Bloom. O selo "Verificada" indica que o vínculo de quem administra a conta foi confirmado.
        </p>
      </div>
    </Pagina>
  )
}

export default Empresas
