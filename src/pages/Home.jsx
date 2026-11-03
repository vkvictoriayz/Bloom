import { Navigate } from 'react-router-dom'

import HomePublica from './HomePublica'
import { useSessao } from '../hooks/useSessao'

// "/" é a landing pública. A candidata autenticada vai direto para o feed
// da área privada.
function Home() {
  const sessao = useSessao()
  if (sessao?.usuario?.tipo === 'usuaria') return <Navigate to="/candidata/feed" replace />
  return <HomePublica />
}

export default Home
