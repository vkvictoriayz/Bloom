// Fotografias usadas nos cabeçalhos, guardadas em src/assets/fotos.
//
// Todas são da série #WOCinTech Chat e de fotógrafas(os) do Unsplash, com a
// Licença Unsplash (uso gratuito, inclusive comercial). Cada foto existe em
// duas larguras (800 e 1600 px, WebP); o navegador escolhe pela tela.

import painelP from '../assets/fotos/painel-800.webp'
import painelG from '../assets/fotos/painel-1600.webp'
import contatosP from '../assets/fotos/contatos-800.webp'
import contatosG from '../assets/fotos/contatos-1600.webp'

export const fotos = {
  painel: {
    pequena: painelP,
    grande: painelG,
    alt: 'Mulher programando em um escritório, com código aberto nos monitores',
  },
  contatos: {
    pequena: contatosP,
    grande: contatosG,
    alt: 'Duas profissionais conversando à mesa com cadernos abertos',
  },
}
