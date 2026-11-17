import { Link, useOutletContext } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import Capa from '../../components/candidata/Capa'
import Avatar from '../../components/comunidade/Avatar'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import Botao from '../../components/ui/Botao'
import Selo from '../../components/ui/Selo'
import { dataCurta, fotoEmpresa, listarPublicacoesEmpresa, listarVagasEmpresa, VISUAL_VAGA } from '../../services/empresa'
import { tempoRelativo } from '../../services/comunidade'

function Perfil() {
  const { perfil: dados, erroPerfil, recarregarPerfil } = useOutletContext()
  const vagas = useCarregar(() => listarVagasEmpresa())
  const pubs = useCarregar(listarPublicacoesEmpresa)

  if (erroPerfil) {
    return (
      <>
        <TituloPagina titulo="Perfil da empresa" />
        <ErroAoCarregar erro={erroPerfil} aoTentar={recarregarPerfil} />
      </>
    )
  }
  if (!dados) return <Carregando quantidade={2} altura="h-48" />

  const { empresa, perfil, numeros } = dados
  let host = ''
  try {
    host = perfil.site ? new URL(perfil.site).hostname.replace(/^www\./, '') : ''
  } catch {
    host = ''
  }

  return (
    <>
      <TituloPagina titulo="Perfil da empresa" descricao="É assim que sua empresa aparece na Bloom." />

      <section className="cartao overflow-hidden">
        <Capa imagem={dados.imagens?.capa} className="rounded-none" />
        <div className="px-6 pb-7 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Avatar nome={empresa.nome} foto={fotoEmpresa(dados)} tamanho="xl" className="relative z-10 -mt-14 rounded-2xl bg-branco ring-4 ring-branco sm:-mt-16 [&]:rounded-2xl" />
            <Botao as={Link} to="/empresa/perfil/editar" variante="secundario" className="self-start sm:self-auto">
              <Icone nome="editar" tamanho={16} /> Editar perfil
            </Botao>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl leading-tight text-tinta">{empresa.nome}</h1>
            {empresa.premium && (
              <Selo variante="vinho">
                <Icone nome="coroa" tamanho={14} /> Premium
              </Selo>
            )}
          </div>
          {perfil.areaAtuacao && <p className="mt-1 font-semibold text-vinho">{perfil.areaAtuacao}</p>}
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-tinta-2">
            {perfil.localizacao && (
              <li className="inline-flex items-center gap-1.5">
                <Icone nome="local" className="text-vinho" /> {perfil.localizacao}
              </li>
            )}
            {host && (
              <li>
                <a href={perfil.site} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-vinho hover:underline">
                  <Icone nome="link" /> {host}
                </a>
              </li>
            )}
            {perfil.linkedin && (
              <li>
                <a href={perfil.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-vinho hover:underline">
                  <Icone nome="externo" /> LinkedIn
                </a>
              </li>
            )}
            <li className="inline-flex items-center gap-1.5">
              <Icone nome="email" className="text-vinho" /> {perfil.emailContato || empresa.email}
            </li>
          </ul>
          <p className={perfil.descricao ? 'mt-5 max-w-3xl leading-relaxed text-tinta-2' : 'mt-5 text-sm text-suave'}>
            {perfil.descricao || 'Adicione uma descrição para apresentar a empresa às candidatas.'}
          </p>
          {perfil.informacoes && <p className="mt-3 max-w-3xl text-sm leading-relaxed whitespace-pre-line text-tinta-2">{perfil.informacoes}</p>}
          <dl className="mt-6 grid max-w-lg grid-cols-3 divide-x divide-linha border-t border-linha pt-4 text-center">
            {[
              ['Vagas abertas', numeros.vagasAbertas],
              ['Candidaturas', numeros.candidaturas],
              ['Publicações', numeros.publicacoes],
            ].map(([rotulo, valor]) => (
              <div key={rotulo} className="flex flex-col-reverse">
                <dt className="text-xs text-suave">{rotulo}</dt>
                <dd className="font-display text-2xl text-tinta tabular-nums">{valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="cartao p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-tinta">Vagas divulgadas</h2>
            <Link to="/empresa/vagas" className="text-sm font-semibold text-vinho hover:underline">
              Gerenciar
            </Link>
          </div>
          {vagas.tipo === 'carregando' && <Carregando quantidade={2} altura="h-14" />}
          {vagas.tipo === 'erro' && <ErroAoCarregar erro={vagas.erro} aoTentar={vagas.recarregar} />}
          {vagas.tipo === 'pronto' &&
            (vagas.dados.vagas.length === 0 ? (
              <p className="text-sm text-suave">
                Nenhuma vaga ainda.{' '}
                <Link to="/empresa/vagas/criar" className="font-semibold text-vinho hover:underline">
                  Criar a primeira
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-linha">
                {vagas.dados.vagas.slice(0, 5).map((v) => (
                  <li key={v.id}>
                    <Link to={`/empresa/vagas/${v.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-vinho">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{v.titulo}</span>
                        <span className="block text-xs text-suave">
                          {[v.localizacao, v.modalidade, dataCurta(v.dataPublicacao)].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <Selo variante={VISUAL_VAGA[v.status]?.variante}>{v.status}</Selo>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
        </section>

        <section className="cartao p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-tinta">Publicações</h2>
            <Link to="/empresa/publicacoes" className="text-sm font-semibold text-vinho hover:underline">
              Ver todas
            </Link>
          </div>
          {pubs.tipo === 'carregando' && <Carregando quantidade={2} altura="h-14" />}
          {pubs.tipo === 'erro' && <ErroAoCarregar erro={pubs.erro} aoTentar={pubs.recarregar} />}
          {pubs.tipo === 'pronto' &&
            (pubs.dados.publicacoes.length === 0 ? (
              <p className="text-sm text-suave">
                Nenhuma publicação ainda.{' '}
                <Link to="/empresa/publicacoes/criar" className="font-semibold text-vinho hover:underline">
                  Publicar agora
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-linha">
                {pubs.dados.publicacoes.slice(0, 4).map((p) => (
                  <li key={p.id} className="py-3">
                    <p className="line-clamp-2 text-sm text-tinta">{p.texto}</p>
                    <p className="mt-1 text-xs text-suave">{tempoRelativo(p.criadaEm)}</p>
                  </li>
                ))}
              </ul>
            ))}
        </section>
      </div>
    </>
  )
}

export default Perfil
