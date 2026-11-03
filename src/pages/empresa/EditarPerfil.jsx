import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando } from '../../components/empresa/Estados'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Aviso, Campo, Entrada } from '../../components/ui/Campo'
import { salvarPerfilEmpresa } from '../../services/empresa'

function urlValida(valor) {
  if (!valor) return true
  try {
    const u = new URL(valor)
    return ['http:', 'https:'].includes(u.protocol) && u.hostname.includes('.')
  } catch {
    return false
  }
}

// Edição do perfil da empresa (PERFIL_EMPRESA): só os campos que o banco
// tem. O logo é um endereço de imagem (ainda não há envio de arquivos).
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
    if (!urlValida(dados.logo.trim())) novos.logo = 'Use um endereço de imagem completo (https://…).'
    setErros(novos)
    if (Object.keys(novos).length) return setEstado({ tipo: 'erro', texto: 'Corrija os campos destacados.' })

    setEstado({ tipo: 'salvando' })
    try {
      await salvarPerfilEmpresa({
        logo: dados.logo.trim(),
        descricao: dados.descricao.trim(),
        localizacao: dados.localizacao.trim(),
        site: dados.site.trim(),
      })
      setEstado({ tipo: 'sucesso', texto: 'Perfil salvo.' })
      aoSalvar()
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="cartao flex max-w-3xl flex-col gap-5 p-6 sm:p-8">
      <Campo rotulo="Descrição" opcional erro={erros.descricao} ajuda={!erros.descricao ? `${dados.descricao.length}/500 · O que a empresa faz e como é trabalhar nela.` : undefined}>
        {(p) => <AreaTexto {...p} rows={5} maxLength={500} value={dados.descricao} onChange={campo('descricao')} />}
      </Campo>
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo rotulo="Localização" opcional erro={erros.localizacao}>
          {(p) => <Entrada {...p} maxLength={150} placeholder="Cidade, UF" value={dados.localizacao} onChange={campo('localizacao')} />}
        </Campo>
        <Campo rotulo="Site" opcional erro={erros.site}>
          {(p) => <Entrada {...p} type="url" maxLength={255} placeholder="https://" value={dados.site} onChange={campo('site')} />}
        </Campo>
      </div>
      <Campo rotulo="Endereço do logotipo" opcional erro={erros.logo} ajuda={!erros.logo ? 'Link para uma imagem do logo (PNG, JPG ou SVG).' : undefined}>
        {(p) => <Entrada {...p} type="url" maxLength={255} placeholder="https://" value={dados.logo} onChange={campo('logo')} />}
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
        descricao={dados ? `Nome e e-mail vêm do cadastro de ${dados.empresa.nome}.` : undefined}
        voltar={{ para: '/empresa/perfil', rotulo: 'Perfil da empresa' }}
      />
      {dados ? <FormularioPerfil inicial={dados.perfil} aoSalvar={recarregarPerfil} /> : <Carregando quantidade={1} altura="h-80" />}
    </>
  )
}

export default EditarPerfil
