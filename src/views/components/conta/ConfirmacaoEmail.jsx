import { useEffect, useState } from 'react'

import Selo from '../ui/Selo'
import { Aviso } from '../ui/Campo'
import { useSessao } from '../../hooks/useSessao'
import { atualizarUsuarioSessao, buscarSessaoAtual, reenviarConfirmacaoEmail } from '../../services/auth'

const CHAVE_DISPENSADO = 'bloom-aviso-email-dispensado'

function useEmailConfirmado() {
  const sessao = useSessao()
  const token = sessao?.token
  useEffect(() => {
    if (!token) return
    buscarSessaoAtual(token)
      .then((r) => {
        if (r?.usuario && typeof r.usuario.emailVerificado === 'boolean') {
          atualizarUsuarioSessao({ emailVerificado: r.usuario.emailVerificado, email: r.usuario.email })
        }
      })
      .catch(() => {})
  }, [token])
  return { sessao, confirmado: sessao?.usuario?.emailVerificado }
}

function Reenviar({ token, className }) {
  const [estado, setEstado] = useState({ tipo: 'ocioso' })
  async function reenviar() {
    setEstado({ tipo: 'enviando' })
    try {
      const r = await reenviarConfirmacaoEmail(token)
      if (r.jaConfirmado) atualizarUsuarioSessao({ emailVerificado: true })
      setEstado({ tipo: 'ok', texto: r.mensagem })
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }
  if (estado.tipo === 'ok') return <span className={className}>{estado.texto}</span>
  return (
    <span className={className}>
      <button type="button" onClick={reenviar} disabled={estado.tipo === 'enviando'} className="font-semibold text-vinho underline underline-offset-4 disabled:opacity-60">
        {estado.tipo === 'enviando' ? 'Enviando…' : 'Reenviar o link'}
      </button>
      {estado.tipo === 'erro' && <span className="ml-2 text-erro">{estado.texto}</span>}
    </span>
  )
}

export function AvisoConfirmarEmail() {
  const { sessao, confirmado } = useEmailConfirmado()
  const [dispensado, setDispensado] = useState(() => {
    try {
      return sessionStorage.getItem(CHAVE_DISPENSADO) === '1'
    } catch {
      return false
    }
  })
  if (confirmado !== false || dispensado) return null

  function dispensar() {
    try {
      sessionStorage.setItem(CHAVE_DISPENSADO, '1')
    } catch {
    }
    setDispensado(true)
  }

  return (
    <Aviso tipo="info" className="mb-6">
      <span className="block">
        <strong className="text-tinta">Confirme seu e-mail.</strong> Enviamos um link para {sessao.usuario.email}. Ele garante que você recebe os avisos da
        Bloom e consegue recuperar a senha. <Reenviar token={sessao.token} />
        {' · '}
        <button type="button" onClick={dispensar} className="font-semibold text-tinta-2 underline underline-offset-4">
          Agora não
        </button>
      </span>
    </Aviso>
  )
}

export function SituacaoEmail() {
  const { sessao, confirmado } = useEmailConfirmado()
  if (confirmado === undefined) return null
  return confirmado ? (
    <Selo variante="sucesso">Confirmado</Selo>
  ) : (
    <span className="flex flex-col items-start gap-1">
      <Selo variante="alerta">Não confirmado</Selo>
      <Reenviar token={sessao.token} className="text-xs text-tinta-2" />
    </span>
  )
}
