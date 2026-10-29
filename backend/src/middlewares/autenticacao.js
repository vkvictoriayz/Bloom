import { verificarToken } from "../utils/jwt.js";

// Exige "Authorization: Bearer <token>". Opcionalmente restringe o tipo de conta.
export function exigirLogin(tiposPermitidos) {
  return (req, res, next) => {
    const [esquema, token] = (req.headers.authorization ?? "").split(" ");
    const payload = esquema === "Bearer" ? verificarToken(token, process.env.JWT_SECRET) : null;

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
