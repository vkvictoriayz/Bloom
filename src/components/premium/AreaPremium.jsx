import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import Icone from '../Icone'
import TituloPagina from '../candidata/TituloPagina'
import Botao from '../ui/Botao'
import { AreaTexto, Aviso, Campo, Entrada } from '../ui/Campo'
import Esqueleto from '../ui/Esqueleto'
import Selo from '../ui/Selo'
import {
  assinarPlano,
  cancelarAssinatura,
  cancelarCampanha,
  criarCampanha,
  dataHora,
  lerPremium,
  reais,
  sincronizarAssinatura,
  sincronizarCampanha,
} from '../../services/premium'
import { cn } from '../../lib/cn'

const STATUS_ASSINATURA = {
  pendente: { variante: 'alerta', rotulo: 'Aguardando pagamento' },
  ativa: { variante: 'sucesso', rotulo: 'Ativa' },
  pausada: { variante: 'alerta', rotulo: 'Pausada' },
  cancelada: { variante: 'neutro', rotulo: 'Cancelada' },
  falhou: { variante: 'erro', rotulo: 'Não iniciada' },
}
const STATUS_PAGAMENTO = { approved: 'Aprovado', pending: 'Pendente', in_process: 'Em análise', rejected: 'Recusado', refunded: 'Estornado', cancelled: 'Cancelado' }
const STATUS_CAMPANHA = {
  aguardando_pagamento: { variante: 'alerta', rotulo: 'Aguardando pagamento' },
  paga: { variante: 'sucesso', rotulo: 'Paga' },
  cancelada: { variante: 'neutro', rotulo: 'Cancelada' },
}

// O que toda conta tem, de graça (funcionalidades que já existem na Bloom).
const GRATUITO = {
  usuaria: ['Perfil profissional, projetos, foto e capa', 'Busca de vagas e candidaturas ilimitadas', 'Mensagens com empresas e notificações', 'Comunidade, comunidades temáticas e publicações'],
  empresa: ['Perfil da empresa, foto e capa', 'Publicação e gestão de vagas', 'Candidaturas, convites e mensagens', 'Painel de recrutamento e banco de talentos'],
}

// Cartão de plano no visual da tabela de preços da Bloom.
function CartaoPlano({ plano, icone, escuro, acao }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-linha bg-branco">
      <header className={cn('relative isolate flex items-center gap-4 overflow-hidden p-6 text-white sm:p-7', escuro ? 'bg-vinho-escuro' : 'bg-rosa')}>
        <span aria-hidden="true" className={cn('absolute -top-16 -right-16 -z-10 size-48 rounded-full', escuro ? 'bg-vinho' : 'bg-white/15')} />
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-blush text-vinho-escuro" aria-hidden="true">
          <Icone nome={icone} tamanho={28} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-2xl leading-tight">{plano.nome}</h2>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight">{reais(plano.preco)}</span>
            <span className="text-sm text-white/80">{plano.rotuloPreco}</span>
          </p>
        </div>
      </header>
      <ul className="flex flex-1 flex-col gap-3 p-6 sm:p-7">
        {plano.beneficios.map((b) => (
          <li key={b} className="flex items-center gap-3 text-tinta-2">
            <span className={cn('grid size-7 shrink-0 place-items-center rounded-full text-white', escuro ? 'bg-vinho-escuro' : 'bg-rosa')} aria-hidden="true">
              <Icone nome="check" tamanho={15} />
            </span>
            {b}
          </li>
        ))}
      </ul>
      <div className="px-6 pb-6 sm:px-7 sm:pb-7">{acao}</div>
    </article>
  )
}

function NovaCampanha({ aoCriar, desativado }) {
  const [dados, setDados] = useState({ titulo: '', texto: '', link: '' })
  const [estado, setEstado] = useState({ tipo: 'ocioso' })
  const campo = (nome) => (e) => setDados((d) => ({ ...d, [nome]: e.target.value }))

  async function enviar(e) {
    e.preventDefault()
    if (dados.titulo.trim().length < 3) return setEstado({ tipo: 'erro', texto: 'Dê um título à campanha (ao menos 3 letras).' })
    if (dados.texto.trim().length < 10) return setEstado({ tipo: 'erro', texto: 'Escreva o texto da campanha (ao menos 10 caracteres).' })
    setEstado({ tipo: 'enviando' })
    try {
      const r = await criarCampanha({ titulo: dados.titulo.trim(), texto: dados.texto.trim(), link: dados.link.trim() })
      aoCriar(r.initPoint)
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4 rounded-xl border border-linha bg-branco p-6">
      <h3 className="font-semibold text-tinta">Nova campanha</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Título">{(p) => <Entrada {...p} maxLength={100} value={dados.titulo} onChange={campo('titulo')} />}</Campo>
        <Campo rotulo="Link" opcional>
          {(p) => <Entrada {...p} type="url" maxLength={255} placeholder="https://" value={dados.link} onChange={campo('link')} />}
        </Campo>
      </div>
      <Campo rotulo="Texto" ajuda={`${dados.texto.length}/300 · O que você quer divulgar para o público da Bloom.`}>
        {(p) => <AreaTexto {...p} rows={3} maxLength={300} value={dados.texto} onChange={campo('texto')} />}
      </Campo>
      {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
      <Botao type="submit" className="self-start" disabled={desativado || estado.tipo === 'enviando'}>
        {estado.tipo === 'enviando' ? 'Abrindo pagamento…' : 'Ir para o pagamento'}
      </Botao>
    </form>
  )
}

// Bloom Premium para candidatas e empresas: planos, plano atual, histórico de
// pagamentos e (empresas) campanhas de publicidade.
function AreaPremium({ tipoConta }) {
  const [parametros, setParametros] = useSearchParams()
  const [estado, setEstado] = useState({ tipo: 'carregando' })
  const [acao, setAcao] = useState({ tipo: 'ocioso' })
  const [criandoCampanha, setCriandoCampanha] = useState(false)
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false)
  const retornoTratado = useRef(false)

  // Na volta do Mercado Pago (?retorno=...), confere o status no servidor.
  useEffect(() => {
    let ativo = true
    const retorno = parametros.get('retorno')
    let carregar = lerPremium
    if (retorno && !retornoTratado.current) {
      retornoTratado.current = true
      const campanha = /^campanha-(\d+)$/.exec(retorno)
      carregar = campanha ? () => sincronizarCampanha(campanha[1]) : sincronizarAssinatura
      setParametros({}, { replace: true })
    }
    carregar()
      .then((d) => ativo && setEstado({ tipo: 'pronto', dados: d }))
      .catch((e) => ativo && setEstado({ tipo: 'erro', texto: e.message }))
    return () => {
      ativo = false
    }
  }, [parametros, setParametros])

  async function executar(fn, sucesso) {
    setAcao({ tipo: 'executando' })
    try {
      const r = await fn()
      if (r?.initPoint) {
        window.location.assign(r.initPoint)
        return
      }
      if (r) setEstado({ tipo: 'pronto', dados: r })
      setAcao(sucesso ? { tipo: 'sucesso', texto: sucesso } : { tipo: 'ocioso' })
    } catch (erro) {
      setAcao({ tipo: 'erro', texto: erro.message })
    }
  }

  if (estado.tipo === 'carregando') return <Esqueleto className="h-96 rounded-2xl" />
  if (estado.tipo === 'erro') return <Aviso tipo="erro">Não foi possível carregar o Premium: {estado.texto}</Aviso>

  const d = estado.dados
  const premium = d.planos.find((p) => p.tipo === 'assinatura')
  const publicidade = d.planos.find((p) => p.tipo === 'avulso')
  const assinatura = d.assinatura
  const aberta = assinatura && ['pendente', 'ativa', 'pausada'].includes(assinatura.status)
  const ocupado = acao.tipo === 'executando'
  const semPagamento = !d.pagamentosConfigurados

  return (
    <>
      <TituloPagina titulo="Bloom Premium" descricao={tipoConta === 'empresa' ? 'Mais destaque e alcance para a sua empresa na Bloom.' : 'Mais destaque e visibilidade para você na Bloom.'} />

      {semPagamento && (
        <Aviso tipo="info" className="mb-6">
          Os pagamentos ainda não foram ativados na Bloom. Você pode conhecer os planos; a assinatura fica disponível assim que o Mercado Pago for configurado.
        </Aviso>
      )}
      {acao.tipo === 'erro' && <Aviso tipo="erro" className="mb-6">{acao.texto}</Aviso>}
      {acao.tipo === 'sucesso' && <Aviso tipo="sucesso" className="mb-6">{acao.texto}</Aviso>}

      {/* Plano atual */}
      <section className="mb-8 flex flex-col gap-3 rounded-2xl border border-linha bg-branco p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-suave uppercase">Seu plano</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 font-display text-2xl text-tinta">
            {d.premium ? (
              <>
                <Icone nome="coroa" tamanho={22} className="text-vinho" /> {assinatura.plano.nome}
              </>
            ) : (
              'Gratuito'
            )}
            {assinatura && aberta && <Selo variante={STATUS_ASSINATURA[assinatura.status].variante}>{STATUS_ASSINATURA[assinatura.status].rotulo}</Selo>}
          </p>
          {assinatura && aberta && (
            <p className="mt-1 text-sm text-suave">
              {reais(assinatura.plano.preco)}
              {assinatura.plano.rotuloPreco} · desde {dataHora(assinatura.criadaEm)}
              {assinatura.proximoPagamento && ` · próxima cobrança em ${dataHora(assinatura.proximoPagamento)}`}
            </p>
          )}
          {assinatura?.status === 'pendente' && (
            <p className="mt-1 text-sm text-tinta-2">O plano é ativado quando o Mercado Pago confirmar o pagamento.</p>
          )}
        </div>
        {aberta && (
          <div className="flex flex-wrap gap-2">
            {assinatura.status === 'pendente' && (
              <Botao variante="secundario" disabled={ocupado} onClick={() => executar(sincronizarAssinatura, 'Status conferido com o Mercado Pago.')}>
                Conferir pagamento
              </Botao>
            )}
            {confirmandoCancelamento ? (
              <>
                <Botao className="bg-erro hover:bg-erro/90" disabled={ocupado} onClick={() => executar(cancelarAssinatura, 'Assinatura cancelada.').then(() => setConfirmandoCancelamento(false))}>
                  Confirmar cancelamento
                </Botao>
                <Botao variante="fantasma" onClick={() => setConfirmandoCancelamento(false)}>
                  Voltar
                </Botao>
              </>
            ) : (
              <Botao variante="secundario" onClick={() => setConfirmandoCancelamento(true)}>
                Cancelar assinatura
              </Botao>
            )}
          </div>
        )}
      </section>

      {/* Planos */}
      <div className={cn('grid grid-cols-1 gap-6', publicidade && 'lg:grid-cols-2')}>
        {premium && (
          <CartaoPlano
            plano={premium}
            icone="coroa"
            escuro
            acao={
              <Botao
                tamanho="lg"
                className="w-full rounded-full bg-vinho-escuro hover:bg-vinho"
                disabled={semPagamento || ocupado || Boolean(aberta)}
                onClick={() => executar(() => assinarPlano(tipoConta === 'empresa' ? 'premium_empresa' : 'premium_candidata'))}
              >
                {aberta ? (d.premium ? 'Você é Premium' : 'Assinatura em andamento') : ocupado ? 'Abrindo pagamento…' : 'Assinar Plano Premium'}
              </Botao>
            }
          />
        )}
        {publicidade && (
          <CartaoPlano
            plano={publicidade}
            icone="megafone"
            acao={
              <Botao tamanho="lg" className="w-full rounded-full bg-rosa hover:bg-rosa/90" disabled={semPagamento} onClick={() => setCriandoCampanha((v) => !v)}>
                {criandoCampanha ? 'Fechar' : 'Anunciar'}
              </Botao>
            }
          />
        )}
      </div>

      {criandoCampanha && (
        <div className="mt-6">
          <NovaCampanha desativado={semPagamento} aoCriar={(url) => window.location.assign(url)} />
        </div>
      )}

      {/* Gratuito x Premium */}
      {premium && (
        <section className="mt-10" aria-labelledby="titulo-comparacao">
          <h2 id="titulo-comparacao" className="mb-4 font-display text-2xl text-tinta">
            Gratuito e Premium
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-linha bg-branco p-6">
              <p className="font-semibold text-tinta">Gratuito, para todas as contas</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-tinta-2">
                {GRATUITO[tipoConta].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Icone nome="check" tamanho={16} className="mt-0.5 shrink-0 text-sucesso" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-vinho/30 bg-blush/40 p-6">
              <p className="flex items-center gap-2 font-semibold text-vinho">
                <Icone nome="coroa" tamanho={18} /> Exclusivo do Premium
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-tinta-2">
                {premium.beneficios.map((b) => (
                  <li key={b} className="flex gap-2">
                    <Icone nome="check" tamanho={16} className="mt-0.5 shrink-0 text-vinho" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Campanhas */}
      {tipoConta === 'empresa' && d.campanhas.length > 0 && (
        <section className="mt-10" aria-labelledby="titulo-campanhas">
          <h2 id="titulo-campanhas" className="mb-4 font-display text-2xl text-tinta">
            Suas campanhas
          </h2>
          <ul className="flex flex-col divide-y divide-linha rounded-xl border border-linha bg-branco">
            {d.campanhas.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-tinta">{c.titulo}</p>
                  <p className="truncate text-sm text-suave">{c.texto}</p>
                </div>
                <Selo variante={STATUS_CAMPANHA[c.status].variante}>{STATUS_CAMPANHA[c.status].rotulo}</Selo>
                {c.status === 'aguardando_pagamento' && (
                  <>
                    <Botao tamanho="sm" variante="secundario" disabled={ocupado} onClick={() => executar(() => sincronizarCampanha(c.id), 'Pagamento conferido com o Mercado Pago.')}>
                      Conferir pagamento
                    </Botao>
                    <Botao tamanho="sm" variante="fantasma" disabled={ocupado} onClick={() => executar(() => cancelarCampanha(c.id), 'Campanha cancelada.')}>
                      Cancelar
                    </Botao>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Histórico */}
      <section className="mt-10" aria-labelledby="titulo-historico">
        <h2 id="titulo-historico" className="mb-4 font-display text-2xl text-tinta">
          Histórico de pagamentos
        </h2>
        {d.pagamentos.length ? (
          <div className="overflow-x-auto rounded-xl border border-linha bg-branco">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-linha text-xs text-suave uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Descrição</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linha">
                {d.pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">{dataHora(p.pagoEm ?? p.registradoEm)}</td>
                    <td className="px-4 py-3">{p.descricao}</td>
                    <td className="px-4 py-3">{reais(p.valor)}</td>
                    <td className="px-4 py-3">{STATUS_PAGAMENTO[p.status] ?? p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-xl border border-linha bg-branco p-6 text-sm text-suave">Nenhum pagamento registrado.</p>
        )}
        <p className="mt-3 text-xs text-suave">Pagamentos processados pelo Mercado Pago. A Bloom não armazena dados de cartão.</p>
      </section>
    </>
  )
}

export default AreaPremium
