import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import Icone from '../components/Icone'
import LinhaDoTempo from '../components/LinhaDoTempo'
import LinhaVaga from '../components/LinhaVaga'
import MarcaEmpresa from '../components/MarcaEmpresa'
import CabecalhoPagina from '../components/layout/CabecalhoPagina'
import Pagina from '../components/layout/Pagina'
import { fotos } from '../data/imagens'
import Abas from '../components/ui/Abas'
import Botao from '../components/ui/Botao'
import Selo from '../components/ui/Selo'
import { Vazio, VazioAcoes, VazioDescricao, VazioIcone, VazioTitulo } from '../components/ui/Vazio'
import { buscarEmpresa, empresaPorNome } from '../data/empresas'
import { buscarVaga } from '../data/vagas'
import { useDadosLocais } from '../hooks/useDadosLocais'
import { candidaturaDaVaga, ETAPAS, EVENTO_CANDIDATURAS, lerCandidaturas, situacao } from '../services/candidaturas'
import { EVENTO_SALVAS, lerSalvas } from '../services/salvas'
import { cn } from '../lib/cn'

const FILTROS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'andamento', rotulo: 'Em andamento' },
  { id: 'aprovada', rotulo: 'Aprovadas' },
  { id: 'recusada', rotulo: 'Não selecionadas' },
  { id: 'encerrada', rotulo: 'Encerradas' },
]

// Cor da faixa lateral de cada candidatura, conforme o grupo.
const FAIXA = {
  andamento: 'bg-vinho',
  aprovada: 'bg-sucesso',
  recusada: 'bg-erro',
  encerrada: 'bg-linha-forte',
}

// "31/10/2026" (formato salvo) -> { dia: '31', mesAno: 'out 2026' }
function dataEnvio(candidatura) {
  const [dia, mes, ano] = (candidatura.data ?? '').split('/').map(Number)
  if (!dia || !mes || !ano) return null
  const mesCurto = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return { dia: String(dia).padStart(2, '0'), mesAno: `${mesCurto} ${ano}` }
}

function CartaoCandidatura({ candidatura }) {
  const info = situacao(candidatura)
  const empresa = buscarEmpresa(candidatura.empresaSlug) ?? empresaPorNome(candidatura.empresa)
  const vagaExiste = Boolean(buscarVaga(candidatura.vagaId))

  const data = dataEnvio(candidatura)

  return (
    <article className="relative overflow-hidden rounded-xl border border-linha bg-branco">
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', FAIXA[info.grupo])} />
      <div className="flex flex-col gap-6 p-6 pl-7 md:flex-row md:items-start">
        {data && (
          <p className="flex shrink-0 items-baseline gap-2 md:w-20 md:flex-col md:items-start md:gap-0 md:border-r md:border-linha md:pr-5">
            <span className="font-display text-4xl leading-none text-tinta tabular-nums">{data.dia}</span>
            <span className="text-xs font-bold tracking-[0.1em] text-suave uppercase">{data.mesAno}</span>
            <span className="sr-only">data de envio</span>
          </p>
        )}
        <div className="flex min-w-0 flex-1 gap-4">
          <MarcaEmpresa empresa={empresa} tamanho="md" />
          <div className="min-w-0">
            <p className="text-sm text-suave">{empresa?.nome ?? candidatura.empresa}</p>
            <h3 className="mt-0.5 text-lg font-semibold text-tinta">{candidatura.cargo}</h3>
            <p className="mt-1 text-sm text-tinta-2">
              {[candidatura.local, candidatura.modalidade].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-row items-center gap-3 md:flex-col md:items-end">
          <Selo variante={info.variante}>{info.rotulo}</Selo>
          {info.etapaAtual !== null && (
            <span className="text-xs text-suave">
              Etapa {info.etapasConcluidas} de {ETAPAS.length} concluída
            </span>
          )}
          {vagaExiste && (
            <Link to={`/vagas/${candidatura.vagaId}`} className="link-linha text-sm font-semibold text-vinho">
              Ver vaga
            </Link>
          )}
        </div>
      </div>
      <div className="border-t border-linha bg-papel/60 px-6 py-5 pl-7">
        <LinhaDoTempo candidatura={candidatura} />
        {!candidatura.confirmadaPeloServidor && info.grupo === 'andamento' && (
          <p className="mt-4 flex items-start gap-2 text-xs text-suave">
            <Icone nome="info" tamanho={15} className="mt-px shrink-0" />
            Registrada neste navegador. As próximas etapas aparecem quando a empresa atualizar o processo na Bloom.
          </p>
        )}
      </div>
    </article>
  )
}

function Candidaturas() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const aba = pathname === '/vagas-salvas' ? 'salvas' : 'candidaturas'
  const [filtro, setFiltro] = useState('todas')

  const candidaturas = useDadosLocais(lerCandidaturas, [EVENTO_CANDIDATURAS])
  const salvas = useDadosLocais(lerSalvas, [EVENTO_SALVAS])
  const vagasSalvas = salvas.map((id) => buscarVaga(id)).filter(Boolean)

  const contagem = candidaturas.reduce((acc, c) => {
    const grupo = situacao(c).grupo
    return { ...acc, [grupo]: (acc[grupo] ?? 0) + 1 }
  }, {})

  const ordenadas = [...candidaturas].reverse()
  const filtradas = filtro === 'todas' ? ordenadas : ordenadas.filter((c) => situacao(c).grupo === filtro)

  return (
    <Pagina titulo={aba === 'salvas' ? 'Vagas salvas' : 'Candidaturas'}>
      <CabecalhoPagina
        variante="retangular"
        foto={fotos.candidaturas}
        rotulo="Sua jornada"
        titulo={
          <>
            Cada passo da sua <em className="text-vinho">carreira</em>, acompanhado.
          </>
        }
        descricao="Veja em que etapa está cada processo seletivo e volte às vagas que você guardou."
      >
        <ul className="grid max-w-md grid-cols-4 divide-x divide-linha border-y border-linha" aria-label="Resumo das candidaturas">
          {[
            ['andamento', 'Em andamento'],
            ['aprovada', 'Aprovadas'],
            ['recusada', 'Não selecionadas'],
            ['encerrada', 'Encerradas'],
          ].map(([grupo, rotulo]) => (
            <li key={grupo} className="px-3 py-3 first:pl-0">
              <span className="font-display text-3xl text-tinta tabular-nums">{contagem[grupo] ?? 0}</span>
              <span className="mt-1 block text-[11px] leading-tight text-suave">{rotulo}</span>
            </li>
          ))}
        </ul>
      </CabecalhoPagina>

      <div className="sticky top-16 z-30 border-b border-linha bg-papel/95 backdrop-blur-sm lg:top-[72px]">
        <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 lg:px-8">
          <Abas
            className="border-b-0"
            rotulo="Seções"
            ativa={aba}
            aoTrocar={(id) => navigate(id === 'salvas' ? '/vagas-salvas' : '/minhas-candidaturas')}
            abas={[
              { id: 'candidaturas', rotulo: 'Candidaturas', contagem: candidaturas.length },
              { id: 'salvas', rotulo: 'Vagas salvas', contagem: vagasSalvas.length },
            ]}
          />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {aba === 'candidaturas' ? (
          <div role="tabpanel" id="painel-candidaturas" aria-labelledby="aba-candidaturas">
            {candidaturas.length === 0 ? (
              <Vazio>
                <VazioIcone>
                  <Icone nome="candidaturas" />
                </VazioIcone>
                <VazioTitulo>Você ainda não se candidatou</VazioTitulo>
                <VazioDescricao>
                  Encontre uma vaga que combine com você e clique em “Candidatar-se”. Cada processo aparece aqui com suas etapas.
                </VazioDescricao>
                <VazioAcoes>
                  <Botao as={Link} to="/vagas">
                    Explorar vagas
                  </Botao>
                </VazioAcoes>
              </Vazio>
            ) : (
              <>
                <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
                  {FILTROS.map((item) => {
                    const total = item.id === 'todas' ? candidaturas.length : contagem[item.id] ?? 0
                    if (item.id !== 'todas' && total === 0) return null
                    const ativo = filtro === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => setFiltro(item.id)}
                        className={cn(
                          'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                          ativo ? 'border-tinta bg-tinta text-white' : 'border-linha-forte bg-branco text-tinta-2 hover:border-tinta'
                        )}
                      >
                        {item.rotulo} <span className="tabular-nums opacity-70">{total}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="flex flex-col gap-4">
                  {filtradas.map((c) => (
                    <CartaoCandidatura key={c.id} candidatura={c} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div role="tabpanel" id="painel-salvas" aria-labelledby="aba-salvas">
            {vagasSalvas.length === 0 ? (
              <Vazio>
                <VazioIcone>
                  <Icone nome="coracao" />
                </VazioIcone>
                <VazioTitulo>Nenhuma vaga salva</VazioTitulo>
                <VazioDescricao>Toque no coração de uma vaga para guardá-la aqui e decidir com calma.</VazioDescricao>
                <VazioAcoes>
                  <Botao as={Link} to="/vagas">
                    Explorar vagas
                  </Botao>
                </VazioAcoes>
              </Vazio>
            ) : (
              <div className="border-t border-tinta">
                {vagasSalvas.map((vaga) => (
                  <LinhaVaga key={vaga.id} vaga={vaga} candidatura={candidaturaDaVaga(vaga.id, candidaturas)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Pagina>
  )
}

export default Candidaturas
