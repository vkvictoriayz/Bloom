import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import CarrosselAreas from '../components/CarrosselAreas'
import Icone from '../components/Icone'
import { IlustracaoCodigo, IlustracaoConexoes } from '../components/ilustracoes/Ilustracoes'
import MarcaEmpresa from '../components/MarcaEmpresa'
import Pagina from '../components/layout/Pagina'
import Botao from '../components/ui/Botao'
import FaixaMarcas from '../components/ui/FaixaMarcas'
import Perguntas from '../components/ui/Perguntas'
import TextoEscalonado from '../components/ui/TextoEscalonado'
import { areasTI } from '../data/areas'
import { listarEmpresasPublicas } from '../services/publico'
import { cn } from '../lib/cn'

import imgAbertura from '../assets/ilustracoes/home-abertura.webp'
import imgComoFunciona from '../assets/ilustracoes/como-funciona.webp'

// O que a plataforma realmente oferece hoje (nada de números inventados).
const recursos = [
  {
    icone: 'mensagem',
    ilustracao: IlustracaoConexoes,
    titulo: 'Rede profissional',
    texto: 'Publique projetos, conquistas e dúvidas, comente, curta e siga outras mulheres da tecnologia.',
  },
  {
    icone: 'maleta',
    titulo: 'Vagas com filtros',
    texto: 'Busque por cargo, tecnologia ou empresa e refine por área, nível, modalidade e localização.',
  },
  {
    icone: 'candidaturas',
    titulo: 'Candidaturas acompanhadas',
    texto: 'Cada candidatura mostra a etapa atual. Nada avança sem uma atualização registrada pela empresa.',
  },
  {
    icone: 'pasta',
    ilustracao: IlustracaoCodigo,
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
    pergunta: 'Como me candidato a uma vaga?',
    resposta: 'Crie sua conta, abra a vaga e clique em “Candidatar-se”. A candidatura passa a aparecer em Minhas candidaturas, com a data de envio.',
  },
  {
    pergunta: 'Posso me candidatar duas vezes à mesma vaga?',
    resposta: 'Não. A Bloom reconhece que você já se candidatou e mostra o status da candidatura no lugar do botão.',
  },
  {
    pergunta: 'Como sei em que etapa está meu processo?',
    resposta: 'Cada candidatura mostra as etapas: envio, análise da empresa e resultado. Nenhuma etapa é marcada como concluída sem uma atualização registrada.',
  },
  {
    pergunta: 'Sou de uma empresa. Como participo?',
    resposta: 'Pela Área da empresa você cria a conta da sua organização, edita o perfil, publica vagas e acompanha as candidaturas recebidas.',
  },
]

// Título de seção no mesmo padrão da área logada.
function TituloSecao({ id, titulo, descricao, acao }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h2 id={id} className="font-display text-3xl leading-tight text-tinta sm:text-4xl">
          {titulo}
        </h2>
        {descricao && <p className="mt-2 text-tinta-2">{descricao}</p>}
      </div>
      {acao}
    </div>
  )
}

// Empresas cadastradas na Bloom (as que têm mais vagas primeiro). Vazio
// enquanto nenhuma empresa se cadastrou: a seção some.
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
  return (
    <Pagina titulo="Carreiras em tecnologia" className="bg-papel">
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-8 sm:px-6 lg:gap-24 lg:px-8 lg:py-12">
        {/* ── Abertura ─────────────────────────────────────────── */}
        <section className="grid overflow-hidden rounded-2xl border border-linha bg-branco lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
            <h1 className="font-display text-[2.1rem] leading-[1.1] text-balance text-tinta sm:text-[2.6rem] xl:text-[2.9rem]">
              <TextoEscalonado texto="Conectando mulheres da tecnologia a" />{' '}
              <em className="text-vinho">
                <TextoEscalonado texto="oportunidades reais." atraso={330} />
              </em>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-tinta-2">
              A BLOOM conecta talentos a oportunidades profissionais e a empresas que valorizam o potencial das mulheres na tecnologia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Botao as={Link} to="/cadastro" tamanho="lg" className="rounded-full">
                Criar minha conta <Icone nome="seta" />
              </Botao>
              <Botao as={Link} to="/login" variante="secundario" tamanho="lg" className="rounded-full">
                Entrar
              </Botao>
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
            <img
              src={imgAbertura}
              alt="Borboleta da BLOOM ligada a trilhas de circuito, representando a conexão entre mulheres e a tecnologia"
              className="aspect-[3/2] h-full w-full rounded-xl bg-papel object-contain lg:aspect-auto"
              width="1536"
              height="1024"
            />
          </div>
        </section>

        {/* ── Áreas ────────────────────────────────────────────── */}
        <section id="areas" aria-labelledby="titulo-areas" className="scroll-mt-24">
          <TituloSecao id="titulo-areas" titulo="Vagas em todas as áreas de T.I." descricao="Do primeiro emprego à liderança técnica: escolha uma área para começar." />
          <div className="rounded-2xl border border-linha bg-branco py-8">
            <CarrosselAreas areas={areasTI} />
          </div>
        </section>

        {/* ── O que você encontra ─────────────────────────────── */}
        <section aria-labelledby="titulo-recursos" id="como-funciona" className="scroll-mt-24">
          <TituloSecao id="titulo-recursos" titulo="Tudo para a sua carreira, em um só lugar" descricao="Os mesmos recursos que você usa depois de entrar na plataforma." />
          {/* Grade bento (Why-Us Bento do VengeanceUI): blocos de tamanhos
              alternados; os grandes levam as ilustrações da marca. */}
          <ul className="grid gap-4 md:grid-cols-6">
            {recursos.map((r, i) => {
              const grande = i === 0 || i === 3
              const Ilustracao = r.ilustracao
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
                  </div>
                  {grande && Ilustracao && (
                    <div className="bg-papel px-6 pt-4 pb-2 md:flex-1 md:self-stretch md:py-6">
                      <Ilustracao className="mx-auto max-w-[300px]" />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {/* ── Como funciona ────────────────────────────────────── */}
        <section aria-labelledby="titulo-passos" className="grid gap-4 lg:grid-cols-2">
          <div className="flex items-center overflow-hidden rounded-2xl border border-linha bg-papel">
            <img
              src={imgComoFunciona}
              alt="Etapas na BLOOM: crie seu perfil, busque vagas, candidate-se com facilidade e conquiste sua vaga"
              className="aspect-[3/2] w-full object-contain"
              loading="lazy"
              width="1536"
              height="1024"
            />
          </div>
          <div className="rounded-2xl border border-linha bg-branco p-6 sm:p-10">
            <h2 id="titulo-passos" className="font-display text-3xl leading-tight text-tinta sm:text-4xl">
              Como funciona
            </h2>
            <ol className="mt-8 flex flex-col gap-6">
              {passos.map((p, i) => (
                <li key={p.titulo} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-vinho font-bold text-white">{i + 1}</span>
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

        {/* ── Empresas ─────────────────────────────────────────── */}
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

        {/* ── Para empresas + perguntas ────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section aria-labelledby="titulo-para-empresas" className="flex flex-col rounded-2xl bg-vinho p-8 text-white sm:p-10">
            <span className="grid size-11 place-items-center rounded-full bg-white/15" aria-hidden="true">
              <Icone nome="predio" tamanho={20} />
            </span>
            <h2 id="titulo-para-empresas" className="mt-6 font-display text-3xl leading-tight">
              Sua empresa contrata talentos em tecnologia?
            </h2>
            <p className="mt-3 flex-1 text-white/80">
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
          </section>

          <section aria-labelledby="titulo-perguntas" className="rounded-2xl border border-linha bg-branco p-6 sm:p-8">
            <h2 id="titulo-perguntas" className="mb-4 font-display text-3xl text-tinta">
              Perguntas frequentes
            </h2>
            <Perguntas itens={perguntas} />
          </section>
        </div>

        {/* ── Chamada final ────────────────────────────────────── */}
        <section className="rounded-2xl bg-vinho-escuro px-6 py-14 text-center text-white sm:px-10">
          <h2 className="font-display text-4xl leading-tight sm:text-5xl">
            Seu talento merece espaço para <em className="text-rosa">florescer.</em>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">Descubra oportunidades e construa seu próximo capítulo na área de tecnologia.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Botao as={Link} to="/cadastro" variante="claro" tamanho="lg" className="rounded-full">
              Criar minha conta
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
