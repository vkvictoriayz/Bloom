import { Link, Navigate, useLocation } from 'react-router-dom'

import TelaAcesso from '../components/TelaAcesso'
import Icone from '../components/Icone'
import Botao from '../components/ui/Botao'
import { Aviso } from '../components/ui/Campo'
import { obterSessao } from '../services/auth'

const PASSOS = {
  usuaria: [
    ['perfil', 'Complete o seu perfil', 'Experiências, formação e projetos ajudam as empresas a conhecer você.'],
    ['olho', 'Escolha o que fica público', 'Em Configurações você decide quem vê o seu perfil e os seus contatos.'],
    ['maleta', 'Encontre vagas', 'Busque por área, nível e modalidade e acompanhe cada candidatura.'],
  ],
  empresa: [
    ['predio', 'Complete o perfil da empresa', 'Logo, descrição e áreas de atuação aparecem para as candidatas.'],
    ['maleta', 'Publique a primeira vaga', 'Informe requisitos, modalidade e limite de candidaturas.'],
    ['escudo', 'Verificação da representação', 'A Bloom pode pedir uma comprovação de que você representa a empresa.'],
  ],
}

// Tela mostrada logo depois do cadastro (candidata ou empresa).
function CadastroConcluido() {
  const { state } = useLocation()
  const sessao = obterSessao()
  if (!state?.tipo || !sessao) return <Navigate to="/" replace />

  const tipo = state.tipo === 'empresa' ? 'empresa' : 'usuaria'
  const primeiroNome = (state.nome ?? '').split(' ')[0]

  return (
    <TelaAcesso
      etiqueta="Cadastro concluído"
      titulo={tipo === 'empresa' ? 'Conta da empresa criada!' : `Boas-vindas, ${primeiroNome}!`}
      subtitulo={tipo === 'empresa' ? 'A conta está pronta para usar.' : 'Sua conta está pronta. Que bom ter você na Bloom.'}
      visual={{ frase: tipo === 'empresa' ? 'Talentos da tecnologia, perto da sua empresa.' : 'Seu talento merece espaço para florescer.' }}
      semFormulario
    >
      <Aviso tipo={state.emailEnviado || state.emailVerificado ? 'sucesso' : 'info'}>
        {state.emailVerificado ? (
          <>
            Seu e-mail <strong>{state.email}</strong> já está confirmado.
          </>
        ) : state.emailEnviado ? (
          <>
            Enviamos um link de confirmação para <strong>{state.email}</strong>. Ele vale por 24 horas. Confira também a caixa de spam.
          </>
        ) : (
          <>
            Você pode confirmar o e-mail <strong>{state.email}</strong> depois, pelas configurações da conta.
          </>
        )}
      </Aviso>

      <div>
        <p className="mb-3 text-sm font-semibold text-tinta">Próximos passos</p>
        <ol className="flex flex-col gap-3">
          {PASSOS[tipo].map(([icone, titulo, texto]) => (
            <li key={titulo} className="flex items-start gap-3 rounded-2xl border border-rosa/10 bg-white/70 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush text-rosa" aria-hidden="true">
                <Icone nome={icone} tamanho={17} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-tinta">{titulo}</span>
                <span className="mt-0.5 block text-sm text-tinta-2">{texto}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <Botao
        as={Link}
        to={state.destino || '/'}
        tamanho="lg"
        className="h-12 w-full bg-rosa shadow-[0_10px_24px_-12px_rgba(156,74,99,0.8)] hover:bg-vinho"
      >
        Começar a usar a Bloom <Icone nome="seta" />
      </Botao>
    </TelaAcesso>
  )
}

export default CadastroConcluido
