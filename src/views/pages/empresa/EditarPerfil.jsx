import { useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

import Icone from '../../components/Icone'
import Capa from '../../components/candidata/Capa'
import TituloPagina from '../../components/candidata/TituloPagina'
import Avatar from '../../components/comunidade/Avatar'
import { Carregando } from '../../components/empresa/Estados'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Aviso, Campo, Entrada } from '../../components/ui/Campo'
import { fotoEmpresa, salvarPerfilEmpresa } from '../../services/empresa'
import { enviarImagem, escolherIcone, removerIcone, removerImagem } from '../../services/imagens'
import { SeletorIcone } from '../../components/IconePerfil'
import { ehIcone } from '../../data/icones'

const LIMITE_IMAGEM = 1024 * 1024 // 1 MB, o mesmo limite do servidor
const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp']

function urlValida(valor) {
  if (!valor) return true
  try {
    const u = new URL(valor)
    return ['http:', 'https:'].includes(u.protocol) && u.hostname.includes('.')
  } catch {
    return false
  }
}

// Foto e capa da empresa: enviadas ao servidor na hora (como na candidata) e
// vistas pelas candidatas nas vagas e por quem acessa o perfil da empresa.
function ImagensEmpresa({ dados, aoMudar }) {
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState(null)
  const arquivoFoto = useRef(null)
  const arquivoCapa = useRef(null)
  const foto = fotoEmpresa(dados)
  const capa = dados.imagens?.capa
  const iconeAtual = ehIcone(dados.imagens?.foto) ? dados.imagens.foto : null
  const [escolhendoIcone, setEscolhendoIcone] = useState(false)

  async function executar(acao, texto) {
    setOcupado(true)
    setAviso(null)
    try {
      await acao()
      setAviso({ tipo: 'sucesso', texto })
      aoMudar()
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: erro.message })
    } finally {
      setOcupado(false)
    }
  }

  function escolher(campo) {
    return (e) => {
      const arquivo = e.target.files?.[0]
      e.target.value = ''
      if (!arquivo) return
      if (!TIPOS_IMAGEM.includes(arquivo.type)) return setAviso({ tipo: 'erro', texto: 'Escolha uma imagem JPG, PNG ou WebP.' })
      if (arquivo.size > LIMITE_IMAGEM) return setAviso({ tipo: 'erro', texto: 'A imagem deve ter até 1 MB.' })
      const leitor = new FileReader()
      leitor.onload = () => executar(() => enviarImagem(campo, leitor.result), campo === 'foto' ? 'Foto atualizada.' : 'Capa atualizada.')
      leitor.readAsDataURL(arquivo)
    }
  }

  return (
    <section aria-labelledby="titulo-imagens-empresa" className="cartao max-w-3xl overflow-hidden">
      <Capa imagem={capa} className="rounded-none" />
      <div className="flex flex-wrap items-end gap-4 px-6 pb-6 sm:px-8">
        <Avatar nome={dados.empresa.nome} foto={foto} tamanho="xl" className="relative z-10 -mt-12 rounded-2xl bg-branco ring-4 ring-branco" />
        <div className="min-w-0 flex-1 pb-1">
          <h2 id="titulo-imagens-empresa" className="font-semibold text-tinta">
            Foto e capa
          </h2>
          <p className="text-sm text-suave">Imagens de até 1 MB (JPG, PNG ou WebP), ou um ícone da Bloom enquanto não tiver o logotipo. Aparecem para as candidatas.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input ref={arquivoFoto} type="file" accept={TIPOS_IMAGEM.join(',')} hidden onChange={escolher('foto')} />
            <input ref={arquivoCapa} type="file" accept={TIPOS_IMAGEM.join(',')} hidden onChange={escolher('capa')} />
            <Botao variante="secundario" tamanho="sm" disabled={ocupado} onClick={() => arquivoFoto.current?.click()}>
              <Icone nome="camera" tamanho={16} /> {dados.imagens?.foto && !iconeAtual ? 'Trocar foto ou logotipo' : 'Enviar foto ou logotipo'}
            </Botao>
            <Botao variante="secundario" tamanho="sm" disabled={ocupado} aria-expanded={escolhendoIcone} onClick={() => setEscolhendoIcone((v) => !v)}>
              <Icone nome="predio" tamanho={16} /> {iconeAtual ? 'Trocar ícone' : 'Usar um ícone'}
            </Botao>
            <Botao variante="secundario" tamanho="sm" disabled={ocupado} onClick={() => arquivoCapa.current?.click()}>
              <Icone nome="imagem" tamanho={16} /> {capa ? 'Trocar capa' : 'Adicionar capa'}
            </Botao>
            {dados.imagens?.foto && (
              <Botao
                variante="fantasma"
                tamanho="sm"
                disabled={ocupado}
                onClick={() => (iconeAtual ? executar(removerIcone, 'Ícone removido.') : executar(() => removerImagem('foto'), 'Foto removida.'))}
              >
                {iconeAtual ? 'Remover ícone' : 'Remover foto'}
              </Botao>
            )}
            {capa && (
              <Botao variante="fantasma" tamanho="sm" disabled={ocupado} onClick={() => executar(() => removerImagem('capa'), 'Capa removida.')}>
                Remover capa
              </Botao>
            )}
          </div>
        </div>
      </div>
      {escolhendoIcone && (
        <div className="px-6 pb-6 sm:px-8">
          <SeletorIcone
            publico="empresa"
            forma="quadrado"
            valor={iconeAtual}
            ocupado={ocupado}
            aoCancelar={() => setEscolhendoIcone(false)}
            aoEscolher={(icone) => executar(() => escolherIcone(icone), 'Ícone salvo. Ele aparece no lugar da foto.').then(() => setEscolhendoIcone(false))}
          />
        </div>
      )}
      {aviso && (
        <div className="px-6 pb-6 sm:px-8">
          <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>
        </div>
      )}
    </section>
  )
}

// Edição do perfil da empresa (PERFIL_EMPRESA): só os campos que o banco
// tem. A foto e a capa são enviadas à parte (ImagensEmpresa); o logo por
// endereço, de versões anteriores, continua valendo quando não há foto.
function FormularioPerfil({ inicial, aoSalvar }) {
  const [dados, setDados] = useState(inicial)
  const [erros, setErros] = useState({})
  const [estado, setEstado] = useState({ tipo: 'ocioso' })

  const campo = (nome) => (e) => setDados((d) => ({ ...d, [nome]: e.target.value }))

  async function enviar(e) {
    e.preventDefault()
    const novos = {}
    if (dados.descricao.length > 500) novos.descricao = 'Use até 500 caracteres.'
    if (dados.localizacao.length > 150) novos.localizacao = 'Use até 150 caracteres.'
    if (!urlValida(dados.site.trim())) novos.site = 'Use um endereço completo, como https://empresa.com.br'
    if (dados.linkedin.trim() && (!urlValida(dados.linkedin.trim()) || !/linkedin\.com/i.test(dados.linkedin))) novos.linkedin = 'Use o endereço da página no LinkedIn (https://www.linkedin.com/company/...)'
    if (dados.emailContato.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.emailContato.trim())) novos.emailContato = 'Digite um e-mail válido.'
    if (dados.nome.trim().length < 2) novos.nome = 'Informe o nome da empresa.'
    if (dados.informacoes.length > 1000) novos.informacoes = 'Use até 1000 caracteres.'
    setErros(novos)
    if (Object.keys(novos).length) return setEstado({ tipo: 'erro', texto: 'Corrija os campos destacados.' })

    setEstado({ tipo: 'salvando' })
    try {
      await salvarPerfilEmpresa({
        nome: dados.nome.trim(),
        telefone: dados.telefone,
        logo: dados.logo.trim(),
        descricao: dados.descricao.trim(),
        areaAtuacao: dados.areaAtuacao.trim(),
        localizacao: dados.localizacao.trim(),
        site: dados.site.trim(),
        linkedin: dados.linkedin.trim(),
        emailContato: dados.emailContato.trim(),
        informacoes: dados.informacoes.trim(),
      })
      setEstado({ tipo: 'sucesso', texto: 'Perfil salvo.' })
      aoSalvar()
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="cartao flex max-w-3xl flex-col gap-5 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo rotulo="Nome da empresa" erro={erros.nome} ajuda={!erros.nome ? 'Como as candidatas veem a empresa.' : undefined}>
          {(p) => <Entrada {...p} maxLength={150} value={dados.nome} onChange={campo('nome')} autoComplete="organization" />}
        </Campo>
        <Campo rotulo="Área de atuação" opcional>
          {(p) => <Entrada {...p} maxLength={100} placeholder="Ex.: Desenvolvimento de software" value={dados.areaAtuacao} onChange={campo('areaAtuacao')} />}
        </Campo>
      </div>
      <Campo rotulo="Descrição" opcional erro={erros.descricao} ajuda={!erros.descricao ? `${dados.descricao.length}/500 · O que a empresa faz e como é trabalhar nela.` : undefined}>
        {(p) => <AreaTexto {...p} rows={5} maxLength={500} value={dados.descricao} onChange={campo('descricao')} />}
      </Campo>
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo rotulo="Localização" opcional erro={erros.localizacao}>
          {(p) => <Entrada {...p} maxLength={150} placeholder="Cidade, UF" value={dados.localizacao} onChange={campo('localizacao')} />}
        </Campo>
        <Campo rotulo="Site oficial" opcional erro={erros.site}>
          {(p) => <Entrada {...p} type="url" maxLength={255} placeholder="https://" value={dados.site} onChange={campo('site')} />}
        </Campo>
        <Campo rotulo="LinkedIn" opcional erro={erros.linkedin}>
          {(p) => <Entrada {...p} type="url" maxLength={255} placeholder="https://www.linkedin.com/company/..." value={dados.linkedin} onChange={campo('linkedin')} />}
        </Campo>
        <Campo rotulo="E-mail de contato" opcional erro={erros.emailContato} ajuda={!erros.emailContato ? 'Aparece no perfil público da empresa.' : undefined}>
          {(p) => <Entrada {...p} type="email" maxLength={150} placeholder="vagas@empresa.com.br" value={dados.emailContato} onChange={campo('emailContato')} />}
        </Campo>
        <Campo rotulo="Telefone da conta" opcional>
          {(p) => <Entrada {...p} type="tel" maxLength={20} placeholder="(00) 0000-0000" value={dados.telefone} onChange={campo('telefone')} />}
        </Campo>
      </div>
      <Campo rotulo="Informações adicionais" opcional erro={erros.informacoes} ajuda={!erros.informacoes ? `${dados.informacoes.length}/1000 · Cultura, benefícios gerais, diversidade, como é o processo seletivo.` : undefined}>
        {(p) => <AreaTexto {...p} rows={4} maxLength={1000} value={dados.informacoes} onChange={campo('informacoes')} />}
      </Campo>
      {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
      {estado.tipo === 'sucesso' && <Aviso tipo="sucesso">{estado.texto}</Aviso>}
      <div className="flex flex-wrap gap-2 border-t border-linha pt-5">
        <Botao type="submit" disabled={estado.tipo === 'salvando'}>
          {estado.tipo === 'salvando' ? 'Salvando…' : 'Salvar perfil'}
        </Botao>
        <Botao as={Link} to="/empresa/perfil" variante="fantasma">
          Voltar ao perfil
        </Botao>
      </div>
    </form>
  )
}

function EditarPerfil() {
  const { perfil: dados, recarregarPerfil } = useOutletContext()
  return (
    <>
      <TituloPagina
        titulo="Editar perfil da empresa"
        descricao={dados ? `O e-mail de login (${dados.empresa.email}) e o CNPJ vêm do cadastro e não mudam aqui.` : undefined}
        voltar={{ para: '/empresa/perfil', rotulo: 'Perfil da empresa' }}
      />
      {dados ? (
        <div className="flex flex-col gap-6">
          <ImagensEmpresa dados={dados} aoMudar={recarregarPerfil} />
          <FormularioPerfil inicial={{ ...dados.perfil, nome: dados.empresa.nome, telefone: dados.empresa.telefone ?? '' }} aoSalvar={recarregarPerfil} />
        </div>
      ) : (
        <Carregando quantidade={1} altura="h-80" />
      )}
    </>
  )
}

export default EditarPerfil
