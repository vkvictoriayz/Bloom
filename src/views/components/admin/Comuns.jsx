import { useId, useState } from 'react'

import Icone from '../Icone'
import Botao from '../ui/Botao'
import { baixarRelatorio } from '../../services/admin'
import { AreaTexto, Aviso } from '../ui/Campo'
import { cn } from '../../lib/cn'

export function AcaoComMotivo({ rotulo, rotuloConfirmar, perigo = true, aoConfirmar, aoConcluir, extra, tamanho = 'sm', variante = 'secundario', ajuda }) {
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [estado, setEstado] = useState({ tipo: 'ocioso' })
  const idMotivo = useId()

  async function confirmar(e) {
    e.preventDefault()
    if (motivo.trim().length < 5) return setEstado({ tipo: 'erro', texto: 'Explique o motivo (pelo menos 5 caracteres).' })
    setEstado({ tipo: 'enviando' })
    try {
      const r = await aoConfirmar(motivo.trim())
      setAberto(false)
      setMotivo('')
      setEstado({ tipo: 'ocioso' })
      aoConcluir?.(r)
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  if (!aberto) {
    return (
      <Botao tamanho={tamanho} variante={variante} className={cn(perigo && 'text-erro')} onClick={() => setAberto(true)}>
        {rotulo}
      </Botao>
    )
  }
  return (
    <form onSubmit={confirmar} className="flex w-full flex-col gap-2 rounded-xl border border-linha bg-papel p-3" aria-label={rotulo}>
      <label className="text-sm font-semibold text-tinta-2" htmlFor={idMotivo}>
        Motivo
      </label>
      <AreaTexto id={idMotivo} rows={2} maxLength={300} value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus />
      <p className="text-xs text-suave">{ajuda ?? 'Fica no registro de ações e é enviado à conta afetada.'}</p>
      {extra}
      {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" tamanho="sm" className={cn(perigo && 'bg-erro hover:bg-erro/90')} disabled={estado.tipo === 'enviando'}>
          {estado.tipo === 'enviando' ? 'Salvando…' : (rotuloConfirmar ?? rotulo)}
        </Botao>
        <Botao type="button" tamanho="sm" variante="fantasma" onClick={() => setAberto(false)}>
          Cancelar
        </Botao>
      </div>
    </form>
  )
}

export function Paginacao({ pagina, total, porPagina, aoMudar }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  if (paginas <= 1) return null
  return (
    <nav aria-label="Páginas" className="mt-4 flex items-center justify-between gap-3 text-sm">
      <Botao tamanho="sm" variante="secundario" disabled={pagina <= 1} onClick={() => aoMudar(pagina - 1)}>
        Anterior
      </Botao>
      <span className="text-suave tabular-nums">
        Página {pagina} de {paginas} · {total} no total
      </span>
      <Botao tamanho="sm" variante="secundario" disabled={pagina >= paginas} onClick={() => aoMudar(pagina + 1)}>
        Próxima
      </Botao>
    </nav>
  )
}

export function Filtros({ opcoes, valor, aoMudar, rotulo }) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap gap-2">
      {opcoes.map(([id, texto]) => (
        <button
          key={id || 'todas'}
          type="button"
          aria-pressed={valor === id}
          onClick={() => aoMudar(id)}
          className={cn(
            'rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
            valor === id ? 'border-tinta bg-tinta text-white' : 'border-linha-forte bg-branco text-tinta-2 hover:border-tinta'
          )}
        >
          {texto}
        </button>
      ))}
    </div>
  )
}

export function BotaoRelatorio({ recurso }) {
  const [estado, setEstado] = useState(null)
  async function baixar() {
    setEstado('baixando')
    try {
      await baixarRelatorio(recurso)
      setEstado(null)
    } catch (e) {
      setEstado(e.message)
    }
  }
  return (
    <span className="flex flex-col items-end gap-1">
      <Botao tamanho="sm" variante="secundario" onClick={baixar} disabled={estado === 'baixando'}>
        <Icone nome="documento" tamanho={15} /> {estado === 'baixando' ? 'Gerando…' : 'Exportar planilha'}
      </Botao>
      {estado && estado !== 'baixando' && <span className="text-xs text-erro">{estado}</span>}
    </span>
  )
}

