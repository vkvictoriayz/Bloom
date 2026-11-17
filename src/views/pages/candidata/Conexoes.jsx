import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import TituloPagina from '../../components/candidata/TituloPagina'
import Avatar from '../../components/comunidade/Avatar'
import BotaoSeguir from '../../components/comunidade/BotaoSeguir'
import { Aviso } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { definirSeguindo, lerConexoes, lerPerfilIntegrante } from '../../services/comunidade'
import { cn } from '../../lib/cn'

const ABAS = [
  { id: 'seguidoras', rotulo: 'Seguidoras' },
  { id: 'seguindo', rotulo: 'Seguindo' },
]

function Conexoes() {
  const { id } = useParams()
  const [parametros, setParametros] = useSearchParams()
  const aba = parametros.get('aba') === 'seguindo' ? 'seguindo' : 'seguidoras'
  const [dono, setDono] = useState(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(null)

  useEffect(() => {
    let ativo = true
    lerPerfilIntegrante(id)
      .then((r) => ativo && setDono(r))
      .catch((e) => ativo && setErro(e.message))
    return () => {
      ativo = false
    }
  }, [id])

  const [carregada, setCarregada] = useState(null)
  useEffect(() => {
    let ativo = true
    lerConexoes(id, aba)
      .then((r) => ativo && setCarregada({ chave: `${id}-${aba}`, perfis: r.perfis }))
      .catch((e) => {
        if (!ativo) return
        setErro(e.message)
        setCarregada({ chave: `${id}-${aba}`, perfis: [] })
      })
    return () => {
      ativo = false
    }
  }, [id, aba])
  const pessoas = carregada?.chave === `${id}-${aba}` ? carregada.perfis : null

  async function alternar(pessoa) {
    setOcupado(pessoa.id)
    setErro('')
    try {
      const r = await definirSeguindo(pessoa.id, !pessoa.seguindo)
      setCarregada((c) => ({ ...c, perfis: c.perfis.map((p) => (p.id === pessoa.id ? { ...p, seguindo: r.seguindo } : p)) }))
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(null)
    }
  }

  const nome = dono?.perfil?.nome ?? ''
  const voltar = dono?.souEu ? { para: '/candidata/perfil', rotulo: 'Meu perfil' } : { para: `/candidata/pessoas/${id}`, rotulo: nome || 'Perfil' }

  return (
    <>
      <TituloPagina titulo={dono?.souEu ? 'Minhas conexões' : nome ? `Conexões de ${nome.split(' ')[0]}` : 'Conexões'} voltar={voltar} />

      <div role="tablist" aria-label="Listas de conexões" className="mb-5 flex w-fit rounded-full border border-linha bg-branco p-1">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={aba === a.id}
            onClick={() => setParametros({ aba: a.id }, { replace: true })}
            className={cn('h-9 rounded-full px-4 text-sm font-semibold transition-colors', aba === a.id ? 'bg-vinho text-white' : 'text-tinta-2 hover:text-tinta')}
          >
            {a.rotulo}
            {dono && <span className="ml-1.5 tabular-nums opacity-80">{dono.numeros[a.id]}</span>}
          </button>
        ))}
      </div>

      {erro && (
        <Aviso tipo="erro" className="mb-4">
          {erro}
        </Aviso>
      )}

      {pessoas === null ? (
        <Esqueleto className="h-48 rounded-xl" />
      ) : pessoas.length === 0 ? (
        <Vazio className="bg-branco">
          <VazioTitulo>{aba === 'seguidoras' ? 'Nenhuma seguidora ainda' : 'Ainda não segue ninguém'}</VazioTitulo>
          <VazioDescricao>
            <Link to="/candidata/explorar?categoria=profissionais" className="font-semibold text-vinho hover:underline">
              Explore profissionais
            </Link>{' '}
            para ampliar a rede.
          </VazioDescricao>
        </Vazio>
      ) : (
        <ul className="divide-y divide-linha rounded-xl border border-linha bg-branco">
          {pessoas.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
              <Link to={`/candidata/pessoas/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg hover:text-vinho">
                <Avatar nome={p.nome} foto={p.foto} />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-tinta">{p.nome}</span>
                  <span className="block truncate text-sm text-suave">{p.area || 'Área não informada'}</span>
                </span>
              </Link>
              {p.souEu ? (
                <span className="text-xs font-semibold text-suave">Você</span>
              ) : (
                <BotaoSeguir tamanho="sm" nome={p.nome} seguindo={p.seguindo} ocupado={ocupado === p.id} aoAlternar={() => alternar(p)} className="min-w-28" />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default Conexoes
