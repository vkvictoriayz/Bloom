import { useEffect, useState } from 'react'
import { obterSessao } from '../services/auth'

export function useSessao() {
  const [sessao, setSessao] = useState(obterSessao)

  useEffect(() => {
    const atualizar = () => setSessao(obterSessao())
    window.addEventListener('storage', atualizar)
    window.addEventListener('bloom-sessao-atualizada', atualizar)
    return () => {
      window.removeEventListener('storage', atualizar)
      window.removeEventListener('bloom-sessao-atualizada', atualizar)
    }
  }, [])

  return sessao
}

export function primeiroNome(nome = '') {
  return nome.trim().split(/\s+/)[0] ?? ''
}

export function iniciais(nome = '') {
  return nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('')
}
