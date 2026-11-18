import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import { IlustracaoEmpresa } from '../../components/ilustracoes/Ilustracoes'
import Botao from '../../components/ui/Botao'
import { Aviso } from '../../components/ui/Campo'
import Selo from '../../components/ui/Selo'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { ACOES_VAGA, dataCurta, excluirVaga, listarVagasEmpresa, mudarStatusVaga, STATUS_VAGA, VISUAL_VAGA } from '../../services/empresa'
import { cn } from '../../lib/cn'

const FILTROS = { '': 'Todas', Rascunho: 'Rascunhos', Aberta: 'Publicadas', Pausada: 'Desativadas', Encerrada: 'Encerradas' }
const ICONES = { '': 'maleta', Rascunho: 'editar', Aberta: 'check', Pausada: 'relogio', Encerrada: 'cadeado' }
const TOM = { Rascunho: 'bg-papel-2 text-tinta-2', Aberta: 'bg-sucesso-claro text-sucesso', Pausada: 'bg-alerta-claro text-alerta', Encerrada: 'bg-erro-claro text-erro' }

function Vagas() {
  const [parametros, setParametros] = useSearchParams()
  const filtro = STATUS_VAGA.includes(parametros.get('status')) ? parametros.get('status') : ''
  const r = useCarregar(() => listarVagasEmpresa())
  const todas = r.tipo === 'pronto' ? r.dados.vagas : []
  const vagas = filtro ? todas.filter((v) => v.status === filtro) : todas
  const totalCandidaturas = todas.reduce((a, v) => a + v.candidaturas, 0)
  const [mudando, setMudando] = useState(null)
  const [excluindo, setExcluindo] = useState(null)
  const [aviso, setAviso] = useState(null)

  function setFiltro(s) {
    setParametros(s ? { status: s } : {}, { replace: true })
  }

  async function mudar(vaga, status) {
    setMudando(vaga.id)
    setAviso(null)
    try {
      await mudarStatusVaga(vaga.id, status)
      setAviso({ tipo: 'sucesso', texto: `“${vaga.titulo}” agora está ${VISUAL_VAGA[status].rotulo.toLowerCase()}.` })
      r.recarregar()
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: erro.message })
    } finally {
      setMudando(null)
    }
  }

  async function excluir(vaga) {
    setMudando(vaga.id)
    setAviso(null)
    try {
      await excluirVaga(vaga.id)
      setAviso({ tipo: 'sucesso', texto: `“${vaga.titulo}” foi excluída.` })
      setExcluindo(null)
      r.recarregar()
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: erro.message })
    } finally {
      setMudando(null)
    }
  }

  return (
    <>
      <TituloPagina
        titulo="Gerenciar vagas"
        descricao="Crie, publique, desative, encerre e exclua as vagas da empresa."
        acoes={
          <Botao as={Link} to="/empresa/vagas/criar">
            <Icone nome="mais" tamanho={16} /> Nova vaga
          </Botao>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" role="group" aria-label="Filtrar por status">
        {['', ...STATUS_VAGA].map((s) => {
          const qtd = s ? todas.filter((v) => v.status === s).length : todas.length
          return (
            <button
              key={s || 'todas'}
              type="button"
              aria-pressed={filtro === s}
              onClick={() => setFiltro(s)}
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors',
                filtro === s ? 'border-vinho bg-branco ring-2 ring-vinho/15' : 'border-linha bg-branco hover:border-vinho/40'
              )}
            >
              <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', s ? TOM[s] : 'bg-blush text-vinho')} aria-hidden="true">
                <Icone nome={ICONES[s]} tamanho={18} />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-2xl leading-none text-tinta tabular-nums">{r.tipo === 'pronto' ? qtd : '–'}</span>
                <span className="mt-1 block truncate text-xs font-semibold text-tinta-2">{FILTROS[s]}</span>
              </span>
            </button>
          )
        })}
      </div>
      {r.tipo === 'pronto' && todas.length > 0 && (
        <p className="mb-4 text-sm text-tinta-2">
          <strong className="text-tinta">{totalCandidaturas}</strong> {totalCandidaturas === 1 ? 'candidatura recebida' : 'candidaturas recebidas'} em <strong className="text-tinta">{todas.length}</strong> {todas.length === 1 ? 'vaga' : 'vagas'}.
        </p>
      )}

      {aviso && (
        <Aviso tipo={aviso.tipo} className="mb-4">
          {aviso.texto}
        </Aviso>
      )}

      {r.tipo === 'carregando' && <Carregando />}
      {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {r.tipo === 'pronto' &&
        (vagas.length === 0 ? (
          <Vazio className="bg-branco">
            <IlustracaoEmpresa className="max-w-[220px]" />
            <VazioTitulo>{filtro ? `Nenhuma vaga em “${FILTROS[filtro]}”` : 'Nenhuma vaga ainda'}</VazioTitulo>
            <VazioDescricao>Publique uma oportunidade para começar a receber candidaturas.</VazioDescricao>
            <VazioAcoes>
              <Botao as={Link} to="/empresa/vagas/criar">
                Criar vaga
              </Botao>
            </VazioAcoes>
          </Vazio>
        ) : (
          <ul className="flex flex-col gap-3">
            {vagas.map((v) => (
              <li key={v.id} className="cartao flex flex-col gap-4 p-5 md:flex-row md:items-center">
                <span className={cn('hidden size-12 shrink-0 place-items-center rounded-2xl md:grid', TOM[v.status] ?? 'bg-blush text-vinho')} aria-hidden="true">
                  <Icone nome="maleta" tamanho={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/empresa/vagas/${v.id}`} className="font-display text-xl text-tinta hover:text-vinho">
                      {v.titulo}
                    </Link>
                    <Selo variante={VISUAL_VAGA[v.status]?.variante}>{VISUAL_VAGA[v.status]?.rotulo ?? v.status}</Selo>
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-1.5 text-xs text-tinta-2">
                    {[
                      ['local', v.localizacao],
                      ['predio', v.modalidade],
                      ['dados', v.area],
                      ['documento', v.tipoContrato],
                    ]
                      .filter(([, valor]) => valor)
                      .map(([icone, valor]) => (
                        <li key={icone} className="inline-flex items-center gap-1 rounded-full bg-papel px-2.5 py-1">
                          <Icone nome={icone} tamanho={12} className="text-vinho" /> {valor}
                        </li>
                      ))}
                  </ul>
                  <p className="mt-2 text-xs text-suave">
                    {v.dataPublicacao ? `Publicada em ${dataCurta(v.dataPublicacao)}` : 'Ainda não publicada'}
                    {v.interessadas > 0 && ` · salva por ${v.interessadas} ${v.interessadas === 1 ? 'candidata' : 'candidatas'}`}
                  </p>
                  {v.limiteCandidaturas ? (
                    <div className="mt-2 flex max-w-xs items-center gap-2" title="Limite de candidatas">
                      <span className="h-1.5 flex-1 rounded-full bg-papel-2" aria-hidden="true">
                        <span className="block h-full rounded-full bg-vinho" style={{ width: `${Math.min(100, (v.candidaturas / v.limiteCandidaturas) * 100)}%` }} />
                      </span>
                      <span className="text-xs text-suave tabular-nums">
                        {v.candidaturas}/{v.limiteCandidaturas}
                      </span>
                    </div>
                  ) : null}
                </div>
                <Link
                  to={`/empresa/candidaturas?vaga=${v.id}`}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-papel px-4 py-2 text-sm hover:bg-blush"
                >
                  <span className="font-display text-2xl text-vinho tabular-nums">{v.candidaturas}</span>
                  <span className="text-tinta-2">{v.candidaturas === 1 ? 'candidatura' : 'candidaturas'}</span>
                </Link>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Botao as={Link} to={`/empresa/vagas/${v.id}/editar`} variante="secundario" tamanho="sm">
                    <Icone nome="editar" tamanho={14} /> Editar
                  </Botao>
                  {ACOES_VAGA[v.status]?.map((a) => (
                    <Botao key={a.status} variante={a.status === 'Aberta' && v.status === 'Rascunho' ? 'primario' : 'fantasma'} tamanho="sm" disabled={mudando === v.id} onClick={() => mudar(v, a.status)}>
                      {a.rotulo}
                    </Botao>
                  ))}
                  {v.candidaturas === 0 &&
                    (excluindo === v.id ? (
                      <>
                        <Botao tamanho="sm" className="bg-erro hover:bg-erro/90" disabled={mudando === v.id} onClick={() => excluir(v)}>
                          Confirmar exclusão
                        </Botao>
                        <Botao tamanho="sm" variante="fantasma" onClick={() => setExcluindo(null)}>
                          Cancelar
                        </Botao>
                      </>
                    ) : (
                      <Botao tamanho="sm" variante="fantasma" className="text-erro" onClick={() => setExcluindo(v.id)}>
                        <Icone nome="lixeira" tamanho={14} /> Excluir
                      </Botao>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        ))}
    </>
  )
}

export default Vagas
