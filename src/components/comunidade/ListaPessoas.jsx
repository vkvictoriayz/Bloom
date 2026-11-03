import { useEffect, useState } from 'react'

import Botao from '../ui/Botao'
import { Aviso, Entrada } from '../ui/Campo'
import Avatar from './Avatar'
import { lerPerfis, seguir } from '../../services/comunidade'

// Descobrir e acompanhar outras integrantes (networking).
// "limite" mostra só as primeiras N pessoas (versão compacta do feed);
// "comBusca" esconde o campo de busca quando a página já tem um.
// "busca" vinda de fora (página Explorar) substitui o campo interno.
function ListaPessoas({ aoMudarConexao, limite, comBusca = true, rodape, busca: buscaExterna, titulo = 'Pessoas para conhecer' }) {
  const [buscaInterna, setBusca] = useState('')
  const busca = buscaExterna ?? buscaInterna
  const [pessoas, setPessoas] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    const espera = setTimeout(async () => {
      try {
        const r = await lerPerfis({ busca })
        if (ativo) {
          setPessoas(r.perfis)
          setErro('')
        }
      } catch (e) {
        if (ativo) setErro(e.message)
      }
    }, busca ? 250 : 0)
    return () => {
      ativo = false
      clearTimeout(espera)
    }
  }, [busca])

  async function alternar(pessoa) {
    try {
      const r = await seguir(pessoa.id)
      setPessoas((lista) => lista.map((p) => (p.id === pessoa.id ? { ...p, seguindo: r.seguindo } : p)))
      aoMudarConexao?.(r.seguindo)
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <section aria-labelledby="titulo-pessoas" className="rounded-xl border border-linha bg-branco p-5 sm:p-6">
      <h2 id="titulo-pessoas" className="font-display text-xl text-tinta">
        {titulo}
      </h2>
      {comBusca && (
        <>
          <label htmlFor="busca-pessoas" className="sr-only">
            Buscar integrantes por nome, área ou interesse
          </label>
          <Entrada id="busca-pessoas" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, área ou interesse" className="mt-4 h-10" />
        </>
      )}

      {erro && (
        <Aviso tipo="erro" className="mt-4">
          {erro}
        </Aviso>
      )}

      {pessoas === null && !erro ? (
        <p className="mt-4 text-sm text-suave">Carregando…</p>
      ) : pessoas?.length === 0 ? (
        <p className="mt-4 text-sm text-suave">
          {busca ? 'Nenhuma integrante encontrada.' : 'Você é uma das primeiras por aqui. Quando outras mulheres se cadastrarem, elas aparecem nesta lista.'}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-linha">
          {(limite ? pessoas?.slice(0, limite) : pessoas)?.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3.5">
              <Avatar nome={p.nome} tamanho="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-tinta">{p.nome}</p>
                <p className="truncate text-xs text-suave">{p.area || 'Área não informada'}</p>
              </div>
              <Botao tamanho="sm" variante={p.seguindo ? 'secundario' : 'primario'} aria-pressed={p.seguindo} aria-label={`${p.seguindo ? 'Deixar de seguir' : 'Seguir'} ${p.nome}`} onClick={() => alternar(p)}>
                {p.seguindo ? 'Seguindo' : 'Seguir'}
              </Botao>
            </li>
          ))}
        </ul>
      )}
      {rodape}
    </section>
  )
}

export default ListaPessoas
