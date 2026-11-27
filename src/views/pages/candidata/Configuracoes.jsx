import { Link, useNavigate } from 'react-router-dom'

import { SituacaoEmail } from '../../components/conta/ConfirmacaoEmail'
import DadosIdentificacao from '../../components/conta/DadosIdentificacao'
import ExcluirConta from '../../components/conta/ExcluirConta'
import FormularioEmail from '../../components/conta/FormularioEmail'
import FormularioSenha from '../../components/conta/FormularioSenha'
import PreferenciasNotificacao from '../../components/conta/PreferenciasNotificacao'
import Privacidade from '../../components/conta/Privacidade'
import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import Botao from '../../components/ui/Botao'
import { useSessao } from '../../hooks/useSessao'
import { sair } from '../../services/auth'

function Secao({ icone, titulo, descricao, children }) {
  return (
    <section className="grid gap-4 border-b border-linha py-7 last:border-b-0 md:grid-cols-[260px_minmax(0,1fr)] md:gap-10">
      <div className="flex gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush text-vinho" aria-hidden="true">
          <Icone nome={icone} tamanho={18} />
        </span>
        <div>
          <h2 className="font-semibold text-tinta">{titulo}</h2>
          {descricao && <p className="mt-1 text-sm text-suave">{descricao}</p>}
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function Configuracoes() {
  const sessao = useSessao()
  const navigate = useNavigate()
  const usuario = sessao?.usuario

  function encerrar() {
    sair()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <TituloPagina titulo="Configurações" descricao="Conta, segurança, privacidade e preferências." />

      <div className="rounded-xl border border-linha bg-branco px-6 sm:px-8">
        <Secao icone="perfil" titulo="Dados da conta" descricao="Informados no cadastro.">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-suave">Nome exibido</dt>
              <dd className="font-semibold text-tinta">{usuario?.nome}</dd>
            </div>
            <div>
              <dt className="text-suave">E-mail</dt>
              <dd className="flex flex-wrap items-center gap-2 font-semibold text-tinta">
                {usuario?.email} <SituacaoEmail />
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-suave">
            O nome exibido é o seu nome social, quando preenchido. Ele pode ser alterado em Dados de identificação, logo abaixo, ou em{' '}
            <Link to="/candidata/perfil/editar" className="font-semibold text-vinho hover:underline">
              Editar perfil
            </Link>
            .
          </p>
          <div className="mt-4">
            <FormularioEmail emailAtual={usuario?.email} />
          </div>
        </Secao>

        <Secao icone="escudo" titulo="Dados de identificação" descricao="Nome civil, nome social e identidade de gênero. Informações privadas.">
          <DadosIdentificacao />
        </Secao>

        <Secao icone="cadeado" titulo="Segurança" descricao="Senha de acesso.">
          <FormularioSenha />
        </Secao>

        <Secao icone="sino" titulo="Notificações" descricao="O que você quer receber.">
          <PreferenciasNotificacao tipoConta="usuaria" />
        </Secao>

        <Secao icone="olho" titulo="Privacidade do perfil" descricao="Quem vê suas informações.">
          <p className="mb-4 text-sm text-tinta-2">
            Seu nome, foto e capa, área, interesses, apresentação curta e publicações na comunidade são vistos por quem está logado na Bloom.
            Escolha abaixo o que mais as empresas podem ver.
          </p>
          <Privacidade />
        </Secao>

        <Secao icone="maleta" titulo="Preferências profissionais" descricao="Modalidades, áreas e disponibilidade.">
          <Botao as={Link} to="/candidata/perfil/editar#preferencias" variante="secundario">
            Editar preferências
          </Botao>
        </Secao>

        <Secao icone="sair" titulo="Sessão" descricao="Encerrar o acesso neste navegador.">
          <Botao variante="secundario" onClick={encerrar}>
            <Icone nome="sair" tamanho={16} /> Sair da conta
          </Botao>
        </Secao>

        <Secao icone="lixeira" titulo="Excluir conta" descricao="Apagar sua conta e seus dados da Bloom.">
          <ExcluirConta
            itens={[
              'seu cadastro, perfil profissional, projetos, foto e capa',
              'suas candidaturas e vagas salvas',
              'suas publicações, comentários, curtidas e conexões',
              'suas mensagens e notificações',
              'as comunidades que você criou',
            ]}
          />
        </Secao>
      </div>
    </>
  )
}

export default Configuracoes
