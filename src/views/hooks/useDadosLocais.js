import { useEffect, useState } from 'react'

export function useDadosLocais(ler, eventos) {
  const [dados, setDados] = useState(ler)
  const chaveEventos = eventos.join('|')

  useEffect(() => {
    const atualizar = () => setDados(ler())
    const lista = [...chaveEventos.split('|'), 'storage']
    lista.forEach((evento) => window.addEventListener(evento, atualizar))
    return () => lista.forEach((evento) => window.removeEventListener(evento, atualizar))
  }, [chaveEventos])

  return dados
}
