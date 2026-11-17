import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import { CartaoTalento, Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import { IlustracaoConexoes } from '../../components/ilustracoes/Ilustracoes'
import Botao from '../../components/ui/Botao'
import { Selecao, estiloControle } from '../../components/ui/Campo'
import { Vazio, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { listarTalentos } from '../../services/empresa'
import { cn } from '../../lib/cn'

function ExplorarTalentos() {
  const [parametros, setParametros] = useSearchParams()
  const busca = parametros.get('q') ?? ''
  const area = parametros.get('area') ?? ''
  const [termo, setTermo] = useState(busca)
  const [buscaAnterior, setBuscaAnterior] = useState(busca)
  if (buscaAnterior !== busca) {
    setBuscaAnterior(busca)
    setTermo(busca)
  }
  const r = useCarregar(() => listarTalentos({ busca, area }), [busca, area])
  const todas = useCarregar(() => listarTalentos())
  const areas = todas.tipo === 'pronto' ? [...new Set(todas.dados.talentos.map((t) => t.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')) : []

  function definir(chave, valor) {
    const p = new URLSearchParams(parametros)
    if (valor) p.set(chave, valor)
    else p.delete(chave)
    setParametros(p, { replace: true })
  }

  return (
    <>
      <TituloPagina titulo="Explorar talentos" descricao="Conheça profissionais da comunidade Bloom pelo que elas compartilham publicamente." />

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          definir('q', termo.trim())
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Icone nome="busca" tamanho={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-suave" />
          <input
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Nome, área ou competência"
            aria-label="Buscar talentos"
            className={cn(estiloControle, 'h-12 pl-12 text-base')}
          />
        </div>
        <Selecao aria-label="Filtrar por área" value={area} onChange={(e) => definir('area', e.target.value)} className="h-12 sm:w-56">
          <option value="">Todas as áreas</option>
          {areas.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </Selecao>
        <Botao type="submit" className="h-12">
          Buscar
        </Botao>
      </form>

      <div className="mt-6">
        {r.tipo === 'carregando' && <Carregando quantidade={3} altura="h-40" />}
        {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
        {r.tipo === 'pronto' &&
          (r.dados.talentos.length === 0 ? (
            <Vazio className="bg-branco">
              <IlustracaoConexoes className="max-w-[220px]" />
              <VazioTitulo>Nenhum talento encontrado</VazioTitulo>
              <VazioDescricao>{busca || area ? 'Tente outro termo ou remova o filtro de área.' : 'Ainda não há integrantes cadastradas.'}</VazioDescricao>
            </Vazio>
          ) : (
            <>
              <p className="mb-3 text-sm text-tinta-2" aria-live="polite">
                <strong className="text-tinta">{r.dados.talentos.length}</strong> {r.dados.talentos.length === 1 ? 'profissional' : 'profissionais'}
              </p>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
                {r.dados.talentos.map((t) => (
                  <li key={t.id}>
                    <CartaoTalento
                      talento={t}
                      acao={
                        <Botao as={Link} to={`/empresa/talentos/${t.id}`} variante="secundario" tamanho="sm" className="w-full">
                          Ver perfil
                        </Botao>
                      }
                    />
                  </li>
                ))}
              </ul>
            </>
          ))}
      </div>
    </>
  )
}

export default ExplorarTalentos
