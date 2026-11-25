import { useState } from 'react'

import Icone from './Icone'
import { cn } from '../lib/cn'

import Botao from './ui/Botao'
import { CORES_ICONE, ehIcone, GRUPOS_ICONES, lerIcone } from '../data/icones'

export function IconeAvatar({ valor, forma = 'circulo', className, rotulo }) {
  const { nome, cor } = lerIcone(valor)
  const { fundo, traco, gradiente } = CORES_ICONE[cor]
  return (
    <span
      role={rotulo ? 'img' : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : 'true'}
      className={cn('relative grid shrink-0 place-items-center overflow-hidden shadow-[inset_0_-6px_14px_rgba(0,0,0,0.12)] ring-1 ring-black/5', forma === 'circulo' ? 'rounded-full' : 'rounded-[28%]', className)}
      style={{ backgroundColor: fundo, backgroundImage: gradiente, color: traco }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -top-1/3 -left-1/4 h-2/3 w-3/4 rounded-full bg-white/20 blur-md" />
      <Icone nome={nome} tamanho={24} className="relative h-[56%] w-[56%] drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]" />
    </span>
  )
}

export function SeletorIcone({ publico = 'usuaria', valor, aoEscolher, forma = 'circulo', rotuloBotao = 'Usar este símbolo', ocupado = false, aoCancelar }) {
  const itens = GRUPOS_ICONES[publico].flatMap(([, lista]) => lista)
  const atual = ehIcone(valor) ? lerIcone(valor) : null
  const inicial = atual && itens.some(([id]) => id === atual.nome) ? atual : { nome: itens[0][0], cor: atual?.cor ?? 'vinho' }
  const [nome, setNome] = useState(inicial.nome)
  const [cor, setCor] = useState(inicial.cor)
  const escolhido = `icone:${nome}:${cor}`
  const rotuloDe = (n) => itens.find(([id]) => id === n)?.[1] ?? n

  return (
    <div className="overflow-hidden rounded-2xl border border-linha bg-branco">
      <div className="flex items-center gap-5 bg-gradient-to-br from-blush via-papel to-branco p-5 sm:p-6">
        <IconeAvatar key={escolhido} valor={escolhido} forma={forma} className="size-20 animate-[surgir_.35s_cubic-bezier(.22,1,.36,1)] ring-4 ring-branco" rotulo={`Prévia: ${rotuloDe(nome)}, cor ${CORES_ICONE[cor].nome}`} />
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.14em] text-vinho uppercase">Símbolos Bloom</p>
          <p className="mt-1 font-display text-xl text-tinta">{rotuloDe(nome)}</p>
          <p className="text-sm text-suave">Tom {CORES_ICONE[cor].nome.toLowerCase()}</p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <fieldset>
          <legend className="text-xs font-semibold tracking-wide text-suave uppercase">Tom</legend>
          <div className="mt-2 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Tom do símbolo">
            {Object.entries(CORES_ICONE).map(([id, c]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={cor === id}
                aria-label={c.nome}
                title={c.nome}
                onClick={() => setCor(id)}
                className={cn('relative grid size-10 place-items-center rounded-full ring-offset-2 ring-offset-branco transition-[box-shadow,transform] hover:scale-105', cor === id ? 'ring-2 ring-tinta' : 'ring-1 ring-linha')}
                style={{ backgroundImage: c.gradiente }}
              >
                {cor === id && (
                  <span style={{ color: c.traco }} className="drop-shadow">
                    <Icone nome="check" tamanho={15} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-xs font-semibold tracking-wide text-suave uppercase">Símbolo</legend>
          <div className="mt-2 grid grid-cols-5 gap-2.5" role="radiogroup" aria-label="Símbolos Bloom">
            {itens.map(([id, rotulo]) => {
              const ativo = nome === id
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  aria-label={rotulo}
                  title={rotulo}
                  onClick={() => setNome(id)}
                  className={cn(
                    'group grid aspect-square place-items-center rounded-2xl border p-2 transition-[border-color,background-color,transform] duration-200',
                    ativo ? 'border-vinho bg-blush/60' : 'border-linha bg-papel hover:-translate-y-0.5 hover:border-vinho/40'
                  )}
                >
                  <IconeAvatar valor={`icone:${id}:${cor}`} forma={forma} className={cn('size-[82%] transition-transform duration-200', ativo ? 'scale-100' : 'scale-90 group-hover:scale-95')} />
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="mt-6 flex flex-wrap gap-2">
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
    </div>
  )
}
