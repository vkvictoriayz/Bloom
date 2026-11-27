import { Link } from 'react-router-dom'

import DocumentoLegal from '../components/DocumentoLegal'

const LINK = 'font-semibold text-vinho hover:underline'

const SECOES = [
  {
    id: 'o-que-e',
    titulo: 'O que é a Bloom',
    conteudo: (
      <p>
        A Bloom é uma plataforma que conecta mulheres a vagas de tecnologia e a empresas. Candidatas montam um perfil profissional, participam da
        comunidade e se candidatam a vagas. Empresas publicam vagas, recebem candidaturas e acompanham os processos. Ao criar uma conta, você
        concorda com estes Termos e com a{' '}
        <Link to="/privacidade" className={LINK}>
          Política de Privacidade
        </Link>
        .
      </p>
    ),
  },
  {
    id: 'contas',
    titulo: 'Sua conta',
    conteudo: (
      <ul>
        <li>Cada conta é pessoal (candidata) ou representa uma empresa (conta empresarial). Contas de candidata e de empresa têm funções separadas.</li>
        <li>Informe dados verdadeiros e mantenha-os atualizados. O CPF e o CNPJ informados precisam ser válidos.</li>
        <li>Quem cria uma conta de empresa declara ter autorização para representá-la. A Bloom pode pedir comprovação.</li>
        <li>Guarde sua senha com cuidado e não a compartilhe. Se suspeitar de uso indevido, troque a senha e avise a Bloom.</li>
      </ul>
    ),
  },
  {
    id: 'uso',
    titulo: 'Uso da plataforma',
    conteudo: (
      <>
        <p>Não é permitido:</p>
        <ul>
          <li>Publicar conteúdo discriminatório, assediador, violento, enganoso ou ilegal.</li>
          <li>Publicar vagas falsas, cobrar candidatas para participar de processos seletivos ou usar a plataforma para outro fim que não o recrutamento.</li>
          <li>Coletar dados de outras pessoas da plataforma para fins não autorizados.</li>
          <li>Tentar acessar contas, dados ou áreas que não são suas, ou atrapalhar o funcionamento da plataforma.</li>
        </ul>
        <p>Quem tem conta pode denunciar conteúdos, perfis e vagas. A equipe da Bloom analisa as denúncias.</p>
      </>
    ),
  },
  {
    id: 'conteudo',
    titulo: 'O que você publica',
    conteudo: (
      <p>
        Você continua dona do conteúdo que publica (perfil, projetos, publicações, mensagens e vagas) e é responsável por ele. Ao publicar, você
        permite que a Bloom mostre esse conteúdo dentro da plataforma, conforme as suas configurações de privacidade.
      </p>
    ),
  },
  {
    id: 'empresas',
    titulo: 'Empresas',
    conteudo: (
      <ul>
        <li>A empresa é responsável pelas vagas que publica e pelos processos seletivos que conduz.</li>
        <li>Os dados de candidatas recebidos em candidaturas só podem ser usados para o processo seletivo correspondente.</li>
        <li>A Bloom não garante contratações nem participa da decisão das empresas.</li>
      </ul>
    ),
  },
  {
    id: 'premium',
    titulo: 'Bloom Premium',
    conteudo: (
      <p>
        Alguns recursos fazem parte do plano Premium, pago por meio do Mercado Pago. A assinatura pode ser cancelada pela própria conta. Para excluir
        uma conta com assinatura ativa, é preciso cancelar a assinatura antes.
      </p>
    ),
  },
  {
    id: 'suspensao',
    titulo: 'Suspensão e exclusão',
    conteudo: (
      <>
        <p>
          A Bloom pode suspender contas que descumpram estes Termos, depois de analisar o caso. Contas suspensas não conseguem entrar na
          plataforma enquanto a suspensão durar.
        </p>
        <p>Você pode excluir a sua conta a qualquer momento, em Configurações. A exclusão é definitiva.</p>
      </>
    ),
  },
  {
    id: 'mudancas',
    titulo: 'Mudanças e contato',
    conteudo: (
      <p>
        Estes Termos podem ser atualizados. A data da última atualização fica no topo desta página. Dúvidas:{' '}
        <a href="mailto:contato@bloom.com.br" className={LINK}>
          contato@bloom.com.br
        </a>
        .
      </p>
    ),
  },
]

function TermosUso() {
  return (
    <DocumentoLegal
      tituloPagina="Termos de Uso"
      sobretitulo="Termos"
      titulo="Termos de Uso"
      resumo="As regras para usar a Bloom: o que a plataforma oferece, o que esperamos de candidatas e empresas e como funcionam suspensão e exclusão de contas."
      secoes={SECOES}
      outro={{ para: '/privacidade', rotulo: 'Ler a Política de Privacidade' }}
    />
  )
}

export default TermosUso
