import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import Botao from '../../components/ui/Botao'
import { Aviso } from '../../components/ui/Campo'
import Selo from '../../components/ui/Selo'
import { dataCurta, lerVagaEmpresa, mudarStatusVaga, VISUAL_VAGA } from '../../services/empresa'

function DetalheVaga() {
  const { id } = useParams()
  const { state } = useLocation()
  const r = useCarregar(() => lerVagaEmpresa(id), [id])
  const [aviso, setAviso] = useState(state?.aviso ? { tipo: 'sucesso', texto: state.aviso } : null)
  const [mudando, setMudando] = useState(false)

  if (r.tipo === 'carregando') return <Carregando quantidade={2} altura="h-40" />
  if (r.tipo === 'erro') {
    return (
      <>
        <TituloPagina titulo="Vaga" voltar={{ para: '/empresa/vagas', rotulo: 'Gerenciar vagas' }} />
        <ErroAoCarregar erro={r.erro} />
      </>
    )
  }

  const v = r.dados.vaga

  async function mudar(status) {
    setMudando(true)
    try {
      await mudarStatusVaga(v.id, status)
      setAviso({ tipo: 'sucesso', texto: `Vaga ${status.toLowerCase()}.` })
      r.recarregar()
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: erro.message })
    } finally {
      setMudando(false)
    }
  }

  const ficha = [
    ['Área', v.area],
    ['Localização', v.localizacao],
    ['Modalidade', v.modalidade],
    ['Contratação', v.tipoContrato],
    ['Salário', v.salario !== null ? v.salario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''],
    ['Publicada em', dataCurta(v.dataPublicacao)],
  ]

  return (
    <>
      <TituloPagina
        titulo={v.titulo}
        voltar={{ para: '/empresa/vagas', rotulo: 'Gerenciar vagas' }}
        acoes={
          <>
            <Botao as={Link} to={`/empresa/vagas/${v.id}/editar`} variante="secundario">
              <Icone nome="editar" tamanho={16} /> Editar
            </Botao>
            {v.status === 'Encerrada' || v.status === 'Pausada' ? (
              <Botao variante="secundario" disabled={mudando} onClick={() => mudar('Aberta')}>
                Reabrir
              </Botao>
            ) : (
              <Botao variante="secundario" disabled={mudando} onClick={() => mudar('Pausada')}>
                Pausar
              </Botao>
            )}
            {v.status !== 'Encerrada' && (
              <Botao variante="fantasma" disabled={mudando} onClick={() => mudar('Encerrada')}>
                Encerrar
              </Botao>
            )}
          </>
        }
      />
      {aviso && (
        <Aviso tipo={aviso.tipo} className="mb-5">
          {aviso.texto}
        </Aviso>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="cartao p-6 sm:p-8">
          <Selo variante={VISUAL_VAGA[v.status]?.variante}>{v.status}</Selo>
          <h2 className="mt-5 font-display text-2xl text-tinta">Descrição e responsabilidades</h2>
          <p className="mt-3 leading-relaxed whitespace-pre-line text-tinta-2">{v.descricao}</p>
          <h2 className="mt-8 font-display text-2xl text-tinta">Requisitos</h2>
          <p className="mt-3 leading-relaxed whitespace-pre-line text-tinta-2">{v.requisitos || 'Não informados.'}</p>
        </article>
        <aside className="flex flex-col gap-4">
          <Link to={`/empresa/candidaturas?vaga=${v.id}`} className="cartao group flex items-center gap-4 p-6 hover:border-vinho/40">
            <span className="font-display text-4xl text-vinho tabular-nums">{v.candidaturas}</span>
            <span className="flex-1 text-sm text-tinta-2">{v.candidaturas === 1 ? 'candidatura recebida' : 'candidaturas recebidas'}</span>
            <Icone nome="seta" className="text-suave transition-transform group-hover:translate-x-1" />
          </Link>
          <dl className="cartao divide-y divide-linha px-6 py-2">
            {ficha.map(([rotulo, valor]) => (
              <div key={rotulo} className="flex justify-between gap-4 py-2.5 text-sm">
                <dt className="text-suave">{rotulo}</dt>
                <dd className="text-right font-semibold text-tinta">{valor || 'Não informado'}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </>
  )
}

export default DetalheVaga
