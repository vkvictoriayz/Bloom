import { Link, useParams } from 'react-router-dom'

import TituloPagina, { RecursoIndisponivel } from '../../components/candidata/TituloPagina'
import { useRecurso } from '../../components/candidata/useRecurso'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { IlustracaoConexoes } from '../../components/ilustracoes/Ilustracoes'
import Botao from '../../components/ui/Botao'
import { Vazio, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { DISPONIVEL, lerComunidadeTematica, lerConversa, listarComunidades, listarConversas } from '../../services/recursos'

// Comunidades e mensagens da empresa. Usam os mesmos serviços preparados da
// área da candidata (services/recursos.js): enquanto a API não existir, a
// tela diz o que falta e não mostra dados de exemplo.

export function Comunidades() {
  const r = useRecurso(DISPONIVEL.comunidades, listarComunidades)
  return (
    <>
      <TituloPagina titulo="Comunidades" descricao="Acompanhe comunidades de tecnologia relevantes para a empresa." />
      {r.estado === 'indisponivel' && (
        <RecursoIndisponivel
          icone="grupo"
          ilustracao={IlustracaoConexoes}
          titulo="Comunidades ainda não disponíveis"
          descricao="Os grupos por tema dependem de uma API de comunidades. Enquanto isso, acompanhe as conversas da rede no feed."
        >
          <Botao as={Link} to="/empresa/feed">
            Ir para o feed
          </Botao>
        </RecursoIndisponivel>
      )}
      {r.estado === 'carregando' && <Carregando />}
      {r.estado === 'erro' && <ErroAoCarregar erro={r.erro} />}
      {r.estado === 'pronto' &&
        (r.dados.comunidades?.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {r.dados.comunidades.map((c) => (
              <li key={c.id} className="cartao p-5">
                <h2 className="font-semibold text-tinta">{c.nome}</h2>
                <p className="text-xs text-suave">{c.tema}</p>
                <p className="mt-2 line-clamp-2 text-sm text-tinta-2">{c.descricao}</p>
                <Botao as={Link} to={`/empresa/comunidades/${c.id}`} variante="secundario" tamanho="sm" className="mt-4">
                  Ver comunidade
                </Botao>
              </li>
            ))}
          </ul>
        ) : (
          <Vazio className="bg-branco">
            <VazioTitulo>Nenhuma comunidade ainda</VazioTitulo>
            <VazioDescricao>Quando as comunidades forem criadas, elas aparecem aqui.</VazioDescricao>
          </Vazio>
        ))}
    </>
  )
}

export function DetalheComunidade() {
  const { id } = useParams()
  const r = useRecurso(DISPONIVEL.comunidades, () => lerComunidadeTematica(id), [id])
  return (
    <>
      <TituloPagina titulo={r.estado === 'pronto' ? r.dados.comunidade?.nome ?? 'Comunidade' : 'Comunidade'} voltar={{ para: '/empresa/comunidades', rotulo: 'Comunidades' }} />
      {r.estado === 'indisponivel' && (
        <RecursoIndisponivel icone="grupo" ilustracao={IlustracaoConexoes} titulo="Comunidades ainda não disponíveis" descricao="A página de cada comunidade depende da API de comunidades." />
      )}
      {r.estado === 'carregando' && <Carregando />}
      {r.estado === 'erro' && <ErroAoCarregar erro={r.erro} />}
      {r.estado === 'pronto' && (
        <section className="cartao p-6">
          <p className="leading-relaxed text-tinta-2">{r.dados.comunidade?.descricao}</p>
        </section>
      )}
    </>
  )
}

export function Mensagens() {
  const r = useRecurso(DISPONIVEL.mensagens, listarConversas)
  return (
    <>
      <TituloPagina titulo="Mensagens" descricao="Converse com candidatas sobre vagas e processos seletivos." />
      {r.estado === 'indisponivel' && (
        <RecursoIndisponivel
          icone="mensagem"
          ilustracao={IlustracaoConexoes}
          titulo="Mensagens ainda não disponíveis"
          descricao="As conversas dependem de uma API de mensagens. Enquanto isso, use o e-mail que a candidata informa ao se candidatar."
        >
          <Botao as={Link} to="/empresa/candidaturas">
            Ver candidaturas
          </Botao>
        </RecursoIndisponivel>
      )}
      {r.estado === 'carregando' && <Carregando />}
      {r.estado === 'erro' && <ErroAoCarregar erro={r.erro} />}
      {r.estado === 'pronto' && (
        <Vazio className="bg-branco">
          <VazioTitulo>Nenhuma conversa ainda</VazioTitulo>
        </Vazio>
      )}
    </>
  )
}

export function Conversa() {
  const { id } = useParams()
  const r = useRecurso(DISPONIVEL.mensagens, () => lerConversa(id), [id])
  return (
    <>
      <TituloPagina titulo="Conversa" voltar={{ para: '/empresa/mensagens', rotulo: 'Mensagens' }} />
      {r.estado === 'indisponivel' && (
        <RecursoIndisponivel icone="mensagem" ilustracao={IlustracaoConexoes} titulo="Mensagens ainda não disponíveis" descricao="Esta conversa não pode ser aberta porque a API de mensagens ainda não existe." />
      )}
      {r.estado === 'carregando' && <Carregando />}
      {r.estado === 'erro' && <ErroAoCarregar erro={r.erro} />}
    </>
  )
}
