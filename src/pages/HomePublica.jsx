import { Link } from 'react-router-dom'

import CarrosselAreas from '../components/CarrosselAreas'
import Icone from '../components/Icone'
import MarcaEmpresa from '../components/MarcaEmpresa'
import Pagina from '../components/layout/Pagina'
import Botao from '../components/ui/Botao'
import CabecalhoSecao from '../components/ui/CabecalhoSecao'
import FaixaMarcas from '../components/ui/FaixaMarcas'
import Perguntas from '../components/ui/Perguntas'
import Foto from '../components/ui/Foto'
import TextoEscalonado from '../components/ui/TextoEscalonado'
import { fotos } from '../data/imagens'
import { areasTI } from '../data/areas'
import { empresas } from '../data/empresas'

import bannerBloom from '../assets/banner-bloom.png'

// Benefícios descritos a partir do que a plataforma realmente faz hoje.
const passos = [
  {
    titulo: 'Monte seu perfil profissional',
    texto: 'Reúna apresentação, experiências, formação, competências e links em um perfil que você controla e atualiza quando quiser.',
  },
  {
    titulo: 'Encontre vagas com precisão',
    texto: 'Pesquise por cargo, tecnologia ou empresa e refine por área, nível, modalidade e localização.',
  },
  {
    titulo: 'Candidate-se e acompanhe',
    texto: 'Cada candidatura tem uma linha do tempo. As etapas só avançam quando a empresa registra uma atualização.',
  },
  {
    titulo: 'Conheça as empresas',
    texto: 'Veja segmento, sede e vagas abertas de cada organização antes de decidir onde quer trabalhar.',
  },
]

const perguntas = [
  {
    pergunta: 'Como me candidato a uma vaga?',
    resposta: 'Crie sua conta, abra a vaga e clique em “Candidatar-se”. A candidatura passa a aparecer em Candidaturas, com a data de envio.',
  },
  {
    pergunta: 'Posso me candidatar duas vezes à mesma vaga?',
    resposta: 'Não. A Bloom reconhece que você já se candidatou e mostra o status da candidatura no lugar do botão.',
  },
  {
    pergunta: 'Como sei em que etapa está meu processo?',
    resposta: 'Em Candidaturas, cada processo mostra as etapas: envio, análise da empresa e resultado. Nenhuma etapa é marcada como concluída sem uma atualização registrada.',
  },
  {
    pergunta: 'Sou de uma empresa. Como participo?',
    resposta: 'Pela Área da empresa você cria a conta da sua organização. O painel empresarial está em evolução e vai receber a publicação de vagas e a edição do perfil da empresa.',
  },
]

function HomePublica() {
  return (
    <Pagina titulo="Carreiras em tecnologia">
      {/* ── Abertura ─────────────────────────────────────────── */}
      <section className="overflow-hidden bg-branco">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-10 pb-14 sm:px-6 lg:grid-cols-12 lg:gap-6 lg:px-8 lg:pt-16 lg:pb-20">
          <div className="lg:col-span-6 xl:col-span-6">
            <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.16em] text-vinho uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-vinho/40" />
              Carreiras · Tecnologia · Oportunidades
            </p>

            <h1 className="mt-6 font-display text-[2.6rem] leading-[1.04] text-tinta sm:text-6xl xl:text-[4.5rem]">
              <TextoEscalonado texto="Conectando mulheres da tecnologia a" />{' '}
              <em className="text-vinho">
                <TextoEscalonado texto="oportunidades reais." atraso={330} />
              </em>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-tinta-2">
              A BLOOM conecta talentos a oportunidades profissionais e a empresas que valorizam o potencial das mulheres na
              tecnologia.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Botao as={Link} to="/cadastro" tamanho="lg">
                Criar minha conta <Icone nome="seta" />
              </Botao>
              <Link to="/login" className="link-linha text-[15px] font-semibold text-tinta">
                Já tenho conta
              </Link>
            </div>
          </div>

          <div className="relative lg:col-span-6">
            <img
              src={bannerBloom}
              alt="Três mulheres sorrindo e trabalhando juntas em notebooks"
              className="aspect-[4/3] w-full object-cover object-left lg:aspect-[1.2]"
              width="1400"
              height="1152"
            />
          </div>
        </div>
      </section>

      {/* ── Áreas ────────────────────────────────────────────── */}
      <section id="areas" aria-labelledby="titulo-areas" className="scroll-mt-20 border-y border-linha py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CabecalhoSecao
            id="titulo-areas"
            indice="01"
            rotulo="Explore suas possibilidades"
            titulo="Vagas em todas as áreas de T.I."
            descricao="Do primeiro emprego à liderança técnica: escolha uma área para começar a explorar."
          />
        </div>
        <div className="mt-12">
          <CarrosselAreas areas={areasTI} />
        </div>
      </section>

      {/* ── Como funciona ────────────────────────────────────── */}
      <section id="como-funciona" aria-labelledby="titulo-como" className="scroll-mt-20 py-16 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
            <CabecalhoSecao
              id="titulo-como"
              indice="02"
              rotulo="Como funciona"
              titulo="Do primeiro clique ao retorno da empresa, em um só lugar."
            />
            <Botao as={Link} to="/cadastro" variante="secundario" className="mt-8">
              Começar agora
            </Botao>
            <div className="mt-12 hidden aspect-[4/3] overflow-hidden lg:block">
              <Foto foto={fotos.comoFunciona} sizes="40vw" posicao="center 30%" />
            </div>
          </div>

          <ol className="lg:col-span-6 lg:col-start-7">
            {passos.map((passo, i) => (
              <li key={passo.titulo} className="grid grid-cols-[4.75rem_1fr] gap-4 border-t border-linha py-8 first:border-t-0 first:pt-0 sm:grid-cols-[5.5rem_1fr]">
                <span className="font-display text-5xl leading-none font-light text-vinho italic sm:text-6xl">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-xl font-semibold text-tinta">{passo.titulo}</h3>
                  <p className="mt-2 leading-relaxed text-suave">{passo.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Empresas ─────────────────────────────────────────── */}
      <section aria-labelledby="titulo-empresas" className="border-t border-linha py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CabecalhoSecao
            id="titulo-empresas"
            indice="03"
            rotulo="Empresas"
            titulo="Conheça quem está contratando antes de se candidatar."
            acao={
              <Botao as={Link} to="/empresas" variante="secundario">
                Explorar empresas <Icone nome="seta" />
              </Botao>
            }
          />
        </div>
        <div className="mt-12">
          <FaixaMarcas
            rotulo="Empresas na plataforma"
            duracao={45}
            itens={empresas.map((empresa) => (
              <Link
                key={empresa.slug}
                to={`/empresas/${empresa.slug}`}
                className="flex items-center gap-4 rounded-lg border border-linha bg-branco py-3 pr-6 pl-3 transition-colors hover:border-linha-forte"
              >
                <MarcaEmpresa empresa={empresa} tamanho="md" />
                <span>
                  <span className="block font-semibold text-tinta">{empresa.nome}</span>
                  <span className="block text-sm text-suave">{empresa.segmento}</span>
                </span>
              </Link>
            ))}
          />
        </div>
      </section>

      {/* ── Para empresas ────────────────────────────────────── */}
      <section aria-labelledby="titulo-para-empresas" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 border-y border-linha py-12 lg:grid-cols-12 lg:py-16">
            <div className="lg:col-span-8">
              <CabecalhoSecao
                id="titulo-para-empresas"
                rotulo="Para empresas"
                titulo="Sua empresa contrata talentos em tecnologia?"
                descricao="Crie a conta da sua organização na Bloom. O painel empresarial está em evolução e vai receber a publicação de vagas e a edição do perfil da empresa."
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Botao as={Link} to="/empresa/cadastro" tamanho="lg">
                  Cadastrar empresa
                </Botao>
                <Botao as={Link} to="/empresa/login" variante="secundario" tamanho="lg">
                  Entrar como empresa
                </Botao>
              </div>
            </div>
            <div className="hidden justify-end lg:col-span-4 lg:flex" aria-hidden="true">
              <svg viewBox="0 0 100 80" className="w-40 text-vinho" fill="currentColor">
                <path d="M49.2 45.6C43 30 28 8 5.5 5C3.5 23 20 41 49.2 45.6Z" />
                <path d="M48.6 48.4C40 46.2 31 44.8 23.5 44.6C21 56 26.5 70 35 75.5C40.5 76.5 46 62 48.6 48.4Z" />
                <path d="M50.8 45.6C57 30 72 8 94.5 5C96.5 23 80 41 50.8 45.6Z" />
                <path d="M51.4 48.4C60 46.2 69 44.8 76.5 44.6C79 56 73.5 70 65 75.5C59.5 76.5 54 62 51.4 48.4Z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Perguntas ────────────────────────────────────────── */}
      <section aria-labelledby="titulo-perguntas" className="border-t border-linha py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-4">
            <CabecalhoSecao id="titulo-perguntas" indice="04" rotulo="Dúvidas" titulo="Perguntas frequentes" />
          </div>
          <Perguntas itens={perguntas} className="lg:col-span-8" />
        </div>
      </section>

      {/* ── Chamada final ────────────────────────────────────── */}
      <section className="border-t border-linha bg-branco py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-4xl leading-tight text-tinta sm:text-5xl">
            Seu talento merece espaço para <em className="text-vinho">florescer.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-suave">
            Descubra oportunidades e construa seu próximo capítulo na área de tecnologia.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Botao as={Link} to="/cadastro" tamanho="lg">
              Criar minha conta
            </Botao>
            <Botao as={Link} to="/login" variante="secundario" tamanho="lg">
              Entrar
            </Botao>
          </div>
        </div>
      </section>
    </Pagina>
  )
}

export default HomePublica
