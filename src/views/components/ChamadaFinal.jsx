import { Link } from 'react-router-dom'

import Icone from './Icone'
import BorboletaDecorativa from './borboleta/BorboletaDecorativa'
import Botao from './ui/Botao'

// Chamada final em faixa larga e escura (contraste com a página clara).
// Topo bem arredondado; a base desce numa curva branca que vira o rodapé.
function ChamadaFinal() {
  return (
    <section
      aria-labelledby="titulo-chamada-final"
      className="relative isolate z-10 -mb-px overflow-hidden rounded-t-[2.5rem] bg-[radial-gradient(ellipse_80%_70%_at_50%_0%,#9c3352_0%,#6e1e39_45%,#4a1428_100%)] text-white sm:rounded-t-[4rem]"
    >
      {/* Textura de pontos bem leve */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <BorboletaDecorativa className="top-10 -left-16 -z-10 w-64 sm:top-8 sm:left-[4%] sm:w-80" tom="clara" opacidade={0.12} rotacao={-18} ritmo="6s" duracaoFlutuar="12s" />
      <BorboletaDecorativa className="top-16 right-[8%] hidden w-14 sm:block" tom="suave" modo="batendo" ritmo="1.3s" opacidade={0.75} rotacao={16} duracaoFlutuar="6s" atraso="0.5s" />
      <BorboletaDecorativa className="right-[22%] bottom-40 hidden w-8 lg:block" tom="clara" modo="batendo" ritmo="1.1s" opacidade={0.55} rotacao={-12} duracaoFlutuar="5s" atraso="0.9s" />

      <div className="mx-auto max-w-4xl px-6 pt-20 pb-36 text-center sm:px-12 sm:pt-28 sm:pb-44">
        <h2 id="titulo-chamada-final" className="mx-auto max-w-3xl font-display text-4xl leading-[1.1] sm:text-6xl">
          Seu talento merece espaço para{' '}
          <em className="relative inline-block text-blush">
            florescer.
            <svg viewBox="0 0 220 18" className="absolute -bottom-2 left-0 h-3 w-full" preserveAspectRatio="none" aria-hidden="true">
              <path d="M3 12 C 50 2, 120 2, 217 9" fill="none" stroke="#c27a90" strokeWidth="4" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset="1" className="desenhar-ao-ver" />
            </svg>
          </em>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/75">
          Descubra oportunidades, conecte-se com outras mulheres da tecnologia e construa sua carreira no seu ritmo.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Botao
            as={Link}
            to="/cadastro"
            variante="claro"
            tamanho="lg"
            className="shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)] transition-[background-color,transform] duration-300 hover:-translate-y-px"
          >
            Criar minha conta <Icone nome="seta" />
          </Botao>
          <Botao as={Link} to="/login" variante="contornoClaro" tamanho="lg">
            Entrar
          </Botao>
        </div>
      </div>

      {/* Curva de transição para o rodapé (mesma cor do rodapé) */}
      <svg aria-hidden="true" viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-16 w-full text-white sm:h-24">
        <path d="M0 120 L0 70 C 240 10, 480 0, 720 40 C 960 80, 1200 95, 1440 30 L1440 120 Z" fill="currentColor" />
      </svg>
    </section>
  )
}

export default ChamadaFinal
