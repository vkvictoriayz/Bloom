import { useEffect } from 'react'

import LayoutPrivado from '../layout/LayoutPrivado'
import { useDadosLocais } from '../../hooks/useDadosLocais'
import { useSessao } from '../../hooks/useSessao'
import { lerMinhasImagens, sincronizarImagensLocais } from '../../services/imagens'
import { EVENTO_PERFIL, lerPerfil } from '../../services/perfil'

// Layout da área privada da candidata (/candidata/*, /vagas/:id,
// /comunidades/:id): a moldura compartilhada com o menu da candidata.
const CONFIG = {
  rotuloNav: 'Área da candidata',
  inicio: '/candidata/feed',
  chavePreferencia: 'bloom-menu-recolhido',
  idGaveta: 'gaveta-candidata',
  secoes: [
    {
      itens: [
        { rotulo: 'Feed', para: '/candidata/feed', icone: 'inicio' },
        { rotulo: 'Explorar', para: '/candidata/explorar', icone: 'busca' },
        { rotulo: 'Meus projetos', para: '/candidata/projetos', icone: 'pasta' },
        { rotulo: 'Comunidades', para: '/candidata/comunidades', icone: 'grupo', tambem: ['/comunidades/'] },
      ],
    },
    {
      grupo: 'Oportunidades',
      icone: 'maleta',
      itens: [
        { rotulo: 'Vagas', para: '/candidata/vagas', icone: 'maleta', tambem: ['/vagas/'] },
        { rotulo: 'Vagas salvas', para: '/candidata/vagas-salvas', icone: 'coracao' },
        { rotulo: 'Minhas candidaturas', para: '/candidata/candidaturas', icone: 'candidaturas' },
      ],
    },
    { divisor: true },
    {
      itens: [
        { rotulo: 'Mensagens', para: '/candidata/mensagens', icone: 'mensagem' },
        { rotulo: 'Notificações', para: '/candidata/notificacoes', icone: 'sino' },
        { rotulo: 'Meu perfil', para: '/candidata/perfil', icone: 'perfil' },
        { rotulo: 'Configurações', para: '/candidata/configuracoes', icone: 'engrenagem' },
      ],
    },
  ],
  promo: {
    titulo: 'Novas oportunidades',
    texto: 'Encontre vagas que combinam com as suas competências.',
    rotuloAcao: 'Ver vagas',
    para: '/candidata/vagas',
  },
  busca: {
    placeholder: 'Buscar na Bloom…',
    rotulo: 'Buscar profissionais, publicações e vagas',
    para: (termo) => (termo ? `/candidata/explorar?q=${encodeURIComponent(termo)}` : '/candidata/explorar'),
  },
  mensagens: '/candidata/mensagens',
  notificacoes: '/candidata/notificacoes',
  perfil: { para: '/candidata/perfil', rotulo: 'Meu perfil' },
  configuracoes: '/candidata/configuracoes',
}

function LayoutCandidata() {
  const sessao = useSessao()
  const usuario = sessao?.usuario
  const perfil = useDadosLocais(() => lerPerfil(usuario), [EVENTO_PERFIL])

  // Foto e capa ficam no servidor; o perfil local acompanha (outro navegador,
  // troca feita em outra aba etc.). Sem servidor, segue o que está salvo aqui.
  useEffect(() => {
    lerMinhasImagens()
      .then((r) => sincronizarImagensLocais(usuario, r.imagens))
      .catch(() => {})
  }, [usuario])
  return <LayoutPrivado config={CONFIG} usuario={usuario} foto={perfil.foto} />
}

export default LayoutCandidata
