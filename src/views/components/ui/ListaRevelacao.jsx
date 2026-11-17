import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

function ListaRevelacao({ itens, className }) {
  return (
    <ul className={cn('border-t border-linha', className)}>
      {itens.map((item) => (
        <li key={item.id} className="relative border-b border-linha">
          <Link
            to={item.para}
            className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 py-5 transition-colors hover:bg-branco sm:grid-cols-[3.5rem_1fr_1fr_auto] sm:gap-x-6 sm:px-2"
          >
            <span className="relative text-sm text-suave tabular-nums">
              <span className="transition-opacity duration-200 group-hover:opacity-0 group-focus-visible:opacity-0">{item.numero}</span>
              <span className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 scale-75 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100">
                {item.midia}
              </span>
            </span>
            <span className="min-w-0 font-display text-xl text-tinta transition-transform duration-200 group-hover:translate-x-1 group-hover:text-vinho sm:text-2xl">
              {item.titulo}
            </span>
            <span className="col-start-2 text-sm text-suave sm:col-start-auto">{item.subtitulo}</span>
            <span className="col-start-3 row-span-2 row-start-1 text-right text-sm font-semibold whitespace-nowrap text-tinta-2 sm:col-start-auto sm:row-span-1">
              {item.detalhe}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default ListaRevelacao
