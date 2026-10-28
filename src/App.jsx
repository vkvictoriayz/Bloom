import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import RotaPrivada from "./components/RotaPrivada";

import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import LoginEmpresa from "./pages/LoginEmpresa";
import CadastroEmpresa from "./pages/CadastroEmpresa";
import RecuperarSenha from "./pages/RecuperarSenha";
import PainelEmpresa from "./pages/PainelEmpresa";
import Perfil from "./pages/Perfil";
import EditarPerfil from "./pages/EditarPerfil";
import MinhasCandidaturas from "./pages/MinhasCandidaturas";
import VagasSalvas from "./pages/VagasSalvas";
import Home from "./pages/Home";
import Vagas from "./pages/Vagas";
import DetalhesVaga from "./pages/DetalhesVaga";

// Páginas da usuária: só abrem com login. Sem login, vai para "/".
function PrivadaUsuaria({ children }) {
  return <RotaPrivada tipo="usuaria">{children}</RotaPrivada>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />

        {/* Empresa */}
        <Route path="/empresa" element={<LoginEmpresa />} />
        <Route path="/empresa/cadastro" element={<CadastroEmpresa />} />
        <Route
          path="/empresa/painel"
          element={
            <RotaPrivada tipo="empresa">
              <PainelEmpresa />
            </RotaPrivada>
          }
        />

        {/* Usuária logada */}
        <Route path="/home" element={<PrivadaUsuaria><Home /></PrivadaUsuaria>} />
        <Route path="/vagas" element={<PrivadaUsuaria><Vagas /></PrivadaUsuaria>} />
        <Route path="/vaga" element={<PrivadaUsuaria><DetalhesVaga /></PrivadaUsuaria>} />
        <Route path="/perfil" element={<PrivadaUsuaria><Perfil /></PrivadaUsuaria>} />
        <Route path="/editar-perfil" element={<PrivadaUsuaria><EditarPerfil /></PrivadaUsuaria>} />
        <Route
          path="/minhas-candidaturas"
          element={<PrivadaUsuaria><MinhasCandidaturas /></PrivadaUsuaria>}
        />
        <Route path="/vagas-salvas" element={<PrivadaUsuaria><VagasSalvas /></PrivadaUsuaria>} />

        {/* Qualquer outro endereço volta para o login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
