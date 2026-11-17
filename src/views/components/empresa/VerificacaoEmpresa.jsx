import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../Icone'
import SeloVerificada from '../SeloVerificada'
import Botao from '../ui/Botao'
import { Aviso } from '../ui/Campo'
import Esqueleto from '../ui/Esqueleto'
import { lerVerificacaoEmpresa, verificarEmpresa } from '../../services/empresa'
import { cn } from '../../lib/cn'

const dataBR = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

// Atalho de cada requisito para onde se resolve.
const ATALHOS = {
  site: { para: '/empresa/perfil/editar', rotulo: 'Informar o site' },
  email: { para: '#dados-da-conta', rotulo: 'Confirmar o e-mail' },
  corporativo: { para: '#dados-da-conta', rotulo: 'Trocar o e-mail' },
  dominio: { para: '#dados-da-conta', rotulo: 'Trocar o e-mail' },
}

// Verificação de quem representa a empresa: automática pelo domínio do
// e-mail (quando todos os requisitos batem) ou pela equipe da Bloom.
function VerificacaoEmpresa() {
  const [estado, setEstado] = useState({ tipo: 'carregando' })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    lerVerificacaoEmpresa()
      .then((dados) => ativo && setEstado({ tipo: 'pronto', ...dados }))
      .catch((e) => ativo && setEstado({ tipo: 'erro', texto: e.message }))
    return () => {
      ativo = false
    }
  }, [])

  async function verificar() {
    setEnviando(true)
    setErro('')
    try {
      const dados = await verificarEmpresa()
      setEstado({ tipo: 'pronto', ...dados })
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (estado.tipo === 'carregando') return <Esqueleto className="h-32 rounded-xl" />
  if (estado.tipo === 'erro') return <Aviso tipo="erro">{estado.texto}</Aviso>

  if (estado.representante === 'verificado') {
    return (
      <div className="flex flex-col gap-3">
        <p className="flex flex-wrap items-center gap-2 text-sm text-tinta-2">
          <SeloVerificada /> {estado.metodo === 'equipe' ? 'Confirmada pela equipe da Bloom' : 'Confirmada pelo domínio do e-mail'}
          {estado.verificadoEm && ` em ${dataBR(estado.verificadoEm)}`}.
        </p>
        <p className="text-sm text-suave">O selo aparece no perfil público da empresa e no diretório de empresas. {estado.metodo === 'dominio' && 'Se o e-mail da conta mudar, a verificação precisa ser feita de novo.'}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-tinta-2">
        O CNPJ já foi conferido na Receita. Falta confirmar que quem administra a conta ({estado.responsavel.nome}
        {estado.responsavel.cargo && `, ${estado.responsavel.cargo}`}) fala pela empresa. Empresas verificadas ganham o selo{' '}
        <SeloVerificada className="align-middle" /> no perfil público e no diretório de empresas.
      </p>
      <div className="rounded-xl border border-linha p-4">
        <h3 className="text-sm font-semibold text-tinta">Verificação automática pelo domínio</h3>
        <ul className="mt-3 flex flex-col gap-2.5">
          {estado.requisitos.map((r) => (
            <li key={r.id} className="flex items-start gap-2.5 text-sm">
              <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full', r.ok ? 'bg-sucesso text-white' : 'border-2 border-linha-forte')}>
                {r.ok && <Icone nome="check" tamanho={12} />}
              </span>
              <span className={cn('flex-1', r.ok ? 'text-tinta-2' : 'text-tinta')}>{r.texto}</span>
              {!r.ok && ATALHOS[r.id] && (
                <Link
                  to={ATALHOS[r.id].para.startsWith('#') ? { hash: ATALHOS[r.id].para } : ATALHOS[r.id].para}
                  className="shrink-0 text-xs font-semibold text-vinho hover:underline"
                >
                  {ATALHOS[r.id].rotulo}
                </Link>
              )}
            </li>
          ))}
        </ul>
        {erro && (
          <Aviso tipo="erro" className="mt-3">
            {erro}
          </Aviso>
        )}
        <Botao className="mt-4" onClick={verificar} disabled={!estado.podeVerificar || enviando}>
          {enviando ? 'Verificando…' : 'Verificar agora'}
        </Botao>
      </div>
      <p className="text-sm text-suave">
        Sem e-mail no domínio da empresa? A equipe da Bloom também pode confirmar o vínculo por um canal oficial (por exemplo, o telefone ou o e-mail
        publicados no site da empresa). Enquanto isso, a conta funciona normalmente.
      </p>
    </div>
  )
}

export default VerificacaoEmpresa
