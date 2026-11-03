import { Link, useNavigate } from 'react-router-dom'

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

function EmBreve({ children }) {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-papel-2 px-4 py-3 text-sm text-tinta-2">
      <Icone nome="info" tamanho={16} className="mt-0.5 shrink-0 text-suave" />
      <span>{children}</span>
    </p>
  )
}

// Só as ações que o backend suporta hoje ficam ativas; as demais dizem o
// que falta, sem botões que não fazem nada.
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
              <dt className="text-suave">Nome</dt>
              <dd className="font-semibold text-tinta">{usuario?.nome}</dd>
            </div>
            <div>
              <dt className="text-suave">E-mail</dt>
              <dd className="font-semibold text-tinta">{usuario?.email}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <EmBreve>A alteração do nome e do e-mail da conta depende de uma API de conta que ainda não existe.</EmBreve>
          </div>
        </Secao>

        <Secao icone="cadeado" titulo="Segurança" descricao="Senha de acesso.">
          <EmBreve>
            A troca de senha pela área logada ainda não está disponível no backend. Você pode usar a{' '}
            <Link to="/recuperar-senha" className="font-semibold text-vinho hover:underline">
              recuperação de senha
            </Link>
            .
          </EmBreve>
        </Secao>

        <Secao icone="sino" titulo="Notificações" descricao="O que você quer receber.">
          <EmBreve>As preferências de notificação chegam junto com a API de notificações.</EmBreve>
        </Secao>

        <Secao icone="olho" titulo="Privacidade do perfil" descricao="Quem vê suas informações.">
          <p className="text-sm text-tinta-2">
            Hoje, seu nome, foto e capa, área de atuação, interesses, apresentação curta e publicações na comunidade são visíveis para outras integrantes e
            empresas autenticadas. Ao se candidatar a uma vaga, a empresa também recebe seu e-mail e o que você enviou. Os demais dados do perfil
            ficam neste navegador e não são compartilhados.
          </p>
          <div className="mt-3">
            <EmBreve>Os controles de visibilidade dependem de uma API de privacidade.</EmBreve>
          </div>
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
      </div>
    </>
  )
}

export default Configuracoes
