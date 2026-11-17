import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TelaAcesso, { GrupoCampos, LinkAcesso } from '../components/TelaAcesso'
import CampoSenha from '../components/CampoSenha'
import Icone from '../components/Icone'
import Botao from '../components/ui/Botao'
import { Aviso, Campo, Entrada } from '../components/ui/Campo'
import Selo from '../components/ui/Selo'
import { cadastrarEmpresa, consultarCnpj, salvarSessao } from '../services/auth'
import { destinoAposLogin } from '../services/destino'
import { formatarCNPJ, formatarTelefone, somenteDigitos, validarCNPJ } from '../utils/documentos'

function DadosEmpresa({ dados }) {
  const linhas = [
    ['Razão social', dados.razaoSocial],
    ['Nome fantasia', dados.nomeFantasia || 'Não informado'],
    ['Atividade principal (CNAE)', dados.cnaePrincipal ? `${dados.cnaePrincipal.codigo} · ${dados.cnaePrincipal.descricao}` : 'Não informada'],
    ['Município', [dados.municipio, dados.uf].filter(Boolean).join(' / ') || 'Não informado'],
  ]
  return (
    <section aria-label="Dados da empresa" className="rounded-xl border border-linha bg-papel p-4">
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
      <p className="mt-3 text-xs text-suave">Fonte: {dados.fonte}.</p>
    </section>
  )
}

function CadastroEmpresa() {
  const navigate = useNavigate()

  const [cnpj, setCnpj] = useState('')
  const [consulta, setConsulta] = useState({ tipo: 'ocioso' })
  const [nomeExibicao, setNomeExibicao] = useState('')
  const [responsavelNome, setResponsavelNome] = useState('')
  const [responsavelCargo, setResponsavelCargo] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [declaraRepresentacao, setDeclaraRepresentacao] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const ultimaConsulta = useRef('')

  const dados = consulta.tipo === 'pronto' ? consulta.dados : null
  const podeCadastrar = Boolean(dados?.ativa)

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
      setNomeExibicao(resultado.nomeFantasia || resultado.razaoSocial)
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
    if (!responsavelNome.trim() || !email.trim() || !senha || !confirmarSenha) {
      return setMensagem('Preencha todos os campos obrigatórios.')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setMensagem('Digite um e-mail válido.')
    if (senha.length < 8) return setMensagem('A senha deve ter pelo menos 8 caracteres.')
    if (senha !== confirmarSenha) return setMensagem('As senhas não coincidem.')
    if (!declaraRepresentacao) return setMensagem('Confirme que você pode representar esta empresa.')

    setCarregando(true)
    try {
      const sessao = await cadastrarEmpresa({
        cnpj: somenteDigitos(cnpj),
        nomeExibicao: nomeExibicao.trim(),
        responsavelNome: responsavelNome.trim(),
        responsavelCargo: responsavelCargo.trim(),
        email: email.trim(),
        telefone,
        senha,
        confirmarSenha,
        declaraRepresentacao,
      })
      salvarSessao(sessao)
      navigate(destinoAposLogin(sessao))
    } catch (erro) {
      setMensagem(erro.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <TelaAcesso
      etiqueta="Para empregadores"
      titulo="Cadastre sua empresa"
      subtitulo="Informe o CNPJ: buscamos os dados cadastrais para você conferir."
      aoEnviar={handleSubmit}
      visual={{
        ilustracao: 'empresa',
        frase: 'Talentos da tecnologia, perto da sua empresa.',
      }}
      rodape={
        <>
          <p>
            Já possui uma conta? <LinkAcesso to="/empresa/login">Entrar</LinkAcesso>
          </p>
          <p>
            É candidata? <LinkAcesso to="/login">Acesse sua conta</LinkAcesso>
          </p>
        </>
      }
    >
      <GrupoCampos indice="1" titulo="Empresa">
        <Campo
          rotulo="CNPJ"
          erro={consulta.tipo === 'erro' ? consulta.texto : undefined}
          ajuda={consulta.tipo === 'consultando' ? 'Consultando o CNPJ…' : undefined}
        >
          {(props) => (
            <div className="flex gap-2">
              <Entrada
                {...props}
                value={cnpj}
                onChange={(event) => mudarCnpj(event.target.value)}
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
                maxLength={18}
                required
              />
              <Botao type="button" variante="secundario" className="h-11 shrink-0" disabled={consulta.tipo === 'consultando'} onClick={() => consultar()}>
                <Icone nome="busca" tamanho={16} /> Consultar
              </Botao>
            </div>
          )}
        </Campo>

        {dados && <DadosEmpresa dados={dados} />}
        {dados && !dados.ativa && (
          <Aviso tipo="alerta">
            A Bloom aceita apenas empresas com CNPJ ativo. Se a situação já foi regularizada, escreva para contato@bloom.com.br.
          </Aviso>
        )}

        {podeCadastrar && (
          <Campo rotulo="Nome de exibição na Bloom" ajuda="É como as candidatas vão ver sua empresa. Pode ser o nome fantasia ou a marca.">
            {(props) => (
              <Entrada {...props} value={nomeExibicao} onChange={(event) => setNomeExibicao(event.target.value)} maxLength={150} autoComplete="organization" />
            )}
          </Campo>
        )}
      </GrupoCampos>

      {podeCadastrar && (
        <>
          <GrupoCampos indice="2" titulo="Responsável pela conta">
            <div className="grid gap-5 sm:grid-cols-2">
              <Campo rotulo="Nome completo">
                {(props) => (
                  <Entrada {...props} value={responsavelNome} onChange={(event) => setResponsavelNome(event.target.value)} maxLength={100} autoComplete="name" required />
                )}
              </Campo>
              <Campo rotulo="Cargo" opcional>
                {(props) => (
                  <Entrada {...props} value={responsavelCargo} onChange={(event) => setResponsavelCargo(event.target.value)} maxLength={80} placeholder="Ex.: Recrutadora" autoComplete="organization-title" />
                )}
              </Campo>
              <Campo rotulo="E-mail corporativo">
                {(props) => (
                  <Entrada {...props} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@empresa.com.br" autoComplete="email" required />
                )}
              </Campo>
              <Campo rotulo="Telefone corporativo" opcional>
                {(props) => (
                  <Entrada
                    {...props}
                    value={telefone}
                    onChange={(event) => setTelefone(formatarTelefone(event.target.value))}
                    placeholder="(00) 0000-0000"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                )}
              </Campo>
            </div>
          </GrupoCampos>

          <GrupoCampos indice="3" titulo="Segurança">
            <div className="grid gap-5 sm:grid-cols-2">
              <CampoSenha rotulo="Senha" valor={senha} aoMudar={setSenha} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" />
              <CampoSenha
                rotulo="Confirmar senha"
                valor={confirmarSenha}
                aoMudar={setConfirmarSenha}
                placeholder="Digite a senha novamente"
                autoComplete="new-password"
              />
            </div>
          </GrupoCampos>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-linha p-4 text-sm text-tinta-2">
            <input
              type="checkbox"
              checked={declaraRepresentacao}
              onChange={(event) => setDeclaraRepresentacao(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-vinho"
            />
            <span>
              Declaro que tenho autorização para representar esta empresa na Bloom.
              <span className="mt-1 block text-xs text-suave">
                A consulta do CNPJ confirma os dados da empresa, não a sua autorização. A Bloom pode pedir uma comprovação depois.
              </span>
            </span>
          </label>
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
