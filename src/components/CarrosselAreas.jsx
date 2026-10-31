import { Link } from 'react-router-dom'

// Carrossel infinito com CSS marquee — sem scroll-jump, totalmente fluido.
function CarrosselAreas({ areas, estaAutenticada = false }) {
  // Duplicamos as áreas para criar o efeito de loop contínuo.
  const itens = [...areas, ...areas]

  function urlArea(area) {
    if (!estaAutenticada) return '/login'
    return area.filtro ? `/vagas?area=${encodeURIComponent(area.filtro)}` : '/vagas'
  }

  return (
    <div
      className="carrossel"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Áreas de T.I."
    >
      <div className="carrossel-faixa">
        <ul className="carrossel-trilha">
          {itens.map((area, i) => (
            <li
              key={`${area.nome}-${i}`}
              className="carrossel-card"
              aria-hidden={i >= areas.length ? 'true' : undefined}
            >
              <Link to={urlArea(area)}>
                <h3>{area.nome}</h3>
                <p>{area.descricao}</p>
                <span className="carrossel-link">
                  Ver vagas <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default CarrosselAreas
