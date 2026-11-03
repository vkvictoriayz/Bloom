import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import { enderecoSeguro } from '../../components/candidata/utilPerfil'
import EditorEtiquetas from '../../components/perfil/EditorEtiquetas'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Aviso, Campo, Entrada } from '../../components/ui/Campo'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { useSessao } from '../../hooks/useSessao'
import { buscarProjeto, excluirProjeto, LIMITE_IMAGEM_PROJETO, salvarProjeto } from '../../services/projetos'

const VAZIO = { nome: '', descricao: '', imagem: '', tecnologias: [], repositorio: '', demo: '', inicio: '', fim: '' }

// Criar (/candidata/projetos/criar) e editar (/candidata/projetos/:id/editar).
function FormularioProjeto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const sessao = useSessao()
  const usuario = sessao?.usuario
  const editando = Boolean(id)
  const [original] = useState(() => (editando ? buscarProjeto(usuario, id) : null))
  const [dados, setDados] = useState(() => original ?? VAZIO)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const arquivo = useRef(null)

  if (editando && !original) {
    return (
      <Vazio className="bg-branco">
        <VazioTitulo>Projeto não encontrado</VazioTitulo>
        <VazioDescricao>Este projeto não existe ou não pertence a você.</VazioDescricao>
        <VazioAcoes>
          <Botao as={Link} to="/candidata/projetos">
            Meus projetos
          </Botao>
        </VazioAcoes>
      </Vazio>
    )
  }

  const campo = (nome) => (e) => setDados((d) => ({ ...d, [nome]: e.target.value }))

  function escolherImagem(e) {
    const imagem = e.target.files?.[0]
    e.target.value = ''
    if (!imagem) return
    if (!imagem.type.startsWith('image/')) return setErros((x) => ({ ...x, imagem: 'Escolha um arquivo de imagem.' }))
    if (imagem.size > LIMITE_IMAGEM_PROJETO) return setErros((x) => ({ ...x, imagem: 'A imagem deve ter até 400 KB.' }))
    const leitor = new FileReader()
    leitor.onload = () => {
      setDados((d) => ({ ...d, imagem: leitor.result }))
      setErros((x) => ({ ...x, imagem: undefined }))
    }
    leitor.readAsDataURL(imagem)
  }

  function enviar(e) {
    e.preventDefault()
    const novos = {}
    if (dados.nome.trim().length < 2) novos.nome = 'Dê um nome ao projeto (ao menos 2 letras).'
    if (dados.descricao.trim().length > 600) novos.descricao = 'Use até 600 caracteres.'
    if (dados.repositorio.trim() && !enderecoSeguro(dados.repositorio.trim())) novos.repositorio = 'Endereço inválido. Ex.: https://github.com/voce/projeto'
    if (dados.demo.trim() && !enderecoSeguro(dados.demo.trim())) novos.demo = 'Endereço inválido.'
    if (dados.inicio && dados.fim && dados.fim < dados.inicio) novos.fim = 'O fim não pode ser antes do início.'
    setErros(novos)
    if (Object.keys(novos).length) return setErroGeral('Corrija os campos destacados.')

    const salvo = salvarProjeto(usuario, {
      ...dados,
      id: original?.id,
      nome: dados.nome.trim(),
      descricao: dados.descricao.trim(),
      repositorio: enderecoSeguro(dados.repositorio.trim()) ?? '',
      demo: enderecoSeguro(dados.demo.trim()) ?? '',
    })
    if (!salvo) return setErroGeral('Não foi possível salvar neste navegador. A imagem pode ser grande demais para o armazenamento.')
    navigate('/candidata/projetos', { replace: true })
  }

  function excluir() {
    if (!excluirProjeto(usuario, original.id)) return setErroGeral('Não foi possível excluir o projeto.')
    navigate('/candidata/projetos', { replace: true })
  }

  return (
    <>
      <TituloPagina titulo={editando ? 'Editar projeto' : 'Novo projeto'} voltar={{ para: '/candidata/projetos', rotulo: 'Meus projetos' }} />

      <form onSubmit={enviar} noValidate className="flex max-w-3xl flex-col gap-6 rounded-xl border border-linha bg-branco p-6 sm:p-8">
        <Campo rotulo="Nome do projeto" erro={erros.nome}>
          {(p) => <Entrada {...p} maxLength={100} value={dados.nome} onChange={campo('nome')} />}
        </Campo>

        <Campo rotulo="Descrição" opcional erro={erros.descricao} ajuda={!erros.descricao ? `${dados.descricao.length}/600 · O problema, o que você fez e o resultado.` : undefined}>
          {(p) => <AreaTexto {...p} rows={5} maxLength={600} value={dados.descricao} onChange={campo('descricao')} />}
        </Campo>

        <div>
          <p className="text-sm font-semibold text-tinta-2">
            Imagem de apresentação <span className="font-normal text-suave">(opcional, até 400 KB)</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div className="aspect-[16/9] w-48 overflow-hidden rounded-lg border border-linha bg-papel-2">
              {dados.imagem ? (
                <img src={dados.imagem} alt="Prévia da imagem do projeto" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-linha-forte" aria-hidden="true">
                  <Icone nome="imagem" tamanho={28} />
                </div>
              )}
            </div>
            <input ref={arquivo} type="file" accept="image/*" hidden onChange={escolherImagem} />
            <div className="flex gap-2">
              <Botao variante="secundario" tamanho="sm" onClick={() => arquivo.current?.click()}>
                {dados.imagem ? 'Trocar imagem' : 'Escolher imagem'}
              </Botao>
              {dados.imagem && (
                <Botao variante="fantasma" tamanho="sm" onClick={() => setDados((d) => ({ ...d, imagem: '' }))}>
                  Remover
                </Botao>
              )}
            </div>
          </div>
          {erros.imagem && <p className="mt-2 text-xs text-erro">{erros.imagem}</p>}
        </div>

        <EditorEtiquetas
          rotulo="Tecnologias utilizadas"
          itens={dados.tecnologias}
          sugestao="Ex.: React, Python — Enter para incluir"
          vazio="Nenhuma tecnologia adicionada."
          aoMudar={(tecnologias) => setDados((d) => ({ ...d, tecnologias }))}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Link do repositório" opcional erro={erros.repositorio}>
            {(p) => <Entrada {...p} type="url" placeholder="https://github.com/…" value={dados.repositorio} onChange={campo('repositorio')} />}
          </Campo>
          <Campo rotulo="Link de demonstração" opcional erro={erros.demo}>
            {(p) => <Entrada {...p} type="url" placeholder="https://" value={dados.demo} onChange={campo('demo')} />}
          </Campo>
          <Campo rotulo="Início" opcional>
            {(p) => <Entrada {...p} type="month" value={dados.inicio} onChange={campo('inicio')} />}
          </Campo>
          <Campo rotulo="Fim (vazio se em andamento)" opcional erro={erros.fim}>
            {(p) => <Entrada {...p} type="month" value={dados.fim} onChange={campo('fim')} />}
          </Campo>
        </div>

        {erroGeral && <Aviso tipo="erro">{erroGeral}</Aviso>}

        <div className="flex flex-wrap items-center gap-2 border-t border-linha pt-6">
          <Botao type="submit">{editando ? 'Salvar alterações' : 'Criar projeto'}</Botao>
          <Botao as={Link} to="/candidata/projetos" variante="fantasma">
            Cancelar
          </Botao>
          {editando &&
            (confirmandoExclusao ? (
              <span className="ml-auto flex flex-wrap items-center gap-2 text-sm">
                <span className="text-tinta-2">Excluir este projeto? Não dá para desfazer.</span>
                <Botao tamanho="sm" className="bg-erro hover:bg-erro/90" onClick={excluir}>
                  Excluir
                </Botao>
                <Botao tamanho="sm" variante="secundario" onClick={() => setConfirmandoExclusao(false)}>
                  Manter
                </Botao>
              </span>
            ) : (
              <Botao variante="fantasma" className="ml-auto text-erro hover:text-erro" onClick={() => setConfirmandoExclusao(true)}>
                <Icone nome="lixeira" tamanho={16} /> Excluir projeto
              </Botao>
            ))}
        </div>
      </form>
    </>
  )
}

export default FormularioProjeto
