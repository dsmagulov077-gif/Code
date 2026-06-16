// SVG-аксессуары для бадди.
// Все координаты — в пространстве BuddySVG (viewBox "0 0 120 220").
// Голова: cx=60, cy=54, r=42 → top ≈ y=12
// Глаза: L(47,48) R(73,48) | Нос: (60,63)

import { motion } from 'framer-motion';

/* ── 🎩 Цилиндр ─────────────────────────────────────────── */
export function AccTopHat() {
  return (
    <g>
      {/* Тень */}
      <ellipse cx={60} cy={21} rx={38} ry={5} fill="rgba(0,0,0,0.18)" />
      {/* Поля */}
      <rect x={18} y={11} width={84} height={9} rx={3} fill="#1A1A1A" stroke="#333" strokeWidth={1.5} />
      {/* Тулья */}
      <rect x={30} y={-20} width={60} height={33} rx={3} fill="#111" stroke="#333" strokeWidth={1.5} />
      {/* Белая лента */}
      <rect x={30} y={7} width={60} height={6} fill="#EEEEEE" />
      {/* Блик */}
      <rect x={33} y={-17} width={14} height={27} rx={2} fill="#FFF" opacity={0.05} />
    </g>
  );
}

/* ── 👑 Корона ──────────────────────────────────────────── */
export function AccCrown() {
  return (
    <g>
      {/* Тень */}
      <ellipse cx={60} cy={23} rx={30} ry={4} fill="rgba(0,0,0,0.15)" />
      {/* Основание */}
      <rect x={33} y={8} width={54} height={14} rx={2} fill="#CC8800" stroke="#AA6600" strokeWidth={1} />
      {/* Зубцы */}
      <polygon points="35,8 41,8 38,-4"  fill="#FFD700" stroke="#CC9900" strokeWidth={0.8} />
      <polygon points="47,8 53,8 50,-1"  fill="#FFCC00" stroke="#CC9900" strokeWidth={0.8} />
      <polygon points="57,8 63,8 60,-7"  fill="#FFD700" stroke="#CC9900" strokeWidth={0.8} />
      <polygon points="67,8 73,8 70,-1"  fill="#FFCC00" stroke="#CC9900" strokeWidth={0.8} />
      <polygon points="79,8 85,8 82,-4"  fill="#FFD700" stroke="#CC9900" strokeWidth={0.8} />
      {/* Камни */}
      <circle cx={38} cy={-4} r={3.5} fill="#CC2222" stroke="#AA0000" strokeWidth={0.8} />
      <circle cx={60} cy={-7} r={4}   fill="#2244CC" stroke="#0022AA" strokeWidth={0.8} />
      <circle cx={82} cy={-4} r={3.5} fill="#CC2222" stroke="#AA0000" strokeWidth={0.8} />
      <circle cx={50} cy={-1} r={2.5} fill="#22AA44" stroke="#008822" strokeWidth={0.7} />
      <circle cx={70} cy={-1} r={2.5} fill="#22AA44" stroke="#008822" strokeWidth={0.7} />
      {/* Блики камней */}
      <circle cx={37} cy={-5} r={1}   fill="#FFF" opacity={0.6} />
      <circle cx={59} cy={-8} r={1.2} fill="#FFF" opacity={0.6} />
      <circle cx={81} cy={-5} r={1}   fill="#FFF" opacity={0.6} />
      {/* Блик основания */}
      <rect x={35} y={9} width={50} height={4} rx={1} fill="#FFF" opacity={0.16} />
    </g>
  );
}

/* ── ✨ Нимб ─────────────────────────────────────────────── */
export function AccHalo() {
  return (
    <motion.g
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Свечение */}
      <ellipse cx={60} cy={2} rx={28} ry={10} fill="#FFD700" opacity={0.18} />
      {/* Кольцо */}
      <ellipse cx={60} cy={2} rx={24} ry={8}  fill="none" stroke="#FFD700" strokeWidth={4.5} />
      <ellipse cx={60} cy={2} rx={24} ry={8}  fill="none" stroke="#FFFACC" strokeWidth={2}   opacity={0.55} />
      {/* Блик */}
      <ellipse cx={39} cy={0} rx={3.5} ry={2} fill="#FFF" opacity={0.65} />
    </motion.g>
  );
}

/* ── 😎 Солнечные очки ──────────────────────────────────── */
export function AccShades() {
  return (
    <g>
      {/* Дужки */}
      <line x1={34} y1={49} x2={22} y2={53} stroke="#888" strokeWidth={1.8} strokeLinecap="round" />
      <line x1={86} y1={49} x2={98} y2={53} stroke="#888" strokeWidth={1.8} strokeLinecap="round" />
      {/* Перемычка */}
      <line x1={56} y1={49} x2={64} y2={49} stroke="#999" strokeWidth={2}   strokeLinecap="round" />
      {/* Линзы */}
      <rect x={33} y={42} width={23} height={14} rx={7} fill="#111" stroke="#555" strokeWidth={1.2} />
      <rect x={64} y={42} width={23} height={14} rx={7} fill="#111" stroke="#555" strokeWidth={1.2} />
      {/* Блики */}
      <ellipse cx={42} cy={46} rx={5} ry={3} fill="#FFF" opacity={0.14} />
      <ellipse cx={73} cy={46} rx={5} ry={3} fill="#FFF" opacity={0.14} />
    </g>
  );
}

/* ── 🥽 ВР-шлем ──────────────────────────────────────────── */
export function AccVRHelm() {
  return (
    <g>
      {/* Застёжки */}
      <line x1={24} y1={52} x2={12} y2={56} stroke="#333" strokeWidth={2} strokeLinecap="round" />
      <line x1={96} y1={52} x2={108} y2={56} stroke="#333" strokeWidth={2} strokeLinecap="round" />
      {/* Корпус */}
      <rect x={22} y={35} width={76} height={34} rx={11} fill="#1A1A2E" stroke="#2A2A44" strokeWidth={1.5} />
      {/* Дисплей */}
      <rect x={28} y={40} width={64} height={24} rx={7}  fill="#06090F" stroke="#1A2A44" strokeWidth={1} />
      {/* Экран */}
      <rect x={30} y={42} width={60} height={20} rx={6}  fill="#000C22" />
      {/* Линии сканирования */}
      {[45, 49, 53, 57].map(y => (
        <line key={y} x1={31} y1={y} x2={89} y2={y} stroke="#003388" strokeWidth={0.7} opacity={0.5} />
      ))}
      {/* UI-панели */}
      <rect x={32} y={44} width={20} height={9} rx={2} fill="#001244" stroke="#003366" strokeWidth={0.5} />
      <rect x={68} y={44} width={20} height={9} rx={2} fill="#001244" stroke="#003366" strokeWidth={0.5} />
      {/* Прицел */}
      <circle cx={60} cy={52} r={5.5} fill="none" stroke="#0055AA" strokeWidth={1.5} />
      <circle cx={60} cy={52} r={2}   fill="#0088FF" opacity={0.85} />
      <line x1={60} y1={45} x2={60} y2={48} stroke="#0055AA" strokeWidth={1} />
      <line x1={60} y1={56} x2={60} y2={59} stroke="#0055AA" strokeWidth={1} />
      <line x1={53} y1={52} x2={56} y2={52} stroke="#0055AA" strokeWidth={1} />
      <line x1={64} y1={52} x2={67} y2={52} stroke="#0055AA" strokeWidth={1} />
      {/* Синее свечение края */}
      <rect x={22} y={35} width={76} height={34} rx={11} fill="none" stroke="#0055CC" strokeWidth={1} opacity={0.45} />
      {/* Кнопки */}
      <circle cx={27} cy={42} r={2.5} fill="#0044BB" />
      <circle cx={93} cy={42} r={2.5} fill="#BB3300" />
    </g>
  );
}

/* ── 🔥 Огненная аура ────────────────────────────────────── */
export function AccFireAura() {
  const pts = [
    { x: 18,  y: 108, d: 0    },
    { x: 14,  y: 150, d: 0.28 },
    { x: 18,  y: 190, d: 0.55 },
    { x: 55,  y: 202, d: 0.14 },
    { x: 100, y: 202, d: 0.42 },
    { x: 107, y: 162, d: 0.70 },
    { x: 107, y: 120, d: 0.20 },
    { x: 100, y: 85,  d: 0.48 },
    { x: 60,  y: 74,  d: 0.35 },
  ];
  return (
    <g>
      {pts.map((p, i) => (
        <g key={i} transform={`translate(${p.x},${p.y})`}>
          <motion.ellipse
            cx={0} cy={0} rx={11} ry={17}
            fill="#FF4400" opacity={0.65}
            animate={{ scaleY: [1, 1.45, 0.75, 1.2, 1], scaleX: [1, 0.8, 1.1, 0.9, 1] }}
            transition={{ duration: 0.75, repeat: Infinity, delay: p.d, ease: 'easeInOut' }}
          />
          <motion.ellipse
            cx={0} cy={-4} rx={7} ry={11}
            fill="#FF8800"
            animate={{ scaleY: [1, 1.5, 0.8, 1.3, 1], opacity: [0.9, 1, 0.6, 0.85, 0.9] }}
            transition={{ duration: 0.65, repeat: Infinity, delay: p.d + 0.08, ease: 'easeInOut' }}
          />
          <motion.ellipse
            cx={0} cy={-9} rx={3.5} ry={5}
            fill="#FFE500"
            animate={{ scaleY: [1, 1.6, 0.7, 1.4, 1] }}
            transition={{ duration: 0.55, repeat: Infinity, delay: p.d + 0.16, ease: 'easeInOut' }}
          />
        </g>
      ))}
    </g>
  );
}

/* ── ❄️ Ледяная аура ─────────────────────────────────────── */
export function AccIceAura() {
  const pts = [
    { x: 14,  y: 108, r: 11, dur: 7,   d: 0    },
    { x: 11,  y: 152, r: 9,  dur: 9,   d: 0.40 },
    { x: 16,  y: 192, r: 10, dur: 8,   d: 0.70 },
    { x: 55,  y: 204, r: 8,  dur: 10,  d: 0.20 },
    { x: 105, y: 202, r: 10, dur: 7.5, d: 0.50 },
    { x: 108, y: 160, r: 9,  dur: 8.5, d: 0.10 },
    { x: 107, y: 116, r: 11, dur: 9.5, d: 0.60 },
    { x: 61,  y: 74,  r: 9,  dur: 8,   d: 0.35 },
  ];
  return (
    <g>
      {pts.map((c, i) => (
        <g key={i} transform={`translate(${c.x},${c.y})`}>
          {/* Свечение */}
          <circle cx={0} cy={0} r={c.r + 5} fill="#44AAFF" opacity={0.1} />
          <motion.g
            animate={{ rotate: [0, 360] }}
            transition={{ duration: c.dur, repeat: Infinity, ease: 'linear', delay: c.d }}
          >
            {/* 4 оси = 8 лучей */}
            <line x1={-c.r} y1={0}       x2={c.r}  y2={0}       stroke="#AADDFF" strokeWidth={2}   strokeLinecap="round" />
            <line x1={0}    y1={-c.r}    x2={0}    y2={c.r}     stroke="#AADDFF" strokeWidth={2}   strokeLinecap="round" />
            <line x1={-c.r * 0.72} y1={-c.r * 0.72} x2={c.r * 0.72} y2={c.r * 0.72} stroke="#88CCFF" strokeWidth={1.5} strokeLinecap="round" />
            <line x1={c.r * 0.72}  y1={-c.r * 0.72} x2={-c.r * 0.72} y2={c.r * 0.72} stroke="#88CCFF" strokeWidth={1.5} strokeLinecap="round" />
            {/* Центральный ромб */}
            <polygon
              points={`0,${-c.r * 0.38} ${c.r * 0.28},0 0,${c.r * 0.38} ${-c.r * 0.28},0`}
              fill="#CCEEFF" opacity={0.8}
            />
          </motion.g>
        </g>
      ))}
    </g>
  );
}

/* ── 🐱 Кот-компаньон ────────────────────────────────────── */
export function AccCat() {
  return (
    <g transform="translate(112, 144)">
      {/* Тень */}
      <ellipse cx={20} cy={61} rx={18} ry={5} fill="rgba(0,0,0,0.2)" />
      {/* Хвост (за телом) */}
      <path d="M30 46 Q50 34 46 18 Q43 7 53 10" fill="none" stroke="#CC6600" strokeWidth={5} strokeLinecap="round" />
      <path d="M30 46 Q50 34 46 18 Q43 7 53 10" fill="none" stroke="#FF8C00" strokeWidth={3} strokeLinecap="round" />
      {/* Тело */}
      <ellipse cx={20} cy={44} rx={14} ry={17} fill="#FF8C00" stroke="#CC6600" strokeWidth={1} />
      {/* Полоски */}
      {[[-7,36,-11,46],[-1,34,-3,46],[5,34,7,46]].map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={20+x1} y1={y1} x2={20+x2} y2={y2}
          stroke="#CC6600" strokeWidth={1.2} strokeLinecap="round" opacity={0.65} />
      ))}
      {/* Брюшко */}
      <ellipse cx={20} cy={48} rx={8} ry={10} fill="#FFBB66" opacity={0.55} />
      {/* Голова */}
      <circle cx={20} cy={24} r={14} fill="#FF8C00" stroke="#CC6600" strokeWidth={1} />
      {/* Ушки */}
      <polygon points="9,14 6,3 15,12"  fill="#FF8C00" stroke="#CC6600" strokeWidth={0.8} />
      <polygon points="31,14 34,3 25,12" fill="#FF8C00" stroke="#CC6600" strokeWidth={0.8} />
      <polygon points="10,13 8,5 14,11"  fill="#FFAAAA" opacity={0.55} />
      <polygon points="30,13 32,5 26,11" fill="#FFAAAA" opacity={0.55} />
      {/* Глаза */}
      <ellipse cx={14} cy={22} rx={4}   ry={4.5} fill="#33DD44" />
      <ellipse cx={26} cy={22} rx={4}   ry={4.5} fill="#33DD44" />
      <ellipse cx={14} cy={23} rx={1.8} ry={4}   fill="#111" />
      <ellipse cx={26} cy={23} rx={1.8} ry={4}   fill="#111" />
      <circle cx={12} cy={21} r={1.2} fill="#FFF" opacity={0.72} />
      <circle cx={24} cy={21} r={1.2} fill="#FFF" opacity={0.72} />
      {/* Носик */}
      <polygon points="20,28 17,31 23,31" fill="#FF5599" />
      {/* Рот */}
      <path d="M17 31 Q20 35 23 31" fill="none" stroke="#CC3366" strokeWidth={0.9} strokeLinecap="round" />
      {/* Усы */}
      <line x1={20} y1={29} x2={4}  y2={26} stroke="#555" strokeWidth={0.8} strokeLinecap="round" />
      <line x1={20} y1={30} x2={4}  y2={30} stroke="#555" strokeWidth={0.8} strokeLinecap="round" />
      <line x1={20} y1={29} x2={36} y2={26} stroke="#555" strokeWidth={0.8} strokeLinecap="round" />
      <line x1={20} y1={30} x2={36} y2={30} stroke="#555" strokeWidth={0.8} strokeLinecap="round" />
      {/* Лапки */}
      <ellipse cx={10} cy={60} rx={7} ry={4.5} fill="#FF8C00" stroke="#CC6600" strokeWidth={0.8} />
      <ellipse cx={30} cy={60} rx={7} ry={4.5} fill="#FF8C00" stroke="#CC6600" strokeWidth={0.8} />
      {/* Когти */}
      {[-4,-1.5,1.5,4].map(dx => (
        <ellipse key={dx} cx={10+dx} cy={62} rx={1.2} ry={1.5} fill="#DD7700" opacity={0.65} />
      ))}
      {[-4,-1.5,1.5,4].map(dx => (
        <ellipse key={dx} cx={30+dx} cy={62} rx={1.2} ry={1.5} fill="#DD7700" opacity={0.65} />
      ))}
    </g>
  );
}
