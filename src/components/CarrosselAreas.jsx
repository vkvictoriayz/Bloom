import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// Carrossel horizontal das áreas de T.I.
// Usa rolagem nativa com "snap": funciona com toque, mouse, trackpad e teclado,
// e as setas só ajudam a avançar/voltar.
function CarrosselAreas({ areas }) {
  const trilha = useRef(null)
  const [podeVoltar, setPodeVoltar] = useState(false)
  const [podeAvancar, setPodeAvancar] = useState(true)

  const atualizarSetas = useCallback(() => {
    const el = trilha.current
    if (!el) return
    setPodeVoltar(el.scrollLeft > 4)
    setPodeAvancar(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    atualizarSetas()
    window.addEventListener('resize', atualizarSetas)
    return () => window.removeEventListener('resize', atualizarSetas)
  }, [atualizarSetas])

  function mover(direcao) {
    const el = trilha.current
    if (!el) return
    const card = el.querySelector('.carrossel-card')
    const passo = card ? card.offsetWidth + 16 : el.clientWidth * 0.8
    el.scrollBy({ left: direcao * passo, behavior: 'smooth' })
  }

  return (
    <div className="carrossel" role="region" aria-roledescription="carrossel" aria-label="Áreas de T.I.">
      <button
        type="button"
        className="carrossel-seta carrossel-seta-voltar"
        onClick={() => mover(-1)}
        disabled={!podeVoltar}
        aria-label="Áreas anteriores"
      >
        ←
      </button>

      <ul className="carrossel-trilha" ref={trilha} onScroll={atualizarSetas}>
        {areas.map((area) => (
          <li key={area.nome} className="carrossel-card">
            <Link
              to={area.filtro ? `/vagas?area=${encodeURIComponent(area.filtro)}` : '/vagas'}
            >
              <h3>{area.nome}</h3>
              <p>{area.descricao}</p>
              <span className="carrossel-link">
                Ver vagas <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="carrossel-seta carrossel-seta-avancar"
        onClick={() => mover(1)}
        disabled={!podeAvancar}
        aria-label="Próximas áreas"
      >
        →
      </button>
    </div>
  )
}

export default CarrosselAreas
