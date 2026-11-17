import { useCallback, useEffect, useState } from 'react'

export function useCarregar(carregar, dependencias = []) {
  const [estado, setEstado] = useState({ tipo: 'carregando' })
  const [versao, setVersao] = useState(0)
  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  useEffect(() => {
    let ativo = true
    setEstado((e) => (e.tipo === 'pronto' ? e : { tipo: 'carregando' }))
    carregar()
      .then((dados) => ativo && setEstado({ tipo: 'pronto', dados }))
      .catch((erro) => ativo && setEstado({ tipo: 'erro', erro: erro.message }))
    return () => {
      ativo = false
    }
  }, [versao, ...dependencias])

  return { ...estado, recarregar }
}
