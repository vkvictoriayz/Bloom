import LayoutPrivado from '../layout/LayoutPrivado'
import { useCarregar } from './useCarregar'
import { useSessao } from '../../hooks/useSessao'
import { fotoEmpresa, lerPerfilEmpresa } from '../../services/empresa'

// Layout da área privada da empresa (/empresa/* depois do login): a mesma
// moldura da candidata, com o menu da empresa. Os 12 itens seguem a ordem
// combinada, agrupados para não poluir o menu.
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
        { rotulo: 'Explorar talentos', para: '/empresa/explorar', icone: 'busca' },
        { rotulo: 'Perfil da empresa', para: '/empresa/perfil', icone: 'predio' },
      ],
    },
    {
      grupo: 'Conteúdo',
      icone: 'documento',
      itens: [
        { rotulo: 'Publicações', para: '/empresa/publicacoes', icone: 'documento', fim: true },
        { rotulo: 'Criar publicação', para: '/empresa/publicacoes/criar', icone: 'mais' },
      ],
    },
    {
      grupo: 'Recrutamento',
      icone: 'maleta',
      itens: [
        { rotulo: 'Gerenciar vagas', para: '/empresa/vagas', icone: 'maleta' },
        { rotulo: 'Candidaturas recebidas', para: '/empresa/candidaturas', icone: 'candidaturas' },
        { rotulo: 'Banco de talentos', para: '/empresa/talentos', icone: 'estrela' },
      ],
    },
    { divisor: true },
    {
      itens: [
        { rotulo: 'Comunidades', para: '/empresa/comunidades', icone: 'grupo' },
        { rotulo: 'Mensagens', para: '/empresa/mensagens', icone: 'mensagem' },
        { rotulo: 'Notificações', para: '/empresa/notificacoes', icone: 'sino' },
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
      contexto={{ perfil: dados, erroPerfil: perfil.tipo === 'erro' ? perfil.erro : '', recarregarPerfil: perfil.recarregar }}
    />
  )
}

export default LayoutEmpresa
