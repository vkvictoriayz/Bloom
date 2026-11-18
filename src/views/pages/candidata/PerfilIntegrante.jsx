import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import Capa from '../../components/candidata/Capa'
import Avatar from '../../components/comunidade/Avatar'
import SeloPremium from '../../components/conta/SeloPremium'
import BotaoSeguir from '../../components/comunidade/BotaoSeguir'
import CartaoPublicacao from '../../components/comunidade/CartaoPublicacao'
import ProjetosIntegrantes from '../../components/comunidade/ProjetosIntegrantes'
import Botao from '../../components/ui/Botao'
import { Aviso } from '../../components/ui/Campo'
import Denunciar from '../../components/conta/Denunciar'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { definirSeguindo, lerFeed, lerPerfilIntegrante } from '../../services/comunidade'
import { abrirConversaCandidata } from '../../services/recursos'

function PerfilIntegrante() {
  const { id } = useParams()
  return <ConteudoPerfil key={id} id={id} />
}

function ConteudoPerfil({ id }) {
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
  const [publicacoes, setPublicacoes] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [erroAcao, setErroAcao] = useState('')

  useEffect(() => {
    let ativo = true
    lerPerfilIntegrante(id)
      .then((r) => ativo && setDados(r))
      .catch((e) => ativo && setErro(e.message))
    lerFeed({ autora: id })
      .then((r) => ativo && setPublicacoes(r.publicacoes))
      .catch(() => ativo && setPublicacoes([]))
    return () => {
      ativo = false
    }
  }, [id])

  useEffect(() => {
    if (dados?.perfil) document.title = `${dados.perfil.nome} · BLOOM`
  }, [dados])

  if (erro) {
    return (
      <Vazio className="bg-branco">
        <VazioTitulo>Perfil não encontrado</VazioTitulo>
        <VazioDescricao>Esta integrante não existe ou deixou o perfil privado.</VazioDescricao>
        <VazioAcoes>
          <Botao as={Link} to="/candidata/explorar?categoria=profissionais">
            Explorar profissionais
          </Botao>
        </VazioAcoes>
      </Vazio>
    )
  }
  if (!dados) return <Esqueleto className="h-80 rounded-xl" />
  if (dados.souEu) return <Navigate to="/candidata/perfil" replace />

  const { perfil, numeros } = dados

  async function alternarSeguir() {
    setOcupado(true)
    setErroAcao('')
    try {
      const r = await definirSeguindo(perfil.id, !dados.seguindo)
      setDados((d) => ({ ...d, seguindo: r.seguindo, numeros: { ...d.numeros, seguidoras: r.seguidoras } }))
    } catch (e) {
      setErroAcao(e.message)
    } finally {
      setOcupado(false)
    }
  }

  async function mandarMensagem() {
    setOcupado(true)
    setErroAcao('')
    try {
      const r = await abrirConversaCandidata(perfil.id)
      navigate(`/candidata/mensagens/candidatas/${r.conversa.id}`)
    } catch (e) {
      setErroAcao(e.message)
      setOcupado(false)
    }
  }

  const conexoes = (aba) => `/candidata/pessoas/${perfil.id}/conexoes?aba=${aba}`

  return (
    <div className="flex flex-col gap-6">
      <Link to="/candidata/explorar?categoria=profissionais" className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-suave hover:text-tinta">
        <Icone nome="voltar" tamanho={16} /> Profissionais
      </Link>

      <section className="overflow-hidden rounded-xl border border-linha bg-branco">
        <Capa imagem={perfil.capa} className="rounded-none" />
        <div className="px-6 pb-7 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Avatar nome={perfil.nome} foto={perfil.foto} tamanho="xl" className="relative z-10 -mt-14 ring-4 ring-branco sm:-mt-16" />
            <div className="flex flex-wrap gap-2">
              <BotaoSeguir nome={perfil.nome} seguindo={dados.seguindo} aoAlternar={alternarSeguir} ocupado={ocupado} className="min-w-32" />
              <Botao variante="secundario" onClick={mandarMensagem} disabled={ocupado}>
                <Icone nome="mensagem" tamanho={16} /> Mensagem
              </Botao>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl leading-tight text-tinta">{perfil.nome}</h1>
            {perfil.premium && <SeloPremium />}
          </div>
          <p className={perfil.area ? 'mt-1 text-lg text-vinho' : 'mt-1 text-suave italic'}>{perfil.area || 'Área não informada'}</p>
          {dados.segueVoce && <p className="mt-2 inline-flex rounded-full bg-papel-2 px-2.5 py-0.5 text-xs font-semibold text-tinta-2">Segue você</p>}
          {perfil.bio && <p className="mt-4 max-w-2xl leading-relaxed text-tinta-2">{perfil.bio}</p>}
          {perfil.interesses.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Interesses">
              {perfil.interesses.map((i) => (
                <li key={i} className="rounded-full border border-linha-forte px-2.5 py-0.5 text-xs font-medium text-tinta-2">
                  {i}
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-6 grid max-w-md grid-cols-3 divide-x divide-linha border-t border-linha pt-4 text-center">
            <div className="flex flex-col-reverse">
              <dt className="text-xs text-suave">Publicações</dt>
              <dd className="font-display text-2xl text-tinta tabular-nums">{numeros.publicacoes}</dd>
            </div>
            <Link to={conexoes('seguidoras')} className="flex flex-col-reverse rounded-md hover:bg-papel">
              <dt className="text-xs text-suave">Seguidoras</dt>
              <dd className="font-display text-2xl text-tinta tabular-nums">{numeros.seguidoras}</dd>
            </Link>
            <Link to={conexoes('seguindo')} className="flex flex-col-reverse rounded-md hover:bg-papel">
              <dt className="text-xs text-suave">Seguindo</dt>
              <dd className="font-display text-2xl text-tinta tabular-nums">{numeros.seguindo}</dd>
            </Link>
          </dl>
          {erroAcao && (
            <Aviso tipo="erro" className="mt-4">
              {erroAcao}
            </Aviso>
          )}
          <div className="mt-5 border-t border-linha pt-4">
            <Denunciar alvoTipo="perfil" alvoId={perfil.id} rotulo="Denunciar perfil" />
          </div>
        </div>
      </section>

      <section aria-labelledby="titulo-projetos-integrante" className="flex flex-col gap-4">
        <h2 id="titulo-projetos-integrante" className="font-display text-2xl text-tinta">
          Projetos
        </h2>
        <ProjetosIntegrantes autora={perfil.id} vazio={`${perfil.nome.split(' ')[0]} ainda não publicou projetos.`} />
      </section>

      <section aria-labelledby="titulo-publicacoes-integrante" className="flex flex-col gap-4">
        <h2 id="titulo-publicacoes-integrante" className="font-display text-2xl text-tinta">
          Publicações
        </h2>
        {publicacoes === null ? (
          <Esqueleto className="h-40 rounded-xl" />
        ) : publicacoes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-linha-forte bg-branco px-5 py-6 text-sm text-suave">{perfil.nome.split(' ')[0]} ainda não publicou.</p>
        ) : (
          publicacoes.map((p) => <CartaoPublicacao key={p.id} publicacao={p} aoExcluir={() => {}} />)
        )}
      </section>
    </div>
  )
}

export default PerfilIntegrante
