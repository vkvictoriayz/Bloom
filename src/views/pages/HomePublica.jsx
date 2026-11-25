import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import CarrosselAreas from '../components/CarrosselAreas'
import BorboletaHero from '../components/borboleta/BorboletaHero'
import PreviaJornada from '../components/PreviaJornada'
import BotaoBrilho from '../components/movimento/BotaoBrilho'
import ContadorAnimado from '../components/movimento/ContadorAnimado'
import PalavrasAlternadas from '../components/movimento/PalavrasAlternadas'
import TextoRevelado from '../components/movimento/TextoRevelado'
import Icone from '../components/Icone'
import { Borboleta } from '../components/Logo'
import { PreviaEtapas, PreviaFiltros, PreviaPerfil, PreviaPublicacao } from '../components/PreviasRecursos'
import MarcaEmpresa from '../components/MarcaEmpresa'
import Pagina from '../components/layout/Pagina'
import Botao from '../components/ui/Botao'
import FaixaMarcas from '../components/ui/FaixaMarcas'
import Perguntas from '../components/ui/Perguntas'
import { areasTI } from '../data/areas'
import { lerResumoPublico, listarEmpresasPublicas } from '../services/publico'
import { cn } from '../lib/cn'


const recursos = [
  {
    icone: 'mensagem',
    previa: PreviaPublicacao,
    titulo: 'Rede profissional',
    texto: 'Publique projetos, conquistas e dúvidas, comente, curta e siga outras mulheres da tecnologia.',
  },
  {
    icone: 'maleta',
    previa: PreviaFiltros,
    titulo: 'Vagas com filtros',
    texto: 'Busque por cargo, tecnologia ou empresa e refine por área, nível, modalidade e localização.',
  },
  {
    icone: 'candidaturas',
    previa: PreviaEtapas,
    titulo: 'Candidaturas acompanhadas',
    texto: 'Cada candidatura mostra a etapa atual. Nada avança sem uma atualização registrada pela empresa.',
  },
  {
    icone: 'pasta',
    previa: PreviaPerfil,
    titulo: 'Perfil e portfólio',
    texto: 'Reúna formação, experiências, competências e projetos com links de repositório e demonstração.',
  },
]

const passos = [
  { titulo: 'Crie sua conta', texto: 'Leva poucos minutos. Depois, complete o perfil no seu ritmo.' },
  { titulo: 'Conecte-se e publique', texto: 'Siga outras integrantes e compartilhe o que você está construindo.' },
  { titulo: 'Candidate-se e acompanhe', texto: 'Encontre vagas, envie sua candidatura e veja cada etapa do processo.' },
]

const perguntas = [
  {
    icone: 'maleta',
    pergunta: 'Como me candidato a uma vaga?',
    resposta: 'Crie sua conta, abra a vaga e clique em “Candidatar-se”. A candidatura passa a aparecer em Minhas candidaturas, com a data de envio.',
  },
  {
    icone: 'candidaturas',
    pergunta: 'Posso me candidatar duas vezes à mesma vaga?',
    resposta: 'Não. A Bloom reconhece que você já se candidatou e mostra o status da candidatura no lugar do botão.',
  },
  {
    icone: 'grafico',
    pergunta: 'Como sei em que etapa está meu processo?',
    resposta: 'Cada candidatura mostra as etapas: envio, análise da empresa e resultado. Nenhuma etapa é marcada como concluída sem uma atualização registrada.',
  },
  {
    icone: 'predio',
    pergunta: 'Sou de uma empresa. Como participo?',
    resposta: 'Pela Área da empresa você cria a conta da sua organização, edita o perfil, publica vagas e acompanha as candidaturas recebidas.',
  },
  {
    icone: 'borboleta',
    pergunta: 'A Bloom é gratuita para candidatas?',
    resposta: 'Sim. Criar a conta, montar o perfil, participar das comunidades e se candidatar às vagas não tem custo para candidatas.',
  },
  {
    icone: 'escudo',
    pergunta: 'Como meus dados são protegidos?',
    resposta: 'O CPF e a data de nascimento servem só para confirmar sua identidade e não aparecem no perfil. Nas configurações de privacidade você escolhe se o perfil é público e se mostra seus contatos.',
  },
]

function TituloSecao({ id, titulo, descricao, acao }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h2 id={id} className="font-display text-3xl leading-tight text-tinta sm:text-4xl">
          <TextoRevelado texto={titulo} />
        </h2>
        {descricao && <p className="mt-2 text-tinta-2">{descricao}</p>}
      </div>
      {acao}
    </div>
  )
}

function useResumo() {
  const [resumo, setResumo] = useState(null)
  useEffect(() => {
    let ativo = true
    lerResumoPublico()
      .then((r) => ativo && setResumo(r))
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [])
  return resumo
}

function FaixaNumeros({ resumo }) {
  if (!resumo) return null
  const itens = [
    { valor: resumo.integrantes, rotulo: resumo.integrantes === 1 ? 'mulher na comunidade' : 'mulheres na comunidade' },
    { valor: resumo.vagasAbertas, rotulo: resumo.vagasAbertas === 1 ? 'vaga aberta agora' : 'vagas abertas agora' },
    { valor: resumo.empresas, rotulo: resumo.empresas === 1 ? 'empresa contratando' : 'empresas contratando' },
  ]
  return (
    <section aria-label="A Bloom em números" className="grid grid-cols-1 gap-8 border-y border-linha-forte/40 py-8 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-linha">
      {itens.map((item) => (
        <div key={item.rotulo} className="sm:px-8 sm:first:pl-0">
          <ContadorAnimado valor={item.valor} className="block font-display text-6xl leading-none text-vinho" />
          <span className="mt-3 block text-sm font-semibold tracking-wide text-tinta-2">{item.rotulo}</span>
        </div>
      ))}
    </section>
  )
}

function useEmpresas() {
  const [empresas, setEmpresas] = useState([])
  useEffect(() => {
    let ativo = true
    listarEmpresasPublicas()
      .then((r) => ativo && setEmpresas(r.empresas.slice(0, 12)))
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [])
  return empresas
}

function HomePublica() {
  const empresas = useEmpresas()
  const resumo = useResumo()
  return (
    <Pagina titulo="Carreiras em tecnologia" className="bg-papel">
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-8 sm:px-6 lg:gap-24 lg:px-8 lg:py-12">
        <section className="grid overflow-hidden rounded-2xl border border-linha bg-branco lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
            <h1 className="font-display text-[2.1rem] leading-[1.1] text-balance text-tinta sm:text-[2.6rem] xl:text-[2.9rem]">
              <TextoRevelado texto="Conectando mulheres da tecnologia a" aoCarregar />{' '}
              <em className="block min-h-[1.15em] text-vinho">
                <PalavrasAlternadas palavras={['oportunidades reais.', 'empresas que acreditam.', 'uma rede que inspira.']} />
              </em>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-tinta-2">
              A BLOOM conecta talentos a oportunidades profissionais e a empresas que valorizam o potencial das mulheres na tecnologia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BotaoBrilho to="/cadastro">
                Criar minha conta <Icone nome="seta" />
              </BotaoBrilho>
              <BotaoBrilho to="/login" variante="contorno">
                Entrar
              </BotaoBrilho>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-tinta-2">
              {['Rede profissional', 'Vagas em tecnologia', 'Candidaturas acompanhadas'].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Icone nome="check" tamanho={16} className="text-vinho" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 pt-0 lg:pt-3 lg:pl-0">
            <BorboletaHero />
          </div>
        </section>

        <FaixaNumeros resumo={resumo} />

        <section id="areas" aria-labelledby="titulo-areas" className="scroll-mt-24">
          <TituloSecao id="titulo-areas" titulo="Vagas em todas as áreas de T.I." descricao="Do primeiro emprego à liderança técnica: escolha uma área para começar." />
          <div className="rounded-2xl border border-linha bg-branco py-8">
            <CarrosselAreas areas={areasTI} />
          </div>
        </section>

        <section aria-labelledby="titulo-recursos" id="como-funciona" className="scroll-mt-24">
          <TituloSecao id="titulo-recursos" titulo="Tudo para a sua carreira, em um só lugar" descricao="Os mesmos recursos que você usa depois de entrar na plataforma." />
          <ul className="grid gap-4 md:grid-cols-6">
            {recursos.map((r, i) => {
              const grande = i === 0 || i === 3
              const Previa = r.previa
              return (
                <li
                  key={r.titulo}
                  className={cn(
                    'cartao flex flex-col overflow-hidden',
                    grande ? 'md:col-span-4 md:flex-row md:items-center' : 'md:col-span-2'
                  )}
                >
                  <div className={cn('flex flex-1 flex-col p-6 sm:p-8', grande && 'md:max-w-[52%]')}>
                    <span className="grid size-11 place-items-center rounded-full bg-blush text-vinho" aria-hidden="true">
                      <Icone nome={r.icone} tamanho={20} />
                    </span>
                    <h3 className={cn('mt-5 font-bold text-tinta', grande ? 'font-display text-2xl font-normal' : 'text-lg')}>{r.titulo}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-tinta-2">{r.texto}</p>
                    {!grande && Previa && <Previa />}
                  </div>
                  {grande && Previa && (
                    <div className="flex items-center justify-center bg-papel px-6 py-6 md:flex-1 md:self-stretch">
                      <Previa />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="titulo-passos" className="grid gap-4 lg:grid-cols-2">
          <div className="flex overflow-hidden rounded-2xl border border-linha">
            <PreviaJornada />
          </div>
          <div className="rounded-2xl border border-linha bg-branco p-6 sm:p-10">
            <h2 id="titulo-passos" className="font-display text-3xl leading-tight text-tinta sm:text-4xl">
              Como funciona
            </h2>
            <ol className="mt-8 flex flex-col">
              {passos.map((p, i) => (
                <li key={p.titulo} className="flex gap-5 border-t border-linha py-5 first:border-t-0 first:pt-0">
                  <span className="w-10 shrink-0 font-display text-3xl leading-none text-vinho" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="font-bold text-tinta">{p.titulo}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-tinta-2">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Botao as={Link} to="/cadastro" className="mt-8 rounded-full">
              Começar agora <Icone nome="seta" tamanho={16} />
            </Botao>
          </div>
        </section>

        {empresas.length > 0 && (
        <section aria-labelledby="titulo-empresas">
          <TituloSecao
            id="titulo-empresas"
            titulo="Conheça quem está contratando"
            descricao="Veja a área, a cidade e as vagas abertas de cada empresa antes de se candidatar."
            acao={
              <Botao as={Link} to="/empresas" variante="secundario" className="rounded-full">
                Explorar empresas <Icone nome="seta" />
              </Botao>
            }
          />
          <FaixaMarcas
            rotulo="Empresas na plataforma"
            duracao={45}
            itens={empresas.map((empresa) => (
              <Link
                key={empresa.id}
                to={`/empresas/${empresa.id}`}
                className="flex items-center gap-4 rounded-2xl border border-linha bg-branco py-3 pr-6 pl-3 transition-colors hover:border-linha-forte"
              >
                <MarcaEmpresa empresa={empresa} tamanho="md" />
                <span>
                  <span className="block font-semibold text-tinta">{empresa.nome}</span>
                  <span className="block text-sm text-suave">{empresa.areaAtuacao || (empresa.vagasAbertas ? `${empresa.vagasAbertas} vagas abertas` : 'Empresa na Bloom')}</span>
                </span>
              </Link>
            ))}
          />
        </section>
        )}

        <section aria-labelledby="titulo-perguntas" id="perguntas" className="grid scroll-mt-24 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div className="relative overflow-hidden rounded-3xl bg-blush p-7 sm:p-9 lg:sticky lg:top-24 lg:self-start">
            <Borboleta tamanho={220} className="pointer-events-none absolute -right-14 -bottom-12 rotate-[-14deg] text-vinho/[0.08]" />
            <span className="grid size-12 place-items-center rounded-2xl bg-branco text-vinho" aria-hidden="true">
              <Icone nome="info" tamanho={22} />
            </span>
            <h2 id="titulo-perguntas" className="mt-6 font-display text-4xl leading-tight text-vinho-escuro sm:text-[2.75rem]">
              Perguntas frequentes
            </h2>
            <p className="mt-3 max-w-sm leading-relaxed text-tinta-2">O que mais perguntam antes de começar na Bloom.</p>
            <ul className="relative mt-6 flex flex-wrap gap-2">
              {[
                ['check', 'Gratuito para candidatas'],
                ['escudo', 'Dados protegidos'],
                ['maleta', 'Vagas em T.I.'],
              ].map(([icone, rotulo]) => (
                <li key={rotulo} className="inline-flex items-center gap-1.5 rounded-full bg-branco px-3 py-1.5 text-xs font-semibold text-vinho">
                  <Icone nome={icone} tamanho={14} /> {rotulo}
                </li>
              ))}
            </ul>
            <div className="relative mt-8 border-t border-vinho/15 pt-6">
              <p className="text-sm font-semibold text-tinta">Não achou a sua dúvida?</p>
              <p className="mt-1 text-sm text-tinta-2">Crie sua conta e explore com calma.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Botao as={Link} to="/cadastro" tamanho="sm" className="rounded-full">
                  Criar minha conta
                </Botao>
                <Botao as={Link} to="/vagas" variante="secundario" tamanho="sm" className="rounded-full">
                  Ver vagas
                </Botao>
              </div>
            </div>
          </div>
          <Perguntas itens={perguntas} />
        </section>

        <section aria-labelledby="titulo-para-empresas" className="grid gap-10 rounded-2xl bg-vinho p-8 text-white sm:p-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          <div>
            <h2 id="titulo-para-empresas" className="font-display text-3xl leading-tight sm:text-4xl">
              Sua empresa contrata talentos em tecnologia?
            </h2>
            <p className="mt-4 max-w-lg text-white/80">
              Crie a conta da sua organização na Bloom para publicar vagas, receber candidaturas e conhecer profissionais da comunidade.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Botao as={Link} to="/empresa/cadastro" variante="claro" className="rounded-full">
                Cadastrar empresa
              </Botao>
              <Botao as={Link} to="/empresa/login" variante="contornoClaro" className="rounded-full">
                Entrar como empresa
              </Botao>
            </div>
          </div>
          <dl className="divide-y divide-white/20 border-y border-white/20 self-start">
            {[
              ['Publique vagas', 'Com limite de candidatas e modalidade.'],
              ['Acompanhe o processo', 'Etapas, mensagens e convites em um só lugar.'],
              ['Conheça talentos', 'Perfis, projetos e publicações da comunidade.'],
            ].map(([titulo, texto]) => (
              <div key={titulo} className="py-4">
                <dt className="font-semibold">{titulo}</dt>
                <dd className="mt-0.5 text-sm text-white/75">{texto}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl bg-vinho-escuro px-6 py-16 text-center text-white sm:px-12 sm:py-20">
          <h2 className="mx-auto max-w-3xl font-display text-4xl leading-[1.1] sm:text-6xl">
            Seu talento merece espaço para{' '}
            <em className="relative inline-block text-blush">
              florescer.
              <svg viewBox="0 0 220 18" className="absolute -bottom-2 left-0 h-3 w-full" preserveAspectRatio="none" aria-hidden="true">
                <path d="M3 12 C 50 2, 120 2, 217 9" fill="none" stroke="#c27a90" strokeWidth="4" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset="1" className="desenhar-ao-ver" />
              </svg>
            </em>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/75">Descubra oportunidades, conecte-se com outras mulheres da tecnologia e construa sua carreira no seu ritmo.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Botao as={Link} to="/cadastro" variante="claro" tamanho="lg" className="rounded-full">
              Criar minha conta <Icone nome="seta" />
            </Botao>
            <Botao as={Link} to="/login" variante="contornoClaro" tamanho="lg" className="rounded-full">
              Entrar
            </Botao>
          </div>
        </section>
      </div>
    </Pagina>
  )
}

export default HomePublica
