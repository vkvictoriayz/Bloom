import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import Icone from '../Icone'
import { cn } from '../../lib/cn'

import { CORES } from './cores'

const diaCurto = (iso) => {
  const [, m, d] = String(iso).split('-')
  return `${d}/${m}`
}

const porcento = (parte, total) => (total ? Math.round((parte / total) * 100) : 0)

function useLargura() {
  const ref = useRef(null)
  const [largura, setLargura] = useState(0)
  useLayoutEffect(() => {
    if (!ref.current) return undefined
    const medir = () => setLargura(ref.current?.clientWidth ?? 0)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(ref.current)
    return () => observador.disconnect()
  }, [])
  return [ref, largura]
}

function escalaBonita(maximo) {
  if (maximo <= 4) return 4
  const passo = 10 ** Math.floor(Math.log10(maximo))
  for (const m of [1, 2, 2.5, 5, 10]) if (m * passo >= maximo) return m * passo
  return 10 * passo
}

export function Legenda({ itens }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-tinta-2">
      {itens.map((i) => (
        <li key={i.nome} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: i.cor }} />
          {i.nome}
          {i.valor !== undefined && <span className="font-semibold text-tinta tabular-nums">{i.valor}</span>}
        </li>
      ))}
    </ul>
  )
}

function rotulosDoEixo(dias, largura) {
  const cabem = Math.max(2, Math.floor(largura / 64))
  const passo = Math.max(1, Math.ceil(dias.length / cabem))
  const lista = dias.map((d, i) => ({ d, i })).filter(({ i }) => i % passo === 0)
  const ultimo = dias.length - 1
  if (lista.at(-1)?.i !== ultimo) {
    if (lista.length && ultimo - lista.at(-1).i < passo * 0.6) lista.pop()
    lista.push({ d: dias[ultimo], i: ultimo })
  }
  return lista
}

export function GraficoLinhas({ dias, series, altura = 220, titulo, legenda = 'soma' }) {
  const [ref, largura] = useLargura()
  const [foco, setFoco] = useState(null)
  const margem = { topo: 12, direita: 22, base: 26, esquerda: 32 }
  const maximo = escalaBonita(Math.max(1, ...series.flatMap((s) => s.valores)))
  const w = Math.max(0, largura - margem.esquerda - margem.direita)
  const h = altura - margem.topo - margem.base
  const x = (i) => margem.esquerda + (dias.length > 1 ? (i / (dias.length - 1)) * w : w / 2)
  const y = (v) => margem.topo + h - (v / maximo) * h
  const marcas = [0, maximo / 2, maximo]
  const passoX = dias.length > 1 ? w / (dias.length - 1) : w
  const rotulosX = rotulosDoEixo(dias, largura - margem.esquerda - margem.direita)

  return (
    <figure>
      <Legenda itens={series.map((s) => ({ nome: s.nome, cor: s.cor, valor: legenda === 'ultimo' ? s.valores.at(-1) : s.valores.reduce((a, b) => a + b, 0) }))} />
      <div ref={ref} className="relative mt-3" style={{ height: altura }} onMouseLeave={() => setFoco(null)}>
        {largura > 0 && (
          <svg width={largura} height={altura} role="img" aria-label={titulo}>
            {marcas.map((m) => (
              <g key={m}>
                <line x1={margem.esquerda} x2={largura - margem.direita} y1={y(m)} y2={y(m)} stroke="var(--color-linha)" strokeDasharray={m === 0 ? undefined : '3 4'} />
                <text x={margem.esquerda - 8} y={y(m)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--color-suave)" className="tabular-nums">
                  {Number.isInteger(m) ? m : m.toFixed(1)}
                </text>
              </g>
            ))}
            {rotulosX.map(({ d, i }) => (
              <text key={d} x={x(i)} y={altura - 6} textAnchor="middle" fontSize="11" fill="var(--color-suave)" className="tabular-nums">
                {diaCurto(d)}
              </text>
            ))}
            {foco !== null && <line x1={x(foco)} x2={x(foco)} y1={margem.topo} y2={margem.topo + h} stroke="var(--color-linha-forte)" strokeWidth="1" />}
            {series.map((s) => (
              <polyline
                key={s.nome}
                fill="none"
                stroke={s.cor}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={s.valores.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
              />
            ))}
            {dias.length <= 31 &&
              series.map((s) =>
                s.valores.map((v, i) => (foco === i ? null : <circle key={`${s.nome}-${i}`} cx={x(i)} cy={y(v)} r="2.5" fill={s.cor} />))
              )}
            {foco !== null &&
              series.map((s) => <circle key={s.nome} cx={x(foco)} cy={y(s.valores[foco])} r="4.5" fill={s.cor} stroke="var(--color-branco)" strokeWidth="2" />)}
            {dias.map((d, i) => (
              <rect key={d} x={x(i) - passoX / 2} y={margem.topo} width={Math.max(passoX, 8)} height={h} fill="transparent" onMouseEnter={() => setFoco(i)} />
            ))}
          </svg>
        )}
        {foco !== null && (
          <div
            className="pointer-events-none absolute top-1 z-10 w-44 rounded-lg border border-linha bg-branco p-2.5 text-xs shadow-lg"
            style={x(foco) > largura / 2 ? { right: largura - x(foco) + 12 } : { left: x(foco) + 12 }}
          >
            <p className="mb-1.5 font-semibold text-tinta">{diaCurto(dias[foco])}</p>
            <ul className="flex flex-col gap-1">
              {series.map((s) => (
                <li key={s.nome} className="flex items-center justify-between gap-2 text-tinta-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full" style={{ background: s.cor }} />
                    {s.nome}
                  </span>
                  <span className="font-semibold text-tinta tabular-nums">{s.valores[foco]}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th>Dia</th>
            {series.map((s) => (
              <th key={s.nome}>{s.nome}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dias.map((d, i) => (
            <tr key={d}>
              <td>{diaCurto(d)}</td>
              {series.map((s) => (
                <td key={s.nome}>{s.valores[i]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

export function BarrasRanking({ itens, cor = CORES[0], vazio = 'Sem dados ainda.', unidade }) {
  const [foco, setFoco] = useState(null)
  if (!itens.length || itens.every((i) => !i.total)) return <p className="text-sm text-suave">{vazio}</p>
  const maximo = Math.max(...itens.map((i) => i.total), 1)
  const soma = itens.reduce((a, i) => a + i.total, 0)
  return (
    <ul className="flex flex-col gap-3">
      {itens.map((item, i) => (
        <li key={item.rotulo} onMouseEnter={() => setFoco(i)} onMouseLeave={() => setFoco(null)} className="cursor-default">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-tinta-2" title={item.rotulo}>
              {item.rotulo}
            </span>
            <span className="shrink-0 font-semibold text-tinta tabular-nums">
              {item.total}
              {unidade && <span className="font-normal text-suave"> {unidade}</span>}
              {foco === i && <span className="ml-1.5 font-normal text-suave">· {porcento(item.total, soma)}%</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-[4px] bg-papel-2">
            <div
              className="h-full rounded-[4px] transition-opacity"
              style={{ width: item.total ? `${Math.max(3, (item.total / maximo) * 100)}%` : 0, background: cor, opacity: foco === null || foco === i ? 1 : 0.45 }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function BarraPartes({ partes, vazio = 'Sem dados ainda.', rotulo }) {
  const [foco, setFoco] = useState(null)
  const total = partes.reduce((a, p) => a + p.total, 0)
  if (!total) return <p className="text-sm text-suave">{vazio}</p>
  const visiveis = partes.filter((p) => p.total > 0)
  return (
    <figure>
      {rotulo && <figcaption className="mb-1.5 flex justify-between text-xs text-suave"><span>{rotulo}</span><span className="tabular-nums">{total}</span></figcaption>}
      <div className="relative flex h-3 gap-[2px]" role="img" aria-label={visiveis.map((p) => `${p.rotulo}: ${p.total}`).join(', ')}>
        {visiveis.map((p, i) => (
          <div
            key={p.rotulo}
            onMouseEnter={() => setFoco(i)}
            onMouseLeave={() => setFoco(null)}
            className={`h-full transition-opacity ${i === 0 ? 'rounded-l-[4px]' : ''} ${i === visiveis.length - 1 ? 'rounded-r-[4px]' : ''}`}
            style={{ flexGrow: p.total, flexBasis: 0, minWidth: 6, background: p.cor, opacity: foco === null || foco === i ? 1 : 0.4 }}
          />
        ))}
        {foco !== null && (
          <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-linha bg-branco px-2 py-1 text-xs text-tinta shadow">
            {visiveis[foco].rotulo}: <strong className="tabular-nums">{visiveis[foco].total}</strong> ({porcento(visiveis[foco].total, total)}%)
          </div>
        )}
      </div>
      <div className="mt-2.5">
        <Legenda itens={visiveis.map((p) => ({ nome: p.rotulo, cor: p.cor, valor: `${porcento(p.total, total)}%` }))} />
      </div>
    </figure>
  )
}

export function Cartao({ titulo, descricao, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-linha bg-branco p-6 ${className}`}>
      <h2 className="font-display text-xl text-tinta">{titulo}</h2>
      {descricao && <p className="mt-1 text-xs text-suave">{descricao}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function GraficoBarras({ grupos, titulos, series, altura = 220, titulo }) {
  const [ref, largura] = useLargura()
  const [foco, setFoco] = useState(null)
  const margem = { topo: 12, direita: 8, base: 26, esquerda: 32 }
  const maximo = escalaBonita(Math.max(1, ...series.flatMap((s) => s.valores)))
  const w = Math.max(0, largura - margem.esquerda - margem.direita)
  const h = altura - margem.topo - margem.base
  const banda = grupos.length ? w / grupos.length : w
  const barra = Math.max(3, Math.min(18, (banda * 0.7) / series.length - 2))
  const y = (v) => margem.topo + h - (v / maximo) * h
  const passoRotulo = Math.max(1, Math.ceil(grupos.length / Math.max(2, Math.floor(w / 56))))

  return (
    <figure>
      <Legenda itens={series.map((s) => ({ nome: s.nome, cor: s.cor, valor: s.valores.reduce((a, b) => a + b, 0) }))} />
      <div ref={ref} className="relative mt-3" style={{ height: altura }} onMouseLeave={() => setFoco(null)}>
        {largura > 0 && (
          <svg width={largura} height={altura} role="img" aria-label={titulo}>
            {[0, maximo / 2, maximo].map((m) => (
              <g key={m}>
                <line x1={margem.esquerda} x2={largura - margem.direita} y1={y(m)} y2={y(m)} stroke="var(--color-linha)" strokeDasharray={m === 0 ? undefined : '3 4'} />
                <text x={margem.esquerda - 8} y={y(m)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--color-suave)">
                  {Number.isInteger(m) ? m : m.toFixed(1)}
                </text>
              </g>
            ))}
            {grupos.map((g, i) => {
              const x0 = margem.esquerda + i * banda + (banda - (barra + 2) * series.length) / 2
              return (
                <g key={`${g}-${i}`} onMouseEnter={() => setFoco(i)}>
                  <rect x={margem.esquerda + i * banda} y={margem.topo} width={banda} height={h} fill={foco === i ? 'var(--color-papel-2)' : 'transparent'} />
                  {series.map((s, k) => {
                    const v = s.valores[i]
                    const topo = y(v)
                    const alturaBarra = Math.max(v ? 2 : 0, margem.topo + h - topo)
                    return alturaBarra ? (
                      <path
                        key={s.nome}
                        d={`M${x0 + k * (barra + 2)},${margem.topo + h} v${-(alturaBarra - Math.min(4, alturaBarra))} q0,-${Math.min(4, alturaBarra)} ${Math.min(4, barra / 2)},-${Math.min(4, alturaBarra)} h${barra - 2 * Math.min(4, barra / 2)} q${Math.min(4, barra / 2)},0 ${Math.min(4, barra / 2)},${Math.min(4, alturaBarra)} v${alturaBarra - Math.min(4, alturaBarra)} z`}
                        fill={s.cor}
                      />
                    ) : null
                  })}
                  {i % passoRotulo === 0 && (
                    <text x={margem.esquerda + i * banda + banda / 2} y={altura - 6} textAnchor="middle" fontSize="11" fill="var(--color-suave)">
                      {g}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        )}
        {foco !== null && (
          <div
            className="pointer-events-none absolute top-1 z-10 w-48 rounded-lg border border-linha bg-branco p-2.5 text-xs shadow-lg"
            style={margem.esquerda + foco * banda > largura / 2 ? { right: largura - (margem.esquerda + foco * banda) + 8 } : { left: margem.esquerda + (foco + 1) * banda + 8 }}
          >
            <p className="mb-1.5 font-semibold text-tinta">{titulos[foco]}</p>
            <ul className="flex flex-col gap-1">
              {series.map((s) => (
                <li key={s.nome} className="flex items-center justify-between gap-2 text-tinta-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true" className="inline-block h-2 w-2 rounded-[2px]" style={{ background: s.cor }} />
                    {s.nome}
                  </span>
                  <span className="font-semibold text-tinta tabular-nums">{s.valores[foco]}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th>Período</th>
            {series.map((s) => (
              <th key={s.nome}>{s.nome}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grupos.map((g, i) => (
            <tr key={`${g}-${i}`}>
              <td>{titulos[i]}</td>
              {series.map((s) => (
                <td key={s.nome}>{s.valores[i]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

export function Rosca({ partes, centro, rotuloCentro, vazio = 'Sem dados ainda.' }) {
  const [foco, setFoco] = useState(null)
  const total = partes.reduce((a, p) => a + p.total, 0)
  if (!total) return <p className="text-sm text-suave">{vazio}</p>
  const raio = 52
  const espessura = 16
  const volta = 2 * Math.PI * raio
  const folga = partes.filter((p) => p.total).length > 1 ? 3 : 0
  const comprimentos = partes.map((p) => (p.total / total) * volta)
  const arcos = partes.map((p, i) => ({
    ...p,
    i,
    inicio: comprimentos.slice(0, i).reduce((s, v) => s + v, 0),
    comprimento: Math.max(0, comprimentos[i] - folga),
  }))
  const ativo = foco !== null ? partes[foco] : null
  return (
    <div className="flex flex-col items-center gap-5">
      <svg viewBox="0 0 140 140" className="size-44 shrink-0" role="img" aria-label={partes.map((p) => `${p.rotulo}: ${p.total}`).join(', ')}>
        <circle cx="70" cy="70" r={raio} fill="none" stroke="var(--color-papel-2)" strokeWidth={espessura} />
        {arcos.map((a) =>
          a.total ? (
            <circle
              key={a.rotulo}
              cx="70"
              cy="70"
              r={raio}
              fill="none"
              stroke={a.cor}
              strokeWidth={foco === a.i ? espessura + 4 : espessura}
              strokeDasharray={`${a.comprimento} ${volta}`}
              strokeDashoffset={-a.inicio}
              transform="rotate(-90 70 70)"
              onMouseEnter={() => setFoco(a.i)}
              onMouseLeave={() => setFoco(null)}
              className="cursor-default transition-[stroke-width]"
            />
          ) : null
        )}
        <text x="70" y="66" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--color-tinta)" className="tabular-nums">
          {ativo ? ativo.total : (centro ?? total)}
        </text>
        <text x="70" y="84" textAnchor="middle" fontSize="10" fill="var(--color-suave)">
          {ativo ? `${porcento(ativo.total, total)}% · ${ativo.rotulo}`.slice(0, 26) : rotuloCentro}
        </text>
      </svg>
      <ul className="flex w-full flex-col gap-2 text-sm">
        {partes.map((p, i) => (
          <li key={p.rotulo} onMouseEnter={() => setFoco(i)} onMouseLeave={() => setFoco(null)} className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1 ${foco === i ? 'bg-papel' : ''}`}>
            <span className="inline-flex min-w-0 items-center gap-2 text-tinta-2">
              <span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-[3px]" style={{ background: p.cor }} />
              <span className="truncate">{p.rotulo}</span>
            </span>
            <span className="shrink-0 font-semibold text-tinta tabular-nums">
              {p.total} <span className="font-normal text-suave">· {porcento(p.total, total)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Tendencia({ atual, anterior, rotulo = 'vs. período anterior' }) {
  if (anterior === undefined || anterior === null) return null
  if (!anterior && !atual) return <span className="text-xs text-suave">Sem movimento no período</span>
  if (!anterior) return <span className="text-xs font-semibold text-sucesso">Novo no período</span>
  const variacao = Math.round(((atual - anterior) / anterior) * 100)
  const subiu = variacao > 0
  const igual = variacao === 0
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${igual ? 'text-suave' : subiu ? 'text-sucesso' : 'text-erro'}`}>
      <svg viewBox="0 0 10 10" className={`size-2.5 ${igual ? 'hidden' : subiu ? '' : 'rotate-180'}`} aria-hidden="true">
        <path d="M5 1.5 9 7.5H1z" fill="currentColor" />
      </svg>
      {igual ? 'Estável' : `${subiu ? '+' : ''}${variacao}%`}
      <span className="font-normal text-suave">{rotulo}</span>
    </span>
  )
}

export function Faisca({ valores, cor = '#85243d' }) {
  if (!valores?.length || valores.every((v) => !v)) return null
  const maximo = Math.max(...valores, 1)
  const pontos = valores.map((v, i) => `${valores.length > 1 ? (i / (valores.length - 1)) * 100 : 50},${30 - (v / maximo) * 26 - 2}`).join(' ')
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline points={pontos} fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function Indicador({ icone, rotulo, valor, detalhe, tendencia, faisca, para }) {
  const conteudo = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blush text-vinho" aria-hidden="true">
          <Icone nome={icone} tamanho={20} />
        </span>
        {para && <Icone nome="seta" tamanho={16} className="text-suave transition-transform group-hover:translate-x-0.5" />}
      </div>
      <p className="mt-4 text-sm font-semibold text-tinta-2">{rotulo}</p>
      <p className="mt-0.5 font-display text-3xl leading-tight text-tinta tabular-nums">{valor}</p>
      <div className="mt-1 min-h-5">{tendencia}</div>
      {detalhe && <p className="text-xs text-suave">{detalhe}</p>}
      {faisca && <div className="mt-3">{faisca}</div>}
    </>
  )
  const estilo = 'group flex h-full min-w-0 flex-col rounded-2xl border border-linha bg-branco p-4 sm:p-5'
  return para ? (
    <Link to={para} className={cn(estilo, 'transition-colors hover:border-vinho/40')}>
      {conteudo}
    </Link>
  ) : (
    <div className={estilo}>{conteudo}</div>
  )
}
