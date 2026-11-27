import Icone from './Icone'
import BorboletaDecorativa from './borboleta/BorboletaDecorativa'
import TextoRevelado from './movimento/TextoRevelado'
import { cn } from '../lib/cn'

// Disposição dos 4 recursos: larga / estreita, depois estreita / larga.
const LAYOUT = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7']

function CartaoRecurso({ recurso, indice }) {
  const largo = indice === 0 || indice === 3
  const Previa = recurso.previa
  const numero = String(indice + 1).padStart(2, '0')

  return (
    <li
      className={cn(
        'group relative isolate flex flex-col overflow-hidden rounded-[1.75rem] border border-rosa/10 bg-white/70 shadow-[0_14px_40px_-30px_rgba(94,26,50,0.45)] backdrop-blur-md',
        'transition-[transform,box-shadow,border-color] duration-500 ease-bloom hover:-translate-y-1.5 hover:border-rosa/25 hover:shadow-[0_24px_50px_-30px_rgba(94,26,50,0.55)]',
        largo && 'md:grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]',
        LAYOUT[indice]
      )}
    >
      {/* Fio rosa no topo, que se abre no hover */}
      <span
        aria-hidden="true"
        className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-rosa/60 to-transparent transition-[left,right] duration-500 ease-bloom group-hover:inset-x-0"
      />
      {/* Número grande, bem apagado */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -z-10 font-display text-[6.5rem] leading-none text-rosa/[0.07] select-none',
          largo ? '-top-4 right-5 md:top-auto md:right-auto md:-bottom-5 md:left-6' : '-top-4 right-5'
        )}
      >
        {numero}
      </span>

      <div className="flex flex-col p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-blush to-white text-rosa shadow-[0_8px_18px_-10px_rgba(156,74,99,0.6)] ring-1 ring-rosa/15 transition-transform duration-500 ease-bloom group-hover:-rotate-6"
          >
            <Icone nome={recurso.icone} tamanho={21} />
          </span>
          <span className="text-[11px] font-semibold tracking-[0.24em] text-rosa uppercase">Recurso {numero}</span>
        </div>
        <h3 className="mt-6 font-display text-2xl leading-tight text-tinta sm:text-[1.7rem]">{recurso.titulo}</h3>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-tinta-2">{recurso.texto}</p>
      </div>

      {Previa && (
        <div
          className={cn(
            'm-3 mt-auto flex items-center justify-center rounded-[1.25rem] border border-rosa/10 bg-blush/25 p-5 sm:p-6',
            'bg-[radial-gradient(rgba(156,74,99,0.13)_1px,transparent_1px)] [background-size:14px_14px]',
            '[&>div]:mt-0 [&>div]:w-full [&>div]:max-w-sm [&>div]:shadow-[0_12px_30px_-20px_rgba(94,26,50,0.45)]',
            largo ? 'md:mt-3 md:ml-0' : 'mt-0'
          )}
        >
          <Previa />
        </div>
      )}
    </li>
  )
}

function SecaoRecursos({ recursos }) {
  return (
    <section aria-labelledby="titulo-recursos" id="como-funciona" className="relative isolate scroll-mt-24">
      {/* Fundo próprio da seção: halo rosado + borboletas */}
      <div aria-hidden="true" className="pointer-events-none absolute -inset-x-4 -top-10 -bottom-6 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_70%_60%_at_85%_10%,rgba(244,228,233,0.95),transparent_70%)] sm:-inset-x-8" />
      <BorboletaDecorativa className="-top-12 right-[-2rem] -z-10 w-56 sm:w-80 lg:-top-20 lg:-right-6 lg:w-[24rem]" opacidade={0.26} rotacao={14} ritmo="6s" />

      <div className="mb-10 grid gap-6 lg:mb-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-[0.28em] text-rosa uppercase">Recursos</p>
          <h2 id="titulo-recursos" className="max-w-2xl font-display text-[2.1rem] leading-[1.08] text-tinta sm:text-5xl">
            <TextoRevelado texto="Tudo para a sua carreira," /> <em className="text-rosa">em um só lugar</em>
          </h2>
        </div>
        <p className="max-w-md text-tinta-2 lg:justify-self-end lg:pb-2">
          Os mesmos recursos que você usa depois de entrar na plataforma.
        </p>
      </div>

      <ul className="relative grid gap-4 sm:gap-5 lg:grid-cols-12">
        {recursos.map((r, i) => (
          <CartaoRecurso key={r.titulo} recurso={r} indice={i} />
        ))}
        {/* Pequena borboleta pousada entre os cartões */}
        <BorboletaDecorativa
          className="top-1/2 left-[57%] z-10 hidden w-12 -translate-x-1/2 -translate-y-1/2 lg:block"
          tom="rosa"
          modo="batendo"
          ritmo="1.6s"
          opacidade={0.85}
          rotacao={-10}
          duracaoFlutuar="6s"
          atraso="0.4s"
        />
      </ul>
    </section>
  )
}

export default SecaoRecursos
