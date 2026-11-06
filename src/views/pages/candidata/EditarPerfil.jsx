import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import Icone from '../../components/Icone'
import Capa from '../../components/candidata/Capa'
import TituloPagina from '../../components/candidata/TituloPagina'
import { enderecoSeguro, LINKS, periodo } from '../../components/candidata/utilPerfil'
import Avatar from '../../components/comunidade/Avatar'
import EditorEtiquetas from '../../components/perfil/EditorEtiquetas'
import EditorItens from '../../components/perfil/EditorItens'
import Botao from '../../components/ui/Botao'
import Esqueleto from '../../components/ui/Esqueleto'
import { AreaTexto, Aviso, Campo, Entrada } from '../../components/ui/Campo'
import { opcoesFiltro } from '../../data/vagas'
import { useSessao } from '../../hooks/useSessao'
import { lerMeuPerfil, salvarMeuPerfil } from '../../services/comunidade'
import { enviarImagem, escolherIcone, removerIcone, removerImagem, soNesteNavegador } from '../../services/imagens'
import { SeletorIcone } from '../../components/IconePerfil'
import GerenciarCurriculo from '../../components/candidata/GerenciarCurriculo'
import { ehIcone } from '../../data/icones'
import { aguardarSincronizacao, salvarSecoesPerfil, sincronizarAreaCandidata } from '../../services/candidataApi'
import { completude, EVENTO_PERFIL, lerPerfil, salvarPerfil } from '../../services/perfil'
import { cn } from '../../lib/cn'

const LIMITE_IMAGEM = 1024 * 1024 // 1 MB, o mesmo limite do servidor
const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp']

const SECOES = [
  { id: 'dados', rotulo: 'Dados básicos' },
  { id: 'imagens', rotulo: 'Foto e capa' },
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'competencias', rotulo: 'Competências' },
  { id: 'experiencias', rotulo: 'Experiência' },
  { id: 'formacao', rotulo: 'Formação' },
  { id: 'cursos', rotulo: 'Cursos' },
  { id: 'projetos', rotulo: 'Projetos' },
  { id: 'preferencias', rotulo: 'Preferências' },
  { id: 'curriculo', rotulo: 'Currículo' },
]

function Secao({ id, titulo, descricao, origem, children }) {
  return (
    <section id={id} aria-labelledby={`titulo-${id}`} className="scroll-mt-24 rounded-xl border border-linha bg-branco p-6 sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={`titulo-${id}`} className="font-display text-2xl text-tinta">
            {titulo}
          </h2>
          {descricao && <p className="mt-1 text-sm text-suave">{descricao}</p>}
        </div>
        {origem && (
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', origem === 'servidor' ? 'bg-sucesso-claro text-sucesso' : 'bg-papel-2 text-suave')}>
            {origem === 'servidor' ? 'Salvo no servidor' : 'Salvo neste navegador'}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

function FormularioPerfil() {
  const sessao = useSessao()
  const { hash } = useLocation()
  const [perfil, setPerfil] = useState(() => lerPerfil(sessao?.usuario))
  const [mensagens, setMensagens] = useState({})

  const [dados, setDados] = useState(() => ({
    nome: perfil.nome,
    cargo: perfil.cargo,
    local: perfil.local,
    telefone: perfil.telefone,
    links: { ...perfil.links },
  }))
  const [erros, setErros] = useState({})
  const [resumo, setResumo] = useState({ sobre: perfil.sobre, objetivo: perfil.objetivo })
  const [preferencias, setPreferencias] = useState(perfil.preferencias)

  // Área, interesses e apresentação curta vêm da API da comunidade.
  const [comunidade, setComunidade] = useState(null)
  const [erroComunidade, setErroComunidade] = useState('')
  const [salvandoComunidade, setSalvandoComunidade] = useState(false)

  const [escolhendoIcone, setEscolhendoIcone] = useState(false)
  const [enviandoImagem, setEnviandoImagem] = useState(false)

  const arquivoFoto = useRef(null)
  const arquivoCapa = useRef(null)

  useEffect(() => {
    document.title = 'Editar perfil · BLOOM'
    lerMeuPerfil()
      .then((r) => setComunidade({ area: r.perfil.area, interesses: r.perfil.interesses.join(', '), bio: r.perfil.bio }))
      .catch((e) => setErroComunidade(e.message))
  }, [])

  // Foto e capa podem mudar fora desta tela (sincronização com o servidor).
  useEffect(() => {
    const atualizar = () => {
      const atual = lerPerfil(sessao?.usuario)
      setPerfil((p) => ({ ...p, foto: atual.foto, capa: atual.capa }))
    }
    window.addEventListener(EVENTO_PERFIL, atualizar)
    return () => window.removeEventListener(EVENTO_PERFIL, atualizar)
  }, [sessao?.usuario])

  // Links do tipo /candidata/perfil/editar#competencias rolam até a seção.
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  function avisar(secao, tipo, texto) {
    setMensagens((m) => ({ ...m, [secao]: { tipo, texto } }))
  }

  // Salva no servidor e atualiza a cópia local. Foto e capa já foram ao
  // servidor pela API de imagens: aqui só a cópia local muda.
  async function gravar(secao, mudancas, texto = 'Alterações salvas.') {
    const usuario = sessao?.usuario
    const soImagens = Object.keys(mudancas).every((chave) => chave === 'foto' || chave === 'capa')
    try {
      if (soImagens) salvarPerfil({ ...lerPerfil(usuario), ...mudancas })
      else await salvarSecoesPerfil(usuario, mudancas)
      setPerfil(lerPerfil(usuario))
      avisar(secao, 'sucesso', texto)
      return true
    } catch (erro) {
      avisar(secao, 'erro', erro.message)
      return false
    }
  }

  function salvarDados(e) {
    e.preventDefault()
    const novosErros = {}
    if (dados.nome.trim().length < 2) novosErros.nome = 'Informe seu nome (ao menos 2 letras).'
    const digitos = dados.telefone.replace(/\D/g, '')
    if (dados.telefone.trim() && (digitos.length < 10 || digitos.length > 11)) novosErros.telefone = 'Use DDD + número, com 10 ou 11 dígitos.'
    LINKS.forEach(({ chave }) => {
      if (dados.links[chave].trim() && !enderecoSeguro(dados.links[chave].trim())) novosErros[chave] = 'Endereço inválido. Ex.: https://github.com/seu-usuario'
    })
    setErros(novosErros)
    if (Object.keys(novosErros).length) {
      avisar('dados', 'erro', 'Corrija os campos destacados.')
      return
    }
    gravar('dados', {
      nome: dados.nome.trim(),
      cargo: dados.cargo.trim(),
      local: dados.local.trim(),
      telefone: dados.telefone.trim(),
      links: Object.fromEntries(LINKS.map(({ chave }) => [chave, enderecoSeguro(dados.links[chave].trim()) ?? ''])),
    })
  }

  async function salvarComunidade(e) {
    e.preventDefault()
    setSalvandoComunidade(true)
    try {
      const r = await salvarMeuPerfil({
        area: comunidade.area,
        bio: comunidade.bio,
        interesses: comunidade.interesses.split(',').map((i) => i.trim()).filter(Boolean),
      })
      setComunidade({ area: r.perfil.area, interesses: r.perfil.interesses.join(', '), bio: r.perfil.bio })
      avisar('comunidade', 'sucesso', 'Salvo no servidor.')
    } catch (erro) {
      avisar('comunidade', 'erro', erro.message)
    } finally {
      setSalvandoComunidade(false)
    }
  }

  // Foto e capa vão para o servidor (outras integrantes e empresas veem);
  // o perfil local guarda o endereço devolvido, usado no menu e nas telas.
  async function publicarImagem(campo, imagem) {
    setEnviandoImagem(true)
    try {
      const r = await enviarImagem(campo, imagem)
      gravar('imagens', { [campo]: r.imagens[campo] }, campo === 'foto' ? 'Foto atualizada.' : 'Capa atualizada.')
    } catch (erro) {
      avisar('imagens', 'erro', erro.message)
    } finally {
      setEnviandoImagem(false)
    }
  }

  // Ícone predefinido no lugar da foto (a foto enviada, se houver, sai).
  async function usarIcone(icone) {
    setEnviandoImagem(true)
    try {
      const r = await escolherIcone(icone)
      await gravar('imagens', { foto: r.imagens.foto }, 'Ícone salvo. Ele aparece no lugar da foto.')
      setEscolhendoIcone(false)
    } catch (erro) {
      avisar('imagens', 'erro', erro.message)
    } finally {
      setEnviandoImagem(false)
    }
  }

  async function tirarImagem(campo) {
    setEnviandoImagem(true)
    try {
      if (campo === 'foto' && ehIcone(perfil.foto)) {
        await removerIcone()
        gravar('imagens', { foto: '' }, 'Ícone removido.')
        return
      }
      await removerImagem(campo)
      gravar('imagens', { [campo]: '' }, campo === 'foto' ? 'Foto removida.' : 'Capa removida.')
    } catch (erro) {
      avisar('imagens', 'erro', erro.message)
    } finally {
      setEnviandoImagem(false)
    }
  }

  function escolherImagem(campo) {
    return (e) => {
      const arquivo = e.target.files?.[0]
      e.target.value = ''
      if (!arquivo) return
      if (!TIPOS_IMAGEM.includes(arquivo.type)) return avisar('imagens', 'erro', 'Escolha uma imagem JPG, PNG ou WebP.')
      if (arquivo.size > LIMITE_IMAGEM) return avisar('imagens', 'erro', 'A imagem deve ter até 1 MB.')
      const leitor = new FileReader()
      leitor.onload = () => publicarImagem(campo, leitor.result)
      leitor.readAsDataURL(arquivo)
    }
  }

  // Imagens escolhidas antes do envio ao servidor ficaram só neste navegador.
  const imagensLocais = ['foto', 'capa'].filter((campo) => soNesteNavegador(perfil[campo]))
  async function publicarImagensLocais() {
    for (const campo of imagensLocais) await publicarImagem(campo, perfil[campo])
  }

  function alternarPreferencia(lista, valor) {
    setPreferencias((p) => ({ ...p, [lista]: p[lista].includes(valor) ? p[lista].filter((v) => v !== valor) : [...p[lista], valor] }))
  }

  const mensagem = (secao) =>
    mensagens[secao] ? (
      <Aviso tipo={mensagens[secao].tipo} className="mt-4">
        {mensagens[secao].texto}
      </Aviso>
    ) : null

  const { percentual } = completude(perfil)

  return (
    <>
      <TituloPagina
        titulo="Editar perfil"
        descricao={`Seu perfil está ${percentual}% completo. Cada seção é salva separadamente.`}
        voltar={{ para: '/candidata/perfil', rotulo: 'Ver meu perfil' }}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Seções do perfil" className="hidden lg:block">
          <ul className="sticky top-24 flex flex-col gap-0.5 border-l border-linha">
            {SECOES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm text-suave hover:border-vinho hover:text-tinta">
                  {s.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-6">
          <Secao id="dados" titulo="Dados básicos" origem="servidor">
            <form onSubmit={salvarDados} noValidate className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Nome completo" erro={erros.nome}>
                {(p) => <Entrada {...p} maxLength={100} value={dados.nome} onChange={(e) => setDados({ ...dados, nome: e.target.value })} />}
              </Campo>
              <Campo rotulo="Título profissional" opcional>
                {(p) => <Entrada {...p} maxLength={100} placeholder="Ex.: Desenvolvedora front-end" value={dados.cargo} onChange={(e) => setDados({ ...dados, cargo: e.target.value })} />}
              </Campo>
              <Campo rotulo="Localização" opcional>
                {(p) => <Entrada {...p} maxLength={100} placeholder="Cidade, UF" value={dados.local} onChange={(e) => setDados({ ...dados, local: e.target.value })} />}
              </Campo>
              <Campo rotulo="Telefone" opcional erro={erros.telefone}>
                {(p) => <Entrada {...p} type="tel" maxLength={20} placeholder="(11) 99999-0000" value={dados.telefone} onChange={(e) => setDados({ ...dados, telefone: e.target.value })} />}
              </Campo>
              {LINKS.map(({ chave, rotulo }) => (
                <Campo key={chave} rotulo={rotulo} opcional erro={erros[chave]}>
                  {(p) => (
                    <Entrada
                      {...p}
                      type="url"
                      inputMode="url"
                      maxLength={200}
                      placeholder="https://"
                      value={dados.links[chave]}
                      onChange={(e) => setDados({ ...dados, links: { ...dados.links, [chave]: e.target.value } })}
                    />
                  )}
                </Campo>
              ))}
              <div className="sm:col-span-2">
                <Botao type="submit">Salvar dados básicos</Botao>
                {mensagem('dados')}
              </div>
            </form>
          </Secao>

          <Secao
            id="imagens"
            titulo="Foto e capa"
            descricao="Imagens de até 1 MB (JPG, PNG ou WebP), ou um ícone da Bloom no lugar da foto. Aparecem para outras integrantes e para as empresas."
            origem="servidor"
          >
            <div className="overflow-hidden rounded-xl border border-linha">
              <Capa imagem={perfil.capa} className="rounded-none" />
              <div className="flex flex-wrap items-end gap-4 px-5 pb-5">
                <Avatar nome={perfil.nome} foto={perfil.foto} tamanho="xl" className="relative z-10 -mt-12 ring-4 ring-branco" />
                <div className="flex flex-wrap gap-2 pb-1">
                  <input ref={arquivoFoto} type="file" accept={TIPOS_IMAGEM.join(',')} hidden onChange={escolherImagem('foto')} />
                  <input ref={arquivoCapa} type="file" accept={TIPOS_IMAGEM.join(',')} hidden onChange={escolherImagem('capa')} />
                  <Botao variante="secundario" tamanho="sm" disabled={enviandoImagem} onClick={() => arquivoFoto.current?.click()}>
                    <Icone nome="camera" tamanho={16} /> {perfil.foto && !ehIcone(perfil.foto) ? 'Trocar foto' : 'Enviar foto'}
                  </Botao>
                  <Botao variante="secundario" tamanho="sm" disabled={enviandoImagem} aria-expanded={escolhendoIcone} onClick={() => setEscolhendoIcone((v) => !v)}>
                    <Icone nome="broto" tamanho={16} /> {ehIcone(perfil.foto) ? 'Trocar ícone' : 'Usar um ícone'}
                  </Botao>
                  <Botao variante="secundario" tamanho="sm" disabled={enviandoImagem} onClick={() => arquivoCapa.current?.click()}>
                    <Icone nome="imagem" tamanho={16} /> {perfil.capa ? 'Trocar capa' : 'Adicionar capa'}
                  </Botao>
                  {perfil.foto && (
                    <Botao variante="fantasma" tamanho="sm" disabled={enviandoImagem} onClick={() => tirarImagem('foto')}>
                      {ehIcone(perfil.foto) ? 'Remover ícone' : 'Remover foto'}
                    </Botao>
                  )}
                  {perfil.capa && (
                    <Botao variante="fantasma" tamanho="sm" disabled={enviandoImagem} onClick={() => tirarImagem('capa')}>
                      Remover capa
                    </Botao>
                  )}
                </div>
              </div>
            </div>
            {escolhendoIcone && (
              <div className="mt-4">
                <SeletorIcone publico="usuaria" valor={perfil.foto} aoEscolher={usarIcone} ocupado={enviandoImagem} aoCancelar={() => setEscolhendoIcone(false)} />
              </div>
            )}
            {imagensLocais.length > 0 && (
              <Aviso tipo="info" className="mt-4">
                {imagensLocais.length === 2
                  ? 'Sua foto e sua capa estão salvas só neste navegador, então outras pessoas ainda não as veem.'
                  : `Sua ${imagensLocais[0]} está salva só neste navegador, então outras pessoas ainda não a veem.`}{' '}
                <button type="button" onClick={publicarImagensLocais} disabled={enviandoImagem} className="font-semibold text-vinho underline underline-offset-4">
                  Publicar no perfil
                </button>
              </Aviso>
            )}
            {mensagem('imagens')}
          </Secao>

          <Secao id="resumo" titulo="Resumo profissional" origem="servidor">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                gravar('resumo', { sobre: resumo.sobre.trim(), objetivo: resumo.objetivo.trim() })
              }}
              className="flex flex-col gap-4"
            >
              <Campo rotulo="Resumo" ajuda={`${resumo.sobre.length}/500 · Quem você é, no que trabalha e o que busca.`}>
                {(p) => <AreaTexto {...p} rows={5} maxLength={500} value={resumo.sobre} onChange={(e) => setResumo({ ...resumo, sobre: e.target.value })} />}
              </Campo>
              <Campo rotulo="Objetivo de carreira" opcional>
                {(p) => <AreaTexto {...p} rows={3} maxLength={500} value={resumo.objetivo} onChange={(e) => setResumo({ ...resumo, objetivo: e.target.value })} />}
              </Campo>
              <div>
                <Botao type="submit">Salvar resumo</Botao>
                {mensagem('resumo')}
              </div>
            </form>
          </Secao>

          <Secao id="comunidade" titulo="Área de atuação e interesses" descricao="É assim que você aparece para outras integrantes no feed." origem="servidor">
            {erroComunidade ? (
              <Aviso tipo="erro">Não foi possível carregar estes dados: {erroComunidade}</Aviso>
            ) : !comunidade ? (
              <p className="text-sm text-suave">Carregando…</p>
            ) : (
              <form onSubmit={salvarComunidade} className="grid gap-4 sm:grid-cols-2">
                <Campo rotulo="Área de atuação" ajuda={`${comunidade.area.length}/80`}>
                  {(p) => <Entrada {...p} maxLength={80} placeholder="Ex.: Engenharia de dados" value={comunidade.area} onChange={(e) => setComunidade({ ...comunidade, area: e.target.value })} />}
                </Campo>
                <Campo rotulo="Interesses" ajuda="Separe por vírgula (até 10).">
                  {(p) => <Entrada {...p} placeholder="Ex.: React, carreira, dados" value={comunidade.interesses} onChange={(e) => setComunidade({ ...comunidade, interesses: e.target.value })} />}
                </Campo>
                <Campo rotulo="Apresentação curta" ajuda={`${comunidade.bio.length}/280`} className="sm:col-span-2">
                  {(p) => <AreaTexto {...p} rows={3} maxLength={280} value={comunidade.bio} onChange={(e) => setComunidade({ ...comunidade, bio: e.target.value })} />}
                </Campo>
                <div className="sm:col-span-2">
                  <Botao type="submit" disabled={salvandoComunidade}>
                    {salvandoComunidade ? 'Salvando…' : 'Salvar no perfil público'}
                  </Botao>
                  {mensagem('comunidade')}
                </div>
              </form>
            )}
          </Secao>

          <Secao id="competencias" titulo="Competências" descricao="As técnicas são usadas para recomendar vagas." origem="servidor">
            <div className="grid gap-8 md:grid-cols-2">
              <EditorEtiquetas
                rotulo="Técnicas"
                variante="cheia"
                itens={perfil.tecnicas}
                sugestao="Ex.: React, SQL — Enter para incluir"
                vazio="Nenhuma competência técnica."
                aoMudar={(tecnicas) => gravar('competencias', { tecnicas }, 'Competências salvas.')}
              />
              <EditorEtiquetas
                rotulo="Comportamentais"
                itens={perfil.comportamentais}
                sugestao="Ex.: Comunicação — Enter para incluir"
                vazio="Nenhuma competência comportamental."
                aoMudar={(comportamentais) => gravar('competencias', { comportamentais }, 'Competências salvas.')}
              />
            </div>
            {mensagem('competencias')}
          </Secao>

          <Secao id="experiencias" titulo="Experiência profissional" origem="servidor">
            <EditorItens
              itens={perfil.experiencias}
              layout="linha"
              rotuloAdicionar="Adicionar experiência"
              vazio={<p className="text-sm text-suave">Inclua estágios, empregos, voluntariado ou freelas.</p>}
              aoMudar={(experiencias) => gravar('experiencias', { experiencias }, 'Experiências salvas.')}
              campos={[
                { nome: 'cargo', rotulo: 'Cargo', obrigatorio: true, max: 100 },
                { nome: 'empresa', rotulo: 'Empresa', obrigatorio: true, max: 100 },
                { nome: 'inicio', rotulo: 'Início', tipo: 'month' },
                { nome: 'fim', rotulo: 'Fim (vazio se atual)', tipo: 'month' },
                { nome: 'descricao', rotulo: 'O que você fez', tipo: 'textarea', largo: true, max: 250 },
              ]}
              renderizar={(item) => (
                <div>
                  <p className="font-semibold text-tinta">{item.cargo}</p>
                  <p className="text-sm text-vinho">{item.empresa}</p>
                  <p className="text-xs text-suave">{periodo(item.inicio, item.fim)}</p>
                </div>
              )}
            />
            {mensagem('experiencias')}
          </Secao>

          <Secao id="formacao" titulo="Formação acadêmica" origem="servidor">
            <EditorItens
              itens={perfil.formacoes}
              layout="linha"
              rotuloAdicionar="Adicionar formação"
              vazio={<p className="text-sm text-suave">Adicione graduação, curso técnico ou ensino médio.</p>}
              aoMudar={(formacoes) => gravar('formacao', { formacoes }, 'Formação salva.')}
              campos={[
                { nome: 'curso', rotulo: 'Curso', obrigatorio: true },
                { nome: 'instituicao', rotulo: 'Instituição', obrigatorio: true },
                { nome: 'nivel', rotulo: 'Nível', placeholder: 'Ex.: Graduação, Técnico', max: 50 },
                { nome: 'inicio', rotulo: 'Início', tipo: 'month' },
                { nome: 'conclusao', rotulo: 'Conclusão (vazio se cursando)', tipo: 'month' },
              ]}
              renderizar={(item) => (
                <div>
                  <p className="font-semibold text-tinta">{item.curso}</p>
                  <p className="text-sm text-vinho">{item.instituicao}</p>
                  <p className="text-xs text-suave">{periodo(item.inicio, item.conclusao, 'cursando')}</p>
                </div>
              )}
            />
            {mensagem('formacao')}
          </Secao>

          <Secao id="cursos" titulo="Cursos e certificações" origem="servidor">
            <EditorItens
              itens={perfil.cursos}
              rotuloAdicionar="Adicionar curso"
              vazio={<p className="text-sm text-suave">Bootcamps, cursos livres e certificações contam muito.</p>}
              aoMudar={(cursos) => gravar('cursos', { cursos }, 'Cursos salvos.')}
              campos={[
                { nome: 'nome', rotulo: 'Curso ou certificação', obrigatorio: true },
                { nome: 'instituicao', rotulo: 'Instituição' },
                { nome: 'ano', rotulo: 'Ano', tipo: 'number', placeholder: '2025', max: 4 },
                { nome: 'link', rotulo: 'Link da credencial', tipo: 'url', placeholder: 'https://' },
              ]}
              renderizar={(item) => (
                <div>
                  <p className="font-semibold text-tinta">{item.nome}</p>
                  <p className="text-sm text-suave">{[item.instituicao, item.ano].filter(Boolean).join(' · ')}</p>
                </div>
              )}
            />
            {mensagem('cursos')}
          </Secao>

          <Secao id="projetos" titulo="Projetos e portfólio">
            <p className="text-sm text-tinta-2">
              Seus projetos têm uma página própria, com imagem, tecnologias e links de repositório e demonstração.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Botao as={Link} to="/candidata/projetos">
                Gerenciar projetos
              </Botao>
              <Botao as={Link} to="/candidata/projetos/criar" variante="secundario">
                <Icone nome="mais" tamanho={16} /> Novo projeto
              </Botao>
            </div>
          </Secao>

          <Secao id="preferencias" titulo="Preferências profissionais" descricao="O que você procura na próxima oportunidade." origem="servidor">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                gravar('preferencias', { preferencias: { ...preferencias, disponibilidade: preferencias.disponibilidade.trim() } }, 'Preferências salvas.')
              }}
              className="flex flex-col gap-6"
            >
              {[
                ['modalidades', 'Modalidades', opcoesFiltro.modalidades],
                ['areas', 'Áreas de interesse', opcoesFiltro.areas],
              ].map(([lista, rotulo, opcoes]) => (
                <fieldset key={lista}>
                  <legend className="mb-3 text-sm font-semibold text-tinta-2">{rotulo}</legend>
                  <div className="flex flex-wrap gap-2">
                    {opcoes.map((op) => {
                      const ativo = preferencias[lista].includes(op)
                      return (
                        <button
                          key={op}
                          type="button"
                          aria-pressed={ativo}
                          onClick={() => alternarPreferencia(lista, op)}
                          className={cn(
                            'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                            ativo ? 'border-vinho bg-vinho text-white' : 'border-linha-forte bg-branco text-tinta-2 hover:border-tinta'
                          )}
                        >
                          {op}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              ))}
              <Campo rotulo="Disponibilidade" opcional className="max-w-md">
                {(p) => (
                  <Entrada {...p} maxLength={100} placeholder="Ex.: início imediato" value={preferencias.disponibilidade} onChange={(e) => setPreferencias({ ...preferencias, disponibilidade: e.target.value })} />
                )}
              </Campo>
              <div>
                <Botao type="submit">Salvar preferências</Botao>
                {mensagem('preferencias')}
              </div>
            </form>
          </Secao>

          <Secao id="curriculo" titulo="Currículo" descricao="PDF, DOC ou DOCX, até 5 MB. Fica no seu perfil e pode ser anexado às candidaturas." origem="servidor">
            <GerenciarCurriculo />
          </Secao>
        </div>
      </div>
    </>
  )
}

// Espera o perfil chegar do servidor antes de montar o formulário: assim um
// navegador novo nunca salva campos vazios por cima do que está na conta.
function EditarPerfil() {
  const sessao = useSessao()
  const [estado, setEstado] = useState({ tipo: 'carregando' })
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    const espera = tentativa ? sincronizarAreaCandidata(sessao?.usuario).then(() => ({ ok: true }), (e) => ({ ok: false, erro: e.message })) : aguardarSincronizacao(sessao?.usuario)
    espera.then((r) => ativo && setEstado(r.ok ? { tipo: 'pronto' } : { tipo: 'erro', texto: r.erro }))
    return () => {
      ativo = false
    }
  }, [sessao?.usuario, tentativa])

  if (estado.tipo === 'carregando') return <Esqueleto className="h-96 rounded-xl" />
  if (estado.tipo === 'erro') {
    return (
      <>
        <TituloPagina titulo="Editar perfil" voltar={{ para: '/candidata/perfil', rotulo: 'Meu perfil' }} />
        <Aviso tipo="erro">Não foi possível carregar seu perfil: {estado.texto}</Aviso>
        <Botao
          variante="secundario"
          className="mt-4"
          onClick={() => {
            setEstado({ tipo: 'carregando' })
            setTentativa((t) => t + 1)
          }}
        >
          Tentar de novo
        </Botao>
      </>
    )
  }
  return <FormularioPerfil />
}

export default EditarPerfil
