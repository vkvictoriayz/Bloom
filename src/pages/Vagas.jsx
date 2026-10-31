import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import Icone from '../components/Icone'
import LinhaVaga from '../components/LinhaVaga'
import VagaDestaque from '../components/VagaDestaque'
import CabecalhoPagina from '../components/layout/CabecalhoPagina'
import Pagina from '../components/layout/Pagina'
import Botao from '../components/ui/Botao'
import { Selecao } from '../components/ui/Campo'
import { Vazio, VazioAcoes, VazioDescricao, VazioIcone, VazioTitulo } from '../components/ui/Vazio'
import { correspondeBusca, ehIniciante, listarVagas, opcoesFiltro } from '../data/vagas'
import { buscarEmpresa } from '../data/empresas'
import { fotos } from '../data/imagens'
import { useDadosLocais } from '../hooks/useDadosLocais'
import { candidaturaDaVaga, EVENTO_CANDIDATURAS, lerCandidaturas } from '../services/candidaturas'
import { cn } from '../lib/cn'

const POR_PAGINA = 10

const ORDENACOES = {
  recentes: { rotulo: 'Mais recentes', comparar: (a, b) => a.publicadaHaDias - b.publicadaHaDias },
  antigas: { rotulo: 'Mais antigas', comparar: (a, b) => b.publicadaHaDias - a.publicadaHaDias },
  empresa: { rotulo: 'Empresa (A–Z)', comparar: (a, b) => a.dadosEmpresa.nome.localeCompare(b.dadosEmpresa.nome, 'pt-BR') },
}

// Grupos de filtros de múltipla escolha. As opções vêm dos dados.
const GRUPOS = [
  { chave: 'area', rotulo: 'Área', opcoes: opcoesFiltro.areas, campo: (v) => v.area },
  { chave: 'nivel', rotulo: 'Nível', opcoes: opcoesFiltro.niveis, campo: (v) => v.nivel },
  { chave: 'modalidade', rotulo: 'Modalidade', opcoes: opcoesFiltro.modalidades, campo: (v) => v.modalidade },
  { chave: 'tec', rotulo: 'Tecnologias', opcoes: opcoesFiltro.tecnologias, campo: (v) => v.competencias, chips: true },
]

function GrupoFiltro({ grupo, selecionados, aoAlternar }) {
  return (
    <fieldset className="border-b border-linha py-5">
      <legend className="mb-3 text-xs font-semibold tracking-[0.12em] text-suave uppercase">{grupo.rotulo}</legend>
      {grupo.chips ? (
        <div className="flex flex-wrap gap-1.5">
          {grupo.opcoes.map((opcao) => {
            const ativo = selecionados.includes(opcao)
            return (
              <button
                key={opcao}
                type="button"
                aria-pressed={ativo}
                onClick={() => aoAlternar(opcao)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  ativo ? 'border-vinho bg-vinho text-white' : 'border-linha-forte bg-branco text-tinta-2 hover:border-tinta'
                )}
              >
                {opcao}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {grupo.opcoes.map((opcao) => (
            <label key={opcao} className="flex cursor-pointer items-center gap-3 text-sm text-tinta-2 hover:text-tinta">
              <input
                type="checkbox"
                checked={selecionados.includes(opcao)}
                onChange={() => aoAlternar(opcao)}
                className="size-4 cursor-pointer rounded border-linha-forte accent-vinho"
              />
              {opcao}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  )
}

function Vagas() {
  const [parametros, setParametros] = useSearchParams()
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [quantidade, setQuantidade] = useState(POR_PAGINA)
  const candidaturas = useDadosLocais(lerCandidaturas, [EVENTO_CANDIDATURAS])

  const busca = parametros.get('busca') ?? ''
  const local = parametros.get('local') ?? ''
  const empresaSlug = parametros.get('empresa') ?? ''
  const iniciante = parametros.get('iniciante') === '1'
  const ordem = ORDENACOES[parametros.get('ordem')] ? parametros.get('ordem') : 'recentes'
  const selecionados = Object.fromEntries(GRUPOS.map((g) => [g.chave, parametros.getAll(g.chave)]))
  const empresaFiltro = empresaSlug ? buscarEmpresa(empresaSlug) : null

  function atualizar(alterar) {
    const proximos = new URLSearchParams(parametros)
    alterar(proximos)
    setQuantidade(POR_PAGINA)
    setParametros(proximos, { replace: true })
  }

  function alternar(chave, valor) {
    atualizar((p) => {
      const atuais = p.getAll(chave)
      p.delete(chave)
      const novos = atuais.includes(valor) ? atuais.filter((v) => v !== valor) : [...atuais, valor]
      novos.forEach((v) => p.append(chave, v))
    })
  }

  function definir(chave, valor) {
    atualizar((p) => (valor ? p.set(chave, valor) : p.delete(chave)))
  }

  function limparTudo() {
    setQuantidade(POR_PAGINA)
    setParametros(ordem !== 'recentes' ? { ordem } : {}, { replace: true })
  }

  const todas = useMemo(() => listarVagas(), [])

  const resultado = useMemo(() => {
    return todas
      .filter((vaga) => correspondeBusca(vaga, busca))
      .filter((vaga) => !local || vaga.local === local)
      .filter((vaga) => !empresaSlug || vaga.empresa === empresaSlug)
      .filter((vaga) => !iniciante || ehIniciante(vaga))
      .filter((vaga) =>
        GRUPOS.every((g) => {
          const escolhas = selecionados[g.chave]
          if (!escolhas.length) return true
          const valor = g.campo(vaga)
          return Array.isArray(valor) ? escolhas.some((e) => valor.includes(e)) : escolhas.includes(valor)
        })
      )
      .sort(ORDENACOES[ordem].comparar)
    // selecionados é derivado de "parametros"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parametros])

  // Etiquetas dos filtros ativos (todas removíveis).
  const ativos = [
    busca && { id: 'busca', rotulo: `“${busca}”`, remover: () => definir('busca', '') },
    empresaFiltro && { id: 'empresa', rotulo: empresaFiltro.nome, remover: () => definir('empresa', '') },
    local && { id: 'local', rotulo: local, remover: () => definir('local', '') },
    iniciante && { id: 'iniciante', rotulo: 'Boas para começar', remover: () => definir('iniciante', '') },
    ...GRUPOS.flatMap((g) =>
      selecionados[g.chave].map((v) => ({ id: `${g.chave}-${v}`, rotulo: v, remover: () => alternar(g.chave, v) }))
    ),
  ].filter(Boolean)

  const totalFiltros = ativos.length - (busca ? 1 : 0)

  const painelFiltros = (
    <div>
      <div className="border-b border-linha pb-5">
        <label htmlFor="filtro-local" className="mb-3 block text-xs font-semibold tracking-[0.12em] text-suave uppercase">
          Localização
        </label>
        <Selecao id="filtro-local" value={local} onChange={(e) => definir('local', e.target.value)}>
          <option value="">Todas as localizações</option>
          {opcoesFiltro.locais.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </Selecao>
      </div>

      <label className="flex cursor-pointer items-start justify-between gap-4 border-b border-linha py-5">
        <span>
          <span className="block text-sm font-semibold text-tinta">Boas para começar</span>
          <span className="mt-0.5 block text-xs text-suave">Estágio, assistente, trainee e júnior</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={iniciante}
          onChange={(e) => definir('iniciante', e.target.checked ? '1' : '')}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-linha-forte transition-colors peer-checked:bg-vinho peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-vinho after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
        />
      </label>

      {GRUPOS.map((grupo) => (
        <GrupoFiltro key={grupo.chave} grupo={grupo} selecionados={selecionados[grupo.chave]} aoAlternar={(v) => alternar(grupo.chave, v)} />
      ))}

      {ativos.length > 0 && (
        <Botao variante="link" className="mt-5" onClick={limparTudo}>
          Limpar todos os filtros
        </Botao>
      )}
    </div>
  )

  const visiveis = resultado.slice(0, quantidade)
  // As duas primeiras do resultado abrem a lista em destaque (com 3+ vagas).
  const destaques = visiveis.length >= 3 ? visiveis.slice(0, 2) : []
  const demais = visiveis.slice(destaques.length)

  return (
    <Pagina titulo="Vagas">
      <CabecalhoPagina
        tema="claro"
        forma="folha"
        foto={fotos.vagas}
        rotulo="Oportunidades"
        titulo={
          <>
            Encontre a vaga certa para o seu <em className="text-vinho">próximo passo.</em>
          </>
        }
        descricao="Vagas de tecnologia de empresas de diferentes segmentos. Refine por área, nível, modalidade e tecnologias."
      >
        <dl className="grid max-w-lg grid-cols-3 divide-x divide-linha border-y border-linha py-4">
          {[
            [todas.length, todas.length === 1 ? 'vaga aberta' : 'vagas abertas'],
            [new Set(todas.map((v) => v.empresa)).size, 'empresas'],
            [todas.filter(ehIniciante).length, 'boas para começar'],
          ].map(([valor, rotulo]) => (
            <div key={rotulo} className="flex flex-col-reverse px-4 first:pl-0">
              <dt className="mt-0.5 text-xs text-suave">{rotulo}</dt>
              <dd className="font-display text-3xl text-tinta tabular-nums">{valor}</dd>
            </div>
          ))}
        </dl>
      </CabecalhoPagina>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[260px_1fr] lg:gap-14 lg:px-8 lg:py-12">
        <aside aria-label="Filtros" className="hidden lg:block">
          <h2 className="flex items-center gap-2 border-b border-tinta pb-3 font-semibold">
            <Icone nome="filtros" /> Filtros
          </h2>
          {painelFiltros}
        </aside>

        <section aria-labelledby="titulo-resultados" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-tinta pb-3">
            <h2 id="titulo-resultados" className="text-sm text-tinta-2" aria-live="polite">
              <span className="font-display text-2xl text-tinta tabular-nums">{resultado.length}</span>{' '}
              {resultado.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
            </h2>
            <div className="flex items-center gap-2">
              <Botao variante="secundario" tamanho="sm" className="lg:hidden" aria-expanded={filtrosAbertos} onClick={() => setFiltrosAbertos((v) => !v)}>
                <Icone nome="filtros" tamanho={16} /> Filtros{totalFiltros > 0 && ` (${totalFiltros})`}
              </Botao>
              <label htmlFor="ordem" className="sr-only">
                Ordenar por
              </label>
              <Selecao id="ordem" value={ordem} onChange={(e) => definir('ordem', e.target.value === 'recentes' ? '' : e.target.value)} className="h-8 w-auto py-0 text-xs">
                {Object.entries(ORDENACOES).map(([chave, { rotulo }]) => (
                  <option key={chave} value={chave}>
                    {rotulo}
                  </option>
                ))}
              </Selecao>
            </div>
          </div>

          {filtrosAbertos && (
            <div className="mt-4 rounded-lg border border-linha bg-branco px-5 pb-5 lg:hidden">{painelFiltros}</div>
          )}

          {ativos.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Filtros ativos">
              {ativos.map((filtro) => (
                <li key={filtro.id}>
                  <button
                    type="button"
                    onClick={filtro.remover}
                    className="inline-flex items-center gap-1.5 rounded-full bg-tinta py-1 pr-2 pl-3 text-xs font-medium text-white hover:bg-tinta-2"
                    aria-label={`Remover filtro ${filtro.rotulo}`}
                  >
                    {filtro.rotulo}
                    <Icone nome="fechar" tamanho={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {resultado.length === 0 ? (
            <Vazio className="mt-8">
              <VazioIcone>
                <Icone nome="busca" />
              </VazioIcone>
              <VazioTitulo>Nenhuma vaga encontrada</VazioTitulo>
              <VazioDescricao>
                {busca ? `Não há vagas para “${busca}” com esses filtros. ` : 'Nenhuma vaga combina com esses filtros. '}
                Tente outro cargo, tecnologia ou empresa, ou remova alguns filtros.
              </VazioDescricao>
              <VazioAcoes>
                <Botao variante="secundario" onClick={limparTudo}>
                  Limpar pesquisa e filtros
                </Botao>
              </VazioAcoes>
            </Vazio>
          ) : (
            <>
              {destaques.length > 0 && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {destaques.map((vaga) => (
                    <VagaDestaque key={vaga.id} vaga={vaga} candidatura={candidaturaDaVaga(vaga.id, candidaturas)} />
                  ))}
                </div>
              )}
              {demais.length > 0 && (
                <div className={destaques.length ? 'mt-8' : undefined}>
                  {destaques.length > 0 && (
                    <h3 className="border-b border-linha pb-2 text-xs font-bold tracking-[0.14em] text-suave uppercase">Mais vagas</h3>
                  )}
                  {demais.map((vaga) => (
                    <LinhaVaga key={vaga.id} vaga={vaga} candidatura={candidaturaDaVaga(vaga.id, candidaturas)} />
                  ))}
                </div>
              )}
              {resultado.length > quantidade && (
                <div className="mt-8 flex justify-center">
                  <Botao variante="secundario" onClick={() => setQuantidade((q) => q + POR_PAGINA)}>
                    Carregar mais vagas ({resultado.length - quantidade} restantes)
                  </Botao>
                </div>
              )}
            </>
          )}

          <p className="mt-10 flex items-start gap-2 text-xs text-suave">
            <Icone nome="info" tamanho={16} className="mt-px shrink-0" />
            As vagas exibidas são as vagas de exemplo do projeto, até a publicação de vagas pelas empresas ser ligada ao banco de dados.
          </p>
        </section>
      </div>
    </Pagina>
  )
}

export default Vagas
