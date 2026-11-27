import { Link } from 'react-router-dom'

import CartaoEmpresaVitrine from './CartaoEmpresaVitrine'
import Icone from './Icone'
import BorboletaDecorativa from './borboleta/BorboletaDecorativa'
import TextoRevelado from './movimento/TextoRevelado'
import Botao from './ui/Botao'
import FaixaMarcas from './ui/FaixaMarcas'

function SecaoEmpresas({ empresas }) {
  return (
    <section aria-labelledby="titulo-empresas" className="relative isolate">
      <BorboletaDecorativa className="-top-24 right-[4%] -z-10 w-40 sm:right-[16%] sm:w-56" opacidade={0.3} rotacao={-16} ritmo="5.5s" duracaoFlutuar="11s" />

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold tracking-[0.28em] text-rosa uppercase">Empresas</p>
          <h2 id="titulo-empresas" className="relative inline-block font-display text-3xl leading-tight text-tinta sm:text-4xl">
            <TextoRevelado texto="Conheça quem está contratando" />
            <BorboletaDecorativa className="-top-7 -right-11 w-9 sm:-right-12 sm:w-10" tom="rosa" modo="batendo" ritmo="1.4s" opacidade={0.9} rotacao={18} duracaoFlutuar="5s" atraso="0.6s" />
          </h2>
          <p className="mt-2 text-tinta-2">Veja a área, a cidade e as vagas abertas de cada empresa antes de se candidatar.</p>
        </div>
        <Botao
          as={Link}
          to="/empresas"
          variante="secundario"
          className="border-rosa/25 bg-white/60 text-vinho-escuro hover:border-rosa/50 hover:bg-blush/50"
        >
          Explorar empresas <Icone nome="seta" />
        </Botao>
      </div>

      {/* Faixa rosada suave por trás do carrossel */}
      <div className="relative -mx-4 rounded-[2.5rem] bg-gradient-to-b from-blush/45 via-blush/20 to-transparent py-4 sm:-mx-6 lg:mx-0 lg:py-6">
        <FaixaMarcas
          rotulo="Empresas na plataforma"
          duracao={Math.max(40, empresas.length * 10)}
          className="[&_li]:pr-4 sm:[&_li]:pr-5 [&_ul]:items-stretch [&_ul]:py-4"
          itens={empresas.map((empresa) => (
            <CartaoEmpresaVitrine key={empresa.id} empresa={empresa} className="h-full min-h-[21rem] w-[18.5rem] sm:w-80" />
          ))}
        />
      </div>
    </section>
  )
}

export default SecaoEmpresas
