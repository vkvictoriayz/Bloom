import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import Icone from '../components/Icone'
import MarcaEmpresa from '../components/MarcaEmpresa'
import CabecalhoPagina from '../components/layout/CabecalhoPagina'
import Pagina from '../components/layout/Pagina'
import { fotos } from '../data/imagens'
import Botao from '../components/ui/Botao'
import { AreaTexto, Aviso, Campo, estiloControle } from '../components/ui/Campo'
import { Vazio, VazioDescricao, VazioIcone, VazioTitulo } from '../components/ui/Vazio'
import { buscarEmpresa, empresas } from '../data/empresas'
import { useSessao } from '../hooks/useSessao'
import Esqueleto from '../components/ui/Esqueleto'
import { ASSUNTOS, CONTATOS_DISPONIVEL, enviarSolicitacao, listarSolicitacoes } from '../services/contatos'
import { cn } from '../lib/cn'

const MINIMO_MENSAGEM = 20
const ETAPAS = ['Assunto', 'Mensagem', 'Revisão']

function Etapas({ atual }) {
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Etapas do contato">
      {ETAPAS.map((etapa, i) => (
        <li key={etapa} className="flex items-center gap-2" aria-current={i === atual ? 'step' : undefined}>
          <span
            className={cn(
              'grid size-6 place-items-center rounded-full text-xs font-bold',
              i < atual && 'bg-vinho text-white',
              i === atual && 'bg-tinta text-white',
              i > atual && 'border border-linha-forte text-suave'
            )}
          >
            {i < atual ? <Icone nome="check" tamanho={13} /> : i + 1}
          </span>
          <span className={cn('font-medium', i === atual ? 'text-tinta' : 'text-suave max-sm:hidden')}>{etapa}</span>
          {i < ETAPAS.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-6 bg-linha-forte sm:w-10" />}
        </li>
      ))}
    </ol>
  )
}

// Fluxo de contato com uma empresa: assunto -> mensagem -> revisão -> envio.
// O envio só acontece se o backend estiver disponível (CONTATOS_DISPONIVEL);
// a confirmação só aparece com resposta real do servidor.
function FluxoContato({ empresa, sessao }) {
  const [etapa, setEtapa] = useState(0)
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [estado, setEstado] = useState({ tipo: 'ocioso' })

  const mensagemValida = mensagem.trim().length >= MINIMO_MENSAGEM

  async function enviar() {
    setEstado({ tipo: 'enviando' })
    try {
      const resposta = await enviarSolicitacao(sessao.token, { empresa: empresa.slug, assunto, mensagem: mensagem.trim() })
      setEstado({ tipo: 'enviado', resposta })
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  if (estado.tipo === 'enviado') {
    return (
      <Aviso tipo="sucesso">
        Solicitação enviada para {empresa.nome}. Situação: {estado.resposta?.status ?? 'registrada'}.
      </Aviso>
    )
  }

  return (
    <div className="rounded-xl border border-linha bg-branco">
      <div className="border-b border-linha px-6 py-4">
        <Etapas atual={etapa} />
      </div>

      <div className="p-6">
        {etapa === 0 && (
          <fieldset>
            <legend className="font-display text-xl text-tinta">Sobre o que você quer falar?</legend>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {ASSUNTOS.map((opcao) => (
                <label
                  key={opcao}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3.5 text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-vinho',
                    assunto === opcao ? 'border-vinho bg-blush text-vinho' : 'border-linha-forte hover:border-tinta'
                  )}
                >
                  <input type="radio" name="assunto" value={opcao} checked={assunto === opcao} onChange={() => setAssunto(opcao)} className="sr-only" />
                  <span className={cn('size-4 shrink-0 rounded-full border-2', assunto === opcao ? 'border-vinho bg-vinho shadow-[inset_0_0_0_2px_white]' : 'border-linha-forte')} aria-hidden="true" />
                  {opcao}
                </label>
              ))}
            </div>
            <Botao className="mt-6" disabled={!assunto} onClick={() => setEtapa(1)}>
              Continuar
            </Botao>
          </fieldset>
        )}

        {etapa === 1 && (
          <div>
            <Campo
              rotulo={`Mensagem para ${empresa.nomeCurto}`}
              ajuda={`${mensagem.trim().length}/1000 · mínimo de ${MINIMO_MENSAGEM} caracteres`}
            >
              {(p) => (
                <AreaTexto
                  {...p}
                  rows={7}
                  maxLength={1000}
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Apresente-se em poucas linhas e diga o que você gostaria de saber."
                />
              )}
            </Campo>
            <div className="mt-6 flex gap-3">
              <Botao variante="fantasma" onClick={() => setEtapa(0)}>
                Voltar
              </Botao>
              <Botao disabled={!mensagemValida} onClick={() => setEtapa(2)}>
                Revisar
              </Botao>
            </div>
          </div>
        )}

        {etapa === 2 && (
          <div>
            <h3 className="font-display text-xl text-tinta">Revise antes de enviar</h3>
            <dl className="mt-5 divide-y divide-linha rounded-lg border border-linha">
              {[
                ['Para', empresa.nome],
                ['De', `${sessao.usuario.nome} · ${sessao.usuario.email}`],
                ['Assunto', assunto],
              ].map(([rotulo, valor]) => (
                <div key={rotulo} className="grid grid-cols-[5rem_1fr] gap-3 px-4 py-3 text-sm">
                  <dt className="text-suave">{rotulo}</dt>
                  <dd className="font-medium text-tinta">{valor}</dd>
                </div>
              ))}
              <div className="px-4 py-3 text-sm">
                <dt className="text-suave">Mensagem</dt>
                <dd className="mt-2 leading-relaxed whitespace-pre-line text-tinta-2">{mensagem.trim()}</dd>
              </div>
            </dl>

            {!CONTATOS_DISPONIVEL && (
              <Aviso tipo="alerta" className="mt-5">
                O envio ainda não está disponível: a Bloom não tem um canal de mensagens autorizado pelas empresas. Sua mensagem
                não será enviada nem guardada. Enquanto isso, use o site oficial da empresa.
              </Aviso>
            )}
            {estado.tipo === 'erro' && (
              <Aviso tipo="erro" className="mt-5">
                {estado.texto}
              </Aviso>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Botao variante="fantasma" onClick={() => setEtapa(1)}>
                Editar mensagem
              </Botao>
              <Botao disabled={!CONTATOS_DISPONIVEL || estado.tipo === 'enviando'} onClick={enviar}>
                {estado.tipo === 'enviando' ? 'Enviando…' : 'Enviar solicitação'}
              </Botao>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Histórico vindo do backend (só é montado quando o canal está ativo).
function Historico({ token }) {
  const [estado, setEstado] = useState({ tipo: 'carregando' })

  useEffect(() => {
    let ativo = true
    listarSolicitacoes(token)
      .then((lista) => ativo && setEstado({ tipo: 'ok', lista: Array.isArray(lista) ? lista : [] }))
      .catch((erro) => ativo && setEstado({ tipo: 'erro', texto: erro.message }))
    return () => {
      ativo = false
    }
  }, [token])

  if (estado.tipo === 'carregando') {
    return (
      <div className="mt-6 flex flex-col gap-3">
        <Esqueleto className="h-14" />
        <Esqueleto className="h-14" />
      </div>
    )
  }
  if (estado.tipo === 'erro') return <Aviso tipo="erro" className="mt-6">{estado.texto}</Aviso>
  if (!estado.lista.length) return <p className="mt-6 text-sm text-suave">Nenhuma solicitação enviada ainda.</p>

  return (
    <ul className="divide-y divide-linha">
      {estado.lista.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-4 py-4 text-sm">
          <span>
            <span className="block font-semibold text-tinta">{buscarEmpresa(item.empresa)?.nome ?? item.empresa}</span>
            <span className="text-suave">
              {item.assunto} · {new Date(item.criadaEm).toLocaleDateString('pt-BR')}
            </span>
          </span>
          <span className="text-suave">{item.status}</span>
        </li>
      ))}
    </ul>
  )
}

function Contatos() {
  const sessao = useSessao()
  const [parametros, setParametros] = useSearchParams()
  const [busca, setBusca] = useState('')
  const selecionada = buscarEmpresa(parametros.get('empresa'))

  const lista = empresas.filter((e) => `${e.nome} ${e.segmento}`.toLowerCase().includes(busca.trim().toLowerCase()))

  return (
    <Pagina titulo="Contatos">
      <div className="border-b border-linha">
        <CabecalhoPagina
          tema="claro"
          forma="circulo"
          foto={fotos.contatos}
          posicaoFoto="40% center"
          rotulo="Contatos"
          titulo={
            <>
              Converse com as empresas que <em className="text-vinho">te interessam.</em>
            </>
          }
          descricao="Escolha uma empresa, conte o motivo do contato e revise sua mensagem. Usamos apenas canais reais e autorizados pelas empresas."
        >
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-tinta-2" aria-label="Como funciona o contato">
            {['Escolha a empresa', 'Escreva', 'Revise'].map((passo, i) => (
              <li key={passo} className="flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-full bg-blush text-xs text-vinho">{i + 1}</span>
                {passo}
                {i < 2 && <span aria-hidden="true" className="h-px w-6 bg-linha-forte" />}
              </li>
            ))}
          </ol>
        </CabecalhoPagina>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {!CONTATOS_DISPONIVEL && (
          <Aviso tipo="alerta" className="mb-8 flex items-start gap-3">
            <Icone nome="info" className="mt-0.5 shrink-0" />
            <span>
              <strong className="font-semibold">Envio de mensagens em implementação.</strong> Você já pode preparar e revisar uma
              solicitação, mas nada é enviado até o canal de mensagens com as empresas ser ativado no backend.
            </span>
          </Aviso>
        )}

        <div className="grid gap-8 lg:grid-cols-12">
          <aside aria-label="Empresas" className="lg:col-span-4">
            <div className="relative">
              <Icone nome="busca" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-suave" />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar empresa"
                aria-label="Buscar empresa para contato"
                className={cn(estiloControle, 'h-11 pl-10')}
              />
            </div>
            <ul className="mt-4 flex flex-col gap-1 lg:max-h-[34rem] lg:overflow-y-auto">
              {lista.map((empresa) => {
                const ativa = selecionada?.slug === empresa.slug
                return (
                  <li key={empresa.slug}>
                    <button
                      type="button"
                      aria-pressed={ativa}
                      onClick={() => setParametros({ empresa: empresa.slug }, { replace: true })}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                        ativa ? 'border-vinho bg-branco' : 'border-transparent hover:bg-branco'
                      )}
                    >
                      <MarcaEmpresa empresa={empresa} tamanho="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-tinta">{empresa.nome}</span>
                        <span className="block truncate text-xs text-suave">{empresa.segmento}</span>
                      </span>
                      {ativa && <Icone nome="seta" tamanho={16} className="text-vinho" />}
                    </button>
                  </li>
                )
              })}
              {lista.length === 0 && <li className="px-3 py-6 text-sm text-suave">Nenhuma empresa com esse nome.</li>}
            </ul>
          </aside>

          <section aria-label="Contato com a empresa" className="lg:col-span-8">
            {!selecionada ? (
              <Vazio className="h-full min-h-80 bg-branco">
                <VazioIcone>
                  <Icone nome="mensagem" />
                </VazioIcone>
                <VazioTitulo>Escolha uma empresa</VazioTitulo>
                <VazioDescricao>Selecione uma empresa na lista para ver os canais disponíveis e preparar seu contato.</VazioDescricao>
              </Vazio>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-5 rounded-xl border border-linha bg-branco p-6 sm:flex-row sm:items-center">
                  <MarcaEmpresa empresa={selecionada} tamanho="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-suave">
                      {selecionada.segmento} · {selecionada.sede}
                    </p>
                    <h2 className="font-display text-3xl text-tinta">{selecionada.nome}</h2>
                    <Link to={`/empresas/${selecionada.slug}`} className="link-linha mt-1 text-sm font-semibold text-vinho">
                      Ver perfil da empresa
                    </Link>
                  </div>
                </div>

                <div className="rounded-xl border border-linha bg-branco p-6">
                  <h3 className="text-xs font-semibold tracking-[0.14em] text-suave uppercase">Canais disponíveis</h3>
                  <ul className="mt-4 divide-y divide-linha">
                    {selecionada.site && (
                      <li className="flex items-center justify-between gap-4 py-3">
                        <span className="text-sm">
                          <span className="block font-semibold text-tinta">Site oficial</span>
                          <span className="text-suave">Canal público da empresa</span>
                        </span>
                        <Botao as="a" href={selecionada.site} target="_blank" rel="noreferrer" variante="secundario" tamanho="sm">
                          Abrir <Icone nome="externo" tamanho={14} />
                        </Botao>
                      </li>
                    )}
                    <li className="flex items-center justify-between gap-4 py-3">
                      <span className="text-sm">
                        <span className="block font-semibold text-tinta">Mensagem pela Bloom</span>
                        <span className="text-suave">
                          {CONTATOS_DISPONIVEL ? 'Resposta pela plataforma' : 'Aguardando ativação do canal com a empresa'}
                        </span>
                      </span>
                    </li>
                  </ul>
                </div>

                <FluxoContato key={selecionada.slug} empresa={selecionada} sessao={sessao} />
              </div>
            )}
          </section>
        </div>

        <section aria-labelledby="titulo-historico" className="mt-16">
          <h2 id="titulo-historico" className="border-b border-tinta pb-3 font-display text-2xl">
            Suas solicitações
          </h2>
          {CONTATOS_DISPONIVEL ? (
            <Historico token={sessao?.token} />
          ) : (
            <p className="mt-6 text-sm text-suave">
              O histórico de solicitações aparecerá aqui quando o envio de mensagens estiver ativo. Nenhuma solicitação foi enviada.
            </p>
          )}
        </section>
      </div>
    </Pagina>
  )
}

export default Contatos
