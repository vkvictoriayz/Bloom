import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import Icone from './Icone'
import Logo from './Logo'
import Foto from './ui/Foto'
import login from '../assets/login.png'

const VISUAL_PADRAO = {
  frase: 'Florescer é voltar para você.',
  itens: ['Vagas de tecnologia em um só lugar', 'Candidaturas com etapas claras', 'Perfil profissional que você controla'],
}

// Moldura das telas de acesso (login, cadastro, recuperação de senha e área
// da empresa). À esquerda, o painel visual da marca (ilustração ou foto,
// frase e o que a pessoa encontra na Bloom); à direita, o formulário.
function TelaAcesso({ titulo, subtitulo, etiqueta, aoEnviar, children, rodape, visual = {} }) {
  const { foto, frase, itens } = { ...VISUAL_PADRAO, ...visual }

  useEffect(() => {
    document.title = `${titulo} · BLOOM`
  }, [titulo])

  function enviar(evento) {
    evento.preventDefault()
    aoEnviar()
  }

  const imagem = foto ? (
    <Foto foto={foto} prioridade sizes="(min-width: 1024px) 50vw, 100vw" />
  ) : (
    <img src={login} alt="Ilustração de muitas mulheres diferentes, lado a lado" className="h-full w-full object-cover" />
  )

  return (
    <div className="grid min-h-screen bg-branco lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Painel visual */}
      <aside className="relative hidden overflow-hidden bg-vinho-escuro p-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-t-[200px] rounded-b-2xl">
          {imagem}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-vinho-escuro/90 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <p className="max-w-md font-display text-4xl leading-tight italic">{frase}</p>
            <ul className="mt-6 flex flex-col gap-2.5 text-[15px] text-white/85">
              {itens.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="grid size-6 place-items-center rounded-full bg-white/15">
                    <Icone nome="check" tamanho={14} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Formulário */}
      <main className="flex flex-col">
        <div className="relative h-36 overflow-hidden lg:hidden">
          {imagem}
          <div aria-hidden="true" className="absolute inset-0 bg-vinho-escuro/35" />
        </div>

        <div className="flex flex-1 flex-col px-6 py-8 sm:px-12 xl:px-20">
          <div className="flex items-center justify-between">
            <Link to="/" className="w-fit rounded-sm" title="Voltar para a página inicial">
              <Logo />
            </Link>
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-suave hover:text-tinta">
              <Icone nome="voltar" tamanho={16} /> Início
            </Link>
          </div>

          <div className="mx-auto my-auto w-full max-w-[440px] py-12">
            {etiqueta && (
              <p className="mb-4 flex items-center gap-3 text-xs font-bold tracking-[0.16em] text-vinho uppercase">
                <span aria-hidden="true" className="h-px w-8 bg-vinho/40" />
                {etiqueta}
              </p>
            )}
            <h1 className="font-display text-[2.6rem] leading-[1.05] text-tinta">{titulo}</h1>
            {subtitulo && <p className="mt-3 text-[15px] text-suave">{subtitulo}</p>}

            <form className="mt-9 flex flex-col gap-5" onSubmit={enviar} noValidate>
              {children}
            </form>

            {rodape && <div className="mt-8 flex flex-col gap-2 border-t border-linha pt-6 text-sm text-tinta-2">{rodape}</div>}
          </div>
        </div>
      </main>
    </div>
  )
}

// Agrupa campos com um título curto numerado (usado no cadastro).
export function GrupoCampos({ indice, titulo, children }) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-4 flex w-full items-center gap-3 text-xs font-bold tracking-[0.14em] text-suave uppercase">
        <span className="grid size-6 place-items-center rounded-full bg-blush text-[11px] text-vinho">{indice}</span>
        {titulo}
        <span aria-hidden="true" className="h-px flex-1 bg-linha" />
      </legend>
      {children}
    </fieldset>
  )
}

// Link do rodapé das telas de acesso.
export function LinkAcesso({ to, children }) {
  return (
    <Link to={to} className="font-semibold text-vinho underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}

export default TelaAcesso
