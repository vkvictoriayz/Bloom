function TextoEscalonado({ texto, atraso = 0, className }) {
  const palavras = texto.split(' ')

  return (
    <span className={className}>
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true">
        {palavras.map((palavra, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
            <span
              className="inline-block animate-subir"
              style={{ animationDelay: `${atraso + i * 55}ms` }}
            >
              {palavra}
              {i < palavras.length - 1 && ' '}
            </span>
          </span>
        ))}
      </span>
    </span>
  )
}

export default TextoEscalonado
