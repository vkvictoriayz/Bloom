import { Navigate } from "react-router-dom";
import { obterSessao } from "../services/auth";

function RotaPrivada({ tipo = "usuaria", children }) {
  const sessao = obterSessao();

  if (!sessao || sessao.usuario?.tipo !== tipo) {
    const login = { empresa: "/empresa/login", admin: "/admin/login" }[tipo] ?? "/login";
    return <Navigate to={login} replace />;
  }

  return children;
}

export default RotaPrivada;
