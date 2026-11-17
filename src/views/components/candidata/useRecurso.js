import { useEffect, useState } from 'react'

export function useRecurso(disponivel, carregar, dependencias = []) {
  const [resultado, setResultado] = useState(() => ({ estado: disponivel ? 'carregando' : 'indisponivel' }))

  useEffect(() => {
    if (!disponivel) return
    let ativo = true
    setResultado((r) => (r.estado === 'pronto' ? { estado: 'carregando', anterior: r.dados } : r))
    carregar()
      .then((dados) => ativo && setResultado({ estado: 'pronto', dados }))
      .catch((erro) => ativo && setResultado({ estado: 'erro', erro: erro.message }))
    return () => {
      ativo = false
    }
  }, [disponivel, ...dependencias])

  return resultado
}
