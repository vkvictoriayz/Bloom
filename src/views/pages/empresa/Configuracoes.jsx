import { Link, useNavigate, useOutletContext } from 'react-router-dom'

import { SituacaoEmail } from '../../components/conta/ConfirmacaoEmail'
import ExcluirConta from '../../components/conta/ExcluirConta'
import FormularioSenha from '../../components/conta/FormularioSenha'
import PreferenciasNotificacao from '../../components/conta/PreferenciasNotificacao'
import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import Botao from '../../components/ui/Botao'
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

// Configurações da conta empresarial: só ações que o backend suporta hoje.
function Configuracoes() {
  const { perfil: dados } = useOutletContext()
  const navigate = useNavigate()

  function encerrar() {
    sair()
    navigate('/empresa/login', { replace: true })
  }

  return (
    <>
      <TituloPagina titulo="Configurações" descricao="Conta, segurança, privacidade e sessão da empresa." />
      <div className="cartao px-6 sm:px-8">
        <Secao icone="predio" titulo="Dados da conta" descricao="Informados no cadastro da empresa.">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-suave">Empresa</dt>
              <dd className="font-semibold text-tinta">{dados?.empresa.nome ?? '…'}</dd>
            </div>
            <div>
              <dt className="text-suave">E-mail</dt>
              <dd className="flex flex-wrap items-center gap-2 font-semibold text-tinta">
                {dados?.empresa.email ?? '…'} <SituacaoEmail />
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Botao as={Link} to="/empresa/perfil/editar" variante="secundario">
              Editar perfil público
            </Botao>
          </div>
          <div className="mt-4">
            <EmBreve>Nome, CNPJ e e-mail da conta não podem ser alterados pela plataforma: falta uma API de conta.</EmBreve>
          </div>
        </Secao>

        <Secao icone="cadeado" titulo="Segurança" descricao="Senha de acesso.">
          <FormularioSenha />
        </Secao>

        <Secao icone="sino" titulo="Notificações" descricao="O que a empresa recebe.">
          <PreferenciasNotificacao tipoConta="empresa" />
        </Secao>

        <Secao icone="olho" titulo="Privacidade" descricao="O que as candidatas veem.">
          <p className="text-sm text-tinta-2">
            Candidatas autenticadas veem o nome da empresa e as vagas abertas. O perfil (foto, capa, descrição, localização e site) aparece no
            perfil da empresa. A empresa vê os dados públicos das profissionais e o que cada uma permitir mostrar e, nas candidaturas, o que a candidata enviou e o perfil profissional dela.
          </p>
        </Secao>

        <Secao icone="sair" titulo="Sessão" descricao="Encerrar o acesso neste navegador.">
          <Botao variante="secundario" onClick={encerrar}>
            <Icone nome="sair" tamanho={16} /> Sair da conta
          </Botao>
        </Secao>

        <Secao icone="lixeira" titulo="Excluir conta" descricao="Apagar a conta da empresa e seus dados da Bloom.">
          <ExcluirConta
            itens={[
              'o cadastro, o perfil, a foto e a capa da empresa',
              'todas as vagas e as candidaturas recebidas (as candidatas são avisadas)',
              'as publicações, mensagens e notificações da empresa',
            ]}
          />
        </Secao>
      </div>
    </>
  )
}

export default Configuracoes
