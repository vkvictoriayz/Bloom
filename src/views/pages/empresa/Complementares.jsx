import { Link, useParams } from 'react-router-dom'

import TituloPagina from '../../components/candidata/TituloPagina'
import Avatar from '../../components/comunidade/Avatar'
import { useRecurso } from '../../components/candidata/useRecurso'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import PublicacaoEmpresa from '../../components/empresa/PublicacaoEmpresa'
import { IlustracaoConexoes } from '../../components/ilustracoes/Ilustracoes'
import Botao from '../../components/ui/Botao'
import { Vazio, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { DISPONIVEL, lerComunidadeTematica, listarComunidades } from '../../services/recursos'
import { Mensagens as MensagensCompartilhadas } from '../candidata/Mensagens'
import { Conversa as ConversaCompartilhada } from '../candidata/Conversa'

// Comunidades e mensagens da empresa. A empresa acompanha as comunidades
// (somente leitura): participar e publicar é das integrantes.

export function Comunidades() {
  const r = useRecurso(DISPONIVEL.comunidades, listarComunidades)
  return (
    <>
      <TituloPagina titulo="Comunidades" descricao="Grupos de tecnologia criados pelas integrantes. A empresa acompanha as conversas." />
      {r.estado === 'carregando' && <Carregando />}
      {r.estado === 'erro' && <ErroAoCarregar erro={r.erro} />}
      {r.estado === 'pronto' &&
        (r.dados.comunidades?.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {r.dados.comunidades.map((c) => (
              <li key={c.id} className="cartao flex flex-col p-5">
                <h2 className="font-semibold text-tinta">{c.nome}</h2>
                <p className="text-xs text-suave">
                  {c.tema} · {c.participantes} {c.participantes === 1 ? 'participante' : 'participantes'}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-tinta-2">{c.descricao}</p>
                <Botao as={Link} to={`/empresa/comunidades/${c.id}`} variante="secundario" tamanho="sm" className="mt-4 self-start">
                  Ver comunidade
                </Botao>
              </li>
            ))}
          </ul>
        ) : (
          <Vazio className="bg-branco">
            <IlustracaoConexoes className="max-w-[220px]" />
            <VazioTitulo>Nenhuma comunidade ainda</VazioTitulo>
            <VazioDescricao>Quando as integrantes criarem comunidades, elas aparecem aqui.</VazioDescricao>
          </Vazio>
        ))}
    </>
  )
}

export function DetalheComunidade() {
  const { id } = useParams()
  const r = useRecurso(DISPONIVEL.comunidades, () => lerComunidadeTematica(id), [id])
  const voltar = { para: '/empresa/comunidades', rotulo: 'Comunidades' }
  if (r.estado === 'carregando') return <Carregando quantidade={2} altura="h-40" />
  if (r.estado === 'erro') {
    return (
      <>
        <TituloPagina titulo="Comunidade" voltar={voltar} />
        <ErroAoCarregar erro={r.erro} />
      </>
    )
  }
  const { comunidade, participantes = [], publicacoes = [] } = r.dados
  return (
    <>
      <TituloPagina titulo={comunidade.nome} descricao={`${comunidade.tema} · ${comunidade.participantes} participantes`} voltar={voltar} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-4">
          <section className="cartao p-6">
            <h2 className="font-display text-xl text-tinta">Sobre</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-tinta-2">{comunidade.descricao}</p>
          </section>
          {publicacoes.length ? (
            publicacoes.map((p) => (
              <PublicacaoEmpresa
                key={p.id}
                publicacao={{ ...p, origem: 'integrante', autor: { id: p.autora.id, nome: p.autora.nome, foto: p.autora.foto, detalhe: p.autora.area } }}
              />
            ))
          ) : (
            <p className="text-center text-sm text-suave">Nenhuma publicação nesta comunidade ainda.</p>
          )}
        </div>
        <section className="cartao p-6 lg:self-start">
          <h2 className="font-display text-xl text-tinta">Participantes</h2>
          {participantes.length ? (
            <ul className="mt-3 divide-y divide-linha">
              {participantes.map((p) => (
                <li key={p.id}>
                  <Link to={`/empresa/talentos/${p.id}`} className="flex items-center gap-3 py-2.5 hover:text-vinho">
                    <Avatar nome={p.nome} foto={p.foto} tamanho="sm" />
                    <span className="truncate text-sm font-semibold">{p.nome}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-suave">Nenhum participante com perfil público.</p>
          )}
        </section>
      </div>
    </>
  )
}

// Mensagens: as mesmas telas da candidata (a API separa as conversas pelo
// tipo da conta), na rota da empresa.
export function Mensagens() {
  return <MensagensCompartilhadas base="/empresa/mensagens" descricao="Converse com as candidatas das suas vagas." />
}

export function Conversa() {
  return <ConversaCompartilhada base="/empresa/mensagens" />
}
