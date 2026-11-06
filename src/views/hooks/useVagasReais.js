import { useEffect, useState } from 'react'

import {
  ehVagaReal,
  EVENTO_CANDIDATURAS_SERVIDOR,
  lerVagaServidor,
  listarCandidaturasServidor,
  listarVagasServidor,
} from '../services/vagasApi'

// Vagas publicadas pelas empresas (API). Não há mais vagas de exemplo.
export function useVagas() {
  const [reais, setReais] = useState({ vagas: [], carregando: true, erro: '' })

  useEffect(() => {
    let ativo = true
    listarVagasServidor()
      .then((vagas) => ativo && setReais({ vagas, carregando: false, erro: '' }))
      .catch((e) => ativo && setReais({ vagas: [], carregando: false, erro: e.message }))
    return () => {
      ativo = false
    }
  }, [])

  return reais
}

// Uma vaga pelo id do front ("b12" = vaga 12 da API). Ids de vagas de
// exemplo antigas (só números) não existem mais: dão "não encontrada".
export function useVaga(id) {
  const real = ehVagaReal(id)
  const inicial = () => (real ? { vaga: null, carregando: true, erro: '' } : { vaga: null, carregando: false, erro: '' })
  const [estado, setEstado] = useState(inicial)
  const [idAnterior, setIdAnterior] = useState(id)
  if (idAnterior !== id) {
    setIdAnterior(id)
    setEstado(inicial())
  }

  useEffect(() => {
    if (!real) return
    let ativo = true
    lerVagaServidor(id)
      .then((vaga) => ativo && setEstado({ vaga, carregando: false, erro: '' }))
      .catch((e) => ativo && setEstado({ vaga: null, carregando: false, erro: e.message }))
    return () => {
      ativo = false
    }
  }, [id, real])

  return estado
}

// Candidaturas da candidata, do servidor (com o status dado pela empresa),
// com os estados de carregamento e erro.
export function useCandidaturasEstado() {
  const [estado, setEstado] = useState({ lista: [], carregando: true, erro: '' })
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    const atualizar = () => setVersao((v) => v + 1)
    window.addEventListener(EVENTO_CANDIDATURAS_SERVIDOR, atualizar)
    return () => window.removeEventListener(EVENTO_CANDIDATURAS_SERVIDOR, atualizar)
  }, [])

  useEffect(() => {
    let ativo = true
    listarCandidaturasServidor()
      .then((lista) => ativo && setEstado({ lista, carregando: false, erro: '' }))
      .catch((e) => ativo && setEstado({ lista: [], carregando: false, erro: e.message }))
    return () => {
      ativo = false
    }
  }, [versao])

  return estado
}

// Só a lista (para as telas que não mostram carregamento).
export function useCandidaturas() {
  return useCandidaturasEstado().lista
}
