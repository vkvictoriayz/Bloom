import { Mensagens as MensagensCompartilhadas } from '../candidata/Mensagens'
import { Conversa as ConversaCompartilhada } from '../candidata/Conversa'

export function Mensagens() {
  return <MensagensCompartilhadas base="/empresa/mensagens" descricao="Converse com as candidatas das suas vagas." />
}

export function Conversa() {
  return <ConversaCompartilhada base="/empresa/mensagens" />
}
