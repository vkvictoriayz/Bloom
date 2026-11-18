import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import Icone from '../../components/Icone'
import Avatar from '../../components/comunidade/Avatar'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import LateralEmpresa, { CartaoEmpresa } from '../../components/empresa/LateralEmpresa'
import PublicacaoEmpresa from '../../components/empresa/PublicacaoEmpresa'
import { useCarregar } from '../../components/empresa/useCarregar'
import { IlustracaoConexoes } from '../../components/ilustracoes/Ilustracoes'
import Botao from '../../components/ui/Botao'
import { ICONE_TIPO } from '../../components/comunidade/tipos'
import { Aviso } from '../../components/ui/Campo'
import { Vazio, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { criarPublicacaoEmpresa, fotoEmpresa, lerFeedEmpresa } from '../../services/empresa'
import { LIMITE_PUBLICACAO, TIPOS } from '../../services/comunidade'
import { cn } from '../../lib/cn'

const MODELOS = {
  oportunidade: 'Divulgue um processo seletivo, programa de estágio ou vaga…',
  dica: 'Compartilhe uma dica para quem está participando dos seus processos…',
  conquista: 'Conte uma conquista do time ou da empresa…',
  projeto: 'Mostre um projeto, iniciativa ou evento da empresa…',
  duvida: 'Pergunte algo para a comunidade…',
  experiencia: 'Conte uma experiência da sua empresa com diversidade em tecnologia…',
}

function Compositor({ dados, aoPublicar }) {
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('oportunidade')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [publicado, setPublicado] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)
    setErro('')
    setPublicado(false)
    try {
      const r = await criarPublicacaoEmpresa({ texto, tipo })
      aoPublicar({
        ...r.publicacao,
        id: `e${r.publicacao.id}`,
        origem: 'empresa',
        minha: true,
        autor: { id: dados?.empresa.id, nome: dados?.empresa.nome ?? 'Sua empresa', detalhe: 'Empresa', foto: fotoEmpresa(dados) },
      })
      setTexto('')
      setPublicado(true)
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-linha bg-branco p-5 sm:p-6" aria-label="Nova publicação">
      <p className="mb-3 text-sm font-semibold text-tinta-2">O que a {dados?.empresa.nome ?? 'sua empresa'} quer compartilhar hoje?</p>
      <div className="flex gap-4">
        <Avatar nome={dados?.empresa.nome} foto={fotoEmpresa(dados)} tamanho="lg" className="rounded-2xl max-sm:size-12 max-sm:text-base" />
        <div className="min-w-0 flex-1">
          <label htmlFor="nova-publicacao-empresa" className="sr-only">
            Escreva sua publicação
          </label>
          <textarea
            id="nova-publicacao-empresa"
            value={texto}
            rows={texto ? 4 : 2}
            onChange={(e) => {
              setTexto(e.target.value)
              setPublicado(false)
            }}
            maxLength={LIMITE_PUBLICACAO}
            placeholder={MODELOS[tipo]}
            className="w-full resize-none rounded-xl border border-transparent bg-papel-2 px-4 py-3 text-[15px] leading-relaxed text-tinta placeholder:text-suave transition-colors hover:border-linha-forte focus:border-vinho focus:bg-branco focus:ring-[3px] focus:ring-vinho/20 focus:outline-none"
          />
        </div>
      </div>
      <div className="mt-4 sm:pl-[80px]">
        <div role="radiogroup" aria-label="Tipo de publicação" className="-mx-1 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={tipo === t.id}
              onClick={() => setTipo(t.id)}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors',
                tipo === t.id ? 'bg-blush text-vinho' : 'text-tinta-2 hover:bg-papel-2 hover:text-tinta'
              )}
            >
              <Icone nome={ICONE_TIPO[t.id]} tamanho={16} />
              {t.rotulo}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-3 border-t border-linha pt-3">
          {publicado && (
            <span className="mr-auto inline-flex items-center gap-1 text-sm font-semibold text-sucesso" role="status">
              <Icone nome="check" tamanho={16} /> Publicado
            </span>
          )}
          <span className="text-xs text-suave tabular-nums" aria-live="polite">
            {texto.length}/{LIMITE_PUBLICACAO}
          </span>
          <Botao type="submit" disabled={!texto.trim() || enviando}>
            {enviando ? 'Publicando…' : 'Publicar'}
          </Botao>
        </div>
        {erro && (
          <Aviso tipo="erro" className="mt-3">
            {erro}
          </Aviso>
        )}
      </div>
    </form>
  )
}

const ORIGENS = [
  { id: '', rotulo: 'Tudo' },
  { id: 'integrante', rotulo: 'Integrantes' },
  { id: 'empresa', rotulo: 'Empresas' },
]

function Feed() {
  const { perfil: dados } = useOutletContext()
  const [pagina, setPagina] = useState(1)
  const [lista, setLista] = useState([])
  const [origem, setOrigem] = useState('')
  const [tipo, setTipo] = useState('')
  const r = useCarregar(() => lerFeedEmpresa(pagina), [pagina])

  useEffect(() => {
    document.title = 'Feed · BLOOM'
  }, [])

  const pronto = r.tipo === 'pronto' ? r.dados : null
  useEffect(() => {
    if (!pronto) return
    setLista((atual) => (pagina === 1 ? pronto.publicacoes : [...atual, ...pronto.publicacoes.filter((p) => !atual.some((a) => a.id === p.id))]))
  }, [pronto, pagina])

  const visiveis = lista.filter((p) => (!origem || p.origem === origem) && (!tipo || p.tipo === tipo))
  const chip = (ativo) =>
    cn(
      'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors',
      ativo ? 'bg-vinho text-white' : 'bg-branco text-tinta-2 ring-1 ring-linha hover:bg-blush hover:text-vinho'
    )

  return (
    <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
      <div className="flex min-w-0 flex-col gap-5">
        <h1 className="sr-only">Feed da empresa</h1>
        <div className="lg:hidden">
          <CartaoEmpresa dados={dados} />
        </div>

        <Compositor dados={dados} aoPublicar={(p) => setLista((l) => [p, ...l])} />

        <div className="flex flex-col gap-2">
          <div role="group" aria-label="Filtrar por autoria" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {ORIGENS.map((o) => (
              <button key={o.id} type="button" aria-pressed={origem === o.id} onClick={() => setOrigem(o.id)} className={chip(origem === o.id)}>
                {o.rotulo}
              </button>
            ))}
            <span aria-hidden="true" className="mx-1 w-px shrink-0 self-stretch bg-linha" />
            {TIPOS.map((t) => (
              <button key={t.id} type="button" aria-pressed={tipo === t.id} onClick={() => setTipo((v) => (v === t.id ? '' : t.id))} className={chip(tipo === t.id)}>
                <Icone nome={ICONE_TIPO[t.id]} tamanho={15} /> {t.rotulo}
              </button>
            ))}
          </div>
        </div>

        {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
        {r.tipo === 'carregando' && lista.length === 0 && <Carregando quantidade={2} altura="h-40" />}
        {r.tipo === 'pronto' && visiveis.length === 0 && (
          <Vazio className="bg-branco">
            <IlustracaoConexoes className="max-w-[220px]" />
            <VazioTitulo>{lista.length ? 'Nada com esse filtro' : 'Ainda não há publicações'}</VazioTitulo>
            <VazioDescricao>{lista.length ? 'Tente outro tipo de publicação ou volte para Tudo.' : 'Quando integrantes e empresas publicarem, os conteúdos aparecem aqui.'}</VazioDescricao>
          </Vazio>
        )}
        {visiveis.map((p) => (
          <PublicacaoEmpresa key={p.id} publicacao={{ ...p, id: p.origem === 'empresa' ? Number(String(p.id).slice(1)) : p.id }} gerenciavel={p.minha} aoExcluir={() => setLista((l) => l.filter((x) => x.id !== p.id))} />
        ))}
        {r.tipo === 'pronto' && r.dados.temMais && (
          <Botao variante="secundario" className="self-center" onClick={() => setPagina((v) => v + 1)}>
            Ver mais publicações
          </Botao>
        )}
      </div>
      <LateralEmpresa dados={dados} />
    </div>
  )
}

export default Feed
