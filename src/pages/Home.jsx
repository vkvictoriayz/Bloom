import HomePublica from './HomePublica'
import Painel from './Painel'
import { useSessao } from '../hooks/useSessao'

// "/" mostra duas experiências diferentes: a apresentação da Bloom para
// visitantes e o painel de trabalho para quem já entrou.
function Home() {
  const sessao = useSessao()
  return sessao?.usuario?.tipo === 'usuaria' || (sessao?.usuario && !sessao.usuario.tipo) ? <Painel /> : <HomePublica />
}

export default Home
