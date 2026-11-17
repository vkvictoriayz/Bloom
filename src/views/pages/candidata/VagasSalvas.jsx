import { Link } from 'react-router-dom'

import Icone from '../../components/Icone'
import CartaoVaga from '../../components/candidata/CartaoVaga'
import TituloPagina from '../../components/candidata/TituloPagina'
import Botao from '../../components/ui/Botao'
import { Vazio, VazioAcoes, VazioDescricao, VazioIcone, VazioTitulo } from '../../components/ui/Vazio'
import { useDadosLocais } from '../../hooks/useDadosLocais'
import { candidaturaDaVaga } from '../../services/candidaturas'
import { EVENTO_SALVAS, lerSalvas } from '../../services/salvas'
import { useCandidaturas, useVagas } from '../../hooks/useVagasReais'

function VagasSalvas() {
  const salvas = useDadosLocais(lerSalvas, [EVENTO_SALVAS])
  const candidaturas = useCandidaturas()
  const { vagas: todas } = useVagas()
  const vagas = salvas.map((id) => todas.find((v) => String(v.id) === String(id))).filter(Boolean)

  return (
    <>
      <TituloPagina
        titulo="Vagas salvas"
        descricao={vagas.length ? `${vagas.length} ${vagas.length === 1 ? 'vaga guardada' : 'vagas guardadas'} para decidir com calma.` : undefined}
      />
      {vagas.length === 0 ? (
        <Vazio className="bg-branco">
          <VazioIcone>
            <Icone nome="coracao" />
          </VazioIcone>
          <VazioTitulo>Nenhuma vaga salva</VazioTitulo>
          <VazioDescricao>Toque no coração de uma vaga para guardá-la aqui.</VazioDescricao>
          <VazioAcoes>
            <Botao as={Link} to="/candidata/vagas">
              Explorar vagas
            </Botao>
          </VazioAcoes>
        </Vazio>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
          {vagas.map((vaga) => (
            <CartaoVaga key={vaga.id} vaga={vaga} candidatura={candidaturaDaVaga(vaga.id, candidaturas)} />
          ))}
        </div>
      )}
    </>
  )
}

export default VagasSalvas
