// Оригинальные SVG-иконки оружий в стиле sci-fi/fantasy game-art.
// Палитра взята с референса: красный, жёлтый, синий, фиолетовый, тёмные аутлайны.

type WProps = { size?: number };

const F = { filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.65))' } as const;
const O = '#1A1A1A'; // outline

/* ══════════════════════════════════════════════════════════
   ОБЫЧНЫЕ ОРУЖИЯ
══════════════════════════════════════════════════════════ */

/* ── Кулак: силовые кастеты (жёлтый/чёрный, фиолетовая рукоять) ── */
export function WeaponFist({ size = 32 }: WProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={F}>
      {/* Рукоять */}
      <rect x={2} y={28} width={12} height={14} rx={3} fill="#6633AA" stroke={O} strokeWidth={1.5} />
      <rect x={4} y={30} width={3} height={10} rx={1} fill="#9966DD" />
      <rect x={8} y={30} width={3} height={10} rx={1} fill="#9966DD" />
      <rect x={12} y={30} width={3} height={10} rx={1} fill="#9966DD" />
      {/* Гарда */}
      <rect x={2} y={24} width={16} height={6} rx={2} fill="#8844CC" stroke={O} strokeWidth={1.4} />
      {/* Основная полоса */}
      <rect x={10} y={17} width={36} height={13} rx={3} fill="#FFD700" stroke={O} strokeWidth={1.6} />
      {/* Тёмные панели-полоски */}
      <rect x={14} y={19} width={4} height={9} rx={1} fill="#BB8800" opacity={0.5} />
      <rect x={22} y={19} width={4} height={9} rx={1} fill="#BB8800" opacity={0.5} />
      <rect x={30} y={19} width={4} height={9} rx={1} fill="#BB8800" opacity={0.5} />
      <rect x={38} y={19} width={5} height={9} rx={1} fill="#BB8800" opacity={0.5} />
      {/* Костяшки */}
      <rect x={12} y={9} width={8} height={10} rx={2} fill="#EEC000" stroke={O} strokeWidth={1.3} />
      <rect x={21} y={9} width={8} height={10} rx={2} fill="#EEC000" stroke={O} strokeWidth={1.3} />
      <rect x={30} y={9} width={8} height={10} rx={2} fill="#EEC000" stroke={O} strokeWidth={1.3} />
      <rect x={39} y={9} width={7} height={10} rx={2} fill="#EEC000" stroke={O} strokeWidth={1.3} />
      {/* Шипы */}
      <polygon points="16,9 13,3 19,3" fill="#CCCCCC" stroke={O} strokeWidth={1} />
      <polygon points="25,9 22,3 28,3" fill="#CCCCCC" stroke={O} strokeWidth={1} />
      <polygon points="34,9 31,3 37,3" fill="#CCCCCC" stroke={O} strokeWidth={1} />
      {/* Красный кабель */}
      <path d="M3 32 C0 28 0 22 10 19" fill="none" stroke="#DD2222" strokeWidth={2} strokeLinecap="round" />
      {/* Блик */}
      <rect x={12} y={18} width={32} height={3} rx={1} fill="#FFF" opacity={0.28} />
    </svg>
  );
}

/* ── Молот: sci-fi кувалда (красный/серый/жёлтый) ── */
export function WeaponHammer({ size = 32 }: WProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={F}>
      {/* Ручка */}
      <rect x={21} y={26} width={7} height={19} rx={3} fill="#CC8800" stroke={O} strokeWidth={1.5} />
      <rect x={23} y={28} width={3} height={15} rx={1} fill="#FFAA00" opacity={0.45} />
      <rect x={21} y={31} width={7} height={2} rx={1} fill="#222" opacity={0.3} />
      <rect x={21} y={37} width={7} height={2} rx={1} fill="#222" opacity={0.3} />
      {/* Голова молота */}
      <rect x={5} y={9} width={38} height={20} rx={4} fill="#CC2222" stroke={O} strokeWidth={1.8} />
      {/* Панели на голове */}
      <rect x={7} y={11} width={10} height={16} rx={2} fill="#BB1111" />
      <rect x={31} y={11} width={10} height={16} rx={2} fill="#BB1111" />
      {/* Жёлтая центральная полоска */}
      <rect x={18} y={9} width={12} height={20} fill="#FFD700" stroke={O} strokeWidth={1.2} />
      <rect x={20} y={11} width={8} height={16} fill="#FFE566" opacity={0.4} />
      {/* Синие акценты */}
      <rect x={20} y={13} width={3} height={5} rx={1} fill="#00AAFF" />
      <rect x={25} y={13} width={3} height={5} rx={1} fill="#00AAFF" />
      {/* Заклёпки */}
      <circle cx={11} cy={15} r={2.5} fill="#888" stroke={O} strokeWidth={1} />
      <circle cx={11} cy={23} r={2.5} fill="#888" stroke={O} strokeWidth={1} />
      <circle cx={37} cy={15} r={2.5} fill="#888" stroke={O} strokeWidth={1} />
      <circle cx={37} cy={23} r={2.5} fill="#888" stroke={O} strokeWidth={1} />
      {/* Блик */}
      <rect x={7} y={10} width={34} height={4} rx={2} fill="#FFF" opacity={0.18} />
    </svg>
  );
}

/* ── Бомба: классическая круглая (чёрный/оранжевый) ── */
export function WeaponBomb({ size = 32 }: WProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={F}>
      {/* Шнур */}
      <path d="M24 11 Q31 7 35 3 Q39 0 41 4" fill="none" stroke="#8B6914" strokeWidth={2.5} strokeLinecap="round" />
      {/* Искры на шнуре */}
      <circle cx={41} cy={4} r={3.5} fill="#FF7700" />
      <circle cx={42} cy={3} r={2} fill="#FFE000" />
      <line x1={41} y1={1} x2={44} y2={-1} stroke="#FF6600" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={43} y1={4} x2={47} y2={3} stroke="#FFCC00" strokeWidth={1.3} strokeLinecap="round" />
      <line x1={42} y1={0} x2={46} y2={-2} stroke="#FF4400" strokeWidth={1} strokeLinecap="round" />
      {/* Заглушка */}
      <rect x={22} y={11} width={5} height={6} rx={2} fill="#555" stroke={O} strokeWidth={1.2} />
      {/* Тело бомбы */}
      <circle cx={24} cy={30} r={17} fill="#252525" stroke={O} strokeWidth={2} />
      {/* Экватор */}
      <path d="M8 30 Q10 37 16 40 Q24 44 32 40 Q38 37 40 30" fill="none" stroke="#444" strokeWidth={1.5} />
      {/* Блики */}
      <circle cx={17} cy={21} r={5.5} fill="#FFF" opacity={0.14} />
      <circle cx={15} cy={19} r={3} fill="#FFF" opacity={0.22} />
    </svg>
  );
}

/* ── Молния: энергетический разряд (жёлтый/синий) ── */
export function WeaponLightning({ size = 32 }: WProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={F}>
      {/* Синее свечение */}
      <polygon points="31,3 17,23 27,23 13,45 39,21 27,21" fill="#4488FF" opacity={0.35} />
      {/* Жёлтый болт */}
      <polygon points="31,3 17,23 27,23 13,45 39,21 27,21"
        fill="#FFE000" stroke={O} strokeWidth={1.6} strokeLinejoin="round" />
      {/* Белый центр */}
      <polygon points="29,8 19,23 27,23 15,41 37,23 27,23"
        fill="#FFFACC" opacity={0.45} />
      {/* Электро-дуги */}
      <line x1={22} y1={14} x2={26} y2={10} stroke="#88CCFF" strokeWidth={1} strokeLinecap="round" opacity={0.8} />
      <line x1={25} y1={30} x2={29} y2={26} stroke="#88CCFF" strokeWidth={1} strokeLinecap="round" opacity={0.8} />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   ОСОБЫЕ ОРУЖИЯ
══════════════════════════════════════════════════════════ */

/* ── Ракета: sci-fi ракета (красный/жёлтый/синий) ── */
export function WeaponRocket({ size = 32 }: WProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={F}>
      {/* Реактивный выхлоп */}
      <ellipse cx={6} cy={24} rx={6} ry={7} fill="#0077FF" opacity={0.7} />
      <ellipse cx={4} cy={24} rx={4} ry={5} fill="#66BBFF" opacity={0.9} />
      <ellipse cx={3} cy={24} rx={2} ry={3} fill="#EEEEFF" />
      {/* Корпус */}
      <rect x={8} y={17} width={30} height={14} rx={3} fill="#CC2222" stroke={O} strokeWidth={1.6} />
      {/* Панели корпуса */}
      <rect x={10} y={19} width={9} height={10} rx={1} fill="#BB1111" />
      <rect x={21} y={19} width={6} height={10} rx={1} fill="#DD3333" />
      {/* Синие акценты (как на референсе) */}
      <rect x={13} y={20} width={3} height={4} rx={1} fill="#00AAFF" />
      <rect x={17} y={20} width={3} height={4} rx={1} fill="#00AAFF" />
      <rect x={13} y={25} width={3} height={4} rx={1} fill="#0088DD" />
      {/* Жёлтые детали */}
      <rect x={28} y={20} width={8} height={3} rx={1} fill="#FFD700" />
      <rect x={28} y={25} width={8} height={3} rx={1} fill="#FFD700" />
      {/* Носовой конус */}
      <polygon points="38,17 48,24 38,31" fill="#FFD700" stroke={O} strokeWidth={1.5} />
      <polygon points="38,19 46,24 38,29" fill="#FFE866" opacity={0.45} />
      {/* Верхний стабилизатор */}
      <polygon points="8,17 15,17 10,9"  fill="#AA1111" stroke={O} strokeWidth={1.2} />
      {/* Нижний стабилизатор */}
      <polygon points="8,31 15,31 10,39" fill="#AA1111" stroke={O} strokeWidth={1.2} />
      {/* Боковые стабилизаторы */}
      <polygon points="8,22 2,16 8,20" fill="#991111" stroke={O} strokeWidth={1} />
      <polygon points="8,26 2,32 8,28" fill="#991111" stroke={O} strokeWidth={1} />
      {/* Блик */}
      <rect x={10} y={18} width={28} height={3} rx={1} fill="#FFF" opacity={0.22} />
    </svg>
  );
}

/* ── Метеор: горящий астероид с кристаллом (оранжевый/фиолетовый) ── */
export function WeaponMeteor({ size = 32 }: WProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={F}>
      {/* Огненный шлейф */}
      <ellipse cx={11} cy={39} rx={9} ry={5} fill="#FF4400" opacity={0.45} />
      <ellipse cx={7}  cy={43} rx={6} ry={3} fill="#FF7700" opacity={0.4} />
      <ellipse cx={4}  cy={46} rx={4} ry={2} fill="#FFAA00" opacity={0.35} />
      {/* Тело камня */}
      <polygon
        points="22,4 34,3 44,11 46,25 38,40 24,44 11,37 7,22 13,9"
        fill="#AA5500" stroke={O} strokeWidth={1.6} strokeLinejoin="round"
      />
      {/* Поверхность камня */}
      <polygon points="22,4 34,3 30,14 18,16" fill="#CC6600" opacity={0.55} />
      <polygon points="38,40 46,25 40,28"    fill="#884400" opacity={0.5} />
      <polygon points="11,37 7,22 14,28"      fill="#773300" opacity={0.45} />
      {/* Кристалл (как на референсе — розово-фиолетовый) */}
      <polygon
        points="27,11 35,21 30,32 23,30 17,20 22,11"
        fill="#AA44DD" stroke="#CC66FF" strokeWidth={1.3}
      />
      <polygon points="27,11 35,21 30,21 25,13" fill="#DD88FF" opacity={0.55} />
      {/* Свечение кристалла */}
      <polygon
        points="27,11 35,21 30,32 23,30 17,20 22,11"
        fill="none" stroke="#CC44FF" strokeWidth={2} opacity={0.5}
      />
      {/* Огненные искры */}
      <circle cx={13} cy={33} r={2.5} fill="#FF6600" />
      <circle cx={8}  cy={40} r={1.8} fill="#FF8800" />
      <circle cx={15} cy={41} r={1.5} fill="#FFBB00" />
    </svg>
  );
}

/* ── Дракон: коготь с огнём (зелёный/оранжевый) ── */
export function WeaponDragon({ size = 32 }: WProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={F}>
      {/* Огненное свечение снизу */}
      <ellipse cx={24} cy={40} rx={18} ry={6} fill="#FF5500" opacity={0.3} />
      {/* Ладонь */}
      <ellipse cx={24} cy={32} rx={14} ry={11} fill="#226622" stroke={O} strokeWidth={1.6} />
      {/* Чешуйчатые панели */}
      <ellipse cx={20} cy={30} rx={5} ry={4} fill="#1A5A1A" />
      <ellipse cx={28} cy={30} rx={5} ry={4} fill="#1A5A1A" />
      <ellipse cx={24} cy={36} rx={5} ry={3} fill="#1A5A1A" />
      {/* Коготь 1 (большой) */}
      <path d="M12 28 Q9 20 7 12 Q10 7 15 12 Q16 20 14 28"
        fill="#2A7A2A" stroke={O} strokeWidth={1.3} />
      <polygon points="7,12 11,5 15,12" fill="#E0E0E0" stroke={O} strokeWidth={1} />
      {/* Коготь 2 */}
      <path d="M19 24 Q18 14 17 6 Q20 1 24 6 Q23 15 21 24"
        fill="#2A7A2A" stroke={O} strokeWidth={1.3} />
      <polygon points="17,6 20,0 24,6" fill="#E0E0E0" stroke={O} strokeWidth={1} />
      {/* Коготь 3 */}
      <path d="M27 24 Q27 14 29 6 Q32 1 36 6 Q34 15 31 24"
        fill="#2A7A2A" stroke={O} strokeWidth={1.3} />
      <polygon points="29,6 32,0 36,6" fill="#E0E0E0" stroke={O} strokeWidth={1} />
      {/* Коготь 4 (мизинец) */}
      <path d="M34 26 Q36 18 39 12 Q42 8 46 12 Q43 18 40 26"
        fill="#2A7A2A" stroke={O} strokeWidth={1.3} />
      <polygon points="39,12 42,6 46,12" fill="#E0E0E0" stroke={O} strokeWidth={1} />
      {/* Огонь под ладонью */}
      <ellipse cx={24} cy={38} rx={10} ry={4} fill="#FF6600" opacity={0.55} />
      <ellipse cx={24} cy={41} rx={6}  ry={3} fill="#FFAA00" opacity={0.65} />
      <circle  cx={18} cy={40} r={1.8} fill="#FFCC00" />
      <circle  cx={30} cy={40} r={1.8} fill="#FF8800" />
      {/* Блик на ладони */}
      <ellipse cx={19} cy={26} rx={5} ry={3.5} fill="#FFF" opacity={0.1} />
    </svg>
  );
}

/* ── Ядерка: тёмная боеголовка (чёрный/жёлтый/красный) ── */
export function WeaponNuke({ size = 32 }: WProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={F}>
      {/* Реактивная струя */}
      <ellipse cx={7}  cy={24} rx={7} ry={5} fill="#FF4400" opacity={0.7} />
      <ellipse cx={4}  cy={24} rx={5} ry={4} fill="#FF8800" opacity={0.8} />
      <ellipse cx={2}  cy={24} rx={3} ry={3} fill="#FFCC00" />
      {/* Корпус */}
      <rect x={10} y={16} width={28} height={16} rx={3} fill="#2A2A2A" stroke={O} strokeWidth={1.6} />
      {/* Жёлто-чёрная опасная полоса */}
      <rect x={20} y={16} width={8} height={16} fill="#FFD700" stroke={O} strokeWidth={1} />
      <rect x={21} y={16} width={3} height={16} fill="#222" opacity={0.45} />
      <rect x={26} y={16} width={3} height={16} fill="#222" opacity={0.45} />
      {/* Носовой конус (красный) */}
      <polygon points="38,16 48,24 38,32" fill="#CC2222" stroke={O} strokeWidth={1.5} />
      <polygon points="38,18 46,24 38,30" fill="#DD4444" opacity={0.4} />
      {/* Верхний и нижний стабилизаторы */}
      <polygon points="10,16 16,16 10,7"  fill="#444" stroke={O} strokeWidth={1.2} />
      <polygon points="10,32 16,32 10,41" fill="#444" stroke={O} strokeWidth={1.2} />
      {/* Боковые стабилизаторы */}
      <polygon points="10,20 3,15 10,18" fill="#555" stroke={O} strokeWidth={1} />
      <polygon points="10,28 3,33 10,30" fill="#555" stroke={O} strokeWidth={1} />
      {/* Атомный символ (голубой) */}
      <circle cx={15} cy={24} r={4.5} fill="none" stroke="#00CCFF" strokeWidth={1.6} />
      <line x1={15} y1={24} x2={15} y2={19}   stroke="#00CCFF" strokeWidth={1.2} />
      <line x1={15} y1={24} x2={19} y2={26.5} stroke="#00CCFF" strokeWidth={1.2} />
      <line x1={15} y1={24} x2={11} y2={26.5} stroke="#00CCFF" strokeWidth={1.2} />
      {/* Блик */}
      <rect x={12} y={17} width={26} height={3} rx={1} fill="#FFF" opacity={0.12} />
    </svg>
  );
}
