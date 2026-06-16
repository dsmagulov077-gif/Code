// Слой аксессуаров, накладывается поверх BuddySVG.
// Использует тот же viewBox "0 0 120 220".

import {
  AccTopHat, AccCrown, AccHalo,
  AccShades, AccVRHelm,
  AccFireAura, AccIceAura,
  AccCat,
} from './AccessorySVGs';

type Props = { equipped: string[] };

export function AccessoryLayer({ equipped }: Props) {
  if (equipped.length === 0) return null;
  const has = (id: string) => equipped.includes(id);
  return (
    <svg
      viewBox="0 0 120 220"
      width={120}
      height={210}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      {/* Аура — самый нижний слой */}
      {has('fireaura') && <AccFireAura />}
      {has('iceaura')  && <AccIceAura />}
      {/* Питомец — рядом с бадди */}
      {has('cat')      && <AccCat />}
      {/* Очки / шлем — на лице */}
      {has('shades')   && <AccShades />}
      {has('vrhelm')   && <AccVRHelm />}
      {/* Головные уборы — поверх всего */}
      {has('tophat')   && <AccTopHat />}
      {has('halo')     && <AccHalo />}
      {has('crown')    && <AccCrown />}
    </svg>
  );
}
