import Icone from './Icone'
import { Borboleta } from './Logo'
import BotaoBrilho from './movimento/BotaoBrilho'

// Hero claro: marca BLOOM em destaque, com uma borboleta rosa bem suave como marca d'água.
function HeroVitrine() {
  return (
    <section aria-labelledby="titulo-hero" className="relative isolate overflow-hidden bg-papel">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* Brilho rosado bem leve no centro */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_45%,rgba(244,228,233,0.9),transparent_70%)]" />
        {/* Borboleta marca d'água */}
        <div className="absolute top-1/2 left-1/2 w-[min(92vw,46rem)] -translate-x-1/2 -translate-y-[54%]">
          <Borboleta
            tamanho={100}
            className="h-auto w-full text-[#d98ba3] opacity-[0.16] motion-safe:animate-[flutuar_9s_ease-in-out_infinite]"
          />
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 pt-14 pb-10 text-center sm:px-6 sm:pt-20 sm:pb-12">
        <p className="text-xs font-semibold tracking-[0.32em] text-rosa uppercase motion-safe:animate-[entrar_0.8s_ease_both] sm:text-sm">
          A rede das mulheres da tecnologia
        </p>
        <h1
          id="titulo-hero"
          className="mt-4 font-display text-[clamp(4rem,min(19vw,24svh),12.5rem)] leading-[0.9] font-medium tracking-[0.06em] text-vinho-escuro motion-safe:animate-[entrar_0.9s_0.1s_ease_both]"
        >
          BLOOM
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-tinta-2 motion-safe:animate-[entrar_0.9s_0.25s_ease_both] sm:text-xl">
          Vagas, comunidade e candidaturas acompanhadas, num só lugar.
        </p>
        <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 motion-safe:animate-[entrar_0.9s_0.35s_ease_both] sm:w-auto sm:flex-row">
          <BotaoBrilho to="/cadastro">
            Criar minha conta <Icone nome="seta" />
          </BotaoBrilho>
          <BotaoBrilho to="/login" variante="contorno" className="border-rosa/40 bg-white/70 text-vinho-escuro hover:border-rosa">
            Entrar
          </BotaoBrilho>
        </div>
      </div>
    </section>
  )
}

export default HeroVitrine
