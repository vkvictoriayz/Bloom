import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import RotaPrivada from './components/RotaPrivada'

import Home from './pages/Home'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import RecuperarSenha from './pages/RecuperarSenha'
import Vagas from './pages/Vagas'
import DetalhesVaga from './pages/DetalhesVaga'
import Perfil from './pages/Perfil'

import LoginEmpresa from './pages/LoginEmpresa'
import CadastroEmpresa from './pages/CadastroEmpresa'
import PainelEmpresa from './pages/PainelEmpresa'

// Páginas internas: só abrem para quem fez login ou cadastro.
// Sem sessão, a pessoa é direcionada para a tela de login.
function Protegida({ children }) {
  return <RotaPrivada tipo="usuaria">{children}</RotaPrivada>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page (Página Inicial aberta para todos) */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        {/* Autenticação e Acesso da Candidata */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />

        {/* Áreas protegidas da candidata (exigem login) */}
        <Route
          path="/vagas"
          element={
            <Protegida>
              <Vagas />
            </Protegida>
          }
        />
        <Route
          path="/vagas/:id"
          element={
            <Protegida>
              <DetalhesVaga />
            </Protegida>
          }
        />
        <Route
          path="/perfil"
          element={
            <Protegida>
              <Perfil />
            </Protegida>
          }
        />
        {/* Subseções do perfil para compatibilidade */}
        <Route
          path="/editar-perfil"
          element={
            <Protegida>
              <Perfil />
            </Protegida>
          }
        />
        <Route
          path="/minhas-candidaturas"
          element={
            <Protegida>
              <Perfil />
            </Protegida>
          }
        />
        <Route
          path="/vagas-salvas"
          element={
            <Protegida>
              <Perfil />
            </Protegida>
          }
        />

        {/* Acesso das empresas */}
        <Route path="/empresa" element={<LoginEmpresa />} />
        <Route path="/empresa/login" element={<LoginEmpresa />} />
        <Route path="/empresa/cadastro" element={<CadastroEmpresa />} />
        <Route
          path="/empresa/painel"
          element={
            <RotaPrivada tipo="empresa">
              <PainelEmpresa />
            </RotaPrivada>
          }
        />

        {/* Qualquer outro endereço volta para a Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
