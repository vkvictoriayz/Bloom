import { Link } from 'react-router-dom'

import Icone from '../../components/Icone'
import { IlustracaoCodigo } from '../../components/ilustracoes/Ilustracoes'
import TituloPagina from '../../components/candidata/TituloPagina'
import { enderecoSeguro, periodo } from '../../components/candidata/utilPerfil'
import Botao from '../../components/ui/Botao'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { useDadosLocais } from '../../hooks/useDadosLocais'
import { useSessao } from '../../hooks/useSessao'
import { EVENTO_PERFIL } from '../../services/perfil'
import { lerProjetos } from '../../services/projetos'

function Projetos() {
  const sessao = useSessao()
  const projetos = useDadosLocais(() => lerProjetos(sessao?.usuario), [EVENTO_PERFIL])

  return (
    <>
      <TituloPagina
        titulo="Meus projetos"
        descricao="Seu portfólio: projetos pessoais, acadêmicos e profissionais."
        acoes={
          projetos.length > 0 && (
            <Botao as={Link} to="/candidata/projetos/criar">
              <Icone nome="mais" tamanho={16} /> Novo projeto
            </Botao>
          )
        }
      />

      {projetos.length === 0 ? (
        <Vazio className="bg-branco">
          <IlustracaoCodigo className="max-w-[240px]" />
          <VazioTitulo>Comece seu portfólio</VazioTitulo>
          <VazioDescricao>Mostre o que você construiu: um site, uma análise de dados, um app ou um trabalho da faculdade.</VazioDescricao>
          <VazioAcoes>
            <Botao as={Link} to="/candidata/projetos/criar">
              <Icone nome="mais" tamanho={16} /> Adicionar projeto
            </Botao>
          </VazioAcoes>
        </Vazio>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {projetos.map((p) => {
            const repo = enderecoSeguro(p.repositorio)
            const demo = enderecoSeguro(p.demo)
            return (
              <li key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-linha bg-branco">
                <div className="aspect-[16/9] bg-papel-2">
                  {p.imagem ? (
                    <img src={p.imagem} alt={`Imagem do projeto ${p.nome}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-linha-forte" aria-hidden="true">
                      <Icone nome="codigo" tamanho={40} />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-display text-xl text-tinta">{p.nome}</h2>
                  {(p.inicio || p.fim) && <p className="text-xs text-suave">{periodo(p.inicio, p.fim, 'em andamento')}</p>}
                  {p.descricao && <p className="mt-2 line-clamp-3 text-sm text-tinta-2">{p.descricao}</p>}
                  {p.tecnologias.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {p.tecnologias.map((t) => (
                        <li key={t} className="rounded-full bg-papel-2 px-2.5 py-0.5 text-xs font-semibold text-tinta-2">
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-5 text-sm font-semibold">
                    {repo && (
                      <a href={repo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-vinho hover:underline">
                        Repositório <Icone nome="externo" tamanho={13} />
                      </a>
                    )}
                    {demo && (
                      <a href={demo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-vinho hover:underline">
                        Demonstração <Icone nome="externo" tamanho={13} />
                      </a>
                    )}
                    <Link to={`/candidata/projetos/${encodeURIComponent(p.id)}/editar`} className="ml-auto inline-flex items-center gap-1 text-tinta-2 hover:text-tinta">
                      <Icone nome="editar" tamanho={15} /> Editar
                    </Link>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <p className="mt-6 flex items-start gap-2 text-xs text-suave">
        <Icone nome="info" tamanho={16} className="mt-px shrink-0" />
        Os projetos ficam salvos na sua conta e aparecem para a empresa quando você se candidata a uma vaga dela.
      </p>
    </>
  )
}

export default Projetos
