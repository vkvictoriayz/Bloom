import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'

import MarcaEmpresa from './MarcaEmpresa'
import BorboletaViva from './borboleta/BorboletaViva'

const POSICOES = [
  [0, 0], [3, 0],
  [0, 1], [3, 1],
  [0, 2], [1, 2], [2, 2], [3, 2],
]

function MosaicoEmpresas({ empresas = [] }) {
  const reduzir = useReducedMotion()
  const lista = empresas.slice(0, POSICOES.length)
  return (
    <div className="grid size-full grid-cols-4 grid-rows-3 gap-2 bg-papel p-2 sm:gap-3 sm:p-3">
      <div className="col-span-2 row-span-2 col-start-2 row-start-1 grid place-items-center rounded-xl bg-vinho">
        <div className="w-[38%]">
          <BorboletaViva tom="clara" modo="planando" ritmo="3.4s" className="w-full" />
        </div>
      </div>
      {POSICOES.map(([c, l], i) => {
        const e = lista[i]
        const estilo = { gridColumnStart: c + 1, gridRowStart: l + 1 }
        if (!e) return <div key={i} style={estilo} className="rounded-xl border border-dashed border-linha" aria-hidden="true" />
        return (
          <motion.div
            key={e.id}
            style={estilo}
            initial={reduzir ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to={`/empresas/${e.id}`}
              title={e.nome}
              className="grid size-full place-items-center rounded-xl border border-linha bg-branco transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-vinho/40"
            >
              <MarcaEmpresa empresa={e} tamanho="md" className="rounded-lg border-0" />
              <span className="sr-only">{e.nome}</span>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}

export default MosaicoEmpresas
