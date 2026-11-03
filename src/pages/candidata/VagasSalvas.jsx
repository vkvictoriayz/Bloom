import { Link } from 'react-router-dom'

import Icone from '../../components/Icone'
import CartaoVaga from '../../components/candidata/CartaoVaga'
import TituloPagina from '../../components/candidata/TituloPagina'
import Botao from '../../components/ui/Botao'
import { Vazio, VazioAcoes, VazioDescricao, VazioIcone, VazioTitulo } from '../../components/ui/Vazio'
import { buscarVaga } from '../../data/vagas'
import { useDadosLocais } from '../../hooks/useDadosLocais'
import { candidaturaDaVaga, EVENTO_CANDIDATURAS, lerCandidaturas } from '../../services/candidaturas'
import { EVENTO_SALVAS, lerSalvas } from '../../services/salvas'

// Vagas salvas: mesma persistência de antes (chave "bloom-vagas-salvas").
// O coração de cada cartão remove a vaga da lista.
function VagasSalvas() {
  const salvas = useDadosLocais(lerSalvas, [EVENTO_SALVAS])
  const candidaturas = useDadosLocais(lerCandidaturas, [EVENTO_CANDIDATURAS])
  const vagas = salvas.map((id) => buscarVaga(id)).filter(Boolean)

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
        <div className="grid gap-4 md:grid-cols-2">
          {vagas.map((vaga) => (
            <CartaoVaga key={vaga.id} vaga={vaga} candidatura={candidaturaDaVaga(vaga.id, candidaturas)} />
          ))}
        </div>
      )}
    </>
  )
}

export default VagasSalvas
