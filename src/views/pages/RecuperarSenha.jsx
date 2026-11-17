import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TelaAcesso, { LinkAcesso } from '../components/TelaAcesso'
import Botao from '../components/ui/Botao'
import { Aviso, Campo, Entrada } from '../components/ui/Campo'
import { pedirRedefinicaoSenha } from '../services/auth'
import { cn } from '../lib/cn'

const TIPOS = [
  { id: 'usuaria', rotulo: 'Sou candidata' },
  { id: 'empresa', rotulo: 'Sou empresa' },
]

function RecuperarSenha() {
  const [parametros] = useSearchParams()
  const [tipo, setTipo] = useState(parametros.get('tipo') === 'empresa' ? 'empresa' : 'usuaria')
  const [email, setEmail] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [tipoMensagem, setTipoMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMensagem('Digite um e-mail válido.')
      setTipoMensagem('erro')
      return
    }
    setEnviando(true)
    try {
      const r = await pedirRedefinicaoSenha({ email: email.trim(), tipo })
      setMensagem(r.mensagem)
      setTipoMensagem('sucesso')
    } catch (erro) {
      setMensagem(erro.message)
      setTipoMensagem('erro')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <TelaAcesso
      titulo="Recuperar senha"
      subtitulo="Não se preocupe! Informe seu e-mail para recuperar o acesso."
      aoEnviar={handleSubmit}
      visual={{ itens: ['Vagas de tecnologia em um só lugar', 'Candidaturas com etapas claras', 'Perfil profissional que você controla'] }}
      rodape={
        <p>
          Lembrou sua senha? <LinkAcesso to={tipo === 'empresa' ? '/empresa/login' : '/login'}>Voltar ao login</LinkAcesso>
        </p>
      }
    >
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-tinta-2">Tipo de conta</legend>
        <div className="flex w-fit rounded-full border border-linha bg-papel p-1">
          {TIPOS.map((t) => (
            <label
              key={t.id}
              className={cn(
                'inline-flex h-9 cursor-pointer items-center rounded-full px-4 text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-vinho/40',
                tipo === t.id ? 'bg-vinho text-white' : 'text-tinta-2 hover:text-tinta'
              )}
            >
              <input type="radio" name="tipo" value={t.id} checked={tipo === t.id} onChange={() => setTipo(t.id)} className="sr-only" />
              {t.rotulo}
            </label>
          ))}
        </div>
      </fieldset>

      <Campo rotulo="E-mail">
        {(props) => (
          <Entrada
            {...props}
            type="email"
            placeholder="voce@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </Campo>

      {mensagem && <Aviso tipo={tipoMensagem}>{mensagem}</Aviso>}

      <Botao type="submit" tamanho="lg" className="mt-2 w-full" disabled={enviando}>
        {enviando ? 'Enviando…' : 'Recuperar senha'}
      </Botao>
    </TelaAcesso>
  )
}

export default RecuperarSenha
