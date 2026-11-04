import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import Botao from '../../components/ui/Botao'
import { Aviso } from '../../components/ui/Campo'
import Selo from '../../components/ui/Selo'
import { ACOES_VAGA, dataCurta, excluirVaga, faixaSalarial, lerVagaEmpresa, mudarStatusVaga, STATUS_CANDIDATURA, VISUAL_CANDIDATURA, VISUAL_VAGA } from '../../services/empresa'

function DetalheVaga() {
  const { id } = useParams()
  const { state } = useLocation()
  const r = useCarregar(() => lerVagaEmpresa(id), [id])
  const [aviso, setAviso] = useState(state?.aviso ? { tipo: 'sucesso', texto: state.aviso } : null)
  const [mudando, setMudando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const navigate = useNavigate()

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
      setAviso({ tipo: 'sucesso', texto: `Vaga ${VISUAL_VAGA[status].rotulo.toLowerCase()}.` })
      r.recarregar()
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: erro.message })
    } finally {
      setMudando(false)
    }
  }

  async function excluir() {
    setMudando(true)
    try {
      await excluirVaga(v.id)
      navigate('/empresa/vagas', { replace: true })
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: erro.message })
      setMudando(false)
      setExcluindo(false)
    }
  }

  const ficha = [
    ['Área', v.area],
    ['Nível', v.nivel],
    ['Localização', v.localizacao],
    ['Modalidade', v.modalidade],
    ['Contratação', v.tipoContrato],
    ['Faixa salarial', faixaSalarial(v.salario, v.salarioMax)],
    ['Publicada em', v.dataPublicacao ? dataCurta(v.dataPublicacao) : 'Ainda não publicada'],
    ['Salva por', `${v.interessadas} ${v.interessadas === 1 ? 'candidata' : 'candidatas'}`],
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
            {ACOES_VAGA[v.status]?.map((a) => (
              <Botao key={a.status} variante={a.status === 'Aberta' && v.status === 'Rascunho' ? 'primario' : 'secundario'} disabled={mudando} onClick={() => mudar(a.status)}>
                {a.rotulo}
              </Botao>
            ))}
            {v.candidaturas === 0 &&
              (excluindo ? (
                <Botao className="bg-erro hover:bg-erro/90" disabled={mudando} onClick={excluir}>
                  Confirmar exclusão
                </Botao>
              ) : (
                <Botao variante="fantasma" className="text-erro" onClick={() => setExcluindo(true)}>
                  <Icone nome="lixeira" tamanho={16} /> Excluir
                </Botao>
              ))}
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
          <Selo variante={VISUAL_VAGA[v.status]?.variante}>{VISUAL_VAGA[v.status]?.rotulo ?? v.status}</Selo>
          <h2 className="mt-5 font-display text-2xl text-tinta">Descrição e responsabilidades</h2>
          <p className="mt-3 leading-relaxed whitespace-pre-line text-tinta-2">{v.descricao}</p>
          <h2 className="mt-8 font-display text-2xl text-tinta">Requisitos</h2>
          <p className="mt-3 leading-relaxed whitespace-pre-line text-tinta-2">{v.requisitos || 'Não informados.'}</p>
          <h2 className="mt-8 font-display text-2xl text-tinta">Benefícios</h2>
          <p className="mt-3 leading-relaxed whitespace-pre-line text-tinta-2">{v.beneficios || 'Não informados.'}</p>
        </article>
        <aside className="flex flex-col gap-4">
          <Link to={`/empresa/candidaturas?vaga=${v.id}`} className="cartao group flex items-center gap-4 p-6 hover:border-vinho/40">
            <span className="font-display text-4xl text-vinho tabular-nums">{v.candidaturas}</span>
            <span className="flex-1 text-sm text-tinta-2">{v.candidaturas === 1 ? 'candidatura recebida' : 'candidaturas recebidas'}</span>
            <Icone nome="seta" className="text-suave transition-transform group-hover:translate-x-1" />
          </Link>
          {v.candidaturas > 0 && (
            <ul className="cartao divide-y divide-linha px-6 py-2" aria-label="Candidaturas por etapa">
              {STATUS_CANDIDATURA.map((s) => (
                <li key={s}>
                  <Link to={`/empresa/candidaturas?vaga=${v.id}&status=${encodeURIComponent(s)}`} className="flex justify-between gap-4 py-2.5 text-sm hover:text-vinho">
                    <span className="text-tinta-2">{VISUAL_CANDIDATURA[s].rotulo}</span>
                    <span className="font-semibold text-tinta tabular-nums">{v.porStatus?.[s] ?? 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
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
