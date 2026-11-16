import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import { IconeAvatar } from '../../components/IconePerfil'
import { AcaoComMotivo, Filtros, Paginacao } from '../../components/admin/Comuns'
import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import { Entrada } from '../../components/ui/Campo'
import Selo from '../../components/ui/Selo'
import { urlImagem } from '../../services/api'
import {
  dataHora,
  listarComentariosAdmin,
  listarComunidadesAdmin,
  listarPublicacoesAdmin,
  listarVagasAdmin,
  moderarVaga,
  removerComentarioAdmin,
  removerComunidadeAdmin,
  removerPublicacaoAdmin,
} from '../../services/admin'

function useParametros(chaves) {
  const [p, setP] = useSearchParams()
  const valores = Object.fromEntries(chaves.map((c) => [c, p.get(c) ?? '']))
  valores.pagina = Number(p.get('pagina')) || 1
  function definir(chave, valor) {
    const n = new URLSearchParams(p)
    if (valor) n.set(chave, valor)
    else n.delete(chave)
    if (chave !== 'pagina') n.delete('pagina')
    setP(n, { replace: true })
  }
  return [valores, definir]
}

function Busca({ valor, aoMudar, placeholder }) {
  const [termo, setTermo] = useState(valor)
  return (
    <form
      role="search"
      className="relative min-w-0 flex-1"
      onSubmit={(e) => {
        e.preventDefault()
        aoMudar(termo.trim())
      }}
    >
      <Icone nome="busca" tamanho={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-suave" />
      <Entrada type="search" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="pl-10" />
    </form>
  )
}

const VAZIO = (texto) => <p className="rounded-xl border border-dashed border-linha-forte bg-branco px-5 py-6 text-sm text-suave">{texto}</p>

// ------------------------------------------------------------ Vagas

const STATUS = [
  ['', 'Todas'],
  ['Aberta', 'Abertas'],
  ['Pausada', 'Pausadas'],
  ['Encerrada', 'Encerradas'],
  ['Rascunho', 'Rascunhos'],
]
const COR_STATUS = { Aberta: 'sucesso', Pausada: 'alerta', Encerrada: 'neutro', Rascunho: 'contorno' }

export function VagasAdmin() {
  const [f, definir] = useParametros(['busca', 'status'])
  const r = useCarregar(() => listarVagasAdmin({ busca: f.busca, status: f.status, pagina: f.pagina }), [f.busca, f.status, f.pagina])
  const [avisos, setAvisos] = useState({})

  return (
    <>
      <TituloPagina titulo="Vagas" descricao="Todas as vagas da plataforma. A equipe pode pausar ou encerrar uma vaga que fere as regras; a empresa é avisada com o motivo." />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Busca key={f.busca} valor={f.busca} aoMudar={(v) => definir('busca', v)} placeholder="Buscar pelo título da vaga" />
        <Filtros opcoes={STATUS} valor={f.status} aoMudar={(v) => definir('status', v)} rotulo="Status da vaga" />
      </div>
      {r.tipo === 'carregando' && <Carregando quantidade={4} altura="h-20" />}
      {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {r.tipo === 'pronto' &&
        (r.dados.vagas.length === 0 ? (
          VAZIO('Nenhuma vaga encontrada.')
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {r.dados.vagas.map((v) => (
                <li key={v.id} className="rounded-xl border border-linha bg-branco p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-tinta">{v.titulo}</p>
                      <p className="text-sm text-suave">
                        {v.empresa ? (
                          <Link to={`/admin/empresas/${v.empresa.id}`} className="font-semibold text-vinho hover:underline">
                            {v.empresa.nome}
                          </Link>
                        ) : (
                          'Empresa removida'
                        )}
                        {' · '}
                        {v.modalidade || 'Modalidade não informada'} · {v.candidaturas} candidatura{v.candidaturas === 1 ? '' : 's'}
                        {v.dataPublicacao && ` · publicada em ${new Date(`${v.dataPublicacao}T12:00`).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                    <Selo variante={COR_STATUS[v.status] ?? 'neutro'}>{v.status}</Selo>
                  </div>
                  {(v.status === 'Aberta' || v.status === 'Pausada') && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {v.status === 'Aberta' && (
                        <AcaoComMotivo
                          rotulo="Pausar"
                          perigo={false}
                          aoConfirmar={(motivo) => moderarVaga(v.id, 'Pausada', motivo)}
                          aoConcluir={() => {
                            setAvisos((a) => ({ ...a, [v.id]: 'Vaga pausada. A empresa foi avisada.' }))
                            r.recarregar()
                          }}
                        />
                      )}
                      <AcaoComMotivo
                        rotulo="Encerrar"
                        aoConfirmar={(motivo) => moderarVaga(v.id, 'Encerrada', motivo)}
                        aoConcluir={() => {
                          setAvisos((a) => ({ ...a, [v.id]: 'Vaga encerrada. A empresa foi avisada.' }))
                          r.recarregar()
                        }}
                      />
                    </div>
                  )}
                  {avisos[v.id] && (
                    <p role="status" className="mt-2 text-sm text-sucesso">
                      {avisos[v.id]}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <Paginacao pagina={f.pagina} total={r.dados.total} porPagina={r.dados.porPagina} aoMudar={(p) => definir('pagina', String(p))} />
          </>
        ))}
    </>
  )
}

// ------------------------------------------------------------ Publicações

function Comentarios({ publicacaoId, aoMudarTotal }) {
  const r = useCarregar(() => listarComentariosAdmin(publicacaoId), [publicacaoId])
  if (r.tipo === 'carregando') return <p className="text-sm text-suave">Carregando comentários…</p>
  if (r.tipo === 'erro') return <p className="text-sm text-erro">{r.erro}</p>
  if (!r.dados.comentarios.length) return <p className="text-sm text-suave">Sem comentários.</p>
  return (
    <ul className="flex flex-col gap-2">
      {r.dados.comentarios.map((c) => (
        <li key={c.id} className="rounded-lg bg-papel px-3 py-2.5 text-sm">
          <p>
            <span className="font-semibold text-tinta">{c.autor.nome}</span> <span className="text-xs text-suave">· {dataHora(c.criadoEm)}</span>
          </p>
          <p className="mt-0.5 whitespace-pre-line text-tinta-2">{c.texto}</p>
          <div className="mt-2">
            <AcaoComMotivo
              rotulo="Remover comentário"
              rotuloConfirmar="Remover"
              aoConfirmar={(motivo) => removerComentarioAdmin(c.id, motivo)}
              aoConcluir={(resposta) => {
                aoMudarTotal(resposta.comentarios)
                r.recarregar()
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function CartaoPublicacaoAdmin({ p, aoRemover }) {
  const [abertos, setAbertos] = useState(false)
  const [total, setTotal] = useState(p.comentarios)
  return (
    <li className="rounded-xl border border-linha bg-branco p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm">
          <Link to={p.origem === 'empresa' ? `/admin/empresas/${p.autor.id}` : `/admin/candidatas/${p.autor.id}`} className="font-semibold text-tinta hover:text-vinho hover:underline">
            {p.autor.nome}
          </Link>{' '}
          <span className="text-suave">
            · {dataHora(p.criadaEm)}
            {p.comunidade && ` · na comunidade ${p.comunidade}`}
          </span>
        </p>
        <Selo>{p.tipo}</Selo>
      </div>
      {p.texto && <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-tinta">{p.texto}</p>}
      {p.imagem && (
        <a href={urlImagem(p.imagem)} target="_blank" rel="noreferrer" className="mt-3 block w-fit">
          <img src={urlImagem(p.imagem)} alt="Imagem da publicação" loading="lazy" className="max-h-48 rounded-lg border border-linha object-contain" />
        </a>
      )}
      <div className="mt-3 flex flex-wrap items-start gap-2">
        {p.origem === 'candidata' && (
          <button type="button" aria-expanded={abertos} onClick={() => setAbertos((v) => !v)} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-tinta-2 hover:bg-blush hover:text-vinho">
            <Icone nome="mensagem" tamanho={16} /> {total} comentário{total === 1 ? '' : 's'}
          </button>
        )}
        <AcaoComMotivo rotulo="Remover publicação" rotuloConfirmar="Remover" aoConfirmar={(motivo) => removerPublicacaoAdmin(p.origem, p.id, motivo)} aoConcluir={() => aoRemover(p.id)} />
      </div>
      {abertos && (
        <div className="mt-3 border-t border-linha pt-3">
          <Comentarios publicacaoId={p.id} aoMudarTotal={setTotal} />
        </div>
      )}
    </li>
  )
}

export function PublicacoesAdmin() {
  const [f, definir] = useParametros(['busca', 'origem'])
  const origem = f.origem === 'empresas' ? 'empresas' : 'candidatas'
  const r = useCarregar(() => listarPublicacoesAdmin({ busca: f.busca, origem, pagina: f.pagina }), [f.busca, origem, f.pagina])
  const [removidas, setRemovidas] = useState([])

  return (
    <>
      <TituloPagina titulo="Publicações" descricao="Feed, comunidades e publicações de empresas. Remover avisa a autora com o motivo." />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Busca key={f.busca} valor={f.busca} aoMudar={(v) => definir('busca', v)} placeholder="Buscar no texto das publicações" />
        <Filtros
          opcoes={[
            ['candidatas', 'De candidatas'],
            ['empresas', 'De empresas'],
          ]}
          valor={origem}
          aoMudar={(v) => definir('origem', v === 'candidatas' ? '' : v)}
          rotulo="Origem"
        />
      </div>
      {r.tipo === 'carregando' && <Carregando quantidade={3} altura="h-28" />}
      {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {r.tipo === 'pronto' &&
        (() => {
          const lista = r.dados.publicacoes.filter((p) => !removidas.includes(`${p.origem}-${p.id}`))
          return lista.length === 0 ? (
            VAZIO('Nenhuma publicação encontrada.')
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {lista.map((p) => (
                  <CartaoPublicacaoAdmin key={`${p.origem}-${p.id}`} p={p} aoRemover={() => setRemovidas((l) => [...l, `${p.origem}-${p.id}`])} />
                ))}
              </ul>
              <Paginacao pagina={f.pagina} total={r.dados.total} porPagina={r.dados.porPagina} aoMudar={(pg) => definir('pagina', String(pg))} />
            </>
          )
        })()}
    </>
  )
}

// ------------------------------------------------------------ Comunidades

export function ComunidadesAdmin() {
  const [f, definir] = useParametros(['busca'])
  const r = useCarregar(() => listarComunidadesAdmin(f.busca), [f.busca])

  return (
    <>
      <TituloPagina titulo="Comunidades" descricao="Grupos temáticos criados pelas candidatas. Remover a comunidade mantém as publicações no feed e avisa quem criou." />
      <div className="mb-4">
        <Busca key={f.busca} valor={f.busca} aoMudar={(v) => definir('busca', v)} placeholder="Buscar por nome ou tema" />
      </div>
      {r.tipo === 'carregando' && <Carregando quantidade={3} altura="h-24" />}
      {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {r.tipo === 'pronto' &&
        (r.dados.comunidades.length === 0 ? (
          VAZIO('Nenhuma comunidade encontrada.')
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {r.dados.comunidades.map((c) => (
              <li key={c.id} className="flex flex-col rounded-xl border border-linha bg-branco p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  {c.icone ? (
                    <IconeAvatar valor={c.icone} forma="quadrado" className="size-11" />
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blush text-vinho" aria-hidden="true">
                      <Icone nome="grupo" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-tinta">{c.nome}</p>
                    <p className="truncate text-xs text-suave">
                      {c.tema} · {c.participantes} participante{c.participantes === 1 ? '' : 's'} · {c.publicacoes} publicaç{c.publicacoes === 1 ? 'ão' : 'ões'}
                    </p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-tinta-2">{c.descricao}</p>
                <p className="mt-2 text-xs text-suave">
                  Criada por{' '}
                  <Link to={`/admin/candidatas/${c.criadora.id}`} className="font-semibold text-vinho hover:underline">
                    {c.criadora.nome}
                  </Link>{' '}
                  em {dataHora(c.criadaEm)}
                </p>
                <div className="mt-3">
                  <AcaoComMotivo rotulo="Remover comunidade" rotuloConfirmar="Remover" aoConfirmar={(motivo) => removerComunidadeAdmin(c.id, motivo)} aoConcluir={r.recarregar} />
                </div>
              </li>
            ))}
          </ul>
        ))}
    </>
  )
}
