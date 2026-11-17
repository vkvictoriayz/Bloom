import { useEffect, useRef, useState } from 'react'

import Icone from '../Icone'
import Botao from '../ui/Botao'
import { Aviso } from '../ui/Campo'
import { tamanhoLegivel } from '../../utils/arquivos'
import { baixarMeuCurriculo, enviarCurriculo, lerCurriculo, removerCurriculo } from '../../services/recursos'

const LIMITE = 5 * 1024 * 1024
const EXTENSOES = /\.(pdf|docx?)$/i

const lerBase64 = (arquivo) =>
  new Promise((ok, falha) => {
    const leitor = new FileReader()
    leitor.onload = () => ok(String(leitor.result).split(',')[1] ?? '')
    leitor.onerror = () => falha(new Error('Não foi possível ler o arquivo.'))
    leitor.readAsDataURL(arquivo)
  })

function GerenciarCurriculo() {
  const entrada = useRef(null)
  const [atual, setAtual] = useState(undefined)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    let ativo = true
    lerCurriculo()
      .then((c) => ativo && setAtual(c))
      .catch((e) => {
        if (!ativo) return
        setAtual(null)
        setAviso({ tipo: 'erro', texto: e.message })
      })
    return () => {
      ativo = false
    }
  }, [])

  async function executar(acao, texto) {
    setOcupado(true)
    setAviso(null)
    try {
      await acao()
      if (texto) setAviso({ tipo: 'sucesso', texto })
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e.message })
    } finally {
      setOcupado(false)
    }
  }

  function escolher(evento) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!arquivo) return
    if (!EXTENSOES.test(arquivo.name)) return setAviso({ tipo: 'erro', texto: 'Envie o currículo em PDF, DOC ou DOCX.' })
    if (arquivo.size > LIMITE) return setAviso({ tipo: 'erro', texto: 'O currículo deve ter até 5 MB.' })
    executar(async () => setAtual(await enviarCurriculo(arquivo.name, await lerBase64(arquivo))), atual ? 'Currículo trocado.' : 'Currículo enviado.')
  }

  return (
    <div>
      <input ref={entrada} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={escolher} />
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-blush text-vinho" aria-hidden="true">
          <Icone nome="documento" tamanho={20} />
        </span>
        <div className="min-w-0 flex-1">
          {atual === undefined ? (
            <p className="text-sm text-suave">Carregando…</p>
          ) : atual ? (
            <>
              <p className="truncate font-semibold text-tinta">{atual.nome}</p>
              <p className="text-xs text-suave">
                {tamanhoLegivel(atual.tamanho)} · enviado em {new Date(atual.enviadoEm).toLocaleDateString('pt-BR')}
              </p>
            </>
          ) : (
            <p className="font-semibold text-tinta">Nenhum currículo enviado</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Botao variante="secundario" tamanho="sm" disabled={ocupado || atual === undefined} onClick={() => entrada.current?.click()}>
            {ocupado ? 'Enviando…' : atual ? 'Trocar arquivo' : 'Enviar currículo'}
          </Botao>
          {atual && (
            <>
              <Botao variante="fantasma" tamanho="sm" disabled={ocupado} onClick={() => executar(baixarMeuCurriculo)}>
                <Icone nome="externo" tamanho={14} /> Baixar
              </Botao>
              <Botao variante="fantasma" tamanho="sm" className="text-erro" disabled={ocupado} onClick={() => setConfirmando(true)}>
                Remover
              </Botao>
            </>
          )}
        </div>
      </div>
      {confirmando && (
        <div role="alertdialog" aria-label="Confirmar remoção do currículo" className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-erro-claro px-4 py-3 text-sm">
          <span className="flex-1 font-semibold text-erro">Remover o currículo do perfil? Os já enviados em candidaturas continuam com as empresas.</span>
          <Botao
            tamanho="sm"
            className="bg-erro hover:bg-erro/90"
            disabled={ocupado}
            onClick={() =>
              executar(async () => {
                await removerCurriculo()
                setAtual(null)
                setConfirmando(false)
              }, 'Currículo removido.')
            }
          >
            Remover
          </Botao>
          <Botao tamanho="sm" variante="secundario" onClick={() => setConfirmando(false)}>
            Cancelar
          </Botao>
        </div>
      )}
      {aviso && (
        <Aviso tipo={aviso.tipo} className="mt-4">
          {aviso.texto}
        </Aviso>
      )}
    </div>
  )
}

export default GerenciarCurriculo
