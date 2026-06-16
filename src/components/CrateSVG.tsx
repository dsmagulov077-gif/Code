// SVG-ящики трёх размеров и мини-бадди, выпрыгивающий при разбитии.

/* ── Маленький ящик (52×52) ──────────────────────────────── */
export function CrateSmall() {
  return (
    <svg viewBox="0 0 52 52" width={52} height={52} xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 3px 7px rgba(0,0,0,0.42))' }}>
      {/* Тело */}
      <rect x={1} y={1} width={50} height={50} rx={3} fill="#D4A030" stroke="#3A2010" strokeWidth={2} />
      {/* Волокна дерева */}
      {[7,12,17,22,27,32,37,42,47].map(y => (
        <line key={y} x1={2} y1={y} x2={50} y2={y} stroke="#B87820" strokeWidth={0.9} opacity={0.38} />
      ))}
      {/* Разделители досок */}
      <line x1={1}  y1={17} x2={51} y2={17} stroke="#3A2010" strokeWidth={1.5} />
      <line x1={1}  y1={35} x2={51} y2={35} stroke="#3A2010" strokeWidth={1.5} />
      <line x1={26} y1={1}  x2={26} y2={51} stroke="#3A2010" strokeWidth={1.5} />
      {/* Угловые скобы */}
      <rect x={1}  y={1}  width={9} height={9} rx={1} fill="#8A8A8A" stroke="#3A3A3A" strokeWidth={0.8} />
      <rect x={42} y={1}  width={9} height={9} rx={1} fill="#8A8A8A" stroke="#3A3A3A" strokeWidth={0.8} />
      <rect x={1}  y={42} width={9} height={9} rx={1} fill="#8A8A8A" stroke="#3A3A3A" strokeWidth={0.8} />
      <rect x={42} y={42} width={9} height={9} rx={1} fill="#8A8A8A" stroke="#3A3A3A" strokeWidth={0.8} />
      {/* Блики скоб */}
      <line x1={2}  y1={3} x2={9}  y2={3} stroke="#C8C8C8" strokeWidth={1} />
      <line x1={43} y1={3} x2={50} y2={3} stroke="#C8C8C8" strokeWidth={1} />
      {/* Гвозди */}
      <circle cx={26} cy={17} r={2.5} fill="#4A3010" stroke="#222" strokeWidth={0.7} />
      <circle cx={26} cy={35} r={2.5} fill="#4A3010" stroke="#222" strokeWidth={0.7} />
      {/* Блик верха */}
      <rect x={3} y={3} width={46} height={4} rx={1} fill="#FFF" opacity={0.07} />
    </svg>
  );
}

/* ── Средний ящик (70×70) ────────────────────────────────── */
export function CrateMedium() {
  return (
    <svg viewBox="0 0 70 70" width={70} height={70} xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 4px 9px rgba(0,0,0,0.42))' }}>
      {/* Тело */}
      <rect x={1} y={1} width={68} height={68} rx={4} fill="#C08820" stroke="#3A2010" strokeWidth={2} />
      {/* Волокна */}
      {[8,14,20,26,32,38,44,50,56,62].map(y => (
        <line key={y} x1={2} y1={y} x2={68} y2={y} stroke="#A87018" strokeWidth={1} opacity={0.35} />
      ))}
      {/* Доски */}
      <line x1={1}  y1={23} x2={69} y2={23} stroke="#3A2010" strokeWidth={1.5} />
      <line x1={1}  y1={47} x2={69} y2={47} stroke="#3A2010" strokeWidth={1.5} />
      <line x1={35} y1={1}  x2={35} y2={69} stroke="#3A2010" strokeWidth={1.5} />
      {/* Металлическое X-крепление */}
      <line x1={2}  y1={2}  x2={68} y2={68} stroke="#7A7A7A" strokeWidth={4.5} opacity={0.3} />
      <line x1={68} y1={2}  x2={2}  y2={68} stroke="#7A7A7A" strokeWidth={4.5} opacity={0.3} />
      {/* Угловые скобы */}
      <rect x={1}  y={1}  width={11} height={11} rx={1} fill="#8A8A8A" stroke="#3A3A3A" strokeWidth={0.9} />
      <rect x={58} y={1}  width={11} height={11} rx={1} fill="#8A8A8A" stroke="#3A3A3A" strokeWidth={0.9} />
      <rect x={1}  y={58} width={11} height={11} rx={1} fill="#8A8A8A" stroke="#3A3A3A" strokeWidth={0.9} />
      <rect x={58} y={58} width={11} height={11} rx={1} fill="#8A8A8A" stroke="#3A3A3A" strokeWidth={0.9} />
      {/* Блики скоб */}
      <line x1={2}  y1={4} x2={11}  y2={4} stroke="#C8C8C8" strokeWidth={1.2} />
      <line x1={59} y1={4} x2={68}  y2={4} stroke="#C8C8C8" strokeWidth={1.2} />
      {/* Гвозди */}
      <circle cx={35} cy={23} r={3}   fill="#4A3010" stroke="#222" strokeWidth={0.8} />
      <circle cx={35} cy={47} r={3}   fill="#4A3010" stroke="#222" strokeWidth={0.8} />
      {/* Центральный болт */}
      <circle cx={35} cy={35} r={4}   fill="#7A7A7A" stroke="#3A3A3A" strokeWidth={1} />
      <circle cx={35} cy={35} r={2}   fill="#555" />
      <line x1={33} y1={35} x2={37} y2={35} stroke="#9A9A9A" strokeWidth={1} />
      <line x1={35} y1={33} x2={35} y2={37} stroke="#9A9A9A" strokeWidth={1} />
      {/* Блик */}
      <rect x={3} y={3} width={64} height={5} rx={2} fill="#FFF" opacity={0.07} />
    </svg>
  );
}

/* ── Большой ящик (88×88) ────────────────────────────────── */
export function CrateLarge() {
  return (
    <svg viewBox="0 0 88 88" width={88} height={88} xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 5px 12px rgba(0,0,0,0.45))' }}>
      {/* Тело */}
      <rect x={1} y={1} width={86} height={86} rx={5} fill="#A87018" stroke="#3A2010" strokeWidth={2.5} />
      {/* Волокна */}
      {[9,15,21,27,33,39,45,51,57,63,69,75,81].map(y => (
        <line key={y} x1={2} y1={y} x2={86} y2={y} stroke="#8A5C12" strokeWidth={1} opacity={0.32} />
      ))}
      {/* Доски */}
      <line x1={1}  y1={28} x2={87} y2={28} stroke="#3A2010" strokeWidth={1.5} />
      <line x1={1}  y1={58} x2={87} y2={58} stroke="#3A2010" strokeWidth={1.5} />
      <line x1={44} y1={1}  x2={44} y2={87} stroke="#3A2010" strokeWidth={1.5} />
      {/* Горизонтальные металлические полосы */}
      <rect x={1} y={26} width={86} height={4} fill="#7A7A7A" stroke="#3A3A3A" strokeWidth={0.5} />
      <rect x={1} y={56} width={86} height={4} fill="#7A7A7A" stroke="#3A3A3A" strokeWidth={0.5} />
      <line x1={2} y1={27} x2={86} y2={27} stroke="#C0C0C0" strokeWidth={0.8} />
      <line x1={2} y1={57} x2={86} y2={57} stroke="#C0C0C0" strokeWidth={0.8} />
      {/* Заклёпки на полосах */}
      {[10, 22, 34, 54, 66, 78].map(x => (
        <circle key={x} cx={x} cy={28} r={2.5} fill="#555" stroke="#333" strokeWidth={0.5} />
      ))}
      {[10, 22, 34, 54, 66, 78].map(x => (
        <circle key={`b${x}`} cx={x} cy={58} r={2.5} fill="#555" stroke="#333" strokeWidth={0.5} />
      ))}
      {/* Тяжёлые угловые пластины */}
      <rect x={1}  y={1}  width={14} height={14} rx={2} fill="#7A7A7A" stroke="#3A3A3A" strokeWidth={1} />
      <rect x={73} y={1}  width={14} height={14} rx={2} fill="#7A7A7A" stroke="#3A3A3A" strokeWidth={1} />
      <rect x={1}  y={73} width={14} height={14} rx={2} fill="#7A7A7A" stroke="#3A3A3A" strokeWidth={1} />
      <rect x={73} y={73} width={14} height={14} rx={2} fill="#7A7A7A" stroke="#3A3A3A" strokeWidth={1} />
      {/* Болты в пластинах */}
      {([[ 5, 5],[12, 5],[ 5,12],[83, 5],[76, 5],[83,12],
          [ 5,83],[12,83],[ 5,76],[83,83],[76,83],[83,76]
        ] as [number, number][]).map(([x,y]) => (
        <circle key={`${x}_${y}`} cx={x} cy={y} r={2} fill="#3A3A3A" />
      ))}
      {/* Блики пластин */}
      <line x1={2}  y1={4} x2={14}  y2={4} stroke="#C0C0C0" strokeWidth={1.3} />
      <line x1={74} y1={4} x2={86}  y2={4} stroke="#C0C0C0" strokeWidth={1.3} />
      {/* Замок (по центру) */}
      <rect x={36} y={36} width={16} height={14} rx={3} fill="#6A6A6A" stroke="#333" strokeWidth={1.5} />
      <path d="M39 36 Q39 31 44 31 Q49 31 49 36" fill="none" stroke="#555" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={44} cy={42} r={2.5} fill="#333" />
      <rect x={42.5} y={42} width={3} height={5} rx={1} fill="#333" />
      <rect x={37} y={37} width={14} height={3} rx={1} fill="#FFF" opacity={0.1} />
      {/* Жёлтая предупреждающая полоска */}
      <rect x={1} y={1} width={86} height={7} rx={3} fill="#FFD700" opacity={0.22} />
      {/* Блик верха */}
      <rect x={3} y={3} width={82} height={6} rx={2} fill="#FFF" opacity={0.07} />
    </svg>
  );
}

/* ── Мини-бадди (выпрыгивает из ящика) ──────────────────── */
export function MiniBuddy({ size }: { size: 'small' | 'medium' | 'large' }) {
  const s = size === 'small' ? 0.55 : size === 'medium' ? 0.7 : 0.85;
  return (
    <svg
      viewBox="0 0 40 60"
      width={Math.round(40 * s)}
      height={Math.round(60 * s)}
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
    >
      {/* Тело */}
      <ellipse cx={20} cy={46} rx={13} ry={12} fill="#70B8E0" stroke="#4A88BB" strokeWidth={1} />
      {/* Звезда */}
      <polygon
        points="20,38 21.6,43 27,43 22.6,46.2 24.2,51.2 20,48.2 15.8,51.2 17.4,46.2 13,43 18.4,43"
        fill="#FFF" opacity={0.75}
      />
      {/* Голова */}
      <circle cx={20} cy={20} r={16} fill="#C8966A" stroke="#A07040" strokeWidth={1} />
      {/* Уши */}
      <circle cx={5.5}  cy={20} r={4.5} fill="#C8966A" stroke="#A07040" strokeWidth={0.8} />
      <circle cx={34.5} cy={20} r={4.5} fill="#C8966A" stroke="#A07040" strokeWidth={0.8} />
      {/* Глаза */}
      <circle cx={13} cy={18} r={4.5} fill="#FFF" />
      <circle cx={27} cy={18} r={4.5} fill="#FFF" />
      <circle cx={14} cy={19} r={2.2} fill="#1C0C00" />
      <circle cx={28} cy={19} r={2.2} fill="#1C0C00" />
      <circle cx={13} cy={17} r={1.1} fill="#FFF" opacity={0.75} />
      <circle cx={27} cy={17} r={1.1} fill="#FFF" opacity={0.75} />
      {/* Улыбка */}
      <path d="M13 26 Q20 33 27 26" fill="none" stroke="#1C0C00" strokeWidth={1.5} strokeLinecap="round" />
      {/* Румяна */}
      <circle cx={8}  cy={25} r={4} fill="#e8907a" opacity={0.3} />
      <circle cx={32} cy={25} r={4} fill="#e8907a" opacity={0.3} />
    </svg>
  );
}
