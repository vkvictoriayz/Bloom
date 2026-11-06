import { useState } from 'react'

import Botao from '../ui/Botao'

// Botão Seguir / Seguindo. Em "Seguindo", o foco ou o mouse mostram
// "Deixar de seguir", para a ação ficar clara antes do clique.
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
