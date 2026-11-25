import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

import Icone from '../Icone'
import Avatar from '../comunidade/Avatar'
import { Aviso } from '../ui/Campo'
import { lerPerfis } from '../../services/comunidade'
import { abrirConversaCandidata, enviarMensagem, enviarMensagemCandidata, listarConversas, listarConversasCandidatas } from '../../services/recursos'
import { cn } from '../../lib/cn'

function useDestinos(daEmpresa) {
  const [destinos, setDestinos] = useState(null)
  const [erro, setErro] = useState('')
  useEffect(() => {
    let ativo = true
    Promise.all([daEmpresa ? Promise.resolve({ conversas: [] }) : listarConversasCandidatas(), listarConversas()])
      .then(([diretas, empresas]) => {
        if (!ativo) return
        setDestinos([
          ...(diretas.conversas ?? []).filter((c) => !c.bloqueada).map((c) => ({ chave: `d${c.id}`, tipo: 'direta', id: c.id, nome: c.participante.nome, foto: c.participante.foto, detalhe: 'Conversa entre integrantes', pessoaId: c.participante.id })),
          ...(empresas.conversas ?? []).map((c) => ({ chave: `c${c.id}`, tipo: 'empresa', id: c.id, nome: c.participante.nome, foto: c.participante.foto, detalhe: c.vaga ? `Vaga: ${c.vaga}` : 'Processo seletivo' })),
        ])
      })
      .catch((e) => ativo && setErro(e.message))
    return () => {
      ativo = false
    }
  }, [daEmpresa])
  return [destinos, erro]
}

function EnviarPublicacao({ referencia, previa, daEmpresa = false, aoFechar }) {
  const [destinos, erroLista] = useDestinos(daEmpresa)
  const [busca, setBusca] = useState('')
  const [nota, setNota] = useState('')
  const [estados, setEstados] = useState({})
  const [pessoas, setPessoas] = useState([])
  const caixa = useRef(null)
  const base = daEmpresa ? '/empresa/mensagens' : '/candidata/mensagens'

  useEffect(() => {
    const anterior = document.activeElement
    caixa.current?.querySelector('input')?.focus()
    const tecla = (e) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', tecla)
    const rolagem = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', tecla)
      document.body.style.overflow = rolagem
      anterior?.focus?.()
    }
  }, [aoFechar])

  const termo = busca.trim()
  useEffect(() => {
    if (daEmpresa || termo.length < 2) return undefined
    let ativo = true
    const espera = setTimeout(() => {
      lerPerfis({ busca: termo })
        .then((r) => ativo && setPessoas((r.perfis ?? []).slice(0, 6)))
        .catch(() => ativo && setPessoas([]))
    }, 300)
    return () => {
      ativo = false
      clearTimeout(espera)
    }
  }, [daEmpresa, termo])

  async function enviar(destino) {
    setEstados((s) => ({ ...s, [destino.chave]: { tipo: 'enviando' } }))
    try {
      let alvo = destino
      if (destino.tipo === 'nova') {
        const r = await abrirConversaCandidata(destino.pessoaId)
        alvo = { ...destino, tipo: 'direta', id: r.conversa.id }
      }
      const corpo = { publicacao: referencia, ...(nota.trim() ? { texto: nota.trim() } : {}) }
      if (alvo.tipo === 'direta') await enviarMensagemCandidata(alvo.id, corpo)
      else await enviarMensagem(alvo.id, corpo)
      setEstados((s) => ({ ...s, [destino.chave]: { tipo: 'enviada', link: alvo.tipo === 'direta' ? `${base}/candidatas/${alvo.id}` : `${base}/${alvo.id}` } }))
    } catch (e) {
      setEstados((s) => ({ ...s, [destino.chave]: { tipo: 'erro', texto: e.message } }))
    }
  }

  const alvo = termo.toLowerCase()
  const filtrados = (destinos ?? []).filter((d) => !alvo || d.nome.toLowerCase().includes(alvo) || d.detalhe.toLowerCase().includes(alvo))
  const jaListadas = new Set((destinos ?? []).filter((d) => d.tipo === 'direta').map((d) => d.pessoaId))
  const novas = pessoas.filter((p) => !jaListadas.has(p.id)).map((p) => ({ chave: `n${p.id}`, tipo: 'nova', pessoaId: p.id, nome: p.nome, foto: p.foto, detalhe: p.area || 'Integrante da Bloom' }))
  const enviadas = Object.values(estados).filter((e) => e.tipo === 'enviada').length

  const linha = (d) => {
    const estado = estados[d.chave]
    return (
      <li key={d.chave} className="flex items-center gap-3 px-5 py-2.5">
        <Avatar nome={d.nome} foto={d.foto} tamanho="md" className={d.tipo === 'empresa' && daEmpresa === false ? 'rounded-xl' : undefined} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-tinta">{d.nome}</span>
          <span className={cn('block truncate text-xs', estado?.tipo === 'erro' ? 'text-erro' : 'text-suave')}>{estado?.tipo === 'erro' ? estado.texto : d.detalhe}</span>
        </span>
        {estado?.tipo === 'enviada' ? (
          <Link to={estado.link} onClick={aoFechar} className="inline-flex animate-[surgir_.3s_ease-out] items-center gap-1 rounded-full bg-sucesso-claro px-3 py-1.5 text-xs font-bold text-sucesso">
            <Icone nome="check" tamanho={13} /> Enviada
          </Link>
        ) : (
          <button
            type="button"
            disabled={estado?.tipo === 'enviando'}
            onClick={() => enviar(d)}
            className="inline-flex items-center gap-1 rounded-full bg-vinho px-3.5 py-1.5 text-xs font-bold text-white transition-transform hover:bg-vinho-escuro active:scale-95 disabled:opacity-60"
          >
            {estado?.tipo === 'enviando' ? 'Enviando…' : 'Enviar'}
          </button>
        )}
      </li>
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-tinta/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-enviar-publicacao"
        className="flex max-h-[88dvh] w-full max-w-md animate-[subirModal_.28s_cubic-bezier(.2,.8,.2,1)] flex-col overflow-hidden rounded-t-3xl bg-branco shadow-2xl sm:rounded-3xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-linha px-5 py-4">
          <h2 id="titulo-enviar-publicacao" className="font-display text-xl text-tinta">
            Enviar pela Bloom
          </h2>
          <button type="button" onClick={aoFechar} className="grid size-9 place-items-center rounded-full text-tinta-2 hover:bg-papel-2" aria-label="Fechar">
            <Icone nome="fechar" tamanho={18} />
          </button>
        </header>

        {previa && (
          <div className="mx-5 mt-4 flex gap-3 rounded-2xl border border-linha bg-papel p-3">
            <span className="w-1 shrink-0 rounded-full bg-vinho" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold text-vinho">{previa.autor}</span>
              <span className="line-clamp-2 text-sm text-tinta-2">{previa.texto || 'Publicação com imagem'}</span>
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2 px-5 pt-4">
          <div className="relative">
            <Icone nome="busca" tamanho={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-suave" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={daEmpresa ? 'Buscar conversa' : 'Buscar conversa ou pessoa'}
              aria-label="Buscar destinatário"
              className="h-10 w-full rounded-full border border-linha bg-papel-2 pr-4 pl-10 text-sm text-tinta placeholder:text-suave focus:border-vinho focus:bg-branco focus:ring-[3px] focus:ring-vinho/20 focus:outline-none"
            />
          </div>
          <input
            type="text"
            value={nota}
            maxLength={300}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Escreva algo junto (opcional)"
            aria-label="Mensagem junto da publicação"
            className="h-10 w-full rounded-full border border-linha bg-branco px-4 text-sm text-tinta placeholder:text-suave focus:border-vinho focus:ring-[3px] focus:ring-vinho/20 focus:outline-none"
          />
        </div>

        {erroLista && (
          <Aviso tipo="erro" className="mx-5 mt-3">
            {erroLista}
          </Aviso>
        )}

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto pb-3">
          {destinos === null && !erroLista ? (
            <p className="px-5 py-4 text-sm text-suave">Carregando conversas…</p>
          ) : (
            <>
              <p className="px-5 pt-1 pb-1 text-[11px] font-bold tracking-[0.12em] text-suave uppercase">Suas conversas</p>
              {filtrados.length === 0 ? (
                <p className="px-5 py-2 text-sm text-suave">{termo ? 'Nenhuma conversa com esse nome.' : daEmpresa ? 'Você ainda não tem conversas. Elas começam pela página de uma candidatura.' : 'Você ainda não tem conversas.'}</p>
              ) : (
                <ul>{filtrados.map(linha)}</ul>
              )}
              {!daEmpresa && termo.length >= 2 && novas.length > 0 && (
                <>
                  <p className="px-5 pt-3 pb-1 text-[11px] font-bold tracking-[0.12em] text-suave uppercase">Outras pessoas na Bloom</p>
                  <ul>{novas.map(linha)}</ul>
                </>
              )}
            </>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-linha px-5 py-3 text-sm">
          <span className="text-suave">{enviadas ? `Enviada para ${enviadas} ${enviadas === 1 ? 'conversa' : 'conversas'}` : 'A publicação chega como um cartão na conversa.'}</span>
          <button type="button" onClick={aoFechar} className="rounded-full px-4 py-2 font-semibold text-vinho hover:bg-blush">
            Concluir
          </button>
        </footer>
      </div>
    </div>,
    document.body
  )
}

export default EnviarPublicacao
