import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

import RotaPrivada from './components/RotaPrivada'
import LayoutAdmin from './components/admin/LayoutAdmin'
import LoginAdmin from './pages/admin/LoginAdmin'
import PainelAdmin from './pages/admin/Painel'
import DenunciasAdmin from './pages/admin/Denuncias'
import { Candidatas as CandidatasAdmin, DetalheCandidata as DetalheCandidataAdmin, DetalheEmpresa as DetalheEmpresaAdmin, Empresas as EmpresasAdmin } from './pages/admin/Contas'
import { ComunidadesAdmin, PublicacoesAdmin, VagasAdmin } from './pages/admin/Conteudo'
import { Administradores, Comunicados as ComunicadosAdmin, PagamentosAdmin, RegistroAdmin } from './pages/admin/Sistema'
import ContaAdmin from './pages/admin/MinhaConta'
import { obterSessao } from './services/auth'
import LayoutCandidata from './components/candidata/LayoutCandidata'

import Home from './pages/Home'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import RecuperarSenha from './pages/RecuperarSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import ConfirmarEmail from './pages/ConfirmarEmail'
import Empresas from './pages/Empresas'
import EmpresaDetalhe from './pages/EmpresaDetalhe'

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
import Conexoes from './pages/candidata/Conexoes'
import PerfilIntegrante from './pages/candidata/PerfilIntegrante'
import DetalheComunidade from './pages/candidata/DetalheComunidade'
import Mensagens from './pages/candidata/Mensagens'
import Conversa from './pages/candidata/Conversa'
import Notificacoes from './pages/candidata/Notificacoes'
import Configuracoes from './pages/candidata/Configuracoes'
import EmpresaPerfil from './pages/candidata/EmpresaPerfil'
import PremiumCandidata from './pages/candidata/Premium'
import PremiumEmpresa from './pages/empresa/Premium'
import DashboardEmpresa from './pages/empresa/Dashboard'

import LoginEmpresa from './pages/LoginEmpresa'
import CadastroEmpresa from './pages/CadastroEmpresa'
// Área privada da empresa
import LayoutEmpresa from './components/empresa/LayoutEmpresa'
import FeedEmpresa from './pages/empresa/Feed'
import ExplorarTalentos from './pages/empresa/ExplorarTalentos'
import PerfilEmpresa from './pages/empresa/Perfil'
import EditarPerfilEmpresa from './pages/empresa/EditarPerfil'
import PublicacoesEmpresa from './pages/empresa/Publicacoes'
import CriarPublicacao from './pages/empresa/CriarPublicacao'
import VagasEmpresa from './pages/empresa/Vagas'
import FormularioVaga from './pages/empresa/FormularioVaga'
import DetalheVagaEmpresa from './pages/empresa/DetalheVaga'
import CandidaturasEmpresa from './pages/empresa/Candidaturas'
import DetalheCandidaturaEmpresa from './pages/empresa/DetalheCandidatura'
import BancoTalentos from './pages/empresa/BancoTalentos'
import Talento from './pages/empresa/Talento'
import {
  Comunidades as ComunidadesEmpresa,
  DetalheComunidade as DetalheComunidadeEmpresa,
  Mensagens as MensagensEmpresa,
  Conversa as ConversaEmpresa,
} from './pages/empresa/Complementares'
import NotificacoesEmpresa from './pages/empresa/Notificacoes'
import ConfiguracoesEmpresa from './pages/empresa/Configuracoes'

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

// Login e cadastro de empresa: quem já entrou como empresa vai direto para
// o feed da área dela.
function AcessoEmpresa({ children }) {
  const sessao = obterSessao()
  if (sessao?.usuario?.tipo === 'empresa') return <Navigate to="/empresa/feed" replace />
  return children
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
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/confirmar-email" element={<ConfirmarEmail />} />

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
          <Route path="/candidata/mensagens/candidatas/:id" element={<Conversa tipo="candidatas" base="/candidata/mensagens" />} />
          <Route path="/candidata/pessoas/:id" element={<PerfilIntegrante />} />
          <Route path="/candidata/pessoas/:id/conexoes" element={<Conexoes />} />
          <Route path="/candidata/notificacoes" element={<Notificacoes />} />
          <Route path="/candidata/configuracoes" element={<Configuracoes />} />
          <Route path="/candidata/empresas/:id" element={<EmpresaPerfil />} />
          <Route path="/candidata/premium" element={<PremiumCandidata />} />
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
        {/* Antiga tela de contatos: a conversa com empresas acontece em Mensagens. */}
        <Route path="/contatos" element={<Redirecionar para="/candidata/mensagens" />} />

        {/* Acesso das empresas */}
        <Route path="/empresa" element={<AcessoEmpresa><LoginEmpresa /></AcessoEmpresa>} />
        <Route path="/empresa/login" element={<AcessoEmpresa><LoginEmpresa /></AcessoEmpresa>} />
        <Route path="/empresa/cadastro" element={<AcessoEmpresa><CadastroEmpresa /></AcessoEmpresa>} />
        {/* Endereço antigo do painel */}
        <Route path="/empresa/painel" element={<Navigate to="/empresa/feed" replace />} />

        {/* Área privada da empresa: um único layout, protegido por login de empresa */}
        <Route
          element={
            <RotaPrivada tipo="empresa">
              <LayoutEmpresa />
            </RotaPrivada>
          }
        >
          <Route path="/empresa/feed" element={<FeedEmpresa />} />
          <Route path="/empresa/explorar" element={<ExplorarTalentos />} />
          <Route path="/empresa/perfil" element={<PerfilEmpresa />} />
          <Route path="/empresa/perfil/editar" element={<EditarPerfilEmpresa />} />
          <Route path="/empresa/publicacoes" element={<PublicacoesEmpresa />} />
          <Route path="/empresa/publicacoes/criar" element={<CriarPublicacao />} />
          <Route path="/empresa/vagas" element={<VagasEmpresa />} />
          <Route path="/empresa/vagas/criar" element={<FormularioVaga key="criar" />} />
          <Route path="/empresa/vagas/:id" element={<DetalheVagaEmpresa />} />
          <Route path="/empresa/vagas/:id/editar" element={<FormularioVaga key="editar" />} />
          <Route path="/empresa/candidaturas" element={<CandidaturasEmpresa />} />
          <Route path="/empresa/candidaturas/:id" element={<DetalheCandidaturaEmpresa />} />
          <Route path="/empresa/talentos" element={<BancoTalentos />} />
          <Route path="/empresa/talentos/:id" element={<Talento />} />
          <Route path="/empresa/comunidades" element={<ComunidadesEmpresa />} />
          <Route path="/empresa/comunidades/:id" element={<DetalheComunidadeEmpresa />} />
          <Route path="/empresa/mensagens" element={<MensagensEmpresa />} />
          <Route path="/empresa/mensagens/:id" element={<ConversaEmpresa />} />
          <Route path="/empresa/notificacoes" element={<NotificacoesEmpresa />} />
          <Route path="/empresa/configuracoes" element={<ConfiguracoesEmpresa />} />
          <Route path="/empresa/premium" element={<PremiumEmpresa />} />
          <Route path="/empresa/dashboard" element={<DashboardEmpresa />} />
        </Route>

        {/* Qualquer outro endereço volta para a Home */}
        {/* Administração: login próprio e área só para contas "admin" */}
        <Route path="/admin/login" element={<LoginAdmin />} />
        <Route
          element={
            <RotaPrivada tipo="admin">
              <LayoutAdmin />
            </RotaPrivada>
          }
        >
          <Route path="/admin" element={<PainelAdmin />} />
          <Route path="/admin/candidatas" element={<CandidatasAdmin />} />
          <Route path="/admin/candidatas/:id" element={<DetalheCandidataAdmin />} />
          <Route path="/admin/empresas" element={<EmpresasAdmin />} />
          <Route path="/admin/empresas/:id" element={<DetalheEmpresaAdmin />} />
          <Route path="/admin/vagas" element={<VagasAdmin />} />
          <Route path="/admin/publicacoes" element={<PublicacoesAdmin />} />
          <Route path="/admin/comunidades" element={<ComunidadesAdmin />} />
              <Route path="/admin/denuncias" element={<DenunciasAdmin />} />
          <Route path="/admin/comunicados" element={<ComunicadosAdmin />} />
              <Route path="/admin/pagamentos" element={<PagamentosAdmin />} />
          <Route path="/admin/registro" element={<RegistroAdmin />} />
          <Route path="/admin/administradores" element={<Administradores />} />
          <Route path="/admin/conta" element={<ContaAdmin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
