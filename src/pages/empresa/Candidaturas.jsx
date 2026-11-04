import { Link, useSearchParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import Avatar from '../../components/comunidade/Avatar'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import { IlustracaoConexoes } from '../../components/ilustracoes/Ilustracoes'
import Botao from '../../components/ui/Botao'
import { Selecao } from '../../components/ui/Campo'
import Selo from '../../components/ui/Selo'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { dataCurta, listarCandidaturasEmpresa, listarVagasEmpresa, STATUS_CANDIDATURA, VISUAL_CANDIDATURA } from '../../services/empresa'
import { cn } from '../../lib/cn'

// Quadro por etapa: uma coluna para cada status do processo seletivo.
function QuadroEtapas({ candidaturas }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {STATUS_CANDIDATURA.map((s) => {
        const daEtapa = candidaturas.filter((c) => c.status === s)
        return (
          <section key={s} aria-label={VISUAL_CANDIDATURA[s].rotulo} className="flex flex-col rounded-xl border border-linha bg-papel">
            <header className="flex items-center justify-between gap-2 border-b border-linha px-4 py-3">
              <Selo variante={VISUAL_CANDIDATURA[s].variante}>{VISUAL_CANDIDATURA[s].rotulo}</Selo>
              <span className="text-sm font-semibold text-tinta-2 tabular-nums">{daEtapa.length}</span>
            </header>
            <ul className="flex flex-col gap-2 p-3">
              {daEtapa.map((c) => (
                <li key={c.id}>
                  <Link to={`/empresa/candidaturas/${c.id}`} className="flex items-center gap-3 rounded-lg border border-linha bg-branco p-3 hover:border-vinho/40">
                    <Avatar nome={c.candidata.nome} foto={c.candidata.foto} tamanho="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-tinta">{c.candidata.nome}</span>
                      <span className="block truncate text-xs text-suave">{c.vaga.titulo}</span>
                    </span>
                  </Link>
                </li>
              ))}
              {daEtapa.length === 0 && <li className="px-1 py-2 text-xs text-suave">Ninguém nesta etapa.</li>}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

// Candidaturas às vagas da empresa (registros reais de CANDIDATURAS).
function Candidaturas() {
  const [parametros, setParametros] = useSearchParams()
  const vaga = parametros.get('vaga') ?? ''
  const status = parametros.get('status') ?? ''
  const porEtapa = parametros.get('modo') === 'etapas'
  const r = useCarregar(() => listarCandidaturasEmpresa({ vaga, status }), [vaga, status])
  const vagas = useCarregar(() => listarVagasEmpresa())

  function definir(chave, valor) {
    const p = new URLSearchParams(parametros)
    if (valor) p.set(chave, valor)
    else p.delete(chave)
    setParametros(p, { replace: true })
  }

  return (
    <>
      <TituloPagina titulo="Candidaturas recebidas" descricao="Quem se candidatou às vagas da empresa e em que etapa está cada processo." />

      <div className="mb-4 flex w-fit rounded-full border border-linha bg-branco p-1" role="group" aria-label="Forma de exibir">
        {[
          ['', 'Lista'],
          ['etapas', 'Por etapa'],
        ].map(([valor, rotulo]) => (
          <button
            key={rotulo}
            type="button"
            aria-pressed={(parametros.get('modo') ?? '') === valor}
            onClick={() => definir('modo', valor)}
            className={cn(
              'h-9 rounded-full px-4 text-sm font-semibold transition-colors',
              (parametros.get('modo') ?? '') === valor ? 'bg-vinho text-white' : 'text-tinta-2 hover:text-tinta'
            )}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <Selecao aria-label="Filtrar por vaga" value={vaga} onChange={(e) => definir('vaga', e.target.value)}>
          <option value="">Todas as vagas</option>
          {vagas.tipo === 'pronto' &&
            vagas.dados.vagas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.titulo}
              </option>
            ))}
        </Selecao>
        <Selecao aria-label="Filtrar por status" value={status} onChange={(e) => definir('status', e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_CANDIDATURA.map((s) => (
            <option key={s} value={s}>
              {VISUAL_CANDIDATURA[s].rotulo}
            </option>
          ))}
        </Selecao>
      </div>

      {r.tipo === 'carregando' && <Carregando />}
      {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {r.tipo === 'pronto' &&
        (r.dados.candidaturas.length === 0 ? (
          <Vazio className="bg-branco">
            <IlustracaoConexoes className="max-w-[220px]" />
            <VazioTitulo>{vaga || status ? 'Nenhuma candidatura com esses filtros' : 'Nenhuma candidatura ainda'}</VazioTitulo>
            <VazioDescricao>As candidaturas aparecem aqui assim que alguém se candidatar a uma vaga aberta da empresa.</VazioDescricao>
            <VazioAcoes>
              <Botao as={Link} to="/empresa/vagas" variante="secundario">
                Ver vagas
              </Botao>
            </VazioAcoes>
          </Vazio>
        ) : porEtapa ? (
          <QuadroEtapas candidaturas={r.dados.candidaturas} />
        ) : (
          <ul className="cartao divide-y divide-linha overflow-hidden">
            {r.dados.candidaturas.map((c) => {
              const visual = VISUAL_CANDIDATURA[c.status] ?? { variante: 'neutro', rotulo: c.status }
              return (
                <li key={c.id}>
                  <Link to={`/empresa/candidaturas/${c.id}`} className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 p-5 hover:bg-papel sm:grid-cols-[auto_1fr_auto_auto]">
                    <Avatar nome={c.candidata.nome} foto={c.candidata.foto} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-tinta">{c.candidata.nome}</span>
                      <span className="block truncate text-sm text-suave">
                        {[c.candidata.titulo || c.candidata.area, c.vaga.titulo].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <span className="col-start-2 text-sm text-tinta-2 sm:col-start-auto">{dataCurta(c.data)}</span>
                    <span className="col-start-2 flex items-center gap-2 sm:col-start-auto">
                      <Selo variante={visual.variante}>{visual.rotulo}</Selo>
                      <Icone nome="seta" tamanho={16} className="text-suave" />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ))}
    </>
  )
}

export default Candidaturas
