import { useEffect, useRef, useState } from 'react';

/* ── config ── */
const T  = 8;    // canvas pixels per tile
const SC = 3;    // CSS upscale (pixel art)
const MW = 20;   // map width tiles
const MH = 14;   // map height tiles
const CW = MW * T;
const CH = MH * T;
const rng = (n: number) => Math.floor(Math.random() * n);

/* ── tile ids ── */
const WALL = 0, FLOOR = 1, STAIRS = 2;

/* ── palette ── */
const C = {
  bg:'#120d06', wall:'#9c7a45', wallH:'#c7a368', wallS:'#5e451f', wallM:'#b08d52', wallG:'#d8b66a',
  floor:'#3a2e1a', flA:'#46371f', flR:'#2a2012', flG:'#8a6d3a', stair:'#c8a000', stairS:'#806600',
  hH:'#2255cc', hB:'#1a44aa', hSk:'#e8a878', hEy:'#220022', hBt:'#4a2810', hSw:'#c0c8d8',
  gSk:'#229944', gDk:'#116630', gEy:'#ffcc00', gTh:'#eeeebb',
  sBn:'#ccccaa', sDk:'#888866', sEy:'#4488ff',
  oSk:'#cc3333', oDk:'#882222', oTs:'#ddcc88',
  bRb:'#772299', bDk:'#441166', bSk:'#ccccaa', bEy:'#ff2200', bOr:'#ff6600',
  cBd:'#884422', cLd:'#cc6633', cGd:'#ddaa00',
  pBt:'#993399', pLq:'#ff88ff',
  hpG:'#22cc22', hpY:'#cccc22', hpR:'#cc2222',
};

type Ctx = CanvasRenderingContext2D;
const p = (c: Ctx, col: string, x: number, y: number, w = 1, h = 1) => {
  c.fillStyle = col; c.fillRect(x, y, w, h);
};

/* ── tile drawing ── */
function drawTile(c: Ctx, tile: number, x: number, y: number, row: number, col: number) {
  if (tile === WALL) {
    // ancient temple masonry: carved sandstone blocks with mortar seams
    p(c, C.wall, x, y, T, T);
    p(c, C.wallH, x, y, T, 1);          // sunlit top edge
    p(c, C.wallH, x, y, 1, T);          // sunlit left edge
    p(c, C.wallS, x, y+T-1, T, 1);      // mortar seam (bottom)
    p(c, C.wallS, x+T-1, y, 1, T);      // mortar seam (right)
    // brick offset: alternate rows shift the vertical seam for a stacked look
    const seam = (row % 2 === 0) ? x+3 : x+5;
    p(c, C.wallS, seam, y, 1, T);
    // engraved glyph in the block face (deterministic per tile)
    const h = (row*7 + col*13) % 4;
    if (h===0) { p(c, C.wallG, x+2, y+2, 1, 3); p(c, C.wallG, x+2, y+2, 3, 1); }      // ⌐ rune
    else if (h===1) { p(c, C.wallM, x+5, y+2, 1, 4); p(c, C.wallG, x+5, y+3, 2, 1); } // glyph
    else if (h===2) { p(c, C.wallG, x+2, y+4, 4, 1); p(c, C.wallM, x+3, y+2, 1, 4); } // cross
    else { p(c, C.wallM, x+3, y+3, 2, 2); }                                            // stud
  } else if (tile === FLOOR) {
    // temple flagstones: tiled slabs with inlaid border lines
    const g = (row + col) % 2;
    p(c, g===0 ? C.flA : C.floor, x, y, T, T);
    // faint grout lines between slabs
    p(c, C.flR, x, y, T, 1);
    p(c, C.flR, x, y, 1, T);
    // occasional gold inlay motif
    if ((row*5 + col*3) % 7 === 0) {
      p(c, C.flG, x+3, y+3, 2, 2);
      p(c, C.flG, x+3, y+1, 2, 1); p(c, C.flG, x+3, y+6, 2, 1);
      p(c, C.flG, x+1, y+3, 1, 2); p(c, C.flG, x+6, y+3, 1, 2);
    }
  } else if (tile === STAIRS) {
    p(c, C.floor, x, y, T, T);
    p(c, C.stair,  x,   y+6, T, 2);
    p(c, C.stair,  x+2, y+4, 6, 2);
    p(c, C.stair,  x+4, y+2, 4, 2);
    p(c, C.stair,  x+6, y,   2, 2);
    p(c, C.stairS, x,   y+7, T, 1);
  }
}

/* ── sprites (8×8 each) ── */
function drawHero(c: Ctx, x: number, y: number) {
  p(c,C.hH, x+2,y,  4,1); p(c,C.hH, x+1,y+1,6,1);
  p(c,C.hSk,x+2,y+2,4,2);
  p(c,C.hEy,x+3,y+3,1,1); p(c,C.hEy,x+5,y+3,1,1);
  p(c,C.hB, x+1,y+4,6,2);
  p(c,C.hSw,x+7,y+2,1,5); p(c,C.hSw,x+6,y+4,1,1);
  p(c,C.hB, x+1,y+6,3,1); p(c,C.hB, x+4,y+6,3,1);
  p(c,C.hBt,x+1,y+7,3,1); p(c,C.hBt,x+4,y+7,3,1);
}
function drawGoblin(c: Ctx, x: number, y: number) {
  p(c,C.gSk,x+1,y,  6,4);
  p(c,C.gDk,x,  y+1,1,2); p(c,C.gDk,x+7,y+1,1,2);
  p(c,C.gEy,x+2,y+1,1,1); p(c,C.gEy,x+5,y+1,1,1);
  p(c,C.gTh,x+2,y+3,1,1); p(c,C.gTh,x+5,y+3,1,1);
  p(c,C.gSk,x+2,y+4,4,2);
  p(c,C.gDk,x,  y+4,2,1); p(c,C.gDk,x+6,y+4,2,1);
  p(c,C.gDk,x+2,y+6,2,2); p(c,C.gDk,x+5,y+6,2,2);
}
function drawSkeleton(c: Ctx, x: number, y: number) {
  p(c,C.sBn,x+2,y,  4,4);
  p(c,C.sDk,x+2,y+2,1,2); p(c,C.sDk,x+5,y+2,1,2);
  p(c,C.sEy,x+2,y+2,1,1); p(c,C.sEy,x+5,y+2,1,1);
  p(c,C.sBn,x+3,y+4,2,1);
  p(c,C.sBn,x+1,y+5,6,1); p(c,C.sBn,x+3,y+5,2,1);
  p(c,C.sBn,x+2,y+6,2,2); p(c,C.sBn,x+5,y+6,2,2);
}
function drawOrc(c: Ctx, x: number, y: number) {
  p(c,C.oSk,x+1,y,  6,2);
  p(c,C.oSk,x,  y+2,8,2);
  p(c,C.oDk,x+3,y+1,1,1); p(c,C.oDk,x+5,y+1,1,1);
  p(c,C.oTs,x+3,y+4,1,1); p(c,C.oTs,x+5,y+4,1,1);
  p(c,C.oSk,x+1,y+4,6,3);
  p(c,C.oDk,x,  y+4,1,3); p(c,C.oDk,x+7,y+4,1,3);
  p(c,C.oDk,x+1,y+7,3,1); p(c,C.oDk,x+4,y+7,3,1);
}
function drawLich(c: Ctx, x: number, y: number) {
  p(c,C.bRb,x+1,y,  6,2); p(c,C.bRb,x+2,y+1,4,1);
  p(c,C.bSk,x+2,y+2,4,3);
  p(c,C.bDk,x+2,y+3,1,2); p(c,C.bDk,x+5,y+3,1,2);
  p(c,C.bEy,x+2,y+3,1,1); p(c,C.bEy,x+5,y+3,1,1);
  p(c,C.bRb,x+1,y+5,6,2);
  p(c,C.bDk,x,  y+5,1,3); p(c,C.bDk,x+7,y+5,1,3);
  p(c,C.bOr,x+7,y+3,1,2);
  p(c,C.bRb,x+2,y+7,2,1); p(c,C.bRb,x+5,y+7,2,1);
}
function drawChest(c: Ctx, x: number, y: number) {
  p(c,C.cBd,x+1,y+2,6,5);
  p(c,C.cLd,x+1,y+2,6,2);
  p(c,C.cGd,x+3,y+2,2,5); p(c,C.cGd,x+1,y+4,6,1);
  p(c,C.cGd,x+4,y+3,1,2);
}
function drawPotion(c: Ctx, x: number, y: number) {
  p(c,C.pBt,x+3,y,  2,2); p(c,C.pBt,x+2,y+2,4,1);
  p(c,C.pBt,x+1,y+3,6,4);
  p(c,C.pLq,x+2,y+4,4,3);
  p(c,C.cGd,x+3,y,  2,1);
}

/* ── types ── */
type MobKind = 'goblin' | 'skeleton' | 'orc' | 'boss';
interface Mob { id:number; x:number; y:number; kind:MobKind; name:string; hp:number; maxHp:number; atk:number; def:number; xp:number; gold:number; }
interface Item { id:number; x:number; y:number; kind:'chest'|'potion'; value:number; }
interface Player { x:number; y:number; hp:number; maxHp:number; atk:number; def:number; level:number; xp:number; xpNext:number; gold:number; potions:number; }
type Phase = 'play'|'dead'|'win';
interface Room { x:number; y:number; w:number; h:number; }

/* ── mob templates ── */
const TMPL: Record<string, {hp:number;atk:number;def:number;xp:number;gold:number;name:string}> = {
  goblin:   {hp:20,atk:4,def:0,xp:10,gold:4,  name:'Гоблин'},
  skeleton: {hp:25,atk:6,def:1,xp:14,gold:6,  name:'Скелет'},
  orc:      {hp:40,atk:9,def:2,xp:22,gold:12, name:'Орк'},
  boss1:    {hp:65,atk:9,def:2,xp:55,gold:35, name:'Лич'},
  boss2:    {hp:105,atk:14,def:4,xp:95,gold:60,name:'Некромант'},
  boss3:    {hp:165,atk:21,def:7,xp:165,gold:110,name:'Дракон'},
};

/* ── map generation ── */
function generateFloor(floorNum: number) {
  const map: number[][] = Array.from({length:MH}, () => Array(MW).fill(WALL));
  const rooms: Room[] = [];

  for (let tries = 0; tries < 80 && rooms.length < 6; tries++) {
    const rw = 4+rng(4), rh = 3+rng(3);
    const rx = 1+rng(MW-rw-2), ry = 1+rng(MH-rh-2);
    if (rooms.some(r => rx<r.x+r.w+1 && rx+rw+1>r.x && ry<r.y+r.h+1 && ry+rh+1>r.y)) continue;
    rooms.push({x:rx,y:ry,w:rw,h:rh});
    for (let cy=ry; cy<ry+rh; cy++) for (let cx=rx; cx<rx+rw; cx++) map[cy][cx] = FLOOR;
  }

  for (let i=1; i<rooms.length; i++) {
    const a=rooms[i-1], b=rooms[i];
    let cx=a.x+Math.floor(a.w/2), cy=a.y+Math.floor(a.h/2);
    const tx=b.x+Math.floor(b.w/2), ty=b.y+Math.floor(b.h/2);
    while (cx!==tx) { map[cy][cx]=FLOOR; cx+=cx<tx?1:-1; }
    while (cy!==ty) { map[cy][cx]=FLOOR; cy+=cy<ty?1:-1; }
  }

  const last = rooms[rooms.length-1];
  map[last.y+Math.floor(last.h/2)][last.x+Math.floor(last.w/2)] = STAIRS;

  const scale = 1+(floorNum-1)*0.3;
  const pool: MobKind[] = floorNum===1?['goblin','skeleton']:floorNum===2?['skeleton','orc']:['orc','orc'];
  const mobs: Mob[] = [];

  for (let i=1; i<rooms.length; i++) {
    const room=rooms[i], isBoss=i===rooms.length-1;
    const kind: MobKind = isBoss ? 'boss' : pool[rng(pool.length)];
    const key = isBoss ? `boss${Math.min(floorNum,3)}` : kind;
    const tpl = TMPL[key];
    const hp = Math.round(tpl.hp*scale);
    const mx = room.x+1+rng(Math.max(1,room.w-2));
    const my = room.y+1+rng(Math.max(1,room.h-2));
    if (map[my]?.[mx]===FLOOR && !mobs.some(m=>m.x===mx&&m.y===my))
      mobs.push({id:mobs.length,x:mx,y:my,kind,name:tpl.name,hp,maxHp:hp,atk:Math.round(tpl.atk*scale),def:tpl.def,xp:tpl.xp,gold:tpl.gold});
  }

  const items: Item[] = [];
  for (let i=1; i<rooms.length-1; i++) {
    if (rng(2)) continue;
    const room=rooms[i];
    const ix=room.x+rng(room.w), iy=room.y+rng(room.h);
    if (map[iy]?.[ix]===FLOOR && !mobs.some(m=>m.x===ix&&m.y===iy))
      items.push({id:items.length,x:ix,y:iy,kind:rng(2)?'potion':'chest',value:rng(2)?30:(5+rng(15))*floorNum});
  }

  const start = rooms[0];
  return {map, mobs, items, px:start.x+Math.floor(start.w/2), py:start.y+Math.floor(start.h/2)};
}

/* ── canvas render ── */
function render(canvas: HTMLCanvasElement, map: number[][], mobs: Mob[], items: Item[], player: Player) {
  const c = canvas.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  p(c, C.bg, 0, 0, CW, CH);

  for (let row=0; row<MH; row++)
    for (let col=0; col<MW; col++)
      drawTile(c, map[row][col], col*T, row*T, row, col);

  for (const it of items) {
    if (it.kind==='chest') drawChest(c, it.x*T, it.y*T);
    else drawPotion(c, it.x*T, it.y*T);
  }

  for (const mob of mobs) {
    const bx=mob.x*T, by=mob.y*T;
    if (mob.kind==='goblin')        drawGoblin(c,bx,by);
    else if (mob.kind==='skeleton') drawSkeleton(c,bx,by);
    else if (mob.kind==='orc')      drawOrc(c,bx,by);
    else                             drawLich(c,bx,by);
    // HP bar
    const bw = Math.round((mob.hp/mob.maxHp)*T);
    p(c,'#440000',bx,by-2,T,2);
    p(c, mob.hp>mob.maxHp*.5?C.hpG:C.hpR, bx,by-2,bw,2);
  }

  drawHero(c, player.x*T, player.y*T);
}

/* ── bar component ── */
function Bar({val,max,col}:{val:number;max:number;col:string}) {
  return (
    <div style={{height:8,background:'#1a1a2e',borderRadius:4,overflow:'hidden'}}>
      <div style={{height:'100%',width:`${Math.max(0,Math.round(val/max*100))}%`,background:col,borderRadius:4,transition:'width .2s'}}/>
    </div>
  );
}

/* ── d-pad button ── */
function Btn({label,onClick}:{label:string;onClick:()=>void}) {
  return (
    <button onClick={onClick} style={{width:48,height:48,fontSize:20,fontWeight:700,padding:0,borderRadius:10,lineHeight:1}}>
      {label}
    </button>
  );
}

/* ══════════ COMPONENT ══════════ */
const INIT_P = (x:number,y:number): Player => ({x,y,hp:80,maxHp:80,atk:8,def:1,level:1,xp:0,xpNext:30,gold:10,potions:1});

export function Dungeon({userEmail}:{userEmail:string}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const comboRef = useRef('');   // tracks typed chars for the "propusk" cheat
  const [floor, setFloor]       = useState(1);
  const [map, setMap]           = useState<number[][]>([]);
  const [mobs, setMobs]         = useState<Mob[]>([]);
  const [items, setItems]       = useState<Item[]>([]);
  const [player, setPlayer]     = useState<Player>(INIT_P(1,1));
  const [phase, setPhase]       = useState<Phase>('play');
  const [log, setLog]           = useState<string[]>(['⚔️ Добро пожаловать в подземелье!']);
  const [fightMob, setFightMob] = useState<Mob|null>(null);

  function addLog(msg:string) { setLog(prev=>[msg,...prev].slice(0,6)); }

  function startFloor(num:number, prev?:Player) {
    const {map:m,mobs:ms,items:it,px,py} = generateFloor(num);
    setFloor(num); setMap(m); setMobs(ms); setItems(it); setPhase('play'); setFightMob(null);
    const np = prev ? {...prev,x:px,y:py} : INIT_P(px,py);
    setPlayer(np);
    addLog(`⬇️ Этаж ${num}!`);
  }

  useEffect(() => { startFloor(1); }, []); // eslint-disable-line

  useEffect(() => {
    if (canvasRef.current && map.length) render(canvasRef.current, map, mobs, items, player);
  }, [map, mobs, items, player]);

  function move(dx:number, dy:number) {
    if (phase!=='play') return;
    const nx=player.x+dx, ny=player.y+dy;
    if (nx<0||nx>=MW||ny<0||ny>=MH) return;
    if (map[ny]?.[nx]===WALL) return;

    // Bump-attack mob
    const mob = mobs.find(m=>m.x===nx&&m.y===ny);
    if (mob) {
      const crit = Math.random()<.15;
      const dmg  = Math.max(1, player.atk-mob.def+rng(4)+(crit?player.atk>>1:0));
      const newEHp = mob.hp-dmg;
      const msgs: string[] = [`⚔️ ${dmg}${crit?' 💥КРИТ':''} → ${mob.name}`];

      if (newEHp<=0) {
        msgs.push(`💀 ${mob.name} повержен! +${mob.xp}XP +${mob.gold}💰`);
        const remaining = mobs.filter(m=>m.id!==mob.id);
        setMobs(remaining);
        setFightMob(null);
        let np = {...player, xp:player.xp+mob.xp, gold:player.gold+mob.gold};
        while (np.xp>=np.xpNext) {
          np={...np,level:np.level+1,xp:np.xp-np.xpNext,xpNext:Math.round(np.xpNext*1.5),maxHp:np.maxHp+12,hp:Math.min(np.hp+20,np.maxHp+12),atk:np.atk+2,def:np.def+1};
          msgs.push(`🌟 Уровень ${np.level}!`);
        }
        setPlayer(np);
        setLog(prev=>[...[...msgs].reverse(),...prev].slice(0,6));
        if (remaining.length===0 && floor>=3) setTimeout(()=>setPhase('win'),300);
      } else {
        const updated = {...mob,hp:newEHp};
        setMobs(prev=>prev.map(m=>m.id===mob.id?updated:m));
        setFightMob(updated);
        const eDmg = Math.max(1, mob.atk-player.def+rng(4));
        msgs.push(`💢 ${mob.name}: −${eDmg} HP`);
        const newHp = player.hp-eDmg;
        setPlayer(prev=>({...prev,hp:Math.max(0,newHp)}));
        setLog(prev=>[...[...msgs].reverse(),...prev].slice(0,6));
        if (newHp<=0) setTimeout(()=>setPhase('dead'),150);
      }
      return;
    }

    // Pick up item
    const idx = items.findIndex(i=>i.x===nx&&i.y===ny);
    if (idx!==-1) {
      const it=items[idx];
      setItems(prev=>prev.filter((_,i)=>i!==idx));
      if (it.kind==='potion') { setPlayer(prev=>({...prev,potions:prev.potions+1})); addLog('🧪 Нашёл зелье!'); }
      else { setPlayer(prev=>({...prev,gold:prev.gold+it.value})); addLog(`💰 Сундук: +${it.value} золота!`); }
    }

    // Stairs
    if (map[ny][nx]===STAIRS) {
      if (floor<3) { addLog(`⬇️ Спуск на этаж ${floor+1}...`); setTimeout(()=>startFloor(floor+1,{...player,x:nx,y:ny}),80); return; }
      else { addLog('🏆 Выход! Победа!'); setTimeout(()=>setPhase('win'),200); return; }
    }

    setPlayer(prev=>({...prev,x:nx,y:ny}));
    setFightMob(null);
  }

  function drinkPotion() {
    if (player.potions<=0) { addLog('Нет зелий!'); return; }
    setPlayer(prev=>({...prev,potions:prev.potions-1,hp:Math.min(prev.hp+30,prev.maxHp)}));
    addLog('🧪 +30 HP');
  }

  // Secret: skip the current floor (or instantly win on the last one)
  function skipFloor() {
    if (phase!=='play') return;
    if (floor<3) { addLog('✨ Тайный проход! Этаж пропущен.'); startFloor(floor+1, player); }
    else { addLog('✨ Тайный выход! Победа!'); setPhase('win'); }
  }

  // Secret cheat: type "skip" anywhere to skip the floor (works regardless of focus)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return;
      const buf = (comboRef.current + e.key.toLowerCase()).slice(-4);
      comboRef.current = buf;
      if (buf === 'skip') { comboRef.current = ''; skipFloor(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // no deps: re-bind each render so skipFloor sees current floor/phase/player

  // Refocus canvas so WASD always works
  useEffect(()=>{ canvasRef.current?.focus(); }, [floor, phase]);

  function handleKey(e: React.KeyboardEvent) {
    const DIRS: Record<string,[number,number]> = {
      w:[0,-1], s:[0,1], a:[-1,0], d:[1,0],
      ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
    };
    const dir = DIRS[e.key];
    if (dir) { e.preventDefault(); move(dir[0], dir[1]); }
    if (e.key===' ') { e.preventDefault(); drinkPotion(); }
  }

  function refocus() { canvasRef.current?.focus(); }

  function restart() { startFloor(1); setLog(['🗡️ Новое приключение!']); }

  const hpPct = Math.round(player.hp/player.maxHp*100);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>

      {/* Stats */}
      <div className="card" style={{padding:'12px 16px',fontFamily:'monospace'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
          <b style={{fontSize:14}}>⚔️ {userEmail.split('@')[0]} · Ур.{player.level}</b>
          <span style={{fontSize:13,color:'var(--soft)'}}>
            🏚️{floor}/3 · 💰{player.gold} · 🧪{player.potions}
          </span>
        </div>
        <div style={{fontSize:11,color:'var(--soft)',marginBottom:2}}>❤️ {player.hp}/{player.maxHp}</div>
        <Bar val={player.hp} max={player.maxHp} col={hpPct>50?C.hpG:hpPct>25?C.hpY:C.hpR}/>
        <div style={{fontSize:11,color:'var(--soft)',marginTop:5,marginBottom:2}}>✨ XP {player.xp}/{player.xpNext}</div>
        <Bar val={player.xp} max={player.xpNext} col="#5c6bc0"/>
        <div style={{display:'flex',gap:16,marginTop:6,fontSize:12,color:'var(--soft)'}}>
          <span>⚔️ {player.atk}</span><span>🛡️ {player.def}</span>
          <span style={{marginLeft:'auto',fontSize:11}}>WASD · Space=зелье</span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{position:'relative',lineHeight:0}}>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          onKeyDown={handleKey}
          width={CW} height={CH}
          style={{
            display:'block', width:CW*SC, maxWidth:'100%',
            imageRendering:'pixelated',
            border:'2px solid #2a2d4e', borderRadius:8,
            outline:'none', cursor:'default',
          }}
        />
        {(phase==='dead'||phase==='win')&&(
          <div style={{
            position:'absolute',inset:0,background:'rgba(0,0,0,.8)',
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            borderRadius:8,gap:8,
          }}>
            <div style={{fontSize:64}}>{phase==='win'?'🏆':'💀'}</div>
            <div style={{color:'#fff',fontWeight:800,fontSize:22}}>{phase==='win'?'Победа!':'Ты погиб'}</div>
            <div style={{color:'#aaa',fontSize:14}}>Этаж {floor} · Ур.{player.level} · 💰{player.gold}</div>
            <button onClick={restart} style={{marginTop:8}}>Играть снова</button>
          </div>
        )}
      </div>

      {/* Fight mob card */}
      {fightMob&&(
        <div className="card" style={{padding:'12px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <b>{fightMob.name}</b>
            <span style={{fontSize:13,color:'var(--soft)'}}>❤️ {fightMob.hp}/{fightMob.maxHp}</span>
          </div>
          <Bar val={fightMob.hp} max={fightMob.maxHp} col={C.hpR}/>
          <div style={{display:'flex',gap:8,marginTop:10}}>
            <button style={{flex:2}} onClick={()=>{
              const cur=mobs.find(m=>m.id===fightMob.id);
              if(cur) move(cur.x-player.x, cur.y-player.y);
              refocus();
            }}>⚔️ Атаковать</button>
            <button style={{flex:1}} onClick={()=>{drinkPotion();refocus();}} disabled={player.potions<=0}>
              🧪 {player.potions}
            </button>
          </div>
        </div>
      )}

      {/* D-pad (WASD) */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,48px)',gap:4,justifyContent:'center'}}>
        <div/><Btn label="W" onClick={()=>{move(0,-1);refocus();}}/><div/>
        <Btn label="A" onClick={()=>{move(-1,0);refocus();}}/>
        <Btn label="🧪" onClick={()=>{drinkPotion();refocus();}}/>
        <Btn label="D" onClick={()=>{move(1,0);refocus();}}/>
        <div/><Btn label="S" onClick={()=>{move(0,1);refocus();}}/><div/>
      </div>

      {/* Log */}
      <div className="card" style={{padding:'10px 14px',fontFamily:'monospace'}}>
        {log.map((line,i)=>(
          <div key={i} style={{fontSize:13,lineHeight:1.6,color:i===0?'var(--ink)':'var(--soft)'}}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
