// Ícones de traço fino, no lugar dos emojis (que mudam de cara em cada sistema).
// Uso: <Icone nome="local" />  — herda a cor do texto (currentColor).

const CAMINHOS = {
  inicio: (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9v10h12V9" />
    </>
  ),
  perfil: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5c1.2-3.2 3.8-5 7-5s5.8 1.8 7 5" />
    </>
  ),
  candidaturas: (
    <>
      <rect x="4" y="7.5" width="16" height="11.5" rx="2" />
      <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5" />
      <path d="M4 12.5h16" />
    </>
  ),
  coracao: (
    <path d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.1c0 5.1-7 9.4-7 9.4Z" />
  ),
  sair: (
    <>
      <path d="M14 5h3.5A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5H14" />
      <path d="M10 8.5 6.5 12l3.5 3.5" />
      <path d="M6.5 12H15" />
    </>
  ),
  local: (
    <>
      <path d="M12 20s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10Z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
  salario: (
    <>
      <rect x="3.5" y="6.5" width="17" height="11" rx="2" />
      <circle cx="12" cy="12" r="2.4" />
    </>
  ),
  calendario: (
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  email: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </>
  ),
  telefone: (
    <path d="M6.5 4.5h3l1.5 4-2 1.3a10 10 0 0 0 5.2 5.2l1.3-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5C10.6 18.5 5.5 13.4 5 6.1a1.5 1.5 0 0 1 1.5-1.6Z" />
  ),
  busca: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.5-4.5" />
    </>
  ),
  filtros: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  olho: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  "olho-fechado": (
    <>
      <path d="M4 4l16 16" />
      <path d="M9.9 6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.4M6.5 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.3-1" />
      <path d="M10 10.1a2.8 2.8 0 0 0 3.9 3.9" />
    </>
  ),
  documento: (
    <>
      <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5Z" />
      <path d="M13.5 3.5V8H18M9 12.5h6M9 16h6" />
    </>
  ),
  voltar: <path d="M14.5 6 8.5 12l6 6" />,
  seta: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  externo: (
    <>
      <path d="M14 4.5h5.5V10" />
      <path d="M19.5 4.5 11 13" />
      <path d="M17.5 14v4a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V8A1.5 1.5 0 0 1 6 6.5h4" />
    </>
  ),
  fechar: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  mais: <path d="M12 5v14M5 12h14" />,
  predio: (
    <>
      <path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5V20" />
      <path d="M15 10h3.5a1.5 1.5 0 0 1 1.5 1.5V20M3.5 20h17" />
      <path d="M8.5 8h3M8.5 11.5h3M8.5 15h3" />
    </>
  ),
  mensagem: (
    <>
      <path d="M4.5 6.5A1.5 1.5 0 0 1 6 5h12a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V16.5H6A1.5 1.5 0 0 1 4.5 15Z" />
    </>
  ),
  editar: (
    <>
      <path d="M5 19h3.5L18.2 9.3a2 2 0 0 0-2.8-2.8L5.7 16.2Z" />
      <path d="m14 8 2.8 2.8" />
    </>
  ),
  lixeira: (
    <>
      <path d="M5 7h14M10 7V5.5h4V7M7 7l.8 11.5A1.5 1.5 0 0 0 9.3 20h5.4a1.5 1.5 0 0 0 1.5-1.5L17 7" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  relogio: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 1.5" />
    </>
  ),
  maleta: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 13h17" />
    </>
  ),
  broto: (
    <>
      <path d="M12 20v-8" />
      <path d="M12 12c0-4 2.5-6.5 7-6.5 0 4.5-2.5 6.5-7 6.5Z" />
      <path d="M12 14.5c0-3-2-5-5.5-5 0 3.4 2 5 5.5 5Z" />
    </>
  ),
  pasta: (
    <>
      <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5Z" />
    </>
  ),
  grupo: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 18.5c.9-2.8 3-4.3 5.5-4.3s4.6 1.5 5.5 4.3" />
      <circle cx="16.5" cy="8.5" r="2.4" />
      <path d="M15.5 13.6c2.3-.2 4.3 1.1 5 3.9" />
    </>
  ),
  sino: (
    <>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  engrenagem: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6" />
    </>
  ),
  imagem: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m4 17 5-4.5 3.5 3 3-2.5 4.5 4" />
    </>
  ),
  cadeado: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  lampada: (
    <>
      <path d="M9 17.5h6M10 20.5h4" />
      <path d="M12 3.5a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3.5Z" />
    </>
  ),
  estrela: <path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6Z" />,
  compartilhar: (
    <>
      <path d="M20 4 10.5 13.5" />
      <path d="M20 4 14 20l-3.5-6.5L4 10Z" />
    </>
  ),
  mais_opcoes: (
    <>
      <circle cx="6" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="18" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  codigo:<path d="m8.5 7.5-4.5 4.5 4.5 4.5M15.5 7.5l4.5 4.5-4.5 4.5M13.5 5l-3 14" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8v.01" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  coroa: (
    <>
      <path d="M4.5 17.5 3.5 8l5 4 3.5-6 3.5 6 5-4-1 9.5Z" />
      <path d="M5 20h14" />
    </>
  ),
  megafone: (
    <>
      <path d="M4 10.5v3a1.5 1.5 0 0 0 1.5 1.5H8l7 4V5L8 9H5.5A1.5 1.5 0 0 0 4 10.5Z" />
      <path d="M8 15l1.5 4.5" />
      <path d="M18.5 9.5a3.5 3.5 0 0 1 0 5" />
    </>
  ),
  grafico: (
    <>
      <path d="M4 19.5h16" />
      <path d="M7 16v-5" />
      <path d="M12 16V7.5" />
      <path d="M17 16v-8" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </>
  ),
  // Ícones de perfil e comunidades (tecnologia, carreira e rede; "codigo"
  // e os demais já existentes acima também fazem parte do catálogo).
  terminal: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="m7.5 10 2.5 2-2.5 2" />
      <path d="M12.5 14.5h4" />
    </>
  ),
  dados: (
    <>
      <ellipse cx="12" cy="6.5" rx="7" ry="2.5" />
      <path d="M5 6.5v11c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-11" />
      <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
    </>
  ),
  nuvem: <path d="M7.5 18.5a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17.6 9.6a4.5 4.5 0 0 1-.6 8.9Z" />,
  chip: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 10h4v4h-4z" />
      <path d="M10 3.5V7M14 3.5V7M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5" />
    </>
  ),
  robo: (
    <>
      <rect x="5" y="8" width="14" height="10" rx="2.5" />
      <path d="M12 8V5.5" />
      <circle cx="12" cy="4.5" r="1" />
      <circle cx="9.5" cy="12.5" r="1" />
      <circle cx="14.5" cy="12.5" r="1" />
      <path d="M10 15.5h4M3.5 12v2.5M20.5 12v2.5" />
    </>
  ),
  celular: (
    <>
      <rect x="7" y="3.5" width="10" height="17" rx="2" />
      <path d="M11 17.5h2" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3.5 5.5 6v5.5c0 4.2 2.8 7.5 6.5 9 3.7-1.5 6.5-4.8 6.5-9V6Z" />
      <path d="m9.3 12 1.9 1.9 3.6-3.8" />
    </>
  ),
  foguete: (
    <>
      <path d="M12 3.5c3 2 4.5 5.3 4.5 9V16h-9v-3.5c0-3.7 1.5-7 4.5-9Z" />
      <circle cx="12" cy="10" r="1.6" />
      <path d="M7.5 13.5 5 16v3l2.5-1.5M16.5 13.5 19 16v3l-2.5-1.5" />
      <path d="M10.5 19.5h3" />
    </>
  ),
  trofeu: (
    <>
      <path d="M8 4.5h8v5a4 4 0 0 1-8 0Z" />
      <path d="M8 6.5H5.5a2.5 2.5 0 0 0 2.6 3.4M16 6.5h2.5a2.5 2.5 0 0 1-2.6 3.4" />
      <path d="M12 13.5v3M9 19.5h6M10 16.5h4v3h-4z" />
    </>
  ),
  livro: (
    <>
      <path d="M12 6.5C10.5 5.3 8.3 4.5 5 4.5v13c3.3 0 5.5.8 7 2 1.5-1.2 3.7-2 7-2v-13c-3.3 0-5.5.8-7 2Z" />
      <path d="M12 6.5v13" />
    </>
  ),
  paleta: (
    <>
      <path d="M12 4a8 8 0 1 0 0 16c1.1 0 1.6-.8 1.3-1.7-.4-1.1.3-2.3 1.5-2.3H17a3 3 0 0 0 3-3C20 7.4 16.4 4 12 4Z" />
      <circle cx="8" cy="11" r="1" />
      <circle cx="11" cy="7.8" r="1" />
      <circle cx="15" cy="8.5" r="1" />
    </>
  ),
  globo: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4c2.2 2.2 3.3 4.9 3.3 8s-1.1 5.8-3.3 8c-2.2-2.2-3.3-4.9-3.3-8S9.8 6.2 12 4Z" />
    </>
  ),
  rede: (
    <>
      <circle cx="12" cy="5.5" r="2" />
      <circle cx="5.5" cy="17.5" r="2" />
      <circle cx="18.5" cy="17.5" r="2" />
      <path d="M11 7.3 6.5 15.7M13 7.3l4.5 8.4M7.5 17.5h9" />
    </>
  ),
};

function Icone({ nome, tamanho = 18, preenchido = false, className = "" }) {
  return (
    <svg
      className={`icone icone-${nome} ${className}`}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill={preenchido ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {CAMINHOS[nome]}
    </svg>
  );
}

export default Icone;
