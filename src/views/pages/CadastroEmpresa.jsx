import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TelaAcesso, { GrupoCampos, LinkAcesso } from '../components/TelaAcesso'
import CampoSenha from '../components/CampoSenha'
import AcessoSocial from '../components/conta/AcessoSocial'
import { lerPreCadastro, limparFragmento } from '../utils/oauth'
import Consentimentos from '../components/conta/Consentimentos'
import RequisitosSenha from '../components/conta/RequisitosSenha'
import Icone from '../components/Icone'
import Botao from '../components/ui/Botao'
import { Aviso, Campo, Entrada } from '../components/ui/Campo'
import Selo from '../components/ui/Selo'
import { cadastrarEmpresa, consultarCnpj, salvarSessao } from '../services/auth'
import { destinoAposLogin } from '../services/destino'
import { formatarCNPJ, formatarTelefone, somenteDigitos, validarCNPJ } from '../utils/documentos'
import { problemaSenha } from '../utils/senha'
import { cn } from '../lib/cn'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function DadosEmpresa({ dados }) {
  const linhas = [
    ['Razão social', dados.razaoSocial],
    ['Nome fantasia', dados.nomeFantasia || 'Não informado'],
    ['Atividade principal (CNAE)', dados.cnaePrincipal ? `${dados.cnaePrincipal.codigo} · ${dados.cnaePrincipal.descricao}` : 'Não informada'],
    ['Município', [dados.municipio, dados.uf].filter(Boolean).join(' / ') || 'Não informado'],
  ]
  return (
    <section aria-label="Dados da empresa" className="rounded-2xl border border-rosa/15 bg-white/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-tinta">Confira os dados da empresa</p>
        <Selo variante={dados.ativa ? 'sucesso' : 'alerta'}>Situação: {dados.situacao.descricao}</Selo>
      </div>
      <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className="contents">
            <dt className="text-suave">{rotulo}</dt>
            <dd className="font-medium break-words text-tinta">{valor}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-suave">Fonte: {dados.fonte}. A razão social vem do cadastro oficial do CNPJ e não pode ser editada.</p>
    </section>
  )
}

const INICIAL = {
  nomeExibicao: '',
  responsavelNome: '',
  responsavelCargo: '',
  email: '',
  telefone: '',
  senha: '',
  confirmarSenha: '',
  declaraRepresentacao: false,
  aceiteTermos: false,
  cienciaDados: false,
  comunicacoes: false,
}

function validar(d, social) {
  const e = {}
  if (d.nomeExibicao.trim().length < 2) e.nomeExibicao = 'Informe o nome da empresa.'
  if (d.responsavelNome.trim().length < 2) e.responsavelNome = 'Informe o nome completo da pessoa responsável.'
  if (d.responsavelCargo.trim().length < 2) e.responsavelCargo = 'Informe o cargo da pessoa responsável.'
  if (!d.email.trim()) e.email = 'Informe o e-mail corporativo.'
  else if (!EMAIL.test(d.email.trim())) e.email = 'Digite um e-mail válido.'
  const tel = somenteDigitos(d.telefone)
  if (!tel) e.telefone = 'Informe o telefone comercial.'
  else if (tel.length < 10) e.telefone = 'Use DDD + número.'
  if (!social) {
    const senha = problemaSenha(d.senha)
    if (senha) e.senha = senha
    if (!d.confirmarSenha) e.confirmarSenha = 'Confirme a senha.'
    else if (d.senha !== d.confirmarSenha) e.confirmarSenha = 'As senhas não são iguais.'
  }
  if (!d.declaraRepresentacao) e.declaraRepresentacao = 'Confirme que você pode representar esta empresa.'
  if (!d.aceiteTermos) e.aceiteTermos = 'Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.'
  if (!d.cienciaDados) e.cienciaDados = 'Confirme que está ciente do tratamento dos dados.'
  return e
}

function CadastroEmpresa() {
  const navigate = useNavigate()

  const [cnpj, setCnpj] = useState('')
  const [consulta, setConsulta] = useState({ tipo: 'ocioso' })
  // Vindo do Google/GitHub: nome da pessoa responsável e e-mail já preenchidos, sem senha para criar.
  const [social] = useState(lerPreCadastro)
  const [dados, setDados] = useState(() => (social ? { ...INICIAL, responsavelNome: social.nome, email: social.email } : INICIAL))
  useEffect(() => {
    if (social) limparFragmento()
  }, [social])
  const [erros, setErros] = useState({})
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const ultimaConsulta = useRef('')

  const empresa = consulta.tipo === 'pronto' ? consulta.dados : null
  const podeCadastrar = Boolean(empresa?.ativa)

  function mudar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }))
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }))
  }

  async function consultar(valor = cnpj) {
    const digitos = somenteDigitos(valor)
    if (!validarCNPJ(digitos)) {
      setConsulta({ tipo: 'erro', texto: 'CNPJ inválido. Confira os números.' })
      return
    }
    ultimaConsulta.current = digitos
    setConsulta({ tipo: 'consultando' })
    try {
      const resultado = await consultarCnpj(digitos)
      if (ultimaConsulta.current !== digitos) return
      setConsulta({ tipo: 'pronto', dados: resultado })
      mudar('nomeExibicao', resultado.nomeFantasia || resultado.razaoSocial)
    } catch (erro) {
      if (ultimaConsulta.current !== digitos) return
      setConsulta({ tipo: 'erro', texto: erro.message })
    }
  }

  function mudarCnpj(valor) {
    const formatado = formatarCNPJ(valor)
    setCnpj(formatado)
    setMensagem('')
    const digitos = somenteDigitos(formatado)
    if (digitos === ultimaConsulta.current && consulta.tipo !== 'ocioso') return
    ultimaConsulta.current = ''
    setConsulta({ tipo: 'ocioso' })
    if (digitos.length === 14) consultar(digitos)
  }

  async function handleSubmit() {
    setMensagem('')
    if (!podeCadastrar) return setMensagem('Consulte um CNPJ ativo antes de continuar.')
    const novos = validar(dados, social)
    setErros(novos)
    if (Object.keys(novos).length) return setMensagem('Confira os campos destacados.')

    setCarregando(true)
    try {
      const sessao = await cadastrarEmpresa({
        ...dados,
        cnpj: somenteDigitos(cnpj),
        nomeExibicao: dados.nomeExibicao.trim(),
        responsavelNome: dados.responsavelNome.trim(),
        responsavelCargo: dados.responsavelCargo.trim(),
        email: dados.email.trim(),
        ...(social ? { oauth: social.token, senha: undefined, confirmarSenha: undefined } : {}),
      })
      salvarSessao(sessao)
      navigate('/cadastro/concluido', {
        replace: true,
        state: { tipo: 'empresa', nome: sessao.usuario.nome, email: sessao.usuario.email, emailEnviado: sessao.verificacao?.emailEnviado, emailVerificado: sessao.usuario.emailVerificado, destino: destinoAposLogin(sessao) },
      })
    } catch (erro) {
      if (erro.campo) setErros((e) => ({ ...e, [erro.campo]: erro.message }))
      setMensagem(erro.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <TelaAcesso
      etiqueta="Para empresas"
      titulo="Cadastre sua empresa"
      subtitulo="Comece pelo CNPJ: buscamos os dados cadastrais oficiais para você conferir."
      aoEnviar={handleSubmit}
      visual={{
        frase: 'Talentos da tecnologia, perto da sua empresa.',
        itens: ['CNPJ conferido no cadastro oficial', 'Dados da pessoa responsável ficam restritos', 'Senhas guardadas com criptografia'],
      }}
      rodape={
        <>
          <p>
            Já possui uma conta? <LinkAcesso to="/empresa/login">Entrar</LinkAcesso>
          </p>
          <p>
            É candidata? <LinkAcesso to="/cadastro">Crie sua conta de candidata</LinkAcesso>
          </p>
        </>
      }
    >
      {social ? (
        <Aviso tipo="info">
          Você está criando a conta com o {social.provedor} ({social.email}). Complete os dados da empresa. Não é preciso criar senha.
        </Aviso>
      ) : (
        <AcessoSocial tipo="empresa" acao="cadastrar" textoDivisor="ou preencha os dados" />
      )}

      <p className="-mt-1 text-xs text-suave">
        Campos com <span className="text-rosa">*</span> são obrigatórios.
      </p>

      <GrupoCampos indice="1" titulo="Empresa">
        <Campo
          rotulo="CNPJ"
          obrigatorio
          erro={consulta.tipo === 'erro' ? consulta.texto : erros.cnpj}
          ajuda={consulta.tipo === 'consultando' ? 'Consultando o CNPJ…' : undefined}
        >
          {(props) => (
            <div className="flex gap-2">
              <Entrada {...props} value={cnpj} onChange={(event) => mudarCnpj(event.target.value)} placeholder="00.000.000/0000-00" inputMode="numeric" maxLength={18} />
              <Botao
                type="button"
                variante="secundario"
                className="h-12 shrink-0 rounded-xl border-rosa/25 text-vinho-escuro hover:border-rosa/50 hover:bg-blush/40"
                disabled={consulta.tipo === 'consultando'}
                onClick={() => consultar()}
              >
                <Icone nome="busca" tamanho={16} /> Consultar
              </Botao>
            </div>
          )}
        </Campo>

        {empresa && <DadosEmpresa dados={empresa} />}
        {empresa && !empresa.ativa && (
          <Aviso tipo="alerta">A Bloom aceita apenas empresas com CNPJ ativo. Se a situação já foi regularizada, escreva para contato@bloom.com.br.</Aviso>
        )}

        {podeCadastrar && (
          <Campo rotulo="Nome da empresa" obrigatorio erro={erros.nomeExibicao} ajuda="É como as candidatas vão ver sua empresa. Pode ser o nome fantasia ou a marca.">
            {(props) => (
              <Entrada {...props} value={dados.nomeExibicao} onChange={(e) => mudar('nomeExibicao', e.target.value)} maxLength={150} autoComplete="organization" />
            )}
          </Campo>
        )}
      </GrupoCampos>

      {podeCadastrar && (
        <>
          <GrupoCampos indice="2" titulo="Pessoa responsável pelo cadastro">
            <div className="grid gap-5 sm:grid-cols-2">
              <Campo rotulo="Nome completo" obrigatorio erro={erros.responsavelNome}>
                {(props) => (
                  <Entrada {...props} value={dados.responsavelNome} onChange={(e) => mudar('responsavelNome', e.target.value)} maxLength={100} autoComplete="name" />
                )}
              </Campo>
              <Campo rotulo="Cargo" obrigatorio erro={erros.responsavelCargo}>
                {(props) => (
                  <Entrada
                    {...props}
                    value={dados.responsavelCargo}
                    onChange={(e) => mudar('responsavelCargo', e.target.value)}
                    maxLength={80}
                    placeholder="Ex.: Recrutadora"
                    autoComplete="organization-title"
                  />
                )}
              </Campo>
              <Campo rotulo="E-mail corporativo" obrigatorio erro={erros.email} ajuda={social ? `Confirmado pelo ${social.provedor}.` : undefined}>
                {(props) => (
                  <Entrada
                    {...props}
                    type="email"
                    value={dados.email}
                    readOnly={Boolean(social)}
                    onChange={(e) => mudar('email', e.target.value)}
                    placeholder="voce@empresa.com.br"
                    autoComplete="email"
                  />
                )}
              </Campo>
              <Campo rotulo="Telefone comercial" obrigatorio erro={erros.telefone}>
                {(props) => (
                  <Entrada
                    {...props}
                    value={dados.telefone}
                    onChange={(e) => mudar('telefone', formatarTelefone(e.target.value))}
                    placeholder="(00) 0000-0000"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                )}
              </Campo>
            </div>
          </GrupoCampos>

          {!social && (
          <GrupoCampos indice="3" titulo="Segurança">
            <CampoSenha rotulo="Senha" obrigatorio valor={dados.senha} aoMudar={(v) => mudar('senha', v)} autoComplete="new-password" erro={erros.senha} />
            <RequisitosSenha senha={dados.senha} className="-mt-2" />
            <CampoSenha
              rotulo="Confirmar senha"
              obrigatorio
              valor={dados.confirmarSenha}
              aoMudar={(v) => mudar('confirmarSenha', v)}
              placeholder="Digite a senha novamente"
              autoComplete="new-password"
              erro={erros.confirmarSenha}
              ajuda={dados.confirmarSenha && dados.confirmarSenha === dados.senha ? 'As senhas conferem.' : undefined}
            />
          </GrupoCampos>
          )}

          <GrupoCampos indice={social ? '3' : '4'} titulo="Declarações e privacidade">
            <div>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-2xl border bg-white/70 p-4 text-sm leading-relaxed text-tinta-2 transition-colors duration-300',
                  erros.declaraRepresentacao ? 'border-erro/40' : dados.declaraRepresentacao ? 'border-rosa/40 bg-blush/30' : 'border-rosa/15 hover:border-rosa/30'
                )}
              >
                <input
                  type="checkbox"
                  checked={dados.declaraRepresentacao}
                  onChange={(e) => mudar('declaraRepresentacao', e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#9c4a63]"
                />
                <span>
                  Declaro que tenho autorização para representar esta empresa na Bloom. <span className="text-rosa" aria-hidden="true">*</span>
                  <span className="mt-1 block text-xs text-suave">
                    A consulta do CNPJ confirma os dados da empresa, não a sua autorização. A Bloom pode pedir uma comprovação depois.
                  </span>
                </span>
              </label>
              {erros.declaraRepresentacao && <p className="mt-1.5 ml-1 text-xs text-erro">{erros.declaraRepresentacao}</p>}
            </div>
            <Consentimentos tipo="empresa" valores={dados} aoMudar={mudar} erros={erros} />
          </GrupoCampos>
        </>
      )}

      {mensagem && <Aviso tipo="erro">{mensagem}</Aviso>}

      <Botao type="submit" tamanho="lg" className="mt-2 w-full" disabled={carregando || !podeCadastrar}>
        {carregando ? 'Criando conta…' : 'Criar conta da empresa'}
      </Botao>
    </TelaAcesso>
  )
}

export default CadastroEmpresa
