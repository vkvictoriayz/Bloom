import { cn } from '../../lib/cn'
import { urlImagem } from '../../services/api'

function Capa({ imagem, className }) {
  return (
    <div className={cn('relative h-36 overflow-hidden rounded-t-xl bg-vinho-escuro sm:h-48', className)}>
      {imagem ? (
        <img src={urlImagem(imagem)} alt="" className="h-full w-full object-cover" />
      ) : (
        <>
          <svg className="absolute inset-0 size-full" aria-hidden="true">
            <defs>
              <pattern id="padrao-capa" width="96" height="84" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
                <g transform="translate(24 22) scale(0.42)" fill="#ffffff" fillOpacity="0.07">
                  <path d="M49.2 45.6C43 30 28 8 5.5 5C3.5 23 20 41 49.2 45.6Z" />
                  <path d="M48.6 48.4C40 46.2 31 44.8 23.5 44.6C21 56 26.5 70 35 75.5C40.5 76.5 46 62 48.6 48.4Z" />
                  <path d="M50.8 45.6C57 30 72 8 94.5 5C96.5 23 80 41 50.8 45.6Z" />
                  <path d="M51.4 48.4C60 46.2 69 44.8 76.5 44.6C79 56 73.5 70 65 75.5C59.5 76.5 54 62 51.4 48.4Z" />
                </g>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#padrao-capa)" />
          </svg>
          <div aria-hidden="true" className="absolute -right-16 -bottom-40 size-96 rounded-full bg-vinho/70" />
        </>
      )}
    </div>
  )
}

export default Capa
