import { useCallback, useEffect, useState } from 'react'

// Carrega dados de uma API com estados de carregamento, erro e recarga.
// "dependencias" decide quando buscar de novo.
export function useCarregar(carregar, dependencias = []) {
  const [estado, setEstado] = useState({ tipo: 'carregando' })
  const [versao, setVersao] = useState(0)
  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  useEffect(() => {
    let ativo = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEstado((e) => (e.tipo === 'pronto' ? e : { tipo: 'carregando' }))
    carregar()
      .then((dados) => ativo && setEstado({ tipo: 'pronto', dados }))
      .catch((erro) => ativo && setEstado({ tipo: 'erro', erro: erro.message }))
    return () => {
      ativo = false
    }
    // "carregar" muda a cada render; as dependências reais vêm de fora.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao, ...dependencias])

  return { ...estado, recarregar }
}
