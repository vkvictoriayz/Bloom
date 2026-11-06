import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../../components/Icone'
import MarcaEmpresa from '../../components/MarcaEmpresa'
import { AnexoImagem } from '../../components/comunidade/AnexoImagem'
import Avatar from '../../components/comunidade/Avatar'
import CartaoPublicacao from '../../components/comunidade/CartaoPublicacao'
import ListaPessoas from '../../components/comunidade/ListaPessoas'
import { ICONE_TIPO } from '../../components/comunidade/tipos'
import Botao from '../../components/ui/Botao'
import { Aviso, Selecao } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioDescricao, VazioIcone, VazioTitulo } from '../../components/ui/Vazio'
import { formatarPublicacao, recomendarVagas } from '../../data/vagas'
import { useDadosLocais } from '../../hooks/useDadosLocais'
import { useVagas } from '../../hooks/useVagasReais'
import { useSessao } from '../../hooks/useSessao'
import { LIMITE_PUBLICACAO, TIPOS, lerFeed, publicar } from '../../services/comunidade'
import { EVENTO_PERFIL, lerPerfil } from '../../services/perfil'
import { cn } from '../../lib/cn'

const MODELOS = {
  dica: 'Compartilhe uma dica que ajudaria outra mulher da área…',
  experiencia: 'Conte uma experiência: o que aprendeu e o que faria diferente…',
  projeto: 'Apresente um projeto ou portfólio em que está trabalhando…',
  conquista: 'Qual conquista profissional você quer celebrar?',
  oportunidade: 'Compartilhe uma oportunidade: vaga, evento, curso ou mentoria…',
  duvida: 'Qual é a sua dúvida? Outras mulheres da área podem ajudar…',
}

// Depois de quais publicações entram os cartões de sugestão.
const POSICAO_PESSOAS = 1
const POSICAO_VAGAS = 3

// Vagas recomendadas pelas competências do perfil; sem competências,
// mostramos as mais recentes e dizemos isso.
function CartaoVagas({ tecnicas }) {
  const { vagas } = useVagas()
  const recomendadas = recomendarVagas(vagas, tecnicas)
  const porPerfil = recomendadas?.length > 0
  const itens = porPerfil
    ? recomendadas.map((r) => r.vaga)
    : [...vagas].sort((a, b) => a.publicadaHaDias - b.publicadaHaDias).slice(0, 3)
  // Sem vagas publicadas, o cartão não aparece.
  if (itens.length === 0) return null

  return (
    <section aria-labelledby="titulo-vagas-feed" className="rounded-2xl border border-linha bg-branco p-5 sm:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="titulo-vagas-feed" className="font-display text-xl text-tinta">
            {porPerfil ? 'Vagas para você' : 'Vagas recentes'}
          </h2>
          {!porPerfil && (
            <p className="mt-0.5 text-xs text-suave">
              <Link to="/candidata/perfil/editar#competencias" className="font-semibold text-vinho hover:underline">
                Adicione competências
              </Link>{' '}
              para receber recomendações.
            </p>
          )}
        </div>
        <Link to="/candidata/vagas" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-vinho hover:underline">
          Ver todas <Icone nome="seta" tamanho={14} />
        </Link>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {itens.map((vaga) => (
          <li key={vaga.id}>
            <Link to={`/vagas/${vaga.id}`} className="group flex h-full flex-col rounded-xl border border-linha p-4 transition-colors hover:border-vinho/40 hover:bg-papel">
              <MarcaEmpresa empresa={vaga.dadosEmpresa} tamanho="sm" />
              <span className="mt-3 line-clamp-2 text-sm font-semibold text-tinta group-hover:text-vinho">{vaga.titulo}</span>
              <span className="mt-auto pt-2 text-xs text-suave">
                {vaga.dadosEmpresa.nomeCurto} · {vaga.modalidade} · {formatarPublicacao(vaga.publicadaHaDias)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Feed() {
  const sessao = useSessao()
  const nome = sessao?.usuario?.nome ?? ''
  const perfil = useDadosLocais(() => lerPerfil(sessao?.usuario), [EVENTO_PERFIL])

  const [aba, setAba] = useState('todas')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [publicacoes, setPublicacoes] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [temMais, setTemMais] = useState(false)
  const [erroFeed, setErroFeed] = useState('')
  const [carregandoMais, setCarregandoMais] = useState(false)

  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('dica')
  const [imagem, setImagem] = useState(null)
  const [publicando, setPublicando] = useState(false)
  const [erroPublicar, setErroPublicar] = useState('')
  const [publicado, setPublicado] = useState(false)

  useEffect(() => {
    document.title = 'Feed · BLOOM'
  }, [])

  const carregarFeed = useCallback(async () => {
    setErroFeed('')
    setPublicacoes(null)
    try {
      const r = await lerFeed({ filtro: aba === 'seguindo' ? 'seguindo' : '', tipo: tipoFiltro })
      setPublicacoes(r.publicacoes)
      setTemMais(r.temMais)
      setPagina(1)
    } catch (e) {
      setErroFeed(e.message)
      setPublicacoes([])
    }
  }, [aba, tipoFiltro])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarFeed()
  }, [carregarFeed])

  async function maisPublicacoes() {
    setCarregandoMais(true)
    try {
      const r = await lerFeed({ filtro: aba === 'seguindo' ? 'seguindo' : '', tipo: tipoFiltro, pagina: pagina + 1 })
      setPublicacoes((lista) => [...lista, ...r.publicacoes])
      setTemMais(r.temMais)
      setPagina((p) => p + 1)
    } catch (e) {
      setErroFeed(e.message)
    } finally {
      setCarregandoMais(false)
    }
  }

  async function enviar(evento) {
    evento.preventDefault()
    if ((!texto.trim() && !imagem) || publicando) return
    setPublicando(true)
    setErroPublicar('')
    setPublicado(false)
    try {
      const corpo = { texto, tipo, ...(imagem ? { imagem: imagem.dataUrl, largura: imagem.largura, altura: imagem.altura } : {}) }
      const r = await publicar(corpo)
      setTexto('')
      setImagem(null)
      setPublicado(true)
      if (!tipoFiltro || tipoFiltro === r.publicacao.tipo) setPublicacoes((lista) => [r.publicacao, ...(lista ?? [])])
    } catch (e) {
      setErroPublicar(e.message)
    } finally {
      setPublicando(false)
    }
  }

  function aoExcluir(id) {
    setPublicacoes((lista) => lista.filter((p) => p.id !== id))
  }

  function aoAtualizar(nova) {
    setPublicacoes((lista) => lista.map((p) => (p.id === nova.id ? nova : p)))
  }

  const cartaoPessoas = (
    <ListaPessoas
      grade
      limite={3}
      comBusca={false}
      titulo="Pessoas para conhecer"
      aoMudarConexao={() => aba === 'seguindo' && carregarFeed()}
      rodape={
        <Link to="/candidata/explorar?categoria=profissionais" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
          Ver mais profissionais <Icone nome="seta" tamanho={14} />
        </Link>
      }
    />
  )
  const cartaoVagas = <CartaoVagas tecnicas={perfil.tecnicas} />
  const lista = publicacoes ?? []

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <h1 className="sr-only">Feed</h1>

      {/* Nova publicação */}
      <form onSubmit={enviar} className="rounded-2xl border border-linha bg-branco p-5 sm:p-6" aria-label="Nova publicação">
        <div className="flex gap-4">
          <Avatar nome={nome} foto={perfil.foto} tamanho="lg" className="max-sm:size-12 max-sm:text-base" />
          <div className="min-w-0 flex-1">
            <label htmlFor="nova-publicacao" className="sr-only">
              Escreva sua publicação
            </label>
            <textarea
              id="nova-publicacao"
              value={texto}
              rows={texto ? 4 : 2}
              onChange={(e) => {
                setTexto(e.target.value)
                setPublicado(false)
              }}
              maxLength={LIMITE_PUBLICACAO}
              placeholder={MODELOS[tipo]}
              className="w-full resize-none rounded-xl border border-transparent bg-papel-2 px-4 py-3 text-[15px] leading-relaxed text-tinta placeholder:text-suave transition-colors hover:border-linha-forte focus:border-vinho focus:bg-branco focus:ring-[3px] focus:ring-vinho/20 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 sm:pl-[80px]">
          {imagem && (
            <div className="mb-4">
              <AnexoImagem id="imagem-nova-publicacao" valor={imagem} aoMudar={setImagem} desabilitado={publicando} />
            </div>
          )}
          <div role="radiogroup" aria-label="Tipo de publicação" className="-mx-1 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
            {TIPOS.map((t) => {
              const ativo = tipo === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => setTipo(t.id)}
                  className={cn(
                    'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors',
                    ativo ? 'bg-blush text-vinho' : 'text-tinta-2 hover:bg-papel-2 hover:text-tinta'
                  )}
                >
                  <Icone nome={ICONE_TIPO[t.id]} tamanho={16} />
                  {t.rotulo}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-end gap-3 border-t border-linha pt-3">
            {!imagem && (
              <div className="mr-auto -ml-3">
                <AnexoImagem id="imagem-nova-publicacao" valor={null} aoMudar={setImagem} desabilitado={publicando} />
              </div>
            )}
            <span className="text-xs text-suave tabular-nums" aria-live="polite">
              {texto.length}/{LIMITE_PUBLICACAO}
            </span>
            <Botao type="submit" disabled={(!texto.trim() && !imagem) || publicando} className="rounded-full px-5">
              {publicando ? 'Publicando…' : 'Publicar'} <Icone nome="seta" tamanho={16} />
            </Botao>
          </div>
        </div>
        {erroPublicar && (
          <Aviso tipo="erro" className="mt-4">
            {erroPublicar}
          </Aviso>
        )}
        {publicado && (
          <Aviso tipo="sucesso" className="mt-4">
            Publicação enviada.
          </Aviso>
        )}
      </form>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Quais publicações mostrar" className="flex rounded-full border border-linha bg-branco p-1">
          {[
            { id: 'todas', rotulo: 'Para você' },
            { id: 'seguindo', rotulo: 'Quem eu sigo' },
          ].map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={aba === a.id}
              onClick={() => setAba(a.id)}
              className={cn(
                'h-9 rounded-full px-4 text-sm font-semibold transition-colors',
                aba === a.id ? 'bg-vinho text-white' : 'text-tinta-2 hover:text-tinta'
              )}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
        <Selecao aria-label="Filtrar por tipo" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className="h-10 w-auto min-w-40 rounded-full">
          <option value="">Todos os tipos</option>
          {TIPOS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.rotulo}
            </option>
          ))}
        </Selecao>
      </div>

      {/* Publicações, com sugestões entre elas */}
      <div className="flex flex-col gap-5">
        {erroFeed && (
          <Aviso tipo="erro">
            {erroFeed}{' '}
            <button type="button" className="font-semibold underline underline-offset-4" onClick={carregarFeed}>
              Tentar de novo
            </button>
          </Aviso>
        )}

        {publicacoes === null ? (
          [0, 1].map((i) => <Esqueleto key={i} className="h-44 rounded-2xl" />)
        ) : lista.length === 0 ? (
          <>
            {!erroFeed && (
              <Vazio className="bg-branco">
                <VazioIcone>
                  <Icone nome="mensagem" />
                </VazioIcone>
                <VazioTitulo>{aba === 'seguindo' ? 'Nada por aqui ainda' : 'Nenhuma publicação ainda'}</VazioTitulo>
                <VazioDescricao>
                  {aba === 'seguindo'
                    ? 'Siga outras integrantes para ver as publicações delas aqui.'
                    : 'Seja a primeira a compartilhar um projeto, uma conquista ou uma dica.'}
                </VazioDescricao>
              </Vazio>
            )}
            {cartaoPessoas}
            {cartaoVagas}
          </>
        ) : (
          <>
            {lista.map((p, i) => (
              <Fragment key={p.id}>
                <CartaoPublicacao publicacao={p} aoExcluir={aoExcluir} aoAtualizar={aoAtualizar} />
                {i === POSICAO_PESSOAS && cartaoPessoas}
                {i === POSICAO_VAGAS && cartaoVagas}
              </Fragment>
            ))}
            {lista.length <= POSICAO_PESSOAS && cartaoPessoas}
            {lista.length <= POSICAO_VAGAS && cartaoVagas}
          </>
        )}

        {temMais && (
          <Botao variante="secundario" className="self-center rounded-full" onClick={maisPublicacoes} disabled={carregandoMais}>
            {carregandoMais ? 'Carregando…' : 'Ver mais publicações'}
          </Botao>
        )}
      </div>
    </div>
  )
}

export default Feed
