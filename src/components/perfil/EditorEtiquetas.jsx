import { useId, useState } from 'react'

import Icone from '../Icone'
import { estiloControle } from '../ui/Campo'
import { cn } from '../../lib/cn'

// Competências como etiquetas: digite e tecle Enter (ou vírgula) para incluir.
// variante "cheia" (técnicas) ou "contorno" (comportamentais), para
// diferenciar os dois grupos à primeira vista.
function EditorEtiquetas({ rotulo, itens, aoMudar, sugestao, vazio, variante = 'contorno' }) {
  const [texto, setTexto] = useState('')
  const id = useId()

  // Aceita uma ou várias separadas por vírgula (ex.: texto colado).
  function incluir(valor = texto) {
    const novos = valor
      .split(',')
      .map((parte) => parte.trim())
      .filter(Boolean)
      .filter((parte, i, lista) => lista.findIndex((p) => p.toLowerCase() === parte.toLowerCase()) === i)
      .filter((parte) => !itens.some((item) => item.toLowerCase() === parte.toLowerCase()))
    if (novos.length) aoMudar([...itens, ...novos])
    setTexto('')
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-tinta-2">
        {rotulo}
      </label>
      <ul className="mt-3 flex min-h-8 flex-wrap gap-2" aria-label={rotulo}>
        {itens.length === 0 && <li className="text-sm text-suave">{vazio}</li>}
        {itens.map((item) => (
          <li key={item}>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border py-1.5 pr-1 pl-3.5 text-sm font-semibold',
                variante === 'cheia' ? 'border-transparent bg-vinho text-white [&_button]:text-white/70 [&_button:hover]:bg-white/15 [&_button:hover]:text-white' : 'border-linha-forte bg-branco text-tinta'
              )}
            >
              {item}
              <button
                type="button"
                onClick={() => aoMudar(itens.filter((i) => i !== item))}
                className="grid size-6 place-items-center rounded-full text-suave hover:bg-papel-2 hover:text-tinta"
                aria-label={`Remover ${item}`}
              >
                <Icone nome="fechar" tamanho={12} />
              </button>
            </span>
          </li>
        ))}
      </ul>
      <input
        id={id}
        value={texto}
        maxLength={200}
        onChange={(e) => (e.target.value.includes(',') ? incluir(e.target.value) : setTexto(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            incluir()
          }
        }}
        onBlur={() => texto.trim() && incluir()}
        placeholder={sugestao}
        className={cn(estiloControle, 'mt-3 h-10 max-w-sm')}
      />
    </div>
  )
}

export default EditorEtiquetas
