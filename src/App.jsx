import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import RotaPrivada from './components/RotaPrivada'

import Home from './pages/Home'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import RecuperarSenha from './pages/RecuperarSenha'
import Vagas from './pages/Vagas'
import DetalhesVaga from './pages/DetalhesVaga'
import Perfil from './pages/Perfil'
import Candidaturas from './pages/Candidaturas'
import Empresas from './pages/Empresas'
import EmpresaDetalhe from './pages/EmpresaDetalhe'
import Contatos from './pages/Contatos'
import Comunidade from './pages/Comunidade'

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
        {/* Home: apresentação para visitantes, painel para quem entrou */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        {/* Autenticação e Acesso da Candidata */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />

        {/* Empresas: abertas para todos conhecerem */}
        <Route path="/empresas" element={<Empresas />} />
        <Route path="/empresas/:slug" element={<EmpresaDetalhe />} />

        {/* Áreas protegidas da candidata (exigem login) */}
        <Route path="/vagas" element={<Protegida><Vagas /></Protegida>} />
        <Route path="/vagas/:id" element={<Protegida><DetalhesVaga /></Protegida>} />
        <Route path="/perfil" element={<Protegida><Perfil /></Protegida>} />
        <Route path="/editar-perfil" element={<Protegida><Perfil /></Protegida>} />
        <Route path="/minhas-candidaturas" element={<Protegida><Candidaturas /></Protegida>} />
        <Route path="/vagas-salvas" element={<Protegida><Candidaturas /></Protegida>} />
        <Route path="/contatos" element={<Protegida><Contatos /></Protegida>} />
        <Route path="/comunidade" element={<Protegida><Comunidade /></Protegida>} />

        {/* Acesso das empresas */}
        <Route path="/empresa" element={<LoginEmpresa />} />
        <Route path="/empresa/login" element={<LoginEmpresa />} />
        <Route path="/empresa/cadastro" element={<CadastroEmpresa />} />
        {/* O painel confere a sessão da empresa (real ou demonstrativa) */}
        <Route path="/empresa/painel" element={<PainelEmpresa />} />

        {/* Qualquer outro endereço volta para a Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
