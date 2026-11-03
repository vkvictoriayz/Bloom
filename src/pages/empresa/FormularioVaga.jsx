import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Aviso, Campo, Entrada, Selecao } from '../../components/ui/Campo'
import { opcoesFiltro } from '../../data/vagas'
import { CONTRATOS, criarVaga, editarVaga, lerVagaEmpresa, MODALIDADES } from '../../services/empresa'

const VAZIA = { titulo: '', descricao: '', requisitos: '', area: '', localizacao: '', modalidade: '', tipoContrato: '', salario: '' }

// Campos da tabela VAGAS, com os limites do banco.
function Formulario({ inicial, editando, idVaga }) {
  const navigate = useNavigate()
  const [dados, setDados] = useState(inicial)
  const [erros, setErros] = useState({})
  const [estado, setEstado] = useState({ tipo: 'ocioso' })
  const campo = (nome) => (e) => setDados((d) => ({ ...d, [nome]: e.target.value }))

  async function enviar(e) {
    e.preventDefault()
    const novos = {}
    if (!dados.titulo.trim()) novos.titulo = 'Informe o título da vaga.'
    if (!dados.descricao.trim()) novos.descricao = 'Descreva a vaga.'
    if (!dados.modalidade) novos.modalidade = 'Escolha a modalidade.'
    const salario = String(dados.salario).trim()
    if (salario && (!Number.isFinite(Number(salario.replace(',', '.'))) || Number(salario.replace(',', '.')) < 0)) novos.salario = 'Use apenas números, como 4500.00'
    setErros(novos)
    if (Object.keys(novos).length) return setEstado({ tipo: 'erro', texto: 'Corrija os campos destacados.' })

    setEstado({ tipo: 'salvando' })
    try {
      const corpo = { ...dados, salario: salario ? salario.replace(',', '.') : null }
      const r = editando ? await editarVaga(idVaga, corpo) : await criarVaga(corpo)
      navigate(`/empresa/vagas/${r.vaga.id}`, { state: { aviso: editando ? 'Vaga atualizada.' : 'Vaga publicada.' } })
    } catch (erro) {
      setEstado({ tipo: 'erro', texto: erro.message })
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="cartao flex max-w-3xl flex-col gap-5 p-6 sm:p-8">
      <Campo rotulo="Título da vaga" erro={erros.titulo}>
        {(p) => <Entrada {...p} maxLength={150} placeholder="Ex.: Desenvolvedora front-end júnior" value={dados.titulo} onChange={campo('titulo')} />}
      </Campo>
      <Campo rotulo="Descrição e responsabilidades" erro={erros.descricao} ajuda={!erros.descricao ? `${dados.descricao.length}/500` : undefined}>
        {(p) => <AreaTexto {...p} rows={5} maxLength={500} value={dados.descricao} onChange={campo('descricao')} />}
      </Campo>
      <Campo rotulo="Requisitos e competências" opcional ajuda={`${dados.requisitos.length}/500 · Um por linha fica mais fácil de ler.`}>
        {(p) => <AreaTexto {...p} rows={4} maxLength={500} value={dados.requisitos} onChange={campo('requisitos')} />}
      </Campo>
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo rotulo="Área profissional" opcional>
          {(p) => (
            <>
              <Entrada {...p} list="areas-vaga" maxLength={100} placeholder="Ex.: Desenvolvimento" value={dados.area} onChange={campo('area')} />
              <datalist id="areas-vaga">
                {opcoesFiltro.areas.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </>
          )}
        </Campo>
        <Campo rotulo="Localização" opcional>
          {(p) => <Entrada {...p} maxLength={150} placeholder="Cidade, UF" value={dados.localizacao} onChange={campo('localizacao')} />}
        </Campo>
        <Campo rotulo="Modalidade de trabalho" erro={erros.modalidade}>
          {(p) => (
            <Selecao {...p} value={dados.modalidade} onChange={campo('modalidade')}>
              <option value="">Escolha…</option>
              {MODALIDADES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Selecao>
          )}
        </Campo>
        <Campo rotulo="Tipo de contratação" opcional>
          {(p) => (
            <Selecao {...p} value={dados.tipoContrato} onChange={campo('tipoContrato')}>
              <option value="">Não informado</option>
              {CONTRATOS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Selecao>
          )}
        </Campo>
        <Campo rotulo="Salário (R$)" opcional erro={erros.salario}>
          {(p) => <Entrada {...p} inputMode="decimal" placeholder="Ex.: 4500.00" value={dados.salario ?? ''} onChange={campo('salario')} />}
        </Campo>
      </div>
      {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
      <div className="flex flex-wrap gap-2 border-t border-linha pt-5">
        <Botao type="submit" disabled={estado.tipo === 'salvando'}>
          {estado.tipo === 'salvando' ? 'Salvando…' : editando ? 'Salvar alterações' : 'Publicar vaga'}
        </Botao>
        <Botao as={Link} to={editando ? `/empresa/vagas/${idVaga}` : '/empresa/vagas'} variante="fantasma">
          Cancelar
        </Botao>
      </div>
    </form>
  )
}

function FormularioVaga() {
  const { id } = useParams()
  const editando = Boolean(id)
  const r = useCarregar(() => (editando ? lerVagaEmpresa(id) : Promise.resolve(null)), [id])

  return (
    <>
      <TituloPagina
        titulo={editando ? 'Editar vaga' : 'Nova vaga'}
        descricao={editando ? undefined : 'A vaga fica aberta para candidaturas assim que for publicada.'}
        voltar={{ para: '/empresa/vagas', rotulo: 'Gerenciar vagas' }}
      />
      {!editando && <Formulario inicial={VAZIA} />}
      {editando && r.tipo === 'carregando' && <Carregando quantidade={1} altura="h-96" />}
      {editando && r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {editando && r.tipo === 'pronto' && (
        <Formulario
          editando
          idVaga={id}
          inicial={{ ...VAZIA, ...r.dados.vaga, salario: r.dados.vaga.salario ?? '' }}
        />
      )}
    </>
  )
}

export default FormularioVaga
