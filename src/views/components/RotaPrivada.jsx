import { Navigate } from "react-router-dom";
import { obterSessao } from "../services/auth";

// Só deixa entrar quem está logada com o tipo certo ("usuaria" ou "empresa").
// Senão, manda para a tela de login correspondente.
function RotaPrivada({ tipo = "usuaria", children }) {
  const sessao = obterSessao();

  if (!sessao || sessao.usuario?.tipo !== tipo) {
    return <Navigate to={tipo === "empresa" ? "/empresa/login" : "/login"} replace />;
  }

  return children;
}

export default RotaPrivada;
