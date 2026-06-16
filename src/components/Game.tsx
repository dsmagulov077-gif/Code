import { useEffect, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useAnimationControls,
  useMotionValue,
  useAnimationFrame,
} from 'framer-motion';
import { supabase } from '../lib/supabase';
import { BuddySVG } from './BuddySVG';
import { AttackFX, AttackAnim, ANIM_DURATION } from './AttackFX';
import {
  WeaponFist, WeaponHammer, WeaponBomb, WeaponLightning,
  WeaponRocket, WeaponMeteor, WeaponDragon, WeaponNuke,
} from './WeaponSVGs';
import { LocationSkyline } from './LocationSkyline';
import { AccessoryLayer } from './AccessoryLayer';
import { CrateSmall, CrateMedium, CrateLarge } from './CrateSVG';

type Weapon = {
  id: string;
  name: string;
  icon: React.ReactNode;
  damage: number;
  coins: number;
  price?: number;
  special?: boolean;
  fxEmoji?: string;
  banner?: string;
};

type AccSlot = 'hat' | 'face' | 'aura' | 'pet';
type Accessory = {
  id: string;
  name: string;
  slot: AccSlot;
  icon: string;
  price: number;
};

const ACCESSORIES: Accessory[] = [
  { id: 'tophat',   name: 'Цилиндр',  slot: 'hat',  icon: '🎩', price: 50   },
  { id: 'halo',     name: 'Нимб',     slot: 'hat',  icon: '✨', price: 100  },
  { id: 'crown',    name: 'Корона',   slot: 'hat',  icon: '👑', price: 200  },
  { id: 'shades',   name: 'Очки',     slot: 'face', icon: '🕶️', price: 80   },
  { id: 'vrhelm',   name: 'ВР-шлем',  slot: 'face', icon: '🥽', price: 300  },
  { id: 'fireaura', name: 'Огонь',    slot: 'aura', icon: '🔥', price: 400  },
  { id: 'iceaura',  name: 'Лёд',      slot: 'aura', icon: '❄️', price: 400  },
  { id: 'cat',      name: 'Котик',    slot: 'pet',  icon: '🐱', price: 600  },
];

const SLOT_LABEL: Record<AccSlot, string> = {
  hat:  'Шляпа',
  face: 'Лицо',
  aura: 'Аура',
  pet:  'Питомец',
};

const WEAPONS: Weapon[] = [
  { id: 'fist',      name: 'Кулак',   icon: <WeaponFist />,      damage: 8,  coins: 1  },
  { id: 'hammer',    name: 'Молот',   icon: <WeaponHammer />,    damage: 18, coins: 3  },
  { id: 'bomb',      name: 'Бомба',   icon: <WeaponBomb />,      damage: 35, coins: 6  },
  { id: 'lightning', name: 'Молния',  icon: <WeaponLightning />, damage: 50, coins: 10 },
];

const SPECIALS: Weapon[] = [
  { id: 'rocket', name: 'Ракета', icon: <WeaponRocket />, damage: 120, coins: 20,  price: 100,  special: true, fxEmoji: '🚀', banner: 'BOOM!'          },
  { id: 'meteor', name: 'Метеор', icon: <WeaponMeteor />, damage: 250, coins: 40,  price: 300,  special: true, fxEmoji: '☄️', banner: 'METEOR STRIKE!' },
  { id: 'dragon', name: 'Дракон', icon: <WeaponDragon />, damage: 400, coins: 70,  price: 700,  special: true, fxEmoji: '🔥', banner: 'FATALITY!'      },
  { id: 'nuke',   name: 'Ядерка', icon: <WeaponNuke />,   damage: 999, coins: 150, price: 1500, special: true, fxEmoji: '☢️', banner: 'NUCLEAR!'       },
];

const BASE_HP = 100;
const HP_PER_KILL = 25;
const GRAVITY = 1.3;
const RESTITUTION = 0.5;
const AIR_DRAG = 0.99;
const GROUND_FRICTION = 0.82;
const BUDDY_HALF_W = 55;
const BUDDY_HALF_H = 75;

type Hit = { id: number; x: number; y: number; value: number; crit: boolean };
type Particle = { id: number; angle: number; dist: number; emoji: string };

let hitCounter = 0;
let particleCounter = 0;

type BuddyVariant = { id: string; name: string; rarity: 'common' | 'rare' | 'epic'; coinMult: number; filter: string; emoji: string };

const BUDDY_VARIANTS: BuddyVariant[] = [
  { id: 'default', name: 'Стандарт', rarity: 'common', coinMult: 1.0, filter: '',                                                          emoji: '😊' },
  { id: 'gold',    name: 'Золотой',  rarity: 'common', coinMult: 1.5, filter: 'sepia(1) saturate(3) hue-rotate(5deg) brightness(1.1)',      emoji: '✨' },
  { id: 'robot',   name: 'Робот',    rarity: 'common', coinMult: 1.8, filter: 'grayscale(0.6) hue-rotate(200deg) saturate(2)',              emoji: '🤖' },
  { id: 'witch',   name: 'Ведьма',   rarity: 'rare',   coinMult: 2.2, filter: 'hue-rotate(270deg) saturate(1.6) brightness(0.95)',          emoji: '🧙' },
  { id: 'zombie',  name: 'Зомби',    rarity: 'rare',   coinMult: 2.5, filter: 'hue-rotate(90deg) saturate(1.2) brightness(0.85)',           emoji: '🧟' },
  { id: 'ghost',   name: 'Призрак',  rarity: 'epic',   coinMult: 3.0, filter: 'grayscale(1) brightness(1.6)',                               emoji: '👻' },
  { id: 'fire',    name: 'Огненный', rarity: 'epic',   coinMult: 3.5, filter: 'hue-rotate(165deg) saturate(2.5) brightness(1.05)',          emoji: '🔥' },
  { id: 'cosmic',  name: 'Космос',   rarity: 'epic',   coinMult: 4.0, filter: 'hue-rotate(220deg) saturate(2) brightness(1.15)',            emoji: '🌌' },
];

const RARITY_COLOR = { common: '#c9851f', rare: '#6B44CC', epic: '#e53935' } as const;

type CrateShopItem = { id: 'small' | 'medium' | 'large'; name: string; price: number; pool: string[] };

const CRATE_SHOP: CrateShopItem[] = [
  { id: 'small',  name: 'Малый ящик',   price: 80,  pool: ['gold', 'robot']           },
  { id: 'medium', name: 'Средний ящик', price: 250, pool: ['witch', 'zombie']          },
  { id: 'large',  name: 'Большой ящик', price: 600, pool: ['ghost', 'fire', 'cosmic']  },
];

export function Game({ userEmail, userId }: { userEmail: string; userId: string }) {
  const [maxHp, setMaxHp] = useState(BASE_HP);
  const [hp, setHp] = useState(BASE_HP);
  const [kills, setKills] = useState(0);
  const [coins, setCoins] = useState(0);
  const [totalDamage, setTotalDamage] = useState(0);
  const [weapon, setWeapon] = useState<Weapon>(WEAPONS[0]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [hits, setHits] = useState<Hit[]>([]);
  const [combo, setCombo] = useState(0);
  const [fainted, setFainted] = useState(false);
  const [msg, setMsg] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [loading, setLoading] = useState(true);

  const [victoryFx, setVictoryFx] = useState<Weapon | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [attackAnims, setAttackAnims] = useState<AttackAnim[]>([]);
  const [ownedAcc, setOwnedAcc] = useState<Set<string>>(new Set());
  const [equippedAcc, setEquippedAcc] = useState<string[]>([]);
  const [ownedBuddies, setOwnedBuddies] = useState<Set<string>>(new Set(['default']));
  const [activeBuddy, setActiveBuddy] = useState('default');
  const [revealBuddy, setRevealBuddy] = useState<BuddyVariant | null>(null);

  const comboTimer = useRef<number | null>(null);
  const msgTimer = useRef<number | null>(null);
  const saveTimer = useRef<number | null>(null);
  const attackCounter = useRef(0);
  const screenControls = useAnimationControls();
  const arenaRef = useRef<HTMLDivElement>(null);

  const phys = useRef({ x: 0, y: 0, vx: 0, vy: 0, angle: 0, angVel: 0, resting: false });
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const mrot = useMotionValue(0);
  const mscale = useMotionValue(1);

  // Загрузка прогресса при старте
  useEffect(() => {
    supabase
      .from('game_progress')
      .select('coins, total_damage, owned_weapons, kills, max_hp, owned_accessories, equipped_accessories, owned_buddies, active_buddy')
      .eq('user_id', userId)
      .single()
      .then(({ data }: { data: { coins: number; total_damage: number; owned_weapons: string[]; kills: number; max_hp: number; owned_accessories: string[]; equipped_accessories: string[]; owned_buddies: string[]; active_buddy: string } | null }) => {
        if (data) {
          setCoins(data.coins);
          setTotalDamage(data.total_damage);
          setOwned(new Set(data.owned_weapons));
          setKills(data.kills);
          const savedMaxHp = data.max_hp ?? BASE_HP;
          setMaxHp(savedMaxHp);
          setHp(savedMaxHp);
          setOwnedAcc(new Set(data.owned_accessories ?? []));
          setEquippedAcc(data.equipped_accessories ?? []);
          const savedBuddies = new Set(data.owned_buddies ?? ['default']);
          if (!savedBuddies.has('default')) savedBuddies.add('default');
          setOwnedBuddies(savedBuddies);
          setActiveBuddy(data.active_buddy ?? 'default');
        }
        setLoading(false);
      });
  }, [userId]);

  // Автосохранение с дебаунсом 1.5с после каждого изменения монет/урона/купленных
  function scheduleSave(
    nextCoins: number,
    nextDamage: number,
    nextOwned: Set<string>,
    nextKills: number,
    nextMaxHp: number,
    nextOwnedAcc: Set<string> = ownedAcc,
    nextEquippedAcc: string[] = equippedAcc,
    nextOwnedBuddies: Set<string> = ownedBuddies,
    nextActiveBuddy: string = activeBuddy,
  ) {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    saveTimer.current = window.setTimeout(async () => {
      await supabase.from('game_progress').upsert(
        {
          user_id: userId,
          coins: nextCoins,
          total_damage: nextDamage,
          owned_weapons: Array.from(nextOwned),
          kills: nextKills,
          max_hp: nextMaxHp,
          owned_accessories: Array.from(nextOwnedAcc),
          equipped_accessories: nextEquippedAcc,
          owned_buddies: Array.from(nextOwnedBuddies),
          active_buddy: nextActiveBuddy,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      setSaveStatus('saved');
      window.setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1500);
  }

  // Физический цикл
  useAnimationFrame(() => {
    const p = phys.current;
    const arena = arenaRef.current;
    if (!arena) return;

    const halfW = arena.clientWidth / 2 - BUDDY_HALF_W;
    const floor = arena.clientHeight / 2 - BUDDY_HALF_H;
    const ceil = -(arena.clientHeight / 2 - BUDDY_HALF_H);

    p.vy += GRAVITY;
    p.x += p.vx;
    p.y += p.vy;
    p.angle += p.angVel;

    if (p.y > floor) {
      p.y = floor;
      if (Math.abs(p.vy) > 1.5) p.vy = -p.vy * RESTITUTION;
      else p.vy = 0;
      p.vx *= GROUND_FRICTION;
      p.angVel *= 0.6;
    }
    if (p.y < ceil) {
      p.y = ceil;
      p.vy = -p.vy * RESTITUTION;
    }
    if (p.x > halfW) {
      p.x = halfW;
      p.vx = -p.vx * RESTITUTION;
      p.angVel += p.vx * 0.05;
    }
    if (p.x < -halfW) {
      p.x = -halfW;
      p.vx = -p.vx * RESTITUTION;
      p.angVel += p.vx * 0.05;
    }

    p.vx *= AIR_DRAG;
    p.angVel *= AIR_DRAG;

    const slow = Math.abs(p.vx) < 0.4 && Math.abs(p.vy) < 0.4;
    p.resting = !fainted && p.y >= floor - 1 && slow;
    if (p.resting) p.angVel *= 0.7;

    mscale.set(mscale.get() + (1 - mscale.get()) * 0.18);
    mx.set(p.x);
    my.set(p.y);
    mrot.set(p.angle);
  });

  useEffect(() => {
    if (fainted) return;
    const t = window.setInterval(() => {
      setHp((h) => Math.min(maxHp, h + 1));
    }, 350);
    return () => window.clearInterval(t);
  }, [fainted, maxHp]);

  function flash(text: string) {
    setMsg(text);
    if (msgTimer.current) window.clearTimeout(msgTimer.current);
    msgTimer.current = window.setTimeout(() => setMsg(''), 1800);
  }

  function pickWeapon(w: Weapon) {
    if (w.special && !owned.has(w.id)) {
      const price = w.price ?? 0;
      if (coins < price) {
        flash(`Не хватает монет: нужно ${price} 🪙`);
        return;
      }
      const nextCoins = coins - price;
      const nextOwned = new Set(owned).add(w.id);
      setCoins(nextCoins);
      setOwned(nextOwned);
      flash(`Куплено: ${w.name}!`);
      scheduleSave(nextCoins, totalDamage, nextOwned, kills, maxHp);
    }
    setWeapon(w);
  }

  function pickAccessory(a: Accessory) {
    if (!ownedAcc.has(a.id)) {
      if (coins < a.price) {
        flash(`Не хватает монет: нужно ${a.price} 🪙`);
        return;
      }
      const nextCoins = coins - a.price;
      const nextOwnedAcc = new Set(ownedAcc).add(a.id);
      // Купили — сразу надеваем, снимая предыдущий аксессуар того же слота
      const nextEquipped = equippedAcc
        .filter(id => ACCESSORIES.find(x => x.id === id)?.slot !== a.slot)
        .concat(a.id);
      setCoins(nextCoins);
      setOwnedAcc(nextOwnedAcc);
      setEquippedAcc(nextEquipped);
      scheduleSave(nextCoins, totalDamage, owned, kills, maxHp, nextOwnedAcc, nextEquipped);
      flash(`Куплено: ${a.name}!`);
    } else {
      // Переключаем экипировку
      const isEquipped = equippedAcc.includes(a.id);
      const nextEquipped = isEquipped
        ? equippedAcc.filter(id => id !== a.id)
        : equippedAcc.filter(id => ACCESSORIES.find(x => x.id === id)?.slot !== a.slot).concat(a.id);
      setEquippedAcc(nextEquipped);
      scheduleSave(coins, totalDamage, owned, kills, maxHp, ownedAcc, nextEquipped);
    }
  }

  function triggerVictory(w: Weapon) {
    setVictoryFx(w);
    const burst: Particle[] = Array.from({ length: 14 }, (_, i) => ({
      id: ++particleCounter,
      angle: (360 / 14) * i + Math.random() * 10,
      dist: 90 + Math.random() * 80,
      emoji: w.fxEmoji ?? '💥',
    }));
    setParticles(burst);
    screenControls.start({ x: [0, -14, 14, -10, 10, -5, 5, 0], transition: { duration: 0.5 } });
    window.setTimeout(() => {
      setVictoryFx(null);
      setParticles([]);
    }, 1500);
  }

  function hitBuddy(e: React.MouseEvent<HTMLDivElement>) {
    if (fainted) return;
    const arena = arenaRef.current;
    if (!arena) return;
    const rect = arena.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const crit = !weapon.special && Math.random() < 0.18;
    const dmg = Math.round(weapon.damage * (crit ? 2 : 1) * (0.85 + Math.random() * 0.3));
    const activeVariantLocal = BUDDY_VARIANTS.find(v => v.id === activeBuddy) ?? BUDDY_VARIANTS[0];
    const earned = Math.round(weapon.coins * (crit ? 2 : 1) * activeVariantLocal.coinMult);

    const id = ++hitCounter;
    setHits((prev) => [...prev, { id, x: clickX, y: clickY, value: dmg, crit }]);
    window.setTimeout(() => setHits((prev) => prev.filter((h) => h.id !== id)), 800);

    // Анимация атаки выбранного оружия
    const animId = ++attackCounter.current;
    setAttackAnims((prev) => [...prev, { id: animId, weaponId: weapon.id, x: clickX, y: clickY }]);
    window.setTimeout(() => {
      setAttackAnims((prev) => prev.filter((a) => a.id !== animId));
    }, ANIM_DURATION[weapon.id] ?? 600);

    const nextDamage = totalDamage + dmg;
    const nextCoins = coins + earned;
    setTotalDamage(nextDamage);
    setCoins(nextCoins);
    scheduleSave(nextCoins, nextDamage, owned, kills, maxHp);

    setCombo((c) => c + 1);
    if (comboTimer.current) window.clearTimeout(comboTimer.current);
    comboTimer.current = window.setTimeout(() => setCombo(0), 1500);

    const p = phys.current;
    const buddyCenterX = rect.width / 2 + p.x;
    const buddyCenterY = rect.height / 2 + p.y;
    let dx = buddyCenterX - clickX;
    let dy = buddyCenterY - clickY;
    const dist = Math.hypot(dx, dy) || 1;
    dx /= dist;
    dy /= dist;

    const force = weapon.special ? 14 + dmg * 0.05 : dmg * 0.7;
    p.vx += dx * force;
    p.vy += dy * force - (weapon.special ? 24 : dmg * 0.2);
    p.angVel += (Math.random() - 0.5) * (weapon.special ? 40 : dmg * 1.2);
    mscale.set(0.8);

    if (weapon.special) triggerVictory(weapon);
    else if (crit) {
      screenControls.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.3 } });
    }

    setHp((prev) => {
      const next = prev - dmg;
      if (next <= 0) {
        knockout(weapon.special ? 0 : 50, nextCoins, nextDamage);
        return 0;
      }
      return next;
    });
  }

  function openCrate(crate: CrateShopItem) {
    if (coins < crate.price) {
      flash(`Не хватает монет: нужно ${crate.price} 🪙`);
      return;
    }
    let nextCoins = coins - crate.price;
    const variantId = crate.pool[Math.floor(Math.random() * crate.pool.length)];
    const variant = BUDDY_VARIANTS.find(v => v.id === variantId)!;
    const nextOwnedBuddies = new Set(ownedBuddies);
    let nextActiveBuddy = activeBuddy;

    if (ownedBuddies.has(variantId)) {
      const bonus = Math.floor(crate.price * 0.4);
      nextCoins += bonus;
      flash(`Дубликат ${variant.emoji}! +${bonus} 🪙`);
    } else {
      nextOwnedBuddies.add(variantId);
      nextActiveBuddy = variantId;
      setRevealBuddy(variant);
      window.setTimeout(() => setRevealBuddy(null), 2200);
    }

    setCoins(nextCoins);
    setOwnedBuddies(nextOwnedBuddies);
    setActiveBuddy(nextActiveBuddy);
    scheduleSave(nextCoins, totalDamage, owned, kills, maxHp, ownedAcc, equippedAcc, nextOwnedBuddies, nextActiveBuddy);
  }

  function knockout(bonus: number, currentCoins: number, currentDamage: number) {
    setFainted(true);
    setCombo(0);
    const finalCoins = bonus > 0 ? currentCoins + bonus : currentCoins;
    if (bonus > 0) setCoins(finalCoins);

    // Каждый нокаут → +HP_PER_KILL к максимальному здоровью
    const nextKills = kills + 1;
    const nextMaxHp = maxHp + HP_PER_KILL;
    setKills(nextKills);
    setMaxHp(nextMaxHp);
    flash(`+${HP_PER_KILL} HP! Теперь ${nextMaxHp} HP 💪`);

    scheduleSave(finalCoins, currentDamage, owned, nextKills, nextMaxHp);

    const p = phys.current;
    p.vy -= 22;
    p.vx += (Math.random() - 0.5) * 20;
    p.angVel += (Math.random() - 0.5) * 30;

    window.setTimeout(() => {
      const fresh = phys.current;
      fresh.x = 0; fresh.y = 0;
      fresh.vx = 0; fresh.vy = 0;
      fresh.angle = 0; fresh.angVel = 0;
      mx.set(0); my.set(0); mrot.set(0); mscale.set(1);
      setFainted(false);
      setHp(nextMaxHp);
    }, 1800);
  }

  const hpPercent = (hp / maxHp) * 100;
  const activeVariant = BUDDY_VARIANTS.find(v => v.id === activeBuddy) ?? BUDDY_VARIANTS[0];

  if (loading) {
    return (
      <section className="card">
        <p className="hello">Загрузка прогресса…</p>
      </section>
    );
  }

  return (
    <motion.section className="card" animate={screenControls}>
      <div className="game-header">
        <p className="hello">Привет, {userEmail} 👋</p>
        <span className="save-status">
          {saveStatus === 'saving' && '💾 Сохранение…'}
          {saveStatus === 'saved' && '✅ Сохранено'}
        </span>
      </div>

      <div className="game-stats">
        <div className="stat">
          <span className="stat-label">Монеты</span>
          <span className="stat-value">🪙 {coins}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Убийств</span>
          <span className="stat-value">💀 {kills}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Комбо</span>
          <span className="stat-value">🔥 x{combo}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Макс HP</span>
          <span className="stat-value">❤️ {maxHp}</span>
        </div>
      </div>

      <div className="hp-bar">
        <motion.div
          className="hp-fill"
          animate={{ width: `${hpPercent}%` }}
          transition={{ duration: 0.2 }}
          style={{ background: hpPercent > 50 ? '#4caf50' : hpPercent > 20 ? '#ff9800' : '#e53935' }}
        />
        <span className="hp-text">{hp} / {maxHp} HP</span>
      </div>

      <div className="arena" ref={arenaRef} style={{ backgroundColor: 'transparent' }}>
        <LocationSkyline />
        <motion.div className="buddy" onMouseDown={hitBuddy} style={{ x: mx, y: my, rotate: mrot, scale: mscale, position: 'relative', zIndex: 1, overflow: 'visible', pointerEvents: 'auto', cursor: 'pointer' }}>
          <div style={{ position: 'relative', ...(activeVariant.filter ? { filter: activeVariant.filter } : {}) }}>
            <BuddySVG hp={hp} fainted={fainted} />
            <AccessoryLayer equipped={equippedAcc} />
          </div>
        </motion.div>

        {/* Анимации атаки оружия */}
        {attackAnims.map((anim) => (
          <AttackFX key={anim.id} anim={anim} />
        ))}

        <AnimatePresence>
          {hits.map((h) => (
            <motion.div
              key={h.id}
              className={`damage-number ${h.crit ? 'crit' : ''}`}
              style={{ left: h.x, top: h.y }}
              initial={{ opacity: 1, y: 0, scale: h.crit ? 1.4 : 1 }}
              animate={{ opacity: 0, y: -60, scale: h.crit ? 1.8 : 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {h.crit ? `КРИТ! -${h.value}` : `-${h.value}`}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {victoryFx && (
            <motion.div key="victory" className="victory-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="victory-flash" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }} />
              <motion.div className="victory-emoji" initial={{ scale: 0, rotate: -180 }} animate={{ scale: [0, 2.2, 1.6], rotate: [-180, 20, 0] }} transition={{ duration: 0.6 }}>
                {victoryFx.fxEmoji}
              </motion.div>
              {particles.map((pt) => (
                <motion.div
                  key={pt.id}
                  className="victory-particle"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: Math.cos((pt.angle * Math.PI) / 180) * pt.dist, y: Math.sin((pt.angle * Math.PI) / 180) * pt.dist, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                >
                  {pt.emoji}
                </motion.div>
              ))}
              <motion.div className="victory-banner" initial={{ scale: 0, y: 20 }} animate={{ scale: [0, 1.3, 1], y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                {victoryFx.banner}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {fainted && !victoryFx && <div className="ko-text">НОКАУТ! +50 🪙</div>}
        {!fainted && !victoryFx && <p className="arena-hint">Тапай по бадди 👆</p>}

        {/* Анимация получения нового персонажа */}
        <AnimatePresence>
          {revealBuddy && (
            <motion.div
              key="reveal"
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,10,30,0.72)', zIndex: 20, borderRadius: 16, pointerEvents: 'none' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: [0, 1.25, 1], rotate: [-180, 18, 0] }}
                transition={{ duration: 0.65, ease: 'backOut' }}
                style={{ filter: revealBuddy.filter || undefined }}
              >
                <BuddySVG hp={100} fainted={false} />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                style={{ color: '#fff', fontSize: 22, fontWeight: 900, marginTop: 8, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
              >
                {revealBuddy.emoji} {revealBuddy.name}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{ color: RARITY_COLOR[revealBuddy.rarity], fontWeight: 800, fontSize: 14, marginTop: 2 }}
              >
                x{revealBuddy.coinMult} монет за удар
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {msg && <p className="message">{msg}</p>}

      <div className="weapons">
        {WEAPONS.map((w) => (
          <button key={w.id} className={`weapon ${weapon.id === w.id ? 'active' : ''}`} onClick={() => pickWeapon(w)}>
            <span className="weapon-emoji">{w.icon}</span>
            <span className="weapon-name">{w.name}</span>
            <span className="weapon-dmg">{w.damage} dmg</span>
          </button>
        ))}
      </div>

      <h3 className="shop-title">⭐ Особые оружия</h3>
      <div className="weapons">
        {SPECIALS.map((w) => {
          const isOwned = owned.has(w.id);
          const canAfford = coins >= (w.price ?? 0);
          return (
            <button
              key={w.id}
              className={`weapon special ${weapon.id === w.id ? 'active' : ''} ${!isOwned && !canAfford ? 'locked' : ''}`}
              onClick={() => pickWeapon(w)}
            >
              <span className="weapon-emoji">{w.icon}</span>
              <span className="weapon-name">{w.name}</span>
              {isOwned
                ? <span className="weapon-dmg">{w.damage} dmg</span>
                : <span className="weapon-price">🪙 {w.price}</span>
              }
            </button>
          );
        })}
      </div>
      <h3 className="shop-title">🎨 Аксессуары</h3>
      <div className="accessories">
        {ACCESSORIES.map((a) => {
          const isOwned    = ownedAcc.has(a.id);
          const isEquipped = equippedAcc.includes(a.id);
          const canAfford  = coins >= a.price;
          return (
            <button
              key={a.id}
              className={`accessory${isEquipped ? ' acc-equipped' : isOwned ? ' acc-owned' : !canAfford ? ' acc-locked' : ''}`}
              onClick={() => pickAccessory(a)}
            >
              <span className="acc-icon">{a.icon}</span>
              <span className="acc-name">{a.name}</span>
              <span className="acc-slot">{SLOT_LABEL[a.slot]}</span>
              {isEquipped
                ? <span className="acc-tag">✓ Надето</span>
                : isOwned
                ? <span className="acc-wear">Надеть</span>
                : <span className="acc-price">🪙 {a.price}</span>
              }
            </button>
          );
        })}
      </div>

      <h3 className="shop-title">🎁 Ящики с персонажами</h3>
      <div className="crate-shop">
        {CRATE_SHOP.map(crate => {
          const canAfford = coins >= crate.price;
          const previews = crate.pool.map(id => BUDDY_VARIANTS.find(v => v.id === id)!);
          return (
            <button
              key={crate.id}
              className={`crate-shop-item${!canAfford ? ' crate-locked' : ''}`}
              onClick={() => openCrate(crate)}
            >
              {crate.id === 'small'  && <CrateSmall />}
              {crate.id === 'medium' && <CrateMedium />}
              {crate.id === 'large'  && <CrateLarge />}
              <span className="crate-shop-name">{crate.name}</span>
              <span className="crate-shop-price">🪙 {crate.price}</span>
              <span className="crate-shop-pool">{previews.map(v => v.emoji).join(' ')}</span>
            </button>
          );
        })}
      </div>

      {ownedBuddies.size > 1 && (
        <>
          <h3 className="shop-title">👥 Персонажи</h3>
          <div className="buddy-collection">
            {BUDDY_VARIANTS.filter(v => ownedBuddies.has(v.id)).map(v => {
              const isActive = activeBuddy === v.id;
              return (
                <button
                  key={v.id}
                  className={`buddy-card${isActive ? ' buddy-active' : ''}`}
                  onClick={() => {
                    setActiveBuddy(v.id);
                    scheduleSave(coins, totalDamage, owned, kills, maxHp, ownedAcc, equippedAcc, ownedBuddies, v.id);
                  }}
                >
                  <div className="buddy-preview">
                    <div style={{ transform: 'scale(0.38)', transformOrigin: '0 0', filter: v.filter || undefined }}>
                      <BuddySVG hp={100} fainted={false} />
                    </div>
                  </div>
                  <span className="buddy-card-name">{v.emoji} {v.name}</span>
                  <span className="buddy-card-mult" style={{ color: RARITY_COLOR[v.rarity] }}>x{v.coinMult}</span>
                  {isActive && <span className="buddy-card-tag">✓ Активен</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </motion.section>
  );
}
