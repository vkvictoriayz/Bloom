import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import { useRecurso } from '../../components/candidata/useRecurso'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Aviso, Campo, Entrada } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { criarComunidade, DISPONIVEL, listarComunidades } from '../../services/recursos'

// Formulário para criar uma comunidade (quem cria entra como participante).
function NovaComunidade({ aoCancelar }) {
  const navigate = useNavigate()
  const [dados, setDados] = useState({ nome: '', tema: '', descricao: '' })
  const [estado, setEstado] = useState({ tipo: 'ocioso' })
  const campo = (nome) => (e) => setDados((d) => ({ ...d, [nome]: e.target.value }))

  async function enviar(e) {
    e.preventDefault()
    if (dados.nome.trim().length < 3) return setEstado({ tipo: 'erro', texto: 'Dê um nome à comunidade (ao menos 3 letras).' })
    if (dados.tema.trim().length < 2) return setEstado({ tipo: 'erro', texto: 'Informe o tema.' })
    if (dados.descricao.trim().length < 10) return setEstado({ tipo: 'erro', texto: 'Descreva a comunidade (ao menos 10 caracteres).' })
    setEstado({ tipo: 'enviando' })
    try {
      const r = await criarComunidade({ nome: dados.nome.trim(), tema: dados.tema.trim(), descricao: dados.descricao.trim() })
      navigate(`/comunidades/${r.comunidade.id}`)
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="mb-6 flex flex-col gap-4 rounded-xl border border-linha bg-branco p-6">
      <h2 className="font-display text-xl text-tinta">Nova comunidade</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome">
          {(p) => <Entrada {...p} maxLength={80} placeholder="Ex.: Mulheres em Dados" value={dados.nome} onChange={campo('nome')} />}
        </Campo>
        <Campo rotulo="Tema">
          {(p) => <Entrada {...p} maxLength={60} placeholder="Ex.: Ciência de dados" value={dados.tema} onChange={campo('tema')} />}
        </Campo>
      </div>
      <Campo rotulo="Descrição" ajuda={`${dados.descricao.length}/500 · Para quem é e sobre o que vocês vão conversar.`}>
        {(p) => <AreaTexto {...p} rows={3} maxLength={500} value={dados.descricao} onChange={campo('descricao')} />}
      </Campo>
      {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" disabled={estado.tipo === 'enviando'}>
          {estado.tipo === 'enviando' ? 'Criando…' : 'Criar comunidade'}
        </Botao>
        <Botao type="button" variante="fantasma" onClick={aoCancelar}>
          Cancelar
        </Botao>
      </div>
    </form>
  )
}

// Comunidades temáticas (grupos por tema), criadas pelas integrantes.
function Comunidades() {
  const r = useRecurso(DISPONIVEL.comunidades, listarComunidades)
  const [criando, setCriando] = useState(false)

  return (
    <>
      <TituloPagina
        titulo="Comunidades"
        descricao="Grupos de tecnologia por tema, criados pelas integrantes da Bloom."
        acoes={
          !criando && (
            <Botao onClick={() => setCriando(true)}>
              <Icone nome="mais" tamanho={16} /> Criar comunidade
            </Botao>
          )
        }
      />
      {criando && <NovaComunidade aoCancelar={() => setCriando(false)} />}

      {r.estado === 'carregando' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Esqueleto key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      )}
      {r.estado === 'erro' && <Aviso tipo="erro">{r.erro}</Aviso>}
      {r.estado === 'pronto' &&
        (r.dados.comunidades?.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {r.dados.comunidades.map((c) => (
              <li key={c.id} className="flex flex-col rounded-xl border border-linha bg-branco p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-blush text-vinho" aria-hidden="true">
                    <Icone nome="grupo" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-tinta">{c.nome}</h2>
                    <p className="text-xs text-suave">
                      {c.tema} · {c.participantes} {c.participantes === 1 ? 'participante' : 'participantes'}
                    </p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-tinta-2">{c.descricao}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Botao as={Link} to={`/comunidades/${c.id}`} variante="secundario">
                    Ver comunidade
                  </Botao>
                  {c.participando && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-sucesso">
                      <Icone nome="check" tamanho={14} /> {c.minha ? 'Você criou' : 'Você participa'}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          !criando && (
            <Vazio className="bg-branco">
              <VazioTitulo>Nenhuma comunidade ainda</VazioTitulo>
              <VazioDescricao>Crie a primeira: escolha um tema e convide outras integrantes.</VazioDescricao>
            </Vazio>
          )
        ))}
    </>
  )
}

export default Comunidades
