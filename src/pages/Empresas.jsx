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

// Posição de cada empresa no mosaico (grade de 6 colunas no desktop):
// a primeira ocupa um bloco grande; a última fecha a grade em faixa larga.
const MOSAICO = [
  'col-span-2 row-span-2 md:col-span-4',
  'md:col-span-2',
  'md:col-span-2',
  'md:col-span-2',
  'md:col-span-2',
  'col-span-2 md:col-span-2',
  'col-span-2 md:col-span-6',
]

// Bloco do mosaico: a cor institucional da empresa ocupa todo o espaço e o
// nome ganha o papel principal, em Fraunces.
function BlocoEmpresa({ empresa, grande, faixa, className }) {
  return (
    <Link
      to={`/empresas/${empresa.slug}`}
      className={cn('group relative flex flex-col justify-between overflow-hidden rounded-xl p-6 transition-[filter] hover:brightness-95 sm:p-7', className)}
      style={{ backgroundColor: empresa.cor, color: empresa.corTexto }}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute font-display leading-none font-semibold uppercase opacity-[0.13] select-none',
          grande ? '-right-4 -bottom-10 text-[11rem] sm:text-[15rem]' : '-right-2 -bottom-6 text-[6rem]',
          faixa && 'top-1/2 bottom-auto -translate-y-1/2'
        )}
      >
        {empresa.sigla}
      </span>

      <p className="relative text-[11px] font-bold tracking-[0.14em] uppercase opacity-80">{empresa.segmento}</p>

      <div className={cn('relative', faixa && 'sm:flex sm:items-end sm:justify-between sm:gap-6')}>
        <div>
          <h3 className={cn('font-display leading-[1.05]', grande ? 'text-4xl sm:text-6xl' : 'text-2xl sm:text-3xl')}>{empresa.nome}</h3>
          <p className="mt-2 text-sm opacity-80">{empresa.sede}</p>
          {grande && <p className="mt-4 hidden max-w-md text-[15px] leading-relaxed opacity-90 sm:block">{empresa.descricao}</p>}
        </div>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold whitespace-nowrap">
          {textoVagas(empresa.vagas.length)}
          <Icone nome="seta" tamanho={16} className="transition-transform group-hover:translate-x-1" />
        </span>
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
        tema="escuro"
        forma="folha"
        foto={fotos.empresas}
        rotulo="Empresas"
        titulo={
          <>
            Descubra onde você quer <em className="text-rosa">construir sua carreira.</em>
          </>
        }
        descricao={`${empresas.length} organizações de ${segmentos.length} segmentos, com ${totalVagas} vagas abertas em tecnologia.`}
      >
        <div className="grid gap-2 rounded-xl bg-branco p-2 text-tinta sm:grid-cols-2">
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
          <section aria-labelledby="titulo-mosaico" className="mb-20">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 id="titulo-mosaico" className="font-display text-3xl text-tinta sm:text-4xl">
                Em destaque
              </h2>
              <p className="text-sm text-suave">Ordenadas pelo número de vagas abertas</p>
            </div>
            <div className="grid auto-rows-[200px] grid-cols-2 gap-3 md:grid-cols-6 md:auto-rows-[210px]">
              {comContagem.map((empresa, i) => (
                <BlocoEmpresa
                  key={empresa.slug}
                  empresa={empresa}
                  grande={i === 0}
                  faixa={i === MOSAICO.length - 1}
                  className={MOSAICO[i] ?? 'md:col-span-2'}
                />
              ))}
            </div>
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
