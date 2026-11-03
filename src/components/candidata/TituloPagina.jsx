import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../Icone'
import { Vazio, VazioAcoes, VazioDescricao, VazioIcone, VazioTitulo } from '../ui/Vazio'

// Título de página da área da candidata: atualiza o <title>, mostra um
// "voltar" opcional, título, descrição e ações à direita.
function TituloPagina({ titulo, descricao, acoes, voltar }) {
  useEffect(() => {
    document.title = `${titulo} · BLOOM`
  }, [titulo])

  return (
    <div className="mb-8">
      {voltar && (
        <Link to={voltar.para} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-suave hover:text-tinta">
          <Icone nome="voltar" tamanho={16} /> {voltar.rotulo}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-tight text-tinta sm:text-4xl">{titulo}</h1>
          {descricao && <p className="mt-2 max-w-2xl text-tinta-2">{descricao}</p>}
        </div>
        {acoes && <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div>}
      </div>
    </div>
  )
}

// Estado para recursos que ainda dependem de uma API do backend.
// Diz com clareza o que falta, sem simular dados.
export function RecursoIndisponivel({ icone, ilustracao: Ilustracao, titulo, descricao, children }) {
  return (
    <Vazio className="bg-branco">
      {Ilustracao ? (
        <Ilustracao className="max-w-[240px]" />
      ) : (
        <VazioIcone>
          <Icone nome={icone} />
        </VazioIcone>
      )}
      <VazioTitulo>{titulo}</VazioTitulo>
      <VazioDescricao>{descricao}</VazioDescricao>
      <p className="inline-flex items-center gap-1.5 rounded-full bg-alerta-claro px-3 py-1 text-xs font-semibold text-alerta">
        <Icone nome="info" tamanho={14} /> Em desenvolvimento: depende de uma API que ainda não existe
      </p>
      {children && <VazioAcoes>{children}</VazioAcoes>}
    </Vazio>
  )
}

export default TituloPagina
