import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import SeloPremium from '../../components/conta/SeloPremium'
import Avatar from '../../components/comunidade/Avatar'
import { AcaoComMotivo, BotaoRelatorio, Filtros, Paginacao } from '../../components/admin/Comuns'
import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import Botao from '../../components/ui/Botao'
import { Aviso, Entrada } from '../../components/ui/Campo'
import Selo from '../../components/ui/Selo'
import {
  dataHora,
  definirRepresentante,
  ehSuper,
  enviarRedefinicaoSenha,
  excluirContaAdmin,
  lerCandidataAdmin,
  lerEmpresaAdmin,
  listarCandidatasAdmin,
  listarEmpresasAdmin,
  reativarConta,
  suspenderConta,
} from '../../services/admin'

const SITUACOES = [
  ['', 'Todas'],
  ['ativas', 'Ativas'],
  ['suspensas', 'Suspensas'],
]
const CPF = { verificado: ['sucesso', 'CPF verificado'], pendente: ['alerta', 'CPF pendente'], nao_verificado: ['neutro', 'CPF não verificado'] }

function useFiltros() {
  const [p, setP] = useSearchParams()
  const filtros = { busca: p.get('busca') ?? '', situacao: p.get('situacao') ?? '', representante: p.get('representante') ?? '', pagina: Number(p.get('pagina')) || 1 }
  function definir(chave, valor) {
    const n = new URLSearchParams(p)
    if (valor) n.set(chave, valor)
    else n.delete(chave)
    if (chave !== 'pagina') n.delete('pagina')
    setP(n, { replace: true })
  }
  return [filtros, definir]
}

function CampoBusca({ valor, aoMudar, placeholder }) {
  const [termo, setTermo] = useState(valor)
  return (
    <form
      role="search"
      className="relative min-w-0 flex-1"
      onSubmit={(e) => {
        e.preventDefault()
        aoMudar(termo.trim())
      }}
    >
      <Icone nome="busca" tamanho={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-suave" />
      <Entrada type="search" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="pl-10" />
    </form>
  )
}

function Tabela({ colunas, resumo, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-linha bg-branco">
      <div className="flex items-center justify-between gap-3 border-b border-linha bg-papel px-5 py-3 text-sm">
        <span className="font-semibold text-tinta">{resumo}</span>
      </div>
      <div role="table" className="text-sm">
        <div role="row" className="hidden border-b border-linha px-5 py-2.5 text-xs font-bold tracking-wide text-suave uppercase lg:grid lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.6fr)_20px] lg:gap-4">
          {colunas.map((c) => (
            <span key={c} role="columnheader">
              {c}
            </span>
          ))}
          <span aria-hidden="true" />
        </div>
        <ul className="divide-y divide-linha">{children}</ul>
      </div>
    </div>
  )
}

const linhaTabela = 'grid grid-cols-1 items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-papel lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.6fr)_20px]'

function SeloSituacao({ suspensaEm }) {
  return suspensaEm ? <Selo variante="erro">Suspensa</Selo> : <Selo variante="sucesso">Ativa</Selo>
}

export function Candidatas() {
  const [f, definir] = useFiltros()
  const r = useCarregar(() => listarCandidatasAdmin({ busca: f.busca, situacao: f.situacao, pagina: f.pagina }), [f.busca, f.situacao, f.pagina])

  return (
    <>
      <TituloPagina titulo="Candidatas" descricao="Contas de candidatas. O CPF aparece mascarado." acoes={ehSuper() && <BotaoRelatorio recurso="candidatas" />} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <CampoBusca key={f.busca} valor={f.busca} aoMudar={(v) => definir('busca', v)} placeholder="Buscar por nome ou e-mail" />
        <Filtros opcoes={SITUACOES} valor={f.situacao} aoMudar={(v) => definir('situacao', v)} rotulo="Situação da conta" />
      </div>
      {r.tipo === 'carregando' && <Carregando quantidade={4} altura="h-16" />}
      {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {r.tipo === 'pronto' && (
        <>
          {r.dados.candidatas.length === 0 ? (
            <p className="rounded-xl border border-dashed border-linha-forte bg-branco px-5 py-6 text-sm text-suave">Nenhuma candidata encontrada.</p>
          ) : (
            <Tabela colunas={['Candidata', 'Atividade', 'Situação']} resumo={`${r.dados.total} ${r.dados.total === 1 ? 'candidata' : 'candidatas'}`}>
              {r.dados.candidatas.map((c) => (
                <li key={c.id} role="row">
                  <Link to={`/admin/candidatas/${c.id}`} className={linhaTabela}>
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar nome={c.nome} tamanho="sm" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 font-semibold text-tinta">
                          <span className="truncate">{c.nome}</span>
                          {c.premium && <SeloPremium compacto />}
                        </span>
                        <span className="block truncate text-xs text-suave">
                          {c.email} · {c.cpf}
                        </span>
                      </span>
                    </span>
                    <span className="flex gap-4 text-xs text-tinta-2 tabular-nums lg:flex-col lg:gap-0.5">
                      <span>
                        <strong className="text-tinta">{c.candidaturas}</strong> candidatura{c.candidaturas === 1 ? '' : 's'}
                      </span>
                      <span>
                        <strong className="text-tinta">{c.publicacoes}</strong> publicaç{c.publicacoes === 1 ? 'ão' : 'ões'}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      <Selo variante={CPF[c.cpfStatus]?.[0] ?? 'neutro'}>{CPF[c.cpfStatus]?.[1] ?? c.cpfStatus}</Selo>
                      <SeloSituacao suspensaEm={c.suspensaEm} />
                    </span>
                    <Icone nome="seta" tamanho={16} className="hidden text-suave lg:block" />
                  </Link>
                </li>
              ))}
            </Tabela>
          )}
          <Paginacao pagina={f.pagina} total={r.dados.total} porPagina={r.dados.porPagina} aoMudar={(p) => definir('pagina', String(p))} />
        </>
      )}
    </>
  )
}

function AcoesConta({ tipo, conta, aoMudar, voltar }) {
  const navigate = useNavigate()
  const [aviso, setAviso] = useState(null)
  const [confirmacao, setConfirmacao] = useState('')
  const [reativando, setReativando] = useState(false)
  const [enviandoLink, setEnviandoLink] = useState(false)

  async function enviarLink() {
    setEnviandoLink(true)
    setAviso(null)
    try {
      const r = await enviarRedefinicaoSenha(tipo, conta.id)
      setAviso({ tipo: r.enviado ? 'sucesso' : 'info', texto: r.mensagem })
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e.message })
    } finally {
      setEnviandoLink(false)
    }
  }

  async function reativar() {
    setReativando(true)
    setAviso(null)
    try {
      await reativarConta(tipo, conta.id)
      setAviso({ tipo: 'sucesso', texto: 'Conta reativada. A pessoa foi avisada.' })
      aoMudar()
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e.message })
    } finally {
      setReativando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-acoes-conta" className="rounded-xl border border-linha bg-branco p-6">
      <h2 id="titulo-acoes-conta" className="font-display text-xl text-tinta">
        Ações na conta
      </h2>
      {conta.suspensaEm && (
        <Aviso tipo="erro" className="mt-3">
          Suspensa em {dataHora(conta.suspensaEm)}. Motivo: {conta.motivoSuspensao}
        </Aviso>
      )}
      <div className="mt-4 flex flex-col items-start gap-3">
        {conta.suspensaEm ? (
          <Botao tamanho="sm" variante="secundario" onClick={reativar} disabled={reativando}>
            {reativando ? 'Reativando…' : 'Reativar conta'}
          </Botao>
        ) : (
          <AcaoComMotivo
            rotulo="Suspender conta"
            rotuloConfirmar="Suspender"
            ajuda={tipo === 'empresas' ? 'A empresa perde o acesso na hora e as vagas abertas são pausadas. O motivo fica no registro.' : 'A pessoa perde o acesso na hora e o perfil some das buscas. O motivo fica no registro.'}
            aoConfirmar={(motivo) => suspenderConta(tipo, conta.id, motivo)}
            aoConcluir={(r) => {
              setAviso({ tipo: 'sucesso', texto: r?.vagasPausadas ? `Conta suspensa. ${r.vagasPausadas} vaga(s) pausada(s).` : 'Conta suspensa.' })
              aoMudar()
            }}
          />
        )}
        <Botao tamanho="sm" variante="secundario" onClick={enviarLink} disabled={enviandoLink}>
          {enviandoLink ? 'Enviando…' : 'Enviar link para criar nova senha'}
        </Botao>
        {ehSuper() && (
          <AcaoComMotivo
            rotulo="Excluir conta"
            rotuloConfirmar="Excluir definitivamente"
            ajuda="Apaga a conta e todos os dados dela. Não dá para desfazer. O motivo fica no registro."
            extra={
              <label className="flex flex-col gap-1 text-sm text-tinta-2">
                Digite EXCLUIR para confirmar
                <Entrada value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="off" />
              </label>
            }
            aoConfirmar={(motivo) => {
              if (confirmacao !== 'EXCLUIR') return Promise.reject(new Error('Digite EXCLUIR para confirmar.'))
              return excluirContaAdmin(tipo, conta.id, motivo)
            }}
            aoConcluir={() => navigate(voltar, { replace: true })}
          />
        )}
      </div>
      {aviso && (
        <Aviso tipo={aviso.tipo} className="mt-4">
          {aviso.texto}
        </Aviso>
      )}
    </section>
  )
}

export function DetalheCandidata() {
  const { id } = useParams()
  const r = useCarregar(() => lerCandidataAdmin(id), [id])
  const voltar = { para: '/admin/candidatas', rotulo: 'Candidatas' }
  if (r.tipo === 'carregando') return <Carregando quantidade={2} altura="h-40" />
  if (r.tipo === 'erro') {
    return (
      <>
        <TituloPagina titulo="Candidata" voltar={voltar} />
        <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />
      </>
    )
  }
  const { candidata: c, candidaturas, publicacoes } = r.dados
  return (
    <>
      <TituloPagina titulo={c.nome} descricao={c.email} voltar={voltar} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-linha bg-branco p-6">
            <h2 className="font-display text-xl text-tinta">Dados da conta</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-suave">CPF</dt>
                <dd className="font-semibold text-tinta">
                  {c.cpf} · {CPF[c.cpfStatus]?.[1] ?? c.cpfStatus}
                </dd>
              </div>
              <div>
                <dt className="text-suave">Telefone</dt>
                <dd className="font-semibold text-tinta">{c.telefone || 'Não informado'}</dd>
              </div>
              <div>
                <dt className="text-suave">Situação</dt>
                <dd>
                  <SeloSituacao suspensaEm={c.suspensaEm} />
                </dd>
              </div>
              <div>
                <dt className="text-suave">Premium</dt>
                <dd className="font-semibold text-tinta">{c.assinatura ? `Assinatura ${c.assinatura.status}` : 'Sem assinatura'}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-xl border border-linha bg-branco p-6">
            <h2 className="font-display text-xl text-tinta">Candidaturas</h2>
            {candidaturas.length === 0 ? (
              <p className="mt-3 text-sm text-suave">Nenhuma candidatura.</p>
            ) : (
              <ul className="mt-3 divide-y divide-linha text-sm">
                {candidaturas.map((k) => (
                  <li key={k.id} className="flex justify-between gap-3 py-2">
                    <span className="min-w-0 truncate text-tinta">{k.vaga}</span>
                    <Selo>{k.status}</Selo>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-xl border border-linha bg-branco p-6">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-display text-xl text-tinta">Publicações recentes</h2>
              <Link to="/admin/publicacoes" className="text-sm font-semibold text-vinho hover:underline">
                Moderar publicações
              </Link>
            </div>
            {publicacoes.length === 0 ? (
              <p className="mt-3 text-sm text-suave">Nenhuma publicação.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {publicacoes.map((p) => (
                  <li key={p.id} className="rounded-lg bg-papel px-4 py-3 text-sm">
                    <p className="line-clamp-3 whitespace-pre-line text-tinta-2">{p.texto || '(só imagem)'}</p>
                    <p className="mt-1 text-xs text-suave">{dataHora(p.criadaEm)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <AcoesConta tipo="candidatas" conta={c} aoMudar={r.recarregar} voltar="/admin/candidatas" />
      </div>
    </>
  )
}

export function Empresas() {
  const [f, definir] = useFiltros()
  const r = useCarregar(() => listarEmpresasAdmin({ busca: f.busca, situacao: f.situacao, representante: f.representante, pagina: f.pagina }), [f.busca, f.situacao, f.representante, f.pagina])

  return (
    <>
      <TituloPagina titulo="Empresas" descricao="Contas de empresas, com os dados da Receita e a confirmação do representante." acoes={ehSuper() && <BotaoRelatorio recurso="empresas" />} />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <CampoBusca key={f.busca} valor={f.busca} aoMudar={(v) => definir('busca', v)} placeholder="Buscar por nome, e-mail ou CNPJ" />
        <Filtros opcoes={SITUACOES} valor={f.situacao} aoMudar={(v) => definir('situacao', v)} rotulo="Situação da conta" />
        <Filtros opcoes={[['pendente', 'Representante pendente']]} valor={f.representante} aoMudar={(v) => definir('representante', f.representante === v ? '' : v)} rotulo="Representante" />
      </div>
      {r.tipo === 'carregando' && <Carregando quantidade={4} altura="h-16" />}
      {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {r.tipo === 'pronto' && (
        <>
          {r.dados.empresas.length === 0 ? (
            <p className="rounded-xl border border-dashed border-linha-forte bg-branco px-5 py-6 text-sm text-suave">Nenhuma empresa encontrada.</p>
          ) : (
            <Tabela colunas={['Empresa', 'Vagas e Receita', 'Situação']} resumo={`${r.dados.total} ${r.dados.total === 1 ? 'empresa' : 'empresas'}`}>
              {r.dados.empresas.map((e) => (
                <li key={e.id} role="row">
                  <Link to={`/admin/empresas/${e.id}`} className={linhaTabela}>
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar nome={e.nome} tamanho="sm" className="rounded-lg" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 font-semibold text-tinta">
                          <span className="truncate">{e.nome}</span>
                          {e.premium && <SeloPremium compacto />}
                        </span>
                        <span className="block truncate text-xs text-suave">
                          {e.cnpj} · {e.email}
                        </span>
                      </span>
                    </span>
                    <span className="flex gap-4 text-xs text-tinta-2 tabular-nums lg:flex-col lg:gap-0.5">
                      <span>
                        <strong className="text-tinta">{e.vagas}</strong> vaga{e.vagas === 1 ? '' : 's'}
                      </span>
                      {e.situacaoCadastral && <span>Receita: {e.situacaoCadastral}</span>}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {e.representante === 'verificado' ? <Selo variante="sucesso">Representante confirmado</Selo> : <Selo variante="alerta">Representante pendente</Selo>}
                      <SeloSituacao suspensaEm={e.suspensaEm} />
                    </span>
                    <Icone nome="seta" tamanho={16} className="hidden text-suave lg:block" />
                  </Link>
                </li>
              ))}
            </Tabela>
          )}
          <Paginacao pagina={f.pagina} total={r.dados.total} porPagina={r.dados.porPagina} aoMudar={(p) => definir('pagina', String(p))} />
        </>
      )}
    </>
  )
}

function Representante({ empresaId, cadastro, aoMudar }) {
  const [estado, setEstado] = useState(null)
  async function definir(status) {
    setEstado({ tipo: 'enviando' })
    try {
      await definirRepresentante(empresaId, status)
      setEstado(status === 'verificado' ? { tipo: 'sucesso', texto: 'Representante confirmado. A empresa foi avisada.' } : null)
      aoMudar()
    } catch (e) {
      setEstado({ tipo: 'erro', texto: e.message })
    }
  }
  return (
    <section className="rounded-xl border border-linha bg-branco p-6">
      <h2 className="font-display text-xl text-tinta">Representante</h2>
      <p className="mt-2 text-sm text-tinta-2">
        <span className="font-semibold text-tinta">{cadastro.responsavelNome}</span>
        {cadastro.responsavelCargo && ` · ${cadastro.responsavelCargo}`} declarou representar a empresa em {dataHora(cadastro.declarouEm)}.
      </p>
      <p className="mt-2 text-xs text-suave">A consulta do CNPJ confirma a empresa, não a pessoa. Confirme o vínculo por um canal oficial (e-mail do domínio da empresa, contrato social) antes de marcar.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {cadastro.representante === 'verificado' ? (
          <>
            <Selo variante="sucesso">Confirmado</Selo>
            <Botao tamanho="sm" variante="fantasma" disabled={estado?.tipo === 'enviando'} onClick={() => definir('pendente')}>
              Voltar para pendente
            </Botao>
          </>
        ) : (
          <Botao tamanho="sm" disabled={estado?.tipo === 'enviando'} onClick={() => definir('verificado')}>
            Confirmar representante
          </Botao>
        )}
      </div>
      {estado?.texto && (
        <Aviso tipo={estado.tipo} className="mt-3">
          {estado.texto}
        </Aviso>
      )}
    </section>
  )
}

export function DetalheEmpresa() {
  const { id } = useParams()
  const r = useCarregar(() => lerEmpresaAdmin(id), [id])
  const voltar = { para: '/admin/empresas', rotulo: 'Empresas' }
  if (r.tipo === 'carregando') return <Carregando quantidade={2} altura="h-40" />
  if (r.tipo === 'erro') {
    return (
      <>
        <TituloPagina titulo="Empresa" voltar={voltar} />
        <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />
      </>
    )
  }
  const { empresa: e, cadastro, perfil, vagas } = r.dados
  return (
    <>
      <TituloPagina titulo={e.nome} descricao={`${e.cnpj} · ${e.email}`} voltar={voltar} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-linha bg-branco p-6">
            <h2 className="font-display text-xl text-tinta">Dados da Receita</h2>
            {cadastro ? (
              <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {[
                  ['Razão social', cadastro.razaoSocial],
                  ['Nome fantasia', cadastro.nomeFantasia || 'Não informado'],
                  ['Situação cadastral', cadastro.situacaoCadastral],
                  ['CNAE principal', cadastro.cnae || 'Não informado'],
                  ['Município', cadastro.municipio || 'Não informado'],
                  ['Consultado em', dataHora(cadastro.consultadoEm)],
                ].map(([rotulo, valor]) => (
                  <div key={rotulo}>
                    <dt className="text-suave">{rotulo}</dt>
                    <dd className="font-semibold text-tinta">{valor}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-suave">Esta conta não tem dados da Receita registrados.</p>
            )}
            {perfil?.site && (
              <a href={perfil.site} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
                {perfil.site} <Icone nome="externo" tamanho={13} />
              </a>
            )}
          </section>
          <section className="rounded-xl border border-linha bg-branco p-6">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-display text-xl text-tinta">Vagas</h2>
              <Link to="/admin/vagas" className="text-sm font-semibold text-vinho hover:underline">
                Moderar vagas
              </Link>
            </div>
            {vagas.length === 0 ? (
              <p className="mt-3 text-sm text-suave">Nenhuma vaga.</p>
            ) : (
              <ul className="mt-3 divide-y divide-linha text-sm">
                {vagas.map((v) => (
                  <li key={v.id} className="flex justify-between gap-3 py-2">
                    <span className="min-w-0 truncate text-tinta">{v.titulo}</span>
                    <Selo>{v.status}</Selo>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <div className="flex flex-col gap-6">
          {cadastro && <Representante empresaId={e.id} cadastro={cadastro} aoMudar={r.recarregar} />}
          <AcoesConta tipo="empresas" conta={e} aoMudar={r.recarregar} voltar="/admin/empresas" />
        </div>
      </div>
    </>
  )
}
