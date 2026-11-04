import { useEffect, useState } from 'react'

// Carrega dados de um recurso que pode ainda não ter API.
// Se "disponivel" for false, não chama nada e devolve { estado: 'indisponivel' }.
export function useRecurso(disponivel, carregar, dependencias = []) {
  const [resultado, setResultado] = useState(() => ({ estado: disponivel ? 'carregando' : 'indisponivel' }))

  useEffect(() => {
    if (!disponivel) return
    let ativo = true
    // Numa recarga, o resultado anterior fica disponível em "anterior".
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResultado((r) => (r.estado === 'pronto' ? { estado: 'carregando', anterior: r.dados } : r))
    carregar()
      .then((dados) => ativo && setResultado({ estado: 'pronto', dados }))
      .catch((erro) => ativo && setResultado({ estado: 'erro', erro: erro.message }))
    return () => {
      ativo = false
    }
    // "carregar" muda a cada render; as dependências reais vêm de fora.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disponivel, ...dependencias])

  return resultado
}
