import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../Icone'
import { IconeAvatar } from '../IconePerfil'
import Avatar from './Avatar'
import ListaPessoas from './ListaPessoas'
import Capa from '../candidata/Capa'
import Progresso from '../ui/Progresso'
import { lerEmAlta, lerMeuPerfil, linkAssunto } from '../../services/comunidade'
import { completude } from '../../services/perfil'
import { listarComunidades, participarComunidade } from '../../services/recursos'
import { cn } from '../../lib/cn'

const cartao = 'rounded-2xl border border-linha bg-branco'
const tituloCartao = 'font-display text-lg text-tinta'

function Numero({ valor, rotulo, para }) {
  const conteudo = (
    <>
      <span className="block font-display text-xl text-tinta tabular-nums">{valor ?? '–'}</span>
      <span className="text-xs text-suave">{rotulo}</span>
    </>
  )
  return para ? (
    <Link to={para} className="rounded-lg px-1 py-1 text-center transition-colors hover:bg-papel">
      {conteudo}
    </Link>
  ) : (
    <div className="px-1 py-1 text-center">{conteudo}</div>
  )
}

function MeuPerfil({ nome, perfil }) {
  const [dados, setDados] = useState(null)
  useEffect(() => {
    let ativo = true
    lerMeuPerfil()
      .then((r) => ativo && setDados(r))
      .catch(() => ativo && setDados({ falhou: true }))
    return () => {
      ativo = false
    }
  }, [])
  const id = dados?.perfil?.id
  const numeros = dados?.numeros

  return (
    <section className={cn(cartao, 'overflow-hidden')} aria-label="Seu perfil">
      <Capa imagem={perfil.capa} className="h-16 rounded-none sm:h-16" />
      <div className="-mt-8 flex flex-col items-center px-5 pb-5 text-center">
        <Link to="/candidata/perfil" className="relative z-10 rounded-full ring-4 ring-branco" aria-label="Ver meu perfil">
          <Avatar nome={nome} foto={perfil.foto} tamanho="lg" />
        </Link>
        <Link to="/candidata/perfil" className="mt-2 font-bold text-tinta hover:text-vinho hover:underline">
          {nome}
        </Link>
        <p className="line-clamp-2 text-sm text-suave">{perfil.cargo?.trim() || dados?.perfil?.area || 'Conte o que você faz no seu perfil'}</p>
        <div className="mt-4 grid w-full grid-cols-3 border-t border-linha pt-3">
          <Numero valor={numeros?.publicacoes} rotulo="publicações" para="/candidata/perfil" />
          <Numero valor={numeros?.seguidoras} rotulo="seguidoras" para={id ? `/candidata/pessoas/${id}/conexoes?aba=seguidoras` : null} />
          <Numero valor={numeros?.seguindo} rotulo="seguindo" para={id ? `/candidata/pessoas/${id}/conexoes?aba=seguindo` : null} />
        </div>
      </div>
    </section>
  )
}

function CompletarPerfil({ perfil }) {
  const { percentual, pendentes } = completude(perfil)
  if (percentual >= 100) return null
  return (
    <section className={cn(cartao, 'p-5')} aria-labelledby="titulo-completar">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="titulo-completar" className={tituloCartao}>
          Complete seu perfil
        </h2>
        <span className="text-sm font-semibold text-vinho tabular-nums">{percentual}%</span>
      </div>
      <Progresso valor={percentual} rotulo="Completude do perfil" className="mt-3" />
      <p className="mt-3 text-xs text-suave">Perfis completos aparecem mais para empresas e outras integrantes.</p>
      <ul className="mt-3 flex flex-col gap-1">
        {pendentes.slice(0, 3).map((item) => (
          <li key={item.id}>
            <Link
              to={`/candidata/perfil/editar#${item.ancora}`}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-tinta-2 transition-colors hover:bg-papel hover:text-vinho"
            >
              <span aria-hidden="true" className="size-4 shrink-0 rounded-full border-2 border-linha-forte" />
              {item.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function EmAlta() {
  const [assuntos, setAssuntos] = useState(null)
  useEffect(() => {
    let ativo = true
    lerEmAlta()
      .then((r) => ativo && setAssuntos(r.assuntos))
      .catch(() => ativo && setAssuntos([]))
    return () => {
      ativo = false
    }
  }, [])
  if (assuntos === null) return null

  return (
    <section className={cn(cartao, 'p-5')} aria-labelledby="titulo-em-alta">
      <h2 id="titulo-em-alta" className={tituloCartao}>
        Assuntos em alta
      </h2>
      {assuntos.length === 0 ? (
        <p className="mt-2 text-sm text-suave">
          Use <span className="font-semibold text-vinho">#assunto</span> nas suas publicações (como #react ou #primeiroemprego) para os temas da rede aparecerem aqui.
        </p>
      ) : (
        <ol className="mt-3 flex flex-col">
          {assuntos.map((a, i) => (
            <li key={a.tag}>
              <Link to={linkAssunto(a.tag)} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-papel">
                <span className="w-4 text-xs font-bold text-suave tabular-nums">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-tinta">#{a.tag}</span>
                  <span className="text-xs text-suave">
                    {a.publicacoes} {a.publicacoes === 1 ? 'publicação' : 'publicações'} nas últimas 2 semanas
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function Comunidades() {
  const [lista, setLista] = useState(null)
  const [ocupada, setOcupada] = useState(null)
  const [erro, setErro] = useState('')
  useEffect(() => {
    let ativo = true
    listarComunidades()
      .then((r) => ativo && setLista(r.comunidades))
      .catch(() => ativo && setLista([]))
    return () => {
      ativo = false
    }
  }, [])
  if (lista === null) return null
  const sugestoes = lista.filter((c) => !c.participando).slice(0, 3)

  async function participar(c) {
    setOcupada(c.id)
    setErro('')
    try {
      await participarComunidade(c.id)
      setLista((atual) => atual.map((x) => (x.id === c.id ? { ...x, participando: true, participantes: x.participantes + 1 } : x)))
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupada(null)
    }
  }

  return (
    <section className={cn(cartao, 'p-5')} aria-labelledby="titulo-comunidades-feed">
      <h2 id="titulo-comunidades-feed" className={tituloCartao}>
        Comunidades para você
      </h2>
      {sugestoes.length === 0 ? (
        <p className="mt-2 text-sm text-suave">
          {lista.length === 0 ? 'Ainda não há comunidades. Que tal criar a primeira?' : 'Você já participa de todas as comunidades.'}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {sugestoes.map((c) => (
            <li key={c.id} className="flex items-center gap-3">
              <Link to={`/comunidades/${c.id}`} className="shrink-0" aria-label={`Abrir ${c.nome}`}>
                {c.icone ? (
                  <IconeAvatar valor={c.icone} forma="quadrado" className="size-10" />
                ) : (
                  <span className="grid size-10 place-items-center rounded-lg bg-blush text-vinho">
                    <Icone nome="grupo" tamanho={18} />
                  </span>
                )}
              </Link>
              <span className="min-w-0 flex-1">
                <Link to={`/comunidades/${c.id}`} className="block truncate text-sm font-bold text-tinta hover:text-vinho hover:underline">
                  {c.nome}
                </Link>
                <span className="block truncate text-xs text-suave">
                  {c.participantes} {c.participantes === 1 ? 'participante' : 'participantes'} · {c.tema}
                </span>
              </span>
              <button
                type="button"
                onClick={() => participar(c)}
                disabled={ocupada === c.id}
                className="h-8 shrink-0 rounded-full border border-linha-forte px-3 text-xs font-semibold text-tinta-2 transition-colors hover:border-vinho hover:text-vinho disabled:opacity-60"
                aria-label={`Participar de ${c.nome}`}
              >
                {ocupada === c.id ? '…' : 'Participar'}
              </button>
            </li>
          ))}
        </ul>
      )}
      {erro && <p className="mt-2 text-xs text-erro">{erro}</p>}
      <Link to="/candidata/comunidades" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
        {lista.length === 0 ? 'Criar comunidade' : 'Ver todas'} <Icone nome="seta" tamanho={14} />
      </Link>
    </section>
  )
}

function LateralFeed({ nome, perfil, aoMudarConexao }) {
  return (
    <div className="flex flex-col gap-5">
      <MeuPerfil nome={nome} perfil={perfil} />
      <CompletarPerfil perfil={perfil} />
      <EmAlta />
      <Comunidades />
      <ListaPessoas
        limite={3}
        comBusca={false}
        titulo="Quem seguir"
        aoMudarConexao={aoMudarConexao}
        rodape={
          <Link to="/candidata/explorar?categoria=profissionais" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
            Ver mais profissionais <Icone nome="seta" tamanho={14} />
          </Link>
        }
      />
      <p className="px-2 text-xs text-suave">
        <Link to="/candidata/configuracoes" className="hover:text-vinho hover:underline">
          Configurações
        </Link>
        {' · '}
        <Link to="/candidata/comunidades" className="hover:text-vinho hover:underline">
          Comunidades
        </Link>
        <span className="mt-1 block">Bloom · rede de mulheres na tecnologia</span>
      </p>
    </div>
  )
}

export default LateralFeed
