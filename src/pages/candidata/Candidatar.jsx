import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import MarcaEmpresa from '../../components/MarcaEmpresa'
import { enderecoSeguro, LINKS } from '../../components/candidata/utilPerfil'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Aviso, Campo } from '../../components/ui/Campo'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { buscarVaga } from '../../data/vagas'
import { useSessao } from '../../hooks/useSessao'
import { candidatar, candidaturaDaVaga } from '../../services/candidaturas'
import { lerPerfil } from '../../services/perfil'
import { lerProjetos } from '../../services/projetos'
import { cn } from '../../lib/cn'

const LIMITE_APRESENTACAO = 1000

function Bloco({ titulo, acao, children }) {
  return (
    <section className="rounded-xl border border-linha bg-branco p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-tinta">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  )
}

// Fluxo de candidatura: revisar dados -> confirmar -> enviar.
function Candidatar() {
  const { id } = useParams()
  const vaga = buscarVaga(id)
  const sessao = useSessao()
  const usuario = sessao?.usuario
  const [perfil] = useState(() => lerPerfil(usuario))
  const [projetos] = useState(() => lerProjetos(usuario))
  const [existente] = useState(() => (vaga ? candidaturaDaVaga(vaga.id) : null))

  const [etapa, setEtapa] = useState('dados') // dados | revisao | enviada
  const [apresentacao, setApresentacao] = useState('')
  const [escolhidos, setEscolhidos] = useState([])
  const [confirmo, setConfirmo] = useState(false)
  const [erro, setErro] = useState('')
  const [enviada, setEnviada] = useState(null)

  useEffect(() => {
    document.title = `Candidatar-se · ${vaga?.titulo ?? 'Vaga'} · BLOOM`
  }, [vaga?.titulo])

  if (!vaga) {
    return (
      <Vazio className="bg-branco">
        <VazioTitulo>Vaga não encontrada</VazioTitulo>
        <VazioDescricao>Não é possível se candidatar a uma vaga que não existe ou foi encerrada.</VazioDescricao>
        <VazioAcoes>
          <Botao as={Link} to="/candidata/vagas">
            Ver vagas
          </Botao>
        </VazioAcoes>
      </Vazio>
    )
  }

  if (existente && etapa !== 'enviada') {
    return (
      <Vazio className="bg-branco">
        <VazioTitulo>Você já se candidatou a esta vaga</VazioTitulo>
        <VazioDescricao>
          Sua candidatura para {vaga.titulo} foi registrada em {existente.data}. Não é possível enviar outra.
        </VazioDescricao>
        <VazioAcoes>
          <Botao as={Link} to={`/candidata/candidaturas/${encodeURIComponent(existente.id)}`}>
            Ver minha candidatura
          </Botao>
        </VazioAcoes>
      </Vazio>
    )
  }

  const nome = perfil.nome || usuario?.nome || ''
  const email = perfil.email || usuario?.email || ''
  const links = LINKS.map((l) => ({ ...l, url: enderecoSeguro(perfil.links[l.chave]) })).filter((l) => l.url)
  const projetosEscolhidos = projetos.filter((p) => escolhidos.includes(p.id))

  function revisar(e) {
    e.preventDefault()
    if (!nome || !email) return setErro('Seu nome e e-mail são obrigatórios. Complete-os em Editar perfil.')
    if (apresentacao.trim().length > LIMITE_APRESENTACAO) return setErro('A apresentação pode ter até 1000 caracteres.')
    if (!confirmo) return setErro('Confirme que as informações estão corretas para continuar.')
    setErro('')
    setEtapa('revisao')
  }

  function enviar() {
    const r = candidatar(vaga, {
      apresentacao: apresentacao.trim(),
      links: [
        ...links.map((l) => ({ rotulo: l.rotulo, url: l.url })),
        ...projetosEscolhidos.map((p) => ({ rotulo: `Projeto: ${p.nome}`, url: enderecoSeguro(p.demo) ?? enderecoSeguro(p.repositorio) ?? '' })),
      ],
      perfil: { nome, email, titulo: perfil.cargo, local: perfil.local, competencias: perfil.tecnicas },
    })
    if (!r.ok) return setErro('Não foi possível registrar a candidatura neste navegador. Libere o armazenamento do site e tente de novo.')
    setEnviada(r.candidatura)
    setEtapa('enviada')
  }

  if (etapa === 'enviada') {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-linha bg-branco p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-sucesso-claro text-sucesso" aria-hidden="true">
          <Icone nome="check" tamanho={28} />
        </span>
        <h1 className="mt-5 font-display text-3xl text-tinta">Candidatura registrada</h1>
        <p className="mt-2 text-tinta-2">
          Sua candidatura para <strong>{vaga.titulo}</strong> foi registrada em {enviada.data}.
        </p>
        <p className="mt-3 text-sm text-suave">
          Ela fica salva neste navegador. O envio direto à empresa depende da API de candidaturas, que ainda não existe no backend.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Botao as={Link} to={`/candidata/candidaturas/${encodeURIComponent(enviada.id)}/andamento`}>
            Acompanhar andamento
          </Botao>
          <Botao as={Link} to="/candidata/vagas" variante="secundario">
            Ver outras vagas
          </Botao>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link to={`/vagas/${vaga.id}`} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-suave hover:text-tinta">
        <Icone nome="voltar" tamanho={16} /> Voltar para a vaga
      </Link>

      <div>
        <h1 className="font-display text-3xl text-tinta sm:text-4xl">Candidatar-se</h1>
        <ol className="mt-4 flex items-center gap-3 text-sm" aria-label="Etapas">
          {['Seus dados', 'Confirmação'].map((rotulo, i) => {
            const atual = (etapa === 'dados' && i === 0) || (etapa === 'revisao' && i === 1)
            const feita = etapa === 'revisao' && i === 0
            return (
              <li key={rotulo} className="flex items-center gap-2" aria-current={atual ? 'step' : undefined}>
                <span className={cn('grid size-6 place-items-center rounded-full text-xs font-bold', feita ? 'bg-vinho text-white' : atual ? 'bg-tinta text-white' : 'border border-linha-forte text-suave')}>
                  {feita ? <Icone nome="check" tamanho={13} /> : i + 1}
                </span>
                <span className={atual ? 'font-semibold text-tinta' : 'text-suave'}>{rotulo}</span>
                {i === 0 && <span aria-hidden="true" className="h-px w-8 bg-linha-forte" />}
              </li>
            )
          })}
        </ol>
      </div>

      <Bloco titulo="Vaga">
        <div className="flex items-center gap-4">
          <MarcaEmpresa empresa={vaga.dadosEmpresa} tamanho="md" />
          <div className="min-w-0">
            <p className="font-semibold text-tinta">{vaga.titulo}</p>
            <p className="text-sm text-suave">
              {vaga.dadosEmpresa.nome} · {vaga.local} · {vaga.modalidade}
            </p>
          </div>
        </div>
      </Bloco>

      {etapa === 'dados' ? (
        <form onSubmit={revisar} noValidate className="flex flex-col gap-6">
          <Bloco
            titulo="Seus dados"
            acao={
              <Link to="/candidata/perfil/editar" className="text-sm font-semibold text-vinho hover:underline">
                Editar perfil
              </Link>
            }
          >
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ['Nome', nome || 'Não informado'],
                ['E-mail', email || 'Não informado'],
                ['Título profissional', perfil.cargo || 'Não informado'],
                ['Localização', perfil.local || 'Não informada'],
              ].map(([rotulo, valor]) => (
                <div key={rotulo}>
                  <dt className="text-suave">{rotulo}</dt>
                  <dd className="font-semibold text-tinta">{valor}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-suave">Competências técnicas</dt>
                <dd className="font-semibold text-tinta">{perfil.tecnicas.join(', ') || 'Nenhuma informada'}</dd>
              </div>
            </dl>
          </Bloco>

          <Bloco titulo="Currículo e portfólio">
            {links.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {links.map((l) => (
                  <li key={l.chave} className="rounded-full bg-papel-2 px-3 py-1 text-sm font-semibold text-tinta-2">
                    {l.rotulo}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-suave">Nenhum link profissional no perfil. Você pode adicioná-los em Editar perfil.</p>
            )}

            {projetos.length > 0 && (
              <fieldset className="mt-5">
                <legend className="mb-2 text-sm font-semibold text-tinta-2">Projetos para incluir (opcional)</legend>
                <div className="flex flex-col gap-2">
                  {projetos.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 accent-vinho"
                        checked={escolhidos.includes(p.id)}
                        onChange={() => setEscolhidos((l) => (l.includes(p.id) ? l.filter((x) => x !== p.id) : [...l, p.id]))}
                      />
                      {p.nome}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <p className="mt-4 text-xs text-suave">O envio de arquivo de currículo ainda não está disponível: falta o upload no backend.</p>
          </Bloco>

          <Bloco titulo="Apresentação">
            <Campo rotulo="Por que esta vaga combina com você?" opcional ajuda={`${apresentacao.length}/${LIMITE_APRESENTACAO}`}>
              {(p) => <AreaTexto {...p} rows={5} maxLength={LIMITE_APRESENTACAO} value={apresentacao} onChange={(e) => setApresentacao(e.target.value)} />}
            </Campo>
          </Bloco>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-tinta-2">
            <input type="checkbox" className="mt-0.5 size-4 accent-vinho" checked={confirmo} onChange={(e) => setConfirmo(e.target.checked)} />
            Confirmo que as informações acima estão corretas e atualizadas.
          </label>

          {erro && <Aviso tipo="erro">{erro}</Aviso>}

          <div className="flex flex-wrap gap-2">
            <Botao type="submit" tamanho="lg">
              Revisar candidatura
            </Botao>
            <Botao as={Link} to={`/vagas/${vaga.id}`} variante="fantasma" tamanho="lg">
              Cancelar
            </Botao>
          </div>
        </form>
      ) : (
        <>
          <Bloco titulo="Confira antes de enviar">
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-suave">Candidata</dt>
                <dd className="font-semibold text-tinta">
                  {nome} · {email}
                </dd>
              </div>
              <div>
                <dt className="text-suave">Links incluídos</dt>
                <dd className="font-semibold text-tinta">
                  {[...links.map((l) => l.rotulo), ...projetosEscolhidos.map((p) => p.nome)].join(', ') || 'Nenhum'}
                </dd>
              </div>
              <div>
                <dt className="text-suave">Apresentação</dt>
                <dd className="whitespace-pre-line text-tinta-2">{apresentacao.trim() || 'Sem apresentação.'}</dd>
              </div>
            </dl>
          </Bloco>
          <Aviso tipo="info">
            A candidatura será registrada neste navegador. O envio direto à empresa depende da API de candidaturas, que ainda não existe.
          </Aviso>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <div className="flex flex-wrap gap-2">
            <Botao tamanho="lg" onClick={enviar}>
              Confirmar candidatura
            </Botao>
            <Botao variante="secundario" tamanho="lg" onClick={() => setEtapa('dados')}>
              Voltar e editar
            </Botao>
          </div>
        </>
      )}
    </div>
  )
}

export default Candidatar
