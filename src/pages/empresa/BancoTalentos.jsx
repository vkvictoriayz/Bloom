import { useState } from 'react'
import { Link } from 'react-router-dom'

import TituloPagina from '../../components/candidata/TituloPagina'
import Avatar from '../../components/comunidade/Avatar'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import { Entrada } from '../../components/ui/Campo'
import { listarTalentos } from '../../services/empresa'

// Banco de talentos: as profissionais organizadas por área de atuação, com
// interesses e número de publicações. Só dados públicos da comunidade.
// Salvar ou marcar perfis ainda não tem suporte no backend.
function BancoTalentos() {
  const r = useCarregar(() => listarTalentos())
  const [filtro, setFiltro] = useState('')

  const grupos = (() => {
    if (r.tipo !== 'pronto') return []
    const alvo = filtro.trim().toLowerCase()
    const mapa = new Map()
    r.dados.talentos
      .filter((t) => !alvo || `${t.nome} ${t.area} ${t.interesses.join(' ')}`.toLowerCase().includes(alvo))
      .forEach((t) => {
        const chave = t.area || 'Área não informada'
        mapa.set(chave, [...(mapa.get(chave) ?? []), t])
      })
    return [...mapa.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'pt-BR'))
  })()

  return (
    <>
      <TituloPagina titulo="Banco de talentos" descricao="Profissionais da comunidade organizadas por área de atuação." />
      <label htmlFor="filtro-talentos" className="sr-only">
        Filtrar talentos
      </label>
      <Entrada id="filtro-talentos" type="search" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Filtrar por nome, área ou interesse" className="max-w-md" />

      <div className="mt-6 flex flex-col gap-6">
        {r.tipo === 'carregando' && <Carregando quantidade={2} altura="h-40" />}
        {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
        {r.tipo === 'pronto' && grupos.length === 0 && (
          <p className="cartao px-5 py-6 text-sm text-suave">{filtro ? 'Nenhum perfil com esse filtro.' : 'Ainda não há integrantes cadastradas.'}</p>
        )}
        {grupos.map(([area, pessoas]) => (
          <section key={area} className="cartao p-5 sm:p-6" aria-label={area}>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-xl text-tinta">{area}</h2>
              <span className="text-sm text-suave">
                {pessoas.length} {pessoas.length === 1 ? 'perfil' : 'perfis'}
              </span>
            </div>
            <ul className="divide-y divide-linha">
              {pessoas.map((p) => (
                <li key={p.id}>
                  <Link to={`/empresa/talentos/${p.id}`} className="flex items-center gap-3 py-3 hover:text-vinho">
                    <Avatar nome={p.nome} tamanho="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{p.nome}</span>
                      <span className="block truncate text-xs text-suave">{p.interesses.join(' · ') || 'Interesses não informados'}</span>
                    </span>
                    <span className="shrink-0 text-xs text-suave">
                      {p.publicacoes} {p.publicacoes === 1 ? 'publicação' : 'publicações'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}

export default BancoTalentos
