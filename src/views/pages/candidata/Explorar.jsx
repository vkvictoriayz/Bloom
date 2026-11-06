import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import { IconeAvatar } from '../../components/IconePerfil'
import LinhaVaga from '../../components/LinhaVaga'
import TituloPagina from '../../components/candidata/TituloPagina'
import CartaoPublicacao from '../../components/comunidade/CartaoPublicacao'
import ListaPessoas from '../../components/comunidade/ListaPessoas'
import { Aviso, estiloControle } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { correspondeBusca } from '../../data/vagas'
import { cn } from '../../lib/cn'
import { candidaturaDaVaga } from '../../services/candidaturas'
import { lerFeed } from '../../services/comunidade'
import { listarComunidades } from '../../services/recursos'
import { useCandidaturas, useVagas } from '../../hooks/useVagasReais'

const CATEGORIAS = [
  { id: 'tudo', rotulo: 'Tudo' },
  { id: 'profissionais', rotulo: 'Profissionais' },
  { id: 'publicacoes', rotulo: 'Publicações' },
  { id: 'vagas', rotulo: 'Vagas' },
  { id: 'projetos', rotulo: 'Projetos' },
  { id: 'comunidades', rotulo: 'Comunidades' },
]

function Bloco({ titulo, verTudo, children }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3 border-b border-linha pb-2">
        <h2 className="font-display text-2xl text-tinta">{titulo}</h2>
        {verTudo}
      </div>
      {children}
    </section>
  )
}

function AvisoVazio({ children }) {
  return <p className="rounded-xl border border-dashed border-linha-forte bg-branco px-5 py-6 text-sm text-suave">{children}</p>
}

// Busca nas publicações: a API ainda não pesquisa por texto, então
// procuramos entre as publicações mais recentes (primeira página do feed).
function Publicacoes({ busca, limite }) {
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    lerFeed()
      .then((r) => ativo && setLista(r.publicacoes))
      .catch((e) => {
        if (!ativo) return
        setErro(e.message)
        setLista([])
      })
    return () => {
      ativo = false
    }
  }, [])

  if (lista === null) return <Esqueleto className="h-32 rounded-xl" />
  if (erro) return <Aviso tipo="erro">{erro}</Aviso>

  const alvo = busca.trim().toLowerCase()
  const achadas = lista.filter((p) => !alvo || `${p.texto} ${p.autora.nome} ${p.autora.area}`.toLowerCase().includes(alvo))
  if (!achadas.length) return <AvisoVazio>{alvo ? `Nenhuma publicação recente menciona “${busca}”.` : 'Ainda não há publicações.'}</AvisoVazio>

  return (
    <div className="flex flex-col gap-4">
      {(limite ? achadas.slice(0, limite) : achadas).map((p) => (
        <CartaoPublicacao key={p.id} publicacao={p} aoExcluir={(id) => setLista((l) => l.filter((x) => x.id !== id))} />
      ))}
      {!limite && <p className="text-xs text-suave">A busca considera as publicações mais recentes.</p>}
    </div>
  )
}

// Comunidades temáticas que combinam com a busca (nome, tema ou descrição).
function ComunidadesBusca({ busca, limite }) {
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    listarComunidades()
      .then((r) => ativo && setLista(r.comunidades ?? []))
      .catch((e) => {
        if (!ativo) return
        setErro(e.message)
        setLista([])
      })
    return () => {
      ativo = false
    }
  }, [])

  if (lista === null) return <Esqueleto className="h-24 rounded-xl" />
  if (erro) return <Aviso tipo="erro">{erro}</Aviso>
  const alvo = busca.trim().toLowerCase()
  const achadas = lista.filter((c) => !alvo || `${c.nome} ${c.tema} ${c.descricao}`.toLowerCase().includes(alvo))
  if (!achadas.length) {
    return (
      <AvisoVazio>
        {alvo ? `Nenhuma comunidade sobre “${busca}”.` : 'Ainda não há comunidades.'}{' '}
        <Link to="/candidata/comunidades" className="font-semibold text-vinho hover:underline">
          Criar uma comunidade
        </Link>
      </AvisoVazio>
    )
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {(limite ? achadas.slice(0, limite) : achadas).map((c) => (
        <li key={c.id}>
          <Link to={`/comunidades/${c.id}`} className="flex h-full items-center gap-3 rounded-xl border border-linha bg-branco p-4 transition-colors hover:border-vinho/40">
            {c.icone ? (
              <IconeAvatar valor={c.icone} forma="quadrado" className="size-11" />
            ) : (
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blush text-vinho" aria-hidden="true">
                <Icone nome="grupo" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate font-semibold text-tinta">{c.nome}</span>
              <span className="block truncate text-xs text-suave">
                {c.tema} · {c.participantes} {c.participantes === 1 ? 'participante' : 'participantes'}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Explorar() {
  const [parametros, setParametros] = useSearchParams()
  const categoria = CATEGORIAS.some((c) => c.id === parametros.get('categoria')) ? parametros.get('categoria') : 'tudo'
  const busca = parametros.get('q') ?? ''
  const candidaturas = useCandidaturas()
  const { vagas: todasVagas } = useVagas()

  function definir(chave, valor) {
    const p = new URLSearchParams(parametros)
    if (valor && valor !== 'tudo') p.set(chave, valor)
    else p.delete(chave)
    setParametros(p, { replace: true })
  }

  const vagas = todasVagas.filter((v) => correspondeBusca(v, busca))
  const tudo = categoria === 'tudo'
  const verTudo = (id) =>
    tudo && (
      <button type="button" onClick={() => definir('categoria', id)} className="inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
        Ver tudo <Icone nome="seta" tamanho={14} />
      </button>
    )

  return (
    <>
      <TituloPagina titulo="Explorar" descricao="Descubra profissionais, publicações e vagas da comunidade Bloom." />

      <div className="relative">
        <Icone nome="busca" tamanho={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-suave" />
        <input
          type="search"
          value={busca}
          onChange={(e) => definir('q', e.target.value)}
          placeholder="Busque por nome, tecnologia, cargo ou assunto"
          aria-label="Buscar no Explorar"
          className={cn(estiloControle, 'h-12 pl-12 text-base')}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Categorias">
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={categoria === c.id}
            onClick={() => definir('categoria', c.id)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
              categoria === c.id ? 'border-tinta bg-tinta text-white' : 'border-linha-forte bg-branco text-tinta-2 hover:border-tinta'
            )}
          >
            {c.rotulo}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-10">
        {(tudo || categoria === 'profissionais') && (
          <ListaPessoas busca={busca} comBusca={false} limite={tudo ? 4 : undefined} titulo="Profissionais" rodape={verTudo('profissionais')} />
        )}

        {(tudo || categoria === 'vagas') && (
          <Bloco titulo="Vagas" verTudo={verTudo('vagas')}>
            {vagas.length === 0 ? (
              <AvisoVazio>Nenhuma vaga combina com “{busca}”.</AvisoVazio>
            ) : (
              <div className="rounded-xl border border-linha bg-branco px-5">
                {(tudo ? vagas.slice(0, 3) : vagas).map((vaga) => (
                  <LinhaVaga key={vaga.id} vaga={vaga} compacta candidatura={candidaturaDaVaga(vaga.id, candidaturas)} className="last:border-b-0" />
                ))}
              </div>
            )}
          </Bloco>
        )}

        {(tudo || categoria === 'publicacoes') && (
          <Bloco titulo="Publicações" verTudo={verTudo('publicacoes')}>
            <Publicacoes busca={busca} limite={tudo ? 2 : undefined} />
          </Bloco>
        )}

        {(tudo || categoria === 'projetos') && (
          <Bloco titulo="Projetos">
            <AvisoVazio>
              Ainda não é possível explorar projetos de outras integrantes: falta a API de projetos no backend. Os seus ficam em{' '}
              <Link to="/candidata/projetos" className="font-semibold text-vinho hover:underline">
                Meus projetos
              </Link>
              .
            </AvisoVazio>
          </Bloco>
        )}

        {(tudo || categoria === 'comunidades') && (
          <Bloco titulo="Comunidades" verTudo={verTudo('comunidades')}>
            <ComunidadesBusca busca={busca} limite={tudo ? 4 : undefined} />
          </Bloco>
        )}
      </div>
    </>
  )
}

export default Explorar
