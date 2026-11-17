import { useState } from 'react'

import Botao from '../ui/Botao'

function BotaoSeguir({ nome, seguindo, aoAlternar, ocupado, tamanho = 'md', className }) {
  const [sobre, setSobre] = useState(false)
  return (
    <Botao
      tamanho={tamanho}
      variante={seguindo ? 'secundario' : 'primario'}
      aria-pressed={seguindo}
      aria-label={seguindo ? `Deixar de seguir ${nome}` : `Seguir ${nome}`}
      disabled={ocupado}
      onClick={aoAlternar}
      onMouseEnter={() => setSobre(true)}
      onMouseLeave={() => setSobre(false)}
      onFocus={() => setSobre(true)}
      onBlur={() => setSobre(false)}
      className={className}
    >
      {seguindo ? (sobre ? 'Deixar de seguir' : 'Seguindo') : 'Seguir'}
    </Botao>
  )
}

export default BotaoSeguir
