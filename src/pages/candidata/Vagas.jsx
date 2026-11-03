import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import CartaoVaga from '../../components/candidata/CartaoVaga'
import TituloPagina from '../../components/candidata/TituloPagina'
import Botao from '../../components/ui/Botao'
import { Selecao, estiloControle } from '../../components/ui/Campo'
import { Vazio, VazioAcoes, VazioDescricao, VazioIcone, VazioTitulo } from '../../components/ui/Vazio'
import { buscarEmpresa } from '../../data/empresas'
import { correspondeBusca, ehIniciante, listarVagas, opcoesFiltro } from '../../data/vagas'
import { useDadosLocais } from '../../hooks/useDadosLocais'
import { candidaturaDaVaga, EVENTO_CANDIDATURAS, lerCandidaturas } from '../../services/candidaturas'
import { cn } from '../../lib/cn'

const POR_PAGINA = 10

const ORDENACOES = {
  recentes: { rotulo: 'Mais recentes', comparar: (a, b) => a.publicadaHaDias - b.publicadaHaDias },
  antigas: { rotulo: 'Mais antigas', comparar: (a, b) => b.publicadaHaDias - a.publicadaHaDias },
  empresa: { rotulo: 'Empresa (A–Z)', comparar: (a, b) => a.dadosEmpresa.nome.localeCompare(b.dadosEmpresa.nome, 'pt-BR') },
}

// Filtros de múltipla escolha. As opções vêm dos dados (nunca inventadas).
const GRUPOS = [
  { chave: 'modalidade', rotulo: 'Modalidade', opcoes: opcoesFiltro.modalidades, campo: (v) => v.modalidade },
  { chave: 'nivel', rotulo: 'Nível de experiência', opcoes: opcoesFiltro.niveis, campo: (v) => v.nivel },
  { chave: 'contrato', rotulo: 'Tipo de contratação', opcoes: opcoesFiltro.contratos, campo: (v) => v.contrato },
  { chave: 'area', rotulo: 'Área tecnológica', opcoes: opcoesFiltro.areas, campo: (v) => v.area },
]

function GrupoFiltro({ grupo, selecionados, aoAlternar }) {
  return (
    <fieldset className="border-b border-linha py-4 last:border-b-0">
      <legend className="mb-2.5 text-xs font-bold tracking-[0.12em] text-suave uppercase">{grupo.rotulo}</legend>
      <div className="flex flex-col gap-2">
        {grupo.opcoes.map((opcao) => (
          <label key={opcao} className="flex cursor-pointer items-center gap-3 text-sm text-tinta-2 hover:text-tinta">
            <input
              type="checkbox"
              checked={selecionados.includes(opcao)}
              onChange={() => aoAlternar(opcao)}
              className="size-4 cursor-pointer accent-vinho"
            />
            {opcao}
          </label>
        ))}
      </div>
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
  const resultado = useMemo(
    () =>
      todas
        .filter((vaga) => correspondeBusca(vaga, busca))
        .filter((vaga) => !local || vaga.local === local)
        .filter((vaga) => !empresaSlug || vaga.empresa === empresaSlug)
        .filter((vaga) => !iniciante || ehIniciante(vaga))
        .filter((vaga) => GRUPOS.every((g) => !selecionados[g.chave].length || selecionados[g.chave].includes(g.campo(vaga))))
        .sort(ORDENACOES[ordem].comparar),
    // selecionados é derivado de "parametros"
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todas, parametros]
  )

  const ativos = [
    empresaFiltro && { id: 'empresa', rotulo: empresaFiltro.nome, remover: () => definir('empresa', '') },
    local && { id: 'local', rotulo: local, remover: () => definir('local', '') },
    iniciante && { id: 'iniciante', rotulo: 'Boas para começar', remover: () => definir('iniciante', '') },
    ...GRUPOS.flatMap((g) => selecionados[g.chave].map((v) => ({ id: `${g.chave}-${v}`, rotulo: v, remover: () => alternar(g.chave, v) }))),
  ].filter(Boolean)

  const painelFiltros = (
    <div>
      <div className="border-b border-linha pb-4">
        <label htmlFor="filtro-local" className="mb-2.5 block text-xs font-bold tracking-[0.12em] text-suave uppercase">
          Localização
        </label>
        <Selecao id="filtro-local" value={local} onChange={(e) => definir('local', e.target.value)} className="h-10">
          <option value="">Todas</option>
          {opcoesFiltro.locais.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </Selecao>
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-linha py-4">
        <span className="text-sm font-semibold text-tinta">Boas para começar</span>
        <input type="checkbox" checked={iniciante} onChange={(e) => definir('iniciante', e.target.checked ? '1' : '')} className="size-4 accent-vinho" />
      </label>
      {GRUPOS.map((grupo) => (
        <GrupoFiltro key={grupo.chave} grupo={grupo} selecionados={selecionados[grupo.chave]} aoAlternar={(v) => alternar(grupo.chave, v)} />
      ))}
    </div>
  )

  const visiveis = resultado.slice(0, quantidade)

  return (
    <>
      <TituloPagina titulo="Vagas" descricao="Oportunidades em tecnologia. Busque por cargo, tecnologia ou palavra-chave e refine com os filtros." />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icone nome="busca" tamanho={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-suave" />
          <input
            type="search"
            value={busca}
            onChange={(e) => definir('busca', e.target.value)}
            placeholder="Cargo, tecnologia ou palavra-chave"
            aria-label="Buscar vagas por cargo, tecnologia ou palavra-chave"
            className={cn(estiloControle, 'h-12 pl-12 text-base')}
          />
        </div>
        <div className="flex gap-2">
          <Botao variante="secundario" className="h-12 lg:hidden" aria-expanded={filtrosAbertos} onClick={() => setFiltrosAbertos((v) => !v)}>
            <Icone nome="filtros" tamanho={18} /> Filtros{ativos.length > 0 && ` (${ativos.length})`}
          </Botao>
          <label htmlFor="ordem" className="sr-only">
            Ordenar por
          </label>
          <Selecao id="ordem" value={ordem} onChange={(e) => definir('ordem', e.target.value === 'recentes' ? '' : e.target.value)} className="h-12 w-auto">
            {Object.entries(ORDENACOES).map(([chave, { rotulo }]) => (
              <option key={chave} value={chave}>
                {rotulo}
              </option>
            ))}
          </Selecao>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside aria-label="Filtros" className={cn('rounded-xl border border-linha bg-branco px-5 py-2 lg:block lg:self-start', filtrosAbertos ? 'block' : 'hidden')}>
          {painelFiltros}
        </aside>

        <section aria-labelledby="titulo-resultados" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 id="titulo-resultados" className="mr-2 text-sm text-tinta-2" aria-live="polite">
              <strong className="text-tinta">{resultado.length}</strong> {resultado.length === 1 ? 'vaga' : 'vagas'}
            </h2>
            {ativos.map((filtro) => (
              <button
                key={filtro.id}
                type="button"
                onClick={filtro.remover}
                className="inline-flex items-center gap-1.5 rounded-full bg-tinta py-1 pr-2 pl-3 text-xs font-medium text-white hover:bg-tinta-2"
                aria-label={`Remover filtro ${filtro.rotulo}`}
              >
                {filtro.rotulo} <Icone nome="fechar" tamanho={12} />
              </button>
            ))}
            {(ativos.length > 0 || busca) && (
              <button type="button" onClick={limparTudo} className="text-xs font-semibold text-vinho hover:underline">
                Limpar tudo
              </button>
            )}
          </div>

          {resultado.length === 0 ? (
            <Vazio className="bg-branco">
              <VazioIcone>
                <Icone nome="busca" />
              </VazioIcone>
              <VazioTitulo>Nenhuma vaga encontrada</VazioTitulo>
              <VazioDescricao>Tente outro cargo, tecnologia ou empresa, ou remova alguns filtros.</VazioDescricao>
              <VazioAcoes>
                <Botao variante="secundario" onClick={limparTudo}>
                  Limpar busca e filtros
                </Botao>
              </VazioAcoes>
            </Vazio>
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
                {visiveis.map((vaga) => (
                  <CartaoVaga key={vaga.id} vaga={vaga} candidatura={candidaturaDaVaga(vaga.id, candidaturas)} />
                ))}
              </div>
              {resultado.length > quantidade && (
                <div className="mt-6 flex justify-center">
                  <Botao variante="secundario" onClick={() => setQuantidade((q) => q + POR_PAGINA)}>
                    Carregar mais ({resultado.length - quantidade} restantes)
                  </Botao>
                </div>
              )}
            </>
          )}

          <p className="mt-8 flex items-start gap-2 text-xs text-suave">
            <Icone nome="info" tamanho={16} className="mt-px shrink-0" />
            Vagas de exemplo do projeto: ainda não há API de vagas. Quando as empresas publicarem pelo backend, esta lista passa a usá-la.
          </p>
        </section>
      </div>
    </>
  )
}

export default Vagas
