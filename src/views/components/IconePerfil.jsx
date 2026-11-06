import { useState } from 'react'

import Icone from './Icone'
import { cn } from '../lib/cn'

import Botao from './ui/Botao'
import { CORES_ICONE, ehIcone, GRUPOS_ICONES, lerIcone } from '../data/icones'

// Fundo cheio + traço claro, para ficar legível tanto nos fundos claros quanto
// nos escuros do site.

// O ícone desenhado: círculo (perfil) ou quadrado arredondado (empresa e comunidade).
// "className" define o tamanho (ex.: "size-11").
export function IconeAvatar({ valor, forma = 'circulo', className, rotulo }) {
  const { nome, cor } = lerIcone(valor)
  const { fundo, traco } = CORES_ICONE[cor]
  return (
    <span
      role={rotulo ? 'img' : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : 'true'}
      className={cn('grid shrink-0 place-items-center ring-1 ring-black/5', forma === 'circulo' ? 'rounded-full' : 'rounded-[22%]', className)}
      style={{ backgroundColor: fundo, color: traco }}
    >
      <Icone nome={nome} tamanho={24} className="h-[54%] w-[54%]" />
    </span>
  )
}

// Seletor: grade de ícones + cores, com prévia. "publico" escolhe a lista
// ("usuaria" | "empresa" | "comunidade"). Chama aoEscolher("icone:nome:cor").
export function SeletorIcone({ publico = 'usuaria', valor, aoEscolher, forma = 'circulo', rotuloBotao = 'Usar este ícone', ocupado = false, aoCancelar }) {
  const inicial = ehIcone(valor) ? lerIcone(valor) : { nome: GRUPOS_ICONES[publico][0][1][0][0], cor: 'vinho' }
  const [nome, setNome] = useState(inicial.nome)
  const [cor, setCor] = useState(inicial.cor)
  const escolhido = `icone:${nome}:${cor}`
  const rotuloDe = (n) => GRUPOS_ICONES[publico].flatMap(([, itens]) => itens).find(([id]) => id === n)?.[1] ?? n

  return (
    <div className="rounded-xl border border-linha bg-papel p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <IconeAvatar valor={escolhido} forma={forma} className="size-16" rotulo={`Prévia: ${rotuloDe(nome)}, cor ${CORES_ICONE[cor].nome}`} />
        <div className="min-w-0">
          <p className="font-semibold text-tinta">{rotuloDe(nome)}</p>
          <p className="text-sm text-suave">Cor {CORES_ICONE[cor].nome.toLowerCase()}</p>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="text-xs font-semibold tracking-wide text-suave uppercase">Cor</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Cor do ícone">
          {Object.entries(CORES_ICONE).map(([id, c]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={cor === id}
              aria-label={c.nome}
              title={c.nome}
              onClick={() => setCor(id)}
              className={cn('size-9 rounded-full ring-offset-2 ring-offset-papel transition-shadow', cor === id ? 'ring-2 ring-tinta' : 'ring-1 ring-linha-forte hover:ring-tinta-2')}
              style={{ backgroundColor: c.fundo }}
            />
          ))}
        </div>
      </fieldset>

      {GRUPOS_ICONES[publico].map(([titulo, itens]) => (
        <fieldset key={titulo} className="mt-4">
          <legend className="text-xs font-semibold tracking-wide text-suave uppercase">{titulo}</legend>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8" role="radiogroup" aria-label={`Ícones: ${titulo}`}>
            {itens.map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={nome === id}
                aria-label={rotulo}
                title={rotulo}
                onClick={() => setNome(id)}
                className={cn(
                  'grid aspect-square place-items-center rounded-lg border bg-branco transition-colors',
                  nome === id ? 'border-vinho bg-blush text-vinho' : 'border-linha text-tinta-2 hover:border-linha-forte hover:text-tinta'
                )}
              >
                <Icone nome={id} tamanho={22} />
              </button>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="mt-5 flex flex-wrap gap-2">
        <Botao tamanho="sm" disabled={ocupado} onClick={() => aoEscolher(escolhido)}>
          {ocupado ? 'Salvando…' : rotuloBotao}
        </Botao>
        {aoCancelar && (
          <Botao tamanho="sm" variante="secundario" onClick={aoCancelar}>
            Cancelar
          </Botao>
        )}
      </div>
    </div>
  )
}
