// Анимации атаки для каждого оружия.
// Каждая FX-функция — отдельная анимация, позиционированная
// абсолютно внутри арены в точке клика (x, y).

import { motion } from 'framer-motion';
import {
  WeaponFist, WeaponHammer, WeaponBomb,
  WeaponRocket, WeaponMeteor, WeaponDragon,
} from './WeaponSVGs';

export type AttackAnim = { id: number; weaponId: string; x: number; y: number };

// Длительность каждой анимации (мс) — Game.tsx использует для cleanup
export const ANIM_DURATION: Record<string, number> = {
  fist: 500,
  hammer: 600,
  bomb: 820,
  lightning: 500,
  rocket: 720,
  meteor: 840,
  dragon: 880,
  nuke: 1080,
};

const ABS: React.CSSProperties = {
  position: 'absolute',
  pointerEvents: 'none',
  userSelect: 'none',
  zIndex: 10,
  transformOrigin: 'center',
};

export function AttackFX({ anim }: { anim: AttackAnim }) {
  const { weaponId, x, y } = anim;
  if (weaponId === 'fist')      return <FistFX x={x} y={y} />;
  if (weaponId === 'hammer')    return <HammerFX x={x} y={y} />;
  if (weaponId === 'bomb')      return <BombFX x={x} y={y} />;
  if (weaponId === 'lightning') return <LightningFX x={x} y={y} />;
  if (weaponId === 'rocket')    return <RocketFX x={x} y={y} />;
  if (weaponId === 'meteor')    return <MeteorFX x={x} y={y} />;
  if (weaponId === 'dragon')    return <DragonFX x={x} y={y} />;
  if (weaponId === 'nuke')      return <NukeFX x={x} y={y} />;
  return null;
}

/* ── Кулак — прилетает слева, удар ── */
function FistFX({ x, y }: { x: number; y: number }) {
  return (
    <motion.div
      style={{ ...ABS, left: x - 26, top: y - 26 }}
      initial={{ x: -95, rotate: -25, scale: 0.45, opacity: 1 }}
      animate={{
        x:       [-95,   0,   16,   0],
        rotate:  [-25,   0,   10,   0],
        scale:   [0.45, 1.5, 0.85,  0],
        opacity: [  1,   1,    1,   0],
      }}
      transition={{ duration: 0.5, times: [0, 0.52, 0.7, 1] }}
    ><WeaponFist size={52} /></motion.div>
  );
}

/* ── Молот — падает сверху + кольцо удара ── */
function HammerFX({ x, y }: { x: number; y: number }) {
  return (
    <>
      <motion.div
        style={{ ...ABS, left: x - 28, top: y - 28, transformOrigin: 'right top' }}
        initial={{ y: -120, rotate: -80, scale: 0.65, opacity: 1 }}
        animate={{
          y:       [-120,   0,  14,  0],
          rotate:  [ -80,   0,  12,  5],
          scale:   [0.65, 1.3, 0.9,  0],
          opacity: [   1,   1,   1,  0],
        }}
        transition={{ duration: 0.58, times: [0, 0.54, 0.72, 1], ease: 'easeIn' }}
      ><WeaponHammer size={56} /></motion.div>

      {/* Кольцо удара */}
      <motion.div
        style={{ ...ABS, left: x - 36, top: y - 36, width: 72, height: 72, border: '3px solid #FF9800', borderRadius: '50%' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 2.8], opacity: [0, 0.95, 0] }}
        transition={{ duration: 0.58, times: [0, 0.5, 1] }}
      />
    </>
  );
}

/* ── Бомба — падает сверху, взрыв ── */
function BombFX({ x, y }: { x: number; y: number }) {
  return (
    <>
      {/* Бомба падает */}
      <motion.div
        style={{ ...ABS, left: x - 24, top: y - 24 }}
        initial={{ y: -y - 55, scale: 0.5, rotate: -15, opacity: 1 }}
        animate={{ y: [-y - 55, 0], scale: [0.5, 1.1], rotate: [-15, 22], opacity: [1, 1] }}
        transition={{ duration: 0.38, ease: 'easeIn' }}
      ><WeaponBomb size={48} /></motion.div>

      {/* Вспышка взрыва */}
      <motion.div
        style={{ ...ABS, left: x - 55, top: y - 55, width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle, #fff 0%, #FF9800 45%, transparent 100%)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 2.8, 3.6], opacity: [0, 1, 0.7, 0] }}
        transition={{ duration: 0.68, times: [0, 0.4, 0.65, 1] }}
      />

      {/* 💥 поднимается вверх */}
      <motion.div
        style={{ ...ABS, left: x - 22, top: y - 22, fontSize: 44 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 1.5, 0.9, 0], opacity: [0, 0, 1, 1, 0], y: [0, 0, -5, -26, -54] }}
        transition={{ duration: 0.72, times: [0, 0.36, 0.5, 0.75, 1] }}
      >💥</motion.div>
    </>
  );
}

/* ── ⚡ Молния — зигзаг сверху + вспышка ── */
function LightningFX({ x, y }: { x: number; y: number }) {
  const h = y + 10;
  // Зигзагообразный путь от верхнего края арены до точки клика
  const bolt = [
    `M${x},0`,
    `L${x - 14},${h * 0.22}`, `L${x + 12},${h * 0.22}`,
    `L${x - 11},${h * 0.48}`, `L${x + 10},${h * 0.48}`,
    `L${x - 8}, ${h * 0.74}`, `L${x + 7}, ${h * 0.74}`,
    `L${x},${h}`,
  ].join(' ');

  return (
    <div style={{ ...ABS, left: 0, top: 0, width: '100%', height: '100%' }}>
      {/* Болт мигает */}
      <motion.svg
        width="100%" height="100%"
        style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.55, 1, 0.3, 1, 0] }}
        transition={{ duration: 0.48, times: [0, 0.08, 0.18, 0.3, 0.44, 0.56, 1] }}
      >
        {/* Свечение */}
        <path d={bolt} stroke="#fff" strokeWidth={14} fill="none" opacity={0.2} strokeLinecap="round" strokeLinejoin="round" />
        {/* Жёлтый болт */}
        <path d={bolt} stroke="#FFE500" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Белый центр */}
        <path d={bolt} stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>

      {/* Вспышка в точке удара */}
      <motion.div
        style={{ ...ABS, left: x - 28, top: y - 28, width: 56, height: 56, borderRadius: '50%', background: 'radial-gradient(circle, #fff 0%, #FFE500 55%, transparent 100%)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 2.2, 0], opacity: [0, 0, 1, 0] }}
        transition={{ duration: 0.44, times: [0, 0.06, 0.26, 1] }}
      />
    </div>
  );
}

/* ── Ракета — летит слева + взрыв ── */
function RocketFX({ x, y }: { x: number; y: number }) {
  return (
    <>
      <motion.div
        style={{ ...ABS, left: x - 24, top: y - 24 }}
        initial={{ x: -x - 90, rotate: -8, scale: 0.5, opacity: 1 }}
        animate={{
          x:       [-x - 90,    0,  28],
          scale:   [     0.5, 1.25, 1.7],
          rotate:  [      -8,    0,  10],
          opacity: [       1,    1,   0],
        }}
        transition={{ duration: 0.44, times: [0, 0.78, 1], ease: 'easeIn' }}
      ><WeaponRocket size={48} /></motion.div>

      {/* Взрыв */}
      <motion.div
        style={{ ...ABS, left: x - 52, top: y - 52, width: 104, height: 104, borderRadius: '50%', background: 'radial-gradient(circle, #fff 0%, #FF5722 38%, transparent 100%)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 3.2], opacity: [0, 1, 0] }}
        transition={{ duration: 0.68, times: [0, 0.6, 1] }}
      />
    </>
  );
}

/* ── Метеор — по диагонали сверху-справа + шлейф + удар ── */
function MeteorFX({ x, y }: { x: number; y: number }) {
  const sizes = [44, 34, 24];
  return (
    <>
      {/* Шлейф из 3 копий с задержкой */}
      {[0, 1, 2].map((i) => {
        const s = sizes[i];
        return (
          <motion.div
            key={i}
            style={{ ...ABS, left: x - s / 2, top: y - s / 2, opacity: 1 - i * 0.28 }}
            initial={{ x: 190 + i * 38, y: -y - 65 - i * 32, scale: 0.45 + i * 0.08 }}
            animate={{ x: [190 + i * 38, i * 12], y: [-y - 65 - i * 32, i * 14], scale: [0.45 + i * 0.08, 0] }}
            transition={{ duration: 0.44, delay: i * 0.028, ease: 'easeIn' }}
          ><WeaponMeteor size={s} /></motion.div>
        );
      })}

      {/* Ударная вспышка */}
      <motion.div
        style={{ ...ABS, left: x - 58, top: y - 58, width: 116, height: 116, borderRadius: '50%', background: 'radial-gradient(circle, #fff 0%, #FF5722 28%, #FF9800 52%, transparent 100%)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 3.4], opacity: [0, 1, 0] }}
        transition={{ duration: 0.72, times: [0, 0.4, 1] }}
      />
    </>
  );
}

/* ── Дракон — появляется слева + конус огня вправо ── */
function DragonFX({ x, y }: { x: number; y: number }) {
  const angles = [-40, -20, 0, 20, 40];
  return (
    <>
      {/* Дракон */}
      <motion.div
        style={{ ...ABS, left: x - 36, top: y - 36 }}
        initial={{ x: -75, scale: 0, opacity: 0 }}
        animate={{ x: [-75, 0, 8, 10], scale: [0, 1.35, 1.1, 0], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.65, times: [0, 0.24, 0.7, 1] }}
      ><WeaponDragon size={72} /></motion.div>

      {/* Конус из 🔥 */}
      {angles.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <motion.div
            key={i}
            style={{ ...ABS, left: x - 18, top: y - 18, fontSize: 30 }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x:       [0, Math.cos(rad) * 92],
              y:       [0, Math.sin(rad) * 72],
              scale:   [0, 1.25, 0],
              opacity: [0,    1, 0],
            }}
            transition={{ duration: 0.56, delay: 0.2 + i * 0.032 }}
          >🔥</motion.div>
        );
      })}
    </>
  );
}

/* ── ☢️ Ядерка — два кольца волны + гриб ── */
function NukeFX({ x, y }: { x: number; y: number }) {
  return (
    <>
      {/* Центральная вспышка */}
      <motion.div
        style={{ ...ABS, left: x - 65, top: y - 65, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, #fff 0%, rgba(255,210,0,0.65) 50%, transparent 100%)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 4.2], opacity: [0, 1, 0] }}
        transition={{ duration: 0.72, times: [0, 0.2, 1] }}
      />

      {/* Ударная волна 1 */}
      <motion.div
        style={{ ...ABS, left: x - 52, top: y - 52, width: 104, height: 104, borderRadius: '50%', border: '5px solid rgba(255, 90, 0, 0.85)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 5.8], opacity: [0, 1, 0] }}
        transition={{ duration: 0.95, times: [0, 0.18, 1] }}
      />

      {/* Ударная волна 2 (чуть медленнее) */}
      <motion.div
        style={{ ...ABS, left: x - 52, top: y - 52, width: 104, height: 104, borderRadius: '50%', border: '3px solid rgba(255, 200, 50, 0.6)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 4.2], opacity: [0, 0.85, 0] }}
        transition={{ duration: 1.05, times: [0, 0.28, 1] }}
      />

      {/* Ядерный гриб ☢️ */}
      <motion.div
        style={{ ...ABS, left: x - 32, top: y - 32, fontSize: 64 }}
        initial={{ scale: 0, opacity: 0, y: 12 }}
        animate={{ scale: [0, 0, 2.4, 1.7, 0], opacity: [0, 0, 1, 1, 0], y: [12, 12, -18, -44, -72] }}
        transition={{ duration: 1.06, times: [0, 0.24, 0.44, 0.72, 1] }}
      >☢️</motion.div>
    </>
  );
}
