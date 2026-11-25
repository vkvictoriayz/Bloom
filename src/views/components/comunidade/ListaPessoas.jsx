import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Aviso, Entrada } from '../ui/Campo'
import Avatar from './Avatar'
import Capa from '../candidata/Capa'
import BotaoSeguir from './BotaoSeguir'
import { definirSeguindo, lerPerfis } from '../../services/comunidade'

function ListaPessoas({ aoMudarConexao, limite, comBusca = true, rodape, busca: buscaExterna, titulo = 'Pessoas para conhecer', grade = false }) {
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
      const r = await definirSeguindo(pessoa.id, !pessoa.seguindo)
      setPessoas((lista) => lista.map((p) => (p.id === pessoa.id ? { ...p, seguindo: r.seguindo } : p)))
      aoMudarConexao?.(r.seguindo)
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <section aria-labelledby="titulo-pessoas" className="rounded-2xl border border-linha bg-branco p-5 sm:p-6">
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
      ) : grade ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(limite ? pessoas?.slice(0, limite) : pessoas)?.map((p) => (
            <li key={p.id} className="flex flex-col items-center overflow-hidden rounded-2xl border border-linha bg-branco px-4 pb-4 text-center transition-colors hover:border-linha-forte">
              <Capa imagem={p.capa} className="-mx-4 h-14 w-[calc(100%+2rem)] rounded-none sm:h-14" />
              <Link to={`/candidata/pessoas/${p.id}`} className="-mt-8 flex w-full flex-col items-center rounded-lg hover:text-vinho">
                <span className="relative z-10 rounded-full ring-4 ring-branco">
                  <Avatar nome={p.nome} foto={p.foto} tamanho="lg" />
                </span>
                <span className="mt-3 w-full truncate text-sm font-semibold text-tinta">{p.nome}</span>
                <span className="w-full truncate text-xs text-suave">{p.area || 'Área não informada'}</span>
              </Link>
              <BotaoSeguir tamanho="sm" nome={p.nome} seguindo={p.seguindo} aoAlternar={() => alternar(p)} className="mt-3 w-full" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-2 divide-y divide-linha">
          {(limite ? pessoas?.slice(0, limite) : pessoas)?.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3.5">
              <Link to={`/candidata/pessoas/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg hover:text-vinho">
                <Avatar nome={p.nome} foto={p.foto} tamanho="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-tinta">{p.nome}</span>
                  <span className="block truncate text-xs text-suave">{p.area || 'Área não informada'}</span>
                </span>
              </Link>
              <BotaoSeguir tamanho="sm" nome={p.nome} seguindo={p.seguindo} aoAlternar={() => alternar(p)} className="min-w-28" />
            </li>
          ))}
        </ul>
      )}
      {rodape}
    </section>
  )
}

export default ListaPessoas
