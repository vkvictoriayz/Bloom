import { Link } from "react-router-dom";

// Linha "Lembrar de mim" + "Esqueceu sua senha?" (usada nos logins de candidata e de empresa)
function LembrarESenha({ lembrar, aoMudar, linkSenha = "/recuperar-senha" }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <label className="inline-flex cursor-pointer items-center gap-2 text-tinta-2">
        <input type="checkbox" checked={lembrar} onChange={(e) => aoMudar(e.target.checked)} className="size-4 cursor-pointer rounded accent-[#9c4a63]" />
        Lembrar de mim
      </label>
      <Link className="font-medium text-vinho-escuro underline-offset-4 hover:underline" to={linkSenha}>
        Esqueceu sua senha?
      </Link>
    </div>
  );
}

export default LembrarESenha;
