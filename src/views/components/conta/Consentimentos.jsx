import { useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../Icone'
import { cn } from '../../lib/cn'

// O que muda entre candidata e empresa no resumo de "como usamos seus dados".
const RESUMO = {
  usuaria: [
    ['Quais dados', 'Nome civil e nome social, e-mail, telefone, CPF, data de nascimento e identidade de gênero; depois, o que você colocar no perfil, currículo e publicações.'],
    ['Por quê', 'Para criar e proteger sua conta, confirmar sua identidade e conectar você a vagas.'],
    ['Quem vê', 'Empresas veem seu perfil quando ele é público e, ao se candidatar, os dados da candidatura (incluindo e-mail e currículo). CPF, data de nascimento, nome civil e identidade de gênero não são mostrados a empresas.'],
  ],
  empresa: [
    ['Quais dados', 'CNPJ, razão social, nome da empresa, nome e cargo da pessoa responsável, e-mail e telefone comerciais.'],
    ['Por quê', 'Para criar a conta, confirmar que a empresa está ativa e permitir que publique vagas e receba candidaturas.'],
    ['Quem vê', 'O perfil da empresa e as vagas são públicos. Os dados da pessoa responsável ficam restritos à equipe da Bloom.'],
  ],
}

function Caixa({ marcado, aoMudar, erro, children, id }) {
  return (
    <div>
      <label
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-2xl border bg-white/70 p-4 text-sm leading-relaxed text-tinta-2 transition-colors duration-300',
          erro ? 'border-erro/40' : marcado ? 'border-rosa/40 bg-blush/30' : 'border-rosa/15 hover:border-rosa/30'
        )}
      >
        <input
          type="checkbox"
          checked={marcado}
          onChange={(e) => aoMudar(e.target.checked)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#9c4a63]"
        />
        <span>{children}</span>
      </label>
      {erro && (
        <p id={`${id}-erro`} className="mt-1.5 ml-1 text-xs text-erro">
          {erro}
        </p>
      )}
    </div>
  )
}

const LINK = 'font-semibold text-vinho underline underline-offset-2 hover:text-vinho-escuro'

// Os dois aceites obrigatórios ficam separados do opt-in de comunicações (opcional e desmarcado).
function Consentimentos({ tipo = 'usuaria', valores, aoMudar, erros = {} }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-rosa/10 bg-white/60">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-tinta"
        >
          <span className="inline-flex items-center gap-2">
            <Icone nome="escudo" tamanho={16} className="text-rosa" /> Como a Bloom usa seus dados
          </span>
          <svg viewBox="0 0 12 12" aria-hidden="true" className={cn('size-3 text-suave transition-transform duration-300', aberto && 'rotate-180')}>
            <path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <div className={cn('grid transition-[grid-template-rows] duration-300 ease-out', aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
          <div className="overflow-hidden" inert={!aberto}>
            <dl className="flex flex-col gap-3 border-t border-rosa/10 px-4 py-4 text-xs leading-relaxed">
              {RESUMO[tipo].map(([titulo, texto]) => (
                <div key={titulo}>
                  <dt className="font-semibold text-tinta">{titulo}</dt>
                  <dd className="mt-0.5 text-tinta-2">{texto}</dd>
                </div>
              ))}
              <div>
                <dt className="font-semibold text-tinta">Seus direitos</dt>
                <dd className="mt-0.5 text-tinta-2">
                  Você edita seus dados nas configurações, pode excluir a conta a qualquer momento e pedir acesso ou correção por contato@bloom.com.br. Detalhes na{' '}
                  <Link to="/privacidade" target="_blank" className={LINK}>
                    Política de Privacidade
                  </Link>
                  .
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <Caixa id="aceite-termos" marcado={valores.aceiteTermos} aoMudar={(v) => aoMudar('aceiteTermos', v)} erro={erros.aceiteTermos}>
        Li e concordo com os{' '}
        <Link to="/termos" target="_blank" className={LINK}>
          Termos de Uso
        </Link>{' '}
        e a{' '}
        <Link to="/privacidade" target="_blank" className={LINK}>
          Política de Privacidade
        </Link>{' '}
        da Bloom. <span className="text-rosa" aria-hidden="true">*</span>
      </Caixa>
      <Caixa id="ciencia-dados" marcado={valores.cienciaDados} aoMudar={(v) => aoMudar('cienciaDados', v)} erro={erros.cienciaDados}>
        Estou ciente de que meus dados pessoais serão coletados e tratados pela Bloom para as finalidades descritas na Política de Privacidade.{' '}
        <span className="text-rosa" aria-hidden="true">*</span>
      </Caixa>
      <Caixa id="comunicacoes" marcado={valores.comunicacoes} aoMudar={(v) => aoMudar('comunicacoes', v)}>
        Quero receber novidades da Bloom por e-mail. <span className="text-suave">(opcional)</span>
      </Caixa>
    </div>
  )
}

export default Consentimentos
