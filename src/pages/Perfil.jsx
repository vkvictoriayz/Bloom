import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import Icone from '../components/Icone'
import Pagina from '../components/layout/Pagina'
import EditorEtiquetas from '../components/perfil/EditorEtiquetas'
import EditorItens from '../components/perfil/EditorItens'
import Botao from '../components/ui/Botao'
import { AreaTexto, Aviso, Campo, Entrada } from '../components/ui/Campo'
import { iniciais, useSessao } from '../hooks/useSessao'
import { completude, lerPerfil, salvarPerfil } from '../services/perfil'
import { cn } from '../lib/cn'

const LIMITE_FOTO = 1024 * 1024 // 1 MB, para caber no armazenamento do navegador

const SECOES = [
  { id: 'sobre', rotulo: 'Sobre' },
  { id: 'competencias', rotulo: 'Competências' },
  { id: 'experiencias', rotulo: 'Experiência' },
  { id: 'formacao', rotulo: 'Formação' },
  { id: 'cursos', rotulo: 'Cursos e certificações' },
  { id: 'projetos', rotulo: 'Projetos' },
  { id: 'curriculo', rotulo: 'Currículo' },
]

const LINKS = [
  { chave: 'linkedin', rotulo: 'LinkedIn' },
  { chave: 'github', rotulo: 'GitHub' },
  { chave: 'portfolio', rotulo: 'Portfólio' },
]

// "2023-05" -> "mai. 2023"
function mes(valor) {
  if (!valor) return ''
  const [ano, m] = valor.split('-').map(Number)
  if (!ano || !m) return valor
  return new Date(ano, m - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function periodo(inicio, fim, rotuloAtual = 'atual') {
  if (!inicio && !fim) return ''
  return `${mes(inicio) || '—'} – ${fim ? mes(fim) : rotuloAtual}`
}

function enderecoSeguro(url) {
  if (!url) return null
  const completo = /^https?:\/\//i.test(url) ? url : `https://${url}`
  try {
    return new URL(completo).href
  } catch {
    return null
  }
}

// Anel de completude do perfil (SVG simples, sem biblioteca).
function AnelProgresso({ valor }) {
  const raio = 30
  const circunferencia = 2 * Math.PI * raio
  return (
    <div className="relative size-20 shrink-0" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={valor} aria-label="Completude do perfil">
      <svg viewBox="0 0 72 72" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={raio} fill="none" strokeWidth="6" className="stroke-blush" />
        <circle
          cx="36"
          cy="36"
          r={raio}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-vinho transition-[stroke-dashoffset] duration-700"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - valor / 100)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-xl text-tinta tabular-nums">{valor}%</span>
    </div>
  )
}

// Capa do perfil: a borboleta da marca repetida em padrão, bem discreta.
function PadraoBorboletas() {
  return (
    <svg className="absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <pattern id="padrao-borboletas" width="96" height="84" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
          <g transform="translate(24 22) scale(0.42)" fill="#ffffff" fillOpacity="0.07">
            <path d="M49.2 45.6C43 30 28 8 5.5 5C3.5 23 20 41 49.2 45.6Z" />
            <path d="M48.6 48.4C40 46.2 31 44.8 23.5 44.6C21 56 26.5 70 35 75.5C40.5 76.5 46 62 48.6 48.4Z" />
            <path d="M50.8 45.6C57 30 72 8 94.5 5C96.5 23 80 41 50.8 45.6Z" />
            <path d="M51.4 48.4C60 46.2 69 44.8 76.5 44.6C79 56 73.5 70 65 75.5C59.5 76.5 54 62 51.4 48.4Z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#padrao-borboletas)" />
    </svg>
  )
}

const ICONES_SECAO = {
  sobre: 'perfil',
  competencias: 'broto',
  experiencias: 'maleta',
  formacao: 'documento',
  cursos: 'check',
  projetos: 'link',
  curriculo: 'documento',
}

function Secao({ id, indice, titulo, descricao, children }) {
  return (
    <section id={id} aria-labelledby={`titulo-${id}`} className="scroll-mt-24 border-t border-linha py-12 first:border-t-0 first:pt-0">
      <div className="mb-7 flex items-center gap-4">
        <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-blush text-vinho" aria-hidden="true">
          <Icone nome={ICONES_SECAO[id]} tamanho={20} />
          <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-branco text-[10px] font-bold text-suave ring-1 ring-linha tabular-nums">
            {Number(indice)}
          </span>
        </span>
        <div>
          <h2 id={`titulo-${id}`} className="font-display text-2xl text-tinta sm:text-3xl">
            {titulo}
          </h2>
          {descricao && <p className="mt-1 text-sm text-suave">{descricao}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function VazioSecao({ children }) {
  return <p className="rounded-lg border border-dashed border-linha-forte px-5 py-6 text-sm text-suave">{children}</p>
}

function Perfil() {
  const sessao = useSessao()
  const { pathname } = useLocation()
  const [perfil, setPerfil] = useState(() => lerPerfil(sessao?.usuario))
  const [editandoTopo, setEditandoTopo] = useState(pathname === '/editar-perfil')
  const [rascunho, setRascunho] = useState(perfil)
  const [editandoSobre, setEditandoSobre] = useState(false)
  const [mensagem, setMensagem] = useState(null)
  const [curriculo, setCurriculo] = useState(null)
  const arquivoFoto = useRef(null)
  const arquivoCurriculo = useRef(null)

  const { percentual, itens } = completude(perfil)

  function atualizar(mudancas, texto = 'Perfil atualizado.') {
    const novo = { ...perfil, ...mudancas }
    if (salvarPerfil(novo)) {
      setPerfil(novo)
      setMensagem({ tipo: 'sucesso', texto })
      return true
    }
    setMensagem({ tipo: 'erro', texto: 'Não foi possível salvar neste navegador. Libere o armazenamento do site e tente de novo.' })
    return false
  }

  function abrirEdicaoTopo() {
    setRascunho(perfil)
    setEditandoTopo(true)
  }

  function salvarTopo(e) {
    e.preventDefault()
    const links = Object.fromEntries(LINKS.map(({ chave }) => [chave, rascunho.links[chave].trim()]))
    if (
      atualizar({
        nome: rascunho.nome.trim(),
        cargo: rascunho.cargo.trim(),
        local: rascunho.local.trim(),
        telefone: rascunho.telefone.trim(),
        links,
      })
    ) {
      setEditandoTopo(false)
    }
  }

  function salvarSobre(e) {
    e.preventDefault()
    if (atualizar({ sobre: rascunho.sobre.trim(), objetivo: rascunho.objetivo.trim() })) setEditandoSobre(false)
  }

  function escolherFoto(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    if (!arquivo.type.startsWith('image/')) {
      setMensagem({ tipo: 'erro', texto: 'Escolha um arquivo de imagem (JPG, PNG ou WebP).' })
      return
    }
    if (arquivo.size > LIMITE_FOTO) {
      setMensagem({ tipo: 'erro', texto: 'A foto deve ter até 1 MB.' })
      return
    }
    const leitor = new FileReader()
    leitor.onload = () => atualizar({ foto: leitor.result }, 'Foto atualizada.')
    leitor.readAsDataURL(arquivo)
  }

  function escolherCurriculo(e) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    if (!/\.(pdf|doc|docx)$/i.test(arquivo.name)) {
      setMensagem({ tipo: 'erro', texto: 'Selecione um arquivo PDF, DOC ou DOCX.' })
      e.target.value = ''
      return
    }
    setCurriculo(arquivo)
    setMensagem({ tipo: 'info', texto: 'Currículo selecionado nesta sessão.' })
  }

  const links = LINKS.map((l) => ({ ...l, url: enderecoSeguro(perfil.links[l.chave]) })).filter((l) => l.url)

  return (
    <Pagina titulo="Meu perfil">
      {/* ── Apresentação ─────────────────────────────────────── */}
      <section id="apresentacao" className="scroll-mt-20">
        <div className="relative h-36 overflow-hidden bg-vinho-escuro sm:h-48">
          <PadraoBorboletas />
          <div aria-hidden="true" className="absolute -right-16 -bottom-40 size-96 rounded-full bg-vinho/70" />
        </div>

        <div className="border-b border-linha bg-branco">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-10 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="lg:col-span-8">
              {editandoTopo ? (
                <form onSubmit={salvarTopo} className="grid gap-4 pt-8 sm:grid-cols-2">
                  <h1 className="font-display text-3xl sm:col-span-2">Editar apresentação</h1>
                  <Campo rotulo="Nome completo">
                    {(p) => <Entrada {...p} required maxLength={100} value={rascunho.nome} onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })} />}
                  </Campo>
                  <Campo rotulo="Cargo ou área desejada" opcional>
                    {(p) => (
                      <Entrada {...p} maxLength={100} placeholder="Ex.: Desenvolvedora front-end" value={rascunho.cargo} onChange={(e) => setRascunho({ ...rascunho, cargo: e.target.value })} />
                    )}
                  </Campo>
                  <Campo rotulo="Localização" opcional>
                    {(p) => (
                      <Entrada {...p} maxLength={100} placeholder="Cidade, UF" value={rascunho.local} onChange={(e) => setRascunho({ ...rascunho, local: e.target.value })} />
                    )}
                  </Campo>
                  <Campo rotulo="Telefone" opcional>
                    {(p) => <Entrada {...p} type="tel" maxLength={20} value={rascunho.telefone} onChange={(e) => setRascunho({ ...rascunho, telefone: e.target.value })} />}
                  </Campo>
                  {LINKS.map(({ chave, rotulo }) => (
                    <Campo key={chave} rotulo={rotulo} opcional>
                      {(p) => (
                        <Entrada
                          {...p}
                          type="url"
                          inputMode="url"
                          maxLength={200}
                          placeholder="https://"
                          value={rascunho.links[chave]}
                          onChange={(e) => setRascunho({ ...rascunho, links: { ...rascunho.links, [chave]: e.target.value } })}
                        />
                      )}
                    </Campo>
                  ))}
                  <div className="flex gap-3 sm:col-span-2">
                    <Botao type="submit">Salvar</Botao>
                    <Botao variante="fantasma" onClick={() => setEditandoTopo(false)}>
                      Cancelar
                    </Botao>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
                  <div className="relative -mt-16 w-fit shrink-0 sm:-mt-20">
                    {perfil.foto ? (
                      <img src={perfil.foto} alt={`Foto de ${perfil.nome}`} className="size-32 rounded-full object-cover ring-4 ring-branco sm:size-40" />
                    ) : (
                      <span className="grid size-32 place-items-center rounded-full bg-blush font-display text-5xl text-vinho ring-4 ring-branco sm:size-40" aria-hidden="true">
                        {iniciais(perfil.nome)}
                      </span>
                    )}
                    <input ref={arquivoFoto} type="file" accept="image/*" hidden onChange={escolherFoto} />
                    <button
                      type="button"
                      onClick={() => arquivoFoto.current?.click()}
                      className="absolute right-1 bottom-1 grid size-10 place-items-center rounded-full border-2 border-branco bg-vinho text-white hover:bg-vinho-escuro"
                      aria-label={perfil.foto ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
                    >
                      <Icone nome="camera" tamanho={18} />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1 sm:pb-1">
                    <p className={cn('text-xs font-bold tracking-[0.16em] uppercase', perfil.cargo ? 'text-vinho' : 'text-suave')}>
                      {perfil.cargo || 'Adicione o cargo ou a área que você busca'}
                    </p>
                    <h1 className="mt-2 font-display text-4xl leading-[1.05] text-tinta sm:text-5xl">{perfil.nome || 'Seu nome'}</h1>
                  </div>
                </div>
              )}

              {!editandoTopo && (
                <>
                  <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-tinta-2">
                    {perfil.local && (
                      <li className="inline-flex items-center gap-1.5">
                        <Icone nome="local" className="text-vinho" /> {perfil.local}
                      </li>
                    )}
                    <li className="inline-flex items-center gap-1.5">
                      <Icone nome="email" className="text-vinho" /> {perfil.email}
                    </li>
                    {perfil.telefone && (
                      <li className="inline-flex items-center gap-1.5">
                        <Icone nome="telefone" className="text-vinho" /> {perfil.telefone}
                      </li>
                    )}
                  </ul>
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    {links.map((link) => (
                      <a
                        key={link.chave}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center gap-1.5 rounded-md border border-linha-forte px-3.5 text-sm font-semibold hover:border-vinho hover:text-vinho"
                      >
                        {link.rotulo} <Icone nome="externo" tamanho={14} />
                      </a>
                    ))}
                    <Botao variante={links.length ? 'fantasma' : 'secundario'} onClick={abrirEdicaoTopo}>
                      <Icone nome="editar" tamanho={16} /> {links.length ? 'Editar' : 'Editar apresentação e links'}
                    </Botao>
                  </div>
                </>
              )}
            </div>

            <aside aria-labelledby="titulo-completude" className="relative rounded-xl border border-linha bg-branco p-6 lg:col-span-4 lg:-mt-24">
              <div className="flex items-center gap-5">
                <AnelProgresso valor={percentual} />
                <div>
                  <h2 id="titulo-completude" className="font-display text-xl">
                    Perfil {percentual === 100 ? 'completo' : 'em construção'}
                  </h2>
                  <p className="mt-1 text-sm text-suave">
                    {percentual === 100 ? 'Tudo pronto para as recrutadoras.' : `Faltam ${itens.filter((i) => !i.feito).length} itens.`}
                  </p>
                </div>
              </div>
              <ul className="mt-5 grid gap-2 border-t border-linha pt-5 text-sm">
                {itens.map((item) => (
                  <li key={item.id} className="flex items-center gap-2.5">
                    <span
                      className={cn('grid size-5 shrink-0 place-items-center rounded-full', item.feito ? 'bg-vinho text-white' : 'border border-linha-forte')}
                      aria-hidden="true"
                    >
                      {item.feito && <Icone nome="check" tamanho={12} />}
                    </span>
                    {item.feito ? (
                      <span className="text-suave line-through decoration-linha-forte">{item.rotulo}</span>
                    ) : (
                      <a href={`#${item.ancora}`} className="link-linha font-medium text-tinta">
                        {item.rotulo}
                      </a>
                    )}
                    <span className="sr-only">{item.feito ? '(concluído)' : '(pendente)'}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>

          {/* Indicadores do perfil */}
          <dl className="mx-auto grid max-w-7xl grid-cols-2 border-t border-linha px-4 sm:px-6 md:grid-cols-4 lg:px-8">
            {[
              ['Competências', perfil.tecnicas.length + perfil.comportamentais.length, 'competencias'],
              ['Experiências', perfil.experiencias.length, 'experiencias'],
              ['Formações', perfil.formacoes.length, 'formacao'],
              ['Projetos', perfil.projetos.length, 'projetos'],
            ].map(([rotulo, valor, ancora]) => (
              <div key={rotulo} className="flex flex-col-reverse py-5 md:border-l md:border-linha md:pl-6 md:first:border-l-0 md:first:pl-0">
                <dt className="text-xs font-bold tracking-[0.12em] text-suave uppercase">
                  <a href={`#${ancora}`} className="hover:text-vinho">
                    {rotulo}
                  </a>
                </dt>
                <dd className="font-display text-4xl text-tinta tabular-nums">{valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8">
        <nav aria-label="Seções do perfil" className="hidden lg:col-span-3 lg:block">
          <ul className="sticky top-28 flex flex-col gap-1 border-l border-linha">
            {SECOES.map((secao, i) => (
              <li key={secao.id}>
                <a href={`#${secao.id}`} className="-ml-px flex gap-3 border-l-2 border-transparent py-1.5 pl-4 text-sm text-suave hover:border-vinho hover:text-tinta">
                  <span className="tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  {secao.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 lg:col-span-9">
          {mensagem && (
            <Aviso tipo={mensagem.tipo} className="mb-8 flex items-start justify-between gap-4">
              <span>{mensagem.texto}</span>
              <button type="button" onClick={() => setMensagem(null)} aria-label="Fechar mensagem" className="shrink-0 opacity-70 hover:opacity-100">
                <Icone nome="fechar" tamanho={16} />
              </button>
            </Aviso>
          )}

          <Secao id="sobre" indice="01" titulo="Sobre">
            {editandoSobre ? (
              <form onSubmit={salvarSobre} className="flex flex-col gap-4">
                <Campo rotulo="Apresentação profissional" ajuda="Quem você é, no que trabalha e o que te move.">
                  {(p) => <AreaTexto {...p} rows={5} maxLength={1000} value={rascunho.sobre} onChange={(e) => setRascunho({ ...rascunho, sobre: e.target.value })} />}
                </Campo>
                <Campo rotulo="Objetivo de carreira" opcional>
                  {(p) => <AreaTexto {...p} rows={3} maxLength={500} value={rascunho.objetivo} onChange={(e) => setRascunho({ ...rascunho, objetivo: e.target.value })} />}
                </Campo>
                <div className="flex gap-3">
                  <Botao type="submit">Salvar</Botao>
                  <Botao variante="fantasma" onClick={() => setEditandoSobre(false)}>
                    Cancelar
                  </Botao>
                </div>
              </form>
            ) : (
              <>
                {perfil.sobre || perfil.objetivo ? (
                  <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
                    <p className="text-lg leading-relaxed whitespace-pre-line text-tinta-2">{perfil.sobre || '—'}</p>
                    {perfil.objetivo && (
                      <div className="border-l-2 border-vinho pl-5">
                        <p className="text-xs font-semibold tracking-[0.12em] text-suave uppercase">Objetivo</p>
                        <p className="mt-2 font-display text-lg leading-snug text-tinta italic">{perfil.objetivo}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <VazioSecao>Escreva uma apresentação curta: é a primeira coisa que uma recrutadora lê.</VazioSecao>
                )}
                <Botao
                  variante="secundario"
                  tamanho="sm"
                  className="mt-5"
                  onClick={() => {
                    setRascunho(perfil)
                    setEditandoSobre(true)
                  }}
                >
                  <Icone nome="editar" tamanho={16} /> {perfil.sobre ? 'Editar' : 'Escrever apresentação'}
                </Botao>
              </>
            )}
          </Secao>

          <Secao id="competencias" indice="02" titulo="Competências" descricao="Usadas para recomendar vagas com as mesmas tecnologias.">
            <div className="grid gap-px overflow-hidden rounded-xl border border-linha bg-linha md:grid-cols-2 [&>*]:bg-branco [&>*]:p-6">
              <EditorEtiquetas
                rotulo="Técnicas"
                variante="cheia"
                itens={perfil.tecnicas}
                sugestao="Ex.: React, SQL, Python — Enter para incluir"
                vazio="Nenhuma competência técnica."
                aoMudar={(tecnicas) => atualizar({ tecnicas }, 'Competências atualizadas.')}
              />
              <EditorEtiquetas
                rotulo="Comportamentais"
                itens={perfil.comportamentais}
                sugestao="Ex.: Comunicação — Enter para incluir"
                vazio="Nenhuma competência comportamental."
                aoMudar={(comportamentais) => atualizar({ comportamentais }, 'Competências atualizadas.')}
              />
            </div>
          </Secao>

          <Secao id="experiencias" indice="03" titulo="Experiência">
            <EditorItens
              itens={perfil.experiencias}
              layout="linha"
              rotuloAdicionar="Adicionar experiência"
              vazio={<VazioSecao>Inclua estágios, empregos, trabalhos voluntários ou freelas.</VazioSecao>}
              aoMudar={(experiencias) => atualizar({ experiencias }, 'Experiências atualizadas.')}
              campos={[
                { nome: 'cargo', rotulo: 'Cargo', obrigatorio: true, max: 100 },
                { nome: 'empresa', rotulo: 'Empresa', obrigatorio: true, max: 100 },
                { nome: 'inicio', rotulo: 'Início', tipo: 'month' },
                { nome: 'fim', rotulo: 'Fim (vazio se atual)', tipo: 'month' },
                { nome: 'descricao', rotulo: 'O que você fez', tipo: 'textarea', largo: true, max: 250 },
              ]}
              renderizar={(item) => (
                <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-6">
                  <p className="text-sm text-suave tabular-nums">{periodo(item.inicio, item.fim)}</p>
                  <div>
                    <p className="font-semibold text-tinta">{item.cargo}</p>
                    <p className="text-sm text-vinho">{item.empresa}</p>
                    {item.descricao && <p className="mt-2 text-sm leading-relaxed text-tinta-2">{item.descricao}</p>}
                  </div>
                </div>
              )}
            />
          </Secao>

          <Secao id="formacao" indice="04" titulo="Formação acadêmica">
            <EditorItens
              itens={perfil.formacoes}
              layout="linha"
              rotuloAdicionar="Adicionar formação"
              vazio={<VazioSecao>Adicione graduação, curso técnico ou ensino médio.</VazioSecao>}
              aoMudar={(formacoes) => atualizar({ formacoes }, 'Formação atualizada.')}
              campos={[
                { nome: 'curso', rotulo: 'Curso', obrigatorio: true },
                { nome: 'instituicao', rotulo: 'Instituição', obrigatorio: true },
                { nome: 'nivel', rotulo: 'Nível', placeholder: 'Ex.: Graduação, Técnico', max: 50 },
                { nome: 'inicio', rotulo: 'Início', tipo: 'month' },
                { nome: 'conclusao', rotulo: 'Conclusão (vazio se cursando)', tipo: 'month' },
              ]}
              renderizar={(item) => (
                <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-6">
                  <p className="text-sm text-suave tabular-nums">{periodo(item.inicio, item.conclusao, 'cursando')}</p>
                  <div>
                    <p className="font-semibold text-tinta">{item.curso}</p>
                    <p className="text-sm text-vinho">
                      {item.instituicao}
                      {item.nivel && <span className="text-suave"> · {item.nivel}</span>}
                    </p>
                  </div>
                </div>
              )}
            />
          </Secao>

          <Secao id="cursos" indice="05" titulo="Cursos e certificações">
            <EditorItens
              itens={perfil.cursos}
              rotuloAdicionar="Adicionar curso"
              vazio={<VazioSecao>Bootcamps, cursos livres e certificações contam muito em tecnologia.</VazioSecao>}
              aoMudar={(cursos) => atualizar({ cursos }, 'Cursos atualizados.')}
              campos={[
                { nome: 'nome', rotulo: 'Curso ou certificação', obrigatorio: true },
                { nome: 'instituicao', rotulo: 'Instituição' },
                { nome: 'ano', rotulo: 'Ano', tipo: 'number', placeholder: '2025', max: 4 },
                { nome: 'link', rotulo: 'Link da credencial', tipo: 'url', placeholder: 'https://' },
              ]}
              renderizar={(item) => {
                const url = enderecoSeguro(item.link)
                return (
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <div>
                      <p className="font-semibold text-tinta">{item.nome}</p>
                      <p className="text-sm text-suave">{[item.instituicao, item.ano].filter(Boolean).join(' · ')}</p>
                    </div>
                    {url && (
                      <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
                        Credencial <Icone nome="externo" tamanho={14} />
                      </a>
                    )}
                  </div>
                )
              }}
            />
          </Secao>

          <Secao id="projetos" indice="06" titulo="Projetos e portfólio">
            <EditorItens
              itens={perfil.projetos}
              layout="grade"
              rotuloAdicionar="Adicionar projeto"
              vazio={<VazioSecao>Mostre o que você construiu: projetos pessoais, acadêmicos ou de trabalho.</VazioSecao>}
              aoMudar={(projetos) => atualizar({ projetos }, 'Projetos atualizados.')}
              campos={[
                { nome: 'nome', rotulo: 'Nome do projeto', obrigatorio: true },
                { nome: 'link', rotulo: 'Link', tipo: 'url', placeholder: 'https://' },
                { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea', largo: true, max: 300 },
              ]}
              renderizar={(item) => {
                const url = enderecoSeguro(item.link)
                return (
                  <div>
                    <p className="font-display text-xl text-tinta">
                      {url ? (
                        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-vinho">
                          {item.nome} <Icone nome="externo" tamanho={16} className="text-suave" />
                        </a>
                      ) : (
                        item.nome
                      )}
                    </p>
                    {item.descricao && <p className="mt-2 text-sm leading-relaxed text-tinta-2">{item.descricao}</p>}
                  </div>
                )
              }}
            />
          </Secao>

          <Secao id="curriculo" indice="07" titulo="Currículo">
            <div className="flex flex-col gap-4 rounded-lg border border-linha bg-branco p-5 sm:flex-row sm:items-center">
              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-blush text-vinho" aria-hidden="true">
                <Icone nome="documento" tamanho={22} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-tinta">{curriculo ? curriculo.name : 'Nenhum arquivo selecionado'}</p>
                <p className="text-sm text-suave">PDF, DOC ou DOCX. O arquivo fica disponível só nesta sessão até o envio ao servidor ser implementado.</p>
              </div>
              <input ref={arquivoCurriculo} type="file" accept=".pdf,.doc,.docx" hidden onChange={escolherCurriculo} />
              <div className="flex gap-2">
                <Botao variante="secundario" onClick={() => arquivoCurriculo.current?.click()}>
                  {curriculo ? 'Trocar' : 'Selecionar arquivo'}
                </Botao>
                {curriculo && (
                  <Botao
                    variante="fantasma"
                    onClick={() => {
                      setCurriculo(null)
                      if (arquivoCurriculo.current) arquivoCurriculo.current.value = ''
                      setMensagem({ tipo: 'info', texto: 'Currículo removido desta sessão.' })
                    }}
                  >
                    Remover
                  </Botao>
                )}
              </div>
            </div>
          </Secao>

          <div className="mt-4 flex flex-wrap gap-3 border-t border-linha pt-8">
            <Botao as={Link} to="/minhas-candidaturas" variante="secundario">
              Minhas candidaturas
            </Botao>
            <Botao as={Link} to="/vagas-salvas" variante="fantasma">
              Vagas salvas
            </Botao>
          </div>
        </div>
      </div>
    </Pagina>
  )
}

export default Perfil
