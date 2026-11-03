import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../../components/Icone'
import MarcaEmpresa from '../../components/MarcaEmpresa'
import TituloPagina from '../../components/candidata/TituloPagina'
import Avatar from '../../components/comunidade/Avatar'
import CartaoPublicacao from '../../components/comunidade/CartaoPublicacao'
import ListaPessoas from '../../components/comunidade/ListaPessoas'
import Abas from '../../components/ui/Abas'
import Botao from '../../components/ui/Botao'
import { Aviso, AreaTexto, Selecao } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioDescricao, VazioIcone, VazioTitulo } from '../../components/ui/Vazio'
import { formatarPublicacao, listarVagas, recomendarVagas } from '../../data/vagas'
import { useDadosLocais } from '../../hooks/useDadosLocais'
import { primeiroNome, useSessao } from '../../hooks/useSessao'
import { LIMITE_PUBLICACAO, TIPOS, lerFeed, publicar } from '../../services/comunidade'
import { EVENTO_PERFIL, lerPerfil } from '../../services/perfil'

const MODELOS = {
  dica: 'Compartilhe uma dica que ajudaria outra pessoa da área…',
  experiencia: 'Conte uma experiência: o que aprendeu e o que faria diferente…',
  projeto: 'Apresente um projeto em que está trabalhando…',
  conquista: 'Qual conquista você quer celebrar?',
  oportunidade: 'Compartilhe uma oportunidade: vaga, evento, curso ou mentoria…',
  duvida: 'Qual é a sua dúvida? Outras mulheres da área podem ajudar…',
}

// Vagas recomendadas pelas competências do perfil; sem competências,
// mostramos as mais recentes e dizemos isso.
function VagasSugeridas({ tecnicas }) {
  const recomendadas = recomendarVagas(tecnicas)
  const porPerfil = recomendadas?.length > 0
  const itens = porPerfil
    ? recomendadas.map((r) => r.vaga)
    : [...listarVagas()].sort((a, b) => a.publicadaHaDias - b.publicadaHaDias).slice(0, 3)

  return (
    <section aria-labelledby="titulo-vagas-feed" className="rounded-xl border border-linha bg-branco p-5 sm:p-6">
      <h2 id="titulo-vagas-feed" className="font-display text-xl text-tinta">
        {porPerfil ? 'Vagas para você' : 'Vagas recentes'}
      </h2>
      {!porPerfil && (
        <p className="mt-1 text-xs text-suave">
          <Link to="/candidata/perfil/editar#competencias" className="font-semibold text-vinho hover:underline">
            Adicione competências
          </Link>{' '}
          para receber recomendações.
        </p>
      )}
      <ul className="mt-3 divide-y divide-linha">
        {itens.map((vaga) => (
          <li key={vaga.id}>
            <Link to={`/vagas/${vaga.id}`} className="group flex items-center gap-3 py-3">
              <MarcaEmpresa empresa={vaga.dadosEmpresa} tamanho="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-tinta group-hover:text-vinho">{vaga.titulo}</span>
                <span className="block truncate text-xs text-suave">
                  {vaga.dadosEmpresa.nomeCurto} · {vaga.modalidade} · {formatarPublicacao(vaga.publicadaHaDias)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/candidata/vagas" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
        Ver todas as vagas <Icone nome="seta" tamanho={14} />
      </Link>
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
  const [publicando, setPublicando] = useState(false)
  const [erroPublicar, setErroPublicar] = useState('')
  const [publicado, setPublicado] = useState(false)

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
    if (!texto.trim() || publicando) return
    setPublicando(true)
    setErroPublicar('')
    setPublicado(false)
    try {
      const r = await publicar({ texto, tipo })
      setTexto('')
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

  return (
    <>
      <TituloPagina titulo={`Olá, ${primeiroNome(nome) || 'boas-vindas'}`} descricao="Compartilhe aprendizados e acompanhe outras mulheres da tecnologia." />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Nova publicação */}
          <form onSubmit={enviar} className="rounded-xl border border-linha bg-branco p-5 sm:p-6" aria-label="Nova publicação">
            <div className="flex gap-3">
              <Avatar nome={nome} foto={perfil.foto} />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <label htmlFor="nova-publicacao" className="sr-only">
                  Escreva sua publicação
                </label>
                <AreaTexto
                  id="nova-publicacao"
                  value={texto}
                  onChange={(e) => {
                    setTexto(e.target.value)
                    setPublicado(false)
                  }}
                  maxLength={LIMITE_PUBLICACAO}
                  placeholder={MODELOS[tipo]}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Selecao aria-label="Tipo de publicação" value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-10 w-auto min-w-36">
                    {TIPOS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.rotulo}
                      </option>
                    ))}
                  </Selecao>
                  <span className="text-xs text-suave tabular-nums" aria-live="polite">
                    {texto.length}/{LIMITE_PUBLICACAO}
                  </span>
                  <Botao type="submit" className="ml-auto" disabled={!texto.trim() || publicando}>
                    {publicando ? 'Publicando…' : 'Publicar'}
                  </Botao>
                </div>
                {erroPublicar && <Aviso tipo="erro">{erroPublicar}</Aviso>}
                {publicado && <Aviso tipo="sucesso">Publicação enviada.</Aviso>}
              </div>
            </div>
          </form>

          {/* Filtros do feed */}
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-linha">
            <Abas
              className="border-b-0"
              rotulo="Feed"
              ativa={aba}
              aoTrocar={setAba}
              abas={[
                { id: 'todas', rotulo: 'Todas' },
                { id: 'seguindo', rotulo: 'Quem eu sigo' },
              ]}
            />
            <Selecao aria-label="Filtrar por tipo" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className="mb-2 h-9 w-auto min-w-36">
              <option value="">Todos os tipos</option>
              {TIPOS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.rotulo}
                </option>
              ))}
            </Selecao>
          </div>

          <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`} className="flex flex-col gap-4">
            {erroFeed && (
              <Aviso tipo="erro">
                {erroFeed}{' '}
                <button type="button" className="font-semibold underline underline-offset-4" onClick={carregarFeed}>
                  Tentar de novo
                </button>
              </Aviso>
            )}

            {publicacoes === null ? (
              [0, 1].map((i) => <Esqueleto key={i} className="h-40 rounded-xl" />)
            ) : publicacoes.length === 0 && !erroFeed ? (
              <Vazio className="bg-branco">
                <VazioIcone>
                  <Icone nome="mensagem" />
                </VazioIcone>
                <VazioTitulo>{aba === 'seguindo' ? 'Nada por aqui ainda' : 'Nenhuma publicação ainda'}</VazioTitulo>
                <VazioDescricao>
                  {aba === 'seguindo'
                    ? 'Siga outras integrantes para ver as publicações delas aqui.'
                    : 'Seja a primeira a compartilhar uma dica, um projeto ou uma conquista.'}
                </VazioDescricao>
              </Vazio>
            ) : (
              publicacoes.map((p) => <CartaoPublicacao key={p.id} publicacao={p} aoExcluir={aoExcluir} />)
            )}

            {temMais && (
              <Botao variante="secundario" className="self-center" onClick={maisPublicacoes} disabled={carregandoMais}>
                {carregandoMais ? 'Carregando…' : 'Ver mais publicações'}
              </Botao>
            )}
          </div>
        </div>

        {/* Coluna curta: pessoas e vagas */}
        <aside className="flex flex-col gap-6" aria-label="Sugestões">
          <ListaPessoas
            limite={4}
            comBusca={false}
            aoMudarConexao={() => aba === 'seguindo' && carregarFeed()}
            rodape={
              <Link to="/candidata/explorar?categoria=profissionais" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
                Ver mais profissionais <Icone nome="seta" tamanho={14} />
              </Link>
            }
          />
          <VagasSugeridas tecnicas={perfil.tecnicas} />
        </aside>
      </div>
    </>
  )
}

export default Feed
