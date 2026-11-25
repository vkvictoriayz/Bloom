import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import CartaoPublicacao from '../../components/comunidade/CartaoPublicacao'
import Botao from '../../components/ui/Botao'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { verPublicacao } from '../../services/comunidade'

function Publicacao() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [estado, setEstado] = useState({ tipo: 'carregando' })

  useEffect(() => {
    let ativo = true
    verPublicacao(id)
      .then((r) => {
        if (!ativo) return
        setEstado({ tipo: 'pronto', publicacao: r.publicacao })
        document.title = `Publicação de ${r.publicacao.autora.nome} · BLOOM`
      })
      .catch((e) => ativo && setEstado({ tipo: 'erro', texto: e.message }))
    return () => {
      ativo = false
    }
  }, [id])

  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-4">
      <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/candidata/feed'))} className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-tinta-2 hover:bg-papel-2 hover:text-tinta">
        <Icone nome="voltar" tamanho={16} /> Voltar
      </button>
      <h1 className="sr-only">Publicação</h1>
      {estado.tipo === 'carregando' && <Esqueleto className="h-64 rounded-2xl" />}
      {estado.tipo === 'erro' && (
        <Vazio className="bg-branco">
          <VazioTitulo>Publicação indisponível</VazioTitulo>
          <VazioDescricao>Ela pode ter sido apagada pela autora ou não estar mais visível.</VazioDescricao>
          <VazioAcoes>
            <Botao as={Link} to="/candidata/feed" variante="secundario">
              Voltar para o feed
            </Botao>
          </VazioAcoes>
        </Vazio>
      )}
      {estado.tipo === 'pronto' && <CartaoPublicacao publicacao={estado.publicacao} aoExcluir={() => navigate('/candidata/feed', { replace: true })} />}
    </div>
  )
}

export default Publicacao
