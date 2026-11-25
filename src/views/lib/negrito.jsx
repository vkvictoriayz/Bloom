export function comNegrito(texto, chave = '') {
  return texto.split(/\*\*([^*\n]+?)\*\*/g).map((parte, i) =>
    i % 2 === 1 ? (
      <strong key={`${chave}-${i}`} className="font-semibold text-tinta">
        {parte}
      </strong>
    ) : (
      parte
    )
  )
}
