import { Navigate, useLocation } from 'react-router-dom'

import LayoutPrivado from '../layout/LayoutPrivado'
import { useSessao } from '../../hooks/useSessao'

// Moldura da área de administração (/admin/*): o mesmo layout das outras
// áreas, com o menu da equipe da Bloom. Sem mensagens nem notificações.
function config(nivel) {
  return {
    rotuloNav: 'Administração',
    inicio: '/admin',
    chavePreferencia: 'bloom-menu-admin-recolhido',
    idGaveta: 'gaveta-admin',
    aoSair: '/admin/login',
    secoes: [
      {
        itens: [{ rotulo: 'Painel', para: '/admin', icone: 'grafico', fim: true }],
      },
      {
        grupo: 'Contas',
        icone: 'grupo',
        itens: [
          { rotulo: 'Candidatas', para: '/admin/candidatas', icone: 'perfil' },
          { rotulo: 'Empresas', para: '/admin/empresas', icone: 'predio' },
        ],
      },
      {
        grupo: 'Conteúdo',
        icone: 'documento',
        itens: [
          { rotulo: 'Vagas', para: '/admin/vagas', icone: 'maleta' },
          { rotulo: 'Publicações', para: '/admin/publicacoes', icone: 'documento' },
          { rotulo: 'Comunidades', para: '/admin/comunidades', icone: 'grupo' },
          { rotulo: 'Denúncias', para: '/admin/denuncias', icone: 'info' },
        ],
      },
      { divisor: true },
      {
        itens: [
          ...(nivel === 'super' ? [{ rotulo: 'Comunicados', para: '/admin/comunicados', icone: 'sino' }] : []),
          { rotulo: 'Pagamentos', para: '/admin/pagamentos', icone: 'coroa' },
          { rotulo: 'Registro de ações', para: '/admin/registro', icone: 'relogio' },
          ...(nivel === 'super' ? [{ rotulo: 'Administradores', para: '/admin/administradores', icone: 'escudo' }] : []),
          { rotulo: 'Minha conta', para: '/admin/conta', icone: 'engrenagem' },
        ],
      },
    ],
    busca: {
      placeholder: 'Buscar candidata por nome ou e-mail…',
      rotulo: 'Buscar candidatas por nome ou e-mail',
      para: (termo) => (termo ? `/admin/candidatas?busca=${encodeURIComponent(termo)}` : '/admin/candidatas'),
    },
    perfil: { para: '/admin/conta', rotulo: 'Minha conta', icone: 'escudo' },
    configuracoes: '/admin/conta',
  }
}

function LayoutAdmin() {
  const sessao = useSessao()
  const { pathname } = useLocation()
  const usuario = sessao?.usuario
  // Senha inicial (criada por outra pessoa): só "Minha conta" até trocar.
  if (usuario?.deveTrocarSenha && pathname !== '/admin/conta') return <Navigate to="/admin/conta" replace />
  return <LayoutPrivado config={config(usuario?.nivel)} usuario={usuario} foto="" />
}

export default LayoutAdmin
