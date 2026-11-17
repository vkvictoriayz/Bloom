import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import TelaAcesso from '../components/TelaAcesso'
import Botao from '../components/ui/Botao'
import { Aviso } from '../components/ui/Campo'
import { atualizarUsuarioSessao, confirmarEmail, obterSessao } from '../services/auth'

function ConfirmarEmail() {
  const [parametros] = useSearchParams()
  const token = parametros.get('token') ?? ''
  const valido = /^[0-9a-f]{64}$/.test(token)
  const [estado, setEstado] = useState(valido ? { tipo: 'enviando' } : { tipo: 'erro', texto: 'Este link de confirmação é inválido. Use o link completo enviado por e-mail.' })
  const enviado = useRef(false)

  useEffect(() => {
    if (!valido || enviado.current) return
    enviado.current = true
    confirmarEmail(token)
      .then((r) => {
        const sessao = obterSessao()
        if (sessao?.usuario?.tipo === r.tipo) atualizarUsuarioSessao({ emailVerificado: true })
        setEstado({ tipo: 'pronto', conta: r.tipo, logada: Boolean(sessao) })
      })
      .catch((erro) => setEstado({ tipo: 'erro', texto: erro.message }))
  }, [token, valido])

  const destino =
    estado.tipo === 'pronto'
      ? estado.logada
        ? estado.conta === 'empresa'
          ? '/empresa/feed'
          : '/candidata/feed'
        : estado.conta === 'empresa'
          ? '/empresa/login'
          : '/login'
      : '/login'

  return (
    <TelaAcesso titulo="Confirmar e-mail" subtitulo="Confirmação do endereço de e-mail da sua conta." aoEnviar={() => {}}>
      {estado.tipo === 'enviando' && <p className="text-sm text-suave">Confirmando…</p>}
      {estado.tipo === 'pronto' && (
        <>
          <Aviso tipo="sucesso">E-mail confirmado. Obrigada!</Aviso>
          <Botao as={Link} to={destino} tamanho="lg" className="w-full">
            {estado.logada ? 'Voltar para a Bloom' : 'Ir para o login'}
          </Botao>
        </>
      )}
      {estado.tipo === 'erro' && (
        <>
          <Aviso tipo="erro">{estado.texto}</Aviso>
          <p className="text-sm text-tinta-2">Entre na sua conta: no aviso do topo ou em Configurações você pode pedir um link novo.</p>
          <Botao as={Link} to="/login" tamanho="lg" variante="secundario" className="w-full">
            Ir para o login
          </Botao>
        </>
      )}
    </TelaAcesso>
  )
}

export default ConfirmarEmail
