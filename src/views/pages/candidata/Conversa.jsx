import { Mensagens } from './Mensagens'

// Uma conversa aberta: a mesma tela de Mensagens (lista + conversa), com a
// conversa da rota selecionada. tipo "candidatas": entre integrantes;
// "empresas": com empresa (ligada a uma candidatura). "base" é a rota da
// área ("/candidata/mensagens" ou "/empresa/mensagens").
export function Conversa({ base = '/candidata/mensagens', tipo = 'empresas' }) {
  return <Mensagens base={base} selecionada={tipo} />
}

export default Conversa
