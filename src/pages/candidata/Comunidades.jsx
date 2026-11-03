import { Link } from 'react-router-dom'

import Icone from '../../components/Icone'
import TituloPagina, { RecursoIndisponivel } from '../../components/candidata/TituloPagina'
import { useRecurso } from '../../components/candidata/useRecurso'
import Botao from '../../components/ui/Botao'
import { Aviso } from '../../components/ui/Campo'
import Esqueleto from '../../components/ui/Esqueleto'
import { Vazio, VazioDescricao, VazioTitulo } from '../../components/ui/Vazio'
import { DISPONIVEL, listarComunidades } from '../../services/recursos'

// Comunidades temáticas (grupos por área). Sem API, mostra o estado
// "em desenvolvimento" e não lista grupos inventados.
function Comunidades() {
  const r = useRecurso(DISPONIVEL.comunidades, listarComunidades)

  return (
    <>
      <TituloPagina titulo="Comunidades" descricao="Grupos de tecnologia por tema: front-end, dados, carreira, segurança e mais." />

      {r.estado === 'indisponivel' && (
        <RecursoIndisponivel
          icone="grupo"
          titulo="As comunidades estão chegando"
          descricao="Em breve você poderá entrar em grupos por tema, ver publicações de cada comunidade e conhecer participantes. Enquanto isso, a conversa acontece no feed."
        >
          <Botao as={Link} to="/candidata/feed">
            Ir para o feed
          </Botao>
        </RecursoIndisponivel>
      )}
      {r.estado === 'carregando' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Esqueleto key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      )}
      {r.estado === 'erro' && <Aviso tipo="erro">{r.erro}</Aviso>}
      {r.estado === 'pronto' &&
        (r.dados.comunidades?.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {r.dados.comunidades.map((c) => (
              <li key={c.id} className="flex flex-col rounded-xl border border-linha bg-branco p-5">
                <div className="flex items-center gap-3">
                  {c.imagem ? (
                    <img src={c.imagem} alt="" className="size-12 rounded-lg object-cover" />
                  ) : (
                    <span className="grid size-12 place-items-center rounded-lg bg-blush text-vinho" aria-hidden="true">
                      <Icone nome="grupo" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-tinta">{c.nome}</h2>
                    <p className="text-xs text-suave">
                      {c.tema}
                      {typeof c.participantes === 'number' && ` · ${c.participantes} participantes`}
                    </p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-tinta-2">{c.descricao}</p>
                <Botao as={Link} to={`/comunidades/${c.id}`} variante="secundario" className="mt-4 self-start">
                  Ver comunidade
                </Botao>
              </li>
            ))}
          </ul>
        ) : (
          <Vazio className="bg-branco">
            <VazioTitulo>Nenhuma comunidade ainda</VazioTitulo>
            <VazioDescricao>Quando as primeiras comunidades forem criadas, elas aparecem aqui.</VazioDescricao>
          </Vazio>
        ))}
    </>
  )
}

export default Comunidades
