import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Capa from '../../components/candidata/Capa'
import TituloPagina from '../../components/candidata/TituloPagina'
import Avatar from '../../components/comunidade/Avatar'
import { ICONE_TIPO } from '../../components/comunidade/tipos'
import Icone from '../../components/Icone'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import PerfilProfissional from '../../components/empresa/PerfilProfissional'
import { useCarregar } from '../../components/empresa/useCarregar'
import { TIPOS, tempoRelativo } from '../../services/comunidade'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Campo, Selecao } from '../../components/ui/Campo'
import { convidarTalento, lerTalento, listarVagasEmpresa } from '../../services/empresa'

function Convidar({ talento, convidadaPara, aoConvidar }) {
  const vagas = useCarregar(() => listarVagasEmpresa('Aberta'))
  const [vagaId, setVagaId] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [estado, setEstado] = useState(null)

  if (vagas.tipo !== 'pronto') return null
  const disponiveis = vagas.dados.vagas.filter((v) => !convidadaPara.includes(v.id))
  const convidadas = vagas.dados.vagas.filter((v) => convidadaPara.includes(v.id))

  async function enviar(e) {
    e.preventDefault()
    if (!vagaId) return setEstado({ tipo: 'erro', texto: 'Escolha uma vaga.' })
    setEstado({ tipo: 'enviando' })
    try {
      await convidarTalento(talento.id, { vagaId: Number(vagaId), mensagem: mensagem.trim() })
      setEstado({ tipo: 'sucesso', texto: `Convite enviado para ${talento.nome}.` })
      setVagaId('')
      setMensagem('')
      aoConvidar()
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <section className="cartao p-6" aria-labelledby="titulo-convite">
      <h2 id="titulo-convite" className="font-display text-2xl text-tinta">
        Convidar para um processo seletivo
      </h2>
      {convidadas.length > 0 && (
        <p className="mt-2 text-sm text-tinta-2">Já convidada para: {convidadas.map((v) => v.titulo).join(', ')}.</p>
      )}
      {vagas.dados.vagas.length === 0 ? (
        <p className="mt-3 text-sm text-suave">
          Você não tem vagas publicadas.{' '}
          <Link to="/empresa/vagas/criar" className="font-semibold text-vinho hover:underline">
            Publicar uma vaga
          </Link>
        </p>
      ) : disponiveis.length === 0 ? (
        <p className="mt-3 text-sm text-suave">Ela já foi convidada para todas as suas vagas abertas.</p>
      ) : (
        <form onSubmit={enviar} noValidate className="mt-4 flex flex-col gap-4">
          <Campo rotulo="Vaga">
            {(p) => (
              <Selecao {...p} value={vagaId} onChange={(e) => setVagaId(e.target.value)}>
                <option value="">Escolha uma vaga aberta</option>
                {disponiveis.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.titulo}
                  </option>
                ))}
              </Selecao>
            )}
          </Campo>
          <Campo rotulo="Mensagem" opcional ajuda={`${mensagem.length}/500`}>
            {(p) => <AreaTexto {...p} rows={3} maxLength={500} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />}
          </Campo>
          {estado?.texto && (
            <p role="status" className={estado.tipo === 'erro' ? 'text-sm text-erro' : 'text-sm text-sucesso'}>
              {estado.texto}
            </p>
          )}
          <Botao type="submit" className="self-start" disabled={estado?.tipo === 'enviando'}>
            <Icone nome="mensagem" tamanho={16} /> {estado?.tipo === 'enviando' ? 'Enviando…' : 'Enviar convite'}
          </Botao>
        </form>
      )}
    </section>
  )
}

function Talento() {
  const { id } = useParams()
  const r = useCarregar(() => lerTalento(id), [id])

  if (r.tipo === 'carregando') return <Carregando quantidade={2} altura="h-40" />
  if (r.tipo === 'erro') {
    return (
      <>
        <TituloPagina titulo="Perfil" voltar={{ para: '/empresa/talentos', rotulo: 'Banco de talentos' }} />
        <ErroAoCarregar erro={r.erro} />
      </>
    )
  }

  const { talento, publicacoes, profissional, convidadaPara = [] } = r.dados
  return (
    <>
      <TituloPagina titulo={talento.nome} voltar={{ para: '/empresa/talentos', rotulo: 'Banco de talentos' }} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="cartao overflow-hidden lg:self-start">
          <Capa imagem={talento.capa} className="h-28 rounded-none sm:h-28" />
          <div className="px-6 pb-6">
            <Avatar nome={talento.nome} foto={talento.foto} tamanho="xl" className="relative z-10 -mt-14 ring-4 ring-branco" />
            <h2 className="mt-4 font-display text-2xl text-tinta">{talento.nome}</h2>
            <p className="text-vinho">{talento.area || 'Área não informada'}</p>
            <p className="mt-4 text-sm leading-relaxed text-tinta-2">{talento.bio || 'Sem apresentação publicada.'}</p>
            {talento.interesses.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Interesses">
                {talento.interesses.map((i) => (
                  <li key={i} className="rounded-full bg-papel-2 px-2.5 py-1 text-xs font-semibold text-tinta-2">
                    {i}
                  </li>
                ))}
              </ul>
            )}
            {talento.email && (
              <a href={`mailto:${talento.email}`} className="mt-4 inline-flex items-center gap-1.5 text-sm text-tinta-2 hover:text-vinho">
                <Icone nome="email" tamanho={15} /> {talento.email}
              </a>
            )}
            <p className="mt-6 border-t border-linha pt-4 text-xs text-suave">
              {talento.email
                ? 'A profissional escolheu mostrar o e-mail às empresas. O telefone nunca é exibido.'
                : 'Contato e dados pessoais só aparecem se a profissional permitir ou quando ela se candidata a uma vaga.'}
            </p>
          </div>
        </section>
        <div className="flex flex-col gap-6">
          <Convidar talento={{ ...talento, id }} convidadaPara={convidadaPara} aoConvidar={r.recarregar} />
          {profissional && <PerfilProfissional perfil={profissional} />}
          <section aria-labelledby="titulo-pubs-talento">
            <h2 id="titulo-pubs-talento" className="mb-3 font-display text-2xl text-tinta">
              Publicações na comunidade
            </h2>
            {publicacoes.length === 0 ? (
              <p className="cartao px-5 py-6 text-sm text-suave">Ela ainda não publicou na comunidade.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {publicacoes.map((p) => (
                  <li key={p.id} className="cartao p-5">
                    <p className="inline-flex items-center gap-1 rounded-full bg-blush px-2 py-0.5 text-[11px] font-semibold text-vinho">
                      <Icone nome={ICONE_TIPO[p.tipo] ?? 'info'} tamanho={12} /> {TIPOS.find((t) => t.id === p.tipo)?.rotulo ?? p.tipo}
                    </p>
                    <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-tinta">{p.texto}</p>
                    <p className="mt-2 text-xs text-suave">{tempoRelativo(p.criadaEm)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

export default Talento
