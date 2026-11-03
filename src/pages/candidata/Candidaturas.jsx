import { useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../../components/Icone'
import MarcaEmpresa from '../../components/MarcaEmpresa'
import { IlustracaoCrescimento } from '../../components/ilustracoes/Ilustracoes'
import TituloPagina from '../../components/candidata/TituloPagina'
import Botao from '../../components/ui/Botao'
import Selo from '../../components/ui/Selo'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { buscarEmpresa, empresaPorNome } from '../../data/empresas'
import { situacao } from '../../services/candidaturas'
import { cn } from '../../lib/cn'
import { useCandidaturas } from '../../hooks/useVagasReais'

// Filtros pelos status reais do sistema (ENUM do banco + vaga encerrada).
const FILTROS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'andamento', rotulo: 'Em andamento' },
  { id: 'aprovada', rotulo: 'Aprovadas' },
  { id: 'recusada', rotulo: 'Não selecionadas' },
  { id: 'encerrada', rotulo: 'Encerradas' },
]

function Candidaturas() {
  const [filtro, setFiltro] = useState('todas')
  const candidaturas = useCandidaturas()

  const contagem = candidaturas.reduce((acc, c) => {
    const grupo = situacao(c).grupo
    return { ...acc, [grupo]: (acc[grupo] ?? 0) + 1 }
  }, {})
  const ordenadas = [...candidaturas].reverse()
  const filtradas = filtro === 'todas' ? ordenadas : ordenadas.filter((c) => situacao(c).grupo === filtro)

  return (
    <>
      <TituloPagina titulo="Minhas candidaturas" descricao="Acompanhe o status de cada processo seletivo." />

      {candidaturas.length === 0 ? (
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
            <ul className="overflow-hidden rounded-xl border border-linha bg-branco">
              {filtradas.map((c) => {
                const info = situacao(c)
                const empresa = buscarEmpresa(c.empresaSlug) ?? empresaPorNome(c.empresa)
                return (
                  <li key={c.id} className="border-b border-linha last:border-b-0">
                    <Link
                      to={`/candidata/candidaturas/${encodeURIComponent(c.id)}`}
                      className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 p-5 transition-colors hover:bg-papel sm:grid-cols-[auto_1fr_auto_auto]"
                    >
                      <MarcaEmpresa empresa={empresa} tamanho="md" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-tinta">{c.cargo}</span>
                        <span className="block truncate text-sm text-suave">{empresa?.nome ?? c.empresa}</span>
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
            As candidaturas ficam registradas neste navegador até a API de candidaturas existir. O status só muda quando a empresa atualiza o processo.
          </p>
        </>
      )}
    </>
  )
}

export default Candidaturas
