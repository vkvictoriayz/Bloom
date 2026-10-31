import { Link } from "react-router-dom";
import "./TelaAcesso.css";
import login from "../assets/login.png";
import Logo from "./Logo";

// Moldura das telas de login, cadastro e recuperação de senha:
// formulário à esquerda e a ilustração da marca à direita.
function TelaAcesso({ titulo, subtitulo, aoEnviar, children, rodape }) {
  function enviar(evento) {
    evento.preventDefault();
    aoEnviar();
  }

  return (
    <div className="login">
      <div className="formulario">
        <div className="conteudo">
          <Link to="/" className="login-logo-link" title="Voltar para a página inicial">
            <Logo className="login-logo" />
          </Link>

          <header className="login-cabecalho">
            <h2>{titulo}</h2>
            {subtitulo && <p className="subtitulo">{subtitulo}</p>}
          </header>

          <form className="login-campos" onSubmit={enviar} noValidate>
            {children}
          </form>

          {rodape && <div className="login-rodape">{rodape}</div>}
        </div>
      </div>

      <div className="imagem">
        <img src={login} alt="Mulheres na tecnologia - BLOOM" />
      </div>
    </div>
  );
}

export default TelaAcesso;
