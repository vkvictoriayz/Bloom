import { Link, useParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import Botao from '../../components/ui/Botao'
import Selo from '../../components/ui/Selo'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { useDadosLocais } from '../../hooks/useDadosLocais'
import { buscarCandidatura, ETAPAS, EVENTO_CANDIDATURAS, lerCandidaturas, situacao } from '../../services/candidaturas'
import { cn } from '../../lib/cn'

// Linha do tempo vertical do processo seletivo. As etapas seguem os status
// do banco (Pendente -> Em análise -> Aprovada/Reprovada). Só marcamos como
// concluída a etapa confirmada nos dados; nada é inventado.
function Andamento() {
  const { id } = useParams()
  const lista = useDadosLocais(lerCandidaturas, [EVENTO_CANDIDATURAS])
  const candidatura = buscarCandidatura(id, lista)

  if (!candidatura) {
    return (
      <Vazio className="bg-branco">
        <VazioTitulo>Candidatura não encontrada</VazioTitulo>
        <VazioDescricao>Não encontramos esta candidatura entre as suas.</VazioDescricao>
        <VazioAcoes>
          <Botao as={Link} to="/candidata/candidaturas">
            Minhas candidaturas
          </Botao>
        </VazioAcoes>
      </Vazio>
    )
  }

  const info = situacao(candidatura)
  const final = info.grupo === 'aprovada' || info.grupo === 'recusada'

  const etapas = ETAPAS.map((titulo, i) => {
    const concluida = i < info.etapasConcluidas
    const atual = !concluida && i === info.etapaAtual
    let detalhe = 'Etapa futura'
    if (i === 0) detalhe = `Registrada em ${candidatura.data}`
    else if (final && i === ETAPAS.length - 1) detalhe = info.rotulo
    else if (concluida) detalhe = 'Concluída'
    else if (atual) detalhe = 'Aguardando atualização da empresa'
    if (info.grupo === 'encerrada' && i > 0) detalhe = 'Processo encerrado'
    return { titulo, concluida, atual, detalhe }
  })

  return (
    <>
      <TituloPagina
        titulo="Andamento da candidatura"
        descricao={`${candidatura.cargo} · ${candidatura.empresa}`}
        voltar={{ para: `/candidata/candidaturas/${encodeURIComponent(candidatura.id)}`, rotulo: 'Detalhes da candidatura' }}
      />

      <section className="max-w-2xl rounded-xl border border-linha bg-branco p-6 sm:p-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl text-tinta">Etapas do processo</h2>
          <Selo variante={info.variante}>{info.rotulo}</Selo>
        </div>

        <ol>
          {etapas.map((etapa, i) => {
            const ultima = i === etapas.length - 1
            const corFinal = final && ultima ? (info.grupo === 'aprovada' ? 'bg-sucesso border-sucesso' : 'bg-erro border-erro') : 'bg-vinho border-vinho'
            return (
              <li key={etapa.titulo} className="relative flex gap-5 pb-10 last:pb-0" aria-current={etapa.atual ? 'step' : undefined}>
                {!ultima && (
                  <span aria-hidden="true" className={cn('absolute top-9 left-[17px] h-[calc(100%-36px)] w-0.5', etapas[i + 1].concluida ? 'bg-vinho' : 'bg-linha-forte')} />
                )}
                <span
                  className={cn(
                    'relative grid size-9 shrink-0 place-items-center rounded-full border-2',
                    etapa.concluida && cn(corFinal, 'text-white'),
                    etapa.atual && 'border-vinho bg-blush text-vinho',
                    !etapa.concluida && !etapa.atual && 'border-linha-forte bg-branco text-suave'
                  )}
                  aria-hidden="true"
                >
                  {etapa.concluida ? <Icone nome="check" tamanho={16} /> : etapa.atual ? <Icone nome="relogio" tamanho={16} /> : <span className="text-xs font-bold">{i + 1}</span>}
                </span>
                <div className="pt-1.5">
                  <p className={cn('font-semibold', etapa.concluida || etapa.atual ? 'text-tinta' : 'text-suave')}>{etapa.titulo}</p>
                  <p className="text-sm text-suave">{etapa.detalhe}</p>
                  <span className="sr-only">{etapa.concluida ? '(concluída)' : etapa.atual ? '(etapa atual)' : '(etapa futura)'}</span>
                </div>
              </li>
            )
          })}
        </ol>

        <p className="mt-8 border-t border-linha pt-5 text-sm text-suave">
          {candidatura.confirmadaPeloServidor
            ? 'Status confirmado pela empresa.'
            : 'As próximas etapas só avançam quando a empresa registrar uma atualização. Enquanto a API de candidaturas não existir, o status permanece como enviado.'}
        </p>
      </section>
    </>
  )
}

export default Andamento
