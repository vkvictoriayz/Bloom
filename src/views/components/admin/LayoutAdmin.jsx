import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import LayoutPrivado from '../layout/LayoutPrivado'
import { useSessao } from '../../hooks/useSessao'
import { lerResumoMenu } from '../../services/admin'

function config(nivel, resumo) {
  return {
    rotuloNav: 'Administração',
    selo: 'Admin',
    inicio: '/admin',
    chavePreferencia: 'bloom-menu-admin-recolhido',
    idGaveta: 'gaveta-admin',
    aoSair: '/admin/login',
    secoes: [
      {
        itens: [{ rotulo: 'Painel', para: '/admin', icone: 'grafico', fim: true }],
      },
      {
        grupo: 'Pessoas',
        icone: 'grupo',
        itens: [
          { rotulo: 'Candidatas', para: '/admin/candidatas', icone: 'perfil' },
          { rotulo: 'Empresas', para: '/admin/empresas', icone: 'predio', contador: resumo?.representantes },
        ],
      },
      {
        grupo: 'Moderação',
        icone: 'escudo',
        itens: [
          { rotulo: 'Denúncias', para: '/admin/denuncias', icone: 'info', contador: resumo?.denuncias },
          { rotulo: 'Vagas', para: '/admin/vagas', icone: 'maleta' },
          { rotulo: 'Publicações', para: '/admin/publicacoes', icone: 'documento' },
          { rotulo: 'Comunidades', para: '/admin/comunidades', icone: 'grupo' },
        ],
      },
      {
        grupo: 'Plataforma',
        icone: 'engrenagem',
        itens: [
          { rotulo: 'Pagamentos', para: '/admin/pagamentos', icone: 'coroa' },
          ...(nivel === 'super' ? [{ rotulo: 'Comunicados', para: '/admin/comunicados', icone: 'megafone' }] : []),
          { rotulo: 'Registro de ações', para: '/admin/registro', icone: 'relogio' },
          ...(nivel === 'super' ? [{ rotulo: 'Administradores', para: '/admin/administradores', icone: 'escudo' }] : []),
        ],
      },
      { divisor: true },
      {
        itens: [{ rotulo: 'Minha conta', para: '/admin/conta', icone: 'engrenagem' }],
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
  const [resumo, setResumo] = useState(null)

  useEffect(() => {
    let ativo = true
    lerResumoMenu()
      .then((r) => ativo && setResumo(r))
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [pathname])

  if (usuario?.deveTrocarSenha && pathname !== '/admin/conta') return <Navigate to="/admin/conta" replace />
  return <LayoutPrivado config={config(usuario?.nivel, resumo)} usuario={usuario} foto="" />
}

export default LayoutAdmin
