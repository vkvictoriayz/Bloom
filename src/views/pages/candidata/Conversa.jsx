import { Mensagens } from './Mensagens'

export function Conversa({ base = '/candidata/mensagens', tipo = 'empresas' }) {
  return <Mensagens base={base} selecionada={tipo} />
}

export default Conversa
