import Icone from '../Icone'
import BorboletaViva from '../borboleta/BorboletaViva'
import { cn } from '../../lib/cn'

function MarcaBloom({ icone, className }) {
  return (
    <div className={cn('mx-auto grid aspect-[4/3] w-full place-items-center', className)} aria-hidden="true">
      <div className="relative grid size-32 place-items-center rounded-full bg-blush">
        <span className="absolute inset-0 rounded-full border border-dashed border-vinho/20" />
        <BorboletaViva modo="planando" ritmo="4.2s" className="w-16" />
        <span className="absolute -right-1 -bottom-1 grid size-10 place-items-center rounded-full bg-branco text-vinho shadow-sm ring-1 ring-linha">
          <Icone nome={icone} tamanho={18} />
        </span>
      </div>
    </div>
  )
}

export function IlustracaoCodigo({ className }) {
  return <MarcaBloom icone="codigo" className={className} />
}

export function IlustracaoConexoes({ className }) {
  return <MarcaBloom icone="grupo" className={className} />
}

export function IlustracaoCrescimento({ className }) {
  return <MarcaBloom icone="broto" className={className} />
}

export function IlustracaoEmpresa({ className }) {
  return <MarcaBloom icone="predio" className={className} />
}
