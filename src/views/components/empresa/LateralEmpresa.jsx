import { Link } from 'react-router-dom'

import Icone from '../Icone'
import MarcaEmpresa from '../MarcaEmpresa'
import Capa from '../candidata/Capa'
import Avatar from '../comunidade/Avatar'
import SeloPremium from '../conta/SeloPremium'
import Esqueleto from '../ui/Esqueleto'
import { useCarregar } from './useCarregar'
import { fotoEmpresa, listarTalentos, listarVagasEmpresa } from '../../services/empresa'
import { listarEmpresasPublicas, textoVagas } from '../../services/publico'
import { cn } from '../../lib/cn'

const cartao = 'rounded-2xl border border-linha bg-branco'
const tituloCartao = 'font-display text-lg text-tinta'

function Numero({ valor, rotulo, para }) {
  return (
    <Link to={para} className="rounded-lg px-1 py-1 text-center transition-colors hover:bg-papel">
      <span className="block font-display text-xl text-tinta tabular-nums">{valor ?? '–'}</span>
      <span className="text-xs text-suave">{rotulo}</span>
    </Link>
  )
}

export function CartaoEmpresa({ dados }) {
  const nome = dados?.empresa.nome ?? 'Sua empresa'
  const n = dados?.numeros
  return (
    <section className={cn(cartao, 'overflow-hidden')} aria-label="Sua empresa">
      <Capa imagem={dados?.imagens?.capa} className="h-20 rounded-none sm:h-20" />
      <div className="-mt-9 flex flex-col items-center px-5 pb-5 text-center">
        <Link to="/empresa/perfil" className="relative z-10 rounded-2xl bg-branco ring-4 ring-branco" aria-label="Ver perfil da empresa">
          <Avatar nome={nome} foto={fotoEmpresa(dados)} tamanho="lg" className="rounded-2xl" />
        </Link>
        <p className="mt-2 flex items-center gap-1.5">
          <Link to="/empresa/perfil" className="font-bold text-tinta hover:text-vinho hover:underline">
            {nome}
          </Link>
          {dados?.empresa.premium && <SeloPremium compacto />}
        </p>
        <p className="line-clamp-2 text-sm text-suave">{dados?.perfil.areaAtuacao || dados?.perfil.localizacao || 'Complete o perfil da empresa'}</p>
        <div className="mt-4 grid w-full grid-cols-3 border-t border-linha pt-3">
          <Numero valor={n?.vagasAbertas} rotulo="vagas" para="/empresa/vagas" />
          <Numero valor={n?.candidaturas} rotulo="candidaturas" para="/empresa/candidaturas" />
          <Numero valor={n?.publicacoes} rotulo="publicações" para="/empresa/perfil" />
        </div>
        {n?.pendentes > 0 && (
          <Link to="/empresa/candidaturas?status=Recebida" className="mt-3 inline-flex w-full items-center justify-between rounded-xl bg-blush px-3 py-2 text-sm font-semibold text-vinho hover:bg-blush/70">
            {n.pendentes} {n.pendentes === 1 ? 'candidatura nova' : 'candidaturas novas'} <Icone nome="seta" tamanho={14} />
          </Link>
        )}
      </div>
    </section>
  )
}

function SuasVagas() {
  const r = useCarregar(() => listarVagasEmpresa('Aberta'))
  const vagas = r.tipo === 'pronto' ? r.dados.vagas.slice(0, 3) : []
  return (
    <section className={cn(cartao, 'p-5')} aria-labelledby="titulo-suas-vagas">
      <div className="flex items-center justify-between gap-2">
        <h2 id="titulo-suas-vagas" className={tituloCartao}>
          Suas vagas abertas
        </h2>
        <Link to="/empresa/vagas/criar" className="grid size-8 place-items-center rounded-full text-vinho hover:bg-blush" aria-label="Criar vaga">
          <Icone nome="mais" tamanho={18} />
        </Link>
      </div>
      {r.tipo === 'carregando' && <Esqueleto className="mt-4 h-24 rounded-xl" />}
      {r.tipo === 'pronto' && vagas.length === 0 && (
        <p className="mt-3 text-sm text-suave">
          Nenhuma vaga aberta.{' '}
          <Link to="/empresa/vagas/criar" className="font-semibold text-vinho hover:underline">
            Publicar uma vaga
          </Link>
        </p>
      )}
      {vagas.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {vagas.map((v) => {
            const pct = v.limiteCandidaturas ? Math.min(100, (v.candidaturas / v.limiteCandidaturas) * 100) : null
            return (
              <li key={v.id}>
                <Link to={`/empresa/vagas/${v.id}`} className="block rounded-xl border border-linha p-3 transition-colors hover:border-vinho/40 hover:bg-papel">
                  <span className="block truncate text-sm font-semibold text-tinta">{v.titulo}</span>
                  <span className="mt-0.5 block text-xs text-suave">
                    {[v.modalidade, `${v.candidaturas} ${v.candidaturas === 1 ? 'candidatura' : 'candidaturas'}`].filter(Boolean).join(' · ')}
                  </span>
                  {pct !== null && (
                    <span className="mt-2 block h-1.5 rounded-full bg-papel-2" aria-hidden="true">
                      <span className="block h-full rounded-full bg-vinho" style={{ width: `${pct}%` }} />
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      <Link to="/empresa/vagas" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
        Gerenciar vagas <Icone nome="seta" tamanho={14} />
      </Link>
    </section>
  )
}

function Talentos() {
  const r = useCarregar(() => listarTalentos())
  const lista = r.tipo === 'pronto' ? r.dados.talentos.slice(0, 4) : []
  if (r.tipo === 'pronto' && lista.length === 0) return null
  return (
    <section className={cn(cartao, 'p-5')} aria-labelledby="titulo-talentos-lateral">
      <h2 id="titulo-talentos-lateral" className={tituloCartao}>
        Talentos para conhecer
      </h2>
      {r.tipo === 'carregando' && <Esqueleto className="mt-4 h-32 rounded-xl" />}
      <ul className="mt-3 flex flex-col gap-1">
        {lista.map((t) => (
          <li key={t.id}>
            <Link to={`/empresa/talentos/${t.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-papel">
              <Avatar nome={t.nome} foto={t.foto} tamanho="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-tinta">
                  <span className="truncate">{t.nome}</span>
                </span>
                <span className="block truncate text-xs text-suave">{t.area || 'Área não informada'}</span>
              </span>
              <Icone nome="seta" tamanho={14} className="shrink-0 text-suave" />
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/empresa/explorar" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-vinho hover:underline">
        Explorar talentos <Icone nome="seta" tamanho={14} />
      </Link>
    </section>
  )
}

function OutrasEmpresas({ euId }) {
  const r = useCarregar(() => listarEmpresasPublicas())
  const lista = r.tipo === 'pronto' ? r.dados.empresas.filter((e) => e.id !== euId).slice(0, 3) : []
  if (r.tipo !== 'pronto' || lista.length === 0) return null
  return (
    <section className={cn(cartao, 'p-5')} aria-labelledby="titulo-outras-empresas">
      <h2 id="titulo-outras-empresas" className={tituloCartao}>
        Empresas na Bloom
      </h2>
      <ul className="mt-3 flex flex-col gap-1">
        {lista.map((e) => (
          <li key={e.id}>
            <Link to={`/empresas/${e.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-papel">
              <MarcaEmpresa empresa={e} tamanho="sm" className="rounded-xl" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-tinta">{e.nome}</span>
                <span className="block truncate text-xs text-suave">{e.areaAtuacao || textoVagas(e.vagasAbertas)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function LateralEmpresa({ dados }) {
  return (
    <aside className="flex flex-col gap-5" aria-label="Painel lateral">
      <div className="max-lg:hidden">
        <CartaoEmpresa dados={dados} />
      </div>
      <SuasVagas />
      <Talentos />
      <OutrasEmpresas euId={dados?.empresa.id} />
    </aside>
  )
}

export default LateralEmpresa
