import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import CampoSenha from '../../components/CampoSenha'
import Icone from '../../components/Icone'
import { Paginacao } from '../../components/admin/Comuns'
import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import Botao from '../../components/ui/Botao'
import { Aviso, Campo, Entrada, Selecao } from '../../components/ui/Campo'
import Selo from '../../components/ui/Selo'
import { useSessao } from '../../hooks/useSessao'
import { alterarAdmin, alterarSenhaAdmin, criarAdmin, dataHora, dinheiro, lerPagamentosAdmin, lerRegistro, listarAdmins } from '../../services/admin'

const COR_ASSINATURA = { ativa: 'sucesso', pendente: 'alerta', pausada: 'alerta', cancelada: 'neutro', falhou: 'erro' }
const COR_PAGAMENTO = { approved: ['sucesso', 'Aprovado'], pending: ['alerta', 'Pendente'], in_process: ['alerta', 'Em análise'], rejected: ['erro', 'Recusado'], refunded: ['neutro', 'Devolvido'], cancelled: ['neutro', 'Cancelado'] }
const tipoConta = (t) => (t === 'empresa' ? 'Empresa' : 'Candidata')

function Tabela({ titulo, colunas, linhas, vazio }) {
  return (
    <section className="rounded-xl border border-linha bg-branco">
      <h2 className="px-5 pt-5 font-display text-xl text-tinta">{titulo}</h2>
      {linhas.length === 0 ? (
        <p className="px-5 pt-2 pb-5 text-sm text-suave">{vazio}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-y border-linha bg-papel text-xs tracking-wide text-suave uppercase">
              <tr>
                {colunas.map((c) => (
                  <th key={c} scope="col" className="px-5 py-2.5 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-linha">{linhas}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ------------------------------------------------------------ Pagamentos

export function PagamentosAdmin() {
  const r = useCarregar(lerPagamentosAdmin)
  return (
    <>
      <TituloPagina titulo="Pagamentos" descricao="Assinaturas Premium e pagamentos confirmados pelo Mercado Pago. Só leitura: cobranças e devoluções são feitas no painel do Mercado Pago." />
      {r.tipo === 'carregando' && <Carregando quantidade={2} altura="h-40" />}
      {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {r.tipo === 'pronto' && (
        <div className="flex flex-col gap-6">
          <Tabela
            titulo="Assinaturas"
            vazio="Nenhuma assinatura ainda."
            colunas={['Conta', 'Plano', 'Situação', 'Desde', 'Próxima cobrança']}
            linhas={r.dados.assinaturas.map((a) => (
              <tr key={a.id}>
                <td className="px-5 py-3">
                  <span className="font-semibold text-tinta">{a.conta.nome}</span> <span className="text-xs text-suave">· {tipoConta(a.conta.tipo)}</span>
                </td>
                <td className="px-5 py-3">{a.plano}</td>
                <td className="px-5 py-3">
                  <Selo variante={COR_ASSINATURA[a.status] ?? 'neutro'}>{a.status}</Selo>
                </td>
                <td className="px-5 py-3 tabular-nums">{dataHora(a.criadaEm)}</td>
                <td className="px-5 py-3 tabular-nums">{a.proximoPagamento ? dataHora(a.proximoPagamento) : '—'}</td>
              </tr>
            ))}
          />
          <Tabela
            titulo="Pagamentos"
            vazio="Nenhum pagamento registrado."
            colunas={['Conta', 'Plano', 'Valor', 'Situação', 'Pago em']}
            linhas={r.dados.pagamentos.map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-3">
                  <span className="font-semibold text-tinta">{p.conta.nome}</span> <span className="text-xs text-suave">· {tipoConta(p.conta.tipo)}</span>
                </td>
                <td className="px-5 py-3">{p.plano}</td>
                <td className="px-5 py-3 text-right tabular-nums">{dinheiro(p.valor)}</td>
                <td className="px-5 py-3">
                  <Selo variante={COR_PAGAMENTO[p.status]?.[0] ?? 'neutro'}>{COR_PAGAMENTO[p.status]?.[1] ?? p.status}</Selo>
                </td>
                <td className="px-5 py-3 tabular-nums">{p.pagoEm ? dataHora(p.pagoEm) : '—'}</td>
              </tr>
            ))}
          />
        </div>
      )}
    </>
  )
}

// ------------------------------------------------------------ Registro

export function RegistroAdmin() {
  const [p, setP] = useSearchParams()
  const busca = p.get('busca') ?? ''
  const pagina = Number(p.get('pagina')) || 1
  const [termo, setTermo] = useState(busca)
  const r = useCarregar(() => lerRegistro({ busca, pagina }), [busca, pagina])

  return (
    <>
      <TituloPagina titulo="Registro de ações" descricao="Tudo o que a equipe fez no painel: quem, o quê, quando e por quê." />
      <form
        role="search"
        className="relative mb-4"
        onSubmit={(e) => {
          e.preventDefault()
          setP(termo.trim() ? { busca: termo.trim() } : {}, { replace: true })
        }}
      >
        <Icone nome="busca" tamanho={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-suave" />
        <Entrada type="search" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar na ação ou nos detalhes" aria-label="Buscar no registro" className="pl-10" />
      </form>
      {r.tipo === 'carregando' && <Carregando quantidade={4} altura="h-14" />}
      {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {r.tipo === 'pronto' &&
        (r.dados.registros.length === 0 ? (
          <p className="rounded-xl border border-dashed border-linha-forte bg-branco px-5 py-6 text-sm text-suave">Nenhuma ação registrada.</p>
        ) : (
          <>
            <ol className="divide-y divide-linha rounded-xl border border-linha bg-branco">
              {r.dados.registros.map((l) => (
                <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm sm:px-5">
                  <span className="min-w-0">
                    <span className="font-semibold text-tinta">{l.admin}</span> <span className="text-tinta-2">{l.acao.toLowerCase()}</span>
                    {l.tabela && (
                      <span className="text-xs text-suave">
                        {' '}
                        · {l.tabela} #{l.registroId}
                      </span>
                    )}
                    {l.detalhes && <span className="block text-xs break-words text-suave">{l.detalhes}</span>}
                  </span>
                  <time className="text-xs text-suave tabular-nums" dateTime={l.em}>
                    {dataHora(l.em)}
                  </time>
                </li>
              ))}
            </ol>
            <Paginacao
              pagina={pagina}
              total={r.dados.total}
              porPagina={r.dados.porPagina}
              aoMudar={(n) => {
                const q = new URLSearchParams(p)
                q.set('pagina', String(n))
                setP(q, { replace: true })
              }}
            />
          </>
        ))}
    </>
  )
}

// ------------------------------------------------------------ Administradores (só "super")

const VAZIO = { nome: '', usuario: '', email: '', senha: '', nivel: 'moderador' }

function NovoAdmin({ aoCriar }) {
  const [dados, setDados] = useState(VAZIO)
  const [estado, setEstado] = useState({ tipo: 'ocioso' })
  const campo = (c) => (e) => setDados((d) => ({ ...d, [c]: e.target.value }))

  async function enviar(e) {
    e.preventDefault()
    setEstado({ tipo: 'enviando' })
    try {
      await criarAdmin({ ...dados, usuario: dados.usuario.trim().toLowerCase(), email: dados.email.trim() })
      setDados(VAZIO)
      setEstado({ tipo: 'sucesso', texto: 'Administrador criado. Passe o usuário e a senha inicial por um canal seguro e peça para trocar a senha no primeiro acesso.' })
      aoCriar()
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="rounded-xl border border-linha bg-branco p-6">
      <h2 className="font-display text-xl text-tinta">Novo administrador</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome">{(p) => <Entrada {...p} maxLength={100} value={dados.nome} onChange={campo('nome')} />}</Campo>
        <Campo rotulo="Usuário" ajuda="Letras minúsculas, números, ponto, hífen ou sublinhado.">
          {(p) => <Entrada {...p} maxLength={40} autoCapitalize="none" spellCheck={false} value={dados.usuario} onChange={campo('usuario')} />}
        </Campo>
        <Campo rotulo="E-mail">{(p) => <Entrada {...p} type="email" maxLength={150} value={dados.email} onChange={campo('email')} />}</Campo>
        <Campo rotulo="Nível de acesso">
          {(p) => (
            <Selecao {...p} value={dados.nivel} onChange={campo('nivel')}>
              <option value="moderador">Moderação (contas e conteúdo)</option>
              <option value="super">Acesso total (inclui excluir contas e gerenciar a equipe)</option>
            </Selecao>
          )}
        </Campo>
        <div className="sm:col-span-2">
          <CampoSenha rotulo="Senha inicial" valor={dados.senha} aoMudar={(v) => setDados((d) => ({ ...d, senha: v }))} placeholder="Mínimo de 10 caracteres" autoComplete="new-password" />
        </div>
      </div>
      {(estado.tipo === 'erro' || estado.tipo === 'sucesso') && (
        <Aviso tipo={estado.tipo} className="mt-4">
          {estado.texto}
        </Aviso>
      )}
      <Botao type="submit" className="mt-4" disabled={estado.tipo === 'enviando'}>
        {estado.tipo === 'enviando' ? 'Criando…' : 'Criar administrador'}
      </Botao>
    </form>
  )
}

export function Administradores() {
  const sessao = useSessao()
  const r = useCarregar(listarAdmins)
  const [erro, setErro] = useState('')

  async function mudar(a, corpo) {
    setErro('')
    try {
      await alterarAdmin(a.id, corpo)
      r.recarregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <>
      <TituloPagina titulo="Administradores" descricao="Quem tem acesso ao painel. Só quem tem acesso total vê esta página." />
      <div className="flex flex-col gap-6">
        {r.tipo === 'carregando' && <Carregando quantidade={2} altura="h-16" />}
        {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
        {r.tipo === 'pronto' && (
          <ul className="divide-y divide-linha rounded-xl border border-linha bg-branco">
            {r.dados.admins.map((a) => {
              const eu = a.id === sessao?.usuario?.id
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-tinta">
                      {a.nome} {eu && <span className="text-xs font-normal text-suave">(você)</span>}
                    </span>
                    <span className="block truncate text-sm text-suave">
                      {a.usuario} · {a.email} · último acesso: {a.ultimoAcesso ? dataHora(a.ultimoAcesso) : 'nunca'}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <Selo variante={a.nivel === 'super' ? 'vinho' : 'neutro'}>{a.nivel === 'super' ? 'Acesso total' : 'Moderação'}</Selo>
                    {!a.ativo && <Selo variante="erro">Desativado</Selo>}
                    {!eu && (
                      <>
                        <Botao tamanho="sm" variante="fantasma" onClick={() => mudar(a, { nivel: a.nivel === 'super' ? 'moderador' : 'super' })}>
                          {a.nivel === 'super' ? 'Tornar moderação' : 'Dar acesso total'}
                        </Botao>
                        <Botao tamanho="sm" variante="secundario" className={a.ativo ? 'text-erro' : undefined} onClick={() => mudar(a, { ativo: !a.ativo })}>
                          {a.ativo ? 'Desativar' : 'Reativar'}
                        </Botao>
                      </>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <NovoAdmin aoCriar={r.recarregar} />
      </div>
    </>
  )
}

// ------------------------------------------------------------ Minha conta

export function ContaAdmin() {
  const sessao = useSessao()
  const u = sessao?.usuario
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [estado, setEstado] = useState({ tipo: 'ocioso' })

  async function enviar(e) {
    e.preventDefault()
    if (novaSenha.length < 10) return setEstado({ tipo: 'erro', texto: 'A nova senha precisa ter pelo menos 10 caracteres.' })
    if (novaSenha !== confirmarSenha) return setEstado({ tipo: 'erro', texto: 'As senhas novas não são iguais.' })
    setEstado({ tipo: 'enviando' })
    try {
      const r = await alterarSenhaAdmin({ senhaAtual, novaSenha, confirmarSenha })
      setEstado({ tipo: 'sucesso', texto: r.mensagem })
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <>
      <TituloPagina titulo="Minha conta" descricao={`${u?.nome ?? ''} · ${u?.nivel === 'super' ? 'acesso total' : 'moderação'}`} />
      <form onSubmit={enviar} noValidate className="flex max-w-md flex-col gap-4 rounded-xl border border-linha bg-branco p-6">
        <h2 className="font-display text-xl text-tinta">Trocar senha</h2>
        <CampoSenha rotulo="Senha atual" valor={senhaAtual} aoMudar={setSenhaAtual} autoComplete="current-password" />
        <CampoSenha rotulo="Nova senha" valor={novaSenha} aoMudar={setNovaSenha} placeholder="Mínimo de 10 caracteres" autoComplete="new-password" />
        <CampoSenha rotulo="Confirme a nova senha" valor={confirmarSenha} aoMudar={setConfirmarSenha} autoComplete="new-password" />
        {(estado.tipo === 'erro' || estado.tipo === 'sucesso') && <Aviso tipo={estado.tipo}>{estado.texto}</Aviso>}
        <Botao type="submit" variante="secundario" className="self-start" disabled={estado.tipo === 'enviando'}>
          {estado.tipo === 'enviando' ? 'Salvando…' : 'Trocar senha'}
        </Botao>
      </form>
    </>
  )
}
