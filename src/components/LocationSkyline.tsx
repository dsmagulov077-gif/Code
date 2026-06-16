// Фон арены: вершина небоскрёба ночью.
// Ночное небо, луна, звёзды, огни города, вертолёт, ветровые полосы,
// бетонная крыша с вертолётной площадкой и антеннами.

import { motion } from 'framer-motion';

/* ── Вертолёт ───────────────────────────────────────────── */
function Helicopter() {
  return (
    <svg viewBox="0 0 90 36" width={90} height={36} xmlns="http://www.w3.org/2000/svg">
      {/* Несущий ротор */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: '44px 6px' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.2, repeat: Infinity, ease: 'linear' }}
      >
        <line x1={8}  y1={6} x2={80} y2={6}  stroke="#AAAAAA" strokeWidth={2}   strokeLinecap="round" opacity={0.9} />
        <line x1={44} y1={0} x2={44} y2={12} stroke="#AAAAAA" strokeWidth={1.5} strokeLinecap="round" opacity={0.9} />
      </motion.g>
      {/* Втулка ротора */}
      <circle cx={44} cy={6} r={2.5} fill="#777" />
      {/* Мачта */}
      <rect x={42} y={6} width={4} height={8} fill="#555" />
      {/* Фюзеляж */}
      <ellipse cx={46} cy={20} rx={23} ry={8} fill="#252535" stroke="#353548" strokeWidth={0.8} />
      {/* Остекление кабины */}
      <ellipse cx={61} cy={19} rx={13} ry={7.5} fill="#2E2E42" stroke="#3C3C55" strokeWidth={0.8} />
      <ellipse cx={63} cy={18} rx={8}  ry={5.5} fill="#4A7AA0" opacity={0.8} />
      <ellipse cx={61} cy={17} rx={4}  ry={2.5} fill="#6A9ABB" opacity={0.5} />
      {/* Хвостовая балка */}
      <rect x={20} y={17} width={30} height={5} rx={2} fill="#1E1E2E" />
      {/* Хвостовое оперение */}
      <polygon points="20,17 10,15 20,22" fill="#181828" stroke="#252535" strokeWidth={0.5} />
      {/* Хвостовой ротор */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: '14px 19px' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.14, repeat: Infinity, ease: 'linear' }}
      >
        <line x1={14} y1={12} x2={14} y2={26} stroke="#888" strokeWidth={1.5} strokeLinecap="round" opacity={0.85} />
        <line x1={7}  y1={19} x2={21} y2={19} stroke="#888" strokeWidth={1.2} strokeLinecap="round" opacity={0.85} />
      </motion.g>
      {/* Шасси */}
      <line x1={34} y1={28} x2={62} y2={28} stroke="#444" strokeWidth={2} strokeLinecap="round" />
      <line x1={38} y1={26} x2={38} y2={28} stroke="#444" strokeWidth={1.5} />
      <line x1={58} y1={26} x2={58} y2={28} stroke="#444" strokeWidth={1.5} />
      {/* Навигационные огни */}
      <motion.circle
        cx={20} cy={19} r={2} fill="#FF2222"
        animate={{ opacity: [1, 1, 0.08, 0.08, 1] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
      <circle cx={69} cy={15} r={1.5} fill="#FFFAAA" opacity={0.85} />
    </svg>
  );
}

/* ── Звёзды (детерминированные позиции) ─────────────────── */
const STARS = Array.from({ length: 55 }, (_, i) => ({
  x:  ((i * 137 + 17) % 390) + 5,
  y:  ((i * 79  + 13) % 125) + 4,
  r:  i % 8 === 0 ? 1.6 : i % 3 === 0 ? 1.0 : 0.6,
  op: 0.42 + (i % 6) * 0.09,
}));

/* ── Окна дальних зданий ────────────────────────────────── */
const FAR_WINDOWS = [
  // Левый кластер
  [6,163],[14,163],[22,163],[30,163],
  [6,175],[22,175],[30,175],
  [6,187],[14,187],[30,187],
  [56,181],[64,181],[56,192],[64,192],[72,192],
  [98,168],[106,168],[114,168],[98,180],[114,180],[122,180],
  [98,192],[106,192],[122,192],
  [148,190],[155,190],[162,190],[148,201],[162,201],
  // Правый кластер
  [188,158],[198,158],[208,158],[218,158],[228,158],
  [188,170],[208,170],[218,170],[228,170],
  [188,182],[198,182],[218,182],[228,182],
  [250,175],[259,175],[268,175],[250,186],[268,186],[250,197],[259,197],
  [294,168],[303,168],[312,168],[321,168],
  [294,179],[312,179],[321,179],[294,190],[303,190],[321,190],
  [344,162],[354,162],[364,162],[374,162],[384,162],
  [344,174],[364,174],[374,174],[384,174],
  [344,185],[354,185],[374,185],[384,185],
];

/* ── Основной компонент ─────────────────────────────────── */
export function LocationSkyline() {
  const WIND_STREAKS = [
    { top: '15%', w: 88,  delay: 0,    dur: 1.05 },
    { top: '23%', w: 56,  delay: 0.45, dur: 1.35 },
    { top: '32%', w: 108, delay: 0.85, dur: 0.95 },
    { top: '41%', w: 72,  delay: 1.4,  dur: 1.25 },
    { top: '51%', w: 50,  delay: 0.2,  dur: 1.55 },
    { top: '61%', w: 94,  delay: 0.7,  dur: 1.1  },
    { top: '70%', w: 64,  delay: 1.15, dur: 1.4  },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      zIndex: 0, borderRadius: 'inherit', pointerEvents: 'none',
    }}>
      {/* ════════════════════════════════════════
          Основная SVG-сцена
      ════════════════════════════════════════ */}
      <svg
        viewBox="0 0 400 280"
        width="100%" height="100%"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0, display: 'block' }}
      >
        <defs>
          <linearGradient id="loc-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#020810" />
            <stop offset="50%"  stopColor="#0A1432" />
            <stop offset="100%" stopColor="#122050" />
          </linearGradient>
          <radialGradient id="loc-moon" cx="42%" cy="38%" r="60%">
            <stop offset="0%"   stopColor="#FFFEF0" />
            <stop offset="65%"  stopColor="#FFF6D0" />
            <stop offset="100%" stopColor="#EDD890" />
          </radialGradient>
          <radialGradient id="loc-cityglow" cx="50%" cy="100%" r="65%">
            <stop offset="0%"   stopColor="#FF7700" stopOpacity="0.2" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="loc-roof" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#252538" />
            <stop offset="100%" stopColor="#181825" />
          </linearGradient>
          <filter id="loc-haze">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>

        {/* ── Небо ── */}
        <rect width="400" height="280" fill="url(#loc-sky)" />

        {/* Городское свечение снизу */}
        <ellipse cx="200" cy="232" rx="240" ry="78" fill="url(#loc-cityglow)" />

        {/* Звёзды */}
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFF" opacity={s.op} />
        ))}

        {/* ── Луна ── */}
        <circle cx={335} cy={44} r={30} fill="#FFFACC" opacity={0.07} />
        <circle cx={335} cy={44} r={20} fill="url(#loc-moon)" />
        {/* Кратеры */}
        <circle cx={327} cy={38} r={4.5} fill="#EDD890" opacity={0.3} />
        <circle cx={340} cy={50} r={3}   fill="#EDD890" opacity={0.22} />
        <circle cx={343} cy={36} r={2.2} fill="#EDD890" opacity={0.18} />

        {/* ══════════════════════════════════════
            ДАЛЬНИЕ ЗДАНИЯ (размыты, тёмно-синие)
        ══════════════════════════════════════ */}
        <g filter="url(#loc-haze)" opacity={0.78}>
          {/* Левый кластер */}
          <rect x={0}   y={158} width={50} height={70} fill="#0A1430" />
          <rect x={0}   y={155} width={50} height={3}  fill="#142040" />
          <rect x={55}  y={176} width={34} height={52} fill="#091228" />
          <rect x={95}  y={163} width={42} height={65} fill="#0B1535" />
          <rect x={95}  y={159} width={42} height={4}  fill="#152245" />
          <rect x={145} y={185} width={28} height={43} fill="#090F22" />
          {/* Правый кластер */}
          <rect x={185} y={153} width={55} height={75} fill="#0C1838" />
          <rect x={185} y={149} width={55} height={4}  fill="#162448" />
          <rect x={247} y={170} width={36} height={58} fill="#0A1430" />
          <rect x={291} y={163} width={44} height={65} fill="#0B1635" />
          <rect x={341} y={156} width={53} height={72} fill="#0C1738" />
          <rect x={341} y={152} width={53} height={4}  fill="#162345" />
          {/* Окна дальних зданий */}
          {FAR_WINDOWS.map(([wx, wy], i) => (
            <rect key={i} x={wx} y={wy} width={4} height={5}
              fill={i % 5 === 0 ? '#FF9900' : '#FFE055'} opacity={0.62} />
          ))}
        </g>

        {/* ══════════════════════════════════════
            СРЕДНИЙ ПЛАН (тёмные угловые здания)
        ══════════════════════════════════════ */}
        {/* Левое угловое здание */}
        <rect x={0}  y={191} width={60} height={37} fill="#0D1838" />
        <rect x={0}  y={187} width={60} height={4}  fill="#1A2848" />
        <rect x={0}  y={179} width={22} height={14} fill="#0B1532" />
        <rect x={12} y={174} width={10} height={7}  fill="#0A1230" />
        {/* Кондиционеры на левом */}
        <rect x={5}  y={185} width={14} height={6} rx={1} fill="#16203C" stroke="#1E2A4A" strokeWidth={0.5} />
        <rect x={25} y={186} width={18} height={5} rx={1} fill="#14203A" stroke="#1E2A4A" strokeWidth={0.5} />
        {/* Окна левого здания */}
        {[[4,194],[13,194],[22,194],[31,194],[4,205],[22,205],[31,205],[40,205]].map(([wx,wy],i) => (
          <rect key={i} x={wx} y={wy} width={6} height={7}
            fill={i % 3 === 0 ? '#FF8800' : '#FFE066'} opacity={0.82} />
        ))}

        {/* Правое угловое здание */}
        <rect x={340} y={186} width={60} height={42} fill="#0E1938" />
        <rect x={340} y={182} width={60} height={4}  fill="#192745" />
        <rect x={368} y={174} width={32} height={14} fill="#0C1632" />
        <rect x={380} y={167} width={20} height={9}  fill="#0A1230" />
        {/* Кондиционеры на правом */}
        <rect x={345} y={180} width={20} height={6} rx={1} fill="#14203A" stroke="#1E2A4A" strokeWidth={0.5} />
        <rect x={370} y={181} width={16} height={5} rx={1} fill="#16203C" stroke="#1E2A4A" strokeWidth={0.5} />
        {/* Окна правого здания */}
        {[[345,189],[355,189],[365,189],[375,189],[345,201],[365,201],[375,201],[385,201]].map(([wx,wy],i) => (
          <rect key={i} x={wx} y={wy} width={6} height={7}
            fill={i % 3 === 1 ? '#FF8800' : '#FFE066'} opacity={0.82} />
        ))}
        {/* Антенна правого здания */}
        <line x1={358} y1={182} x2={358} y2={158} stroke="#2A2A40" strokeWidth={1.5} />
        <line x1={358} y1={169} x2={367} y2={164} stroke="#2A2A40" strokeWidth={1} />
        <line x1={358} y1={169} x2={349} y2={164} stroke="#2A2A40" strokeWidth={1} />

        {/* ══════════════════════════════════════
            КРЫША
        ══════════════════════════════════════ */}
        {/* Парапет */}
        <rect x={0} y={223} width={400} height={3}  fill="#383852" />
        <rect x={0} y={226} width={400} height={4}  fill="#2E2E46" />
        {/* Основная поверхность */}
        <rect x={0} y={230} width={400} height={50} fill="url(#loc-roof)" />
        {/* Швы бетона */}
        <line x1={0} y1={234}   x2={400} y2={234}   stroke="#1E1E2C" strokeWidth={0.7} opacity={0.5} />
        <line x1={133} y1={234} x2={133} y2={280}   stroke="#1E1E2C" strokeWidth={0.5} opacity={0.35} />
        <line x1={266} y1={234} x2={266} y2={280}   stroke="#1E1E2C" strokeWidth={0.5} opacity={0.35} />

        {/* Вертолётная площадка */}
        <circle cx={200} cy={257} r={30} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.42} />
        <circle cx={200} cy={257} r={24} fill="none" stroke="#FFFF44" strokeWidth={0.8} opacity={0.3} />
        {/* Буква H */}
        <line x1={188} y1={249} x2={188} y2={265} stroke="#FFF" strokeWidth={3} opacity={0.62} />
        <line x1={188} y1={257} x2={212} y2={257} stroke="#FFF" strokeWidth={3} opacity={0.62} />
        <line x1={212} y1={249} x2={212} y2={265} stroke="#FFF" strokeWidth={3} opacity={0.62} />

        {/* Блок кондиционеров слева */}
        <rect x={28} y={218} width={40} height={14} rx={2} fill="#1C1C2E" stroke="#28283E" strokeWidth={1} />
        <rect x={30} y={215} width={36} height={5}  rx={1} fill="#22223A" />
        {[31,36,41,46,51,56,61].map(x => (
          <line key={x} x1={x} y1={219} x2={x} y2={231} stroke="#272738" strokeWidth={0.8} />
        ))}
        {/* Малый блок */}
        <rect x={73} y={221} width={24} height={10} rx={1} fill="#1A1A2E" stroke="#262638" strokeWidth={0.8} />

        {/* Блок кондиционеров справа */}
        <rect x={328} y={215} width={48} height={16} rx={2} fill="#1C1C2E" stroke="#28283E" strokeWidth={1} />
        <rect x={330} y={212} width={44} height={5}  rx={1} fill="#22223A" />
        {[331,337,343,349,355,361,367].map(x => (
          <line key={x} x1={x} y1={216} x2={x} y2={230} stroke="#272738" strokeWidth={0.8} />
        ))}

        {/* Водонапорный бак */}
        <rect x={348} y={220} width={20} height={22} rx={2} fill="#181828" stroke="#252535" strokeWidth={1} />
        <ellipse cx={358} cy={220} rx={10} ry={4}   fill="#1E1E2E" stroke="#252535" strokeWidth={1} />
        <ellipse cx={358} cy={242} rx={10} ry={4}   fill="#1E1E2E" stroke="#252535" strokeWidth={1} />
        <line x1={350} y1={242} x2={347} y2={252}   stroke="#222232" strokeWidth={1.5} />
        <line x1={366} y1={242} x2={369} y2={252}   stroke="#222232" strokeWidth={1.5} />

        {/* Антенна слева */}
        <line x1={58} y1={226} x2={58} y2={202} stroke="#2A2A3E" strokeWidth={1.5} />
        <line x1={58} y1={212} x2={66} y2={207} stroke="#2A2A3E" strokeWidth={1} />
        <line x1={58} y1={212} x2={50} y2={207} stroke="#2A2A3E" strokeWidth={1} />
      </svg>

      {/* ════════════════════════════════════════
          Анимированные слои (div)
      ════════════════════════════════════════ */}

      {/* Мигающий огонь левой антенны */}
      <motion.div
        style={{
          position: 'absolute', top: '72%', left: '14.5%',
          width: 4, height: 4, borderRadius: '50%',
          background: '#FF2222', boxShadow: '0 0 6px 2px rgba(255,0,0,0.55)',
          zIndex: 2,
        }}
        animate={{ opacity: [1, 1, 0.06, 0.06, 1, 1, 0.06, 1] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />

      {/* Мигающий огонь правой антенны */}
      <motion.div
        style={{
          position: 'absolute', top: '57%', left: '89.5%',
          width: 3, height: 3, borderRadius: '50%',
          background: '#FF2222', boxShadow: '0 0 4px 2px rgba(255,0,0,0.5)',
          zIndex: 2,
        }}
        animate={{ opacity: [0.06, 0.06, 1, 1, 0.06] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: 0.8 }}
      />

      {/* Вертолёт */}
      <motion.div
        style={{ position: 'absolute', top: '9%', zIndex: 4, opacity: 0.88 }}
        initial={{ x: -100 }}
        animate={{ x: [-100, 530] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear', repeatDelay: 9 }}
      >
        <Helicopter />
      </motion.div>

      {/* Ветровые полосы */}
      {WIND_STREAKS.map((s, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute', top: s.top,
            left: -(s.w + 10), width: s.w, height: 1,
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.17), transparent)',
            zIndex: 1,
          }}
          animate={{ x: [0, 530] }}
          transition={{
            duration: s.dur,
            repeat: Infinity,
            ease: 'linear',
            delay: s.delay,
            repeatDelay: 1.6 + i * 0.55,
          }}
        />
      ))}
    </div>
  );
}
