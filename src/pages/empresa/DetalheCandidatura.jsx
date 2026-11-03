import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import Avatar from '../../components/comunidade/Avatar'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import Botao from '../../components/ui/Botao'
import { Aviso, Selecao } from '../../components/ui/Campo'
import Selo from '../../components/ui/Selo'
import { dataCurta, lerCandidaturaEmpresa, mudarStatusCandidatura, STATUS_CANDIDATURA, VISUAL_CANDIDATURA } from '../../services/empresa'

// Detalhe de uma candidatura recebida. O backend só devolve candidaturas
// das vagas desta empresa; a candidata aparece com os dados que ela mesma
// enviou ou tornou públicos na comunidade.
function DetalheCandidatura() {
  const { id } = useParams()
  const r = useCarregar(() => lerCandidaturaEmpresa(id), [id])
  const [novoStatus, setNovoStatus] = useState('')
  const [estado, setEstado] = useState({ tipo: 'ocioso' })

  if (r.tipo === 'carregando') return <Carregando quantidade={2} altura="h-40" />
  if (r.tipo === 'erro') {
    return (
      <>
        <TituloPagina titulo="Candidatura" voltar={{ para: '/empresa/candidaturas', rotulo: 'Candidaturas recebidas' }} />
        <ErroAoCarregar erro={r.erro} />
      </>
    )
  }

  const { candidatura, vaga, candidata, envio } = r.dados
  const atual = novoStatus || candidatura.status
  const visual = VISUAL_CANDIDATURA[candidatura.status] ?? { variante: 'neutro', rotulo: candidatura.status }

  async function salvarStatus(e) {
    e.preventDefault()
    if (atual === candidatura.status) return setEstado({ tipo: 'erro', texto: 'Escolha um status diferente do atual.' })
    setEstado({ tipo: 'salvando' })
    try {
      await mudarStatusCandidatura(candidatura.id, atual)
      setEstado({ tipo: 'sucesso', texto: `Status atualizado para “${VISUAL_CANDIDATURA[atual].rotulo}”. A candidata vê a mudança no acompanhamento dela.` })
      setNovoStatus('')
      r.recarregar()
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <>
      <TituloPagina titulo={candidata.nome} descricao={`Candidatura para ${vaga.titulo} · ${dataCurta(candidatura.data)}`} voltar={{ para: '/empresa/candidaturas', rotulo: 'Candidaturas recebidas' }} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <section className="cartao p-6">
            <div className="flex items-center gap-4">
              <Avatar nome={candidata.nome} tamanho="lg" />
              <div className="min-w-0">
                <h2 className="font-display text-2xl text-tinta">{candidata.nome}</h2>
                <p className="text-vinho">{envio.titulo || candidata.area || 'Título não informado'}</p>
                {candidata.email && (
                  <a href={`mailto:${candidata.email}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-tinta-2 hover:text-vinho">
                    <Icone nome="email" tamanho={15} /> {candidata.email}
                  </a>
                )}
              </div>
            </div>
            {candidata.bio && <p className="mt-5 leading-relaxed text-tinta-2">{candidata.bio}</p>}
            {(envio.competencias.length > 0 || candidata.interesses?.length > 0) && (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Competências e interesses">
                {envio.competencias.map((c) => (
                  <li key={`c-${c}`} className="rounded-full bg-vinho px-3 py-1 text-sm font-semibold text-white">
                    {c}
                  </li>
                ))}
                {candidata.interesses?.map((i) => (
                  <li key={`i-${i}`} className="rounded-full border border-linha-forte px-3 py-1 text-sm font-semibold text-tinta">
                    {i}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="cartao p-6">
            <h2 className="font-display text-xl text-tinta">Apresentação enviada</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-tinta-2">{envio.apresentacao || 'A candidata não escreveu uma apresentação.'}</p>
            <h3 className="mt-6 text-sm font-bold text-tinta">Currículo e portfólio</h3>
            {envio.links.length ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {envio.links.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-linha-forte px-3.5 text-sm font-semibold hover:border-vinho hover:text-vinho">
                      {l.rotulo || 'Link'} <Icone nome="externo" tamanho={13} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-suave">Nenhum link enviado. O envio de arquivo de currículo ainda não existe na plataforma.</p>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <form onSubmit={salvarStatus} className="cartao flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-tinta">Status</h2>
              <Selo variante={visual.variante}>{visual.rotulo}</Selo>
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-tinta-2">
              Atualizar para
              <Selecao value={atual} onChange={(e) => setNovoStatus(e.target.value)}>
                {STATUS_CANDIDATURA.map((s) => (
                  <option key={s} value={s}>
                    {VISUAL_CANDIDATURA[s].rotulo}
                  </option>
                ))}
              </Selecao>
            </label>
            <Botao type="submit" disabled={estado.tipo === 'salvando'}>
              {estado.tipo === 'salvando' ? 'Salvando…' : 'Salvar status'}
            </Botao>
            {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
            {estado.tipo === 'sucesso' && <Aviso tipo="sucesso">{estado.texto}</Aviso>}
          </form>
          <section className="cartao p-6">
            <h2 className="text-xs font-bold tracking-[0.12em] text-suave uppercase">Vaga</h2>
            <p className="mt-2 font-semibold text-tinta">{vaga.titulo}</p>
            <p className="text-sm text-suave">{[vaga.localizacao, vaga.modalidade].filter(Boolean).join(' · ')}</p>
            <Botao as={Link} to={`/empresa/vagas/${vaga.id}`} variante="secundario" tamanho="sm" className="mt-4">
              Ver vaga
            </Botao>
          </section>
          <Link to={`/empresa/talentos/${candidata.id}`} className="cartao flex items-center justify-between gap-3 p-5 text-sm font-semibold hover:border-vinho/40">
            Ver perfil público <Icone nome="seta" tamanho={16} />
          </Link>
        </aside>
      </div>
    </>
  )
}

export default DetalheCandidatura
