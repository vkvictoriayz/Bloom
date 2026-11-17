import { cn } from '../../lib/cn'

const C = {
  tinta: 'var(--color-tinta)',
  vinho: 'var(--color-vinho)',
  escuro: 'var(--color-vinho-escuro)',
  rosa: 'var(--color-rosa)',
  blush: 'var(--color-blush)',
  papel: 'var(--color-papel)',
  branco: '#ffffff',
}

const traco = { stroke: C.tinta, strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }

function Svg({ className, children, viewBox = '0 0 480 360' }) {
  return (
    <svg viewBox={viewBox} className={cn('h-auto w-full', className)} aria-hidden="true" focusable="false" fill="none">
      {children}
    </svg>
  )
}

function Borboleta({ x, y, escala = 1, cor = C.vinho }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`} fill={cor}>
      <path d="M49.2 45.6C43 30 28 8 5.5 5C3.5 23 20 41 49.2 45.6Z" />
      <path d="M48.6 48.4C40 46.2 31 44.8 23.5 44.6C21 56 26.5 70 35 75.5C40.5 76.5 46 62 48.6 48.4Z" />
      <path d="M50.8 45.6C57 30 72 8 94.5 5C96.5 23 80 41 50.8 45.6Z" />
      <path d="M51.4 48.4C60 46.2 69 44.8 76.5 44.6C79 56 73.5 70 65 75.5C59.5 76.5 54 62 51.4 48.4Z" />
    </g>
  )
}

function Brilho({ x, y, r = 7, cor = C.rosa }) {
  return <path d={`M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z`} fill={cor} />
}

function Folhas({ x, y, escala = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <path d="M0 0V-34" {...traco} />
      <path d="M0 -14C-2 -30 -14 -38 -28 -36C-26 -22 -14 -14 0 -14Z" fill={C.rosa} {...traco} />
      <path d="M0 -24C2 -40 14 -48 28 -46C26 -32 14 -24 0 -24Z" fill={C.blush} {...traco} />
    </g>
  )
}

function Linhas({ x, y, larguras, cor = C.blush, altura = 7, espaco = 13 }) {
  return larguras.map((l, i) => <rect key={i} x={x} y={y + i * espaco} width={l} height={altura} rx={altura / 2} fill={cor} />)
}

export function IlustracaoCodigo({ className }) {
  return (
    <Svg className={className}>
      <circle cx="245" cy="185" r="150" fill={C.blush} />
      <path d="M150 140C110 120 90 150 70 160" stroke={C.rosa} strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" />
      <path d="M340 110C370 100 385 80 390 70" stroke={C.rosa} strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" />
      <path d="M330 215C350 230 360 240 370 248" stroke={C.rosa} strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" />

      <rect x="130" y="88" width="220" height="150" rx="14" fill={C.branco} {...traco} />
      <path d="M130 112H350" {...traco} />
      <circle cx="146" cy="100" r="3.5" fill={C.vinho} />
      <circle cx="158" cy="100" r="3.5" fill={C.rosa} />
      <circle cx="170" cy="100" r="3.5" fill={C.blush} stroke={C.tinta} strokeWidth="1.5" />
      <rect x="150" y="128" width="40" height="8" rx="4" fill={C.vinho} />
      <rect x="196" y="128" width="60" height="8" rx="4" fill={C.rosa} />
      <rect x="166" y="146" width="70" height="8" rx="4" fill={C.blush} />
      <rect x="242" y="146" width="34" height="8" rx="4" fill={C.vinho} />
      <rect x="166" y="164" width="44" height="8" rx="4" fill={C.rosa} />
      <rect x="216" y="164" width="76" height="8" rx="4" fill={C.blush} />
      <rect x="150" y="182" width="52" height="8" rx="4" fill={C.vinho} />
      <rect x="208" y="182" width="12" height="16" rx="2" fill={C.vinho} />
      <Borboleta x={300} y={196} escala={0.32} />
      <path d="M110 238H370L384 258H96Z" fill={C.branco} {...traco} />
      <path d="M210 248H270" {...traco} />

      <rect x="28" y="150" width="122" height="72" rx="14" fill={C.branco} {...traco} />
      <circle cx="56" cy="186" r="15" fill={C.rosa} {...traco} />
      <Linhas x={80} y={174} larguras={[54, 36]} />

      <rect x="330" y="38" width="128" height="66" rx="14" fill={C.branco} {...traco} />
      <rect x="346" y="56" width="30" height="30" rx="9" fill={C.vinho} />
      <path d="M354 66h14v12h-14zM357 66v-3h8v3" stroke={C.branco} strokeWidth="2" strokeLinejoin="round" />
      <Linhas x={384} y={60} larguras={[58, 40]} />

      <path d="M352 236h88a14 14 0 0 1 14 14v26a14 14 0 0 1-14 14h-58l-16 14v-14h-14a14 14 0 0 1-14-14v-26a14 14 0 0 1 14-14Z" fill={C.branco} {...traco} />
      <circle cx="378" cy="263" r="4.5" fill={C.vinho} />
      <circle cx="396" cy="263" r="4.5" fill={C.rosa} />
      <circle cx="414" cy="263" r="4.5" fill={C.rosa} opacity="0.5" />

      <Folhas x={96} y={300} />
      <Brilho x={110} y={70} />
      <Brilho x={412} y={150} r={6} cor={C.vinho} />
      <Brilho x={60} y={262} r={5} />
    </Svg>
  )
}

export function IlustracaoConexoes({ className }) {
  const pessoas = [
    { x: 90, y: 92, cor: C.rosa },
    { x: 390, y: 86, cor: C.vinho },
    { x: 70, y: 254, cor: C.vinho },
    { x: 404, y: 252, cor: C.rosa },
    { x: 240, y: 312, cor: C.blush },
  ]
  return (
    <Svg className={className}>
      <circle cx="240" cy="180" r="148" fill={C.blush} />
      {pessoas.map((p, i) => (
        <path key={`l${i}`} d={`M240 180L${p.x} ${p.y}`} stroke={C.rosa} strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" />
      ))}
      <circle cx="240" cy="180" r="56" fill={C.branco} {...traco} />
      <Borboleta x={208} y={152} escala={0.64} />
      {pessoas.map((p, i) => (
        <g key={`p${i}`}>
          <circle cx={p.x} cy={p.y} r="34" fill={C.branco} {...traco} />
          <circle cx={p.x} cy={p.y - 7} r="10" fill={p.cor} {...traco} />
          <path d={`M${p.x - 17} ${p.y + 21}c3-11 9-16 17-16s14 5 17 16`} fill={p.cor} {...traco} />
        </g>
      ))}
      <rect x="292" y="150" width="96" height="34" rx="17" fill={C.vinho} />
      <path d="M306 167h10M311 162v10" stroke={C.branco} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="324" y="163" width="50" height="8" rx="4" fill={C.branco} opacity="0.85" />
      <Brilho x={160} y={44} />
      <Brilho x={330} y={318} r={6} cor={C.vinho} />
    </Svg>
  )
}

export function IlustracaoCrescimento({ className }) {
  const barras = [
    { x: 118, h: 56, cor: C.blush },
    { x: 172, h: 92, cor: C.rosa },
    { x: 226, h: 128, cor: C.rosa },
    { x: 280, h: 172, cor: C.vinho },
  ]
  return (
    <Svg className={className}>
      <circle cx="240" cy="185" r="150" fill={C.blush} />
      <rect x="86" y="70" width="300" height="230" rx="18" fill={C.branco} {...traco} />
      <path d="M110 270H362" {...traco} />
      {barras.map((b) => (
        <rect key={b.x} x={b.x} y={270 - b.h} width="40" height={b.h} rx="8" fill={b.cor} {...traco} />
      ))}
      <path d="M126 196L192 160L246 128L300 84" stroke={C.escuro} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 9" />
      <circle cx="300" cy="84" r="13" fill={C.branco} {...traco} />
      <path d="M294 84l4 4 8-9" stroke={C.vinho} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="322" y="96" width="118" height="54" rx="14" fill={C.branco} {...traco} />
      <circle cx="346" cy="123" r="11" fill={C.vinho} />
      <path d="M341 123l4 4 6-7" stroke={C.branco} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Linhas x={364} y={113} larguras={[60, 40]} />
      <Folhas x={56} y={300} escala={1.15} />
      <Borboleta x={100} y={88} escala={0.28} />
      <Brilho x={412} y={64} />
      <Brilho x={372} y={250} r={5} cor={C.vinho} />
    </Svg>
  )
}

export function IlustracaoEmpresa({ className }) {
  return (
    <Svg className={className}>
      <circle cx="240" cy="185" r="150" fill={C.blush} />
      <rect x="150" y="70" width="140" height="230" rx="12" fill={C.branco} {...traco} />
      {[0, 1, 2, 3].map((linha) =>
        [0, 1, 2].map((col) => (
          <rect key={`${linha}-${col}`} x={170 + col * 38} y={96 + linha * 42} width="24" height="24" rx="6" fill={(linha + col) % 3 === 0 ? C.rosa : C.blush} {...traco} strokeWidth="2" />
        ))
      )}
      <rect x="204" y="262" width="32" height="38" rx="6" fill={C.vinho} {...traco} />
      <path d="M120 300H320" {...traco} />
      <rect x="292" y="120" width="150" height="76" rx="14" fill={C.branco} {...traco} />
      <rect x="308" y="138" width="40" height="40" rx="12" fill={C.vinho} />
      <path d="M318 152h20v16h-20zM322 152v-4h12v4" stroke={C.branco} strokeWidth="2.2" strokeLinejoin="round" />
      <Linhas x={358} y={144} larguras={[66, 46, 30]} espaco={12} />
      {[
        { x: 70, y: 150, cor: C.vinho },
        { x: 92, y: 236, cor: C.rosa },
      ].map((p) => (
        <g key={p.y}>
          <path d={`M${p.x + 30} ${p.y}C120 ${p.y} 130 ${p.y - 10} 148 ${p.y - 10}`} stroke={C.rosa} strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" />
          <circle cx={p.x} cy={p.y} r="28" fill={C.branco} {...traco} />
          <circle cx={p.x} cy={p.y - 6} r="8.5" fill={p.cor} {...traco} />
          <path d={`M${p.x - 14} ${p.y + 17}c3-9 8-13 14-13s11 4 14 13`} fill={p.cor} {...traco} />
        </g>
      ))}
      <Borboleta x={205} y={36} escala={0.3} />
      <Brilho x={414} y={238} />
      <Brilho x={110} y={70} r={5} cor={C.vinho} />
    </Svg>
  )
}
