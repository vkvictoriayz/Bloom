import { Link } from 'react-router-dom'

import FaixaMarcas from './ui/FaixaMarcas'

function CarrosselAreas({ areas, estaAutenticada = false }) {
  function urlArea(area) {
    if (!estaAutenticada) return '/login'
    return `/vagas?area=${encodeURIComponent(area.nome)}`
  }

  const cartoes = areas.map((area, i) => (
    <Link
      key={area.nome}
      to={urlArea(area)}
      className="group flex h-full w-64 flex-col border-l border-linha-forte py-2 pr-6 pl-6 transition-colors hover:border-vinho"
    >
      <span className="text-xs font-semibold text-suave tabular-nums">{String(i + 1).padStart(2, '0')}</span>
      <h3 className="mt-6 font-display text-2xl leading-tight text-tinta group-hover:text-vinho">{area.nome}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-suave">{area.descricao}</p>
      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-vinho">
        Ver vagas <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
      </span>
    </Link>
  ))

  return <FaixaMarcas itens={cartoes} duracao={70} rotulo="Áreas de T.I." />
}

export default CarrosselAreas
