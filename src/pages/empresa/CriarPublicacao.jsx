import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina from '../../components/candidata/TituloPagina'
import { ICONE_TIPO } from '../../components/comunidade/tipos'
import PublicacaoEmpresa from '../../components/empresa/PublicacaoEmpresa'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Aviso, Campo } from '../../components/ui/Campo'
import { criarPublicacaoEmpresa } from '../../services/empresa'
import { LIMITE_PUBLICACAO, TIPOS } from '../../services/comunidade'
import { cn } from '../../lib/cn'

// Criar publicação: escrever, pré-visualizar e publicar. Só é dada como
// publicada depois da resposta da API. Imagens e anexos ainda não têm
// suporte no backend, por isso não aparecem aqui.
function CriarPublicacao() {
  const navigate = useNavigate()
  const { perfil: dados } = useOutletContext()
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('oportunidade')
  // Guarda o horário em que a prévia foi aberta (null = sem prévia).
  const [previa, setPrevia] = useState(null)
  const [estado, setEstado] = useState({ tipo: 'ocioso' })

  async function publicar() {
    if (!texto.trim()) return setEstado({ tipo: 'erro', texto: 'Escreva algo para publicar.' })
    setEstado({ tipo: 'salvando' })
    try {
      await criarPublicacaoEmpresa({ texto, tipo })
      navigate('/empresa/publicacoes', { replace: true })
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <>
      <TituloPagina titulo="Criar publicação" voltar={{ para: '/empresa/publicacoes', rotulo: 'Publicações' }} />
      <div className="mx-auto flex max-w-[760px] flex-col gap-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!texto.trim()) return setEstado({ tipo: 'erro', texto: 'Escreva algo para publicar.' })
            setEstado({ tipo: 'ocioso' })
            setPrevia(new Date().toISOString())
          }}
          className="cartao flex flex-col gap-5 p-6"
        >
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-tinta-2">Tipo de publicação</legend>
            <div role="radiogroup" className="flex flex-wrap gap-1">
              {TIPOS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={tipo === t.id}
                  onClick={() => setTipo(t.id)}
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors',
                    tipo === t.id ? 'bg-blush text-vinho' : 'text-tinta-2 hover:bg-papel-2'
                  )}
                >
                  <Icone nome={ICONE_TIPO[t.id]} tamanho={16} /> {t.rotulo}
                </button>
              ))}
            </div>
          </fieldset>
          <Campo rotulo="Conteúdo" ajuda={`${texto.length}/${LIMITE_PUBLICACAO}`}>
            {(p) => (
              <AreaTexto
                {...p}
                rows={7}
                maxLength={LIMITE_PUBLICACAO}
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value)
                  setPrevia(null)
                }}
                placeholder="Ex.: Estamos com inscrições abertas para o programa de estágio em tecnologia…"
              />
            )}
          </Campo>
          {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
          <div className="flex flex-wrap gap-2 border-t border-linha pt-5">
            <Botao type="submit" variante="secundario">
              <Icone nome="olho" tamanho={16} /> Pré-visualizar
            </Botao>
            <Botao onClick={publicar} disabled={estado.tipo === 'salvando'}>
              {estado.tipo === 'salvando' ? 'Publicando…' : 'Publicar'}
            </Botao>
            <Botao as={Link} to="/empresa/publicacoes" variante="fantasma">
              Cancelar
            </Botao>
          </div>
        </form>

        {previa && (
          <section aria-label="Pré-visualização">
            <p className="mb-2 text-xs font-bold tracking-[0.12em] text-suave uppercase">Pré-visualização</p>
            <PublicacaoEmpresa
              key={`${tipo}-${texto}`}
              publicacao={{ id: 'previa', tipo, texto: texto.trim(), criadaEm: previa, empresa: { nome: dados?.empresa.nome ?? 'Sua empresa' } }}
            />
          </section>
        )}
      </div>
    </>
  )
}

export default CriarPublicacao
