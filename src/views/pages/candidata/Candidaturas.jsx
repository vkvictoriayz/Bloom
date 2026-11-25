import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import Icone from '../../components/Icone'
import MarcaEmpresa from '../../components/MarcaEmpresa'
import { IlustracaoCrescimento } from '../../components/ilustracoes/Ilustracoes'
import TituloPagina from '../../components/candidata/TituloPagina'
import Botao from '../../components/ui/Botao'
import Selo from '../../components/ui/Selo'
import { Aviso } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { situacao } from '../../services/candidaturas'
import { cn } from '../../lib/cn'
import { useCandidaturasEstado } from '../../hooks/useVagasReais'

const FILTROS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'andamento', rotulo: 'Em andamento' },
  { id: 'aprovada', rotulo: 'Aprovadas' },
  { id: 'recusada', rotulo: 'Não selecionadas' },
  { id: 'encerrada', rotulo: 'Encerradas' },
]

const PASSOS = ['Recebida', 'Em análise', 'Em entrevista', 'Aprovada']
const COR = { Recebida: '#b03a57', 'Em análise': '#c88f2e', 'Em entrevista': '#7b55b0', Aprovada: '#3f8a5a', Reprovada: '#928086', Encerrada: '#928086' }

function Trilha({ status }) {
  if (status === 'Reprovada' || status === 'Encerrada') {
    return <span className="text-xs text-suave">{status === 'Reprovada' ? 'Processo encerrado pela empresa' : 'A vaga foi encerrada'}</span>
  }
  const atual = Math.max(0, PASSOS.indexOf(status ?? 'Recebida'))
  return (
    <span className="flex items-center gap-2">
      <span className="flex items-center gap-1" aria-hidden="true">
        {PASSOS.map((p, i) => (
          <span key={p} className="h-1.5 w-7 rounded-full transition-colors" style={{ background: i <= atual ? COR[status ?? 'Recebida'] : 'var(--color-papel-2)' }} />
        ))}
      </span>
      <span className="text-xs text-suave">
        Etapa {atual + 1} de {PASSOS.length}
      </span>
    </span>
  )
}

function Candidaturas() {
  const [filtro, setFiltro] = useState('todas')
  const { lista: candidaturas, carregando, erro } = useCandidaturasEstado()
  const aviso = useLocation().state?.aviso

  const contagem = candidaturas.reduce((acc, c) => {
    const grupo = situacao(c).grupo
    return { ...acc, [grupo]: (acc[grupo] ?? 0) + 1 }
  }, {})
  const ordenadas = [...candidaturas].reverse()
  const filtradas = filtro === 'todas' ? ordenadas : ordenadas.filter((c) => situacao(c).grupo === filtro)

  return (
    <>
      <TituloPagina titulo="Minhas candidaturas" descricao="Acompanhe o status de cada processo seletivo." />
      {aviso && (
        <Aviso tipo="sucesso" className="mb-5">
          {aviso}
        </Aviso>
      )}

      {carregando ? (
        <Esqueleto className="h-64 rounded-xl" />
      ) : erro ? (
        <Aviso tipo="erro">Não foi possível carregar suas candidaturas: {erro}</Aviso>
      ) : candidaturas.length === 0 ? (
        <Vazio className="bg-branco">
          <IlustracaoCrescimento className="max-w-[240px]" />
          <VazioTitulo>Você ainda não se candidatou</VazioTitulo>
          <VazioDescricao>Encontre uma vaga que combine com você. Cada candidatura aparece aqui com o status atual.</VazioDescricao>
          <VazioAcoes>
            <Botao as={Link} to="/candidata/vagas">
              Explorar vagas
            </Botao>
          </VazioAcoes>
        </Vazio>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar por status">
            {FILTROS.map((item) => {
              const total = item.id === 'todas' ? candidaturas.length : contagem[item.id] ?? 0
              const ativo = filtro === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setFiltro(item.id)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                    ativo ? 'border-tinta bg-tinta text-white' : 'border-linha-forte bg-branco text-tinta-2 hover:border-tinta'
                  )}
                >
                  {item.rotulo} <span className="tabular-nums opacity-70">{total}</span>
                </button>
              )
            })}
          </div>

          {filtradas.length === 0 ? (
            <p className="rounded-xl border border-dashed border-linha-forte bg-branco px-5 py-6 text-sm text-suave">
              Nenhuma candidatura com este status.
            </p>
          ) : (
            <ul className="animar-lista overflow-hidden rounded-2xl border border-linha bg-branco">
              {filtradas.map((c) => {
                const info = situacao(c)
                const empresa = c.dadosEmpresa
                return (
                  <li key={c.id} className="border-b border-linha last:border-b-0">
                    <Link
                      to={`/candidata/candidaturas/${encodeURIComponent(c.id)}`}
                      className="relative grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 p-5 transition-colors hover:bg-papel sm:grid-cols-[auto_1fr_auto_auto]"
                    >
                      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ background: COR[c.status] ?? COR.Recebida }} />
                      <MarcaEmpresa empresa={empresa} tamanho="md" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-tinta">{c.cargo}</span>
                        <span className="block truncate text-sm text-suave">{empresa?.nome ?? c.empresa}</span>
                        <span className="mt-2 block">
                          <Trilha status={c.status} />
                        </span>
                      </span>
                      <span className="col-start-2 text-sm text-tinta-2 sm:col-start-auto">Enviada em {c.data}</span>
                      <span className="col-start-2 flex items-center gap-2 sm:col-start-auto">
                        <Selo variante={info.variante}>{info.rotulo}</Selo>
                        <Icone nome="seta" tamanho={16} className="text-suave" />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-6 flex items-start gap-2 text-xs text-suave">
            <Icone nome="info" tamanho={16} className="mt-px shrink-0" />
            O status só muda quando a empresa atualiza o processo. Você recebe uma notificação a cada mudança.
          </p>
        </>
      )}
    </>
  )
}

export default Candidaturas
