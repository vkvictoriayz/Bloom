import { useState } from 'react'

import Botao from '../ui/Botao'
import { Aviso, Campo, Entrada, AreaTexto } from '../ui/Campo'
import Avatar from './Avatar'
import { salvarMeuPerfil } from '../../services/comunidade'

function PainelPerfil({ nome, perfil, numeros, aoSalvar }) {
  const [editando, setEditando] = useState(false)
  const [area, setArea] = useState(perfil.area)
  const [interesses, setInteresses] = useState(perfil.interesses.join(', '))
  const [bio, setBio] = useState(perfil.bio)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  function abrir() {
    setArea(perfil.area)
    setInteresses(perfil.interesses.join(', '))
    setBio(perfil.bio)
    setErro('')
    setEditando(true)
  }

  async function salvar(evento) {
    evento.preventDefault()
    setOcupado(true)
    setErro('')
    try {
      const r = await salvarMeuPerfil({
        area,
        bio,
        interesses: interesses.split(',').map((i) => i.trim()).filter(Boolean),
      })
      aoSalvar(r.perfil)
      setEditando(false)
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <section aria-labelledby="titulo-meu-perfil" className="border border-linha bg-branco p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <Avatar nome={nome} foto={perfil.foto} tamanho="lg" />
        <div className="min-w-0">
          <h2 id="titulo-meu-perfil" className="truncate font-display text-xl text-tinta">
            {nome}
          </h2>
          <p className="truncate text-sm text-suave">{perfil.area || 'Adicione sua área profissional'}</p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-3 divide-x divide-linha border-y border-linha text-center">
        {[
          ['Publicações', numeros.publicacoes],
          ['Seguindo', numeros.seguindo],
          ['Seguidoras', numeros.seguidoras],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="px-2 py-3">
            <dd className="font-display text-2xl text-tinta tabular-nums">{valor}</dd>
            <dt className="text-xs text-suave">{rotulo}</dt>
          </div>
        ))}
      </dl>

      {!editando ? (
        <>
          {perfil.bio && <p className="mt-4 text-sm leading-relaxed text-tinta-2">{perfil.bio}</p>}
          {perfil.interesses.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Interesses">
              {perfil.interesses.map((i) => (
                <li key={i} className="rounded-full border border-linha-forte px-2.5 py-0.5 text-xs font-medium text-tinta-2">
                  {i}
                </li>
              ))}
            </ul>
          )}
          <Botao variante="secundario" tamanho="sm" className="mt-5" onClick={abrir}>
            Editar perfil da comunidade
          </Botao>
        </>
      ) : (
        <form onSubmit={salvar} className="mt-5 flex flex-col gap-4">
          <Campo rotulo="Área profissional">{(p) => <Entrada {...p} value={area} onChange={(e) => setArea(e.target.value)} maxLength={80} placeholder="Ex.: Desenvolvimento front-end" />}</Campo>
          <Campo rotulo="Interesses" ajuda="Separe por vírgula. Ex.: React, dados, carreira">
            {(p) => <Entrada {...p} value={interesses} onChange={(e) => setInteresses(e.target.value)} />}
          </Campo>
          <Campo rotulo="Apresentação" ajuda={`${bio.length}/280`}>
            {(p) => <AreaTexto {...p} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} className="min-h-24" />}
          </Campo>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <div className="flex gap-2">
            <Botao type="submit" tamanho="sm" disabled={ocupado}>
              {ocupado ? 'Salvando…' : 'Salvar'}
            </Botao>
            <Botao tamanho="sm" variante="secundario" onClick={() => setEditando(false)}>
              Cancelar
            </Botao>
          </div>
        </form>
      )}
    </section>
  )
}

export default PainelPerfil
