import { Link } from 'react-router-dom'

import DocumentoLegal from '../components/DocumentoLegal'

const CONTATO = (
  <a href="mailto:contato@bloom.com.br" className="font-semibold text-vinho hover:underline">
    contato@bloom.com.br
  </a>
)

// Conteúdo descreve o funcionamento real do código (AuthController, IdentificacaoController,
// exclusaoConta, AdminController, services/cpf, cnpj, email e mercadopago). Atualize junto com ele.
const SECOES = [
  {
    id: 'quem-somos',
    titulo: 'Quem cuida dos seus dados',
    conteudo: (
      <>
        <p>
          A Bloom é uma plataforma que conecta mulheres a vagas de tecnologia e a empresas. A Bloom é a controladora dos dados tratados na
          plataforma, nos termos da Lei Geral de Proteção de Dados Pessoais (LGPD, Lei nº 13.709/2018).
        </p>
        <p>Para qualquer assunto sobre seus dados, fale com a gente em {CONTATO}.</p>
      </>
    ),
  },
  {
    id: 'dados-coletados',
    titulo: 'Quais dados coletamos',
    conteudo: (
      <>
        <p>
          <strong>Candidatas, no cadastro:</strong>
        </p>
        <ul>
          <li>Nome civil, como no documento, e nome social (opcional).</li>
          <li>E-mail, telefone e CPF.</li>
          <li>
            Data de nascimento: usada apenas no momento do cadastro, junto com o CPF e o nome civil, para conferir a identidade quando essa
            conferência está ativa. A data de nascimento não fica guardada na sua conta.
          </li>
          <li>Identidade de gênero (mulher cisgênero, mulher transgênero ou prefiro não informar). É um dado pessoal sensível.</li>
          <li>Senha, guardada apenas em forma criptografada (hash bcrypt). Ninguém da Bloom consegue ver a sua senha.</li>
        </ul>
        <p>
          <strong>Candidatas, durante o uso:</strong> o que você decide colocar no perfil (foto, localização, resumo, experiências, formação,
          habilidades, links e projetos), currículo enviado, candidaturas, vagas salvas, publicações, comentários, curtidas, comunidades,
          mensagens e suas preferências de notificação e de privacidade.
        </p>
        <p>
          <strong>Empresas:</strong> CNPJ e os dados públicos do cadastro do CNPJ (razão social, nome fantasia, atividade principal, município e
          situação cadastral), nome da empresa na Bloom, nome e cargo da pessoa responsável, e-mail e telefone comerciais, senha (criptografada),
          perfil da empresa, vagas, mensagens e registros de assinatura Premium.
        </p>
        <p>
          <strong>Se você entrar com Google ou GitHub:</strong> recebemos do provedor apenas seu nome, seu e-mail (já verificado por ele) e o
          identificador da sua conta, para ligar o login à sua conta da Bloom. Não recebemos sua senha desses serviços.
        </p>
        <p>
          <strong>Registros de aceite:</strong> guardamos a data e a versão dos Termos e desta Política que você aceitou, a confirmação de ciência
          sobre o tratamento de dados e a sua escolha sobre receber novidades por e-mail.
        </p>
      </>
    ),
  },
  {
    id: 'por-que',
    titulo: 'Por que precisamos desses dados',
    conteudo: (
      <ul>
        <li>Criar e proteger a sua conta, permitir o login e recuperar o acesso quando você esquece a senha.</li>
        <li>Confirmar a identidade de candidatas (CPF) e confirmar que empresas existem e estão ativas (CNPJ), para manter a comunidade segura.</li>
        <li>Mostrar o seu perfil, conectar candidatas a vagas e permitir que empresas recebam e acompanhem candidaturas.</li>
        <li>Permitir publicações, comunidades, mensagens e notificações dentro da plataforma.</li>
        <li>Analisar denúncias, prevenir abusos e cumprir obrigações legais.</li>
        <li>
          Identidade de gênero: a Bloom é uma plataforma voltada a mulheres cisgênero e transgênero, e o dado registra como você se identifica.
          Hoje ele fica visível apenas para você. Você pode escolher não informar, e o dado não é usado para decidir o que você vê nem para
          filtrar candidaturas. Se a Bloom passar a usá-lo para outra finalidade, esta política será atualizada antes.
        </li>
      </ul>
    ),
  },
  {
    id: 'onde',
    titulo: 'Onde os dados ficam guardados',
    conteudo: (
      <>
        <p>
          Os dados ficam no banco de dados da plataforma (MySQL), no servidor em que a Bloom está hospedada. Fotos, imagens e currículos também
          ficam guardados nesse banco.
        </p>
        <p>
          Os dados de identificação da candidata (nome civil, nome social e identidade de gênero) ficam em uma tabela separada do cadastro
          principal, lida apenas pelas funções que atendem a própria candidata.
        </p>
        <p>
          Quando você entra na sua conta, o navegador guarda um token de sessão no armazenamento local do seu dispositivo. Ele expira sozinho
          (por padrão, em 8 horas) e é apagado quando você clica em Sair. A Bloom não usa cookies de publicidade nem ferramentas de rastreamento.
        </p>
      </>
    ),
  },
  {
    id: 'quem-acessa',
    titulo: 'Quem pode acessar',
    conteudo: (
      <>
        <p>
          <strong>Você:</strong> vê e edita seus dados no perfil e nas configurações, incluindo nome social e identidade de gênero.
        </p>
        <p>
          <strong>Outras pessoas e empresas:</strong> veem o seu perfil quando ele está público (você pode deixá-lo privado nas configurações) e
          seus contatos apenas se você escolher mostrá-los. O nome exibido é o nome social, quando preenchido.
        </p>
        <p>
          <strong>Empresas para as quais você se candidata:</strong> recebem os dados da candidatura: seu perfil profissional, seu e-mail e o
          currículo enviado. Empresas nunca recebem sua senha, CPF, data de nascimento, nome civil ou identidade de gênero, nem dados de outras
          candidatas.
        </p>
        <p>
          <strong>Equipe da Bloom:</strong> o painel administrativo tem níveis de acesso (acesso total e moderação) e é usado para gerenciar contas,
          empresas, conteúdos e denúncias. No painel, o CPF aparece mascarado, a identidade de gênero não é exibida e o nome civil só aparece quando
          é diferente do nome exibido. As ações administrativas, incluindo cada consulta ao nome civil, ficam registradas para auditoria.
        </p>
      </>
    ),
  },
  {
    id: 'compartilhamento',
    titulo: 'Quando os dados saem da Bloom',
    conteudo: (
      <>
        <p>A Bloom não vende dados. Alguns serviços externos são usados para funções específicas, e recebem apenas o necessário:</p>
        <ul>
          <li>
            <strong>Serpro</strong> (quando a conferência de CPF está ativada): CPF, nome civil e data de nascimento, para confirmar a identidade.
          </li>
          <li>
            <strong>BrasilAPI</strong>: o CNPJ informado no cadastro de empresas, para buscar os dados públicos da empresa.
          </li>
          <li>
            <strong>Resend</strong> (quando o envio de e-mails está configurado): seu nome e e-mail, para enviar confirmação de e-mail e links de
            redefinição de senha.
          </li>
          <li>
            <strong>Google e GitHub</strong> (só se você escolher entrar por eles): você é levada ao site do provedor para autorizar, e ele
            devolve à Bloom o seu nome, e-mail e identificador.
          </li>
          <li>
            <strong>Mercado Pago</strong>: e-mail e valor da assinatura Premium, para processar o pagamento. Dados de cartão são informados
            diretamente ao Mercado Pago e não passam pela Bloom.
          </li>
        </ul>
        <p>Dados também podem ser compartilhados quando a lei ou uma ordem judicial exigir.</p>
      </>
    ),
  },
  {
    id: 'seguranca',
    titulo: 'Como protegemos',
    conteudo: (
      <ul>
        <li>Senhas criptografadas com bcrypt e exigência de senha forte (letras maiúsculas e minúsculas, número e caractere especial).</li>
        <li>Bloqueio temporário depois de várias tentativas de login erradas.</li>
        <li>Links de redefinição de senha que valem 30 minutos e só podem ser usados uma vez.</li>
        <li>Cada tipo de conta acessa apenas as próprias funções: candidatas, empresas e administração têm permissões separadas.</li>
        <li>As respostas da plataforma não incluem senhas e mostram apenas os dados necessários para cada tela.</li>
      </ul>
    ),
  },
  {
    id: 'direitos',
    titulo: 'Seus direitos e como exercê-los',
    conteudo: (
      <>
        <p>
          Pela LGPD, você pode confirmar se tratamos seus dados, acessá-los, corrigi-los, pedir a exclusão, revogar consentimentos e obter
          informações sobre compartilhamento.
        </p>
        <ul>
          <li>
            <strong>Corrigir:</strong> edite o perfil e as configurações a qualquer momento. Para corrigir o nome civil, escreva para {CONTATO}.
          </li>
          <li>
            <strong>Excluir:</strong> em Configurações, a opção Excluir conta apaga a conta e os dados ligados a ela, de forma definitiva. Se houver
            assinatura Premium ativa, ela precisa ser cancelada antes.
          </li>
          <li>
            <strong>Acessar ou pedir uma cópia:</strong> escreva para {CONTATO}, a partir do e-mail da conta.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'retencao',
    titulo: 'Por quanto tempo guardamos',
    conteudo: (
      <p>
        Os dados ficam guardados enquanto a conta existir. Quando a conta é excluída, os dados dela são apagados. O registro de ações
        administrativas pode manter o número interno da conta para fins de auditoria.
      </p>
    ),
  },
  {
    id: 'mudancas',
    titulo: 'Mudanças nesta política',
    conteudo: (
      <p>
        Se esta política mudar, a data de atualização no topo da página será alterada. Mudanças importantes serão avisadas na plataforma.
        Os Termos de Uso estão em{' '}
        <Link to="/termos" className="font-semibold text-vinho hover:underline">
          /termos
        </Link>
        .
      </p>
    ),
  },
]

function PoliticaPrivacidade() {
  return (
    <DocumentoLegal
      tituloPagina="Política de Privacidade"
      sobretitulo="Privacidade"
      titulo="Política de Privacidade"
      resumo="Como a Bloom coleta, usa, guarda e protege os seus dados, e como você pode acessá-los, corrigi-los ou excluí-los."
      secoes={SECOES}
      outro={{ para: '/termos', rotulo: 'Ler os Termos de Uso' }}
    />
  )
}

export default PoliticaPrivacidade
