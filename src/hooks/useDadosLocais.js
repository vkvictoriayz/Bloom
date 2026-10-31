import { useEffect, useState } from 'react'

// Lê um dado do navegador e relê quando algum dos eventos acontece
// (o evento próprio da Bloom ou "storage", vindo de outra aba).
export function useDadosLocais(ler, eventos) {
  const [dados, setDados] = useState(ler)
  const chaveEventos = eventos.join('|')

  useEffect(() => {
    const atualizar = () => setDados(ler())
    const lista = [...chaveEventos.split('|'), 'storage']
    lista.forEach((evento) => window.addEventListener(evento, atualizar))
    return () => lista.forEach((evento) => window.removeEventListener(evento, atualizar))
    // "ler" costuma ser uma função de módulo; só os eventos importam aqui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveEventos])

  return dados
}
