import { Link } from 'react-router-dom'

import BotaoSalvar from '../BotaoSalvar'
import Icone from '../Icone'
import MarcaEmpresa from '../MarcaEmpresa'
import Botao from '../ui/Botao'
import Selo from '../ui/Selo'
import { formatarPublicacao } from '../../data/vagas'

function CartaoVaga({ vaga, candidatura }) {
  const empresa = vaga.dadosEmpresa

  return (
    <article className="flex h-full flex-col rounded-xl border border-linha bg-branco p-5 transition-colors hover:border-linha-forte sm:p-6">
      <div className="flex items-start gap-3">
        <MarcaEmpresa empresa={empresa} tamanho="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-tinta-2">{empresa.nomeCurto}</p>
          <p className="text-xs text-suave">
            {formatarPublicacao(vaga.publicadaHaDias)}
            {vaga.vagasRestantes !== null && vaga.vagasRestantes !== undefined && vaga.vagasRestantes <= 20 && (
              <span className="ml-1.5 font-semibold text-alerta">· {vaga.vagasRestantes === 1 ? 'Resta 1 vaga' : `Restam ${vaga.vagasRestantes} vagas`}</span>
            )}
          </p>
        </div>
        <BotaoSalvar vaga={vaga} className="-mt-1 -mr-2" />
      </div>

      <h3 className="mt-4 font-display text-xl leading-snug text-tinta">
        <Link to={`/vagas/${vaga.id}`} className="hover:text-vinho">
          {vaga.titulo}
        </Link>
      </h3>

      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-tinta-2">
        <li className="inline-flex items-center gap-1">
          <Icone nome="local" tamanho={15} className="text-suave" /> {vaga.local}
        </li>
        <li>{vaga.modalidade}</li>
        <li>{vaga.nivel ?? 'Nível não informado'}</li>
        <li>{vaga.contrato}</li>
      </ul>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-suave">{vaga.resumo}</p>

      <div className="mt-3 flex min-h-6 flex-wrap gap-1.5">
        {vaga.destaque && (
          <Selo variante="vinho">
            <Icone nome="coroa" /> Destaque
          </Selo>
        )}
        {candidatura && (
          <Selo variante="sucesso">
            <Icone nome="check" /> Candidatura enviada
          </Selo>
        )}
      </div>

      <div className="mt-auto flex gap-2 pt-5">
        <Botao as={Link} to={`/vagas/${vaga.id}`} variante="secundario" className="flex-1">
          Ver detalhes
        </Botao>
        {candidatura ? (
          <Botao as={Link} to={`/candidata/candidaturas/${encodeURIComponent(candidatura.id)}`} variante="fantasma" className="flex-1">
            Acompanhar
          </Botao>
        ) : (
          <Botao as={Link} to={`/vagas/${vaga.id}/candidatar`} className="flex-1">
            Candidatar-se
          </Botao>
        )}
      </div>
    </article>
  )
}

export default CartaoVaga
