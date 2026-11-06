import { Link, useParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import MarcaEmpresa from '../../components/MarcaEmpresa'
import Capa from '../../components/candidata/Capa'
import CartaoVaga from '../../components/candidata/CartaoVaga'
import TituloPagina from '../../components/candidata/TituloPagina'
import { useRecurso } from '../../components/candidata/useRecurso'
import { Aviso } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import Selo from '../../components/ui/Selo'
import { candidaturaDaVaga } from '../../services/candidaturas'
import { useCandidaturas } from '../../hooks/useVagasReais'
import { iniciais } from '../../hooks/useSessao'
import { lerEmpresaPublica } from '../../services/vagasApi'

function Contato({ icone, href, children }) {
  return (
    <li>
      <a href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-tinta-2 hover:text-vinho">
        <Icone nome={icone} tamanho={15} /> {children}
      </a>
    </li>
  )
}

// Perfil público de uma empresa da Bloom, visto pela candidata: dados que a
// própria empresa publicou e as vagas abertas dela.
function EmpresaPerfil() {
  const { id } = useParams()
  const r = useRecurso(true, () => lerEmpresaPublica(id), [id])
  const candidaturas = useCandidaturas()

  if (r.estado === 'carregando') return <Esqueleto className="h-96 rounded-xl" />
  if (r.estado === 'erro') {
    return (
      <>
        <TituloPagina titulo="Empresa" voltar={{ para: '/candidata/vagas', rotulo: 'Vagas' }} />
        <Aviso tipo="erro">{r.erro}</Aviso>
      </>
    )
  }

  const { empresa, vagas } = r.dados
  const marca = { nome: empresa.nome, sigla: iniciais(empresa.nome) || 'E', cor: '#85243d', corTexto: '#ffffff', foto: empresa.foto, logo: empresa.logo }

  return (
    <div className="flex flex-col gap-6">
      <TituloPagina titulo={empresa.nome} voltar={{ para: '/candidata/vagas', rotulo: 'Vagas' }} />
      <section className="overflow-hidden rounded-xl border border-linha bg-branco">
        <Capa imagem={empresa.capa} className="rounded-none" />
        <div className="px-6 pb-7 sm:px-8">
          <MarcaEmpresa empresa={marca} tamanho="xl" className="relative z-10 -mt-14 ring-4 ring-branco" />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <h2 className="font-display text-3xl text-tinta">{empresa.nome}</h2>
            {empresa.premium && (
              <Selo variante="vinho">
                <Icone nome="coroa" /> Premium
              </Selo>
            )}
          </div>
          <p className="mt-1 text-suave">{[empresa.areaAtuacao, empresa.localizacao].filter(Boolean).join(' · ') || 'Área e localização não informadas'}</p>
          {empresa.descricao && <p className="mt-4 max-w-3xl leading-relaxed text-tinta-2">{empresa.descricao}</p>}
          {empresa.informacoes && <p className="mt-3 max-w-3xl text-sm leading-relaxed whitespace-pre-line text-tinta-2">{empresa.informacoes}</p>}
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {empresa.site && (
              <Contato icone="link" href={empresa.site}>
                Site
              </Contato>
            )}
            {empresa.linkedin && (
              <Contato icone="externo" href={empresa.linkedin}>
                LinkedIn
              </Contato>
            )}
            {empresa.emailContato && (
              <Contato icone="email" href={`mailto:${empresa.emailContato}`}>
                {empresa.emailContato}
              </Contato>
            )}
          </ul>
        </div>
      </section>

      <section aria-labelledby="titulo-vagas-empresa">
        <h2 id="titulo-vagas-empresa" className="mb-4 font-display text-2xl text-tinta">
          Vagas abertas
        </h2>
        {vagas.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
            {vagas.map((v) => (
              <CartaoVaga key={v.id} vaga={v} candidatura={candidaturaDaVaga(v.id, candidaturas)} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-linha bg-branco p-6 text-sm text-suave">
            Nenhuma vaga aberta no momento. <Link to="/candidata/vagas" className="font-semibold text-vinho hover:underline">Ver outras vagas</Link>
          </p>
        )}
      </section>
    </div>
  )
}

export default EmpresaPerfil
