import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import LoginEmpresa from "./pages/LoginEmpresa";
import CadastroEmpresa from "./pages/CadastroEmpresa";
import RecuperarSenha from "./pages/RecuperarSenha";
import Perfil from "./pages/Perfil";
import EditarPerfil from "./pages/EditarPerfil";
import MinhasCandidaturas from "./pages/MinhasCandidaturas";
import VagasSalvas from "./pages/VagasSalvas";
import Home from "./pages/Home";
import Vagas from "./pages/Vagas";
import DetalhesVaga from "./pages/DetalhesVaga";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/home" element={<Home />} />

        <Route path="/vagas" element={<Vagas />} />

        <Route path="/cadastro" element={<Cadastro />} />

        <Route path="/empresa" element={<LoginEmpresa />} />

        <Route
          path="/empresa/cadastro"
          element={<CadastroEmpresa />}
        />

        <Route
          path="/recuperar-senha"
          element={<RecuperarSenha />}
        />

        <Route path="/perfil" element={<Perfil />} />

        <Route
          path="/editar-perfil"
          element={<EditarPerfil />}
        />

        <Route
          path="/minhas-candidaturas"
          element={<MinhasCandidaturas />}
        />

        <Route
          path="/vagas-salvas"
          element={<VagasSalvas />}
        />

        <Route path="/vaga" element={<DetalhesVaga />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;