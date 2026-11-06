import { Link } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import Botao from '../../components/ui/Botao'
import Selo from '../../components/ui/Selo'
import { dataCurta, lerDashboard, VISUAL_VAGA } from '../../services/empresa'

function Numero({ rotulo, valor, icone, para }) {
  const conteudo = (
    <>
      <span className="grid size-10 place-items-center rounded-full bg-blush text-vinho" aria-hidden="true">
        <Icone nome={icone} tamanho={18} />
      </span>
      <span>
        <span className="block font-display text-3xl leading-none text-tinta tabular-nums">{valor}</span>
        <span className="mt-1 block text-sm text-tinta-2">{rotulo}</span>
      </span>
    </>
  )
  return para ? (
    <Link to={para} className="cartao flex items-center gap-4 p-5 transition-colors hover:border-vinho/40">
      {conteudo}
    </Link>
  ) : (
    <div className="cartao flex items-center gap-4 p-5">{conteudo}</div>
  )
}

// Painel de recrutamento: números calculados no servidor a partir das vagas,
// candidaturas, vagas salvas e convites da empresa.
function Dashboard() {
  const r = useCarregar(lerDashboard)

  return (
    <>
      <TituloPagina
        titulo="Painel de recrutamento"
        descricao="Como estão suas vagas e candidaturas agora."
        acoes={
          <Botao as={Link} to="/empresa/vagas/criar">
            <Icone nome="mais" tamanho={16} /> Nova vaga
          </Botao>
        }
      />
      {r.tipo === 'carregando' && <Carregando quantidade={3} altura="h-28" />}
      {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {r.tipo === 'pronto' &&
        (() => {
          const t = r.dados.totais
          const maior = Math.max(1, ...r.dados.vagas.map((v) => v.candidaturas))
          return (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Numero rotulo="Vagas publicadas" valor={t.vagasPublicadas} icone="maleta" para="/empresa/vagas" />
                <Numero rotulo="Vagas ativas" valor={t.vagasAtivas} icone="check" para="/empresa/vagas?status=Aberta" />
                <Numero rotulo="Candidaturas recebidas" valor={t.candidaturas} icone="candidaturas" para="/empresa/candidaturas" />
                <Numero rotulo="Em análise" valor={t.emAnalise} icone="relogio" para="/empresa/candidaturas?status=Em%20an%C3%A1lise" />
                <Numero rotulo="Em entrevista" valor={t.emEntrevista} icone="mensagem" para="/empresa/candidaturas?status=Em%20entrevista" />
                <Numero rotulo="Aprovadas" valor={t.aprovadas} icone="estrela" para="/empresa/candidaturas?status=Aprovada" />
              </div>

              <p className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-tinta-2">
                <span>
                  <strong className="text-tinta">{t.recebidas}</strong> aguardando análise
                </span>
                <span>
                  <strong className="text-tinta">{t.interessadas}</strong> {t.interessadas === 1 ? 'vez salva' : 'vezes salvas'} por candidatas
                </span>
                <span>
                  <strong className="text-tinta">{t.convites}</strong> {t.convites === 1 ? 'convite enviado' : 'convites enviados'}
                </span>
                <span>
                  <strong className="text-tinta">{t.rascunhos}</strong> {t.rascunhos === 1 ? 'rascunho' : 'rascunhos'}
                </span>
              </p>

              <section aria-labelledby="titulo-desempenho">
                <h2 id="titulo-desempenho" className="mb-3 font-display text-2xl text-tinta">
                  Desempenho das vagas
                </h2>
                {r.dados.vagas.length ? (
                  <ul className="cartao divide-y divide-linha">
                    {r.dados.vagas.map((v) => (
                      <li key={v.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-6">
                        <div className="min-w-0 sm:w-72">
                          <Link to={`/empresa/vagas/${v.id}`} className="block truncate font-semibold text-tinta hover:text-vinho">
                            {v.titulo}
                          </Link>
                          <p className="flex items-center gap-2 text-xs text-suave">
                            <Selo variante={VISUAL_VAGA[v.status]?.variante}>{VISUAL_VAGA[v.status]?.rotulo ?? v.status}</Selo>
                            {v.dataPublicacao && `desde ${dataCurta(v.dataPublicacao)}`}
                          </p>
                        </div>
                        <div className="flex flex-1 items-center gap-3" aria-label={`${v.candidaturas} candidaturas`}>
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-papel-2">
                            <span className="block h-full rounded-full bg-vinho" style={{ width: `${(v.candidaturas / maior) * 100}%` }} />
                          </span>
                          <span className="w-28 shrink-0 text-sm text-tinta-2 tabular-nums">
                            {v.candidaturas} {v.candidaturas === 1 ? 'candidatura' : 'candidaturas'}
                          </span>
                        </div>
                        <p className="shrink-0 text-xs text-suave sm:w-40">
                          {v.aprovadas} {v.aprovadas === 1 ? 'aprovada' : 'aprovadas'} · {v.interessadas} {v.interessadas === 1 ? 'salva' : 'salvas'}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="cartao p-6 text-sm text-suave">Publique uma vaga para acompanhar o desempenho aqui.</p>
                )}
              </section>
            </div>
          )
        })()}
    </>
  )
}

export default Dashboard
