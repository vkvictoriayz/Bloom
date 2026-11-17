import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

import Icone from '../../components/Icone'
import Avatar from '../../components/comunidade/Avatar'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import PublicacaoEmpresa from '../../components/empresa/PublicacaoEmpresa'
import { useCarregar } from '../../components/empresa/useCarregar'
import { IlustracaoConexoes } from '../../components/ilustracoes/Ilustracoes'
import Botao from '../../components/ui/Botao'
import { Vazio, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { fotoEmpresa, lerFeedEmpresa } from '../../services/empresa'

function Feed() {
  const { perfil: dados } = useOutletContext()
  const [pagina, setPagina] = useState(1)
  const [lista, setLista] = useState([])
  const r = useCarregar(() => lerFeedEmpresa(pagina), [pagina])

  useEffect(() => {
    document.title = 'Feed · BLOOM'
  }, [])

  const pronto = r.tipo === 'pronto' ? r.dados : null
  useEffect(() => {
    if (!pronto) return
    setLista((atual) => (pagina === 1 ? pronto.publicacoes : [...atual, ...pronto.publicacoes.filter((p) => !atual.some((a) => a.id === p.id))]))
  }, [pronto, pagina])

  const n = dados?.numeros

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <h1 className="sr-only">Feed da empresa</h1>

      <section className="cartao p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar nome={dados?.empresa.nome} foto={fotoEmpresa(dados)} tamanho="lg" className="rounded-2xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-2xl text-tinta">{dados?.empresa.nome ?? 'Sua empresa'}</p>
            <p className="truncate text-sm text-suave">{dados?.perfil.localizacao || 'Localização não informada'}</p>
          </div>
          <Botao as={Link} to="/empresa/perfil" variante="secundario" tamanho="sm" className="max-sm:hidden">
            Ver perfil
          </Botao>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link to="/empresa/vagas" className="group flex items-center gap-3 rounded-xl bg-papel p-4 hover:bg-blush">
            <span className="grid size-10 place-items-center rounded-full bg-branco text-vinho" aria-hidden="true">
              <Icone nome="maleta" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-tinta">Gerenciar vagas</span>
              <span className="block text-xs text-suave">{n ? `${n.vagasAbertas} ${n.vagasAbertas === 1 ? 'aberta' : 'abertas'}` : '…'}</span>
            </span>
          </Link>
          <Link to="/empresa/candidaturas" className="group flex items-center gap-3 rounded-xl bg-papel p-4 hover:bg-blush">
            <span className="grid size-10 place-items-center rounded-full bg-branco text-vinho" aria-hidden="true">
              <Icone nome="candidaturas" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-tinta">Candidaturas</span>
              <span className="block text-xs text-suave">{n ? `${n.pendentes} ${n.pendentes === 1 ? 'nova' : 'novas'} de ${n.candidaturas}` : '…'}</span>
            </span>
          </Link>
        </div>
      </section>

      <Link to="/empresa/publicacoes/criar" className="cartao flex items-center gap-4 p-5 hover:border-vinho/40">
        <Avatar nome={dados?.empresa.nome} foto={fotoEmpresa(dados)} className="rounded-xl" />
        <span className="flex-1 rounded-xl bg-papel-2 px-4 py-3 text-[15px] text-suave">Compartilhe uma oportunidade, evento ou novidade…</span>
        <span className="hidden sm:block">
          <Botao as="span" className="pointer-events-none">
            Publicar <Icone nome="seta" tamanho={16} />
          </Botao>
        </span>
      </Link>

      {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {r.tipo === 'carregando' && lista.length === 0 && <Carregando quantidade={2} altura="h-40" />}
      {r.tipo === 'pronto' && lista.length === 0 && (
        <Vazio className="bg-branco">
          <IlustracaoConexoes className="max-w-[220px]" />
          <VazioTitulo>Ainda não há publicações</VazioTitulo>
          <VazioDescricao>Quando integrantes e empresas publicarem, os conteúdos aparecem aqui.</VazioDescricao>
        </Vazio>
      )}
      {lista.map((p) => (
        <PublicacaoEmpresa key={p.id} publicacao={{ ...p, id: p.origem === 'empresa' ? Number(p.id.slice(1)) : p.id }} gerenciavel={p.minha} aoExcluir={() => setLista((l) => l.filter((x) => x.id !== p.id))} />
      ))}
      {r.tipo === 'pronto' && r.dados.temMais && (
        <Botao variante="secundario" className="self-center" onClick={() => setPagina((v) => v + 1)}>
          Ver mais publicações
        </Botao>
      )}
    </div>
  )
}

export default Feed
