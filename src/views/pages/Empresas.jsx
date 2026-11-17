import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import Icone from '../components/Icone'
import MarcaEmpresa from '../components/MarcaEmpresa'
import SeloVerificada from '../components/SeloVerificada'
import CabecalhoPagina from '../components/layout/CabecalhoPagina'
import Pagina from '../components/layout/Pagina'
import Botao from '../components/ui/Botao'
import { Aviso, Selecao, estiloControle } from '../components/ui/Campo'
import Esqueleto from '../components/ui/Esqueleto'
import { Vazio, VazioAcoes, VazioDescricao, VazioTitulo } from '../components/ui/Vazio'
import { listarEmpresasPublicas, textoVagas } from '../services/publico'
import { cn } from '../lib/cn'
import imgEmpresas from '../assets/ilustracoes/para-empresas.webp'

// Ilustração do cabeçalho (um único arquivo serve às duas larguras).
const ilustracao = {
  pequena: imgEmpresas,
  grande: imgEmpresas,
  alt: 'Borboleta da BLOOM cercada por comunidade, código, vagas e currículos aprovados',
}

const detalhe = (e) => [e.areaAtuacao, e.localizacao].filter(Boolean).join(' · ') || 'Empresa na Bloom'

// Cartão de empresa em destaque: marca, nome, descrição curta e as vagas
// abertas mais recentes.
function CartaoEmpresa({ empresa }) {
  return (
    <Link to={`/empresas/${empresa.id}`} className="group flex h-full flex-col border border-linha bg-branco p-6 transition-colors hover:border-linha-forte">
      <div className="flex items-center gap-4">
        <MarcaEmpresa empresa={empresa} tamanho="md" />
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-display text-xl text-tinta transition-colors group-hover:text-vinho">
            <span className="truncate">{empresa.nome}</span>
            {empresa.verificada && <SeloVerificada compacto />}
          </h3>
          <p className="truncate text-sm text-suave">{detalhe(empresa)}</p>
        </div>
      </div>

      <p className="mt-5 line-clamp-3 text-[15px] leading-relaxed text-tinta-2">{empresa.descricao || 'A empresa ainda não escreveu a apresentação.'}</p>

      <div className="mt-auto pt-6">
        {empresa.ultimasVagas.length > 0 && (
          <ul className="mb-5 flex flex-col gap-2 border-t border-linha pt-5">
            {empresa.ultimasVagas.map((vaga) => (
              <li key={vaga.id} className="truncate text-sm text-tinta">
                {vaga.titulo}
              </li>
            ))}
          </ul>
        )}
        <div className={cn('flex items-center justify-between gap-3 text-sm', empresa.ultimasVagas.length === 0 && 'border-t border-linha pt-5')}>
          <span className={cn('font-semibold', empresa.vagasAbertas ? 'text-vinho' : 'text-suave')}>{textoVagas(empresa.vagasAbertas)}</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-tinta group-hover:text-vinho">
            Ver perfil <Icone nome="seta" tamanho={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function Empresas() {
  const [parametros, setParametros] = useSearchParams()
  const busca = parametros.get('busca') ?? ''
  const area = parametros.get('area') ?? ''
  const comVagas = parametros.get('vagas') === '1'
  const [estado, setEstado] = useState({ tipo: 'carregando' })

  function definir(chave, valor) {
    const proximos = new URLSearchParams(parametros)
    if (valor) proximos.set(chave, valor)
    else proximos.delete(chave)
    setParametros(proximos, { replace: true })
  }

  useEffect(() => {
    let ativo = true
    const espera = setTimeout(
      () =>
        listarEmpresasPublicas({ busca: busca.trim(), area, comVagas })
          .then((r) => ativo && setEstado({ tipo: 'pronto', ...r }))
          .catch((e) => ativo && setEstado({ tipo: 'erro', texto: e.message })),
      busca ? 300 : 0
    )
    return () => {
      ativo = false
      clearTimeout(espera)
    }
  }, [busca, area, comVagas])

  const lista = estado.empresas ?? []
  const filtrando = Boolean(busca || area || comVagas)
  const totalVagas = lista.reduce((soma, e) => soma + e.vagasAbertas, 0)
  const destaques = lista.filter((e) => e.vagasAbertas > 0).slice(0, 6)

  const descricao =
    estado.tipo !== 'pronto'
      ? 'Empresas que contratam mulheres na tecnologia pela Bloom.'
      : estado.total === 0
        ? 'As empresas aparecem aqui assim que se cadastram na Bloom.'
        : `${estado.total} ${estado.total === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}${filtrando ? '' : `, com ${totalVagas} ${totalVagas === 1 ? 'vaga aberta' : 'vagas abertas'} em tecnologia`}.`

  return (
    <Pagina titulo="Empresas">
      <CabecalhoPagina
        variante="retangular"
        foto={ilustracao}
        rotulo="Empresas"
        titulo={
          <>
            Descubra onde construir sua <em className="text-vinho">carreira.</em>
          </>
        }
        descricao={descricao}
      >
        <div className="grid gap-2 border border-linha bg-branco p-2 text-tinta sm:grid-cols-2">
          <div className="relative sm:col-span-2">
            <Icone nome="busca" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-suave" />
            <input
              type="search"
              value={busca}
              onChange={(e) => definir('busca', e.target.value)}
              placeholder="Buscar empresa, área ou cidade"
              aria-label="Buscar empresas"
              className={cn(estiloControle, 'h-11 border-transparent bg-papel pl-10')}
            />
          </div>
          <Selecao aria-label="Área de atuação" value={area} onChange={(e) => definir('area', e.target.value)} className="border-transparent bg-papel">
            <option value="">Todas as áreas</option>
            {(estado.areas ?? []).map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Selecao>
          <label className="flex h-10 cursor-pointer items-center gap-2.5 rounded-md px-3 text-sm font-semibold hover:bg-papel">
            <input type="checkbox" checked={comVagas} onChange={(e) => definir('vagas', e.target.checked ? '1' : '')} className="size-4 accent-vinho" />
            Só empresas com vagas abertas
          </label>
        </div>
      </CabecalhoPagina>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {estado.tipo === 'carregando' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Esqueleto key={i} className="h-64" />
            ))}
          </div>
        )}
        {estado.tipo === 'erro' && <Aviso tipo="erro">{estado.texto}</Aviso>}

        {estado.tipo === 'pronto' && estado.total === 0 && (
          <Vazio>
            <VazioTitulo>Ainda não há empresas na Bloom</VazioTitulo>
            <VazioDescricao>Quando as primeiras empresas se cadastrarem, elas aparecem aqui com as vagas abertas.</VazioDescricao>
            <VazioAcoes>
              <Botao as={Link} to="/empresa/cadastro">
                Cadastrar minha empresa
              </Botao>
            </VazioAcoes>
          </Vazio>
        )}

        {estado.tipo === 'pronto' && estado.total > 0 && (
          <>
            {!filtrando && destaques.length > 0 && (
              <section aria-labelledby="titulo-mosaico" className="mb-16 lg:mb-20">
                <div className="mb-8 flex items-end justify-between gap-4">
                  <h2 id="titulo-mosaico" className="font-display text-3xl text-tinta sm:text-4xl">
                    Contratando agora
                  </h2>
                  <p className="text-sm text-suave">Ordenadas pelo número de vagas abertas</p>
                </div>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {destaques.map((empresa) => (
                    <li key={empresa.id} className="h-full">
                      <CartaoEmpresa empresa={empresa} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="titulo-diretorio">
              <div className="flex items-end justify-between gap-4 border-b-2 border-tinta pb-4">
                <h2 id="titulo-diretorio" className="font-display text-3xl text-tinta">
                  {filtrando ? 'Resultados' : 'Diretório'}
                </h2>
                <p className="text-sm text-suave tabular-nums" aria-live="polite">
                  {lista.length} {lista.length === 1 ? 'empresa' : 'empresas'}
                </p>
              </div>

              {lista.length === 0 ? (
                <Vazio className="mt-8">
                  <VazioTitulo>Nenhuma empresa encontrada</VazioTitulo>
                  <VazioDescricao>Tente outro nome ou remova algum filtro.</VazioDescricao>
                  <VazioAcoes>
                    <Botao variante="secundario" onClick={() => setParametros({}, { replace: true })}>
                      Limpar filtros
                    </Botao>
                  </VazioAcoes>
                </Vazio>
              ) : (
                <ul>
                  {lista.map((empresa) => (
                    <li key={empresa.id} className="border-b border-linha">
                      <Link
                        to={`/empresas/${empresa.id}`}
                        className="group grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3 py-7 sm:grid-cols-[auto_1fr_auto] lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.3fr)_auto] lg:gap-x-10"
                      >
                        <MarcaEmpresa empresa={empresa} tamanho="lg" />
                        <div className="min-w-0">
                          <h3 className="flex flex-wrap items-center gap-2 font-display text-2xl text-tinta transition-colors group-hover:text-vinho sm:text-3xl">
                            {empresa.nome} {empresa.verificada && <SeloVerificada />}
                          </h3>
                          <p className="mt-1 text-sm text-suave">{detalhe(empresa)}</p>
                        </div>
                        <p className="col-span-2 line-clamp-3 text-[15px] leading-relaxed text-tinta-2 sm:col-span-3 lg:col-span-1">
                          {empresa.descricao || 'A empresa ainda não escreveu a apresentação.'}
                        </p>
                        <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:flex-col sm:items-end lg:col-start-4">
                          <span className={cn('rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap', empresa.vagasAbertas ? 'bg-blush text-vinho' : 'bg-papel-2 text-suave')}>
                            {textoVagas(empresa.vagasAbertas)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-tinta group-hover:text-vinho">
                            Ver perfil <Icone nome="seta" tamanho={16} className="transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <p className="mt-10 flex items-start gap-2 text-xs text-suave">
          <Icone nome="info" tamanho={16} className="mt-px shrink-0" />
          Perfis escritos pelas próprias empresas cadastradas na Bloom. O selo "Verificada" indica que o vínculo de quem administra a conta foi confirmado.
        </p>
      </div>
    </Pagina>
  )
}

export default Empresas
