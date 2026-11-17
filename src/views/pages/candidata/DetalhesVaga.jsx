import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Denunciar from '../../components/conta/Denunciar'

import BotaoSalvar from '../../components/BotaoSalvar'
import Icone from '../../components/Icone'
import MarcaEmpresa from '../../components/MarcaEmpresa'
import CartaoVaga from '../../components/candidata/CartaoVaga'
import Botao from '../../components/ui/Botao'
import Selo from '../../components/ui/Selo'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { formatarPublicacao } from '../../data/vagas'
import Esqueleto from '../../components/ui/Esqueleto'
import { candidaturaDaVaga, situacao } from '../../services/candidaturas'
import { useCandidaturas, useVaga, useVagas } from '../../hooks/useVagasReais'

function Secao({ titulo, children }) {
  return (
    <section className="border-t border-linha py-7 first:border-t-0 first:pt-0">
      <h2 className="font-display text-2xl text-tinta">{titulo}</h2>
      <div className="mt-3 leading-relaxed text-tinta-2">{children}</div>
    </section>
  )
}

function Lista({ itens }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {itens.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-vinho" />
          {item}
        </li>
      ))}
    </ul>
  )
}

function DetalhesVaga() {
  const { id } = useParams()
  const { vaga, carregando } = useVaga(id)
  const candidaturas = useCandidaturas()
  const { vagas: todas } = useVagas()
  const candidatura = vaga ? candidaturaDaVaga(vaga.id, candidaturas) : null

  useEffect(() => {
    document.title = `${vaga?.titulo ?? 'Vaga não encontrada'} · BLOOM`
  }, [vaga?.titulo])

  if (carregando) return <Esqueleto className="h-96 rounded-2xl" />

  if (!vaga) {
    return (
      <Vazio className="bg-branco">
        <VazioTitulo>Vaga não encontrada</VazioTitulo>
        <VazioDescricao>Não encontramos uma oportunidade neste endereço. Ela pode ter sido encerrada.</VazioDescricao>
        <VazioAcoes>
          <Botao as={Link} to="/candidata/vagas">
            Ver todas as vagas
          </Botao>
        </VazioAcoes>
      </Vazio>
    )
  }

  const empresa = vaga.dadosEmpresa
  // Relacionadas: abertas, da mesma empresa ou da mesma área.
  const relacionadas = todas
    .filter((v) => v.id !== vaga.id && (v.empresa === vaga.empresa || v.area === vaga.area))
    .slice(0, 2)

  const ficha = [
    ['Modalidade', vaga.modalidade],
    ['Localização', vaga.local],
    ['Nível', vaga.nivel ?? 'Não informado'],
    ['Contratação', vaga.contrato],
    ['Área', vaga.area],
    ['Remuneração', vaga.salario ?? 'Não informada'],
    ['Publicada', formatarPublicacao(vaga.publicadaHaDias)],
  ]

  return (
    <div className="flex flex-col gap-8">
      <Link to="/candidata/vagas" className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-suave hover:text-tinta">
        <Icone nome="voltar" tamanho={16} /> Vagas
      </Link>

      <header className="flex flex-col gap-5 rounded-xl border border-linha bg-branco p-6 sm:flex-row sm:items-start sm:p-8">
        <MarcaEmpresa empresa={empresa} tamanho="lg" />
        <div className="min-w-0 flex-1">
          {empresa.id ? (
            <Link to={`/candidata/empresas/${empresa.id}`} className="font-semibold text-vinho hover:underline">
              {empresa.nome}
            </Link>
          ) : (
            <p className="font-semibold text-vinho">{empresa.nome}</p>
          )}
          <h1 className="mt-1 font-display text-3xl leading-tight text-tinta sm:text-4xl">{vaga.titulo}</h1>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-tinta-2">
            <span className="inline-flex items-center gap-1.5">
              <Icone nome="local" className="text-suave" /> {vaga.local}
            </span>
            <span>{vaga.modalidade}</span>
            <span>{vaga.nivel ?? 'Nível não informado'}</span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-xl border border-linha bg-branco p-6 sm:p-8">
          <Secao titulo="Sobre a vaga">
            <p>{vaga.descricao}</p>
          </Secao>
          {vaga.responsabilidades?.length > 0 && (
            <Secao titulo="Responsabilidades">
              <Lista itens={vaga.responsabilidades} />
            </Secao>
          )}
          {vaga.requisitos?.length > 0 && (
            <Secao titulo="Requisitos e qualificações">
              <Lista itens={vaga.requisitos} />
            </Secao>
          )}
          {vaga.beneficios?.length > 0 && (
            <Secao titulo="Benefícios">
              <Lista itens={vaga.beneficios} />
            </Secao>
          )}
          <Secao titulo="Tecnologias">
            <div className="flex flex-wrap gap-2">
              {vaga.competencias.map((item) => (
                <Link
                  key={item}
                  to={`/candidata/vagas?busca=${encodeURIComponent(item)}`}
                  className="rounded-full border border-linha-forte px-3 py-1 text-sm font-semibold hover:border-vinho hover:text-vinho"
                >
                  {item}
                </Link>
              ))}
            </div>
          </Secao>
          {!vaga.responsabilidades && (
            <p className="text-sm text-suave">A empresa ainda não detalhou responsabilidades, requisitos e benefícios desta vaga.</p>
          )}
        </article>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-linha bg-branco p-6">
            {candidatura ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-tinta">Você já se candidatou</p>
                  <Selo variante={situacao(candidatura).variante}>{situacao(candidatura).rotulo}</Selo>
                </div>
                <p className="mt-1 text-sm text-suave">Enviada em {candidatura.data}.</p>
                <Botao as={Link} to={`/candidata/candidaturas/${encodeURIComponent(candidatura.id)}`} className="mt-4 w-full">
                  Ver minha candidatura
                </Botao>
              </>
            ) : vaga.real && vaga.status !== 'Aberta' ? (
              <p className="rounded-xl bg-papel-2 px-4 py-3 text-sm font-semibold text-tinta-2">
                Esta vaga está {vaga.status?.toLowerCase()} e não recebe novas candidaturas.
              </p>
            ) : (
              <Botao as={Link} to={`/vagas/${vaga.id}/candidatar`} tamanho="lg" className="w-full">
                Candidatar-se
              </Botao>
            )}
            <BotaoSalvar vaga={vaga} comTexto className="mt-2 w-full" />
            {vaga.real && (
              <div className="mt-3 text-center">
                <Denunciar alvoTipo="vaga" alvoId={Number(String(vaga.id).replace(/^b/, ''))} rotulo="Denunciar vaga" />
              </div>
            )}

            <dl className="mt-6 flex flex-col divide-y divide-linha border-t border-linha">
              {ficha.map(([rotulo, valor]) => (
                <div key={rotulo} className="flex justify-between gap-4 py-2.5 text-sm">
                  <dt className="text-suave">{rotulo}</dt>
                  <dd className="text-right font-semibold text-tinta">{valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>

      {relacionadas.length > 0 && (
        <section aria-labelledby="titulo-relacionadas">
          <h2 id="titulo-relacionadas" className="mb-4 font-display text-2xl text-tinta">
            Vagas relacionadas
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
            {relacionadas.map((v) => (
              <CartaoVaga key={v.id} vaga={v} candidatura={candidaturaDaVaga(v.id, candidaturas)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default DetalhesVaga
