import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import CarrosselAreas from '../components/CarrosselAreas'
import ChamadaFinal from '../components/ChamadaFinal'
import HeroVitrine from '../components/HeroVitrine'
import SecaoEmpresas from '../components/SecaoEmpresas'
import PreviaJornada from '../components/PreviaJornada'
import TextoRevelado from '../components/movimento/TextoRevelado'
import Icone from '../components/Icone'
import { Borboleta } from '../components/Logo'
import Pagina from '../components/layout/Pagina'
import Botao from '../components/ui/Botao'
import Perguntas from '../components/ui/Perguntas'
import { listarEmpresasPublicas } from '../services/publico'
import { cn } from '../lib/cn'


// Recursos apresentados no carrossel da seção de abertura.
const recursosCarrossel = [
  { icone: 'maleta', titulo: 'Oportunidades profissionais', descricao: 'Encontre vagas divulgadas pelas empresas cadastradas na Bloom.', para: '/cadastro', acao: 'Ver vagas' },
  { icone: 'grupo', titulo: 'Comunidade feminina', descricao: 'Conecte-se com outras mulheres, compartilhe experiências e construa conexões.', para: '/cadastro', acao: 'Participar' },
  { icone: 'trofeu', titulo: 'Desenvolvimento de habilidades', descricao: 'Desenvolva competências por meio de atividades e desafios.', para: '/cadastro', acao: 'Começar' },
  { icone: 'candidaturas', titulo: 'Acompanhamento de candidaturas', descricao: 'Organize seus processos seletivos e acompanhe suas candidaturas.', para: '/cadastro', acao: 'Acompanhar' },
  { icone: 'predio', titulo: 'Conexão com empresas', descricao: 'Aproxime candidatas e empresas por meio da plataforma.', para: '/empresas', acao: 'Ver empresas' },
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

// Estilos compartilhados com o cabeçalho: vidro claro, bordas rosadas finas e botões rosa.
const VIDRO = 'border border-rosa/10 bg-white/60 shadow-[0_10px_30px_-22px_rgba(94,26,50,0.35)] backdrop-blur-md'
const BOTAO_ROSA = 'bg-rosa shadow-[0_8px_20px_-10px_rgba(156,74,99,0.8)] transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-px hover:bg-vinho'
const BOTAO_CONTORNO = 'border-rosa/25 bg-white/60 text-vinho-escuro hover:border-rosa/50 hover:bg-blush/50'

function TituloSecao({ id, sobretitulo, titulo, descricao, acao, compacto = false }) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', compacto ? 'mb-5' : 'mb-8')}>
      <div className="max-w-2xl">
        {sobretitulo && <p className="mb-2 text-xs font-semibold tracking-[0.28em] text-rosa uppercase">{sobretitulo}</p>}
        <h2 id={id} className={cn('font-display leading-tight text-tinta', compacto ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-4xl')}>
          <TextoRevelado texto={titulo} />
        </h2>
        {descricao && <p className={cn('mt-2 text-tinta-2', compacto && 'text-sm')}>{descricao}</p>}
      </div>
      {acao}
    </div>
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
  return (
    <Pagina titulo="Carreiras em tecnologia" className="overflow-x-clip bg-papel">
      <HeroVitrine />
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 pt-2 pb-16 sm:px-6 lg:gap-24 lg:px-8 lg:pb-24">
        <section id="areas" aria-labelledby="titulo-areas" className="scroll-mt-24">
          <TituloSecao compacto id="titulo-areas" titulo="O que a Bloom oferece" descricao="Recursos para cada etapa da sua carreira em tecnologia." />
          <div className="-mx-4 sm:-mx-6 lg:mx-0">
            <CarrosselAreas itens={recursosCarrossel} />
          </div>
        </section>

        <section aria-labelledby="titulo-passos" id="como-funciona" className="grid scroll-mt-24 gap-4 lg:grid-cols-2">
          <div className={cn('flex overflow-hidden rounded-3xl', VIDRO)}>
            <PreviaJornada />
          </div>
          <div className={cn('rounded-3xl p-6 sm:p-10', VIDRO)}>
            <p className="mb-2 text-xs font-semibold tracking-[0.28em] text-rosa uppercase">Passo a passo</p>
            <h2 id="titulo-passos" className="font-display text-3xl leading-tight text-tinta sm:text-4xl">
              Como funciona
            </h2>
            <ol className="mt-8 flex flex-col">
              {passos.map((p, i) => (
                <li key={p.titulo} className="flex gap-5 border-t border-rosa/10 py-5 first:border-t-0 first:pt-0">
                  <span className="w-10 shrink-0 font-display text-3xl leading-none text-rosa" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="font-bold text-tinta">{p.titulo}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-tinta-2">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Botao as={Link} to="/cadastro" className={cn('mt-8', BOTAO_ROSA)}>
              Começar agora <Icone nome="seta" tamanho={16} />
            </Botao>
          </div>
        </section>

        {empresas.length > 0 && <SecaoEmpresas empresas={empresas} />}

        <section aria-labelledby="titulo-perguntas" id="perguntas" className="grid scroll-mt-24 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div className="relative overflow-hidden rounded-3xl border border-rosa/10 bg-gradient-to-br from-blush/90 to-white/70 p-7 shadow-[0_10px_30px_-22px_rgba(94,26,50,0.35)] sm:p-9 lg:sticky lg:top-24 lg:self-start">
            <Borboleta tamanho={220} className="pointer-events-none absolute -right-14 -bottom-12 rotate-[-14deg] text-rosa/[0.1]" />
            <span className="grid size-12 place-items-center rounded-full border border-rosa/15 bg-white/80 text-rosa" aria-hidden="true">
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
                <li key={rotulo} className="inline-flex items-center gap-1.5 rounded-full border border-rosa/15 bg-white/70 px-3 py-1.5 text-xs font-semibold text-vinho-escuro">
                  <Icone nome={icone} tamanho={14} /> {rotulo}
                </li>
              ))}
            </ul>
            <div className="relative mt-8 border-t border-rosa/15 pt-6">
              <p className="text-sm font-semibold text-tinta">Não achou a sua dúvida?</p>
              <p className="mt-1 text-sm text-tinta-2">Crie sua conta e explore com calma.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Botao as={Link} to="/cadastro" tamanho="sm" className={BOTAO_ROSA}>
                  Criar minha conta
                </Botao>
                <Botao as={Link} to="/vagas" variante="secundario" tamanho="sm" className={BOTAO_CONTORNO}>
                  Ver vagas
                </Botao>
              </div>
            </div>
          </div>
          <Perguntas itens={perguntas} />
        </section>

        <section aria-labelledby="titulo-para-empresas" className={cn('grid gap-10 rounded-3xl p-8 sm:p-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16', VIDRO)}>
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.28em] text-rosa uppercase">Para empresas</p>
            <h2 id="titulo-para-empresas" className="font-display text-3xl leading-tight text-tinta sm:text-4xl">
              Sua empresa contrata talentos em tecnologia?
            </h2>
            <p className="mt-4 max-w-lg text-tinta-2">
              Crie a conta da sua organização na Bloom para publicar vagas, receber candidaturas e conhecer profissionais da comunidade.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Botao as={Link} to="/empresa/cadastro" className={BOTAO_ROSA}>
                Cadastrar empresa
              </Botao>
              <Botao as={Link} to="/empresa/login" variante="secundario" className={BOTAO_CONTORNO}>
                Entrar como empresa
              </Botao>
            </div>
          </div>
          <dl className="divide-y divide-rosa/10 self-start border-y border-rosa/10">
            {[
              ['Publique vagas', 'Com limite de candidatas e modalidade.'],
              ['Acompanhe o processo', 'Etapas, mensagens e convites em um só lugar.'],
              ['Conheça talentos', 'Perfis, projetos e publicações da comunidade.'],
            ].map(([titulo, texto]) => (
              <div key={titulo} className="py-4">
                <dt className="font-semibold text-vinho-escuro">{titulo}</dt>
                <dd className="mt-0.5 text-sm text-tinta-2">{texto}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <ChamadaFinal />
    </Pagina>
  )
}

export default HomePublica
