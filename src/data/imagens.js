// Fotografias usadas nos cabeçalhos, guardadas em src/assets/fotos.
//
// Todas são da série #WOCinTech Chat e de fotógrafas(os) do Unsplash, com a
// Licença Unsplash (uso gratuito, inclusive comercial). Cada foto existe em
// duas larguras (800 e 1600 px, WebP); o navegador escolhe pela tela.

import painelP from '../assets/fotos/painel-800.webp'
import painelG from '../assets/fotos/painel-1600.webp'
import vagasP from '../assets/fotos/vagas-800.webp'
import vagasG from '../assets/fotos/vagas-1600.webp'
import candidaturasP from '../assets/fotos/candidaturas-800.webp'
import candidaturasG from '../assets/fotos/candidaturas-1600.webp'
import contatosP from '../assets/fotos/contatos-800.webp'
import contatosG from '../assets/fotos/contatos-1600.webp'
import empresasP from '../assets/fotos/empresas-800.webp'
import empresasG from '../assets/fotos/empresas-1600.webp'
import cadastroP from '../assets/fotos/cadastro-800.webp'
import cadastroG from '../assets/fotos/cadastro-1600.webp'
import empresaAcessoP from '../assets/fotos/empresa-acesso-800.webp'
import empresaAcessoG from '../assets/fotos/empresa-acesso-1600.webp'
import comoFuncionaP from '../assets/fotos/como-funciona-800.webp'
import comoFuncionaG from '../assets/fotos/como-funciona-1600.webp'

export const fotos = {
  painel: {
    pequena: painelP,
    grande: painelG,
    alt: 'Mulher programando em um escritório, com código aberto nos monitores',
  },
  vagas: {
    pequena: vagasP,
    grande: vagasG,
    alt: 'Três mulheres trabalhando juntas em notebooks',
  },
  candidaturas: {
    pequena: candidaturasP,
    grande: candidaturasG,
    alt: 'Duas mulheres conversando frente a frente em uma entrevista',
  },
  contatos: {
    pequena: contatosP,
    grande: contatosG,
    alt: 'Duas profissionais conversando à mesa com cadernos abertos',
  },
  empresas: {
    pequena: empresasP,
    grande: empresasG,
    alt: 'Duas profissionais em trajes de trabalho em um ambiente corporativo',
  },
  cadastro: {
    pequena: cadastroP,
    grande: cadastroG,
    alt: 'Mulher sorrindo em um ambiente de trabalho',
  },
  empresaAcesso: {
    pequena: empresaAcessoP,
    grande: empresaAcessoG,
    alt: 'Equipe reunida em uma sala de reuniões com notebooks',
  },
  comoFunciona: {
    pequena: comoFuncionaP,
    grande: comoFuncionaG,
    alt: 'Mulher apresentando ideias em um quadro para a equipe',
  },
}
