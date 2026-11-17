import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import CampoSenha from '../../components/CampoSenha'
import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import Botao from '../../components/ui/Botao'
import { Aviso, Campo, Entrada } from '../../components/ui/Campo'
import Selo from '../../components/ui/Selo'
import { ativarDuasEtapas, atualizarSessaoAdmin, desativarDuasEtapas, gerarNovosCodigos, iniciarDuasEtapas, lerMeuAdmin, alterarSenhaAdmin } from '../../services/admin'

function CampoCodigo({ valor, aoMudar, rotulo = 'Código do app (ou de recuperação)' }) {
  return (
    <Campo rotulo={rotulo}>
      {(p) => <Entrada {...p} value={valor} onChange={(e) => aoMudar(e.target.value)} autoComplete="one-time-code" maxLength={9} className="max-w-48 tracking-[0.2em] tabular-nums" />}
    </Campo>
  )
}

// Códigos de recuperação: mostrados uma vez só.
function CodigosRecuperacao({ codigos, aoFechar }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigos.join('\n'))
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }
  return (
    <div className="rounded-xl border border-alerta/40 bg-alerta-claro p-4">
      <p className="font-semibold text-tinta">Guarde estes códigos de recuperação agora</p>
      <p className="mt-1 text-sm text-tinta-2">Cada um entra uma vez no lugar do código do app, se você perder o celular. Eles não aparecem de novo.</p>
      <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-4">
        {codigos.map((c) => (
          <li key={c} className="rounded-md bg-branco px-2 py-1.5 text-center text-tinta select-all">
            {c}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <Botao tamanho="sm" variante="secundario" onClick={copiar}>
          {copiado ? 'Copiados' : 'Copiar códigos'}
        </Botao>
        <Botao tamanho="sm" onClick={aoFechar}>
          Já guardei
        </Botao>
      </div>
    </div>
  )
}

function DuasEtapas({ admin, aoMudar }) {
  const [etapa, setEtapa] = useState(null) // null | 'senha' | 'app' | 'desligar' | 'novos'
  const [senha, setSenha] = useState('')
  const [codigo, setCodigo] = useState('')
  const [config, setConfig] = useState(null)
  const [codigos, setCodigos] = useState(null)
  const [estado, setEstado] = useState(null)

  const limpar = () => {
    setSenha('')
    setCodigo('')
    setEstado(null)
  }
  async function executar(acao) {
    setEstado({ tipo: 'enviando' })
    try {
      await acao()
    } catch (e) {
      setEstado({ tipo: 'erro', texto: e.message })
    }
  }

  const iniciar = () =>
    executar(async () => {
      setConfig(await iniciarDuasEtapas(senha))
      limpar()
      setEtapa('app')
    })
  const ativar = () =>
    executar(async () => {
      const r = await ativarDuasEtapas(codigo.trim())
      setCodigos(r.codigosRecuperacao)
      setConfig(null)
      limpar()
      setEtapa(null)
      atualizarSessaoAdmin({ doisFatores: true })
      aoMudar()
    })
  const desligar = () =>
    executar(async () => {
      await desativarDuasEtapas(senha, codigo.trim())
      limpar()
      setEtapa(null)
      atualizarSessaoAdmin({ doisFatores: false })
      aoMudar()
    })
  const novos = () =>
    executar(async () => {
      const r = await gerarNovosCodigos(senha, codigo.trim())
      setCodigos(r.codigosRecuperacao)
      limpar()
      setEtapa(null)
    })

  const chaveEmGrupos = config?.segredo.match(/.{1,4}/g)?.join(' ')

  return (
    <section className="flex max-w-2xl flex-col gap-4 rounded-xl border border-linha bg-branco p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl text-tinta">Verificação em duas etapas</h2>
        {admin.doisFatores ? <Selo variante="sucesso">Ligada</Selo> : <Selo variante="alerta">Desligada</Selo>}
      </div>
      <p className="text-sm text-tinta-2">
        Além da senha, o painel pede um código de 6 dígitos que muda a cada 30 segundos, gerado por um app no seu celular (Google Authenticator, Microsoft Authenticator ou outro). Recomendado para toda a equipe.
      </p>

      {codigos && <CodigosRecuperacao codigos={codigos} aoFechar={() => setCodigos(null)} />}

      {!admin.doisFatores && etapa === null && (
        <Botao className="self-start" onClick={() => setEtapa('senha')}>
          Ligar a verificação em duas etapas
        </Botao>
      )}

      {etapa === 'senha' && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            iniciar()
          }}
        >
          <CampoSenha rotulo="Confirme sua senha" valor={senha} aoMudar={setSenha} autoComplete="current-password" />
          <div className="flex gap-2">
            <Botao type="submit" tamanho="sm" disabled={estado?.tipo === 'enviando'}>
              Continuar
            </Botao>
            <Botao type="button" tamanho="sm" variante="fantasma" onClick={() => setEtapa(null)}>
              Cancelar
            </Botao>
          </div>
        </form>
      )}

      {etapa === 'app' && config && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            ativar()
          }}
        >
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-tinta-2">
            <li>No app autenticador, toque em adicionar conta e escolha digitar uma chave de configuração.</li>
            <li>
              Nome da conta: <strong className="text-tinta">Bloom Admin</strong>. Chave (tipo “baseada em tempo”):
              <code className="mt-1 block w-fit rounded-md bg-papel-2 px-3 py-2 font-mono text-base tracking-wider break-all text-tinta select-all">{chaveEmGrupos}</code>
            </li>
            <li>
              No celular, também dá para abrir{' '}
              <a href={config.endereco} className="font-semibold text-vinho underline underline-offset-4">
                este link
              </a>{' '}
              direto no app.
            </li>
            <li>Digite abaixo o código de 6 dígitos que o app mostrar.</li>
          </ol>
          <CampoCodigo valor={codigo} aoMudar={setCodigo} rotulo="Código do app" />
          <div className="flex gap-2">
            <Botao type="submit" tamanho="sm" disabled={estado?.tipo === 'enviando'}>
              Confirmar e ligar
            </Botao>
            <Botao type="button" tamanho="sm" variante="fantasma" onClick={() => setEtapa(null)}>
              Cancelar
            </Botao>
          </div>
        </form>
      )}

      {admin.doisFatores && etapa === null && (
        <div className="flex flex-wrap gap-2">
          <Botao tamanho="sm" variante="secundario" onClick={() => setEtapa('novos')}>
            Gerar novos códigos de recuperação
          </Botao>
          <Botao tamanho="sm" variante="fantasma" className="text-erro" onClick={() => setEtapa('desligar')}>
            Desligar
          </Botao>
        </div>
      )}

      {(etapa === 'desligar' || etapa === 'novos') && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (etapa === 'desligar') desligar()
            else novos()
          }}
        >
          <CampoSenha rotulo="Sua senha" valor={senha} aoMudar={setSenha} autoComplete="current-password" />
          <CampoCodigo valor={codigo} aoMudar={setCodigo} />
          <div className="flex gap-2">
            <Botao type="submit" tamanho="sm" className={etapa === 'desligar' ? 'bg-erro hover:bg-erro/90' : undefined} disabled={estado?.tipo === 'enviando'}>
              {etapa === 'desligar' ? 'Desligar' : 'Gerar códigos'}
            </Botao>
            <Botao type="button" tamanho="sm" variante="fantasma" onClick={() => setEtapa(null)}>
              Cancelar
            </Botao>
          </div>
        </form>
      )}

      {estado?.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
    </section>
  )
}

function TrocarSenha({ obrigatoria, aoTrocar }) {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [estado, setEstado] = useState({ tipo: 'ocioso' })

  async function enviar(e) {
    e.preventDefault()
    if (novaSenha.length < 10) return setEstado({ tipo: 'erro', texto: 'A nova senha precisa ter pelo menos 10 caracteres.' })
    if (novaSenha !== confirmarSenha) return setEstado({ tipo: 'erro', texto: 'As senhas novas não são iguais.' })
    setEstado({ tipo: 'enviando' })
    try {
      const r = await alterarSenhaAdmin({ senhaAtual, novaSenha, confirmarSenha })
      setEstado({ tipo: 'sucesso', texto: r.mensagem })
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
      aoTrocar()
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex max-w-md flex-col gap-4 rounded-xl border border-linha bg-branco p-6">
      <h2 className="font-display text-xl text-tinta">{obrigatoria ? 'Crie a sua senha' : 'Trocar senha'}</h2>
      {obrigatoria && <Aviso tipo="info">Sua conta foi criada com uma senha inicial. Troque por uma só sua para liberar o painel.</Aviso>}
      <CampoSenha rotulo={obrigatoria ? 'Senha inicial' : 'Senha atual'} valor={senhaAtual} aoMudar={setSenhaAtual} autoComplete="current-password" />
      <CampoSenha rotulo="Nova senha" valor={novaSenha} aoMudar={setNovaSenha} placeholder="Mínimo de 10 caracteres" autoComplete="new-password" />
      <CampoSenha rotulo="Confirme a nova senha" valor={confirmarSenha} aoMudar={setConfirmarSenha} autoComplete="new-password" />
      {(estado.tipo === 'erro' || estado.tipo === 'sucesso') && <Aviso tipo={estado.tipo}>{estado.texto}</Aviso>}
      <Botao type="submit" variante={obrigatoria ? 'primario' : 'secundario'} className="self-start" disabled={estado.tipo === 'enviando'}>
        {estado.tipo === 'enviando' ? 'Salvando…' : obrigatoria ? 'Salvar e entrar no painel' : 'Trocar senha'}
      </Botao>
    </form>
  )
}

function MinhaConta() {
  const navigate = useNavigate()
  const r = useCarregar(lerMeuAdmin)
  if (r.tipo === 'carregando') return <Carregando quantidade={2} altura="h-40" />
  if (r.tipo === 'erro') return <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />
  const a = r.dados
  const obrigatoria = a.deveTrocarSenha

  return (
    <>
      <TituloPagina titulo="Minha conta" descricao={`${a.nome} · ${a.usuario} · ${a.nivel === 'super' ? 'acesso total' : 'moderação'}`} />
      <div className="flex flex-col gap-6">
        <TrocarSenha
          obrigatoria={obrigatoria}
          aoTrocar={() => {
            atualizarSessaoAdmin({ deveTrocarSenha: false })
            if (obrigatoria) navigate('/admin', { replace: true })
          }}
        />
        {!obrigatoria && <DuasEtapas admin={a} aoMudar={r.recarregar} />}
      </div>
    </>
  )
}

export default MinhaConta
