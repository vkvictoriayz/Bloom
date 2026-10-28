import { verificarToken } from "../utils/jwt.js";

// Exige "Authorization: Bearer <token>". Opcionalmente restringe o tipo de conta.
export function exigirLogin(jwtSecret, tiposPermitidos) {
  return (req, res, next) => {
    const cabecalho = req.headers.authorization ?? "";
    const [esquema, token] = cabecalho.split(" ");

    const payload = esquema === "Bearer" ? verificarToken(token, jwtSecret) : null;

    if (!payload) {
      return res.status(401).json({ erro: "Sessão inválida. Faça login novamente." });
    }
    if (tiposPermitidos && !tiposPermitidos.includes(payload.tipo)) {
      return res.status(403).json({ erro: "Você não tem permissão para acessar isto." });
    }

    req.auth = payload;
    next();
  };
}
