import { Admin } from "../models/Admin.js";
import { contasSuspensas, MENSAGEM_SUSPENSA } from "../services/suspensao.js";
import { verificarToken } from "../utils/jwt.js";

function lerToken(req) {
  const [esquema, token] = (req.headers.authorization ?? "").split(" ");
  return esquema === "Bearer" ? verificarToken(token, process.env.JWT_SECRET) : null;
}

// Exige "Authorization: Bearer <token>" de candidata ou empresa (por padrão,
// as duas). Conta suspensa pela administração perde o acesso na hora.
export function exigirLogin(tiposPermitidos = ["usuaria", "empresa"]) {
  return async (req, res, next) => {
    const payload = lerToken(req);
    if (!payload) {
      return res.status(401).json({ erro: "Sessão inválida. Faça login novamente." });
    }
    if (!tiposPermitidos.includes(payload.tipo)) {
      return res.status(403).json({ erro: "Você não tem permissão para acessar isto." });
    }
    try {
      if ((await contasSuspensas(payload.tipo)).has(payload.sub)) {
        return res.status(403).json({ erro: MENSAGEM_SUSPENSA, suspensa: true });
      }
    } catch (e) {
      return next(e);
    }
    req.auth = payload;
    next();
  };
}

// Área de administração: token de administrador ativo (conferido no banco a
// cada requisição). "niveis" restringe a ação (ex.: só "super").
export function exigirAdmin(niveis) {
  return async (req, res, next) => {
    const payload = lerToken(req);
    if (!payload || payload.tipo !== "admin") {
      return res.status(401).json({ erro: "Sessão de administração inválida. Entre de novo." });
    }
    try {
      const admin = await Admin.findByPk(payload.sub);
      if (!admin || !admin.ativo) return res.status(401).json({ erro: "Sessão de administração inválida. Entre de novo." });
      if (niveis && !niveis.includes(admin.nivel)) {
        return res.status(403).json({ erro: "Só administradores com acesso total podem fazer isso." });
      }
      req.auth = payload;
      req.admin = admin;
      next();
    } catch (e) {
      next(e);
    }
  };
}
