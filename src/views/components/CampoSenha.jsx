import { useState } from 'react'

import Icone from './Icone'
import { Campo, Entrada } from './ui/Campo'

function CampoSenha({ rotulo, valor, aoMudar, placeholder, autoComplete = 'current-password', acessorio, erro, obrigatorio, ajuda, rotuloOculto, icone }) {
  const [mostrar, setMostrar] = useState(false)

  return (
    <Campo rotulo={rotulo} acessorio={acessorio} erro={erro} obrigatorio={obrigatorio} ajuda={ajuda} rotuloOculto={rotuloOculto}>
      {(props) => (
        <div className="relative">
          {icone && <Icone nome={icone} tamanho={17} className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-suave" />}
          <Entrada
            {...props}
            type={mostrar ? 'text' : 'password'}
            placeholder={placeholder}
            value={valor}
            onChange={(e) => aoMudar(e.target.value)}
            autoComplete={autoComplete}
            className={icone ? 'pr-12 pl-11' : 'pr-12'}
          />
          <button
            type="button"
            className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-md text-suave hover:bg-papel-2 hover:text-tinta"
            onClick={() => setMostrar(!mostrar)}
            aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
            title={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <Icone nome={mostrar ? 'olho-fechado' : 'olho'} />
          </button>
        </div>
      )}
    </Campo>
  )
}

export default CampoSenha
