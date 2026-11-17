import { Navigate } from 'react-router-dom'

import HomePublica from './HomePublica'
import { useSessao } from '../hooks/useSessao'

function Home() {
  const sessao = useSessao()
  if (sessao?.usuario?.tipo === 'usuaria') return <Navigate to="/candidata/feed" replace />
  if (sessao?.usuario?.tipo === 'empresa') return <Navigate to="/empresa/feed" replace />
  return <HomePublica />
}

export default Home
