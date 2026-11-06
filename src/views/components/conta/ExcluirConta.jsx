import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import CampoSenha from '../CampoSenha'
import Botao from '../ui/Botao'
import { Aviso, Campo, Entrada } from '../ui/Campo'
import { sair } from '../../services/auth'
import { excluirConta } from '../../services/recursos'

// Exclusão definitiva da conta (candidata ou empresa). Pede a senha e que a
// pessoa digite EXCLUIR; o servidor confere as duas coisas de novo.
function ExcluirConta({ itens }) {
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [estado, setEstado] = useState({ tipo: 'ocioso' })

  async function enviar(e) {
    e.preventDefault()
    if (confirmacao !== 'EXCLUIR') return setEstado({ tipo: 'erro', texto: 'Digite EXCLUIR, em letras maiúsculas, para confirmar.' })
    if (!senha) return setEstado({ tipo: 'erro', texto: 'Informe sua senha.' })
    setEstado({ tipo: 'enviando' })
    try {
      await excluirConta({ senha, confirmacao })
      sair()
      navigate('/', { replace: true })
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  if (!aberto) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-tinta-2">A exclusão é definitiva e não pode ser desfeita.</p>
        <Botao variante="secundario" className="border-erro/40 text-erro hover:border-erro" onClick={() => setAberto(true)}>
          Excluir minha conta
        </Botao>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="flex max-w-md flex-col gap-4 rounded-xl border border-erro/30 bg-erro-claro/40 p-5">
      <div className="text-sm text-tinta-2">
        <p className="font-semibold text-erro">Isto apaga de vez:</p>
        <ul className="mt-2 list-disc pl-5">
          {itens.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <CampoSenha rotulo="Sua senha" valor={senha} aoMudar={setSenha} autoComplete="current-password" />
      <Campo rotulo="Digite EXCLUIR para confirmar">
        {(p) => <Entrada {...p} value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="off" />}
      </Campo>
      {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" className="bg-erro hover:bg-erro/90" disabled={estado.tipo === 'enviando'}>
          {estado.tipo === 'enviando' ? 'Excluindo…' : 'Excluir conta definitivamente'}
        </Botao>
        <Botao
          type="button"
          variante="fantasma"
          onClick={() => {
            setAberto(false)
            setSenha('')
            setConfirmacao('')
            setEstado({ tipo: 'ocioso' })
          }}
        >
          Cancelar
        </Botao>
      </div>
    </form>
  )
}

export default ExcluirConta
