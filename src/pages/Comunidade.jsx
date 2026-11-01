import { useCallback, useEffect, useState } from 'react'

import Icone from '../components/Icone'
import Avatar from '../components/comunidade/Avatar'
import CartaoPublicacao from '../components/comunidade/CartaoPublicacao'
import ListaPessoas from '../components/comunidade/ListaPessoas'
import PainelPerfil from '../components/comunidade/PainelPerfil'
import CabecalhoPagina from '../components/layout/CabecalhoPagina'
import Pagina from '../components/layout/Pagina'
import Abas from '../components/ui/Abas'
import Botao from '../components/ui/Botao'
import { Aviso, AreaTexto, Selecao } from '../components/ui/Campo'
import { Vazio, VazioDescricao, VazioIcone, VazioTitulo } from '../components/ui/Vazio'
import { fotos } from '../data/imagens'
import { useSessao } from '../hooks/useSessao'
import { LIMITE_PUBLICACAO, TIPOS, lerFeed, lerMeuPerfil, publicar } from '../services/comunidade'

const MODELOS = {
  dica: 'Compartilhe uma dica que ajudaria outra pessoa da área…',
  experiencia: 'Conte uma experiência: o que aprendeu e o que faria diferente…',
  projeto: 'Apresente um projeto em que está trabalhando…',
  conquista: 'Qual conquista você quer celebrar?',
  oportunidade: 'Compartilhe uma oportunidade: vaga, evento, curso ou mentoria…',
  duvida: 'Qual é a sua dúvida? Outras mulheres da área podem ajudar…',
}

function Comunidade() {
  const sessao = useSessao()
  const nome = sessao?.usuario?.nome ?? ''

  const [aba, setAba] = useState('todas')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [publicacoes, setPublicacoes] = useState(null)
  const [pagina, setPagina] = useState(1)
  const [temMais, setTemMais] = useState(false)
  const [erroFeed, setErroFeed] = useState('')
  const [carregandoMais, setCarregandoMais] = useState(false)

  const [meu, setMeu] = useState(null)
  const [erroPerfil, setErroPerfil] = useState('')

  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('dica')
  const [publicando, setPublicando] = useState(false)
  const [erroPublicar, setErroPublicar] = useState('')

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

  useEffect(() => {
    lerMeuPerfil()
      .then(setMeu)
      .catch((e) => setErroPerfil(e.message))
  }, [])

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
    try {
      const r = await publicar({ texto, tipo })
      setTexto('')
      const aparece = (!tipoFiltro || tipoFiltro === r.publicacao.tipo)
      if (aparece) setPublicacoes((lista) => [r.publicacao, ...(lista ?? [])])
      setMeu((m) => (m ? { ...m, numeros: { ...m.numeros, publicacoes: m.numeros.publicacoes + 1 } } : m))
    } catch (e) {
      setErroPublicar(e.message)
    } finally {
      setPublicando(false)
    }
  }

  function aoExcluir(id) {
    setPublicacoes((lista) => lista.filter((p) => p.id !== id))
    setMeu((m) => (m ? { ...m, numeros: { ...m.numeros, publicacoes: Math.max(0, m.numeros.publicacoes - 1) } } : m))
  }

  function aoMudarConexao(seguindo) {
    setMeu((m) => (m ? { ...m, numeros: { ...m.numeros, seguindo: m.numeros.seguindo + (seguindo ? 1 : -1) } } : m))
    if (aba === 'seguindo') carregarFeed()
  }

  return (
    <Pagina titulo="Comunidade">
      <CabecalhoPagina
        variante="retangular"
        foto={fotos.comoFunciona}
        rotulo="Comunidade"
        titulo={
          <>
            Troque experiências com quem <em className="text-vinho">constrói</em> a tecnologia.
          </>
        }
        descricao="Publique, converse e acompanhe outras mulheres da área: dicas, projetos, conquistas e oportunidades."
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <form onSubmit={enviar} className="border border-linha bg-branco p-5 sm:p-6" aria-label="Nova publicação">
            <div className="flex gap-3">
              <Avatar nome={nome} />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <label htmlFor="nova-publicacao" className="sr-only">
                  Escreva sua publicação
                </label>
                <AreaTexto
                  id="nova-publicacao"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  maxLength={LIMITE_PUBLICACAO}
                  placeholder={MODELOS[tipo]}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Selecao aria-label="Tipo de publicação" value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-10 w-auto min-w-40">
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
              </div>
            </div>
          </form>

          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-linha">
            <Abas
              className="border-b-0"
              rotulo="Feed"
              ativa={aba}
              aoTrocar={setAba}
              abas={[
                { id: 'todas', rotulo: 'Todas as publicações' },
                { id: 'seguindo', rotulo: 'Quem eu sigo' },
              ]}
            />
            <Selecao aria-label="Filtrar por tipo" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className="mb-2 h-9 w-auto min-w-40">
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
              <p className="py-10 text-center text-sm text-suave">Carregando publicações…</p>
            ) : publicacoes.length === 0 && !erroFeed ? (
              <Vazio>
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

        <aside className="flex flex-col gap-6 lg:col-span-4" aria-label="Seu perfil e conexões">
          {erroPerfil && <Aviso tipo="erro">{erroPerfil}</Aviso>}
          {meu && (
            <PainelPerfil
              key={meu.perfil.id}
              nome={nome}
              perfil={meu.perfil}
              numeros={meu.numeros}
              aoSalvar={(perfil) => setMeu((m) => ({ ...m, perfil }))}
            />
          )}
          <ListaPessoas aoMudarConexao={aoMudarConexao} />
        </aside>
      </div>
    </Pagina>
  )
}

export default Comunidade
