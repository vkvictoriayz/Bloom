import LayoutPrivado from '../layout/LayoutPrivado'
import { AvisoConfirmarEmail } from '../conta/ConfirmacaoEmail'
import { useCarregar } from './useCarregar'
import { useSessao } from '../../hooks/useSessao'
import { fotoEmpresa, lerPerfilEmpresa } from '../../services/empresa'

const CONFIG = {
  rotuloNav: 'Área da empresa',
  selo: 'Empresa',
  inicio: '/empresa/feed',
  chavePreferencia: 'bloom-menu-empresa-recolhido',
  idGaveta: 'gaveta-empresa',
  aoSair: '/empresa/login',
  secoes: [
    {
      itens: [
        { rotulo: 'Feed', para: '/empresa/feed', icone: 'inicio' },
        { rotulo: 'Explorar talentos', para: '/empresa/explorar', icone: 'busca', tambem: ['/empresa/talentos'] },
        { rotulo: 'Perfil da empresa', para: '/empresa/perfil', icone: 'predio' },
      ],
    },
    {
      grupo: 'Recrutamento',
      icone: 'maleta',
      itens: [
        { rotulo: 'Painel de recrutamento', para: '/empresa/dashboard', icone: 'grafico' },
        { rotulo: 'Gerenciar vagas', para: '/empresa/vagas', icone: 'maleta' },
        { rotulo: 'Candidaturas recebidas', para: '/empresa/candidaturas', icone: 'candidaturas' },
      ],
    },
    { divisor: true },
    {
      itens: [
        { rotulo: 'Mensagens', para: '/empresa/mensagens', icone: 'mensagem' },
        { rotulo: 'Notificações', para: '/empresa/notificacoes', icone: 'sino' },
        { rotulo: 'Premium', para: '/empresa/premium', icone: 'coroa' },
        { rotulo: 'Configurações', para: '/empresa/configuracoes', icone: 'engrenagem' },
      ],
    },
  ],
  promo: {
    titulo: 'Nova oportunidade',
    texto: 'Publique uma vaga e receba candidaturas de mulheres da tecnologia.',
    rotuloAcao: 'Criar vaga',
    para: '/empresa/vagas/criar',
  },
  busca: {
    placeholder: 'Buscar talentos…',
    rotulo: 'Buscar talentos por nome, área ou interesse',
    para: (termo) => (termo ? `/empresa/explorar?q=${encodeURIComponent(termo)}` : '/empresa/explorar'),
  },
  mensagens: '/empresa/mensagens',
  notificacoes: '/empresa/notificacoes',
  perfil: { para: '/empresa/perfil', rotulo: 'Perfil da empresa', icone: 'predio' },
  configuracoes: '/empresa/configuracoes',
}

function LayoutEmpresa() {
  const sessao = useSessao()
  const perfil = useCarregar(lerPerfilEmpresa)
  const dados = perfil.tipo === 'pronto' ? perfil.dados : null

  return (
    <LayoutPrivado
      config={CONFIG}
      usuario={dados ? { nome: dados.empresa.nome, email: dados.empresa.email } : sessao?.usuario}
      foto={fotoEmpresa(dados)}
      premium={Boolean(dados?.empresa.premium)}
      faixa={<AvisoConfirmarEmail />}
      contexto={{ perfil: dados, erroPerfil: perfil.tipo === 'erro' ? perfil.erro : '', recarregarPerfil: perfil.recarregar }}
    />
  )
}

export default LayoutEmpresa
