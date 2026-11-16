import { useId, useState } from 'react'

import Icone from '../Icone'
import Botao from '../ui/Botao'
import { AreaTexto, Aviso, Selecao } from '../ui/Campo'
import { api } from '../../services/api'
import { obterSessao } from '../../services/auth'
import { cn } from '../../lib/cn'

// Motivos aceitos pela API (src/models/Denuncia.js).
const MOTIVOS = [
  ['spam', 'Spam ou propaganda enganosa'],
  ['assedio', 'Assédio, ofensa ou discurso de ódio'],
  ['improprio', 'Conteúdo impróprio'],
  ['golpe', 'Golpe, vaga falsa ou informação enganosa'],
  ['dados', 'Exposição de dados pessoais'],
  ['outro', 'Outro motivo'],
]

const enviar = (corpo) => api('/denuncias', { method: 'POST', corpo, token: obterSessao()?.token })

// Formulário de denúncia (motivo + explicação opcional). "alvoTipo":
// publicacao | publicacao_empresa | comentario | perfil | empresa | vaga | comunidade.
export function FormularioDenuncia({ alvoTipo, alvoId, aoFechar, className }) {
  const id = useId()
  const [motivo, setMotivo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [estado, setEstado] = useState({ tipo: 'ocioso' })

  async function confirmar(e) {
    e.preventDefault()
    if (!motivo) return setEstado({ tipo: 'erro', texto: 'Escolha um motivo.' })
    setEstado({ tipo: 'enviando' })
    try {
      const r = await enviar({ alvoTipo, alvoId, motivo, descricao: descricao.trim() })
      setEstado({ tipo: 'sucesso', texto: r.mensagem })
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  if (estado.tipo === 'sucesso') {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <Aviso tipo="sucesso" className="flex-1">
          {estado.texto}
        </Aviso>
        <Botao tamanho="sm" variante="fantasma" onClick={aoFechar}>
          Fechar
        </Botao>
      </div>
    )
  }
  return (
    <form onSubmit={confirmar} className={cn('flex flex-col gap-2 rounded-xl border border-linha bg-papel p-3', className)} aria-label="Denunciar">
      <label htmlFor={`${id}-motivo`} className="text-sm font-semibold text-tinta-2">
        Por que você está denunciando?
      </label>
      <Selecao id={`${id}-motivo`} value={motivo} onChange={(e) => setMotivo(e.target.value)}>
        <option value="">Escolha um motivo</option>
        {MOTIVOS.map(([v, r]) => (
          <option key={v} value={v}>
            {r}
          </option>
        ))}
      </Selecao>
      <label htmlFor={`${id}-descricao`} className="text-sm text-tinta-2">
        Quer explicar? {motivo === 'outro' ? '(obrigatório)' : '(opcional)'}
      </label>
      <AreaTexto id={`${id}-descricao`} rows={2} maxLength={500} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      <p className="text-xs text-suave">A equipe da Bloom analisa cada denúncia. Quem foi denunciado não sabe quem denunciou.</p>
      {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" tamanho="sm" disabled={estado.tipo === 'enviando'}>
          {estado.tipo === 'enviando' ? 'Enviando…' : 'Enviar denúncia'}
        </Botao>
        <Botao type="button" tamanho="sm" variante="fantasma" onClick={aoFechar}>
          Cancelar
        </Botao>
      </div>
    </form>
  )
}

// Botão discreto "Denunciar" que abre o formulário logo abaixo.
function Denunciar({ alvoTipo, alvoId, rotulo = 'Denunciar', className }) {
  const [aberto, setAberto] = useState(false)
  if (aberto) return <FormularioDenuncia alvoTipo={alvoTipo} alvoId={alvoId} aoFechar={() => setAberto(false)} className={cn('mt-2 w-full', className)} />
  return (
    <button type="button" onClick={() => setAberto(true)} className={cn('inline-flex items-center gap-1.5 text-sm font-semibold text-suave hover:text-erro', className)}>
      <Icone nome="info" tamanho={15} /> {rotulo}
    </button>
  )
}

export default Denunciar
