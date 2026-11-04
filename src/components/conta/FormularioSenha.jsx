import { useState } from 'react'

import CampoSenha from '../CampoSenha'
import Botao from '../ui/Botao'
import { Aviso } from '../ui/Campo'
import { alterarSenha } from '../../services/recursos'

// Troca de senha de quem está logada (candidata ou empresa), pela API
// PUT /api/auth/senha, que confere a senha atual.
function FormularioSenha() {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [estado, setEstado] = useState({ tipo: 'ocioso' })

  async function enviar(e) {
    e.preventDefault()
    if (!senhaAtual || !novaSenha) return setEstado({ tipo: 'erro', texto: 'Preencha a senha atual e a nova.' })
    if (novaSenha.length < 8) return setEstado({ tipo: 'erro', texto: 'A nova senha deve ter pelo menos 8 caracteres.' })
    if (novaSenha !== confirmarSenha) return setEstado({ tipo: 'erro', texto: 'As senhas novas não são iguais.' })
    setEstado({ tipo: 'enviando' })
    try {
      const r = await alterarSenha({ senhaAtual, novaSenha, confirmarSenha })
      setEstado({ tipo: 'sucesso', texto: r.mensagem })
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex max-w-md flex-col gap-4">
      <CampoSenha rotulo="Senha atual" valor={senhaAtual} aoMudar={setSenhaAtual} autoComplete="current-password" />
      <CampoSenha rotulo="Nova senha" valor={novaSenha} aoMudar={setNovaSenha} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" />
      <CampoSenha rotulo="Confirme a nova senha" valor={confirmarSenha} aoMudar={setConfirmarSenha} autoComplete="new-password" />
      {(estado.tipo === 'erro' || estado.tipo === 'sucesso') && <Aviso tipo={estado.tipo}>{estado.texto}</Aviso>}
      <Botao type="submit" variante="secundario" className="self-start" disabled={estado.tipo === 'enviando'}>
        {estado.tipo === 'enviando' ? 'Salvando…' : 'Alterar senha'}
      </Botao>
    </form>
  )
}

export default FormularioSenha
