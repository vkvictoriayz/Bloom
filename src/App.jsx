import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

import RotaPrivada from './components/RotaPrivada'
import LayoutCandidata from './components/candidata/LayoutCandidata'

import Home from './pages/Home'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import RecuperarSenha from './pages/RecuperarSenha'
import Empresas from './pages/Empresas'
import EmpresaDetalhe from './pages/EmpresaDetalhe'
import Contatos from './pages/Contatos'

// Área privada da candidata
import Feed from './pages/candidata/Feed'
import Explorar from './pages/candidata/Explorar'
import Perfil from './pages/candidata/Perfil'
import EditarPerfil from './pages/candidata/EditarPerfil'
import Vagas from './pages/candidata/Vagas'
import DetalhesVaga from './pages/candidata/DetalhesVaga'
import Candidatar from './pages/candidata/Candidatar'
import VagasSalvas from './pages/candidata/VagasSalvas'
import Candidaturas from './pages/candidata/Candidaturas'
import DetalheCandidatura from './pages/candidata/DetalheCandidatura'
import Andamento from './pages/candidata/Andamento'
import Projetos from './pages/candidata/Projetos'
import FormularioProjeto from './pages/candidata/FormularioProjeto'
import Comunidades from './pages/candidata/Comunidades'
import DetalheComunidade from './pages/candidata/DetalheComunidade'
import Mensagens from './pages/candidata/Mensagens'
import Conversa from './pages/candidata/Conversa'
import Notificacoes from './pages/candidata/Notificacoes'
import Configuracoes from './pages/candidata/Configuracoes'

import LoginEmpresa from './pages/LoginEmpresa'
import CadastroEmpresa from './pages/CadastroEmpresa'
import PainelEmpresa from './pages/PainelEmpresa'

// Páginas internas: só abrem para quem fez login ou cadastro.
// Sem sessão, a pessoa é direcionada para a tela de login.
function Protegida({ children }) {
  return <RotaPrivada tipo="usuaria">{children}</RotaPrivada>
}

// Endereços antigos da candidata continuam funcionando: redirecionam para
// /candidata/*, mantendo a busca (?busca=...).
function Redirecionar({ para }) {
  const { search, hash } = useLocation()
  return <Navigate to={`${para}${search}${hash}`} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home: apresentação para visitantes; a candidata logada vai para o feed */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        {/* Autenticação e Acesso da Candidata */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />

        {/* Empresas: abertas para todos conhecerem */}
        <Route path="/empresas" element={<Empresas />} />
        <Route path="/empresas/:slug" element={<EmpresaDetalhe />} />

        {/* Área privada da candidata: um único layout, protegido por login */}
        <Route
          element={
            <Protegida>
              <LayoutCandidata />
            </Protegida>
          }
        >
          <Route path="/candidata" element={<Navigate to="/candidata/feed" replace />} />
          <Route path="/candidata/feed" element={<Feed />} />
          <Route path="/candidata/explorar" element={<Explorar />} />
          <Route path="/candidata/perfil" element={<Perfil />} />
          <Route path="/candidata/perfil/editar" element={<EditarPerfil />} />
          <Route path="/candidata/vagas" element={<Vagas />} />
          <Route path="/candidata/vagas-salvas" element={<VagasSalvas />} />
          <Route path="/candidata/candidaturas" element={<Candidaturas />} />
          <Route path="/candidata/candidaturas/:id" element={<DetalheCandidatura />} />
          <Route path="/candidata/candidaturas/:id/andamento" element={<Andamento />} />
          <Route path="/candidata/projetos" element={<Projetos />} />
          <Route path="/candidata/projetos/criar" element={<FormularioProjeto key="criar" />} />
          <Route path="/candidata/projetos/:id/editar" element={<FormularioProjeto key="editar" />} />
          <Route path="/candidata/comunidades" element={<Comunidades />} />
          <Route path="/candidata/mensagens" element={<Mensagens />} />
          <Route path="/candidata/mensagens/:id" element={<Conversa />} />
          <Route path="/candidata/notificacoes" element={<Notificacoes />} />
          <Route path="/candidata/configuracoes" element={<Configuracoes />} />
          <Route path="/vagas/:id" element={<DetalhesVaga />} />
          <Route path="/vagas/:id/candidatar" element={<Candidatar />} />
          <Route path="/comunidades/:id" element={<DetalheComunidade />} />
        </Route>

        {/* Endereços antigos da candidata */}
        <Route path="/vagas" element={<Redirecionar para="/candidata/vagas" />} />
        <Route path="/perfil" element={<Redirecionar para="/candidata/perfil" />} />
        <Route path="/editar-perfil" element={<Redirecionar para="/candidata/perfil/editar" />} />
        <Route path="/minhas-candidaturas" element={<Redirecionar para="/candidata/candidaturas" />} />
        <Route path="/vagas-salvas" element={<Redirecionar para="/candidata/vagas-salvas" />} />
        <Route path="/comunidade" element={<Redirecionar para="/candidata/feed" />} />
        <Route path="/contatos" element={<Protegida><Contatos /></Protegida>} />

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
