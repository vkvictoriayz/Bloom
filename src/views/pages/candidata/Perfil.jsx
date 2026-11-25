import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../../components/Icone'
import Capa from '../../components/candidata/Capa'
import { enderecoSeguro, LINKS, periodo } from '../../components/candidata/utilPerfil'
import Avatar from '../../components/comunidade/Avatar'
import CartaoPublicacao from '../../components/comunidade/CartaoPublicacao'
import Botao from '../../components/ui/Botao'
import { Aviso } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { useDadosLocais } from '../../hooks/useDadosLocais'
import { useSessao } from '../../hooks/useSessao'
import { lerFeed, lerMeuPerfil } from '../../services/comunidade'
import { completude, EVENTO_PERFIL, lerPerfil } from '../../services/perfil'
import { lerProjetos } from '../../services/projetos'

function Secao({ titulo, vazio, ancoraEdicao, children }) {
  return (
    <section className="rounded-2xl border border-linha bg-branco p-6 sm:p-7">
      <h2 className="mb-5 font-display text-2xl text-tinta">{titulo}</h2>
      {vazio ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-linha-forte px-4 py-4">
          <p className="text-sm text-suave">{vazio}</p>
          <Link to={`/candidata/perfil/editar#${ancoraEdicao}`} className="text-sm font-semibold text-vinho underline-offset-4 hover:underline">
            Adicionar
          </Link>
        </div>
      ) : (
        children
      )}
    </section>
  )
}

function Perfil() {
  const sessao = useSessao()
  const usuario = sessao?.usuario
  const perfil = useDadosLocais(() => lerPerfil(usuario), [EVENTO_PERFIL])
  const projetos = useDadosLocais(() => lerProjetos(usuario), [EVENTO_PERFIL])
  const { percentual, pendentes } = completude(perfil)

  const [comunidade, setComunidade] = useState(null)
  const [erroComunidade, setErroComunidade] = useState('')
  const [publicacoes, setPublicacoes] = useState(null)

  useEffect(() => {
    document.title = 'Meu perfil · BLOOM'
    let ativo = true
    lerMeuPerfil()
      .then((r) => ativo && setComunidade(r))
      .catch((e) => ativo && setErroComunidade(e.message))
    lerFeed({ autora: 'eu' })
      .then((r) => ativo && setPublicacoes(r.publicacoes.filter((p) => p.minha)))
      .catch(() => ativo && setPublicacoes([]))
    return () => {
      ativo = false
    }
  }, [])

  const area = comunidade?.perfil?.area
  const interesses = comunidade?.perfil?.interesses ?? []
  const links = LINKS.map((l) => ({ ...l, url: enderecoSeguro(perfil.links[l.chave]) })).filter((l) => l.url)
  const competencias = [...perfil.tecnicas, ...perfil.comportamentais]

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-xl border border-linha bg-branco">
        <Capa imagem={perfil.capa} className="rounded-none" />
        <div className="px-6 pb-7 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Avatar nome={perfil.nome} foto={perfil.foto} tamanho="xl" className="relative z-10 -mt-14 ring-4 ring-branco sm:-mt-16" />
            <Botao as={Link} to="/candidata/perfil/editar" variante="secundario" className="self-start sm:self-auto">
              <Icone nome="editar" tamanho={16} /> Editar perfil
            </Botao>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl leading-tight text-tinta">{perfil.nome || usuario?.nome}</h1>
          </div>
          <p className={perfil.cargo ? 'mt-1 text-lg text-vinho' : 'mt-1 text-suave italic'}>
            {perfil.cargo || 'Título profissional ainda não informado'}
          </p>

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-tinta-2">
            {area && (
              <li className="inline-flex items-center gap-1.5">
                <Icone nome="maleta" className="text-vinho" /> {area}
              </li>
            )}
            {perfil.local && (
              <li className="inline-flex items-center gap-1.5">
                <Icone nome="local" className="text-vinho" /> {perfil.local}
              </li>
            )}
            <li className="inline-flex items-center gap-1.5">
              <Icone nome="email" className="text-vinho" /> {perfil.email || usuario?.email}
            </li>
          </ul>

          {links.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {links.map((link) => (
                <li key={link.chave}>
                  <a href={link.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-linha-forte px-3 text-sm font-semibold hover:border-vinho hover:text-vinho">
                    {link.rotulo} <Icone nome="externo" tamanho={14} />
                  </a>
                </li>
              ))}
            </ul>
          )}

          {comunidade && (
            <dl className="mt-6 grid max-w-md grid-cols-3 divide-x divide-linha border-t border-linha pt-4 text-center">
              {[
                ['Publicações', comunidade.numeros.publicacoes, null],
                ['Seguidoras', comunidade.numeros.seguidoras, 'seguidoras'],
                ['Seguindo', comunidade.numeros.seguindo, 'seguindo'],
              ].map(([rotulo, valor, aba]) =>
                aba ? (
                  <Link key={rotulo} to={`/candidata/pessoas/${comunidade.perfil.id}/conexoes?aba=${aba}`} className="flex flex-col-reverse rounded-md hover:bg-papel">
                    <dt className="text-xs text-suave">{rotulo}</dt>
                    <dd className="font-display text-2xl text-tinta tabular-nums">{valor}</dd>
                  </Link>
                ) : (
                  <div key={rotulo} className="flex flex-col-reverse">
                    <dt className="text-xs text-suave">{rotulo}</dt>
                    <dd className="font-display text-2xl text-tinta tabular-nums">{valor}</dd>
                  </div>
                )
              )}
            </dl>
          )}
          {erroComunidade && (
            <Aviso tipo="erro" className="mt-4">
              Não foi possível carregar os dados da comunidade: {erroComunidade}
            </Aviso>
          )}
        </div>
      </section>

      {percentual < 100 && (
        <section className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-linha bg-branco p-6 sm:flex-row sm:items-center sm:p-7" aria-label="Completude do perfil">
          <svg viewBox="0 0 100 100" className="size-24 shrink-0" role="img" aria-label={`Perfil ${percentual}% completo`}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="#ffffff" strokeWidth="9" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#85243d" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(percentual / 100) * 263.9} 263.9`} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray .8s cubic-bezier(.22,1,.36,1)' }} />
            <text x="50" y="50" dy="0.35em" textAnchor="middle" fontSize="22" fontWeight="700" fill="#1f1a1c">
              {percentual}%
            </text>
          </svg>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl text-tinta">Complete seu perfil</p>
            <p className="mt-1 text-sm text-tinta-2">Perfis completos aparecem melhor para as empresas. Faltam {pendentes.length} {pendentes.length === 1 ? 'item' : 'itens'}:</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {pendentes.map((p) => (
                <li key={p.id}>
                  <Link to={`/candidata/perfil/editar#${p.ancora}`} className="inline-flex items-center gap-1.5 rounded-full bg-branco px-3 py-1.5 text-xs font-semibold text-vinho ring-1 ring-vinho/20 transition-colors hover:bg-vinho hover:text-white">
                    <Icone nome="mais" tamanho={12} /> {p.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Botao as={Link} to="/candidata/perfil/editar" className="self-start sm:self-center">
            Completar perfil
          </Botao>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Secao titulo="Resumo profissional" vazio={!perfil.sobre && 'Conte quem você é e o que busca.'} ancoraEdicao="resumo">
            <p className="leading-relaxed whitespace-pre-line text-tinta-2">{perfil.sobre}</p>
            {perfil.objetivo && (
              <p className="mt-4 border-l-2 border-vinho pl-4 font-display text-lg text-tinta italic">{perfil.objetivo}</p>
            )}
            {interesses.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Interesses">
                {interesses.map((i) => (
                  <li key={i} className="rounded-full bg-papel-2 px-3 py-1 text-xs font-semibold text-tinta-2">
                    {i}
                  </li>
                ))}
              </ul>
            )}
          </Secao>
        </div>

        <Secao titulo="Experiência" vazio={!perfil.experiencias.length && 'Nenhuma experiência adicionada.'} ancoraEdicao="experiencias">
          <ol className="flex flex-col gap-5">
            {perfil.experiencias.map((e, i) => (
              <li key={i}>
                <p className="font-semibold text-tinta">{e.cargo}</p>
                <p className="text-sm text-vinho">{e.empresa}</p>
                <p className="text-xs text-suave">{periodo(e.inicio, e.fim)}</p>
                {e.descricao && <p className="mt-1.5 text-sm text-tinta-2">{e.descricao}</p>}
              </li>
            ))}
          </ol>
        </Secao>

        <Secao titulo="Formação acadêmica" vazio={!perfil.formacoes.length && 'Nenhuma formação adicionada.'} ancoraEdicao="formacao">
          <ol className="flex flex-col gap-5">
            {perfil.formacoes.map((f, i) => (
              <li key={i}>
                <p className="font-semibold text-tinta">{f.curso}</p>
                <p className="text-sm text-vinho">
                  {f.instituicao}
                  {f.nivel && <span className="text-suave"> · {f.nivel}</span>}
                </p>
                <p className="text-xs text-suave">{periodo(f.inicio, f.conclusao, 'cursando')}</p>
              </li>
            ))}
          </ol>
        </Secao>

        <Secao titulo="Competências" vazio={!competencias.length && 'Nenhuma competência adicionada.'} ancoraEdicao="competencias">
          <ul className="flex flex-wrap gap-2">
            {perfil.tecnicas.map((t) => (
              <li key={t} className="rounded-full bg-vinho px-3 py-1 text-sm font-semibold text-white">
                {t}
              </li>
            ))}
            {perfil.comportamentais.map((t) => (
              <li key={t} className="rounded-full border border-linha-forte px-3 py-1 text-sm font-semibold text-tinta">
                {t}
              </li>
            ))}
          </ul>
        </Secao>

        <Secao titulo="Cursos e certificações" vazio={!perfil.cursos.length && 'Nenhum curso adicionado.'} ancoraEdicao="cursos">
          <ul className="flex flex-col gap-3">
            {perfil.cursos.map((c, i) => {
              const url = enderecoSeguro(c.link)
              return (
                <li key={i} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    <span className="block font-semibold text-tinta">{c.nome}</span>
                    <span className="text-sm text-suave">{[c.instituicao, c.ano].filter(Boolean).join(' · ')}</span>
                  </span>
                  {url && (
                    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
                      Credencial <Icone nome="externo" tamanho={14} />
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        </Secao>

        <div className="lg:col-span-2">
          <Secao titulo="Projetos e portfólio" vazio={!projetos.length && 'Nenhum projeto adicionado.'} ancoraEdicao="projetos">
            <ul className="grid gap-4 sm:grid-cols-2">
              {projetos.map((p) => (
                <li key={p.id} className="overflow-hidden rounded-lg border border-linha">
                  {p.imagem && <img src={p.imagem} alt="" className="aspect-[16/9] w-full object-cover" />}
                  <div className="p-4">
                    <p className="font-semibold text-tinta">{p.nome}</p>
                    {p.descricao && <p className="mt-1 line-clamp-2 text-sm text-tinta-2">{p.descricao}</p>}
                    {p.tecnologias.length > 0 && <p className="mt-2 text-xs text-suave">{p.tecnologias.join(' · ')}</p>}
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/candidata/projetos" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
              Gerenciar projetos <Icone nome="seta" tamanho={14} />
            </Link>
          </Secao>
        </div>
      </div>

      <section aria-labelledby="titulo-minhas-publicacoes">
        <h2 id="titulo-minhas-publicacoes" className="mb-4 font-display text-2xl text-tinta">
          Minhas publicações
        </h2>
        {publicacoes === null ? (
          <Esqueleto className="h-32 rounded-xl" />
        ) : publicacoes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-linha-forte bg-branco px-5 py-6 text-sm text-suave">
            Você ainda não publicou nada.{' '}
            <Link to="/candidata/feed" className="font-semibold text-vinho hover:underline">
              Escrever no feed
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {publicacoes.map((p) => (
              <CartaoPublicacao key={p.id} publicacao={p} aoExcluir={(id) => setPublicacoes((l) => l.filter((x) => x.id !== id))} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Perfil
