import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../Icone'
import { Aviso } from '../ui/Campo'
import Esqueleto from '../ui/Esqueleto'
import Avatar from './Avatar'
import { enderecoSeguro } from '../candidata/utilPerfil'
import { listarProjetosComunidade } from '../../services/recursos'

// Projetos de outras integrantes (perfis públicos): no Explorar (com busca)
// e no perfil de uma integrante ("autora"). Dados vêm de /api/comunidade/projetos.
function ProjetosIntegrantes({ busca = '', autora, limite, vazio }) {
  const [resultado, setResultado] = useState(null) // { chave, projetos } | { chave, erro }
  const chave = `${autora ?? ''}|${busca.trim()}`

  useEffect(() => {
    let ativo = true
    const espera = setTimeout(
      () =>
        listarProjetosComunidade({ busca: busca.trim(), autora })
          .then((projetos) => ativo && setResultado({ chave, projetos }))
          .catch((e) => ativo && setResultado({ chave, erro: e.message })),
      busca ? 300 : 0
    )
    return () => {
      ativo = false
      clearTimeout(espera)
    }
  }, [busca, autora, chave])

  if (!resultado || resultado.chave !== chave) return <Esqueleto className="h-40 rounded-xl" />
  if (resultado.erro) return <Aviso tipo="erro">{resultado.erro}</Aviso>
  const lista = limite ? resultado.projetos.slice(0, limite) : resultado.projetos
  if (!lista.length) {
    return <p className="rounded-xl border border-dashed border-linha-forte bg-branco px-5 py-6 text-sm text-suave">{vazio ?? (busca ? `Nenhum projeto menciona “${busca}”.` : 'Ainda não há projetos publicados.')}</p>
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {lista.map((p) => {
        const repositorio = enderecoSeguro(p.repositorio)
        const demo = enderecoSeguro(p.demo)
        return (
          <li key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-linha bg-branco">
            {p.imagem ? (
              <img src={p.imagem} alt={`Imagem do projeto ${p.nome}`} loading="lazy" className="aspect-[16/9] w-full object-cover" />
            ) : (
              <div className="grid aspect-[16/9] place-items-center bg-blush text-vinho" aria-hidden="true">
                <Icone nome="codigo" tamanho={36} />
              </div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-semibold text-tinta">{p.nome}</h3>
              {p.descricao && <p className="mt-1 line-clamp-3 text-sm text-tinta-2">{p.descricao}</p>}
              {p.tecnologias.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tecnologias">
                  {p.tecnologias.map((t) => (
                    <li key={t} className="rounded-full bg-papel-2 px-2.5 py-0.5 text-xs font-semibold text-tinta-2">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
                {!autora && (
                  <Link to={`/candidata/pessoas/${p.autora.id}`} className="mr-auto flex min-w-0 items-center gap-2 text-sm hover:text-vinho">
                    <Avatar nome={p.autora.nome} foto={p.autora.foto} tamanho="sm" />
                    <span className="truncate font-semibold">{p.autora.nome}</span>
                  </Link>
                )}
                {repositorio && (
                  <a href={repositorio} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
                    Código <Icone nome="externo" tamanho={13} />
                  </a>
                )}
                {demo && (
                  <a href={demo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
                    Ver online <Icone nome="externo" tamanho={13} />
                  </a>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default ProjetosIntegrantes
