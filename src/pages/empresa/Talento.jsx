import { useParams } from 'react-router-dom'

import TituloPagina from '../../components/candidata/TituloPagina'
import Avatar from '../../components/comunidade/Avatar'
import { ICONE_TIPO } from '../../components/comunidade/tipos'
import Icone from '../../components/Icone'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import { TIPOS, tempoRelativo } from '../../services/comunidade'
import { lerTalento } from '../../services/empresa'

// Perfil público de uma profissional, visto pela empresa: nome, área,
// interesses, apresentação e publicações na comunidade. Sem contato
// pessoal: e-mail só aparece quando ela se candidata a uma vaga da empresa.
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

  const { talento, publicacoes } = r.dados
  return (
    <>
      <TituloPagina titulo={talento.nome} voltar={{ para: '/empresa/talentos', rotulo: 'Banco de talentos' }} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="cartao p-6 lg:self-start">
          <Avatar nome={talento.nome} tamanho="xl" />
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
          <p className="mt-6 border-t border-linha pt-4 text-xs text-suave">
            Contato e dados pessoais não são exibidos. Eles chegam à empresa quando a profissional se candidata a uma vaga.
          </p>
        </section>
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
    </>
  )
}

export default Talento
