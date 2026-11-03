import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import TituloPagina, { RecursoIndisponivel } from '../../components/candidata/TituloPagina'
import { useRecurso } from '../../components/candidata/useRecurso'
import Avatar from '../../components/comunidade/Avatar'
import Botao from '../../components/ui/Botao'
import { Aviso } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { DISPONIVEL, lerComunidadeTematica, participarComunidade } from '../../services/recursos'

function DetalheComunidade() {
  const { id } = useParams()
  const r = useRecurso(DISPONIVEL.comunidades, () => lerComunidadeTematica(id), [id])
  const [participando, setParticipando] = useState(null)
  const [erroAcao, setErroAcao] = useState('')

  if (r.estado === 'indisponivel') {
    return (
      <>
        <TituloPagina titulo="Comunidade" voltar={{ para: '/candidata/comunidades', rotulo: 'Comunidades' }} />
        <RecursoIndisponivel
          icone="grupo"
          titulo="Comunidades ainda não disponíveis"
          descricao="As páginas de cada comunidade, com publicações e participantes, dependem da API de comunidades."
        >
          <Botao as={Link} to="/candidata/feed">
            Ir para o feed
          </Botao>
        </RecursoIndisponivel>
      </>
    )
  }
  if (r.estado === 'carregando') return <Esqueleto className="h-64 rounded-xl" />
  if (r.estado === 'erro' || !r.dados?.comunidade) {
    return (
      <Vazio className="bg-branco">
        <VazioTitulo>Comunidade não encontrada</VazioTitulo>
        <VazioDescricao>{r.erro ?? 'Esta comunidade não existe ou foi removida.'}</VazioDescricao>
        <VazioAcoes>
          <Botao as={Link} to="/candidata/comunidades">
            Ver comunidades
          </Botao>
        </VazioAcoes>
      </Vazio>
    )
  }

  const { comunidade, participantes = [] } = r.dados
  const souParticipante = participando ?? comunidade.participando

  async function alternar() {
    setErroAcao('')
    try {
      const resposta = await participarComunidade(comunidade.id)
      setParticipando(resposta.participando)
    } catch (e) {
      setErroAcao(e.message)
    }
  }

  return (
    <>
      <TituloPagina
        titulo={comunidade.nome}
        descricao={comunidade.tema}
        voltar={{ para: '/candidata/comunidades', rotulo: 'Comunidades' }}
        acoes={
          <Botao variante={souParticipante ? 'secundario' : 'primario'} onClick={alternar}>
            {souParticipante ? 'Sair da comunidade' : 'Participar'}
          </Botao>
        }
      />
      {erroAcao && <Aviso tipo="erro" className="mb-4">{erroAcao}</Aviso>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-xl border border-linha bg-branco p-6">
          <h2 className="font-display text-xl text-tinta">Sobre</h2>
          <p className="mt-3 leading-relaxed text-tinta-2">{comunidade.descricao}</p>
        </section>
        <section className="rounded-xl border border-linha bg-branco p-6">
          <h2 className="font-display text-xl text-tinta">Participantes</h2>
          {participantes.length ? (
            <ul className="mt-3 divide-y divide-linha">
              {participantes.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <Avatar nome={p.nome} foto={p.foto} tamanho="sm" />
                  <span className="truncate text-sm font-semibold">{p.nome}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-suave">Lista de participantes indisponível.</p>
          )}
        </section>
      </div>
    </>
  )
}

export default DetalheComunidade
