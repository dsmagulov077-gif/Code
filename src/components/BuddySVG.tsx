// Ragdoll-персонаж: каждая часть тела — отдельный motion.g,
// который качается вокруг своей точки крепления к туловищу.
// transformBox: fill-box + transformOrigin = точный пивот внутри SVG-координат.

import { motion } from 'framer-motion';

type Props = { hp: number; fainted: boolean };

// Плавное маятниковое качание — повторяется бесконечно
const swing = (duration: number, delay = 0) => ({
  repeat: Infinity,
  repeatType: 'loop' as const,
  duration,
  ease: 'easeInOut' as const,
  delay,
});

// Обмякание при нокауте
const limp = { duration: 0.4, ease: 'easeOut' as const };

export function BuddySVG({ hp, fainted }: Props) {
  const skin   = '#C8966A';
  const skinHi = '#E0B488';
  const skinLo = '#A07040';
  const bodyHi = '#90C4E8';
  const bodyLo = '#4A80B8';
  const ink    = '#1C0C00';

  // Выражение лица в зависимости от HP
  let leftEye:  JSX.Element;
  let rightEye: JSX.Element;
  let mouth:    JSX.Element;

  if (fainted) {
    leftEye  = <SpiralEye cx={47} cy={48} />;
    rightEye = <SpiralEye cx={73} cy={48} />;
    mouth    = <ellipse cx={60} cy={65} rx={9} ry={6} fill={ink} opacity={0.75} />;
  } else if (hp > 70) {
    leftEye  = <DotEye cx={47} cy={48} />;
    rightEye = <DotEye cx={73} cy={48} />;
    mouth    = <path d="M51 63 Q60 72 69 63" fill="none" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />;
  } else if (hp > 40) {
    leftEye  = <DotEye cx={47} cy={48} />;
    rightEye = <DotEye cx={73} cy={48} />;
    mouth    = <line x1={53} y1={65} x2={67} y2={65} stroke={ink} strokeWidth={2} strokeLinecap="round" />;
  } else if (hp > 15) {
    leftEye  = <XEye cx={47} cy={48} />;
    rightEye = <XEye cx={73} cy={48} />;
    mouth    = <path d="M51 68 Q60 61 69 68" fill="none" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />;
  } else {
    leftEye  = <XEye cx={47} cy={48} size={9} />;
    rightEye = <XEye cx={73} cy={48} size={9} />;
    mouth = (
      <>
        <path d="M49 64 Q60 75 71 64" fill="none" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
        {[52, 57, 62, 67].map((x) => (
          <rect key={x} x={x} y={64} width={4} height={6} rx={1} fill="#fff" stroke={ink} strokeWidth={0.8} />
        ))}
      </>
    );
  }

  return (
    <svg
      viewBox="0 0 120 220"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: 120,
        height: 210,
        overflow: 'visible',
        filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.28))',
      }}
    >
      <defs>
        <pattern id="tex" patternUnits="userSpaceOnUse" width="5" height="5">
          <rect width="5" height="5" fill={skin} />
          <circle cx="1.2" cy="1.2" r="0.7" fill={skinLo} opacity="0.28" />
          <circle cx="3.7" cy="3.7" r="0.7" fill={skinLo} opacity="0.28" />
        </pattern>
        <radialGradient id="gHead" cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor={skinHi} />
          <stop offset="100%" stopColor={skinLo} />
        </radialGradient>
        <radialGradient id="gLimb" cx="34%" cy="28%" r="68%">
          <stop offset="0%" stopColor={skinHi} />
          <stop offset="100%" stopColor={skinLo} />
        </radialGradient>
        <radialGradient id="gBody" cx="32%" cy="22%" r="72%">
          <stop offset="0%" stopColor={bodyHi} />
          <stop offset="100%" stopColor={bodyLo} />
        </radialGradient>
      </defs>

      {/* ── Левая ступня ──
          fill-box: x=16..60, y=188..216 → центр top = (38, 188)
          Качается как маятник, прикреплённый снизу туловища */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'center top' }}
        animate={fainted
          ? { rotate: -40 }
          : { rotate: [-12, 10, -12] }}
        transition={fainted ? limp : swing(1.8, 0.3)}
      >
        <ellipse cx={38} cy={202} rx={22} ry={14} fill="url(#gLimb)" stroke={skinLo} strokeWidth={1.5} />
      </motion.g>

      {/* ── Правая ступня ──
          fill-box: x=60..104, y=188..216 → центр top = (82, 188) */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'center top' }}
        animate={fainted
          ? { rotate: 40 }
          : { rotate: [12, -10, 12] }}
        transition={fainted ? limp : swing(1.65)}
      >
        <ellipse cx={82} cy={202} rx={22} ry={14} fill="url(#gLimb)" stroke={skinLo} strokeWidth={1.5} />
      </motion.g>

      {/* ── Левая рука ──
          fill-box: x=-7..33, y=108..140 → right center = (33, 124)
          Пивот — правый край руки, т.е. плечевой сустав у туловища */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'right center' }}
        animate={fainted
          ? { rotate: -85 }
          : { rotate: [-16, 10, -16] }}
        transition={fainted ? limp : swing(2.2, 0.15)}
      >
        <ellipse cx={13} cy={124} rx={20} ry={16} fill="url(#gLimb)" stroke={skinLo} strokeWidth={1.5} />
      </motion.g>

      {/* ── Правая рука ──
          fill-box: x=87..127, y=108..140 → left center = (87, 124) */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'left center' }}
        animate={fainted
          ? { rotate: 85 }
          : { rotate: [16, -10, 16] }}
        transition={fainted ? limp : swing(2.0, 0.4)}
      >
        <ellipse cx={107} cy={124} rx={20} ry={16} fill="url(#gLimb)" stroke={skinLo} strokeWidth={1.5} />
      </motion.g>

      {/* ── Туловище (синее яйцо) ── чуть покачивается вверх-вниз */}
      <motion.g
        animate={fainted
          ? { y: 6 }
          : { y: [-2, 2, -2] }}
        transition={fainted ? limp : swing(2.4)}
      >
        <ellipse cx={60} cy={142} rx={34} ry={44} fill="url(#gBody)" stroke={bodyLo} strokeWidth={2} />
        <ellipse
          cx={60} cy={142} rx={34} ry={44}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.4}
          strokeDasharray="5 3.5"
        />
        <StarShape cx={60} cy={136} r={17} />
      </motion.g>

      {/* Тень от головы (статичная, не качается) */}
      <ellipse cx={60} cy={100} rx={32} ry={5} fill="rgba(0,0,0,0.07)" />

      {/* ── Голова ──
          fill-box с шеей: x=10..110, y=12..98 → center bottom = (60, 98)
          Пивот — низ шеи, т.е. соединение с туловищем */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}
        animate={fainted
          ? { rotate: -24, y: 5 }
          : { rotate: [-8, 8, -8] }}
        transition={fainted ? limp : swing(2.0, 0.2)}
      >
        {/* Шея */}
        <rect x={48} y={82} width={24} height={16} rx={8} fill="url(#gHead)" stroke={skinLo} strokeWidth={1.5} />
        {/* Голова */}
        <circle cx={60} cy={54} r={42} fill="url(#gHead)" stroke={skinLo} strokeWidth={1.5} />
        {/* Тканевая текстура */}
        <circle cx={60} cy={54} r={42} fill="url(#tex)" opacity={0.18} />
        {/* Блик */}
        <ellipse cx={46} cy={35} rx={13} ry={9} fill={skinHi} opacity={0.22} />
        {/* Уши */}
        <circle cx={19} cy={54} r={9} fill="url(#gHead)" stroke={skinLo} strokeWidth={1.5} />
        <circle cx={101} cy={54} r={9} fill="url(#gHead)" stroke={skinLo} strokeWidth={1.5} />
        {/* Глаза и рот */}
        {leftEye}
        {rightEye}
        <ellipse cx={60} cy={63} rx={4} ry={3} fill={ink} opacity={0.4} />
        {mouth}
        {/* Румяна */}
        <circle cx={32} cy={62} r={8} fill="#e8907a" opacity={0.35} />
        <circle cx={88} cy={62} r={8} fill="#e8907a" opacity={0.35} />
      </motion.g>
    </svg>
  );
}

// ── Примитивы ─────────────────────────────────────────────────

function DotEye({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={6} ry={7} fill="#fff" opacity={0.9} />
      <circle cx={cx} cy={cy + 1} r={4} fill="#1C0C00" />
      <circle cx={cx - 1.5} cy={cy - 1.5} r={1.2} fill="#fff" opacity={0.8} />
    </g>
  );
}

function XEye({ cx, cy, size = 7 }: { cx: number; cy: number; size?: number }) {
  return (
    <g>
      <line x1={cx - size} y1={cy - size} x2={cx + size} y2={cy + size}
        stroke="#1C0C00" strokeWidth={3} strokeLinecap="round" />
      <line x1={cx + size} y1={cy - size} x2={cx - size} y2={cy + size}
        stroke="#1C0C00" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

function SpiralEye({ cx, cy }: { cx: number; cy: number }) {
  return (
    <path
      d={`M${cx},${cy} m5.5,0 a5.5,5.5 0 1,1 -11,0 a3.5,3.5 0 1,0 7,0 a1.8,1.8 0 1,1 -3.6,0`}
      fill="none"
      stroke="#1C0C00"
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
}

function StarShape({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const oa = ((i * 72) - 90) * (Math.PI / 180);
    const ia = ((i * 72 + 36) - 90) * (Math.PI / 180);
    return (
      `${cx + r * Math.cos(oa)},${cy + r * Math.sin(oa)} ` +
      `${cx + r * 0.42 * Math.cos(ia)},${cy + r * 0.42 * Math.sin(ia)}`
    );
  }).join(' ');
  return (
    <polygon points={pts} fill="rgba(255,255,255,0.92)" stroke="rgba(80,130,200,0.45)" strokeWidth={1} />
  );
}
