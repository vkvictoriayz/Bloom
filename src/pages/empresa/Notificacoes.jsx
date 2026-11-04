import NotificacoesCompartilhadas from '../candidata/Notificacoes'

// Notificações da empresa: a mesma tela da candidata, com os avisos da conta
// da empresa (novas candidaturas e mensagens), vindos da API.
function Notificacoes() {
  return <NotificacoesCompartilhadas descricao="Novas candidaturas e mensagens das candidatas." />
}

export default Notificacoes
