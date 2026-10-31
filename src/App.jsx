import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import RotaPrivada from './components/RotaPrivada'

import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import RecuperarSenha from './pages/RecuperarSenha'
import Home from './pages/Home'
import Perfil from './pages/Perfil'
import Vagas from './pages/Vagas'
import DetalhesVaga from './pages/DetalhesVaga'

import LoginEmpresa from './pages/LoginEmpresa'
import CadastroEmpresa from './pages/CadastroEmpresa'
import PainelEmpresa from './pages/PainelEmpresa'

// Páginas internas: só abrem para quem fez login ou cadastro.
// Sem sessão, a pessoa volta para a tela inicial (login).
function Protegida({ children }) {
  return <RotaPrivada tipo="usuaria">{children}</RotaPrivada>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Telas iniciais */}
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />

        {/* Compatibilidade: o antigo endereço /login agora é a tela inicial */}
        <Route path="/login" element={<Navigate to="/" replace />} />

        {/* Área da candidata (exige login) */}
        <Route path="/home" element={<Protegida><Home /></Protegida>} />
        <Route path="/vagas" element={<Protegida><Vagas /></Protegida>} />
        <Route path="/vagas/:id" element={<Protegida><DetalhesVaga /></Protegida>} />
        <Route path="/perfil" element={<Protegida><Perfil /></Protegida>} />

        {/* Acesso das empresas */}
        <Route path="/empresa/login" element={<LoginEmpresa />} />
        <Route path="/empresa/cadastro" element={<CadastroEmpresa />} />
        <Route path="/empresa/painel" element={<PainelEmpresa />} />

        {/* Qualquer outro endereço volta para o login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
