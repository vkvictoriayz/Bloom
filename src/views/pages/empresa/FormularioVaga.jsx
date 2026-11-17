import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import TituloPagina from '../../components/candidata/TituloPagina'
import { Carregando, ErroAoCarregar } from '../../components/empresa/Estados'
import { useCarregar } from '../../components/empresa/useCarregar'
import Botao from '../../components/ui/Botao'
import { AreaTexto, Aviso, Campo, Entrada, Selecao } from '../../components/ui/Campo'
import { opcoesFiltro } from '../../data/vagas'
import { CONTRATOS, criarVaga, editarVaga, lerVagaEmpresa, MODALIDADES, NIVEIS } from '../../services/empresa'

const VAZIA = { titulo: '', descricao: '', requisitos: '', beneficios: '', area: '', nivel: '', localizacao: '', modalidade: '', tipoContrato: '', salario: '', salarioMax: '' }

function valor(texto) {
  const t = String(texto ?? '').trim()
  if (!t) return null
  const normal = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t
  return /^\d+(\.\d{1,2})?$/.test(normal) ? Number(normal) : NaN
}

function Formulario({ inicial, editando, idVaga, rascunhoAtual }) {
  const navigate = useNavigate()
  const [dados, setDados] = useState(inicial)
  const [erros, setErros] = useState({})
  const [estado, setEstado] = useState({ tipo: 'ocioso' })
  const campo = (nome) => (e) => setDados((d) => ({ ...d, [nome]: e.target.value }))

  async function enviar(e, rascunho = false) {
    e?.preventDefault()
    const novos = {}
    if (!dados.titulo.trim()) novos.titulo = 'Informe o título da vaga.'
    if (!dados.descricao.trim()) novos.descricao = 'Descreva a vaga.'
    if (!dados.modalidade) novos.modalidade = 'Escolha a modalidade.'
    const minimo = valor(dados.salario)
    const maximo = valor(dados.salarioMax)
    if (Number.isNaN(minimo)) novos.salario = 'Use um valor como 4500 ou 4.500,00'
    if (Number.isNaN(maximo)) novos.salarioMax = 'Use um valor como 6000 ou 6.000,00'
    if (minimo === null && maximo !== null && !Number.isNaN(maximo)) novos.salario = 'Informe o mínimo da faixa.'
    if (minimo !== null && maximo !== null && maximo < minimo) novos.salarioMax = 'O máximo não pode ser menor que o mínimo.'
    setErros(novos)
    if (Object.keys(novos).length) return setEstado({ tipo: 'erro', texto: 'Corrija os campos destacados.' })

    setEstado({ tipo: 'salvando' })
    try {
      const corpo = { ...dados, salario: minimo, salarioMax: maximo, ...(editando ? {} : { rascunho }) }
      const r = editando ? await editarVaga(idVaga, corpo) : await criarVaga(corpo)
      const aviso = editando ? 'Vaga atualizada.' : rascunho ? 'Rascunho salvo. Publique quando estiver pronta.' : 'Vaga publicada.'
      navigate(`/empresa/vagas/${r.vaga.id}`, { state: { aviso } })
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
      <Campo rotulo="Benefícios" opcional ajuda={`${dados.beneficios.length}/500 · Um por linha.`}>
        {(p) => <AreaTexto {...p} rows={3} maxLength={500} value={dados.beneficios} onChange={campo('beneficios')} />}
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
        <Campo rotulo="Nível de experiência" opcional>
          {(p) => (
            <Selecao {...p} value={dados.nivel} onChange={campo('nivel')}>
              <option value="">Não informado</option>
              {NIVEIS.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </Selecao>
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
        <Campo rotulo="Faixa salarial: de (R$)" opcional erro={erros.salario}>
          {(p) => <Entrada {...p} inputMode="decimal" placeholder="Ex.: 4.500,00" value={dados.salario ?? ''} onChange={campo('salario')} />}
        </Campo>
        <Campo rotulo="Até (R$)" opcional erro={erros.salarioMax} ajuda={!erros.salarioMax ? 'Deixe vazio para um valor só.' : undefined}>
          {(p) => <Entrada {...p} inputMode="decimal" placeholder="Ex.: 6.000,00" value={dados.salarioMax ?? ''} onChange={campo('salarioMax')} />}
        </Campo>
      </div>
      {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}
      <div className="flex flex-wrap gap-2 border-t border-linha pt-5">
        <Botao type="submit" disabled={estado.tipo === 'salvando'}>
          {estado.tipo === 'salvando' ? 'Salvando…' : editando ? (rascunhoAtual ? 'Salvar rascunho' : 'Salvar alterações') : 'Publicar vaga'}
        </Botao>
        {!editando && (
          <Botao type="button" variante="secundario" disabled={estado.tipo === 'salvando'} onClick={() => enviar(null, true)}>
            Salvar como rascunho
          </Botao>
        )}
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
        descricao={editando ? undefined : 'Publique agora ou salve como rascunho para revisar antes.'}
        voltar={{ para: '/empresa/vagas', rotulo: 'Gerenciar vagas' }}
      />
      {!editando && <Formulario inicial={VAZIA} />}
      {editando && r.tipo === 'carregando' && <Carregando quantidade={1} altura="h-96" />}
      {editando && r.tipo === 'erro' && <ErroAoCarregar erro={r.erro} aoTentar={r.recarregar} />}
      {editando && r.tipo === 'pronto' && (
        <Formulario
          editando
          idVaga={id}
          rascunhoAtual={r.dados.vaga.status === 'Rascunho'}
          inicial={{ ...VAZIA, ...r.dados.vaga, salario: r.dados.vaga.salario ?? '', salarioMax: r.dados.vaga.salarioMax ?? '' }}
        />
      )}
    </>
  )
}

export default FormularioVaga
