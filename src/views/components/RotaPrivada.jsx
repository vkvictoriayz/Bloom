import { Navigate } from "react-router-dom";
import { obterSessao } from "../services/auth";

// Só deixa entrar quem está logada com o tipo certo ("usuaria", "empresa" ou "admin").
// Senão, manda para a tela de login correspondente.
function RotaPrivada({ tipo = "usuaria", children }) {
  const sessao = obterSessao();

  if (!sessao || sessao.usuario?.tipo !== tipo) {
    const login = { empresa: "/empresa/login", admin: "/admin/login" }[tipo] ?? "/login";
    return <Navigate to={login} replace />;
  }

  return children;
}

export default RotaPrivada;
