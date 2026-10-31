import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import Icone from '../Icone'
import { cn } from '../../lib/cn'

// Busca de vagas (cargo, tecnologia, empresa ou palavra-chave).
// Envia para /vagas?busca=..., onde a lista é filtrada.
// "destaque" é a versão grande usada no painel e na página de vagas.
function BuscaVagas({ destaque = false, aoBuscar, autoFoco, className }) {
  const { pathname } = useLocation()
  const [parametros] = useSearchParams()
  const termoDaUrl = pathname === '/vagas' ? parametros.get('busca') ?? '' : ''

  // Recomeça o campo quando a busca da URL muda (ex.: "limpar" na página de vagas).
  const [ultimoDaUrl, setUltimoDaUrl] = useState(termoDaUrl)
  const [termo, setTermo] = useState(termoDaUrl)
  if (ultimoDaUrl !== termoDaUrl) {
    setUltimoDaUrl(termoDaUrl)
    setTermo(termoDaUrl)
  }

  const navigate = useNavigate()

  function enviar(e) {
    e.preventDefault()
    const proximos = new URLSearchParams(pathname === '/vagas' ? parametros : undefined)
    const limpo = termo.trim()
    if (limpo) proximos.set('busca', limpo)
    else proximos.delete('busca')
    const consulta = proximos.toString()
    navigate(consulta ? `/vagas?${consulta}` : '/vagas')
    aoBuscar?.()
  }

  function limpar() {
    setTermo('')
    if (pathname === '/vagas' && termoDaUrl) {
      const proximos = new URLSearchParams(parametros)
      proximos.delete('busca')
      navigate(`/vagas?${proximos}`)
    }
  }

  return (
    <form role="search" onSubmit={enviar} className={cn('relative flex items-center', className)}>
      <Icone
        nome="busca"
        tamanho={destaque ? 22 : 18}
        className={cn('pointer-events-none absolute text-suave', destaque ? 'left-5' : 'left-3')}
      />
      <input
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        autoFocus={autoFoco}
        placeholder={destaque ? 'Cargo, tecnologia, empresa ou palavra-chave' : 'Buscar vagas'}
        aria-label="Buscar vagas por cargo, tecnologia, empresa ou palavra-chave"
        className={cn(
          'peer w-full border border-linha-forte bg-branco text-tinta placeholder:text-suave/80 transition-colors hover:border-suave focus:border-vinho focus:ring-2 focus:ring-vinho/15 focus:outline-none focus-visible:outline-none',
          destaque ? 'h-16 rounded-lg pr-36 pl-14 text-base' : 'h-10 rounded-md pr-9 pl-9 text-sm'
        )}
      />
      {termo && (
        <button
          type="button"
          onClick={limpar}
          aria-label="Limpar pesquisa"
          className={cn(
            'absolute grid place-items-center rounded-full text-suave hover:bg-papel-2 hover:text-tinta',
            destaque ? 'right-32 size-9' : 'right-1.5 size-7'
          )}
        >
          <Icone nome="fechar" tamanho={16} />
        </button>
      )}
      {destaque && (
        <button
          type="submit"
          className="absolute right-2 h-12 rounded-md bg-vinho px-6 text-sm font-semibold text-white transition-colors hover:bg-vinho-escuro"
        >
          Buscar
        </button>
      )}
    </form>
  )
}

export default BuscaVagas
