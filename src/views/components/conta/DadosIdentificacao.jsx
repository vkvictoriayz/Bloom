import { useEffect, useState } from 'react'

import Icone from '../Icone'
import Botao from '../ui/Botao'
import { Aviso, Campo, Entrada } from '../ui/Campo'
import Esqueleto from '../ui/Esqueleto'
import { atualizarUsuarioSessao } from '../../services/auth'
import { lerIdentificacao, salvarIdentificacao } from '../../services/recursos'
import { cn } from '../../lib/cn'

const IDENTIDADES = [
  { valor: 'mulher_cis', rotulo: 'Mulher cisgênero' },
  { valor: 'mulher_trans', rotulo: 'Mulher transgênero' },
  { valor: 'nao_informar', rotulo: 'Prefiro não informar' },
]

// Nome civil (somente leitura), nome social e identidade de gênero. Visível só para a própria candidata.
function DadosIdentificacao() {
  const [estado, setEstado] = useState({ tipo: 'carregando' })
  const [nomeSocial, setNomeSocial] = useState('')
  const [identidade, setIdentidade] = useState('nao_informar')
  const [envio, setEnvio] = useState({ tipo: 'ocioso' })

  useEffect(() => {
    let ativo = true
    lerIdentificacao()
      .then((d) => {
        if (!ativo) return
        setEstado({ tipo: 'pronto', dados: d })
        setNomeSocial(d.nomeSocial)
        setIdentidade(d.identidadeGenero)
      })
      .catch((e) => ativo && setEstado({ tipo: 'erro', texto: e.message }))
    return () => {
      ativo = false
    }
  }, [])

  async function salvar(e) {
    e.preventDefault()
    if (nomeSocial.trim() && nomeSocial.trim().length < 2) return setEnvio({ tipo: 'erro', texto: 'O nome social deve ter pelo menos 2 letras.' })
    setEnvio({ tipo: 'enviando' })
    try {
      const r = await salvarIdentificacao({ nomeSocial: nomeSocial.trim(), identidadeGenero: identidade })
      atualizarUsuarioSessao({ nome: r.identificacao.nomeExibido })
      setEstado({ tipo: 'pronto', dados: r.identificacao })
      setEnvio({ tipo: 'sucesso', texto: r.mensagem })
    } catch (erro) {
      setEnvio({ tipo: 'erro', texto: erro.message })
    }
  }

  if (estado.tipo === 'carregando') return <Esqueleto className="h-48" />
  if (estado.tipo === 'erro') return <Aviso tipo="erro">{estado.texto}</Aviso>

  return (
    <form onSubmit={salvar} noValidate className="flex max-w-lg flex-col gap-4">
      <p className="flex items-start gap-2 rounded-xl bg-blush/40 px-3.5 py-3 text-xs leading-relaxed text-tinta-2">
        <Icone nome="cadeado" tamanho={14} className="mt-px shrink-0 text-rosa" />
        Só você vê estes dados. Empresas e outras pessoas veem apenas o nome exibido.
      </p>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-tinta-2">Nome civil</span>
        <p className="rounded-md border border-linha bg-papel-2 px-3.5 py-2.5 text-sm text-tinta">{estado.dados.nomeCivil}</p>
        <p className="text-xs text-suave">Ligado à verificação do CPF. Para corrigir, escreva para contato@bloom.com.br.</p>
      </div>

      <Campo rotulo="Nome social" opcional ajuda={`Nome exibido agora: ${estado.dados.nomeExibido}. Deixe em branco para usar o nome civil.`}>
        {(props) => <Entrada {...props} value={nomeSocial} maxLength={100} onChange={(e) => setNomeSocial(e.target.value)} />}
      </Campo>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-tinta-2">Identidade de gênero</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {IDENTIDADES.map((op) => {
            const marcado = identidade === op.valor
            return (
              <label
                key={op.valor}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                  marcado ? 'border-rosa bg-blush/50 font-semibold text-vinho-escuro' : 'border-linha bg-branco text-tinta-2 hover:border-rosa/40'
                )}
              >
                <input
                  type="radio"
                  name="identidade-configuracoes"
                  value={op.valor}
                  checked={marcado}
                  onChange={() => setIdentidade(op.valor)}
                  className="size-4 shrink-0 accent-[#9c4a63]"
                />
                {op.rotulo}
              </label>
            )
          })}
        </div>
      </fieldset>

      {(envio.tipo === 'erro' || envio.tipo === 'sucesso') && <Aviso tipo={envio.tipo}>{envio.texto}</Aviso>}
      <Botao type="submit" variante="secundario" className="self-start" disabled={envio.tipo === 'enviando'}>
        {envio.tipo === 'enviando' ? 'Salvando…' : 'Salvar identificação'}
      </Botao>
    </form>
  )
}

export default DadosIdentificacao
