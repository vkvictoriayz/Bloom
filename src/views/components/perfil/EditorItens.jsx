import { useState } from 'react'

import Icone from '../Icone'
import Botao from '../ui/Botao'
import { AreaTexto, Campo, Entrada } from '../ui/Campo'
import { cn } from '../../lib/cn'

function FormularioItem({ campos, inicial, aoSalvar, aoCancelar }) {
  const [valores, setValores] = useState(() =>
    Object.fromEntries(campos.map((c) => [c.nome, inicial?.[c.nome] ?? '']))
  )

  function enviar(e) {
    e.preventDefault()
    aoSalvar(Object.fromEntries(Object.entries(valores).map(([chave, valor]) => [chave, valor.trim()])))
  }

  return (
    <form onSubmit={enviar} className="grid gap-4 rounded-lg border border-linha bg-papel p-5 sm:grid-cols-2">
      {campos.map((campo) => (
        <Campo key={campo.nome} rotulo={campo.rotulo} opcional={!campo.obrigatorio} className={campo.largo ? 'sm:col-span-2' : undefined}>
          {(props) =>
            campo.tipo === 'textarea' ? (
              <AreaTexto
                {...props}
                rows={3}
                maxLength={campo.max ?? 500}
                required={campo.obrigatorio}
                value={valores[campo.nome]}
                onChange={(e) => setValores((v) => ({ ...v, [campo.nome]: e.target.value }))}
              />
            ) : (
              <Entrada
                {...props}
                type={campo.tipo ?? 'text'}
                maxLength={campo.max ?? 150}
                required={campo.obrigatorio}
                placeholder={campo.placeholder}
                value={valores[campo.nome]}
                onChange={(e) => setValores((v) => ({ ...v, [campo.nome]: e.target.value }))}
              />
            )
          }
        </Campo>
      ))}
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <Botao type="submit">Salvar</Botao>
        <Botao variante="fantasma" onClick={aoCancelar}>
          Cancelar
        </Botao>
      </div>
    </form>
  )
}

const LAYOUTS = {
  lista: { lista: 'border-t border-linha', item: 'border-b border-linha py-5' },
  linha: {
    lista: 'ml-2 border-l-2 border-linha',
    item: "relative py-5 pl-8 before:absolute before:top-7 before:-left-[9px] before:size-4 before:rounded-full before:border-4 before:border-papel before:bg-vinho before:content-['']",
  },
  grade: { lista: 'grid gap-4 sm:grid-cols-2', item: 'rounded-xl border border-linha bg-branco p-5' },
}

function EditorItens({ itens, campos, renderizar, rotuloAdicionar, vazio, aoMudar, layout = 'lista' }) {
  const estilo = LAYOUTS[layout]
  const [editando, setEditando] = useState(null)

  function salvar(item) {
    const novos = editando === 'novo' ? [...itens, item] : itens.map((atual, i) => (i === editando ? item : atual))
    aoMudar(novos)
    setEditando(null)
  }

  function remover(indice) {
    aoMudar(itens.filter((_, i) => i !== indice))
  }

  return (
    <div>
      {itens.length === 0 && editando !== 'novo' && vazio}

      {itens.length > 0 && (
        <ol className={estilo.lista}>
          {itens.map((item, i) =>
            editando === i ? (
              <li key={i} className={cn('py-4', layout === 'grade' && 'sm:col-span-2', layout === 'linha' && 'pl-8')}>
                <FormularioItem campos={campos} inicial={item} aoSalvar={salvar} aoCancelar={() => setEditando(null)} />
              </li>
            ) : (
              <li key={i} className={cn('group flex gap-4', estilo.item)}>
                <div className="min-w-0 flex-1">{renderizar(item)}</div>
                <div className="flex shrink-0 gap-1 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                  <Botao variante="fantasma" tamanho="icone" aria-label="Editar item" onClick={() => setEditando(i)}>
                    <Icone nome="editar" />
                  </Botao>
                  <Botao variante="fantasma" tamanho="icone" aria-label="Remover item" onClick={() => remover(i)}>
                    <Icone nome="lixeira" />
                  </Botao>
                </div>
              </li>
            )
          )}
        </ol>
      )}

      {editando === 'novo' ? (
        <div className="mt-4">
          <FormularioItem campos={campos} aoSalvar={salvar} aoCancelar={() => setEditando(null)} />
        </div>
      ) : (
        <Botao variante="secundario" tamanho="sm" className="mt-4" onClick={() => setEditando('novo')} disabled={editando !== null}>
          <Icone nome="mais" tamanho={16} /> {rotuloAdicionar}
        </Botao>
      )}
    </div>
  )
}

export default EditorItens
