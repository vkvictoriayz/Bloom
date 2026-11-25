import { useState } from 'react'

import Icone from './Icone'
import { cn } from '../lib/cn'

const moldura = 'w-full max-w-[300px] rounded-2xl border border-linha bg-branco p-4 shadow-[0_14px_34px_-24px_rgba(94,26,50,0.45)]'

export function PreviaPublicacao() {
  const [curtiu, setCurtiu] = useState(false)
  return (
    <div className={moldura}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-full bg-blush text-xs font-bold text-vinho" aria-hidden="true">
          VC
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-tinta">Você</span>
          <span className="block text-[11px] text-suave">Desenvolvedora Front-end · agora</span>
        </span>
        <span className="ml-auto rounded-full bg-blush px-2 py-0.5 text-[10px] font-semibold text-vinho">Conquista</span>
      </div>
      <p className="mt-3 text-[13px] leading-snug text-tinta">
        Terminei meu primeiro projeto em React com testes! <strong className="font-semibold text-vinho">#frontend</strong>
      </p>
      <div className="mt-3 flex items-center gap-3 border-t border-linha pt-2.5 text-xs text-suave">
        <button
          type="button"
          onClick={() => setCurtiu((v) => !v)}
          aria-pressed={curtiu}
          className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 transition-colors hover:bg-blush', curtiu && 'text-vinho')}
        >
          <span key={String(curtiu)} className={curtiu ? 'inline-flex animate-[pulsar_.45s_ease-out]' : 'inline-flex'}>
            <Icone nome="coracao" tamanho={14} preenchido={curtiu} />
          </span>
          {curtiu ? 13 : 12}
        </button>
        <span className="inline-flex items-center gap-1">
          <Icone nome="mensagem" tamanho={14} /> 4
        </span>
        <span className="ml-auto text-[10px] tracking-wide uppercase">Exemplo</span>
      </div>
    </div>
  )
}

export function PreviaFiltros() {
  const [ativos, setAtivos] = useState(['Remoto', 'Júnior'])
  const opcoes = ['Remoto', 'Híbrido', 'Júnior', 'Dados', 'Front-end', 'CLT']
  return (
    <div className="mt-5 rounded-xl bg-papel p-3">
      <div className="flex flex-wrap gap-1.5">
        {opcoes.map((o) => {
          const on = ativos.includes(o)
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => setAtivos((a) => (on ? a.filter((x) => x !== o) : [...a, o]))}
              className={cn('rounded-full px-2.5 py-1 text-xs font-semibold transition-colors', on ? 'bg-vinho text-white' : 'bg-branco text-tinta-2 ring-1 ring-linha hover:ring-vinho/40')}
            >
              {o}
            </button>
          )
        })}
      </div>
      <p className="mt-2.5 text-[11px] text-suave">Toque nos filtros para experimentar.</p>
    </div>
  )
}

export function PreviaEtapas() {
  const etapas = ['Enviada', 'Em análise', 'Entrevista', 'Resultado']
  return (
    <div className="mt-5 rounded-xl bg-papel p-3">
      <div className="flex items-center gap-1">
        {etapas.map((e, i) => (
          <span key={e} className="flex flex-1 flex-col gap-1.5">
            <span className={cn('h-1.5 rounded-full', i < 2 ? 'bg-vinho' : 'bg-linha')} />
            <span className={cn('text-[10px] font-semibold', i === 1 ? 'text-vinho' : 'text-suave')}>{e}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function PreviaPerfil() {
  return (
    <div className={moldura}>
      <div className="-mx-4 -mt-4 mb-8 h-12 rounded-t-2xl bg-vinho-escuro" aria-hidden="true" />
      <span className="-mt-14 mb-2 grid size-12 place-items-center rounded-full bg-blush text-sm font-bold text-vinho ring-4 ring-branco" aria-hidden="true">
        VC
      </span>
      <span className="block text-sm font-semibold text-tinta">Seu nome</span>
      <span className="block text-[11px] text-vinho">Desenvolvedora Front-end</span>
      <div className="mt-3 flex flex-wrap gap-1">
        {['React', 'TypeScript', 'Acessibilidade'].map((t) => (
          <span key={t} className="rounded-full bg-papel-2 px-2 py-0.5 text-[10px] font-semibold text-tinta-2">
            {t}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-linha p-2">
        <span className="grid size-7 place-items-center rounded-md bg-blush text-vinho" aria-hidden="true">
          <Icone nome="pasta" tamanho={14} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-tinta">Portfólio pessoal</span>
        <Icone nome="codigo" tamanho={13} className="text-suave" />
        <Icone nome="externo" tamanho={13} className="text-suave" />
      </div>
    </div>
  )
}
