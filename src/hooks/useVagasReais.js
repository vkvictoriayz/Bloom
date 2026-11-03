import { useEffect, useState } from 'react'

import { useDadosLocais } from './useDadosLocais'
import { EVENTO_CANDIDATURAS, lerCandidaturas } from '../services/candidaturas'
import { buscarVaga, listarVagas } from '../data/vagas'
import {
  ehVagaReal,
  EVENTO_CANDIDATURAS_SERVIDOR,
  lerVagaServidor,
  listarCandidaturasServidor,
  listarVagasServidor,
} from '../services/vagasApi'

// Vagas de exemplo + vagas reais publicadas pelas empresas.
// Se a API falhar, as vagas de exemplo continuam e o erro é informado.
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

  return { vagas: [...reais.vagas, ...listarVagas()], carregando: reais.carregando, erro: reais.erro }
}

// Uma vaga pelo id do front: "b12" vem da API, número vem dos exemplos.
export function useVaga(id) {
  const real = ehVagaReal(id)
  const [estado, setEstado] = useState(() => (real ? { vaga: null, carregando: true, erro: '' } : { vaga: buscarVaga(id), carregando: false, erro: '' }))
  const [idAnterior, setIdAnterior] = useState(id)
  if (idAnterior !== id) {
    setIdAnterior(id)
    setEstado(real ? { vaga: null, carregando: true, erro: '' } : { vaga: buscarVaga(id), carregando: false, erro: '' })
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

// Candidaturas da candidata: as registradas neste navegador (vagas de
// exemplo) e as enviadas ao backend (vagas reais, com status da empresa).
export function useCandidaturas() {
  const locais = useDadosLocais(lerCandidaturas, [EVENTO_CANDIDATURAS])
  const [servidor, setServidor] = useState([])
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    const atualizar = () => setVersao((v) => v + 1)
    window.addEventListener(EVENTO_CANDIDATURAS_SERVIDOR, atualizar)
    return () => window.removeEventListener(EVENTO_CANDIDATURAS_SERVIDOR, atualizar)
  }, [])

  useEffect(() => {
    let ativo = true
    listarCandidaturasServidor()
      .then((lista) => ativo && setServidor(lista))
      .catch(() => ativo && setServidor([]))
    return () => {
      ativo = false
    }
  }, [versao])

  return [...locais, ...servidor]
}
