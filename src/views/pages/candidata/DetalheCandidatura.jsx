import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import LinhaDoTempo from '../../components/LinhaDoTempo'
import MarcaEmpresa from '../../components/MarcaEmpresa'
import TituloPagina from '../../components/candidata/TituloPagina'
import Botao from '../../components/ui/Botao'
import Selo from '../../components/ui/Selo'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { Aviso } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { buscarCandidatura, situacao } from '../../services/candidaturas'
import { abrirConversa } from '../../services/recursos'
import { retirarCandidaturaServidor } from '../../services/vagasApi'
import { useCandidaturasEstado } from '../../hooks/useVagasReais'

// Só a própria candidata acessa: as candidaturas lidas são as dela.
function NaoEncontrada() {
  return (
    <Vazio className="bg-branco">
      <VazioTitulo>Candidatura não encontrada</VazioTitulo>
      <VazioDescricao>Não encontramos esta candidatura entre as suas.</VazioDescricao>
      <VazioAcoes>
        <Botao as={Link} to="/candidata/candidaturas">
          Minhas candidaturas
        </Botao>
      </VazioAcoes>
    </Vazio>
  )
}

function useCandidatura() {
  const { id } = useParams()
  const { lista, carregando, erro } = useCandidaturasEstado()
  const candidatura = buscarCandidatura(id, lista)
  // A vaga é real ("b<id>") e abre em /vagas/:id.
  const vaga = candidatura ? { id: candidatura.vagaId } : null
  const empresa = candidatura?.dadosEmpresa ?? null
  return { candidatura, vaga, empresa, carregando, erro }
}

// Abre (ou retoma) a conversa com a empresa sobre esta candidatura.
function BotaoMensagem({ candidatura }) {
  const navigate = useNavigate()
  const [estado, setEstado] = useState({ tipo: 'ocioso' })
  async function abrir() {
    setEstado({ tipo: 'abrindo' })
    try {
      const r = await abrirConversa(candidatura.idServidor)
      navigate(`/candidata/mensagens/${r.conversa.id}`)
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }
  return (
    <>
      <Botao variante="secundario" onClick={abrir} disabled={estado.tipo === 'abrindo'}>
        <Icone nome="mensagem" tamanho={16} /> {estado.tipo === 'abrindo' ? 'Abrindo…' : 'Mensagem para a empresa'}
      </Botao>
      {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
    </>
  )
}

// Etapas em que ainda dá para desistir (igual à API).
const PODE_RETIRAR = ['Recebida', 'Em análise', 'Em entrevista']

// Retirar a candidatura: pede confirmação, apaga no servidor e volta à lista.
function RetirarCandidatura({ candidatura }) {
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(false)
  const [estado, setEstado] = useState({ tipo: 'ocioso' })

  async function confirmar() {
    setEstado({ tipo: 'enviando' })
    try {
      await retirarCandidaturaServidor(candidatura.idServidor)
      navigate('/candidata/candidaturas', { replace: true, state: { aviso: `Candidatura para ${candidatura.cargo} retirada.` } })
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <section className="rounded-xl border border-linha bg-branco p-6">
      <h2 className="text-xs font-bold tracking-[0.12em] text-suave uppercase">Desistir da vaga</h2>
      {!aberto ? (
        <>
          <p className="mt-3 text-sm text-tinta-2">Se você não quer mais participar deste processo, pode retirar a candidatura.</p>
          <Botao variante="secundario" className="mt-4 w-full text-erro" onClick={() => setAberto(true)}>
            Retirar candidatura
          </Botao>
        </>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-tinta-2">
            A empresa será avisada e deixa de ver o que você enviou (apresentação, links e currículo). A conversa sobre esta vaga também é apagada. Isso não pode ser desfeito.
          </p>
          {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
          <div className="flex flex-wrap gap-2">
            <Botao className="bg-erro hover:bg-erro/90" onClick={confirmar} disabled={estado.tipo === 'enviando'}>
              {estado.tipo === 'enviando' ? 'Retirando…' : 'Sim, retirar'}
            </Botao>
            <Botao variante="fantasma" onClick={() => setAberto(false)} disabled={estado.tipo === 'enviando'}>
              Cancelar
            </Botao>
          </div>
        </div>
      )}
    </section>
  )
}

function DetalheCandidatura() {
  const { candidatura, vaga, empresa, carregando, erro } = useCandidatura()
  if (carregando) return <Esqueleto className="h-96 rounded-xl" />
  if (erro) return <Aviso tipo="erro">Não foi possível carregar suas candidaturas: {erro}</Aviso>
  if (!candidatura) return <NaoEncontrada />

  const info = situacao(candidatura)
  const enviado = candidatura.enviado

  return (
    <>
      <TituloPagina
        titulo={candidatura.cargo}
        descricao={`${empresa?.nome ?? candidatura.empresa} · enviada em ${candidatura.data}`}
        voltar={{ para: '/candidata/candidaturas', rotulo: 'Minhas candidaturas' }}
        acoes={
          <div className="flex flex-wrap items-start gap-2">
            <BotaoMensagem candidatura={candidatura} />
            <Botao as={Link} to={`/candidata/candidaturas/${encodeURIComponent(candidatura.id)}/andamento`}>
              Ver andamento
            </Botao>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-linha bg-branco p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl text-tinta">Status atual</h2>
              <Selo variante={info.variante}>{info.rotulo}</Selo>
            </div>
            <div className="mt-5">
              <LinhaDoTempo candidatura={candidatura} />
            </div>
          </section>

          <section className="rounded-xl border border-linha bg-branco p-6">
            <h2 className="font-display text-xl text-tinta">O que você enviou</h2>
            {enviado ? (
              <dl className="mt-4 flex flex-col gap-4 text-sm break-words">
                {enviado.perfil && (
                  <div>
                    <dt className="text-suave">Dados</dt>
                    <dd className="font-semibold text-tinta">
                      {[enviado.perfil.nome, enviado.perfil.email, enviado.perfil.titulo, enviado.perfil.local].filter(Boolean).join(' · ')}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-suave">Links</dt>
                  <dd>
                    {enviado.links?.length ? (
                      <ul className="mt-1 flex flex-col gap-1">
                        {enviado.links.map((l) => (
                          <li key={l.rotulo}>
                            {l.url ? (
                              <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-vinho hover:underline">
                                {l.rotulo} <Icone nome="externo" tamanho={13} />
                              </a>
                            ) : (
                              <span className="font-semibold text-tinta">{l.rotulo}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-tinta-2">Nenhum link enviado.</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-suave">Apresentação</dt>
                  <dd className="whitespace-pre-line text-tinta-2">{enviado.apresentacao || 'Sem apresentação.'}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-suave">Esta candidatura foi feita antes do formulário de candidatura e não guarda detalhes do envio.</p>
            )}
          </section>

          <section className="rounded-xl border border-linha bg-branco p-6">
            <h2 className="font-display text-xl text-tinta">Histórico de atualizações</h2>
            <ol className="mt-4 border-l-2 border-linha pl-5">
              <li className="relative">
                <span aria-hidden="true" className="absolute top-1.5 -left-[27px] size-3 rounded-full bg-vinho" />
                <p className="text-sm font-semibold text-tinta">Candidatura registrada</p>
                <p className="text-xs text-suave">{candidatura.data}</p>
              </li>
            </ol>
            <p className="mt-4 text-xs text-suave">Novas atualizações aparecerão aqui quando a empresa registrar mudanças no processo.</p>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border border-linha bg-branco p-6">
            <h2 className="text-xs font-bold tracking-[0.12em] text-suave uppercase">Vaga</h2>
            <div className="mt-4 flex items-center gap-3">
              <MarcaEmpresa empresa={empresa} tamanho="md" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-tinta">{candidatura.cargo}</p>
                <p className="truncate text-sm text-suave">{empresa?.nome ?? candidatura.empresa}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-tinta-2">{[candidatura.local, candidatura.modalidade].filter(Boolean).join(' · ')}</p>
            {vaga ? (
              <Botao as={Link} to={`/vagas/${vaga.id}`} variante="secundario" className="mt-4 w-full">
                Ver vaga
              </Botao>
            ) : (
              <p className="mt-4 text-sm text-suave">Esta vaga não está mais disponível.</p>
            )}
            {empresa?.id ? (
              <Link to={`/candidata/empresas/${empresa.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
                Sobre a empresa <Icone nome="seta" tamanho={14} />
              </Link>
            ) : null}
          </section>
          {PODE_RETIRAR.includes(candidatura.status) && <RetirarCandidatura candidatura={candidatura} />}
        </aside>
      </div>
    </>
  )
}

export default DetalheCandidatura
