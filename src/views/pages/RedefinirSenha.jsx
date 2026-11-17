import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import TelaAcesso, { LinkAcesso } from '../components/TelaAcesso'
import CampoSenha from '../components/CampoSenha'
import Botao from '../components/ui/Botao'
import { Aviso } from '../components/ui/Campo'
import { redefinirSenha } from '../services/auth'

function RedefinirSenha() {
  const [parametros] = useSearchParams()
  const token = parametros.get('token') ?? ''
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [estado, setEstado] = useState({ tipo: 'ocioso' })

  async function handleSubmit() {
    if (senha.length < 8) return setEstado({ tipo: 'erro', texto: 'A senha deve ter pelo menos 8 caracteres.' })
    if (senha !== confirmarSenha) return setEstado({ tipo: 'erro', texto: 'As senhas não são iguais.' })
    setEstado({ tipo: 'enviando' })
    try {
      const r = await redefinirSenha({ token, senha, confirmarSenha })
      setEstado({ tipo: 'pronto', texto: r.mensagem, login: r.tipo === 'empresa' ? '/empresa/login' : '/login' })
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  const semToken = !/^[0-9a-f]{64}$/.test(token)

  return (
    <TelaAcesso
      titulo="Criar nova senha"
      subtitulo="Escolha uma senha nova para a sua conta."
      aoEnviar={handleSubmit}
      rodape={
        <p>
          O link expirou? <LinkAcesso to="/recuperar-senha">Pedir um novo</LinkAcesso>
        </p>
      }
    >
      {semToken ? (
        <Aviso tipo="erro">Este link de redefinição é inválido. Use o link completo enviado por e-mail ou peça um novo.</Aviso>
      ) : estado.tipo === 'pronto' ? (
        <>
          <Aviso tipo="sucesso">{estado.texto}</Aviso>
          <Botao as={Link} to={estado.login} tamanho="lg" className="w-full">
            Ir para o login
          </Botao>
        </>
      ) : (
        <>
          <CampoSenha rotulo="Nova senha" valor={senha} aoMudar={setSenha} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" />
          <CampoSenha
            rotulo="Confirme a nova senha"
            valor={confirmarSenha}
            aoMudar={setConfirmarSenha}
            placeholder="Digite a senha novamente"
            autoComplete="new-password"
          />
          {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
          <Botao type="submit" tamanho="lg" className="mt-2 w-full" disabled={estado.tipo === 'enviando'}>
            {estado.tipo === 'enviando' ? 'Salvando…' : 'Salvar nova senha'}
          </Botao>
        </>
      )}
    </TelaAcesso>
  )
}

export default RedefinirSenha
