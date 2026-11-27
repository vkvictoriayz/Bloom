import { Link } from 'react-router-dom'

import Pagina from './layout/Pagina'
import BorboletaDecorativa from './borboleta/BorboletaDecorativa'

export const ATUALIZACAO_DOCUMENTOS = '27 de novembro de 2026'

// Moldura comum dos documentos (Termos de Uso e Política de Privacidade), com índice lateral.
function DocumentoLegal({ tituloPagina, sobretitulo, titulo, resumo, secoes, outro }) {
  return (
    <Pagina titulo={tituloPagina} className="overflow-x-clip bg-papel">
      <section className="relative isolate">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_85%_0%,rgba(244,228,233,0.9),transparent_70%)]" />
        <BorboletaDecorativa className="top-8 right-[6%] -z-10 hidden w-40 sm:block" opacidade={0.3} rotacao={12} ritmo="6s" />
        <div className="mx-auto max-w-5xl px-4 pt-12 pb-10 sm:px-6 lg:px-8 lg:pt-16">
          <p className="text-xs font-semibold tracking-[0.28em] text-rosa uppercase">{sobretitulo}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-tinta sm:text-5xl">{titulo}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-tinta-2">{resumo}</p>
          <p className="mt-4 text-sm text-suave">Última atualização: {ATUALIZACAO_DOCUMENTOS}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-8">
        <nav aria-label="Seções do documento" className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-suave uppercase">Nesta página</p>
          <ol className="flex flex-col gap-1.5 text-sm">
            {secoes.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-tinta-2 transition-colors hover:text-vinho">
                  {i + 1}. {s.titulo}
                </a>
              </li>
            ))}
          </ol>
          <Link to={outro.para} className="mt-6 inline-flex text-sm font-semibold text-vinho hover:underline">
            {outro.rotulo}
          </Link>
        </nav>

        <article className="rounded-[2rem] border border-rosa/10 bg-white/80 p-6 sm:p-10">
          {secoes.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28 border-b border-rosa/10 py-7 first:pt-0 last:border-b-0 last:pb-0">
              <h2 className="font-display text-2xl text-tinta">
                <span className="mr-2 text-rosa">{i + 1}.</span>
                {s.titulo}
              </h2>
              <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-tinta-2 [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-tinta [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
                {s.conteudo}
              </div>
            </section>
          ))}
        </article>
      </div>
    </Pagina>
  )
}

export default DocumentoLegal
