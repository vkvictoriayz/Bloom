import Icone from '../Icone'
import { enderecoSeguro, LINKS, periodo } from '../candidata/utilPerfil'

function Bloco({ titulo, children }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-tinta">{titulo}</h3>
      <div className="mt-2">{children}</div>
    </div>
  )
}

// Perfil profissional da candidata, visto pela empresa que recebeu a
// candidatura (dados da API: resumo, competências, experiência, formação,
// cursos, links e projetos). Só mostra as partes preenchidas.
function PerfilProfissional({ perfil }) {
  if (!perfil) return null
  const links = LINKS.map((l) => ({ ...l, url: enderecoSeguro(perfil.links?.[l.chave]) })).filter((l) => l.url)
  const vazio =
    !perfil.sobre && !perfil.objetivo && !perfil.tecnicas.length && !perfil.comportamentais.length && !perfil.experiencias.length &&
    !perfil.formacoes.length && !perfil.cursos.length && !perfil.projetos.length && !links.length

  return (
    <section className="cartao flex flex-col gap-6 p-6">
      <div>
        <h2 className="font-display text-xl text-tinta">Perfil profissional</h2>
        {(perfil.cargo || perfil.local) && <p className="mt-1 text-sm text-suave">{[perfil.cargo, perfil.local].filter(Boolean).join(' · ')}</p>}
      </div>
      {vazio && <p className="text-sm text-suave">A candidata ainda não preencheu o perfil profissional.</p>}
      {perfil.sobre && (
        <Bloco titulo="Resumo">
          <p className="leading-relaxed whitespace-pre-line text-tinta-2">{perfil.sobre}</p>
        </Bloco>
      )}
      {perfil.objetivo && (
        <Bloco titulo="Objetivo">
          <p className="leading-relaxed text-tinta-2">{perfil.objetivo}</p>
        </Bloco>
      )}
      {(perfil.tecnicas.length > 0 || perfil.comportamentais.length > 0) && (
        <Bloco titulo="Competências">
          <ul className="flex flex-wrap gap-2">
            {perfil.tecnicas.map((t) => (
              <li key={`t-${t}`} className="rounded-full bg-blush px-3 py-1 text-sm font-semibold text-vinho">
                {t}
              </li>
            ))}
            {perfil.comportamentais.map((c) => (
              <li key={`c-${c}`} className="rounded-full border border-linha-forte px-3 py-1 text-sm text-tinta-2">
                {c}
              </li>
            ))}
          </ul>
        </Bloco>
      )}
      {perfil.experiencias.length > 0 && (
        <Bloco titulo="Experiência">
          <ul className="flex flex-col gap-3">
            {perfil.experiencias.map((x, i) => (
              <li key={i}>
                <p className="font-semibold text-tinta">
                  {x.cargo} · {x.empresa}
                </p>
                <p className="text-xs text-suave">{periodo(x.inicio, x.fim)}</p>
                {x.descricao && <p className="mt-1 text-sm text-tinta-2">{x.descricao}</p>}
              </li>
            ))}
          </ul>
        </Bloco>
      )}
      {perfil.formacoes.length > 0 && (
        <Bloco titulo="Formação">
          <ul className="flex flex-col gap-3">
            {perfil.formacoes.map((f, i) => (
              <li key={i}>
                <p className="font-semibold text-tinta">{f.curso}</p>
                <p className="text-sm text-tinta-2">{[f.instituicao, f.nivel].filter(Boolean).join(' · ')}</p>
                <p className="text-xs text-suave">{periodo(f.inicio, f.conclusao, 'cursando')}</p>
              </li>
            ))}
          </ul>
        </Bloco>
      )}
      {perfil.cursos.length > 0 && (
        <Bloco titulo="Cursos e certificações">
          <ul className="flex flex-col gap-1.5 text-sm text-tinta-2">
            {perfil.cursos.map((c, i) => (
              <li key={i}>
                <span className="font-semibold text-tinta">{c.nome}</span>
                {[c.instituicao, c.ano].filter(Boolean).length > 0 && ` · ${[c.instituicao, c.ano].filter(Boolean).join(' · ')}`}
                {c.link && (
                  <a href={c.link} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-vinho hover:underline">
                    credencial <Icone nome="externo" tamanho={12} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Bloco>
      )}
      {perfil.projetos.length > 0 && (
        <Bloco titulo="Projetos">
          <ul className="grid gap-3 sm:grid-cols-2">
            {perfil.projetos.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-xl border border-linha">
                {p.imagem && <img src={p.imagem} alt="" className="aspect-[16/9] w-full object-cover" />}
                <div className="p-4">
                  <p className="font-semibold text-tinta">{p.nome}</p>
                  {p.descricao && <p className="mt-1 line-clamp-3 text-sm text-tinta-2">{p.descricao}</p>}
                  {p.tecnologias.length > 0 && <p className="mt-2 text-xs text-suave">{p.tecnologias.join(' · ')}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    {p.repositorio && (
                      <a href={p.repositorio} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-vinho hover:underline">
                        Código <Icone nome="externo" tamanho={12} />
                      </a>
                    )}
                    {p.demo && (
                      <a href={p.demo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-vinho hover:underline">
                        Demonstração <Icone nome="externo" tamanho={12} />
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Bloco>
      )}
      {links.length > 0 && (
        <Bloco titulo="Links">
          <ul className="flex flex-wrap gap-2">
            {links.map((l) => (
              <li key={l.chave}>
                <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-linha-forte px-3.5 text-sm font-semibold hover:border-vinho hover:text-vinho">
                  {l.rotulo} <Icone nome="externo" tamanho={13} />
                </a>
              </li>
            ))}
          </ul>
        </Bloco>
      )}
    </section>
  )
}

export default PerfilProfissional
