import Foto from '../ui/Foto'
import { cn } from '../../lib/cn'

const TEMAS = {
  claro: 'bg-branco text-tinta',
  escuro: 'bg-vinho-escuro text-white',
  rosado: 'bg-blush text-tinta',
}

const FORMAS = {
  arco: 'rounded-t-[999px] lg:rounded-b-none',
  folha: 'rounded-tl-[140px] rounded-br-[140px] lg:rounded-tl-[200px] lg:rounded-br-[200px]',
  circulo: 'rounded-full',
}

function CabecalhoPagina({ rotulo, titulo, descricao, foto, visual, posicaoFoto, tema = 'claro', forma = 'arco', lado = 'direita', variante, children, rodape }) {
  if (variante === 'retangular') {
    return (
      <section className="border-b border-linha bg-papel text-tinta">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <div className={cn('lg:col-span-6', lado === 'esquerda' && 'lg:order-2')}>
              {rotulo && <p className="text-xs font-bold tracking-[0.16em] text-vinho uppercase">{rotulo}</p>}
              <h1 className="mt-3 font-display text-[2.4rem] leading-[1.05] sm:text-5xl lg:text-[3.2rem]">{titulo}</h1>
              {descricao && <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-tinta-2">{descricao}</p>}
              {children && <div className="mt-7">{children}</div>}
            </div>
            <div className={cn('lg:col-span-6', lado === 'esquerda' && 'lg:order-1')}>
              <div className="aspect-[16/9] w-full overflow-hidden sm:aspect-[2/1] lg:aspect-[16/9]">
                {visual ?? <Foto foto={foto} prioridade sizes="(min-width: 1024px) 50vw, 100vw" posicao={posicaoFoto} />}
              </div>
            </div>
          </div>
          {rodape && <div className="mt-8 lg:mt-10">{rodape}</div>}
        </div>
      </section>
    )
  }

  const escuro = tema === 'escuro'
  const fotoNoFundo = forma === 'arco'

  return (
    <section className={cn('relative overflow-hidden', TEMAS[tema])}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
        <div
          className={cn(
            'flex flex-col justify-center pt-10 lg:col-span-7 lg:py-16',
            lado === 'esquerda' && 'lg:order-2',
            !fotoNoFundo && 'pb-2 lg:pb-16'
          )}
        >
          {rotulo && (
            <p className={cn('flex items-center gap-3 text-xs font-bold tracking-[0.16em] uppercase', escuro ? 'text-white/70' : 'text-vinho')}>
              <span aria-hidden="true" className={cn('h-px w-8', escuro ? 'bg-white/40' : 'bg-vinho/40')} />
              {rotulo}
            </p>
          )}
          <h1 className="mt-4 font-display text-[2.6rem] leading-[1.05] sm:text-5xl lg:text-[3.6rem]">{titulo}</h1>
          {descricao && <p className={cn('mt-4 max-w-xl text-lg leading-relaxed', escuro ? 'text-white/75' : 'text-tinta-2')}>{descricao}</p>}
          {children && <div className="mt-8">{children}</div>}
        </div>

        <div
          className={cn(
            'relative lg:col-span-5',
            lado === 'esquerda' && 'lg:order-1',
            fotoNoFundo ? 'self-end' : 'self-center pb-10 lg:py-12'
          )}
        >
          <div
            className={cn(
              'relative overflow-hidden',
              FORMAS[forma],
              forma === 'circulo' ? 'mx-auto aspect-square max-w-[380px]' : 'h-64 sm:h-80 lg:h-[420px]',
              forma === 'arco' && 'mx-auto max-w-md lg:max-w-none'
            )}
          >
            <Foto foto={foto} prioridade sizes="(min-width: 1024px) 40vw, 100vw" posicao={posicaoFoto} />
          </div>
        </div>
      </div>
      {rodape}
    </section>
  )
}

export default CabecalhoPagina
