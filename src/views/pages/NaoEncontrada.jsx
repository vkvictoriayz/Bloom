import { Link } from 'react-router-dom'

import Icone from '../components/Icone'
import BorboletaViva from '../components/borboleta/BorboletaViva'
import Pagina from '../components/layout/Pagina'
import BotaoBrilho from '../components/movimento/BotaoBrilho'
import { useSessao } from '../hooks/useSessao'

function NaoEncontrada() {
  const sessao = useSessao()
  const tipo = sessao?.usuario?.tipo
  const inicio = tipo === 'empresa' ? '/empresa/feed' : tipo === 'usuaria' ? '/candidata/feed' : tipo === 'admin' ? '/admin' : '/'
  return (
    <Pagina titulo="Página não encontrada" className="bg-papel">
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-16 text-center sm:py-24">
        <div className="relative h-40 w-full max-w-md" aria-hidden="true">
          <svg viewBox="0 0 400 160" className="absolute inset-0 size-full">
            <path d="M20 140 C 90 140, 120 60, 200 80 S 320 30, 380 20" fill="none" stroke="#85243d" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
          </svg>
          <div className="absolute top-0 left-0 w-16" style={{ offsetPath: "path('M20 140 C 90 140, 120 60, 200 80 S 320 30, 380 20')", offsetRotate: 'auto 90deg', animation: 'voo 6s cubic-bezier(.45,0,.3,1) infinite' }}>
            <BorboletaViva modo="batendo" ritmo="0.4s" className="w-full" />
          </div>
        </div>
        <p className="mt-6 font-display text-7xl leading-none text-vinho sm:text-8xl">404</p>
        <h1 className="mt-4 font-display text-3xl text-tinta sm:text-4xl">Esta página voou para longe.</h1>
        <p className="mt-3 max-w-md text-tinta-2">O endereço pode ter mudado ou não existir mais. Que tal voltar para um lugar conhecido?</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <BotaoBrilho to={inicio}>
            Voltar ao início <Icone nome="seta" />
          </BotaoBrilho>
          <BotaoBrilho to={tipo === 'empresa' ? '/empresa/vagas' : '/vagas'} variante="contorno">
            Ver vagas
          </BotaoBrilho>
        </div>
        <p className="mt-10 text-sm text-suave">
          Ou conheça as{' '}
          <Link to="/empresas" className="font-semibold text-vinho underline-offset-4 hover:underline">
            empresas que contratam pela Bloom
          </Link>
          .
        </p>
      </section>
    </Pagina>
  )
}

export default NaoEncontrada
