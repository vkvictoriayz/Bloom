import { useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { AcaoComMotivo, BotaoRelatorio, Filtros, Paginacao } from '../../components/admin/Comuns'
import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Aviso } from '../../components/ui/Campo'
import Selo from '../../components/ui/Selo'
import { dataHora, decidirDenuncia, ehSuper, listarDenuncias, moderarVaga, removerComentarioAdmin, removerComunidadeAdmin, removerPublicacaoAdmin } from '../../services/admin'

const TIPOS = {
  publicacao: 'Publicação',
  publicacao_empresa: 'Publicação de empresa',
  comentario: 'Comentário',
  perfil: 'Perfil de candidata',
  empresa: 'Empresa',
  vaga: 'Vaga',
  comunidade: 'Comunidade',
}

const linkConta = (dono) => (dono?.tipo === 'empresa' ? `/admin/empresas/${dono.id}` : `/admin/candidatas/${dono?.id}`)

// Ação que resolve o problema direto da fila (remove, encerra ou leva à conta).
// Remover pelo painel já fecha as denúncias do alvo e avisa quem denunciou.
function AcaoNoAlvo({ alvo, aoConcluir }) {
  if (alvo.removido) return <p className="text-sm text-suave">O conteúdo já foi removido. Feche a denúncia como resolvida.</p>
  switch (alvo.tipo) {
    case 'publicacao':
    case 'publicacao_empresa':
      return <AcaoComMotivo rotulo="Remover publicação" rotuloConfirmar="Remover" aoConfirmar={(m) => removerPublicacaoAdmin(alvo.tipo === 'publicacao' ? 'candidata' : 'empresa', alvo.id, m)} aoConcluir={aoConcluir} />
    case 'comentario':
      return <AcaoComMotivo rotulo="Remover comentário" rotuloConfirmar="Remover" aoConfirmar={(m) => removerComentarioAdmin(alvo.id, m)} aoConcluir={aoConcluir} />
    case 'comunidade':
      return <AcaoComMotivo rotulo="Remover comunidade" rotuloConfirmar="Remover" aoConfirmar={(m) => removerComunidadeAdmin(alvo.id, m)} aoConcluir={aoConcluir} />
    case 'vaga':
      return alvo.status === 'Aberta' || alvo.status === 'Pausada' ? (
        <AcaoComMotivo rotulo="Encerrar vaga" rotuloConfirmar="Encerrar" aoConfirmar={(m) => moderarVaga(alvo.id, 'Encerrada', m)} aoConcluir={aoConcluir} />
      ) : (
        <p className="text-sm text-suave">A vaga já está {alvo.status?.toLowerCase()}.</p>
      )
    default:
      return (
        <Botao as={Link} to={linkConta(alvo.dono)} tamanho="sm" variante="secundario">
          {alvo.suspensa ? 'Ver conta (já suspensa)' : 'Abrir a conta para suspender'}
        </Botao>
      )
  }
}

function Decidir({ denuncia, aoConcluir }) {
  const id = useId()
  const [decisao, setDecisao] = useState(null)
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState(null)

  async function confirmar(e) {
    e.preventDefault()
    if (texto.trim().length < 5) return setEstado({ tipo: 'erro', texto: 'Explique a decisão (pelo menos 5 caracteres).' })
    setEstado({ tipo: 'enviando' })
    try {
      await decidirDenuncia(denuncia.id, decisao, texto.trim())
      aoConcluir()
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  if (!decisao) {
    return (
      <div className="flex flex-wrap gap-2">
        <Botao tamanho="sm" variante="secundario" onClick={() => setDecisao('resolvida')}>
          Marcar como resolvida
        </Botao>
        <Botao tamanho="sm" variante="fantasma" onClick={() => setDecisao('descartada')}>
          Descartar (sem violação)
        </Botao>
      </div>
    )
  }
  return (
    <form onSubmit={confirmar} className="flex w-full flex-col gap-2 rounded-xl border border-linha bg-papel p-3">
      <label htmlFor={id} className="text-sm font-semibold text-tinta-2">
        {decisao === 'resolvida' ? 'O que foi feito?' : 'Por que não há violação?'}
      </label>
      <AreaTexto id={id} rows={2} maxLength={300} value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus />
      <p className="text-xs text-suave">
        Fecha {denuncia.denunciasAbertasNoAlvo > 1 ? `as ${denuncia.denunciasAbertasNoAlvo} denúncias abertas` : 'a denúncia'} sobre este item e avisa quem denunciou (sem mostrar este texto).
      </p>
      {estado?.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" tamanho="sm" disabled={estado?.tipo === 'enviando'}>
          {estado?.tipo === 'enviando' ? 'Salvando…' : decisao === 'resolvida' ? 'Resolver' : 'Descartar'}
        </Botao>
        <Botao type="button" tamanho="sm" variante="fantasma" onClick={() => setDecisao(null)}>
          Cancelar
        </Botao>
      </div>
    </form>
  )
}

function Denuncias() {
  const [p, setP] = useSearchParams()
  const status = ['resolvida', 'descartada'].includes(p.get('status')) ? p.get('status') : 'aberta'
  const pagina = Number(p.get('pagina')) || 1
  const r = useCarregar(() => listarDenuncias({ status, pagina }), [status, pagina])

  return (
    <>
      <TituloPagina
        titulo="Denúncias"
        descricao="O que candidatas e empresas denunciaram. As mais antigas primeiro. Quem foi denunciado não sabe quem denunciou."
        acoes={ehSuper() && <BotaoRelatorio recurso="denuncias" />}
      />
      <div className="mb-4">
        <Filtros
          opcoes={[
            ['aberta', 'Abertas'],
            ['resolvida', 'Resolvidas'],
            ['descartada', 'Descartadas'],
          ]}
          valor={status}
          aoMudar={(v) => setP(v === 'aberta' ? {} : { status: v }, { replace: true })}
          rotulo="Situação da denúncia"
        />
      </div>
      {r.tipo === 'carregando' && <Carregando quantidade={3} altura="h-32" />}
      {r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {r.tipo === 'pronto' &&
        (r.dados.denuncias.length === 0 ? (
          <p className="rounded-xl border border-dashed border-linha-forte bg-branco px-5 py-6 text-sm text-suave">
            {status === 'aberta' ? 'Nenhuma denúncia aberta. Tudo em dia.' : 'Nenhuma denúncia aqui.'}
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {r.dados.denuncias.map((d) => (
                <li key={d.id} className="rounded-xl border border-linha bg-branco p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Selo variante="vinho">{TIPOS[d.alvo.tipo] ?? d.alvo.tipo}</Selo>
                    <Selo variante="alerta">{d.motivoRotulo}</Selo>
                    {d.denunciasAbertasNoAlvo > 1 && status === 'aberta' && <Selo variante="erro">{d.denunciasAbertasNoAlvo} denúncias sobre este item</Selo>}
                    <span className="ml-auto text-xs text-suave tabular-nums">{dataHora(d.criadaEm)}</span>
                  </div>
                  {d.alvo.removido ? (
                    <p className="mt-3 text-sm text-suave italic">Conteúdo não existe mais (removido por quem publicou ou pela equipe).</p>
                  ) : (
                    <blockquote className="mt-3 border-l-2 border-linha-forte pl-3 text-[15px] leading-relaxed whitespace-pre-line text-tinta line-clamp-6">{d.alvo.texto}</blockquote>
                  )}
                  <p className="mt-2 text-sm text-suave">
                    {d.alvo.dono && (
                      <>
                        De{' '}
                        <Link to={linkConta(d.alvo.dono)} className="font-semibold text-vinho hover:underline">
                          {d.alvo.dono.nome}
                        </Link>
                        {' · '}
                      </>
                    )}
                    denunciado por{' '}
                    <Link to={linkConta(d.denunciante)} className="font-semibold text-tinta-2 hover:underline">
                      {d.denunciante.nome}
                    </Link>
                  </p>
                  {d.descricao && <p className="mt-2 rounded-lg bg-papel px-3 py-2 text-sm text-tinta-2">“{d.descricao}”</p>}
                  {status === 'aberta' ? (
                    <div className="mt-4 flex flex-col gap-3 border-t border-linha pt-4">
                      <AcaoNoAlvo alvo={d.alvo} aoConcluir={r.recarregar} />
                      <Decidir denuncia={d} aoConcluir={r.recarregar} />
                    </div>
                  ) : (
                    <p className="mt-3 border-t border-linha pt-3 text-sm text-tinta-2">
                      <span className="font-semibold text-tinta">{status === 'resolvida' ? 'Resolvida' : 'Descartada'}</span>
                      {d.resolvidaPor && ` por ${d.resolvidaPor}`} em {dataHora(d.resolvidaEm)}: {d.resolucao}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <Paginacao
              pagina={pagina}
              total={r.dados.total}
              porPagina={r.dados.porPagina}
              aoMudar={(n) => {
                const q = new URLSearchParams(p)
                q.set('pagina', String(n))
                setP(q, { replace: true })
              }}
            />
          </>
        ))}
    </>
  )
}

export default Denuncias
