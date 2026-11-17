import { Link } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import PublicacaoEmpresa from '../../components/empresa/PublicacaoEmpresa'
import { useCarregar } from '../../components/empresa/useCarregar'
import { IlustracaoCrescimento } from '../../components/ilustracoes/Ilustracoes'
import Botao from '../../components/ui/Botao'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { listarPublicacoesEmpresa } from '../../services/empresa'

function Publicacoes() {
  const r = useCarregar(listarPublicacoesEmpresa)

  return (
    <>
      <TituloPagina
        titulo="Publicações"
        descricao="O que a empresa já compartilhou na Bloom."
        acoes={
          <Botao as={Link} to="/empresa/publicacoes/criar">
            <Icone nome="mais" tamanho={16} /> Nova publicação
          </Botao>
        }
      />
      <div className="mx-auto flex max-w-[760px] flex-col gap-4">
        {r.tipo === 'carregando' && <Carregando quantidade={2} altura="h-36" />}
        {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
        {r.tipo === 'pronto' &&
          (r.dados.publicacoes.length === 0 ? (
            <Vazio className="bg-branco">
              <IlustracaoCrescimento className="max-w-[220px]" />
              <VazioTitulo>Nenhuma publicação ainda</VazioTitulo>
              <VazioDescricao>Divulgue vagas, eventos, programas de formação e novidades da empresa.</VazioDescricao>
              <VazioAcoes>
                <Botao as={Link} to="/empresa/publicacoes/criar">
                  Criar publicação
                </Botao>
              </VazioAcoes>
            </Vazio>
          ) : (
            r.dados.publicacoes.map((p) => <PublicacaoEmpresa key={p.id} publicacao={p} gerenciavel aoExcluir={r.recarregar} />)
          ))}
      </div>
    </>
  )
}

export default Publicacoes
