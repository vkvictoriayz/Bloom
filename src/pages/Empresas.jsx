import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import Icone from '../components/Icone'
import MarcaEmpresa from '../components/MarcaEmpresa'
import CabecalhoPagina from '../components/layout/CabecalhoPagina'
import Pagina from '../components/layout/Pagina'
import Botao from '../components/ui/Botao'
import { Selecao, estiloControle } from '../components/ui/Campo'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../components/ui/Vazio'
import { empresas, segmentos } from '../data/empresas'
import { fotos } from '../data/imagens'
import { listarVagas } from '../data/vagas'
import { cn } from '../lib/cn'

const sedes = [...new Set(empresas.map((e) => e.sede))].sort((a, b) => a.localeCompare(b, 'pt-BR'))

function textoVagas(n) {
  if (!n) return 'Sem vagas abertas'
  return `${n} ${n === 1 ? 'vaga aberta' : 'vagas abertas'}`
}

// Cartão de empresa em destaque: marca, nome, descrição curta e as vagas
// abertas, sempre na mesma ordem e com o mesmo alinhamento.
function CartaoEmpresa({ empresa }) {
  const abertas = empresa.vagas.slice(0, 2)

  return (
    <Link
      to={`/empresas/${empresa.slug}`}
      className="group flex h-full flex-col border border-linha bg-branco p-6 transition-colors hover:border-linha-forte"
    >
      <div className="flex items-center gap-4">
        <MarcaEmpresa empresa={empresa} tamanho="md" />
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl text-tinta transition-colors group-hover:text-vinho">{empresa.nome}</h3>
          <p className="truncate text-sm text-suave">
            {empresa.segmento} · {empresa.sede}
          </p>
        </div>
      </div>

      <p className="mt-5 line-clamp-3 text-[15px] leading-relaxed text-tinta-2">{empresa.descricao}</p>

      <div className="mt-auto pt-6">
        {abertas.length > 0 && (
          <ul className="mb-5 flex flex-col gap-2 border-t border-linha pt-5">
            {abertas.map((vaga) => (
              <li key={vaga.id} className="truncate text-sm text-tinta">
                {vaga.titulo}
              </li>
            ))}
          </ul>
        )}
        <div className={cn('flex items-center justify-between gap-3 text-sm', abertas.length === 0 && 'border-t border-linha pt-5')}>
          <span className={cn('font-semibold', empresa.vagas.length ? 'text-vinho' : 'text-suave')}>{textoVagas(empresa.vagas.length)}</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-tinta group-hover:text-vinho">
            Ver perfil <Icone nome="seta" tamanho={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function Empresas() {
  const [parametros, setParametros] = useSearchParams()
  const busca = parametros.get('busca') ?? ''
  const segmento = parametros.get('segmento') ?? ''
  const sede = parametros.get('sede') ?? ''
  const comVagas = parametros.get('vagas') === '1'

  function definir(chave, valor) {
    const proximos = new URLSearchParams(parametros)
    if (valor) proximos.set(chave, valor)
    else proximos.delete(chave)
    setParametros(proximos, { replace: true })
  }

  const vagas = useMemo(() => listarVagas(), [])
  const comContagem = useMemo(
    () =>
      empresas
        .map((empresa) => ({ ...empresa, vagas: vagas.filter((v) => v.empresa === empresa.slug) }))
        .sort((a, b) => b.vagas.length - a.vagas.length || a.nome.localeCompare(b.nome, 'pt-BR')),
    [vagas]
  )

  const filtradas = comContagem.filter((empresa) => {
    const alvo = busca.trim().toLowerCase()
    const texto = `${empresa.nome} ${empresa.segmento} ${empresa.sede}`.toLowerCase()
    return (
      (!alvo || texto.includes(alvo)) &&
      (!segmento || empresa.segmento === segmento) &&
      (!sede || empresa.sede === sede) &&
      (!comVagas || empresa.vagas.length > 0)
    )
  })

  const filtrando = Boolean(busca || segmento || sede || comVagas)
  const totalVagas = comContagem.reduce((soma, e) => soma + e.vagas.length, 0)

  return (
    <Pagina titulo="Empresas">
      <CabecalhoPagina
        variante="retangular"
        foto={fotos.empresas}
        rotulo="Empresas"
        titulo={
          <>
            Descubra onde construir sua <em className="text-vinho">carreira.</em>
          </>
        }
        descricao={`${empresas.length} organizações de ${segmentos.length} segmentos, com ${totalVagas} vagas abertas em tecnologia.`}
      >
        <div className="grid gap-2 border border-linha bg-branco p-2 text-tinta sm:grid-cols-2">
          <div className="relative sm:col-span-2">
            <Icone nome="busca" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-suave" />
            <input
              type="search"
              value={busca}
              onChange={(e) => definir('busca', e.target.value)}
              placeholder="Buscar empresa, segmento ou cidade"
              aria-label="Buscar empresas"
              className={cn(estiloControle, 'h-11 border-transparent bg-papel pl-10')}
            />
          </div>
          <Selecao aria-label="Segmento" value={segmento} onChange={(e) => definir('segmento', e.target.value)} className="border-transparent bg-papel">
            <option value="">Todos os segmentos</option>
            {segmentos.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Selecao>
          <Selecao aria-label="Sede" value={sede} onChange={(e) => definir('sede', e.target.value)} className="border-transparent bg-papel">
            <option value="">Todas as sedes</option>
            {sedes.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Selecao>
          <label className="flex h-10 cursor-pointer items-center gap-2.5 rounded-md px-3 text-sm font-semibold hover:bg-papel sm:col-span-2">
            <input type="checkbox" checked={comVagas} onChange={(e) => definir('vagas', e.target.checked ? '1' : '')} className="size-4 accent-vinho" />
            Só empresas com vagas abertas
          </label>
        </div>
      </CabecalhoPagina>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {!filtrando && (
          <section aria-labelledby="titulo-mosaico" className="mb-16 lg:mb-20">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 id="titulo-mosaico" className="font-display text-3xl text-tinta sm:text-4xl">
                Em destaque
              </h2>
              <p className="text-sm text-suave">Ordenadas pelo número de vagas abertas</p>
            </div>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {comContagem.slice(0, 6).map((empresa) => (
                <li key={empresa.slug} className="h-full">
                  <CartaoEmpresa empresa={empresa} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="titulo-diretorio">
          <div className="flex items-end justify-between gap-4 border-b-2 border-tinta pb-4">
            <h2 id="titulo-diretorio" className="font-display text-3xl text-tinta">
              {filtrando ? 'Resultados' : 'Diretório'}
            </h2>
            <p className="text-sm text-suave tabular-nums" aria-live="polite">
              {filtradas.length} {filtradas.length === 1 ? 'empresa' : 'empresas'}
            </p>
          </div>

          {filtradas.length === 0 ? (
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
            <ul>
              {filtradas.map((empresa) => (
                <li key={empresa.slug} className="border-b border-linha">
                  <Link
                    to={`/empresas/${empresa.slug}`}
                    className="group grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3 py-7 sm:grid-cols-[auto_1fr_auto] lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.3fr)_auto] lg:gap-x-10"
                  >
                    <MarcaEmpresa empresa={empresa} tamanho="lg" />
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl text-tinta transition-colors group-hover:text-vinho sm:text-3xl">{empresa.nome}</h3>
                      <p className="mt-1 text-sm text-suave">
                        {empresa.segmento} · {empresa.sede}
                      </p>
                    </div>
                    <p className="col-span-2 text-[15px] leading-relaxed text-tinta-2 sm:col-span-3 lg:col-span-1">{empresa.descricao}</p>
                    <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:flex-col sm:items-end lg:col-start-4">
                      <span className={cn('rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap', empresa.vagas.length ? 'bg-blush text-vinho' : 'bg-papel-2 text-suave')}>
                        {textoVagas(empresa.vagas.length)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-tinta group-hover:text-vinho">
                        Ver perfil <Icone nome="seta" tamanho={16} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-10 flex items-start gap-2 text-xs text-suave">
          <Icone nome="info" tamanho={16} className="mt-px shrink-0" />
          Perfis montados com informações institucionais públicas. Os logos oficiais e os dados de cultura e contato serão exibidos
          quando cada empresa assumir seu perfil na Bloom.
        </p>
      </div>
    </Pagina>
  )
}

export default Empresas
