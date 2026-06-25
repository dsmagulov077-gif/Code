import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { sfx } from '../lib/sfx';
import { PortalCutscene } from './PortalCutscene';
import { EscapeCutscene } from './EscapeCutscene';

/* ══════════ SETTINGS ══════════ */
const VW = 800, VH = 450, WW = 11700;
// boss arena floor span — used for layout, spawn, sealing, and the boss containment clamp
const ARENA_X0 = 8420, ARENA_X1 = 11000;
const ARENA_FLOOR_Y = 395;   // top of the arena floor — the only surface the boss stands on
const GRAV = 1480, PSPD = 245, JV = -610, DJV = -530;
const DSPD = 530, DDUR = 0.14, ADUR = 0.17, ACOOL = 0.34, INV = 0.85;
const CRIT_MULT = 1.8;   // aimed up/down slashes (W/↑ or S/↓) strike as critical hits
// dodge roll — a free evasive move (key Q / F) with generous i-frames, separate from the dash
const DODGE_DUR = 0.30, DODGE_SPD = 360, DODGE_IFRAME = 0.42;
const REGEN = 1.4;   // free passive HP regen per second (when not being hit)
const SHIELD_CD = 3; // seconds the shield must recharge after it blocks a hit
const SPIKE_TOP = 426;   // y of the spike tips at the bottom of every pit — touch = death
const POGO_VY = 400;     // upward bounce when a down-slash connects with the spikes (Hollow-Knight pogo)
// boss special attacks
// longer wind-up + thinner, shorter beam → much easier to step out of the way
const LASER_CHG = 1.35, LASER_FIRE = 0.5, LASER_LEN = 950, LASER_HW = 9;
// arm-grab: wind-up telegraph → snap the claw out → if it catches, reel + crush + hurl the player
const REACH_TEL = 0.32;                          // wind-up: claw rears back, charges, aim guide
const BOSS_DEATH_DUR = 3.0;                       // length of the defeat sequence before the portal opens
const REACH_EXT = 0.15, REACH_HOLD = 0.26, REACH_RET = 0.30, REACH_LEN = 180;
const GRAB_REEL = 0.42, GRAB_CRUSH = 0.34;       // reel the caught player in, hold & crush, then throw
const GRAB_CRUSH_DMG = 12, GRAB_THROW_DMG = 26;
// arm-reach extension (0→1→0) as a function of the extend-phase timer
function reachAmt(st:number){
  if(st<REACH_EXT) return st/REACH_EXT;
  if(st<REACH_EXT+REACH_HOLD) return 1;
  return Math.max(0, 1-(st-REACH_EXT-REACH_HOLD)/REACH_RET);
}
const extendLen = (ext:number) => REACH_LEN*reachAmt(ext);
// caught: the claw reels from arm's length back to the boss's fist (smoothstep), then holds for the crush
function grabLen(stT:number){
  const r=Math.max(0,Math.min(1,stT/GRAB_REEL)), e=r*r*(3-2*r);
  return REACH_LEN - (REACH_LEN-50)*e;   // hold just off the chest so the clenched claw stays visible
}
const rf = (a: number, b: number) => a + Math.random() * (b - a);
const rn = (n: number) => Math.floor(Math.random() * n);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ══════════ PALETTE ══════════ */
const C = {
  sky0:'#03030b', sky1:'#07071a', sky2:'#0c0c24',
  cfar:'#0a0a1c', cmid:'#0f0f28',
  stone:'#1c1c36', stoneL:'#28285a', stoneSh:'#0e0e22',
  plr:'#5aa9ff', plrD:'#2f6fe0', eye:'#eaf4ff',
  cloak:'#3a5cff', sword:'#cfe2ff', swordGl:'#8fb4ff',
  plrGl:'#66ccff',
  ecr:'#220e22', efl:'#0a1e1e', ejp:'#181830',
  egl:'#ff2233', bss:'#300606', bssD:'#180303',
  bssGl:'#ff1100', bssEye:'#ff3300', bssCore:'#ff6600',
  prj:'#ff8800', prjG:'#ffcc44',
  soul:'#33aaff', soulG:'#77ccff',
  shield:'#66ccff', shieldE:'#2266aa',
  spike:'#3a4252', spikeL:'#6a7488', spikeT:'#aab4c6',
  hpG:'#1faa3f', hpY:'#aaaa11', hpR:'#bb1111', hpBg:'#07071e',
  chkOff:'#151580', chkOn:'#3366ff',
  part0:'#6688ff', part1:'#ff4444', part2:'#ffaa00',
  // warm lantern-lit cave: amber light + lush plants
  lantern:'#ffaa44', lanternG:'#ffcc66', ember:'#ff6633', glowWarm:'#ff8822',
  moss:'#2b4a2a', mossL:'#3f6b3a', vine:'#24412a', frond:'#1a3320',
  shroomCap:'#ff9944', shroomGlow:'#ffbe6a', shroomStem:'#d8c8b0',
  rockWarm:'#241a16',
  // ── ancient temple (level 2): sun-baked sandstone, gold inlay, deep ochre ──
  tSky0:'#1a1207', tSky1:'#2a1d0c', tSky2:'#3a2912',
  tStone:'#9c7a45', tStoneL:'#c7a368', tStoneSh:'#5e451f',
  tGold:'#d8b66a', tGoldD:'#a8842f', tGlyph:'#7a5e2c',
  tColFar:'#241a0e', tColMid:'#33260f', tRoof:'#5a431f', tRoofSh:'#2e2110',
  tDust:'#e8c878',
};

/* ══════════ TYPES ══════════ */
interface Plat { x:number; y:number; w:number; h:number; gate?:boolean }
interface CP    { x:number; y:number; on:boolean }

/* puzzle entities (level 2) */
interface Lever   { x:number; y:number; flag:string; on:boolean; cd:number }
interface Gate    { plat:Plat; baseY:number; flag:string; open:number; opened:boolean }   // open 0..1 — slides up out of the way
interface Mover   { plat:Plat; x0:number; y0:number; x1:number; y1:number; period:number; phase:number; dx:number; dy:number }
interface Crystal { x:number; y:number; baseY:number; group:string; lit:boolean }   // baseY = surface the pedestal stands on
interface Chest   { x:number; y:number; flag:string; opened:boolean; heal:number }
interface Portal  { x:number; y:number; kind:'next'|'escape'|'win'; t:number }
type PS = 'idle'|'run'|'jump'|'fall'|'atk'|'dash'|'dodge'|'wall'|'hurt'|'block'|'dead';
type EK = 'crawler'|'flyer'|'jumper'|'sentinel'|'charger'|'warden'|'boss';

interface Plr {
  x:number; y:number; vx:number; vy:number; w:number; h:number;
  hp:number; mhp:number; souls:number; potions:number[]; st:PS; f:1|-1;
  og:boolean; ow:0|1|-1; jl:number; mj:number;
  da:boolean; dt:number; dd:1|-1; cd:boolean;
  dod:boolean; dodt:number; dodd:1|-1; dodk:boolean;   // dodge roll: active? timer, direction, key-edge
  at:number; ac:number; it:number; rg:number;
  hDash:boolean; hWJ:boolean; hShield:boolean; dmg:number;
  jh:boolean; dh:boolean; af:number; aT:number;
  ahit:number[];
  blk:boolean; sh:number;   // shield raised? + shield energy 0..1
  aup:boolean;              // current swing is an up-slash
  adn:boolean;              // current swing is a down-slash (holding S / ↓)
  grb:boolean;              // held in the boss's grab — controls locked, body driven by the claw
}

interface Ene {
  id:number; k:EK; x:number; y:number; vx:number; vy:number;
  w:number; h:number; hp:number; mhp:number; f:1|-1;
  st:string; stT:number; aT:number; af:number; og:boolean; ph:number;
  aim:number;   // boss: locked aim angle for laser / arm-reach
  dyT?:number;  // boss: death-animation clock (seconds since defeat)
}

interface Proj { x:number; y:number; vx:number; vy:number; r:number; life:number; foe:boolean }
interface Part { x:number; y:number; vx:number; vy:number; life:number; ml:number; col:string; sz:number }
interface FloatTxt { x:number; y:number; vy:number; life:number; ml:number; txt:string; col:string }   // rising hit-marker text

interface Light  { x:number; y:number }
interface Shaft  { x:number; w:number }

interface GS {
  plr:Plr; ens:Ene[]; prjs:Proj[]; pts:Part[]; floats:FloatTxt[];
  plats:Plat[]; cps:CP[];
  cx:number; cy:number; t:number; bbar:boolean;
  shake:number; cpIdx:number;
  // level system
  level:number; ww:number;
  lanterns:Light[]; embernooks:Light[]; shafts:Shaft[];
  // puzzles (level 2)
  levers:Lever[]; gates:Gate[]; movers:Mover[]; crystals:Crystal[]; chests:Chest[];
  czones:{flag:string;x0:number;x1:number}[];
  flags:Record<string,boolean>;
  portal:Portal|null; enterPortal:Portal|null;
}

/* ══════════ LEVEL DATA ══════════ */
const PLATS: Plat[] = [
  // ── GROUND (varied heights: rolling hills, climbs, pits — not a flat line) ──
  {x:0,    y:395, w:720,  h:130},   // G1  start
  {x:820,  y:360, w:300,  h:160},   // G2  small rise
  {x:1240, y:310, w:360,  h:200},   // G3
  {x:1720, y:310, w:240,  h:200},   // G4  (then PIT 1)
  {x:2360, y:395, w:420,  h:130},   // G5  landing — CHECKPOINT 1
  {x:2880, y:350, w:260,  h:150},   // G6  (then staircase up)
  {x:3760, y:200, w:420,  h:280},   // G7  high plateau
  {x:4250, y:300, w:330,  h:200},   // G8  drop (widened for soft landing)
  {x:4640, y:360, w:360,  h:170},   // G9  (then PIT 2)
  {x:5440, y:395, w:480,  h:130},   // G10 landing — CHECKPOINT 2
  {x:6020, y:345, w:300,  h:150},   // G11
  {x:6420, y:300, w:360,  h:200},   // G12
  {x:6850, y:380, w:370,  h:130},   // G13 valley (widened for soft landing)
  {x:7320, y:330, w:320,  h:160},   // G14 (then climb)
  {x:8060, y:250, w:300,  h:230},   // G15 ledge before arena
  {x:8420, y:395, w:2580, h:130},   // BOSS ARENA floor (8420–11000)
  {x:11100,y:395, w:500,  h:130},   // tail ground

  // ── stepping stones over PIT 1 (1960 → 2360) ──
  {x:2020, y:330, w:90, h:14}, {x:2160, y:360, w:90, h:14}, {x:2280, y:320, w:90, h:14},
  // ── staircase up to plateau G7 (3140 → 3760) ──
  {x:3220, y:300, w:120, h:14}, {x:3400, y:250, w:120, h:14}, {x:3580, y:205, w:120, h:14},
  // ── stepping stones over PIT 2 (5000 → 5440) ──
  {x:5060, y:340, w:100, h:14}, {x:5200, y:370, w:100, h:14}, {x:5340, y:330, w:100, h:14},
  // ── climb to arena entrance (7640 → 8060) ──
  {x:7720, y:290, w:130, h:14}, {x:7900, y:250, w:130, h:14},

  // ── aerial platforms for optional high routes / combat ──
  {x:380,  y:300, w:120, h:14}, {x:1000, y:250, w:120, h:14},
  {x:1450, y:220, w:120, h:14}, {x:2150, y:250, w:110, h:14},
  {x:3000, y:250, w:110, h:14}, {x:4380, y:210, w:120, h:14},
  {x:4780, y:260, w:110, h:14}, {x:6120, y:255, w:120, h:14},
  {x:6560, y:205, w:120, h:14}, {x:7050, y:285, w:120, h:14},

  // ── BOSS ARENA structure (floor 8420–11000, tall chamber: roof underside y=40) ──
  {x:8406, y:-60, w:2590,h:100},  // ARENA ROOF — seals the chamber (underside y=40, meets the walls/pillars)
  {x:10964,y:40,  w:32,  h:355},  // right containment wall — FULL height (ceiling→floor)
  {x:8440, y:40,  w:34,  h:185},  // left framing pillar  (decor, hangs from ceiling)
  {x:10930,y:40,  w:34,  h:185},  // right framing pillar (decor)
  {x:8900, y:300, w:160, h:14},   // combat ledge (left)
  {x:9630, y:232, w:160, h:14},   // high perch (dodge the slam, arena centre)
  {x:10360,y:300, w:160, h:14},   // combat ledge (right)
];

// ── CAVE ROOF ─────────────────────────────────────────────────────────────
// A solid, collidable ceiling spanning the whole map. Slabs sit far above the
// camera (y = CEIL_TOP) and reach down to an undulating rock surface, so the
// world is fully enclosed — you bonk your head jumping into the roof. Tagged by
// the deep-negative y so drawPlats can skip them (drawCeiling renders the rock).
const CEIL_TOP = -240;
function buildCeiling(ww:number, gaps:[number,number][]=[]): Plat[] {
  const segs: Plat[] = [];
  const segW = 200, n = Math.ceil(ww/segW);
  for(let i=0;i<n;i++){
    const x=i*segW;
    // skip natural roof where a chamber has its own sealed brick roof (e.g. the boss arena)
    if(gaps.some(([g0,g1])=>x+segW>g0 && x<g1)) continue;
    // undulating cave roof, deterministic so it never flickers between frames
    const surf = Math.round(58 + Math.sin(i*0.6)*20 + Math.sin(i*1.7+2)*12 + (i*37%9));
    segs.push({ x, y:CEIL_TOP, w:segW+2, h:surf-CEIL_TOP });
  }
  return segs;
}
const CEIL = buildCeiling(WW, [[8400,10996]]);
const isCeil = (pl:Plat) => pl.y <= CEIL_TOP/2;   // ceiling slabs live far above 0

type ES = { k:EK; x:number; y:number };
const ESPAWNS: ES[] = [
  {k:'crawler',x:500, y:395},   // G1
  {k:'flyer',  x:1050,y:240},   // over G2/G3
  {k:'jumper', x:1400,y:310},   // G3
  {k:'crawler',x:2600,y:395},   // G5
  {k:'flyer',  x:3050,y:260},   // staircase
  {k:'jumper', x:3950,y:200},   // G7 plateau
  {k:'crawler',x:4820,y:360},   // G9
  {k:'flyer',  x:5650,y:300},   // over G10
  {k:'crawler',x:6500,y:300},   // G12
  {k:'jumper', x:7450,y:330},   // G14
  {k:'flyer',  x:8200,y:250},   // arena approach
  {k:'boss',   x:9710,y:395},   // THE VOID SOVEREIGN — arena boss (center of arena, y = ground)
];
const INIT_CPS: CP[] = [{x:2560,y:375,on:false},{x:5680,y:375,on:false}];

/* ══════════ INIT ══════════ */
function mkPlr(x:number,y:number): Plr {
  return {
    x,y,vx:0,vy:0,w:26,h:38,
    hp:100,mhp:100,souls:0,potions:[],st:'idle',f:1,
    og:false,ow:0,jl:2,mj:2,
    da:false,dt:0,dd:1,cd:false,
    dod:false,dodt:0,dodd:1,dodk:false,
    at:0,ac:0,it:0,rg:0,
    hDash:true,hWJ:true,hShield:false,dmg:28,   // dash + wall-jump unlocked from the start
    jh:false,dh:false,af:0,aT:0,
    ahit:[],
    blk:false,sh:1,
    aup:false,
    adn:false,
    grb:false,
  };
}

function mkEne(id:number,k:EK,x:number,y:number): Ene {
  const sz:Record<EK,{w:number;h:number;hp:number}> = {
    crawler:{w:42,h:26,hp:45}, flyer:{w:30,h:24,hp:28},
    jumper:{w:24,h:40,hp:58},
    sentinel:{w:30,h:48,hp:52},   // temple turret — stationary ranged guardian
    charger:{w:56,h:34,hp:82},    // armored brute — winds up then rushes
    warden:{w:72,h:78,hp:360},
    boss:{w:92,h:112,hp:600},
  };
  const s=sz[k];
  return {id,k,x,y:y-s.h,vx:0,vy:0,w:s.w,h:s.h,hp:s.hp,mhp:s.hp,
    f:-1,st:'patrol',stT:0,aT:0,af:0,og:false,ph:0,aim:0};
}

/* ── LEVEL 1 (the original descent + boss) ── */
function buildLevel1(): GS {
  return {
    plr: mkPlr(80,350),
    ens: ESPAWNS.map((s,i)=>mkEne(i,s.k,s.x,s.y)),
    prjs:[], pts:[], floats:[],
    plats:[...PLATS, ...CEIL],   // fresh copy — the boss gate is pushed in at runtime
    cps: INIT_CPS.map(c=>({...c})),
    cx:0,cy:0,t:0,bbar:false,shake:0,cpIdx:-1,
    level:1, ww:WW,
    lanterns:LANTERNS, embernooks:EMBERNOOKS, shafts:SHAFTS,
    levers:[],gates:[],movers:[],crystals:[],chests:[],czones:[],flags:{},
    portal:null, enterPortal:null,
  };
}

/* ── LEVEL 2 (the deeper cave beyond the portal — long, puzzle-laden) ── */
const L2_WW = 26100;
const GR_Y = 395, GR_H = 130;   // ground top + thickness (matches level 1)
const WARDEN_ARENA_X0 = 24440;
const WARDEN_ARENA_X1 = 26020;
const WARDEN_SPAWN_X = 25120;

// a portcullis gate: a tall pillar that slides up out of the corridor when its flag is set
function addGate(plats:Plat[], gates:Gate[], x:number, flag:string){
  const plat:Plat = {x, y:70, w:26, h:325, gate:true};
  plats.push(plat);
  gates.push({plat, baseY:70, flag, open:0, opened:false});
}
// a moving platform oscillating between two points (sine); pushed into plats for collision
function addMover(plats:Plat[], movers:Mover[], x0:number,y0:number,x1:number,y1:number,period:number,phase:number){
  const s0=(Math.sin(phase*Math.PI*2)+1)/2;   // start at the sine position so it doesn't jump on frame 1
  const plat:Plat = {x:x0+(x1-x0)*s0, y:y0+(y1-y0)*s0, w:112, h:16};
  plats.push(plat);
  movers.push({plat, x0,y0,x1,y1, period, phase, dx:0, dy:0});
}

function buildLevel2(): GS {
  const plats:Plat[]=[], gates:Gate[]=[], movers:Mover[]=[], levers:Lever[]=[], crystals:Crystal[]=[], chests:Chest[]=[];
  const czones:{flag:string;x0:number;x1:number}[]=[];
  const G=(x0:number,x1:number)=>plats.push({x:x0,y:GR_Y,w:x1-x0,h:GR_H});

  // ── solid ground, broken by three spike pits (rooms lengthened; pits keep their tuned width) ──
  G(0,4000);  G(5000,10400);  G(11800,14200);  G(15200,20000);  G(21000,23920);  G(WARDEN_ARENA_X0,L2_WW);
  plats.push({x:-26,y:40,w:26,h:355});           // left wall (you arrive here)
  plats.push({x:L2_WW-14,y:40,w:26,h:355});       // right wall (caps the level)

  // ── ROOM 1 — reach the lever to raise the first gate (long approach corridor) ──
  plats.push({x:480,y:310,w:120,h:14});
  plats.push({x:760,y:250,w:170,h:14});
  levers.push({x:845,y:250,flag:'l1',on:false,cd:0});
  plats.push({x:1300,y:300,w:150,h:14});
  plats.push({x:1750,y:250,w:150,h:14});
  plats.push({x:2250,y:300,w:160,h:14});
  plats.push({x:2750,y:250,w:150,h:14});
  plats.push({x:3250,y:300,w:160,h:14});
  addGate(plats,gates,3950,'l1');

  // ── ROOM 2 — spike pit (4000–5000): ride the elevators, mind their timing ──
  addMover(plats,movers, 4110,360, 4110,200, 3.4, 0);
  plats.push({x:4360,y:282,w:120,h:16});
  addMover(plats,movers, 4620,360, 4620,200, 3.4, 1.7);
  plats.push({x:4870,y:282,w:120,h:16});

  // ── ROOM 3 — combat: clear the room to open the gate ──
  czones.push({flag:'g2',x0:5000,x1:7600});
  addGate(plats,gates,7600,'g2');

  // ── ROOM 4 — light all three crystals to open the gate ──
  plats.push({x:8160,y:250,w:160,h:14});
  crystals.push({x:7860,y:350,baseY:GR_Y,group:'cz',lit:false});
  crystals.push({x:8230,y:226,baseY:250,group:'cz',lit:false});   // stands on the y=250 ledge
  crystals.push({x:9600,y:350,baseY:GR_Y,group:'cz',lit:false});
  addGate(plats,gates,10400,'cz');

  // ── ROOM 5 — spike pit (10400–11800): ride the long platform across ──
  addMover(plats,movers, 10520,330, 11580,330, 11.0, 0);   // slower so it's rideable over the spikes
  plats.push({x:11080,y:300,w:90,h:16});          // a small island to breathe

  // ── ROOM 6 — lever AND two crystals, both needed for the gate ──
  plats.push({x:12100,y:300,w:120,h:14});
  plats.push({x:12380,y:240,w:170,h:14});
  levers.push({x:12465,y:240,flag:'l2',on:false,cd:0});
  crystals.push({x:12760,y:350,baseY:GR_Y,group:'cz2',lit:false});
  crystals.push({x:13180,y:350,baseY:GR_Y,group:'cz2',lit:false});
  addGate(plats,gates,13750,'g4');                // g4 = l2 && cz2 (combined in updatePuzzles)

  // ── ROOM 7 — spike pit (14200–15200): elevators again ──
  addMover(plats,movers, 14310,360, 14310,210, 3.0, 0);
  plats.push({x:14560,y:282,w:120,h:16});
  addMover(plats,movers, 14810,360, 14810,210, 3.0, 1.5);
  plats.push({x:15060,y:282,w:120,h:16});

  // ── ROOM 8 — final guardians: clear the room ──
  czones.push({flag:'g5',x0:15200,x1:17750});
  addGate(plats,gates,17750,'g5');

  // ROOM 9 - treasure puzzle: light three relic crystals to unlock the potion chest
  plats.push({x:18480,y:300,w:130,h:14});
  plats.push({x:18880,y:238,w:150,h:14});
  plats.push({x:19380,y:300,w:130,h:14});
  crystals.push({x:18545,y:286,baseY:300,group:'ch1',lit:false});
  crystals.push({x:18955,y:214,baseY:238,group:'ch1',lit:false});
  crystals.push({x:19445,y:286,baseY:300,group:'ch1',lit:false});
  chests.push({x:19720,y:GR_Y,flag:'ch1',opened:false,heal:45});

  // ROOM 10 - longer spike pit before the hidden vault
  addMover(plats,movers, 20100,350, 20360,230, 4.2, 0.15);
  plats.push({x:20500,y:282,w:120,h:16});
  addMover(plats,movers, 20800,230, 20800,360, 3.2, 1.1);

  // ROOM 11 - lever chest: hit the high switch, then open the chest below
  plats.push({x:21420,y:300,w:130,h:14});
  plats.push({x:21720,y:236,w:170,h:14});
  levers.push({x:21805,y:236,flag:'l3',on:false,cd:0});
  chests.push({x:22150,y:GR_Y,flag:'l3',opened:false,heal:60});

  // ROOM 12 - guarded chest: defeat the vault keepers for the final potion
  czones.push({flag:'ch2',x0:22400,x1:23500});
  plats.push({x:22680,y:290,w:130,h:14});
  plats.push({x:23120,y:250,w:130,h:14});
  chests.push({x:23560,y:GR_Y,flag:'ch2',opened:false,heal:80});

  // ROOM 13 - separate boss arena: cross the gap, then the warden spawns inside
  addMover(plats,movers, 24040,340, 24320,260, 4.4, 0.45);
  plats.push({x:24200,y:230,w:110,h:16});
  czones.push({flag:'boss2',x0:WARDEN_ARENA_X0,x1:WARDEN_ARENA_X1});
  plats.push({x:24630,y:306,w:170,h:14});
  plats.push({x:25040,y:238,w:170,h:14});
  plats.push({x:25540,y:306,w:170,h:14});
  addGate(plats,gates,25860,'boss2');

  // a few aerial ledges for combat footing
  plats.push({x:5400,y:280,w:130,h:14});
  plats.push({x:6100,y:300,w:120,h:14});
  plats.push({x:6800,y:250,w:130,h:14});
  plats.push({x:15650,y:290,w:130,h:14});
  plats.push({x:16500,y:300,w:120,h:14});

  const ceil = buildCeiling(L2_WW, []);

  const espawns:ES[]=[
    {k:'crawler', x:1800,y:GR_Y},
    {k:'charger', x:2600,y:GR_Y},   // R1 corridor — first taste of the brute
    {k:'jumper',  x:5400,y:GR_Y},   // R3 combat zone
    {k:'sentinel',x:5800,y:GR_Y},   //   turret pins you from range
    {k:'crawler', x:6100,y:GR_Y},
    {k:'charger', x:6700,y:GR_Y},   //   brute rushes while you dodge bolts
    {k:'sentinel',x:8900,y:GR_Y},   // R4 crystal room guardian (ambience)
    {k:'flyer',   x:8800,y:250},    // R4 ambience (outside any zone)
    {k:'charger', x:13400,y:GR_Y},  // R6 lever room — roaming brute
    {k:'flyer',   x:12800,y:240},   // R6 ambience
    {k:'sentinel',x:15600,y:GR_Y},  // R8 combat zone
    {k:'crawler', x:16000,y:GR_Y},
    {k:'jumper',  x:16300,y:GR_Y},
    {k:'charger', x:16800,y:GR_Y},
    {k:'crawler', x:17200,y:GR_Y},
    {k:'flyer',   x:19000,y:240},
    {k:'sentinel',x:19550,y:GR_Y},
    {k:'jumper',  x:22550,y:GR_Y},
    {k:'charger', x:22900,y:GR_Y},
    {k:'sentinel',x:23280,y:GR_Y},
  ];

  const lanterns:Light[]=[
    {x:360,y:280},{x:1800,y:240},{x:3900,y:160},{x:5400,y:250},{x:6800,y:200},
    {x:8160,y:200},{x:9400,y:250},{x:11000,y:240},{x:12380,y:185},{x:13180,y:250},
    {x:14800,y:240},{x:15600,y:250},{x:17000,y:230},{x:18600,y:240},
    {x:19800,y:250},{x:20600,y:230},{x:21800,y:185},{x:23000,y:230},{x:23800,y:240},{x:24780,y:210},{x:25100,y:230},{x:25640,y:220},
  ];
  const embernooks:Light[]=[ {x:1800,y:372},{x:5800,y:372},{x:8800,y:378},{x:12500,y:372},{x:16500,y:378},{x:19720,y:372},{x:22150,y:372},{x:23560,y:372},{x:24800,y:372},{x:25580,y:372} ];
  const shafts:Shaft[]=[ {x:1500,w:120},{x:6200,w:140},{x:10800,w:130},{x:13500,w:140},{x:16800,w:150},{x:18800,w:140},{x:21800,w:130},{x:23400,w:150},{x:24800,w:170},{x:25620,w:150} ];

  return {
    plr: mkPlr(80,350),
    ens: espawns.map((s,i)=>mkEne(i,s.k,s.x,s.y)),
    prjs:[], pts:[], floats:[],
    plats:[...plats, ...ceil],
    cps: [{x:5400,y:375,on:false},{x:11900,y:375,on:false},{x:15300,y:375,on:false},{x:21180,y:375,on:false}],
    cx:0,cy:0,t:0,bbar:false,shake:0,cpIdx:-1,
    level:2, ww:L2_WW,
    lanterns, embernooks, shafts,
    levers, gates, movers, crystals, chests, czones, flags:{},
    portal:{x:25930,y:300,kind:'escape',t:0}, enterPortal:null,
  };
}

const L3_WW = 7600;

function buildLevel3(): GS {
  const plats:Plat[]=[], gates:Gate[]=[], movers:Mover[]=[], levers:Lever[]=[], crystals:Crystal[]=[], chests:Chest[]=[];
  const czones:{flag:string;x0:number;x1:number}[]=[];
  const G=(x0:number,x1:number,y=GR_Y)=>plats.push({x:x0,y,w:x1-x0,h:GR_H});

  G(0,1100); G(1380,2320,365); G(2700,3650,330); G(4020,5100,365); G(5480,L3_WW);
  plats.push({x:-26,y:40,w:26,h:355});
  plats.push({x:L3_WW-14,y:40,w:26,h:355});

  plats.push({x:700,y:300,w:130,h:14});
  addMover(plats,movers, 1120,350, 1320,260, 5.2, 0.2);
  plats.push({x:1780,y:282,w:130,h:16});
  addMover(plats,movers, 2350,330, 2660,250, 6.0, 1.1);
  plats.push({x:3040,y:250,w:150,h:14});
  plats.push({x:3460,y:210,w:130,h:14});
  addMover(plats,movers, 3720,330, 3970,240, 5.6, 0.65);
  plats.push({x:4560,y:280,w:140,h:14});
  addMover(plats,movers, 5120,340, 5440,260, 5.8, 1.5);
  plats.push({x:6040,y:275,w:150,h:14});
  plats.push({x:6600,y:230,w:150,h:14});

  const espawns:ES[]=[
    {k:'flyer',x:1550,y:245},
    {k:'crawler',x:2920,y:330},
    {k:'charger',x:4300,y:365},
    {k:'flyer',x:5900,y:250},
    {k:'jumper',x:6350,y:GR_Y},
  ];
  const lanterns:Light[]=[
    {x:360,y:260},{x:1400,y:230},{x:3000,y:210},{x:4550,y:220},{x:6100,y:215},{x:7200,y:220},
  ];
  const embernooks:Light[]=[{x:820,y:372},{x:3050,y:310},{x:4620,y:342},{x:6120,y:372}];
  const shafts:Shaft[]=[{x:900,w:150},{x:2600,w:140},{x:4200,w:160},{x:6400,w:160}];

  return {
    plr: mkPlr(80,350),
    ens: espawns.map((s,i)=>mkEne(i,s.k,s.x,s.y)),
    prjs:[], pts:[], floats:[],
    plats:[...plats, ...buildCeiling(L3_WW, [])],
    cps: [{x:2860,y:310,on:false},{x:5540,y:375,on:false}],
    cx:0,cy:0,t:0,bbar:false,shake:0,cpIdx:-1,
    level:3, ww:L3_WW,
    lanterns, embernooks, shafts,
    levers, gates, movers, crystals, chests, czones, flags:{},
    portal:{x:7250,y:300,kind:'win',t:0}, enterPortal:null,
  };
}

function initLevel(n:number): GS { return n===3 ? buildLevel3() : n===2 ? buildLevel2() : buildLevel1(); }
function initGS(): GS { return initLevel(1); }

/* ══════════ HELPERS ══════════ */
function overlap(ax:number,ay:number,aw:number,ah:number,
                 bx:number,by:number,bw:number,bh:number): boolean {
  return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by;
}

function spawnPts(gs:GS,x:number,y:number,n:number,col:string,spd:number=3,sz:number=2.5) {
  for(let i=0;i<n;i++)
    gs.pts.push({x,y,vx:rf(-spd,spd),vy:rf(-spd-1,1),life:.7,ml:.7,col,sz:rf(sz*.6,sz*1.4)});
}

// a rising, fading hit-marker (e.g. "CRIT!") that pops above the struck target
function spawnFloat(gs:GS,x:number,y:number,txt:string,col:string) {
  gs.floats.push({x,y,vy:-46,life:.85,ml:.85,txt,col});
}

// plant the player firmly on the nearest ground below their feet — no falling
function settleOnGround(gs:GS) {
  const p=gs.plr;
  let best=Infinity;
  for(const pl of gs.plats){
    const horiz = p.x+p.w>pl.x+2 && p.x<pl.x+pl.w-2;
    const below = pl.y>=p.y+p.h-6;
    if(horiz && below && pl.y<best) best=pl.y;
  }
  if(best<Infinity) p.y=best-p.h;
  p.vx=0; p.vy=0; p.da=false; p.dt=0; p.cd=false; p.og=true; p.st='idle';
}

function applyDmgToPlr(gs:GS,dmg:number,_srcX?:number) {
  const p=gs.plr;
  if(p.it>0||p.da||p.grb) return;   // while grabbed, only the grab itself deals damage

  // shield: a raised, charged shield fully negates ANY attack (any direction), then goes on cooldown
  if(p.blk && p.sh>=1){
    const cx=p.x+p.w/2;
    p.sh=0;                                // spent — recharges over SHIELD_CD seconds
    p.it=0.3;                              // brief recovery so multi-hit attacks can't instantly re-hit
    gs.shake=Math.max(gs.shake,.12);
    spawnPts(gs,cx,p.y+p.h*.45,12,C.shield,3.5);
    sfx.play('block');
    return;                               // zero damage taken
  }

  p.hp=Math.max(0,p.hp-dmg);
  p.it=INV; p.st='hurt';
  gs.shake=.18;
  spawnPts(gs,p.x+p.w/2,p.y+p.h/2,10,C.part1,4);
  if(p.hp<=0){ p.st='dead'; sfx.play('death'); }
  else sfx.play('hurt');
}

function usePotion(gs:GS) {
  const p=gs.plr;
  if(p.st==='dead' || p.potions.length===0) return;
  if(p.hp>=p.mhp){
    spawnFloat(gs,p.x+p.w/2,p.y-12,'HP FULL',C.tGold);
    sfx.play('block');
    return;
  }
  const heal=p.potions.shift()!;
  const gained=Math.min(heal,p.mhp-p.hp);
  p.hp=Math.min(p.mhp,p.hp+heal);
  p.rg=0;
  spawnPts(gs,p.x+p.w/2,p.y+p.h/2,22,C.soulG,4,3.5);
  spawnFloat(gs,p.x+p.w/2,p.y-14,`HEAL +${gained}`,C.soulG);
  sfx.play('checkpoint');
}

/* ══════════ DRAW — ANCIENT TEMPLE BACKGROUND (level 2) ══════════ */
function drawTempleBG(ctx:CanvasRenderingContext2D,camX:number,t:number) {
  // warm sandstone haze sky
  const g=ctx.createLinearGradient(0,0,0,VH);
  g.addColorStop(0,C.tSky0); g.addColorStop(.55,C.tSky1); g.addColorStop(1,C.tSky2);
  ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH);

  // golden light pooling up from the sanctum floor
  const wg=ctx.createLinearGradient(0,VH,0,VH*0.35);
  wg.addColorStop(0,'rgba(216,182,106,0.18)'); wg.addColorStop(1,'rgba(216,182,106,0)');
  ctx.fillStyle=wg; ctx.fillRect(0,0,VW,VH);

  // shadow pressing from the high ceiling
  const rg=ctx.createLinearGradient(0,0,0,180);
  rg.addColorStop(0,'rgba(0,0,0,0.55)'); rg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=rg; ctx.fillRect(0,0,VW,180);

  // far colonnade (parallax 0.08x) — distant stone columns
  drawTempleColumns(ctx,camX,0.08,7,C.tColFar,150,34);
  // mid colonnade (parallax 0.26x)
  drawTempleColumns(ctx,camX,0.26,5,C.tColMid,210,52);

  // dust motes drifting in the shafts of light
  ctx.save();
  for(let i=0;i<12;i++){
    const cx2=((i*613+Math.floor(camX*.18))%(VW+100))-50;
    const cy2=40+(i*83%140);
    ctx.globalAlpha=0.14+Math.sin(t*1.1+i)*.06;
    ctx.fillStyle=C.tDust;
    ctx.beginPath(); ctx.arc(cx2,cy2,1.5+i%3,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();

  // foreground pillars framing the edges (parallax 0.5x), closest & darkest
  drawTempleColumns(ctx,camX,0.5,4,'#1a1207',300,80);
}

function drawEscapeBG(ctx:CanvasRenderingContext2D,camX:number,t:number) {
  const g=ctx.createLinearGradient(0,0,0,VH);
  g.addColorStop(0,'#090303');
  g.addColorStop(0.42,'#2a0b04');
  g.addColorStop(1,'#120805');
  ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH);

  const blaze=ctx.createRadialGradient(VW*0.72,VH*0.64,8,VW*0.72,VH*0.64,VH*0.9);
  blaze.addColorStop(0,'rgba(255,142,36,0.25)');
  blaze.addColorStop(0.42,'rgba(255,70,18,0.11)');
  blaze.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=blaze; ctx.fillRect(0,0,VW,VH);

  ctx.save();
  ctx.fillStyle='#160905';
  for(let i=0;i<12;i++){
    const sx=((i*170-Math.floor(camX*0.16))%(VW+260))-130;
    const lean=Math.sin(i*1.7)*14;
    ctx.save();
    ctx.translate(sx+lean,40+(i%3)*12);
    ctx.rotate(Math.sin(i)*0.08);
    ctx.fillRect(-22,0,44,VH);
    ctx.fillStyle='rgba(216,182,106,0.12)';
    ctx.fillRect(-18,18,3,VH-80);
    ctx.fillStyle='#160905';
    ctx.restore();
  }
  ctx.restore();

  ctx.fillStyle='#050202';
  ctx.beginPath();
  ctx.moveTo(0,0);
  for(let x=0;x<=VW;x+=40){
    const y=44+Math.sin((x+camX*0.12)*0.027)*18+Math.sin(x*0.09)*8;
    ctx.lineTo(x,y);
  }
  ctx.lineTo(VW,0); ctx.closePath(); ctx.fill();

  ctx.save();
  ctx.strokeStyle='rgba(255,118,34,0.28)';
  ctx.lineWidth=2;
  for(let i=0;i<9;i++){
    const sx=((i*231-Math.floor(camX*0.22))%(VW+120))-60;
    ctx.beginPath();
    ctx.moveTo(sx,44);
    ctx.lineTo(sx+28*Math.sin(t+i),118+i%4*28);
    ctx.lineTo(sx-12,190+i%3*24);
    ctx.stroke();
  }
  ctx.restore();

  for(let i=0;i<3;i++){
    const y=270+i*45+Math.sin(t*1.4+i)*5;
    const haze=ctx.createLinearGradient(0,y-20,0,y+20);
    haze.addColorStop(0,'rgba(255,120,28,0)');
    haze.addColorStop(0.5,'rgba(255,120,28,0.055)');
    haze.addColorStop(1,'rgba(255,120,28,0)');
    ctx.fillStyle=haze; ctx.fillRect(0,y-20,VW,40);
  }
}

// A row of evenly-spaced temple columns with capitals & bases, in world parallax.
function drawTempleColumns(ctx:CanvasRenderingContext2D,camX:number,par:number,n:number,col:string,gap:number,w:number) {
  ctx.fillStyle=col;
  for(let i=0;i<n;i++){
    const bx=((i*gap*1.7+Math.floor(camX*par))%(VW+gap*2))-gap;
    const h=VH-30;
    // shaft
    ctx.fillRect(bx,0,w,h);
    // fluting (vertical grooves) — only on the nearer, wider columns
    if(w>=52){
      ctx.save(); ctx.globalAlpha=0.25; ctx.fillStyle='#000';
      for(let f=8;f<w-6;f+=10) ctx.fillRect(bx+f,0,2,h);
      ctx.restore();
    }
    // capital + base slabs
    ctx.fillRect(bx-6,0,w+12,14);
    ctx.fillRect(bx-6,h-16,w+12,16);
  }
}

/* ══════════ DRAW — BACKGROUND ══════════ */
function drawBG(ctx:CanvasRenderingContext2D,camX:number,t:number,lvl=1) {
  if(lvl===3){ drawEscapeBG(ctx,camX,t); return; }
  if(lvl===2){ drawTempleBG(ctx,camX,t); return; }
  const g=ctx.createLinearGradient(0,0,0,VH);
  g.addColorStop(0,C.sky0); g.addColorStop(1,C.sky2);
  ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH);

  // warm depth-glow rising from the cave floor (the lantern light pooling in the deep)
  const wg=ctx.createLinearGradient(0,VH,0,VH*0.4);
  wg.addColorStop(0,'rgba(150,70,25,0.20)'); wg.addColorStop(1,'rgba(150,70,25,0)');
  ctx.fillStyle=wg; ctx.fillRect(0,0,VW,VH);

  // ever-present rocky gloom pressing down from the cave roof, so it feels enclosed
  // even when the solid ceiling is above the camera during normal ground play
  const rg=ctx.createLinearGradient(0,0,0,170);
  rg.addColorStop(0,'rgba(0,0,0,0.6)'); rg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=rg; ctx.fillRect(0,0,VW,170);

  // far stalactites (parallax 0.08x)
  ctx.fillStyle=C.cfar;
  for(let i=0;i<22;i++){
    const bx=((i*379+Math.floor(camX*.08))%(VW+120))-60;
    const bh=28+(i*53%55);
    ctx.beginPath(); ctx.moveTo(bx-14,0); ctx.lineTo(bx+14,0); ctx.lineTo(bx,bh); ctx.closePath(); ctx.fill();
  }
  // mid stalactites (parallax 0.28x)
  ctx.fillStyle=C.cmid;
  for(let i=0;i<14;i++){
    const bx=((i*511+Math.floor(camX*.28))%(VW+180))-90;
    const bh=46+(i*71%72);
    ctx.beginPath(); ctx.moveTo(bx-20,0); ctx.lineTo(bx+20,0); ctx.lineTo(bx,bh); ctx.closePath(); ctx.fill();
  }
  // background plant silhouettes — vines hanging from the ceiling at mid depth (parallax 0.28x)
  ctx.save(); ctx.globalAlpha=0.5;
  ctx.strokeStyle=C.frond; ctx.lineWidth=2.5; ctx.lineCap='round';
  for(let i=0;i<9;i++){
    const bx=((i*733+Math.floor(camX*.28))%(VW+160))-80;
    const len=46+(i*53%52), sway=Math.sin(t*0.6+i)*4;   // mostly vertical, faint drift
    ctx.beginPath(); ctx.moveTo(bx,0);
    ctx.quadraticCurveTo(bx+sway*0.5, len*0.6, bx+sway, len); ctx.stroke();
    for(let k=1;k<=2;k++){ const ly=len*k/3, lx=bx+sway*k/3;   // small drooping leaflets
      ctx.beginPath(); ctx.moveTo(lx,ly); ctx.quadraticCurveTo(lx-5,ly+1,lx-4,ly+5);
      ctx.moveTo(lx,ly); ctx.quadraticCurveTo(lx+5,ly+1,lx+4,ly+5); ctx.stroke(); }
  }
  ctx.restore();
  // glowing motes in the bg — cool souls with a few warm embers mixed in
  ctx.save();
  for(let i=0;i<10;i++){
    const cx2=((i*613+Math.floor(camX*.18))%(VW+100))-50;
    const cy2=40+(i*83%110);
    const warm=i%3===0;
    ctx.globalAlpha=(warm?0.24:0.16)+Math.sin(t*1.2+i)*.06;
    ctx.fillStyle=warm?C.glowWarm:C.soul;
    ctx.beginPath(); ctx.arc(cx2,cy2,2+i%3,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();

  // foreground cave teeth (parallax 0.45x) — closest, darkest; frame the top & bottom edges
  ctx.fillStyle='#04040d';
  for(let i=0;i<7;i++){
    const bx=((i*887+Math.floor(camX*.45))%(VW+300))-150;
    const bh=42+(i*97%56);
    ctx.beginPath(); ctx.moveTo(bx-30,0); ctx.lineTo(bx+30,0); ctx.lineTo(bx,bh); ctx.closePath(); ctx.fill();
  }
  for(let i=0;i<6;i++){
    const bx=((i*811+Math.floor(camX*.45))%(VW+300))-150;
    const bh=40+(i*89%52);
    ctx.beginPath(); ctx.moveTo(bx-26,VH); ctx.lineTo(bx+26,VH); ctx.lineTo(bx,VH-bh); ctx.closePath(); ctx.fill();
  }

  // drifting fog bands for atmospheric depth (warm-tinted near the floor)
  for(let i=0;i<2;i++){
    const fy=VH*0.5 + i*80 + Math.sin(t*0.3+i)*10;
    ctx.save(); ctx.globalAlpha=0.06;
    const fg=ctx.createLinearGradient(0,fy-32,0,fy+32);
    fg.addColorStop(0,'transparent'); fg.addColorStop(.5,i?'#3a2416':'#161622'); fg.addColorStop(1,'transparent');
    ctx.fillStyle=fg; ctx.fillRect(0,fy-32,VW,64); ctx.restore();
  }
}

/* ══════════ DRAW — BOSS ARENA ATMOSPHERE (level 1) ══════════ */
// A dramatic void-temple backdrop painted only inside the sealed boss chamber
// (interior 8474–10964). Carved pilasters, wall braziers and a pulsing hellgate
// behind the throne set it apart from the open cave the rest of the level uses.
function drawArena(ctx:CanvasRenderingContext2D,camX:number,camY:number,t:number){
  const IN0=8474, IN1=10964;          // interior span between the framing walls
  const TOP=40, FLOOR=395;            // chamber roof underside → floor surface
  const l=IN0-camX, r=IN1-camX, top=TOP-camY, bot=FLOOR-camY;
  if(r<0||l>VW||bot<0||top>VH) return;          // chamber fully off-screen
  const W=r-l, H=bot-top;
  const pulse=0.5+0.5*Math.sin(t*1.6);

  ctx.save();
  ctx.beginPath(); ctx.rect(l,top,W,H); ctx.clip();   // decor never bleeds outside the room

  // 1 — brooding crimson void washing over the plain cave bg
  const bg=ctx.createLinearGradient(0,top,0,bot);
  bg.addColorStop(0,'#0a0206'); bg.addColorStop(.55,'#1a0408'); bg.addColorStop(1,'#050103');
  ctx.fillStyle=bg; ctx.fillRect(l,top,W,H);

  // 2 — pulsing hellgate behind the throne (world centre 9710)
  const gx=9710-camX, gy=250-camY, gR=150+pulse*22;
  const gg=ctx.createRadialGradient(gx,gy,8,gx,gy,gR);
  gg.addColorStop(0,`rgba(255,150,60,${0.30+pulse*0.12})`);
  gg.addColorStop(.4,`rgba(220,40,10,${0.18+pulse*0.08})`);
  gg.addColorStop(1,'rgba(120,0,0,0)');
  ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(gx,gy,gR,0,Math.PI*2); ctx.fill();
  // slowly counter-rotating rune rings around the gate
  ctx.save(); ctx.globalAlpha=0.22+pulse*0.15; ctx.strokeStyle='#ff7a33'; ctx.lineWidth=2;
  for(let i=0;i<3;i++){
    ctx.setLineDash([14,18]); ctx.lineDashOffset=(t*(i%2?-16:16))%32;
    ctx.beginPath(); ctx.arc(gx,gy,70+i*34+pulse*6,0,Math.PI*2); ctx.stroke();
  }
  ctx.setLineDash([]); ctx.restore();

  // 3 — carved pilasters marching along the back wall
  const cols=7, step=(IN1-IN0)/cols;
  for(let i=1;i<cols;i++){
    const px=IN0+step*i-camX, pw=26;
    const pg=ctx.createLinearGradient(px-pw/2,0,px+pw/2,0);
    pg.addColorStop(0,'#14060a'); pg.addColorStop(.5,'#28101a'); pg.addColorStop(1,'#0c0307');
    ctx.fillStyle=pg; ctx.fillRect(px-pw/2,top,pw,H);
    ctx.fillStyle='rgba(255,90,40,0.10)'; ctx.fillRect(px-pw/2,top,2,H);   // faint rim light
    ctx.fillStyle='#1c0a10'; ctx.fillRect(px-pw/2-4,top,pw+8,12);          // capital
    ctx.fillRect(px-pw/2-4,bot-12,pw+8,12);                                // base block
  }

  // 4 — wall braziers (flanking the throne, clear of the combat ledges) with floor glow
  const braz=[8700,10720];
  for(let bi=0;bi<braz.length;bi++){
    const bx=braz[bi]-camX, by=bot-150;
    const flk=0.7+0.3*Math.sin(t*9+bi*2.1)+0.15*Math.sin(t*23+bi);
    const fp=ctx.createRadialGradient(bx,bot,4,bx,bot,90);
    fp.addColorStop(0,`rgba(255,130,40,${0.18*flk})`); fp.addColorStop(1,'rgba(255,80,0,0)');
    ctx.fillStyle=fp; ctx.beginPath(); ctx.ellipse(bx,bot,90,18,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#0a0508'; ctx.fillRect(bx-9,by,18,8); ctx.fillRect(bx-3,by+8,6,18);   // bowl + stem
    const ff=ctx.createRadialGradient(bx,by-8,1,bx,by-8,20*flk);
    ff.addColorStop(0,'rgba(255,235,150,0.95)'); ff.addColorStop(.5,`rgba(255,140,30,${0.8*flk})`); ff.addColorStop(1,'rgba(255,60,0,0)');
    ctx.fillStyle=ff; ctx.beginPath(); ctx.ellipse(bx,by-8,9*flk,16*flk,0,0,Math.PI*2); ctx.fill();
  }

  // 5 — ash embers drifting up the chamber
  ctx.save();
  for(let i=0;i<26;i++){
    const seed=i*149+7;
    const ex=IN0+(seed*53%(IN1-IN0))-camX;
    const prog=((t*16+seed)%140)/140;
    const ey=bot-prog*H*0.9+Math.sin(t*0.8+i)*4;
    ctx.globalAlpha=(1-prog)*0.5;
    ctx.fillStyle=i%4?'#ff7a33':'#ffce6a';
    ctx.fillRect(ex,ey,1+(i%2),1+(i%2));
  }
  ctx.restore();

  // 6 — molten seams glowing in the floor near the throne
  ctx.save(); ctx.globalAlpha=0.3+pulse*0.2;
  ctx.strokeStyle='#ff5a1e'; ctx.lineWidth=2; ctx.lineCap='round';
  for(const [a,b] of [[9500,9650],[9760,9920]] as [number,number][]){
    const x0=a-camX, x1=b-camX;
    ctx.beginPath(); ctx.moveTo(x0,bot); ctx.lineTo((x0+x1)/2+Math.sin(a)*6,bot-10); ctx.lineTo(x1,bot); ctx.stroke();
  }
  ctx.restore();

  ctx.restore();   // un-clip
}

/* ══════════ DRAW — BEDROCK ══════════ */
// Solid deep rock filling the whole bottom of the screen, below the floor surface.
// Drawn before the spikes and platforms (which paint over it), so there is never
// any black void visible beneath the ground or down inside the pits.
function drawWardenArena(ctx:CanvasRenderingContext2D,gs:GS){
  if(gs.level!==2) return;
  const IN0=WARDEN_ARENA_X0, IN1=WARDEN_ARENA_X1, TOP=58, FLOOR=395;
  const l=IN0-gs.cx, r=IN1-gs.cx, top=TOP-gs.cy, bot=FLOOR-gs.cy;
  if(r<0||l>VW||bot<0||top>VH) return;
  const W=r-l, H=bot-top;
  const warden=gs.ens.find(e=>e.k==='warden');
  const active=!!(warden && warden.hp>0);
  const enraged=!!(active && warden && warden.ph>=1);
  const pulse=0.55+Math.sin(gs.t*2.2)*0.45;

  ctx.save();
  ctx.beginPath(); ctx.rect(l,top,W,H); ctx.clip();

  const bg=ctx.createLinearGradient(0,top,0,bot);
  bg.addColorStop(0,enraged?'#230905':'#120b05');
  bg.addColorStop(0.5,enraged?'#5a2109':active?'#3a260c':'#2c210f');
  bg.addColorStop(1,enraged?'#180502':'#100904');
  ctx.fillStyle=bg; ctx.fillRect(l,top,W,H);

  const cx=(IN0+IN1)/2-gs.cx;
  const altarY=250-gs.cy;
  const glow=ctx.createRadialGradient(cx,altarY,8,cx,altarY,active?230:160);
  glow.addColorStop(0,enraged?`rgba(255,92,24,${0.34+pulse*0.18})`:active?`rgba(255,220,120,${0.22+pulse*0.16})`:'rgba(119,204,255,0.16)');
  glow.addColorStop(0.45,enraged?'rgba(255,120,30,0.18)':active?'rgba(216,182,106,0.14)':'rgba(216,182,106,0.08)');
  glow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(cx,altarY,active?230:160,0,Math.PI*2); ctx.fill();

  for(let x=IN0+40;x<IN1-20;x+=92){
    const sx=x-gs.cx;
    const panel=ctx.createLinearGradient(sx,top,sx+50,bot);
    panel.addColorStop(0,C.tStoneSh);
    panel.addColorStop(0.55,C.tStone);
    panel.addColorStop(1,'#3a2912');
    ctx.fillStyle=panel;
    ctx.fillRect(sx,top+18,50,H-18);
    ctx.fillStyle='rgba(216,182,106,0.22)';
    ctx.fillRect(sx+5,top+26,3,H-46);
    ctx.fillStyle='rgba(0,0,0,0.24)';
    ctx.fillRect(sx+41,top+26,5,H-42);
    ctx.fillStyle=C.tGoldD;
    ctx.fillRect(sx-5,top+18,60,6);
    ctx.fillRect(sx-5,bot-18,60,7);
  }

  const doorX=cx-52;
  ctx.fillStyle='#140d08';
  ctx.fillRect(doorX,top+74,104,bot-top-74);
  ctx.strokeStyle=C.tGoldD; ctx.lineWidth=3;
  ctx.strokeRect(doorX+8,top+86,88,bot-top-100);
  ctx.save();
  ctx.globalAlpha=0.28+pulse*0.18;
  ctx.strokeStyle=enraged?C.ember:active?C.tGold:C.soulG;
  ctx.lineWidth=2;
  for(let i=0;i<3;i++){
    ctx.beginPath(); ctx.arc(cx,top+154,26+i*23+pulse*5,0,Math.PI*2); ctx.stroke();
  }
  ctx.restore();

  if(active && warden){
    const wx=warden.x+warden.w/2-gs.cx;
    if(warden.st==='slam'){
      const a=0.22+Math.abs(Math.sin(gs.t*18))*0.28;
      ctx.fillStyle=`rgba(255,120,35,${a})`;
      ctx.fillRect(wx-(enraged?165:92),bot-7,(enraged?330:184),7);
      ctx.strokeStyle='rgba(255,235,150,0.65)';
      ctx.lineWidth=2;
      ctx.beginPath(); ctx.ellipse(wx,bot-8,enraged?166:96,enraged?28:18,0,0,Math.PI*2); ctx.stroke();
    } else if(warden.st==='cast'){
      ctx.save();
      ctx.globalAlpha=0.22+pulse*0.18;
      ctx.strokeStyle=C.soulG; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(wx,warden.y+warden.h*0.35-gs.cy,34+pulse*22,0,Math.PI*2); ctx.stroke();
      ctx.restore();
    }
  }

  for(const x of [IN0+90, IN1-90]){
    const sx=x-gs.cx, bob=Math.sin(gs.t*1.8+x)*3;
    ctx.strokeStyle='rgba(30,18,8,0.85)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(sx,top); ctx.lineTo(sx,top+72+bob); ctx.stroke();
    ctx.save();
    ctx.shadowColor=enraged?C.ember:C.tGold; ctx.shadowBlur=enraged?24:18;
    ctx.fillStyle=enraged?`rgba(255,110,36,${0.68+pulse*0.2})`:`rgba(255,206,106,${0.62+pulse*0.18})`;
    ctx.beginPath();
    ctx.moveTo(sx,top+72+bob); ctx.lineTo(sx+10,top+92+bob); ctx.lineTo(sx,top+112+bob); ctx.lineTo(sx-10,top+92+bob);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  for(let i=0;i<18;i++){
    const x=l+25+((i*71+Math.floor(gs.t*18))%(W-30));
    const y=top+50+(i*37%220);
    ctx.globalAlpha=0.08+0.05*Math.sin(gs.t*2+i);
    ctx.fillStyle=i%3===0?C.tGold:C.tDust;
    ctx.fillRect(x,y,2,2+i%3);
  }
  ctx.globalAlpha=1;
  ctx.restore();
}

function drawEscapeFX(ctx:CanvasRenderingContext2D,gs:GS) {
  if(gs.level!==3) return;
  const hot=ctx.createLinearGradient(0,0,0,VH);
  hot.addColorStop(0,'rgba(30,0,0,0.35)');
  hot.addColorStop(0.55,'rgba(255,92,20,0.11)');
  hot.addColorStop(1,'rgba(255,180,60,0.2)');
  ctx.fillStyle=hot;
  ctx.fillRect(0,0,VW,VH);

  ctx.save();
  for(let i=0;i<54;i++){
    const wx=((i*277+Math.floor(gs.t*95))%(gs.ww+700))-350;
    const sx=wx-gs.cx;
    if(sx<-80||sx>VW+80) continue;
    const y=((i*71+gs.t*(70+i%5*18))%(VH+140))-90;
    ctx.save();
    ctx.translate(sx,y);
    ctx.rotate(gs.t*2+i);
    ctx.globalAlpha=0.24+0.18*Math.sin(gs.t*4+i);
    ctx.fillStyle=i%3===0?C.tGoldD:'#5e2b12';
    ctx.fillRect(-3,-3,6+i%6,6+i%4);
    ctx.restore();
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<18;i++){
    const sx=((i*97+Math.floor(gs.t*140))%(VW+120))-60;
    const sy=VH-30-(i%5)*18;
    const flame=0.5+Math.sin(gs.t*9+i)*0.4;
    const fg=ctx.createRadialGradient(sx,sy,1,sx,sy,28+flame*18);
    fg.addColorStop(0,`rgba(255,220,110,${0.25*flame})`);
    fg.addColorStop(0.45,`rgba(255,90,24,${0.18*flame})`);
    fg.addColorStop(1,'rgba(255,40,0,0)');
    ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(sx,sy,38,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha=0.2+0.08*Math.sin(gs.t*8);
  ctx.strokeStyle=C.ember;
  ctx.lineWidth=2;
  for(let x=300;x<gs.ww;x+=760){
    const sx=x-gs.cx;
    if(sx<-60||sx>VW+60) continue;
    ctx.beginPath();
    ctx.moveTo(sx,60);
    ctx.lineTo(sx+40*Math.sin(gs.t+x),180);
    ctx.lineTo(sx-20,300);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBedrock(ctx:CanvasRenderingContext2D,camY:number,lvl=1) {
  const BR_TOP=415;                 // just below the floor surface (395), above the spike tips (426)
  const sy=BR_TOP-camY;
  if(sy>=VH) return;                // floor line already below the screen — nothing to fill
  const top=Math.max(0,sy);
  const g=ctx.createLinearGradient(0,top,0,VH);
  if(lvl>=2){ g.addColorStop(0,C.tStoneSh); g.addColorStop(1,'#140d05'); }   // dark sandstone
  else       { g.addColorStop(0,C.rockWarm); g.addColorStop(1,'#070509'); }   // warm dark cave rock
  ctx.fillStyle=g; ctx.fillRect(0,top,VW,VH-top);
}

/* ══════════ DRAW — SPIKES ══════════ */
// A continuous row of spike teeth along the pit floor. Drawn before platforms,
// so solid ground covers the teeth and they only show in the gaps (the old void).
function drawSpikes(ctx:CanvasRenderingContext2D,camX:number,camY:number) {
  const top=SPIKE_TOP-camY, base=VH-camY+40;
  if(base<-10||top>VH+10) return;
  const tw=24;                                   // tooth width
  const startWorld=Math.floor(camX/tw)*tw;       // align teeth to the world grid
  // dark backing band beneath the teeth
  ctx.fillStyle=C.spike;
  ctx.fillRect(0, top+8, VW, base-(top+8));
  for(let wx=startWorld; wx<camX+VW+tw; wx+=tw){
    const sx=wx-camX;
    // tooth
    const grd=ctx.createLinearGradient(sx,top,sx,top+30);
    grd.addColorStop(0,C.spikeT); grd.addColorStop(.5,C.spikeL); grd.addColorStop(1,C.spike);
    ctx.fillStyle=grd;
    ctx.beginPath();
    ctx.moveTo(sx, top+30);
    ctx.lineTo(sx+tw/2, top);
    ctx.lineTo(sx+tw, top+30);
    ctx.closePath(); ctx.fill();
    // glint on the tip
    ctx.fillStyle='rgba(255,255,255,.4)';
    ctx.fillRect(sx+tw/2-1, top+2, 1.5, 7);
  }
}

/* ══════════ DRAW — TEMPLE MASONRY (level 2 platforms & roof) ══════════ */
// Carved sandstone block face with gold trim, mortar seams and engraved glyphs.
function drawTemplePlat(ctx:CanvasRenderingContext2D,pl:Plat,sx:number,sy:number) {
  // base sandstone with a soft top-to-bottom shade
  const g=ctx.createLinearGradient(0,sy,0,sy+pl.h);
  g.addColorStop(0,C.tStoneL); g.addColorStop(.5,C.tStone); g.addColorStop(1,C.tStoneSh);
  ctx.fillStyle=g; ctx.fillRect(sx,sy,pl.w,pl.h);
  // gold capstone trim along the lit top edge
  ctx.fillStyle=C.tGold;  ctx.fillRect(sx,sy,pl.w,3);
  ctx.fillStyle=C.tGoldD; ctx.fillRect(sx,sy+3,pl.w,1);
  // deep mortar shadow at the base
  ctx.fillStyle=C.tStoneSh; ctx.fillRect(sx,sy+pl.h-3,pl.w,3);

  // masonry seams — offset (running-bond) brick courses.
  // Clip to the block so the seam strokes never spill past its edges.
  const bh=20,bw=54, baseX=Math.floor(pl.x);
  ctx.save();
  ctx.beginPath(); ctx.rect(sx,sy,pl.w,pl.h); ctx.clip();
  ctx.strokeStyle=C.tStoneSh; ctx.lineWidth=1;
  for(let row=0;row*bh<pl.h;row++){
    const off=(row%2)*(bw/2);
    for(let col=-1;col*bw<pl.w+bw;col++){
      ctx.strokeRect(sx+col*bw+off,sy+row*bh,bw,bh);
    }
  }
  // engraved glyphs carved into the block faces (deterministic per block → no flicker)
  ctx.fillStyle=C.tGlyph;
  for(let row=0;row*bh<pl.h;row++){
    const off=(row%2)*(bw/2);
    for(let col=0;col*bw<pl.w;col++){
      const gx=sx+col*bw+off+18, gy=sy+row*bh+6;
      if(gx<sx+6||gx>sx+pl.w-12) continue;
      const h=((baseX+col*31+row*17)>>>0)%4;
      if(h===0){ ctx.fillRect(gx,gy,2,8); ctx.fillRect(gx,gy,8,2); ctx.fillRect(gx,gy+6,8,2); }       // ⌶
      else if(h===1){ ctx.fillRect(gx+3,gy,2,9); ctx.fillRect(gx,gy+2,8,2); }                          // ✝
      else if(h===2){ ctx.fillRect(gx,gy,8,2); ctx.fillRect(gx,gy,2,8); ctx.fillRect(gx+6,gy,2,8); }   // ⊓
      // h===3 → blank weathered block
    }
  }
  ctx.restore();   // end block clip
  // faint gold inlay sheen sliding along the top
  ctx.save(); ctx.globalAlpha=.18;
  for(let i=0;i<Math.floor(pl.w/110);i++){
    const ax=sx+40+i*110+(i*47%60);
    ctx.fillStyle=C.tGold;
    ctx.beginPath(); ctx.arc(ax,sy+2,2.5,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// Carved coffered ceiling for the temple — flat dressed stone, no stalactites/vines.
function drawEscapePlat(ctx:CanvasRenderingContext2D,pl:Plat,sx:number,sy:number,t:number) {
  const g=ctx.createLinearGradient(0,sy,0,sy+pl.h);
  g.addColorStop(0,'#7a4b24');
  g.addColorStop(0.45,'#4a2412');
  g.addColorStop(1,'#180806');
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.moveTo(sx,sy+2);
  ctx.lineTo(sx+pl.w-8,sy);
  ctx.lineTo(sx+pl.w,sy+pl.h);
  ctx.lineTo(sx+8,sy+pl.h+2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle='rgba(255,184,80,0.38)';
  ctx.fillRect(sx+3,sy,Math.max(0,pl.w-8),2);
  ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.fillRect(sx,sy+pl.h-3,pl.w,3);

  ctx.save();
  ctx.strokeStyle='rgba(255,98,26,0.55)';
  ctx.lineWidth=1.4;
  for(let x=sx+18+(Math.floor(pl.x)%31);x<sx+pl.w-12;x+=54){
    ctx.beginPath();
    ctx.moveTo(x,sy+3);
    ctx.lineTo(x+12*Math.sin(t+pl.x),sy+pl.h*0.45);
    ctx.lineTo(x-4,sy+pl.h-2);
    ctx.stroke();
  }
  ctx.restore();

  if(pl.w>120 && pl.h>20){
    ctx.save();
    ctx.globalAlpha=0.24;
    ctx.fillStyle='#050202';
    for(let x=sx+28;x<sx+pl.w;x+=72){
      ctx.beginPath();
      ctx.moveTo(x,sy+pl.h);
      ctx.lineTo(x+18,sy+pl.h);
      ctx.lineTo(x+8,sy+pl.h+12+(x%3)*5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawTempleRoof(ctx:CanvasRenderingContext2D,pl:Plat,sx:number,sy:number) {
  const surf=sy+pl.h;
  const g=ctx.createLinearGradient(0,sy,0,surf);
  g.addColorStop(0,C.tRoofSh); g.addColorStop(.8,C.tRoof); g.addColorStop(1,C.tStoneSh);
  ctx.fillStyle=g; ctx.fillRect(sx,sy,pl.w,pl.h);
  // coffer recesses along the underside
  const baseX=Math.floor(pl.x), cw=64;
  for(let k=0;k*cw<pl.w;k++){
    const cx=sx+k*cw+8;
    if(cx>sx+pl.w-16) continue;
    ctx.fillStyle=C.tRoofSh; ctx.fillRect(cx,surf-12,cw-16,8);
    ctx.fillStyle=C.tGoldD;  ctx.fillRect(cx,surf-4,cw-16,2);   // gold rim
  }
  // gold lintel band at the lip
  ctx.fillStyle=C.tGold; ctx.fillRect(sx,surf-2,pl.w,2);
  // weathering speckle
  ctx.fillStyle='rgba(0,0,0,0.22)';
  for(let k=0;k<pl.w;k+=20){ const wx=baseX+k; ctx.fillRect(sx+k+(wx%11), surf-9-(wx*7%18), 2,2); }
}

/* ══════════ DRAW — PLATFORMS ══════════ */
function drawPlats(ctx:CanvasRenderingContext2D,plats:Plat[],camX:number,camY:number,t:number,lvl=1) {
  for(const pl of plats){
    if(isCeil(pl)) continue;   // the cave roof is drawn by drawCeiling (natural rock, not brick)
    if(pl.gate) continue;      // puzzle gates are drawn as portcullises by drawGates
    const sx=pl.x-camX, sy=pl.y-camY;
    if(sx>VW+50||sx+pl.w<-50||sy>VH+50) continue;
    if(lvl===3){ drawEscapePlat(ctx,pl,sx,sy,t); continue; }
    if(lvl===2){ drawTemplePlat(ctx,pl,sx,sy); continue; }   // ancient-temple masonry
    // base
    ctx.fillStyle=C.stone; ctx.fillRect(sx,sy,pl.w,pl.h);
    // top highlight
    ctx.fillStyle=C.stoneL; ctx.fillRect(sx,sy,pl.w,4);
    // bottom shadow
    ctx.fillStyle=C.stoneSh; ctx.fillRect(sx,sy+pl.h-3,pl.w,3);
    // brick lines
    ctx.strokeStyle=C.stoneSh; ctx.lineWidth=1;
    const bh=22,bw=58;
    for(let row=0;row*bh<pl.h;row++){
      const off=(row%2)*(bw/2);
      for(let col=-1;col*bw<pl.w+bw;col++){
        ctx.strokeRect(sx+col*bw+off,sy+row*bh,bw,bh);
      }
    }
    // crystal accents on top
    ctx.save(); ctx.globalAlpha=.22;
    for(let i=0;i<Math.floor(pl.w/90);i++){
      const ax=sx+30+i*90+(i*41%50);
      ctx.fillStyle=C.soul;
      ctx.beginPath(); ctx.arc(ax,sy+3,3,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();

    // ── PLANTS — deterministic from the platform's world x, so they never flicker ──
    const seed=Math.floor(pl.x);
    // mossy fringe carpeting the lit top edge
    for(let mx=6; mx<pl.w-4; mx+=11){
      ctx.fillStyle=C.moss;  ctx.fillRect(sx+mx, sy, 7, 3+((seed+mx)*13%4));
      ctx.fillStyle=C.mossL; ctx.fillRect(sx+mx+1, sy, 3, 2);
    }
    // grass / fern tufts swaying on top
    ctx.strokeStyle=C.mossL; ctx.lineWidth=1.5; ctx.lineCap='round';
    for(let gi=0; gi*64<pl.w; gi++){
      const gx=sx+22+gi*64+((seed+gi*37)%26);
      if(gx>sx+pl.w-8) continue;
      const sway=Math.sin(t*0.9+gx*0.05)*2.5;
      for(let b=-1;b<=1;b++){
        ctx.beginPath(); ctx.moveTo(gx+b*3, sy+1);
        ctx.quadraticCurveTo(gx+b*4+sway*0.5, sy-6, gx+b*5+sway, sy-12); ctx.stroke();
      }
    }
    // vines hanging from the underside, gently swaying
    ctx.strokeStyle=C.vine; ctx.lineWidth=2;
    for(let vi=0; vi*118<pl.w; vi++){
      const vx=sx+48+vi*118+((seed+vi*53)%40);
      if(vx>sx+pl.w-10) continue;
      const len=18+((seed+vi*29)%34), sway=Math.sin(t*0.8+vx*0.04)*5;
      ctx.beginPath(); ctx.moveTo(vx, sy+pl.h);
      ctx.quadraticCurveTo(vx+sway*0.5, sy+pl.h+len*0.6, vx+sway, sy+pl.h+len); ctx.stroke();
      ctx.fillStyle=C.vine;
      ctx.beginPath(); ctx.ellipse(vx+sway*0.5, sy+pl.h+len*0.55, 3,1.6, 0,0,Math.PI*2); ctx.fill();
    }
    // a glowing mushroom on roughly every third platform
    if(seed%3===0 && pl.w>70){
      const mx=sx+34+(seed%(pl.w-60|0));
      const gp=0.7+Math.sin(t*2.5+seed)*0.3;
      ctx.save(); ctx.globalAlpha=0.5*gp;
      const mg=ctx.createRadialGradient(mx,sy-4,1,mx,sy-4,16);
      mg.addColorStop(0,C.shroomGlow); mg.addColorStop(1,'transparent');
      ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(mx,sy-4,16,0,Math.PI*2); ctx.fill();
      ctx.restore();
      ctx.fillStyle=C.shroomStem; ctx.fillRect(mx-1.5,sy-7,3,7);
      ctx.fillStyle=C.shroomCap;  ctx.beginPath(); ctx.ellipse(mx,sy-7,5,3,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=C.shroomGlow; ctx.beginPath(); ctx.arc(mx-1.5,sy-8,1,0,Math.PI*2); ctx.fill();
    }
  }
}

/* ══════════ DRAW — CAVE ROOF ══════════ */
function drawEscapeRoof(ctx:CanvasRenderingContext2D,pl:Plat,sx:number,sy:number,t:number) {
  const surf=sy+pl.h;
  const g=ctx.createLinearGradient(0,sy,0,surf);
  g.addColorStop(0,'#050202');
  g.addColorStop(0.65,'#190705');
  g.addColorStop(1,'#4a1b0c');
  ctx.fillStyle=g;
  ctx.fillRect(sx,sy,pl.w,pl.h);

  const baseX=Math.floor(pl.x);
  ctx.fillStyle='rgba(0,0,0,0.36)';
  for(let k=0;k<pl.w;k+=22){
    const wx=baseX+k;
    ctx.fillRect(sx+k+(wx%17), surf-10-(wx*5%34), 3, 3);
  }

  // Broken hanging slabs instead of regular temple coffers.
  for(let k=0;k<pl.w;k+=54){
    const wx=baseX+k;
    const px=sx+k+(wx%19);
    const len=18+(wx*11%46);
    const half=10+(wx*7%10);
    const rg=ctx.createLinearGradient(px,surf-4,px,surf+len);
    rg.addColorStop(0,'#3d160a');
    rg.addColorStop(1,'#080202');
    ctx.fillStyle=rg;
    ctx.beginPath();
    ctx.moveTo(px-half,surf-3);
    ctx.lineTo(px+half+(wx%9),surf-1);
    ctx.lineTo(px+half*0.35,surf+len);
    ctx.lineTo(px-half*0.45,surf+len*0.72);
    ctx.closePath();
    ctx.fill();

    if(wx%3===0){
      ctx.strokeStyle='rgba(255,92,24,0.36)';
      ctx.lineWidth=1.3;
      ctx.beginPath();
      ctx.moveTo(px-2,surf+2);
      ctx.lineTo(px+5*Math.sin(t+wx),surf+len*0.45);
      ctx.lineTo(px-4,surf+len*0.9);
      ctx.stroke();
    }
  }

  // Glowing cracks across the ceiling lip.
  ctx.save();
  ctx.strokeStyle='rgba(255,118,34,0.42)';
  ctx.lineWidth=1.5;
  for(let k=14;k<pl.w;k+=96){
    const x=sx+k+(baseX%23);
    ctx.beginPath();
    ctx.moveTo(x,surf-14);
    ctx.lineTo(x+18*Math.sin(t+k),surf-5);
    ctx.lineTo(x+4,surf+18);
    ctx.stroke();
  }
  ctx.restore();

  // Ash falling from the broken roof.
  ctx.save();
  for(let i=0;i<Math.floor(pl.w/90)+1;i++){
    const x=sx+((i*87+Math.floor(t*46)+baseX)%(Math.max(1,pl.w)));
    const y=surf+((i*43+Math.floor(t*70))%95);
    ctx.globalAlpha=0.18+0.08*Math.sin(t*3+i);
    ctx.fillStyle=i%2?'#d8b66a':'#5e2b12';
    ctx.fillRect(x,y,2,4+i%3);
  }
  ctx.restore();
}

// Natural dark rock filling the top of the world down to a jagged stalactite
// underside, with the odd hanging vine. World-space (camX/camY).
function drawCeiling(ctx:CanvasRenderingContext2D,plats:Plat[],camX:number,camY:number,t:number,lvl=1) {
  for(const pl of plats){
    if(!isCeil(pl)||pl.gate) continue;   // gates can slide up past the ceiling line — never rock
    const sx=pl.x-camX, sy=pl.y-camY, surf=sy+pl.h;   // surf = the rock's lower edge on screen
    if(sx>VW+40||sx+pl.w<-40||surf<-60) continue;
    if(lvl===3){ drawEscapeRoof(ctx,pl,sx,sy,t); continue; }
    if(lvl===2){ drawTempleRoof(ctx,pl,sx,sy); continue; }   // dressed-stone coffered ceiling
    // rock body — warm dark stone, lighter toward the lip
    const g=ctx.createLinearGradient(0,sy,0,surf);
    g.addColorStop(0,C.stoneSh); g.addColorStop(.85,C.rockWarm); g.addColorStop(1,'#39271d');
    ctx.fillStyle=g; ctx.fillRect(sx,sy,pl.w,pl.h);
    // speckled mineral grain (deterministic from world x → never flickers)
    const baseX=Math.floor(pl.x);
    ctx.fillStyle='rgba(0,0,0,0.25)';
    for(let k=0;k<pl.w;k+=18){ const wx=baseX+k;
      ctx.fillRect(sx+k+(wx%13), surf-6-(wx*7%26), 2, 2); }
    // ── STALACTITES hanging from the lip ──
    for(let k=4;k<pl.w;k+=30){
      const wx=baseX+k;
      const len=9+(wx*13%24), half=6+(wx*7%5), px=sx+k+(wx%11);
      const tg=ctx.createLinearGradient(px,surf-2,px,surf+len);
      tg.addColorStop(0,'#3a281d'); tg.addColorStop(1,C.stoneSh);
      ctx.fillStyle=tg;
      ctx.beginPath(); ctx.moveTo(px-half,surf-2); ctx.lineTo(px+half,surf-2); ctx.lineTo(px,surf+len); ctx.closePath(); ctx.fill();
      // a moist warm glint near the tip
      ctx.fillStyle='rgba(255,170,90,0.18)';
      ctx.fillRect(px-1, surf+len*0.4, 1.5, len*0.4);
    }
    // moss fringe clinging to the lip
    ctx.fillStyle=C.moss;
    for(let mx=8; mx<pl.w-6; mx+=15){ ctx.fillRect(sx+mx, surf-3, 6, 3+((baseX+mx)*13%4)); }
    // the occasional vine drooping from the roof
    ctx.strokeStyle=C.vine; ctx.lineWidth=2; ctx.lineCap='round';
    for(let vi=0; vi*150<pl.w; vi++){
      const vx=sx+60+vi*150+((baseX+vi*53)%50);
      if(vx>sx+pl.w-10) continue;
      const len=22+((baseX+vi*29)%40), sway=Math.sin(t*0.7+vx*0.04)*5;
      ctx.beginPath(); ctx.moveTo(vx,surf);
      ctx.quadraticCurveTo(vx+sway*0.5, surf+len*0.6, vx+sway, surf+len); ctx.stroke();
      ctx.fillStyle=C.vine; ctx.beginPath(); ctx.ellipse(vx+sway*0.5, surf+len*0.55, 3,1.6,0,0,Math.PI*2); ctx.fill();
    }
  }
}

/* ══════════ DRAW — CHECKPOINT (warm lantern) ══════════ */
function drawCP(ctx:CanvasRenderingContext2D,cp:CP,camX:number,camY:number,t:number) {
  const sx=cp.x-camX, sy=cp.y-camY;
  if(sx<-60||sx>VW+60) return;
  // post
  ctx.fillStyle='#2a2014'; ctx.fillRect(sx+9,sy,4,40);
  if(cp.on){
    // big warm glow pool
    const pulse=.34+Math.sin(t*2)*.12;
    ctx.save(); ctx.globalAlpha=pulse;
    const g=ctx.createRadialGradient(sx+11,sy+4,2,sx+11,sy+4,52);
    g.addColorStop(0,C.lanternG); g.addColorStop(.4,C.lantern); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.fillRect(sx-41,sy-37,104,104); ctx.restore();
    // a few embers rising from the flame
    ctx.save(); ctx.shadowColor=C.ember; ctx.shadowBlur=6;
    for(let i=0;i<3;i++){
      const prog=(t*0.6+i*0.34)%1;
      ctx.globalAlpha=(1-prog)*0.8;
      ctx.fillStyle=i%2?C.lanternG:C.ember;
      ctx.beginPath(); ctx.arc(sx+11+Math.sin(prog*6+i)*4, sy-4-prog*28, 1.4,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
  // lantern head
  ctx.fillStyle=cp.on?C.lantern:C.chkOff; ctx.fillRect(sx+2,sy-18,18,18);
  ctx.fillStyle=cp.on?'#fff3d0':'rgba(255,255,255,.25)'; ctx.fillRect(sx+5,sy-15,5,8);
}

/* ══════════ WARM LIGHT SOURCES (fixed world positions) ══════════ */
const LANTERNS:Light[] = [
  {x:360,y:300},{x:1180,y:240},{x:1980,y:300},{x:2980,y:300},{x:3560,y:170},
  {x:4760,y:230},{x:5760,y:250},{x:6560,y:200},{x:7560,y:280},{x:8160,y:200},
  {x:8900,y:250},{x:9710,y:240},{x:10500,y:250},{x:10880,y:300},
];
const EMBERNOOKS:Light[] = [ {x:900,y:360},{x:2600,y:372},{x:5400,y:378},{x:7400,y:360},{x:9000,y:378},{x:10500,y:378} ];
const SHAFTS:Shaft[] = [ {x:1500,w:120},{x:4200,w:140},{x:6800,w:120},{x:9100,w:150},{x:10300,w:150} ];

// hanging lanterns, ember nooks and god-ray shafts. World-space (camX/camY), drawn after platforms.
function drawLights(ctx:CanvasRenderingContext2D,camX:number,camY:number,t:number,
                    lanterns:Light[],embernooks:Light[],shafts:Shaft[]) {
  // god-ray shafts — very subtle, slight independent parallax for a volumetric feel
  for(const S of shafts){
    const sx=S.x-camX*0.7;
    if(sx<-220||sx>VW+220) continue;
    ctx.save(); ctx.globalAlpha=0.06+Math.sin(t*0.8+S.x)*0.02;
    const g=ctx.createLinearGradient(sx,0,sx+S.w*0.5,VH);
    g.addColorStop(0,C.lantern); g.addColorStop(1,'transparent');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.moveTo(sx-S.w/2,0); ctx.lineTo(sx+S.w/2,0);
    ctx.lineTo(sx+S.w,VH); ctx.lineTo(sx,VH); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // hanging lanterns with warm glow pools
  for(const L of lanterns){
    const sx=L.x-camX, sy=L.y-camY;
    if(sx<-90||sx>VW+90) continue;
    const pulse=0.85+Math.sin(t*2.3+L.x)*0.15;
    ctx.save(); ctx.globalAlpha=0.5*pulse;
    const g=ctx.createRadialGradient(sx,sy,2,sx,sy,82);
    g.addColorStop(0,C.lanternG); g.addColorStop(.4,C.lantern); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,sy,82,0,Math.PI*2); ctx.fill();
    ctx.restore();
    // chain up into the dark ceiling
    ctx.strokeStyle='#1a1408'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(sx,sy-10); ctx.lineTo(sx,sy-46); ctx.stroke();
    // iron body
    ctx.fillStyle='#2a1d0c'; ctx.fillRect(sx-6,sy-10,12,16);
    ctx.fillStyle='#120c05'; ctx.fillRect(sx-7,sy-12,14,3); ctx.fillRect(sx-7,sy+5,14,3);
    // flame core
    ctx.save(); ctx.shadowColor=C.lantern; ctx.shadowBlur=14*pulse;
    const fg=ctx.createRadialGradient(sx,sy-2,0,sx,sy-2,6);
    fg.addColorStop(0,'#fff3d0'); fg.addColorStop(.5,C.lanternG); fg.addColorStop(1,C.ember);
    ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(sx,sy-2,4.5*pulse,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  // ember nooks — clusters of glowing coals in the rock
  for(const E of embernooks){
    const sx=E.x-camX, sy=E.y-camY;
    if(sx<-40||sx>VW+40) continue;
    ctx.save(); ctx.shadowColor=C.ember; ctx.shadowBlur=8;
    for(let i=0;i<5;i++){
      ctx.globalAlpha=Math.max(0,0.4+Math.sin(t*3+i+E.x)*0.3);
      ctx.fillStyle=i%2?C.ember:C.lanternG;
      ctx.beginPath(); ctx.arc(sx+(i*7-14),sy-(i%3)*3,1.6,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

// free-floating dust motes; brighten where they drift through a god-ray. Screen-space ambience.
function drawMotes(ctx:CanvasRenderingContext2D,camX:number,t:number,shafts:Shaft[]) {
  ctx.save();
  for(let i=0;i<46;i++){
    const mx=(((i*257 - camX*0.12)%(VW+60))+(VW+60))%(VW+60)-30;
    const my=(((i*163 + t*8)%(VH+40))+(VH+40))%(VH+40)-20;
    let inShaft=false;
    for(const S of shafts){ if(Math.abs(mx-(S.x-camX*0.7))<S.w*0.6){ inShaft=true; break; } }
    ctx.globalAlpha=(inShaft?0.30:0.12)+Math.sin(t*1.5+i)*0.06;
    ctx.fillStyle=inShaft?C.lanternG:'#9fb4d8';
    ctx.beginPath(); ctx.arc(mx,my,i%3===0?1.4:0.9,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// soft dark frame around the cave. Screen-space — drawn last.
function drawVignette(ctx:CanvasRenderingContext2D) {
  const g=ctx.createRadialGradient(VW/2,VH*0.5,VH*0.34, VW/2,VH*0.5,VH*0.98);
  g.addColorStop(0,'transparent'); g.addColorStop(1,'rgba(0,0,0,0.55)');
  ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH);
}

/* ══════════ DRAW — PLAYER ══════════ */
function drawPlayer(ctx:CanvasRenderingContext2D,p:Plr,camX:number,camY:number,t:number) {
  const sx=p.x-camX, sy=p.y-camY;
  if(p.it>0 && Math.floor(t*16)%2===0 && p.st!=='dead') return; // flicker

  ctx.save();
  ctx.translate(sx+p.w/2, sy+p.h/2);
  if(p.f===-1) ctx.scale(-1,1);
  // dodge roll — somersault spin in the travel direction
  if(p.st==='dodge'){ const prog=1-Math.max(0,p.dodt)/DODGE_DUR; ctx.rotate(prog*Math.PI*2*p.dodd); }

  const run=p.st==='run', leg=run?Math.sin(p.aT*18)*.22:0;

  // glowing aura — makes the knight pop against the dark world
  ctx.save();
  const pulse=0.5+Math.sin(t*4)*0.12;
  const aura=ctx.createRadialGradient(0,0,2,0,0,p.h*0.95);
  aura.addColorStop(0,`rgba(102,204,255,${0.28*pulse})`);
  aura.addColorStop(1,'rgba(102,204,255,0)');
  ctx.fillStyle=aura;
  ctx.beginPath(); ctx.arc(0,0,p.h*0.95,0,Math.PI*2); ctx.fill();
  ctx.restore();

  ctx.shadowColor=C.plrGl; ctx.shadowBlur=10;

  // ── CAPE — flows behind the knight, billowing with motion ──
  const sway = run ? Math.sin(p.aT*16)*3.5
             : p.st==='fall' ? 5
             : p.st==='jump' ? -3
             : Math.sin(t*2.2)*1.2;
  const cg=ctx.createLinearGradient(0,-9,0,p.h*0.55);
  cg.addColorStop(0,C.cloak); cg.addColorStop(1,'#1d2a63');
  ctx.fillStyle=cg;
  ctx.beginPath();
  ctx.moveTo(-7,-9);
  ctx.lineTo(5,-8);
  ctx.quadraticCurveTo(1,6, -3+sway*0.4,14);
  ctx.quadraticCurveTo(-7+sway,19, -11+sway,16);   // wavy hem
  ctx.quadraticCurveTo(-8+sway*0.4,8, -11,-1);
  ctx.closePath(); ctx.fill();

  // ── LEGS — armored greaves with knee plates + pointed boots (animated run) ──
  for(const s of [-1,1]){
    const off = s<0 ? leg*6 : -leg*6;            // legs swing in opposite phase
    ctx.save(); ctx.translate(s*4.5, p.h*.12+off);
    const lg=ctx.createLinearGradient(-3.5,0,3.5,0);
    lg.addColorStop(0,'#24468f'); lg.addColorStop(.5,C.plrD); lg.addColorStop(1,'#24468f');
    ctx.fillStyle=lg; ctx.fillRect(-3.5,0,7,12);
    ctx.fillStyle=C.plr; ctx.fillRect(-3.5,4,7,2.2);   // knee plate
    ctx.fillStyle='#0a0a14';                            // boot
    ctx.beginPath(); ctx.moveTo(-3.5,11); ctx.lineTo(5,11); ctx.lineTo(5,15); ctx.lineTo(-3.5,15); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ── TORSO / CHESTPLATE ──
  ctx.save();
  ctx.shadowColor=C.plrGl; ctx.shadowBlur=8;
  const bg=ctx.createLinearGradient(0,-10,0,14);
  bg.addColorStop(0,'#bcd8ff'); bg.addColorStop(.45,C.plr); bg.addColorStop(1,C.plrD);
  ctx.fillStyle=bg;
  ctx.beginPath();
  ctx.moveTo(-8,-8); ctx.lineTo(8,-8); ctx.lineTo(9,6);
  ctx.quadraticCurveTo(0,14, -9,6);                  // tapered waist
  ctx.closePath(); ctx.fill();
  ctx.restore();
  // chest seams + V-neck
  ctx.strokeStyle='#1c3a78'; ctx.lineWidth=1; ctx.lineJoin='round';
  ctx.beginPath(); ctx.moveTo(0,-6); ctx.lineTo(0,11); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6,-7); ctx.lineTo(0,-1); ctx.lineTo(6,-7); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.22)'; ctx.fillRect(-6,-6,2.5,11);   // highlight stripe
  // belt + glowing buckle
  ctx.fillStyle='#23284a'; ctx.fillRect(-9,6,18,3);
  ctx.fillStyle=C.swordGl; ctx.fillRect(-1.6,6,3.2,3);

  // ── PAULDRONS (shoulder plates) ──
  for(const s of [-1,1]){
    ctx.fillStyle = s>0 ? C.plr : C.plrD;            // front shoulder catches more light
    ctx.beginPath(); ctx.ellipse(s*8.5,-7,4.5,3.4,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.22)';
    ctx.beginPath(); ctx.ellipse(s*8.5,-8,2.4,1.4,0,0,Math.PI*2); ctx.fill();
  }

  // ── HEAD / HELM ──
  const hy=-p.h*.5+7;                                 // helm centre (matches old head anchor)
  ctx.save();
  ctx.shadowColor=C.plrGl; ctx.shadowBlur=8;
  const hg=ctx.createLinearGradient(0,hy-10,0,hy+8);
  hg.addColorStop(0,'#cfe6ff'); hg.addColorStop(.5,C.plr); hg.addColorStop(1,C.plrD);
  ctx.fillStyle=hg;
  ctx.beginPath();
  ctx.moveTo(-8,hy+6); ctx.lineTo(-8,hy-2);
  ctx.quadraticCurveTo(-8,hy-10, 0,hy-10);
  ctx.quadraticCurveTo(8,hy-10, 8,hy-2);
  ctx.lineTo(8,hy+6);
  ctx.quadraticCurveTo(0,hy+9, -8,hy+6);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle='#0a1428'; ctx.fillRect(-8,hy-1,16,5);          // visor band
  ctx.fillStyle='rgba(255,255,255,.3)'; ctx.fillRect(-0.8,hy-9,1.6,7);  // crown ridge
  // glowing visor slit (brighter toward the facing edge)
  ctx.save(); ctx.shadowColor=C.eye; ctx.shadowBlur=7; ctx.fillStyle=C.eye;
  ctx.fillRect(-6,hy+0.4,12,2); ctx.fillRect(3,hy,3,2.8);
  ctx.restore();

  // ── CREST / PLUME ──
  ctx.fillStyle=C.plrD;
  ctx.beginPath(); ctx.moveTo(-2,hy-9); ctx.lineTo(2,hy-9); ctx.lineTo(1,hy-15); ctx.lineTo(-1,hy-15); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.shadowColor=C.plrGl; ctx.shadowBlur=8; ctx.fillStyle=C.plrGl;
  ctx.beginPath(); ctx.arc(0,hy-15,2,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // sword (tapered blade) + slash arc
  if(p.st==='atk'){
    const prog=1-p.at/ADUR;            // 0 → 1 over the swing
    ctx.save();
    ctx.shadowColor=C.swordGl; ctx.shadowBlur=12;

    if(p.adn){
      // ── DOWN-SLASH ── blade points down, arc sweeps below the feet
      ctx.strokeStyle=`rgba(180,204,255,${0.65*(1-prog)+0.22})`;
      ctx.lineWidth=4; ctx.lineCap='round';
      ctx.beginPath(); ctx.arc(0,p.h*.5-2, 30+prog*6, Math.PI*0.08, Math.PI*0.92); ctx.stroke();

      const by=p.h*.5+1, len=46+prog*10;    // base near the feet, tip below
      ctx.fillStyle=C.sword;
      ctx.beginPath();
      ctx.moveTo(-3, by);
      ctx.lineTo(-3, by+len-9);
      ctx.lineTo( 0, by+len);               // tip
      ctx.lineTo( 3, by+len-9);
      ctx.lineTo( 3, by);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.6)';
      ctx.fillRect(-0.7, by, 1.4, len-11);  // fuller
      ctx.shadowBlur=0;
      ctx.fillStyle='#9a8444'; ctx.fillRect(-8, by-3, 16, 5);   // crossguard
      ctx.fillStyle=C.swordGl;
      ctx.beginPath(); ctx.arc(0, by-5, 2.4, 0, Math.PI*2); ctx.fill(); // pommel
    } else if(p.aup){
      // ── UP-SLASH ── blade points up, arc sweeps overhead
      ctx.strokeStyle=`rgba(180,204,255,${0.65*(1-prog)+0.22})`;
      ctx.lineWidth=4; ctx.lineCap='round';
      ctx.beginPath(); ctx.arc(0,-p.h*.5+2, 30+prog*6, Math.PI*1.08, Math.PI*1.92); ctx.stroke();

      const by=-p.h*.5-1, len=46+prog*10;   // base near the head top, tip above
      ctx.fillStyle=C.sword;
      ctx.beginPath();
      ctx.moveTo(-3, by);
      ctx.lineTo(-3, by-len+9);
      ctx.lineTo( 0, by-len);               // tip
      ctx.lineTo( 3, by-len+9);
      ctx.lineTo( 3, by);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.6)';
      ctx.fillRect(-0.7, by-len+11, 1.4, len-11);   // fuller
      ctx.shadowBlur=0;
      ctx.fillStyle='#9a8444'; ctx.fillRect(-8, by-2, 16, 5);   // crossguard
      ctx.fillStyle=C.swordGl;
      ctx.beginPath(); ctx.arc(0, by+5, 2.4, 0, Math.PI*2); ctx.fill(); // pommel
    } else {
      // ── FORWARD SLASH ── (mirrored by the facing scale)
      const ang=-Math.PI*0.5 + prog*Math.PI*0.95;
      ctx.strokeStyle=`rgba(180,204,255,${0.65*(1-prog)+0.18})`;
      ctx.lineWidth=4; ctx.lineCap='round';
      ctx.beginPath(); ctx.arc(6,2, 42, ang-0.55, ang+0.55); ctx.stroke();

      const bx=8, by=-p.h*.5+18, len=44+prog*10;
      ctx.fillStyle=C.sword;
      ctx.beginPath();
      ctx.moveTo(bx, by-3);
      ctx.lineTo(bx+len-9, by-3);
      ctx.lineTo(bx+len,   by);          // tip
      ctx.lineTo(bx+len-9, by+3);
      ctx.lineTo(bx, by+3);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle='rgba(255,255,255,.6)';
      ctx.fillRect(bx, by-1, len-11, 1.4);   // fuller

      ctx.shadowBlur=0;
      ctx.fillStyle='#9a8444'; ctx.fillRect(bx-3, by-8, 5, 16);   // crossguard
      ctx.fillStyle='#3a2f18'; ctx.fillRect(bx-10, by-2.5, 8, 5); // grip
      ctx.fillStyle=C.swordGl;
      ctx.beginPath(); ctx.arc(bx-11, by, 2.6, 0, Math.PI*2); ctx.fill(); // pommel
    }
    ctx.restore();
  }

  // shield — textured heater shield raised in front of the knight while blocking
  // (gated on p.blk, not a movement state, so it shows while walking / jumping / attacking)
  if(p.blk){
    const broke=p.sh<=0.04;
    const hw=10;
    // heater-shield outline path (reused for fill / clip / stroke)
    const shape=()=>{
      ctx.beginPath();
      ctx.moveTo(-hw,-15);
      ctx.lineTo(hw,-15);
      ctx.lineTo(hw,3);
      ctx.quadraticCurveTo(hw,17, 0,21);
      ctx.quadraticCurveTo(-hw,17, -hw,3);
      ctx.closePath();
    };

    ctx.save();
    ctx.translate(13, 0);
    ctx.shadowColor=C.shield; ctx.shadowBlur=broke?2:13;

    // dark metal backing / outer rim
    shape();
    ctx.fillStyle=broke?'#27313d':'#16314a';
    ctx.fill();
    ctx.shadowBlur=0;

    // plated face (inset), brushed-metal vertical gradient
    ctx.save();
    shape(); ctx.clip();
    const g=ctx.createLinearGradient(0,-16,0,21);
    if(broke){ g.addColorStop(0,'#46525f'); g.addColorStop(.5,'#2c3742'); g.addColorStop(1,'#1c252e'); }
    else     { g.addColorStop(0,'#cdeeff'); g.addColorStop(.45,'#7fb9e6'); g.addColorStop(1,C.shieldE); }
    ctx.fillStyle=g;
    ctx.fillRect(-hw-2,-16,(hw+2)*2,38);
    // diagonal sheen streaks (brushed texture)
    ctx.globalAlpha=broke?.08:.18; ctx.strokeStyle='#ffffff'; ctx.lineWidth=1;
    for(let i=-4;i<=4;i++){ ctx.beginPath(); ctx.moveTo(-hw-2,i*4-2); ctx.lineTo(hw+2,i*4+4); ctx.stroke(); }
    ctx.globalAlpha=1;
    // vertical center ridge
    ctx.fillStyle=broke?'rgba(120,140,160,.4)':'rgba(230,246,255,.45)';
    ctx.fillRect(-1.3,-15,2.6,36);
    ctx.restore();

    // beveled rim highlight
    ctx.lineWidth=2; ctx.strokeStyle=broke?'#3a4654':C.shield;
    shape(); ctx.stroke();
    ctx.lineWidth=1; ctx.strokeStyle=broke?'rgba(90,110,130,.5)':'rgba(220,245,255,.7)';
    ctx.stroke();

    // rivets around the rim
    ctx.fillStyle=broke?'#5a6675':'#dfeefc';
    const rivets:[number,number][]=[[-7,-12],[7,-12],[-8,-2],[8,-2],[-6,9],[6,9],[0,17]];
    for(const [rx,ry] of rivets){ ctx.beginPath(); ctx.arc(rx,ry,1.3,0,Math.PI*2); ctx.fill(); }

    // heraldic cross emblem (glows with the energy)
    ctx.save();
    if(!broke){ ctx.shadowColor=C.shield; ctx.shadowBlur=6; }
    ctx.fillStyle=broke?'#4a5663':'#eaf6ff';
    ctx.fillRect(-1.6,-9,3.2,20);   // vertical bar
    ctx.fillRect(-6,-2,12,3.2);     // horizontal bar
    // center boss stud
    ctx.fillStyle=broke?'#5e6b79':'#ffffff';
    ctx.beginPath(); ctx.arc(0,-0.4,2.4,0,Math.PI*2); ctx.fill();
    ctx.restore();

    // fracture cracks when the shield is broken
    if(broke){
      ctx.strokeStyle='rgba(20,28,36,.9)'; ctx.lineWidth=1;
      ctx.beginPath();
      ctx.moveTo(-hw+2,-10); ctx.lineTo(-1,-2); ctx.lineTo(4,6); ctx.lineTo(2,20);
      ctx.moveTo(-1,-2); ctx.lineTo(-7,4);
      ctx.stroke();
    }
    ctx.restore();
  }

  // dash trail
  if(p.da){
    ctx.save(); ctx.globalAlpha=.3;
    ctx.fillStyle=C.swordGl;
    ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
    ctx.restore();
  }

  // wall slide indicator
  if(p.st==='wall'){
    ctx.fillStyle='rgba(100,136,255,.4)';
    ctx.fillRect(p.f===1?8:-16,-10,8,20);
  }

  ctx.restore();
}

/* ══════════ DRAW — CRAWLER ══════════ */
function drawCrawler(ctx:CanvasRenderingContext2D,e:Ene,camX:number,camY:number,t:number) {
  const sx=e.x-camX,sy=e.y-camY;
  ctx.save(); ctx.translate(sx+e.w/2,sy+e.h/2);
  if(e.f===-1) ctx.scale(-1,1);
  // body
  ctx.fillStyle=C.ecr;
  ctx.beginPath(); ctx.ellipse(0,0,e.w/2,e.h/2,0,0,Math.PI*2); ctx.fill();
  // shell highlight
  ctx.fillStyle='rgba(255,255,255,.06)';
  ctx.beginPath(); ctx.ellipse(-3,-4,e.w/3,e.h/3*.7,0,0,Math.PI*2); ctx.fill();
  // legs
  const lg=Math.sin(t*10)*4;
  ctx.strokeStyle='#3a1a3a'; ctx.lineWidth=2;
  for(let i=0;i<4;i++){
    const lx=(i-1.5)*10, ly=i%2===0?lg:-lg;
    ctx.beginPath(); ctx.moveTo(lx,2); ctx.lineTo(lx-4*(i<2?-1:1),e.h/2+ly); ctx.stroke();
  }
  // eyes
  ctx.save(); ctx.shadowColor=C.egl; ctx.shadowBlur=6; ctx.fillStyle=C.egl;
  ctx.beginPath(); ctx.arc(-5,-2,3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(4,-2,3,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.restore();
}

/* ══════════ DRAW — FLYER ══════════ */
function drawFlyer(ctx:CanvasRenderingContext2D,e:Ene,camX:number,camY:number,t:number) {
  const sx=e.x-camX,sy=e.y-camY;
  const flap=Math.sin(t*8)*18;
  ctx.save(); ctx.translate(sx+e.w/2,sy+e.h/2);
  if(e.f===-1) ctx.scale(-1,1);
  // wings
  ctx.fillStyle='rgba(10,42,42,.8)';
  ctx.beginPath(); ctx.ellipse(-e.w/2-2,flap*.3,e.w*.5,7,-.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( e.w/2+2,flap*.3,e.w*.5,7, .4,0,Math.PI*2); ctx.fill();
  // body
  ctx.fillStyle=C.efl;
  ctx.beginPath(); ctx.ellipse(0,0,e.w/2*.7,e.h/2,0,0,Math.PI*2); ctx.fill();
  // tail
  ctx.fillStyle='rgba(10,42,42,.6)';
  ctx.beginPath(); ctx.moveTo(-5,e.h/2-2); ctx.lineTo(5,e.h/2-2);
  ctx.lineTo(0,e.h/2+10+Math.sin(t*6)*4); ctx.closePath(); ctx.fill();
  // eye
  ctx.save(); ctx.shadowColor=C.egl; ctx.shadowBlur=7; ctx.fillStyle=C.egl;
  ctx.beginPath(); ctx.arc(4,-2,4,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.restore();
}

/* ══════════ DRAW — JUMPER ══════════ */
function drawJumper(ctx:CanvasRenderingContext2D,e:Ene,camX:number,camY:number) {
  const sx=e.x-camX,sy=e.y-camY;
  ctx.save(); ctx.translate(sx+e.w/2,sy+e.h/2);
  if(e.f===-1) ctx.scale(-1,1);
  // long legs
  ctx.strokeStyle='#2a2a44'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(-6,4); ctx.lineTo(-10,e.h*.3); ctx.lineTo(-6,e.h*.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 6,4); ctx.lineTo( 10,e.h*.3); ctx.lineTo( 6,e.h*.5); ctx.stroke();
  // body
  ctx.fillStyle=C.ejp;
  ctx.fillRect(-e.w/2,-e.h*.5,e.w,e.h*.7);
  // head
  ctx.fillStyle='#1e1e38';
  ctx.beginPath(); ctx.ellipse(0,-e.h*.35,10,12,0,0,Math.PI*2); ctx.fill();
  // eye large
  ctx.save(); ctx.shadowColor=C.egl; ctx.shadowBlur=10; ctx.fillStyle=C.egl;
  ctx.beginPath(); ctx.ellipse(3,-e.h*.35,5,6,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ff8888'; ctx.beginPath(); ctx.arc(3,-e.h*.35,2,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.restore();
}

/* ══════════ DRAW — SENTINEL (temple turret guardian) ══════════ */
function drawSentinel(ctx:CanvasRenderingContext2D,e:Ene,camX:number,camY:number) {
  const sx=e.x-camX,sy=e.y-camY;
  const aiming=e.st==='aim';
  const charge=aiming?Math.min(1,e.stT/0.75):0;
  ctx.save(); ctx.translate(sx+e.w/2,sy+e.h/2);
  if(e.f===-1) ctx.scale(-1,1);
  // carved sandstone idol — tapered pillar body with a gold-trimmed shoulder
  const g=ctx.createLinearGradient(-e.w/2,0,e.w/2,0);
  g.addColorStop(0,C.tStoneSh); g.addColorStop(.5,C.tStone); g.addColorStop(1,C.tStoneSh);
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.moveTo(-e.w/2+3,e.h/2); ctx.lineTo(-e.w/2+6,-e.h/2+8);
  ctx.lineTo(e.w/2-6,-e.h/2+8); ctx.lineTo(e.w/2-3,e.h/2); ctx.closePath(); ctx.fill();
  // gold collar + crown ridge
  ctx.fillStyle=C.tGold; ctx.fillRect(-e.w/2+5,-e.h/2+8,e.w-10,3);
  ctx.fillStyle=C.tGoldD; ctx.fillRect(-e.w/2+7,-e.h/2+2,e.w-14,6);
  // glyph seam down the chest
  ctx.fillStyle=C.tGlyph; ctx.fillRect(-1,-e.h/2+14,2,e.h-20);
  // the charged core eye — brightens and grows as it winds up to fire
  const er=4+charge*4;
  ctx.save();
  ctx.shadowColor=C.ember; ctx.shadowBlur=8+charge*16;
  ctx.fillStyle=aiming?`rgb(255,${Math.round(120-charge*80)},40)`:C.glowWarm;
  ctx.beginPath(); ctx.arc(0,-e.h*0.18,er,0,Math.PI*2); ctx.fill();
  ctx.restore();
  // muzzle glint pointing at the target while aiming
  if(aiming){
    ctx.save(); ctx.globalAlpha=.5+charge*.5; ctx.strokeStyle=C.lanternG; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(er+2,-e.h*0.18); ctx.lineTo(er+10+charge*10,-e.h*0.18); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/* ══════════ DRAW — CHARGER (armored temple brute) ══════════ */
function drawCharger(ctx:CanvasRenderingContext2D,e:Ene,camX:number,camY:number,t:number) {
  const sx=e.x-camX,sy=e.y-camY;
  const wind=e.st==='wind', charging=e.st==='charge';
  const lower=wind?Math.min(1,e.stT/0.5):charging?1:0;   // horns dip as it commits
  ctx.save(); ctx.translate(sx+e.w/2,sy+e.h/2);
  if(e.f===-1) ctx.scale(-1,1);
  // stocky legs (churn while charging)
  const churn=charging?Math.sin(t*22)*4:0;
  ctx.fillStyle='#1a1410';
  ctx.fillRect(-e.w/2+6,e.h/2-8,7,8+churn); ctx.fillRect(e.w/2-13,e.h/2-8,7,8-churn);
  ctx.fillRect(-6,e.h/2-8,7,8-churn);
  // armored plated body
  const g=ctx.createLinearGradient(0,-e.h/2,0,e.h/2);
  g.addColorStop(0,'#4a3520'); g.addColorStop(.5,'#33260f'); g.addColorStop(1,'#1c1409');
  ctx.fillStyle=g;
  ctx.beginPath(); ctx.ellipse(0,0,e.w/2,e.h/2,0,0,Math.PI*2); ctx.fill();
  // bronze plate banding over the back
  ctx.fillStyle=C.tGoldD;
  for(let i=-1;i<=1;i++) ctx.fillRect(i*12-2,-e.h/2+3,4,e.h-10);
  ctx.fillStyle=C.tStoneSh; ctx.fillRect(-e.w/2+4,-2,e.w-8,2);
  // lowered horned head leading the charge
  ctx.save(); ctx.translate(e.w/2-6,-2); ctx.rotate(lower*0.5);
  ctx.fillStyle='#2a2018';
  ctx.beginPath(); ctx.ellipse(6,0,11,9,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=C.tStoneL; ctx.lineWidth=3; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(6,-6); ctx.quadraticCurveTo(20,-10,22,-2); ctx.stroke();   // horn
  ctx.beginPath(); ctx.moveTo(6,4); ctx.quadraticCurveTo(18,2,21,8); ctx.stroke();
  // glowing eyes — flare red when winding up / charging
  ctx.save(); ctx.shadowColor=C.egl; ctx.shadowBlur=wind||charging?12:5; ctx.fillStyle=C.egl;
  ctx.beginPath(); ctx.arc(8,-2,wind||charging?3.2:2.4,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.restore();
  // dust puff kicked up mid-charge
  if(charging){ ctx.save(); ctx.globalAlpha=.3; ctx.fillStyle=C.tDust;
    ctx.beginPath(); ctx.arc(-e.w/2-2,e.h/2-3,3+Math.sin(t*20)*1.5,0,Math.PI*2); ctx.fill(); ctx.restore(); }
  ctx.restore();
}

/* ── BOSS GRAB ARM ──
   draws the sinewy arm + clawed hand at distance L along `aim`.
   open: 1 = fingers splayed (reaching), 0 = clenched fist (holding the player).
   squeeze: extra clench pulse during the crush. ctx is already at the boss centre. */
function drawWarden(ctx:CanvasRenderingContext2D,e:Ene,camX:number,camY:number,t:number) {
  const sx=e.x-camX,sy=e.y-camY;
  const slam=e.st==='slam';
  const cast=e.st==='cast';
  const enraged=e.ph>=1;
  const pulse=0.55+Math.sin(t*(enraged?8:5)+e.id)*0.25;
  ctx.save(); ctx.translate(sx+e.w/2,sy+e.h/2);
  if(e.f===-1) ctx.scale(-1,1);

  if(enraged){
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=0.18+pulse*0.18;
    ctx.shadowColor=C.ember;
    ctx.shadowBlur=28;
    ctx.fillStyle='rgba(255,90,22,0.45)';
    ctx.beginPath(); ctx.ellipse(0,4,58,70,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  if(cast || slam || e.st==='phase'){
    ctx.save();
    ctx.globalAlpha=0.28+pulse*(enraged?0.34:0.2);
    ctx.shadowColor=enraged?C.ember:C.tGold;
    ctx.shadowBlur=24;
    ctx.strokeStyle=slam||enraged?C.ember:C.soulG;
    ctx.lineWidth=enraged?4:3;
    ctx.beginPath(); ctx.ellipse(0,e.h/2-4,enraged?70:54,enraged?17:13,0,0,Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  const body=ctx.createLinearGradient(0,-e.h/2,0,e.h/2);
  body.addColorStop(0,enraged?'#e0a458':C.tStoneL);
  body.addColorStop(0.45,enraged?'#a05a25':C.tStone);
  body.addColorStop(1,enraged?'#3a160b':C.tStoneSh);
  ctx.fillStyle=body;
  ctx.beginPath();
  ctx.moveTo(-26,-34); ctx.lineTo(26,-34); ctx.lineTo(34,20);
  ctx.lineTo(18,38); ctx.lineTo(-18,38); ctx.lineTo(-34,20);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle=C.tGoldD; ctx.lineWidth=3; ctx.stroke();

  ctx.fillStyle=C.tGold;
  ctx.fillRect(-29,-28,58,5);
  ctx.fillRect(-5,-32,10,66);
  ctx.fillStyle=C.tGlyph;
  ctx.fillRect(-2,-25,4,50);

  ctx.save();
  ctx.shadowColor=enraged?C.ember:cast?C.soulG:C.tGold;
  ctx.shadowBlur=(enraged?28:16)+18*pulse;
  ctx.fillStyle=enraged?'#ff7a24':cast?'#dff7ff':'#ffe680';
  ctx.beginPath(); ctx.arc(0,-4,(enraged?11:8)+(cast?pulse*4:0),0,Math.PI*2); ctx.fill();
  ctx.restore();

  ctx.strokeStyle=C.tStoneSh; ctx.lineWidth=8; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-24,-16); ctx.lineTo(-38,18+(slam?8:0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(24,-16); ctx.lineTo(38,18+(slam?8:0)); ctx.stroke();
  ctx.strokeStyle=C.tGold; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(-39,20+(slam?8:0)); ctx.lineTo(-53,29+(slam?8:0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(39,20+(slam?8:0)); ctx.lineTo(53,29+(slam?8:0)); ctx.stroke();

  ctx.fillStyle='#22170c';
  ctx.fillRect(-24,36,16,9); ctx.fillRect(8,36,16,9);
  ctx.restore();

  const bw=72,bh=7,hp=e.hp/e.mhp;
  ctx.fillStyle='rgba(0,0,0,.65)'; ctx.fillRect(sx+e.w/2-bw/2,sy-16,bw,bh);
  ctx.fillStyle=enraged?C.ember:hp>.45?C.tGold:C.ember; ctx.fillRect(sx+e.w/2-bw/2,sy-16,bw*hp,bh);
  ctx.strokeStyle='rgba(255,230,160,.55)'; ctx.strokeRect(sx+e.w/2-bw/2,sy-16,bw,bh);
}

function drawClaw(ctx:CanvasRenderingContext2D, aim:number, L:number, open:number, t:number, squeeze=0){
  const bone='#c9b89c';
  ctx.save(); ctx.translate(0,-2); ctx.rotate(aim);

  // sinewy forearm (tapers out to the wrist)
  ctx.fillStyle='#180303';
  ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(L,-8); ctx.lineTo(L,8); ctx.lineTo(0,12); ctx.closePath(); ctx.fill();
  // molten tendon running down the arm
  ctx.strokeStyle=`rgba(255,110,20,${.5+.35*Math.sin(t*9)})`; ctx.lineWidth=2; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(L*.5,-2); ctx.lineTo(L*.85,1); ctx.stroke();

  // wrist knuckle + glowing palm core
  ctx.fillStyle='#220404'; ctx.beginPath(); ctx.arc(L,0,12,0,Math.PI*2); ctx.fill();
  ctx.save(); ctx.shadowColor=C.bssCore; ctx.shadowBlur=10;
  ctx.fillStyle=C.bssCore; ctx.beginPath(); ctx.arc(L,0,4.5+(1-open)*2.5,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // four talons — splay when reaching, curl into a fist when holding
  ctx.strokeStyle=bone; ctx.lineWidth=3.2; ctx.lineCap='round'; ctx.lineJoin='round';
  const spread = 0.18 + open*0.62;                 // angular gap between fingers
  const reach  = 17 - (1-open)*4 - squeeze*3;       // how far the fingers extend
  const curl   = 0.5 + (1-open)*1.5 + squeeze*0.4;  // tip curl (clench)
  for(let i=0;i<4;i++){
    const a=(i-1.5)*spread;
    const kx=L+Math.cos(a)*reach*0.6, ky=Math.sin(a)*reach*0.6;
    const fx=L+Math.cos(a)*reach,     fy=Math.sin(a)*reach;
    ctx.beginPath(); ctx.moveTo(L,0); ctx.quadraticCurveTo(kx,ky, fx,fy);
    ctx.lineTo(fx+Math.cos(a+curl)*7, fy+Math.sin(a+curl)*7); ctx.stroke();   // hooked tip
  }
  // opposing thumb
  ctx.beginPath(); ctx.moveTo(L,2); ctx.quadraticCurveTo(L-2,reach*0.7, L+Math.cos(1.7-curl)*reach, Math.sin(1.7-curl)*reach); ctx.stroke();
  ctx.restore();
}

/* ══════════ DRAW — BOSS (demon) ══════════ */
function drawBoss(ctx:CanvasRenderingContext2D,e:Ene,camX:number,camY:number,t:number) {
  const sx=e.x-camX,sy=e.y-camY;
  const ph=e.ph>=1;
  const skin=C.bss, dark=C.bssD, horn='#171019', bone='#c9b89c';
  ctx.save();
  // ── walk cycle: legs stride and the body bounces while the boss moves on the ground ──
  const walking = e.og && Math.abs(e.vx) > 30;
  const stride  = e.ph>=1 ? 15 : 10.5;                            // leg cadence (faster when enraged)
  const bounce  = walking ? Math.abs(Math.sin(t*stride))*-3 : 0;  // body lifts on each step
  const bobY    = Math.sin(t*1.8)*2 + bounce;                     // gentle bob + walk bounce
  ctx.translate(sx+e.w/2, sy+e.h/2 + bobY);                       // (no flip!)

  // ── DEFEAT: slump, shudder, melt into the floor and fade out ──
  const dying = e.st==='dead';
  const dp = dying ? Math.min((e.dyT??0)/BOSS_DEATH_DUR,1) : 0;
  if(dying){
    const tremble=1-dp;
    ctx.translate(Math.sin(t*30)*4*tremble, dp*dp*40);           // shake hard, then sink
    ctx.rotate(dp*0.5 + Math.sin(t*22)*0.04*tremble);            // keels over to one side
    ctx.globalAlpha = dp<0.85 ? 1 : Math.max(0,1-(dp-0.85)/0.15); // dissolve at the very end
  }

  // ── ground shadow (pinned to the floor, so the body reads as standing not floating) ──
  const groundY = e.h/2 - bobY;            // counter the bob → shadow stays on the ground
  ctx.save();
  const shR = e.w*(ph?0.66:0.54);
  const shg = ctx.createRadialGradient(0,groundY,2,0,groundY,shR);
  shg.addColorStop(0,`rgba(${ph?40:0},0,0,${ph?0.55:0.45})`); shg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=shg;
  ctx.beginPath(); ctx.ellipse(0,groundY,shR,8,0,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // ── GRAB ARM (drawn behind the body) ──
  if(e.st==='reach' && e.stT<REACH_TEL){
    // wind-up: aim guide line + claw reared back at the shoulder, charging
    const tp=e.stT/REACH_TEL;
    ctx.save(); ctx.translate(0,-2); ctx.rotate(e.aim);
    ctx.globalAlpha=0.22+0.28*Math.abs(Math.sin(t*22));
    ctx.strokeStyle='#ff7733'; ctx.lineWidth=1.5; ctx.setLineDash([6,8]);
    ctx.beginPath(); ctx.moveTo(24,0); ctx.lineTo(REACH_LEN,0); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
    drawClaw(ctx, e.aim, 12+tp*14, 1, t);                 // open claw cocking back
  } else if(e.st==='reach'){
    drawClaw(ctx, e.aim, extendLen(e.stT-REACH_TEL), 1, t);   // snapping out, open
  } else if(e.st==='grab'){
    const crush = e.stT>GRAB_REEL ? Math.abs(Math.sin((e.stT-GRAB_REEL)*26)) : 0;  // throbbing squeeze
    const L=grabLen(e.stT);
    // strain energy where the fist clamps the player
    ctx.save(); ctx.translate(0,-2); ctx.rotate(e.aim);
    ctx.globalAlpha=0.4+0.3*Math.sin(t*18); ctx.strokeStyle='#ff5522'; ctx.lineWidth=1.4;
    for(let i=0;i<5;i++){ const a=i/5*Math.PI*2+t*4, r=15+crush*5; ctx.beginPath(); ctx.moveTo(L,0); ctx.lineTo(L+Math.cos(a)*r,Math.sin(a)*r); ctx.stroke(); }
    ctx.restore();
    drawClaw(ctx, e.aim, L, 0.12, t, crush);              // clenched fist holding the player
  }

  // ── flaming aura ──
  const auraR=e.h*(ph?0.98:0.72);
  const ag=ctx.createRadialGradient(0,0,8,0,0,auraR);
  ag.addColorStop(0,`rgba(255,${ph?100:55},0,${ph?0.32:0.17})`);
  ag.addColorStop(1,'rgba(255,40,0,0)');
  ctx.fillStyle=ag; ctx.beginPath(); ctx.arc(0,0,auraR,0,Math.PI*2); ctx.fill();

  // ── rising embers ──
  ctx.save();
  for(let i=0;i<11;i++){
    const seed=i*97+13, prog=((t*34+seed)%120)/120;
    const ex=((seed%84)-42)*(0.6+prog*0.4), ey=46-prog*116;
    ctx.globalAlpha=(1-prog)*(ph?0.85:0.5);
    ctx.fillStyle=i%2?'#ff8a1e':'#ffcc55';
    ctx.beginPath(); ctx.arc(ex,ey,1+(i%2),0,Math.PI*2); ctx.fill();
  }
  ctx.restore();

  // ── TAIL (trails behind the body, swishing; spaded molten tip) ──
  ctx.save();
  const tf  = -e.f;                                   // tail sweeps opposite the facing
  const sw  = Math.sin(t*2.2 + (ph?t*1.5:0));         // swish (faster when enraged)
  const tx  = tf*(48+sw*10), ty = 22 + sw*20;
  const cpx = tf*28,          cpy = 46 + sw*12;
  ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.strokeStyle='#1c0305'; ctx.lineWidth=10;        // thick base
  ctx.beginPath(); ctx.moveTo(0,28); ctx.quadraticCurveTo(cpx,cpy, tx,ty); ctx.stroke();
  ctx.strokeStyle=`rgba(255,90,20,${ph?0.7:0.4})`; ctx.lineWidth=2.5;   // molten vein along the spine
  ctx.beginPath(); ctx.moveTo(0,28); ctx.quadraticCurveTo(cpx,cpy, tx,ty); ctx.stroke();
  // spaded tip
  const tang=Math.atan2(ty-cpy, tx-cpx);
  ctx.translate(tx,ty); ctx.rotate(tang);
  ctx.fillStyle=ph?'#ff5522':'#4a0808';
  ctx.beginPath(); ctx.moveTo(-2,-8); ctx.lineTo(15,0); ctx.lineTo(-2,8); ctx.quadraticCurveTo(4,0,-2,-8); ctx.closePath(); ctx.fill();
  ctx.restore();

  // ── WINGS ──
  const flap=Math.sin(t*3)*6 + (ph?Math.sin(t*9)*3:0);
  const wingFn=(s:number)=>{
    const wg=ctx.createLinearGradient(0,-54,0,32);
    wg.addColorStop(0,'#340a12'); wg.addColorStop(1,'#0b0205');
    ctx.fillStyle=wg;
    ctx.beginPath();
    ctx.moveTo(s*22,-26);
    ctx.quadraticCurveTo(s*64,-54-flap, s*88,-22-flap);
    ctx.lineTo(s*62,-20);
    ctx.quadraticCurveTo(s*82,-2, s*60,6);
    ctx.lineTo(s*46,-4);
    ctx.quadraticCurveTo(s*60,18, s*38,22);
    ctx.lineTo(s*28,0);
    ctx.quadraticCurveTo(s*30,28, s*14,30);
    ctx.lineTo(s*16,-12);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#48121c'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(s*20,-22); ctx.lineTo(s*78,-22-flap);
    ctx.moveTo(s*20,-18); ctx.lineTo(s*56,4);
    ctx.moveTo(s*20,-14); ctx.lineTo(s*36,20);
    ctx.stroke();
    ctx.fillStyle=bone;
    ctx.beginPath(); ctx.moveTo(s*86,-22-flap); ctx.lineTo(s*96,-28-flap); ctx.lineTo(s*88,-16-flap); ctx.closePath(); ctx.fill();
  };
  wingFn(-1); wingFn(1);

  // ── LEGS (stride while walking) ──
  const legs:{q:number[][],fx:number,ph:number}[]=[
    {q:[[-17,38],[-3,38],[-7,54],[-21,54]], fx:-14, ph:0},
    {q:[[ 3,38],[17,38],[21,54],[ 7,54]],   fx: 14, ph:Math.PI},
  ];
  for(const lg of legs){
    const cyc=t*stride+lg.ph;
    const swing = walking ? Math.cos(cyc)*6*e.f : 0;          // fore/aft along facing
    const lift  = walking ? -Math.max(0,Math.sin(cyc))*7 : 0; // foot lifts during the swing
    ctx.save(); ctx.translate(swing,lift);
    ctx.fillStyle=dark;
    ctx.beginPath();
    ctx.moveTo(lg.q[0][0],lg.q[0][1]); ctx.lineTo(lg.q[1][0],lg.q[1][1]);
    ctx.lineTo(lg.q[2][0],lg.q[2][1]); ctx.lineTo(lg.q[3][0],lg.q[3][1]);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle=bone; ctx.lineWidth=2.5; ctx.lineCap='round';
    const fx=lg.fx;
    ctx.beginPath();
    ctx.moveTo(fx-5,54); ctx.lineTo(fx-8,60);
    ctx.moveTo(fx,54);   ctx.lineTo(fx,61);
    ctx.moveTo(fx+5,54); ctx.lineTo(fx+8,60);
    ctx.stroke();
    ctx.restore();
  }

  // ── ARMS ──
  ctx.fillStyle=dark;
  ctx.beginPath(); ctx.ellipse(-40,10,12,30,-.18,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 40,10,12,30, .18,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#3a0808'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(-44,2); ctx.lineTo(-40,28); ctx.moveTo(44,2); ctx.lineTo(40,28); ctx.stroke();
  ctx.strokeStyle=bone; ctx.lineWidth=2.5; ctx.lineCap='round';
  for(let i=0;i<3;i++){ const o=(i-1)*6;
    ctx.beginPath(); ctx.moveTo(-40+o,36); ctx.lineTo(-42+o,50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 40+o,36); ctx.lineTo( 38+o,50); ctx.stroke();
  }

  // ── TORSO ──
  const tg=ctx.createLinearGradient(-30,-38,30,46);
  tg.addColorStop(0,'#530e0e'); tg.addColorStop(.5,skin); tg.addColorStop(1,dark);
  ctx.fillStyle=tg;
  ctx.beginPath();
  ctx.moveTo(-32,-26);
  ctx.quadraticCurveTo(-48,-16,-36,8);
  ctx.quadraticCurveTo(-30,34,-16,46);
  ctx.lineTo(16,46);
  ctx.quadraticCurveTo(30,34,36,8);
  ctx.quadraticCurveTo(48,-16,32,-26);
  ctx.quadraticCurveTo(0,-38,-32,-26);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(180,60,60,.5)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(-30,-25); ctx.quadraticCurveTo(0,-36,30,-25); ctx.stroke();
  ctx.strokeStyle=dark; ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(0,-22); ctx.lineTo(0,40);
  ctx.moveTo(-22,-8); ctx.quadraticCurveTo(0,2,22,-8);
  ctx.moveTo(-16,16); ctx.lineTo(16,16);
  ctx.moveTo(-14,28); ctx.lineTo(14,28);
  ctx.stroke();

  // ── lava cracks ──
  const flick=0.55+Math.sin(t*8)*0.35;
  ctx.save();
  ctx.shadowColor=C.bssCore; ctx.shadowBlur=8;
  ctx.strokeStyle=`rgba(255,${ph?150:95},25,${(ph?0.95:0.65)*flick})`;
  ctx.lineWidth=1.6; ctx.lineJoin='round';
  ctx.beginPath();
  ctx.moveTo(-9,16); ctx.lineTo(-17,24); ctx.lineTo(-12,34); ctx.lineTo(-19,42);
  ctx.moveTo(9,14);  ctx.lineTo(16,22);  ctx.lineTo(11,32);  ctx.lineTo(18,40);
  ctx.moveTo(-2,22); ctx.lineTo(-6,32);  ctx.lineTo(-1,42);
  ctx.stroke();
  ctx.restore();

  // ── shoulder spikes ──
  ctx.fillStyle=horn;
  for(const s of [-1,1]){
    ctx.beginPath(); ctx.moveTo(s*30,-22); ctx.lineTo(s*41,-19); ctx.lineTo(s*35,-42); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s*23,-20); ctx.lineTo(s*32,-17); ctx.lineTo(s*28,-35); ctx.closePath(); ctx.fill();
  }

  // ── molten core ──
  const pulse=.8+Math.sin(t*3)*.2;
  const charging = e.st==='laser' && e.stT<LASER_CHG;
  const coreScale = charging ? 1+(e.stT/LASER_CHG)*0.7 : 1;   // swells while charging the laser
  ctx.save();
  ctx.shadowColor=C.bssCore; ctx.shadowBlur=(ph?36:25)*pulse*(charging?1.6:1);
  const cg=ctx.createRadialGradient(0,4,2,0,4,17*coreScale);
  cg.addColorStop(0,'#fff1c8'); cg.addColorStop(.4,'#ffd060'); cg.addColorStop(.75,C.bssCore); cg.addColorStop(1,skin);
  ctx.fillStyle=cg;
  ctx.beginPath(); ctx.arc(0,4,13*pulse*coreScale,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=`rgba(255,240,200,${0.5*flick})`;
  ctx.beginPath(); ctx.arc(0,4,5*pulse*coreScale,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // ── HEAD ──
  const hg2=ctx.createLinearGradient(0,-60,0,-28);
  hg2.addColorStop(0,'#481010'); hg2.addColorStop(1,dark);
  ctx.fillStyle=hg2;
  ctx.beginPath();
  ctx.moveTo(-17,-28); ctx.lineTo(17,-28);
  ctx.quadraticCurveTo(20,-44,11,-54);
  ctx.quadraticCurveTo(0,-60,-11,-54);
  ctx.quadraticCurveTo(-20,-44,-17,-28);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle=dark;
  ctx.beginPath(); ctx.moveTo(-15,-44); ctx.quadraticCurveTo(0,-50,15,-44);
  ctx.lineTo(15,-40); ctx.quadraticCurveTo(0,-45,-15,-40); ctx.closePath(); ctx.fill();

  // ── HORNS ──
  const hornFn=(s:number)=>{
    const hg=ctx.createLinearGradient(s*8,-50,s*44,-92);
    hg.addColorStop(0,'#0c070e'); hg.addColorStop(.7,horn); hg.addColorStop(1,'#6a5942');
    ctx.fillStyle=hg;
    ctx.beginPath();
    ctx.moveTo(s*8,-50);
    ctx.quadraticCurveTo(s*30,-60, s*44,-92);
    ctx.quadraticCurveTo(s*50,-78, s*40,-66);
    ctx.quadraticCurveTo(s*30,-56, s*17,-50);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#0a060c'; ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.moveTo(s*16,-54); ctx.lineTo(s*24,-58);
    ctx.moveTo(s*22,-60); ctx.lineTo(s*30,-66);
    ctx.moveTo(s*30,-70); ctx.lineTo(s*37,-76);
    ctx.stroke();
  };
  hornFn(-1); hornFn(1);
  ctx.fillStyle=horn;
  for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(s*4,-52); ctx.lineTo(s*11,-54); ctx.lineTo(s*7,-66); ctx.closePath(); ctx.fill(); }

  // ── phase-2 crown of fire flickering across the brow ──
  if(ph){
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for(let i=0;i<6;i++){
      const fx=(i-2.5)*6.5;
      const fh=9+Math.abs(Math.sin(t*9+i*1.7))*11;
      const fg=ctx.createLinearGradient(fx,-50,fx,-50-fh);
      fg.addColorStop(0,'rgba(255,200,60,0.85)'); fg.addColorStop(.5,'rgba(255,90,0,0.5)'); fg.addColorStop(1,'rgba(255,40,0,0)');
      ctx.fillStyle=fg;
      ctx.beginPath(); ctx.moveTo(fx-3.5,-50); ctx.quadraticCurveTo(fx-1,-50-fh*.7, fx,-50-fh);
      ctx.quadraticCurveTo(fx+1,-50-fh*.7, fx+3.5,-50); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // ── FACE ──
  // heavy scowling brow ridge angled down toward the centre (anger)
  ctx.fillStyle=dark;
  ctx.beginPath(); ctx.moveTo(-16,-47); ctx.lineTo(-2,-41); ctx.lineTo(-3,-44); ctx.lineTo(-15,-50); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( 16,-47); ctx.lineTo( 2,-41); ctx.lineTo( 3,-44); ctx.lineTo( 15,-50); ctx.closePath(); ctx.fill();
  // burning eyes (sunk under the brow), with a hot inner pupil
  ctx.save(); ctx.shadowColor=C.bssGl; ctx.shadowBlur=ph?26:16;
  ctx.fillStyle=ph?'#ffdd33':C.bssEye;
  ctx.beginPath(); ctx.moveTo(-14,-42); ctx.lineTo(-4,-38); ctx.lineTo(-13,-35); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo( 14,-42); ctx.lineTo( 4,-38); ctx.lineTo( 13,-35); ctx.closePath(); ctx.fill();
  ctx.shadowBlur=ph?16:9; ctx.fillStyle='#fff6e0';
  ctx.beginPath(); ctx.arc(-9,-38,1.8,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 9,-38,1.8,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.shadowColor=C.bssCore; ctx.shadowBlur=ph?10:5;
  const mg=ctx.createLinearGradient(0,-33,0,-22);
  mg.addColorStop(0,'#070103'); mg.addColorStop(1,ph?'#cc3300':'#3a0a05');
  ctx.fillStyle=mg;
  ctx.beginPath(); ctx.moveTo(-11,-31); ctx.quadraticCurveTo(0,-25,11,-31);
  ctx.quadraticCurveTo(0,-21,-11,-31); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle=bone;
  for(let i=0;i<5;i++){ const fx=-9+i*4.5; ctx.beginPath(); ctx.moveTo(fx,-30.5); ctx.lineTo(fx+2.4,-30.5); ctx.lineTo(fx+1.2,-26); ctx.closePath(); ctx.fill(); }
  for(let i=0;i<4;i++){ const fx=-7+i*4.5; ctx.beginPath(); ctx.moveTo(fx,-23.5); ctx.lineTo(fx+2.2,-23.5); ctx.lineTo(fx+1.1,-27); ctx.closePath(); ctx.fill(); }

  // ── phase 2 energy arcs ──
  if(ph){
    ctx.save(); ctx.globalAlpha=.4+Math.sin(t*7)*.15;
    ctx.strokeStyle='#ff5500'; ctx.lineWidth=1.6;
    for(let i=0;i<7;i++){
      const a=i/7*Math.PI*2+t*2.2, r=e.w*.45+Math.sin(t*5+i)*9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*r*.55,Math.sin(a)*r*.55);
      ctx.lineTo(Math.cos(a+.35)*r,Math.sin(a+.35)*r);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── LASER beam from the core (telegraph + discharge) ──
  if(e.st==='laser'){
    ctx.save(); ctx.translate(0,4); ctx.rotate(e.aim);
    if(e.stT<LASER_CHG){
      const cp=e.stT/LASER_CHG;
      ctx.globalAlpha=0.35+0.45*cp;
      ctx.strokeStyle='#ff5522'; ctx.lineWidth=1+cp*2.5; ctx.setLineDash([7,6]);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(LASER_LEN,0); ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const fp=(e.stT-LASER_CHG)/LASER_FIRE;
      const flickr=0.82+Math.sin(t*45)*0.18;
      const hw=LASER_HW*(1-fp*0.3)*flickr;
      ctx.shadowColor='#ff4400'; ctx.shadowBlur=26;
      const lg=ctx.createLinearGradient(0,-hw,0,hw);
      lg.addColorStop(0,'rgba(255,80,0,0)'); lg.addColorStop(.5,'#ffee88'); lg.addColorStop(1,'rgba(255,80,0,0)');
      ctx.fillStyle=lg; ctx.fillRect(0,-hw,LASER_LEN,hw*2);
      ctx.fillStyle='#ffffff'; ctx.fillRect(0,-hw*0.32,LASER_LEN,hw*0.64);
      ctx.shadowBlur=34; ctx.fillStyle='#ffd27a';
      ctx.beginPath(); ctx.arc(0,0,hw+7,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  // ── DEFEAT climax: white-hot core flare + expanding soul shockwave ──
  if(dying){
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.rotate(-dp*0.5);  // undo body tilt for the blast
    const flare=Math.max(0,1-Math.abs(dp-0.78)/0.22);       // peaks at the detonation beat
    if(flare>0){
      const fr=40+flare*260;
      const fg=ctx.createRadialGradient(0,0,2,0,0,fr);
      fg.addColorStop(0,`rgba(255,250,235,${0.9*flare})`);
      fg.addColorStop(.4,`rgba(255,170,60,${0.6*flare})`);
      fg.addColorStop(1,'rgba(255,60,0,0)');
      ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(0,0,fr,0,Math.PI*2); ctx.fill();
    }
    if(dp>0.78){                                            // ring races outward after the blast
      const rp=(dp-0.78)/0.22, rr=rp*340;
      ctx.globalAlpha=Math.max(0,1-rp);
      ctx.strokeStyle='#ffe7b0'; ctx.lineWidth=6*(1-rp)+1;
      ctx.beginPath(); ctx.arc(0,0,rr,0,Math.PI*2); ctx.stroke();
      ctx.strokeStyle=C.soulG; ctx.lineWidth=3*(1-rp)+1;
      ctx.beginPath(); ctx.arc(0,0,rr*0.72,0,Math.PI*2); ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

/* ══════════ DRAW — PROJECTILE ══════════ */
function drawProj(ctx:CanvasRenderingContext2D,pr:Proj,camX:number,camY:number) {
  const sx=pr.x-camX,sy=pr.y-camY;
  ctx.save();
  ctx.shadowColor=C.prjG; ctx.shadowBlur=10;
  const g=ctx.createRadialGradient(sx,sy,0,sx,sy,pr.r);
  g.addColorStop(0,'#ffee88'); g.addColorStop(1,C.prj);
  ctx.fillStyle=g;
  ctx.beginPath(); ctx.arc(sx,sy,pr.r,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

/* ══════════ DRAW — HUD ══════════ */
function drawHUD(ctx:CanvasRenderingContext2D,gs:GS) {
  const p=gs.plr;
  // HP bar
  const barW=180,barH=14;
  ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(16,16,barW+4,barH+4);
  ctx.fillStyle=C.hpBg; ctx.fillRect(18,18,barW,barH);
  const hpPct=p.hp/p.mhp;
  const hpCol=hpPct>.5?C.hpG:hpPct>.25?C.hpY:C.hpR;
  ctx.fillStyle=hpCol; ctx.fillRect(18,18,barW*hpPct,barH);
  ctx.strokeStyle='#333355'; ctx.lineWidth=1; ctx.strokeRect(18,18,barW,barH);
  ctx.fillStyle='#aabbff'; ctx.font='bold 11px monospace';
  ctx.fillText(`HP  ${p.hp}/${p.mhp}`,22,29);

  // Souls
  ctx.save(); ctx.shadowColor=C.soulG; ctx.shadowBlur=6;
  ctx.fillStyle=C.soul; ctx.font='bold 13px monospace';
  ctx.fillText(`SOULS  ${p.souls}`,18,52);
  ctx.restore();

  ctx.save();
  ctx.shadowColor=C.soulG; ctx.shadowBlur=p.potions.length>0?8:0;
  ctx.fillStyle=p.potions.length>0?C.soulG:'rgba(120,140,160,.55)';
  ctx.font='bold 12px monospace';
  ctx.fillText(`POTIONS  ${p.potions.length}   H=USE`,18,92);
  ctx.restore();

  // Abilities
  let ax=18;
  if(p.hDash){
    ctx.fillStyle=p.cd?'rgba(80,120,255,.5)':'rgba(80,120,255,.9)';
    ctx.fillRect(ax,60,32,14);
    ctx.fillStyle='#ccdeff'; ctx.font='bold 10px monospace'; ctx.fillText('DASH',ax+3,72); ax+=40;
  }
  if(p.hWJ){
    ctx.fillStyle='rgba(80,200,180,.85)';
    ctx.fillRect(ax,60,36,14);
    ctx.fillStyle='#ccffee'; ctx.font='bold 10px monospace'; ctx.fillText('WALLJP',ax+2,72); ax+=44;
  }
  if(p.hShield){
    const ready=p.sh>=1;
    ctx.fillStyle=p.blk?'rgba(100,204,255,.95)':ready?'rgba(60,110,160,.85)':'rgba(60,70,90,.7)';
    ctx.fillRect(ax,60,40,14);
    ctx.fillStyle=ready?'#eaf6ff':'#8a93a8'; ctx.font='bold 10px monospace'; ctx.fillText('SHIELD',ax+3,72);
    // recharge bar beneath the chip — amber while cooling down, blue when ready
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(ax,76,40,4);
    ctx.fillStyle=ready?C.shield:'#cc8822'; ctx.fillRect(ax,76,40*p.sh,4);
  }

  // Floor indicator
  ctx.fillStyle='rgba(180,200,255,.4)'; ctx.font='10px monospace';
  ctx.fillText('L-CLICK=ATTACK  K=DASH  Q=DODGE  H=POTION  R-CLICK=SHIELD',VW*.5-180,VH-12);

  // Boss bar
  if(gs.bbar){
    const boss=gs.ens.find(e=>e.k==='boss');
    if(boss && boss.hp>0){
      const bw=380,bh=18,bx=(VW-bw)/2,by=VH-36;
      ctx.fillStyle='rgba(0,0,0,.7)'; ctx.fillRect(bx-2,by-2,bw+4,bh+4);
      ctx.fillStyle='#1a0404'; ctx.fillRect(bx,by,bw,bh);
      const pct=boss.hp/boss.mhp;
      ctx.fillStyle=pct>.5?'#cc2200':'#ff6600';
      ctx.fillRect(bx,by,bw*pct,bh);
      ctx.strokeStyle='#550000'; ctx.lineWidth=1; ctx.strokeRect(bx,by,bw,bh);
      ctx.fillStyle='#ffaaaa'; ctx.font='bold 12px monospace';
      ctx.textAlign='center';
      ctx.fillText(`THE VOID SOVEREIGN   ${boss.hp} / ${boss.mhp}`,VW/2,by+13);
      ctx.textAlign='left';
    }
  }
}

/* ══════════ PHYSICS ══════════ */
function moveX(e:{x:number;vx:number;w:number;h:number;y:number;ow?:0|1|-1},
               plats:Plat[], dt:number) {
  const prevX=e.x;          // position before this frame's horizontal step
  e.x+=e.vx*dt;
  if(e.ow!==undefined) e.ow=0;
  for(const pl of plats){
    if(!overlap(e.x,e.y,e.w,e.h,pl.x,pl.y,pl.w,pl.h)) continue;
    // Only resolve as a SIDE hit if the entity actually entered from the side this frame —
    // i.e. it did NOT already span the platform horizontally before moving. If it did
    // (resting on top, pressed under, or riding a moving platform), the overlap is vertical
    // and must be left to moveY — otherwise the entity gets shoved sideways, or moveY then
    // snaps it onto the platform top (the "teleport up / stuck in the wall" bug).
    const hadXOverlap = prevX < pl.x+pl.w && prevX+e.w > pl.x;
    if(hadXOverlap) continue;
    if(e.vx>0){ e.x=pl.x-e.w; if(e.ow!==undefined) e.ow=1; }
    else       { e.x=pl.x+pl.w; if(e.ow!==undefined) e.ow=-1; }
    e.vx=0;
  }
}
function moveY(e:{y:number;vy:number;w:number;h:number;x:number;og?:boolean}, plats:Plat[], dt:number){
  e.y+=e.vy*dt;
  if(e.og!==undefined) e.og=false;
  for(const pl of plats){
    if(!overlap(e.x,e.y,e.w,e.h,pl.x,pl.y,pl.w,pl.h)) continue;
    if(e.vy>0){ e.y=pl.y-e.h; if(e.og!==undefined) e.og=true; e.vy=0; }
    else       { e.y=pl.y+pl.h; e.vy=0; }
  }
  if(e.y>VH+200) e.y=VH+200; // fell off
}

// Is there walkable ground just ahead of a ground enemy's feet? Used so enemies recognise
// pits (whose floors are lined with spikes) and refuse to step off into them.
function groundAhead(e:Ene, dir:1|-1, plats:Plat[]): boolean {
  const probeX = dir>0 ? e.x+e.w+4 : e.x-4;   // just past the leading edge
  const feetY  = e.y+e.h;
  for(const pl of plats){
    if(isCeil(pl)) continue;                   // ceilings aren't floor
    if(probeX>=pl.x && probeX<=pl.x+pl.w && pl.y>=feetY-6 && pl.y<=feetY+24) return true;
  }
  return false;                                // nothing under the next step → a spike pit
}

// Is the player hanging over an actual spike pit (vs. solid ground)? True when no floor
// platform sits between their feet and the spike tips — used to gate the spike-pogo so a
// down-slash on normal ground never launches you.
function overSpikePit(x:number, w:number, feetY:number, plats:Plat[]): boolean {
  const cx=x+w/2;
  for(const pl of plats){
    if(isCeil(pl)) continue;
    if(cx>=pl.x && cx<=pl.x+pl.w && pl.y>=feetY-6 && pl.y<SPIKE_TOP) return false; // floor here → not a pit
  }
  return true;
}

/* ══════════ UPDATE — PLAYER ══════════ */
function updatePlayer(gs:GS, keys:Record<string,boolean>, dt:number) {
  const p=gs.plr;
  if(p.st==='dead') return;

  // snatched: the claw owns the body this frame — drop all input/movement
  if(p.grb){
    if(p.it>0) p.it-=dt;
    p.blk=false; p.da=false; p.dod=false; p.vx=0; p.vy=0;
    return;
  }

  gs.t+=dt;
  if(p.it>0) p.it-=dt;
  if(p.ac>0) p.ac-=dt;
  if(p.at>0){ p.at-=dt; if(p.at<=0 && p.st==='atk') p.st='idle'; }
  p.aT+=dt;

  // free passive HP regeneration — ticks up while not actively being hit
  if(p.hp>0 && p.hp<p.mhp && p.it<=0 && p.st!=='hurt'){
    p.rg+=REGEN*dt;
    if(p.rg>=1){ const add=Math.floor(p.rg); p.hp=Math.min(p.mhp,p.hp+add); p.rg-=add; }
  }

  const L=keys['a']||keys['ArrowLeft'], R=keys['d']||keys['ArrowRight'];
  const jumpKey=keys[' ']||keys['w']||keys['ArrowUp'];
  const downKey=keys['s']||keys['ArrowDown'];   // crouch-aim: turns an attack into a down-slash
  const dashKey=keys['Shift']||keys['e']||keys['k'];
  const dodgeKey=keys['q']||keys['f'];   // dedicated dodge roll
  const atkKey=keys['attack'];   // left mouse button (see the mouse listener in the component)
  const blkKey=keys['block'];    // right mouse button (see the mouse listener in the component)

  // Shield — hold to block ANY one attack fully; after a block it must recharge for SHIELD_CD.
  // p.sh is the recharge meter: 1 = ready, drops to 0 on a block, refills over SHIELD_CD seconds.
  // You stay fully mobile while blocking — walk, jump and attack are all allowed (and it works
  // in the air too), so blocking is an overlay, not a rooted stance.
  if(p.sh<1) p.sh=Math.min(1, p.sh + dt/SHIELD_CD);
  p.blk = !!(p.hShield && blkKey && p.sh>=1 && !p.da);   // can only raise when fully charged

  // Dashing
  if(p.da){
    p.dt-=dt;
    p.vx=p.dd*DSPD; p.vy=0;
    if(p.dt<=0){ p.da=false; p.vx=p.dd*PSPD*.4; }
    spawnPts(gs,p.x+p.w/2,p.y+p.h/2,1,C.part0,1.5,1.5);
  } else if(p.dod){
    // Dodge roll — evasive burst with i-frames; gravity still applies so it works grounded and in air
    p.dodt-=dt;
    p.vy+=GRAV*dt; if(p.vy>920) p.vy=920;
    p.vx=p.dodd*DODGE_SPD;
    if(p.dodt<=0){ p.dod=false; p.vx=p.dodd*PSPD*.3; }
    spawnPts(gs,p.x+p.w/2,p.y+p.h/2,1,C.swordGl,1.4,1.4);
  } else {
    p.vy+=GRAV*dt;
    if(p.vy>920) p.vy=920;

    if(p.st!=='atk' && p.st!=='hurt'){
      if(L){ p.vx=-PSPD; p.f=-1; }
      else if(R){ p.vx= PSPD; p.f=1; }
      else { p.vx*=.78; if(Math.abs(p.vx)<4) p.vx=0; }
    }

    // wall slide
    if(p.ow!==0 && !p.og && p.vy>0){ p.vy=Math.min(p.vy,90); p.st='wall'; }

    // jump
    if(jumpKey && !p.jh){
      p.jh=true;
      if(p.og){ p.vy=JV; p.jl=p.mj-1; p.cd=false; sfx.play('jump'); }
      else if(p.hWJ && p.ow!==0){
        p.vy=JV*.88; p.vx=-p.ow*PSPD*1.3; p.f=(-p.ow) as 1|-1;
        p.cd=false; spawnPts(gs,p.x+p.w/2,p.y+p.h/2,8,C.part0,3); sfx.play('walljump');
      } else if(p.jl>0){
        p.vy=DJV; p.jl--;
        spawnPts(gs,p.x+p.w/2,p.y+p.h/2,6,C.part0,2.5); sfx.play('djump');
      }
    }
    if(!jumpKey) p.jh=false;

    // dash
    if(dashKey && !p.dh && p.hDash && !p.cd && !p.blk){
      p.dh=true; p.da=true; p.dt=DDUR; p.dd=p.f; p.cd=true;
      p.st='dash'; p.it=Math.max(p.it,DDUR+0.05); // i-frames during dash
      spawnPts(gs,p.x+p.w/2,p.y+p.h/2,8,C.swordGl,3.5); sfx.play('dash');
    }
    if(!dashKey) p.dh=false;

    // dodge roll — FREE evasive move with long i-frames; rolls the way you hold, else a backstep
    if(dodgeKey && !p.dodk && !p.blk){
      p.dodk=true; p.dod=true; p.dodt=DODGE_DUR;
      const dir = (L ? -1 : R ? 1 : -p.f) as 1|-1;   // held direction, otherwise away from facing
      p.dodd=dir; if(L||R) p.f=dir;
      p.st='dodge'; p.it=Math.max(p.it,DODGE_IFRAME);  // generous invulnerability to slip past attacks
      spawnPts(gs,p.x+p.w/2,p.y+p.h/2,9,C.plrGl,3.5); sfx.play('dash');
    }
    if(!dodgeKey) p.dodk=false;

    // hurt state
    if(p.st==='hurt' && p.it<INV*.6) p.st='idle';
  }

  // begin attack swing — holding down (S / ↓) → down-slash; else holding up (W / ↑ / Space) → up-slash
  if(atkKey && p.ac<=0 && p.st!=='atk' && !p.da && !p.dod){
    p.st='atk'; p.at=ADUR; p.ac=ACOOL; p.ahit=[];
    p.adn=downKey; p.aup=jumpKey&&!downKey;   // down takes priority if both are held
    sfx.play('attack');
  }

  // active attack hitbox — stays live for the whole swing, each enemy hit once
  if(p.st==='atk'){
    const reach=56;
    // down-slash hits below, up-slash hits above, otherwise the usual forward arc
    let hbX:number,hbY:number,hbW:number,hbH:number;
    if(p.adn)      { hbX=p.x-12; hbY=p.y+p.h-4;   hbW=p.w+24; hbH=reach+8; }
    else if(p.aup) { hbX=p.x-12; hbY=p.y-reach;   hbW=p.w+24; hbH=reach+8; }
    else           { hbX=(p.f===1?p.x+p.w-4:p.x-reach+4); hbY=p.y-4; hbW=reach; hbH=p.h+8; }
    for(const e of gs.ens){
      if(e.hp<=0 || p.ahit.includes(e.id)) continue;
      if(overlap(hbX,hbY,hbW,hbH,e.x,e.y,e.w,e.h)){
        p.ahit.push(e.id);
        // aimed up/down slashes are critical hits — extra damage and a brighter strike
        const crit=p.aup||p.adn;
        e.hp-=crit?Math.round(p.dmg*CRIT_MULT):p.dmg;
        if(crit){
          spawnPts(gs,e.x+e.w/2,e.y+e.h/2,18,C.prjG,5,3.2);   // gold crit sparks
          spawnFloat(gs,e.x+e.w/2,e.y-6,'CRIT!',C.prjG);       // floating crit marker
          gs.shake=Math.max(gs.shake,.22);
          sfx.play('block');                                   // sharp metallic crit ring
        } else {
          spawnPts(gs,e.x+e.w/2,e.y+e.h/2,10,C.part1,3.5);
        }
        sfx.play(e.k==='boss'?'bosshit':'hit');
        if(e.hp<=0){
          spawnPts(gs,e.x+e.w/2,e.y+e.h/2,18,e.k==='boss'?C.bssGl:C.soul,4,3.5);
          p.souls+=e.k==='boss'?120:e.k==='warden'?90:e.k==='charger'?20:e.k==='sentinel'?16:e.k==='jumper'?14:10;
          sfx.play('enemydeath');
        }
      }
    }
    gs.ens=gs.ens.filter(e=>e.hp>0||e.k==='boss');

    // puzzle props are struck by the same swing
    if(gs.level===2){
      for(const lv of gs.levers){
        if(lv.cd<=0 && overlap(hbX,hbY,hbW,hbH, lv.x-12, lv.y-34, 30, 42)){
          lv.on=!lv.on; lv.cd=0.45; sfx.play('checkpoint');
          spawnPts(gs,lv.x,lv.y-16,8,C.lanternG,2.5);
        }
      }
      for(const cr of gs.crystals){
        if(!cr.lit && overlap(hbX,hbY,hbW,hbH, cr.x-13, cr.y-18, 26, 30)){
          cr.lit=true; sfx.play('hit'); spawnPts(gs,cr.x,cr.y,16,C.soulG,3.5);
        }
      }
      for(const ch of gs.chests){
        if(ch.opened || !overlap(hbX,hbY,hbW,hbH, ch.x-22, ch.y-34, 44, 34)) continue;
        if(gs.flags[ch.flag]){
          ch.opened=true;
          p.potions.push(ch.heal);
          spawnPts(gs,ch.x,ch.y-28,24,C.soulG,4,3.5);
          spawnFloat(gs,ch.x,ch.y-52,`POTION +${ch.heal}`,C.soulG);
          spawnFloat(gs,ch.x,ch.y-72,'STORED',C.tGold);
          gs.shake=Math.max(gs.shake,.12);
          sfx.play('checkpoint');
        } else {
          spawnPts(gs,ch.x,ch.y-24,6,C.tGoldD,2.2,2);
          spawnFloat(gs,ch.x,ch.y-48,'LOCKED',C.tGold);
          sfx.play('block');
        }
      }
    }

  }

  // ── spike pogo ── as long as you HOLD down (S/↓) + attack (left click) while falling over a
  // pit, you keep bouncing off the spikes. Kept OUT of the swing/cooldown timing on purpose:
  // the auto-repeat swing has dead frames, and tying the bounce to them made you stop mid-air
  // even with the keys still held. The death check below runs after movement, so the bounce
  // has already lifted you clear of the tips.
  if(downKey && atkKey && p.vy>0 && p.y+p.h>SPIKE_TOP-60 && overSpikePit(p.x,p.w,p.y+p.h,gs.plats)){
    p.vy=-POGO_VY;
    p.jl=p.mj; p.cd=false;          // refresh air-jumps, like a clean landing
    spawnPts(gs,p.x+p.w/2,SPIKE_TOP,14,C.spikeT,4,3);
    gs.shake=Math.max(gs.shake,.18);
    sfx.play('block');              // sharp metallic clang off the spikes
  }

  // move
  const wasGrounded=p.og, impactVy=p.vy;
  moveX(p,gs.plats,dt);
  moveY(p,gs.plats,dt);

  // carry: if standing on a moving platform, ride its horizontal drift
  if(p.og && gs.movers.length){
    for(const m of gs.movers){
      const mp=m.plat;
      if(p.x+p.w>mp.x+1 && p.x<mp.x+mp.w-1 && Math.abs((p.y+p.h)-mp.y)<=2){ p.x+=m.dx; break; }
    }
  }

  if(p.og){
    if(!wasGrounded && impactVy>260) sfx.play('land');   // landed from a fall
    p.jl=p.mj; p.cd=false;
  }

  // state machine
  if(!p.da && !p.dod && p.st!=='atk' && p.st!=='hurt' && p.st!=='wall'){
    if(!p.og) p.st=p.vy<0?'jump':'fall';
    else p.st=Math.abs(p.vx)>10?'run':'idle';
  }
  // footsteps while running on the ground
  if(p.st==='run') sfx.play('step');

  // checkpoint detection
  for(let i=0;i<gs.cps.length;i++){
    const cp=gs.cps[i];
    if(!cp.on && overlap(p.x,p.y,p.w,p.h,cp.x-10,cp.y-30,32,40)){
      cp.on=true; gs.cpIdx=i;
      p.x=cp.x-p.w/2;       // center on the lantern
      settleOnGround(gs);   // plant firmly so the shop can't leave us mid-fall
      sfx.play('checkpoint');
    }
  }

  // boss activation — seal the arena with a gate once the player commits
  if(!gs.bbar){
    const boss=gs.ens.find(e=>e.k==='boss');
    if(boss && p.x>ARENA_X0 && Math.abs(p.x-boss.x)<1100){
      gs.bbar=true;
      gs.plats.push({x:ARENA_X0-14, y:40, w:30, h:355}); // left gate drops, sealing the fight (full height)
      p.x=ARENA_X0+80;     // teleport to the start of the arena
      settleOnGround(gs);  // plant firmly on the arena floor
      sfx.play('bossintro');
    }
  }

  if(gs.level===2 && !gs.flags.boss2Started && p.x>WARDEN_ARENA_X0+120){
    gs.flags.boss2Started=true;
    const nextId=gs.ens.reduce((m,e)=>Math.max(m,e.id),0)+1;
    gs.ens.push(mkEne(nextId,'warden',WARDEN_SPAWN_X,GR_Y));
    gs.shake=Math.max(gs.shake,.22);
    spawnFloat(gs,WARDEN_SPAWN_X,GR_Y-120,'VAULT WARDEN',C.tGold);
    sfx.play('bossintro');
  }

  // death fall
  // spikes at the bottom of every pit — touching the tips is instant death
  if(p.y+p.h>SPIKE_TOP){
    p.hp=0; p.st='dead';
    spawnPts(gs,p.x+p.w/2,SPIKE_TOP,16,C.part1,5);
    gs.shake=.3; sfx.play('death');
  }

  // step into an active portal → the loop picks this up and switches scenes
  if(gs.portal && !gs.enterPortal &&
     overlap(p.x,p.y,p.w,p.h, gs.portal.x-30, gs.portal.y-60, 60, 110)){
    gs.enterPortal=gs.portal;
    spawnPts(gs,gs.portal.x,gs.portal.y,20,C.soulG,4,3);
  }
}

/* ══════════ UPDATE — ENEMIES ══════════ */
function updateEnemies(gs:GS, dt:number) {
  const p=gs.plr;
  for(const e of gs.ens){
    if(e.hp<=0 && e.k!=='boss') continue;
    e.stT+=dt; e.aT+=dt;

    const dx=p.x+p.w/2-(e.x+e.w/2);
    const dy=p.y+p.h/2-(e.y+e.h/2);
    const dist=Math.sqrt(dx*dx+dy*dy);

    if(e.k==='crawler'){
      e.vy+=GRAV*dt; if(e.vy>800) e.vy=800;
      if(e.st==='patrol'){
        e.vx=e.f*75;
        if(e.stT>2.5+rn(3)){ e.f=(e.f*-1) as 1|-1; e.stT=0; }
        if(dist<280 && Math.abs(dy)<80){ e.st='chase'; sfx.play('growl'); }
      } else if(e.st==='chase'){
        e.vx=(dx>0?1:-1)*110; e.f=(dx>0?1:-1) as 1|-1;
        if(dist>380) e.st='patrol';
      }
      // spike/edge awareness — never step off ground into a pit (its floor is spikes)
      if(e.og && e.vx!==0 && !groundAhead(e, e.vx>0?1:-1, gs.plats)){
        if(e.st==='chase'){ e.vx=0; }                              // stop at the brink, don't dive in
        else { e.f=(e.f*-1) as 1|-1; e.vx=e.f*75; e.stT=0; }       // turn back on patrol
      }
      // melee attack
      if(overlap(e.x,e.y,e.w,e.h,p.x,p.y,p.w,p.h)){ sfx.play('bite'); applyDmgToPlr(gs,12,e.x+e.w/2); }
      moveX(e,gs.plats,dt); moveY(e,gs.plats,dt);
      if(!e.og){ e.f=(e.f*-1) as 1|-1; } // edge reverse

    } else if(e.k==='flyer'){
      const targetY=p.y-40+Math.sin(gs.t*2+e.id)*55;
      e.vy=(targetY-e.y)*3.5;
      if(e.st==='patrol'){
        e.vx=e.f*65;
        if(e.stT>3.5+rn(3)){ e.f=(e.f*-1) as 1|-1; e.stT=0; }
        if(dist<350 && Math.abs(dy)<150){ e.st='dive'; e.stT=0; sfx.play('screech'); }
      } else if(e.st==='dive'){
        e.vx=(dx>0?1:-1)*130; e.f=(dx>0?1:-1) as 1|-1;
        if(e.stT>2||dist>420){ e.st='patrol'; e.stT=0; }
      }
      if(overlap(e.x,e.y,e.w,e.h,p.x,p.y,p.w,p.h)){ sfx.play('peck'); applyDmgToPlr(gs,10,e.x+e.w/2); }
      if(e.st==='dive') sfx.play('flap');   // wingbeat during the dive
      e.x+=e.vx*dt; e.y+=e.vy*dt;
      e.x=clamp(e.x,0,gs.ww-e.w);

    } else if(e.k==='jumper'){
      e.vy+=GRAV*dt; if(e.vy>820) e.vy=820;
      if(e.st==='patrol'){
        e.vx=e.f*50;
        // spike/edge awareness — turn around rather than stroll into a spike pit
        if(e.og && !groundAhead(e, e.f, gs.plats)){ e.f=(e.f*-1) as 1|-1; e.vx=e.f*50; }
        if(dist<300 && e.og){ e.st='jump'; e.stT=0; }
      } else if(e.st==='jump'){
        if(e.og && e.stT>.3){
          e.vy=-520; e.vx=(dx>0?1:-1)*150; e.f=(dx>0?1:-1) as 1|-1; e.stT=0; sfx.play('hop');
        }
        if(e.og && e.stT>.8) e.st='patrol';
        if(dist>500) e.st='patrol';
      }
      if(overlap(e.x,e.y,e.w,e.h,p.x,p.y,p.w,p.h)){ sfx.play('bite'); applyDmgToPlr(gs,16,e.x+e.w/2); }
      moveX(e,gs.plats,dt); moveY(e,gs.plats,dt);

    } else if(e.k==='sentinel'){
      // a rooted temple guardian: sits still, tracks the player, telegraphs, then
      // flooses a tight fan of bolts. Vulnerable up close (it can't move away).
      e.vy+=GRAV*dt; if(e.vy>800) e.vy=800;
      e.vx=0;
      e.f=(dx>0?1:-1) as 1|-1;
      if(e.st==='patrol'){
        if(dist<470 && Math.abs(dy)<240){ e.st='aim'; e.stT=0; sfx.play('lasercharge'); }
      } else if(e.st==='aim'){
        e.aim=Math.atan2(dy,dx);                       // track during the wind-up
        if(e.stT>0.75){
          const base=Math.atan2((p.y+p.h/2)-(e.y+e.h/2),(p.x+p.w/2)-(e.x+e.w/2));
          for(let i=0;i<3;i++){ const a=base+(i-1)*0.22;
            gs.prjs.push({x:e.x+e.w/2,y:e.y+e.h*0.34,vx:Math.cos(a)*330,vy:Math.sin(a)*330,r:7,life:2.6,foe:true}); }
          sfx.play('projectile');
          e.st='cool'; e.stT=0;
        }
      } else if(e.st==='cool'){
        if(e.stT>1.3) e.st='patrol';
        if(dist>600) e.st='patrol';
      }
      if(overlap(e.x,e.y,e.w,e.h,p.x,p.y,p.w,p.h)){ sfx.play('peck'); applyDmgToPlr(gs,12,e.x+e.w/2); }
      moveY(e,gs.plats,dt);

    } else if(e.k==='charger'){
      // an armored brute: paces, then lowers its horns and rushes the player at speed,
      // overshooting before it can recover. Stops dead at pits and walls.
      e.vy+=GRAV*dt; if(e.vy>820) e.vy=820;
      if(e.st==='patrol'){
        e.vx=e.f*60;
        if(e.og && !groundAhead(e, e.f, gs.plats)){ e.f=(e.f*-1) as 1|-1; e.vx=e.f*60; }
        if(dist<380 && Math.abs(dy)<76 && e.og){ e.st='wind'; e.stT=0; e.vx=0; sfx.play('growl'); }
      } else if(e.st==='wind'){
        e.vx=0;
        if(e.stT>0.5){ e.f=(dx>0?1:-1) as 1|-1; e.st='charge'; e.stT=0; sfx.play('bosslaunch'); }
      } else if(e.st==='charge'){
        e.vx=e.f*360;
        // bail out of the rush at a brink or once it has run its course (a wall just stalls it)
        const brink = e.og && !groundAhead(e, e.f, gs.plats);
        if(brink || e.stT>1.1){ e.st='recover'; e.stT=0; e.vx=0; if(brink) gs.shake=Math.max(gs.shake,.1); }
      } else if(e.st==='recover'){
        e.vx*=.82;
        if(e.stT>0.8) e.st='patrol';
      }
      const charging = e.st==='charge';
      if(overlap(e.x,e.y,e.w,e.h,p.x,p.y,p.w,p.h)){ sfx.play('slam'); applyDmgToPlr(gs, charging?22:14, e.x+e.w/2); }
      moveX(e,gs.plats,dt); moveY(e,gs.plats,dt);

    } else if(e.k==='warden'){
      e.vy+=GRAV*dt; if(e.vy>840) e.vy=840;
      const wasPh=e.ph;
      e.ph=e.hp<e.mhp*.5 ? 1 : 0;
      if(e.ph && !wasPh){
        e.st='phase'; e.stT=0; e.vx=0; e.af=0;
        gs.shake=Math.max(gs.shake,.72);
        spawnPts(gs,e.x+e.w/2,e.y+e.h/2,62,C.ember,9,5);
        spawnFloat(gs,e.x+e.w/2,e.y-30,'PHASE II',C.ember);
        sfx.play('bossroar');
      }
      e.f=(dx>0?1:-1) as 1|-1;
      if(e.st==='patrol'){
        e.vx=e.f*(e.ph?72:54);
        if(e.og && !groundAhead(e,e.f,gs.plats)) e.vx=0;
        if(dist<(e.ph?660:520) && Math.abs(dy)<160){ e.st='guard'; e.stT=0; sfx.play('bossintro'); }
      } else if(e.st==='phase'){
        e.vx=0;
        if(e.stT>0.36 && e.stT-dt<=0.36){
          for(let i=0;i<16;i++){
            const a=i*Math.PI/8;
            gs.prjs.push({x:e.x+e.w/2,y:e.y+e.h*0.42,vx:Math.cos(a)*280,vy:Math.sin(a)*280,r:8,life:2.2,foe:true});
          }
          for(const dir of [-1,1]){
            gs.prjs.push({x:e.x+e.w/2+dir*22,y:e.y+e.h-20,vx:dir*420,vy:-70,r:9,life:2.2,foe:true});
          }
          sfx.play('projectile');
        }
        if(e.stT>0.95){ e.st='guard'; e.stT=0; }
      } else if(e.st==='guard'){
        e.vx=(dx>0?1:-1)*(e.ph?130:72);
        if(e.og && !groundAhead(e,e.f,gs.plats)) e.vx=0;
        if(e.stT>(e.ph?0.48:1.05)){
          e.af++;
          e.st=e.ph ? (e.af%4===0?'slam':'cast') : e.af%2===0?'cast':'slam';
          e.stT=0; e.vx=0;
          sfx.play(e.st==='cast'?'lasercharge':'bosslaunch');
        }
      } else if(e.st==='slam'){
        e.vx=0;
        const slamT=e.ph?0.34:0.55;
        if(e.stT>slamT && e.stT-dt<=slamT){
          gs.shake=Math.max(gs.shake,e.ph ? .68 : .32);
          spawnPts(gs,e.x+e.w/2,e.y+e.h,e.ph?54:26,e.ph?C.ember:C.tGold,e.ph?9:5,4.2);
          sfx.play('slam');
          if(Math.abs(dx)<(e.ph?165:96) && Math.abs((p.y+p.h)-(e.y+e.h))<42) applyDmgToPlr(gs,e.ph?42:26,e.x+e.w/2);
          for(const dir of [-1,1]){
            gs.prjs.push({x:e.x+e.w/2+dir*34,y:e.y+e.h-18,vx:dir*(e.ph?450:260),vy:-35,r:e.ph?10:8,life:e.ph?2.35:1.7,foe:true});
          }
          if(e.ph){
            for(const dir of [-1,1]){
              gs.prjs.push({x:e.x+e.w/2+dir*18,y:e.y+e.h-42,vx:dir*340,vy:-260,r:8,life:2.0,foe:true});
              gs.prjs.push({x:e.x+e.w/2+dir*50,y:e.y+e.h-30,vx:dir*300,vy:-135,r:7,life:2.0,foe:true});
            }
          }
        }
        if(e.stT>(e.ph?0.58:0.95)){ e.st='recover'; e.stT=0; }
      } else if(e.st==='cast'){
        e.vx=0;
        const castT=e.ph?0.32:0.7;
        if(e.stT>castT && e.stT-dt<=castT){
          const base=Math.atan2(dy,dx);
          const count=e.ph?9:5;
          const mid=(count-1)/2;
          for(let i=0;i<count;i++){
            const a=base+(i-mid)*(e.ph?0.13:0.18);
            const spd=e.ph?430:300;
            gs.prjs.push({x:e.x+e.w/2,y:e.y+e.h*0.34,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,r:e.ph?9:7,life:e.ph?2.25:2.4,foe:true});
          }
          if(e.ph){
            for(const dir of [-1,1]){
              gs.prjs.push({x:e.x+e.w/2+dir*26,y:e.y+e.h*0.55,vx:dir*210,vy:-310,r:8,life:2.1,foe:true});
            }
          }
          sfx.play('projectile');
        }
        if(e.stT>(e.ph?0.62:1.05)){ e.st='recover'; e.stT=0; }
      } else if(e.st==='recover'){
        e.vx*=.82;
        if(e.stT>(e.ph?0.16:0.45)) { e.st='guard'; e.stT=0; }
      }
      if(overlap(e.x,e.y,e.w,e.h,p.x,p.y,p.w,p.h)){ sfx.play('bossattack'); applyDmgToPlr(gs,e.ph?32:20,e.x+e.w/2); }
      moveX(e,gs.plats,dt); moveY(e,gs.plats,dt);
      e.x=clamp(e.x,WARDEN_ARENA_X0+20,WARDEN_ARENA_X1-20-e.w);

    } else if(e.k==='boss'){
      if(e.hp<=0){
        // ── DEFEAT SEQUENCE — staggers, erupts, then a climactic burst before fading ──
        const first = e.dyT===undefined;
        if(first){ e.dyT=0; e.st='dead'; e.stT=0; e.vx=0; sfx.play('bossroar'); gs.shake=Math.max(gs.shake,.4); }
        const prev=e.dyT!; e.dyT=prev+dt;
        const dp=Math.min(e.dyT/BOSS_DEATH_DUR,1);
        // keep the corpse planted on the arena floor
        e.vy+=GRAV*dt; if(e.vy>900) e.vy=900; moveY(e,gs.plats,dt);
        const cx2=e.x+e.w/2, cy2=e.y+e.h/2;
        if(e.dyT<BOSS_DEATH_DUR){            // only emit while the sequence is still playing
          // continuous, intensifying eruption of embers + soul wisps from the body
          const ecol=Math.floor(e.dyT*10)%2?C.bssGl:'#ffcc55';
          spawnPts(gs,cx2+rf(-e.w/3,e.w/3),cy2+rf(-e.h/3,e.h/3),2+Math.floor(dp*4),ecol,3+dp*4,3+dp*2);
          // periodic rupture bursts with a little shake as it comes apart
          if(Math.floor(prev*4)!==Math.floor(e.dyT*4)){
            spawnPts(gs,cx2+rf(-e.w/2,e.w/2),cy2+rf(-e.h/2,e.h/2),10,C.bssGl,6,4);
            gs.shake=Math.max(gs.shake,.18+dp*0.2);
          }
        }
        // the climax — one giant white-hot soul detonation, fired once
        if(prev<BOSS_DEATH_DUR*0.78 && e.dyT>=BOSS_DEATH_DUR*0.78){
          spawnPts(gs,cx2,cy2,64,'#fff1c8',9,5);
          spawnPts(gs,cx2,cy2,48,C.bssGl,11,5);
          spawnPts(gs,cx2,cy2,40,C.soul,7,4);
          gs.shake=Math.max(gs.shake,.9); sfx.play('win');
        }
        continue;
      }
      const wasPh=e.ph;
      e.ph = e.hp < e.mhp*.5 ? 1 : 0;
      if(e.ph && !wasPh) sfx.play('bossroar');   // enrage into phase 2
      e.vy+=GRAV*dt; if(e.vy>900) e.vy=900;

      if(e.st==='patrol'){
        e.vx=e.f*(e.ph?130:85);
        if(e.stT>1.8+rn(2)){ e.f=(e.f*-1) as 1|-1; e.stT=0; }
        if(dist<550){ e.st='chase'; e.stT=0; }
      } else if(e.st==='chase'){
        e.vx=(dx>0?1:-1)*(e.ph?165:115); e.f=(dx>0?1:-1) as 1|-1;
        if(e.stT>1.2 && e.og){ e.st='slam'; e.stT=0; e.vy=-580; sfx.play('bosslaunch'); }
        if(dist>700){ e.st='patrol'; e.stT=0; }
      } else if(e.st==='slam'){
        if(e.og && e.stT>.4){
          gs.shake=.25;
          spawnPts(gs,e.x+e.w/2,e.y+e.h,20,C.part2,5);
          e.st='cooldown'; e.stT=0; e.vx=0; sfx.play('slam');
        }
      } else if(e.st==='cooldown'){
        e.vx*=.8;
        if(e.stT>.7){
          e.af++;
          e.aim=Math.atan2(dy,dx);
          e.f=(dx>0?1:-1) as 1|-1;
          const choice=e.af%3;
          if(choice===0){ e.st='laser'; e.stT=0; sfx.play('lasercharge'); }    // core laser
          else if(choice===1 && dist<REACH_LEN+130){ e.st='reach'; e.stT=0; }  // arm grab
          else {
            if(e.ph){ // phase-2 projectile fan when resuming the chase
              for(let i=0;i<5;i++){ const a=-Math.PI/2+(i-2)*.38;
                gs.prjs.push({x:e.x+e.w/2,y:e.y+e.h/2,vx:Math.cos(a)*340,vy:Math.sin(a)*340,r:8,life:2,foe:true}); }
              sfx.play('projectile');
            }
            e.st='chase'; e.stT=0;
          }
        }
      } else if(e.st==='laser'){
        // fires a beam from the core: telegraph (tracks player), then a locked beam
        e.vx=0;
        const ox=e.x+e.w/2, oy=e.y+e.h/2;
        if(e.stT<LASER_CHG){
          e.aim=Math.atan2((p.y+p.h/2)-oy,(p.x+p.w/2)-ox);   // track during charge
          e.f=(Math.cos(e.aim)>=0?1:-1) as 1|-1;
        } else if(e.stT<LASER_CHG+LASER_FIRE){
          if(e.stT-dt<LASER_CHG) sfx.play('laserfire');       // fire onset (once)
          const px=p.x+p.w/2, py=p.y+p.h/2;
          const ax=Math.cos(e.aim), ay=Math.sin(e.aim);
          const along=(px-ox)*ax+(py-oy)*ay;                  // distance along the beam
          if(along>0 && along<LASER_LEN){
            const perp=Math.abs((px-ox)*(-ay)+(py-oy)*ax);    // distance off the beam axis
            if(perp<LASER_HW+p.w/2) applyDmgToPlr(gs,20,ox);
          }
          gs.shake=Math.max(gs.shake,.12);
        } else { e.st='cooldown'; e.stT=0; e.aT=0; }
      } else if(e.st==='reach'){
        // GRAB — wind up, snap a clawed arm out; if it catches the player, latch on
        e.vx=0;
        const ox=e.x+e.w/2, oy=e.y+e.h/2-2;
        if(e.stT<REACH_TEL){
          e.aim=Math.atan2(dy,dx);                 // track the target during the wind-up
          e.f=(Math.cos(e.aim)>=0?1:-1) as 1|-1;
        } else {
          const ext=e.stT-REACH_TEL;
          const L=extendLen(ext);
          const hx=ox+Math.cos(e.aim)*L, hy=oy+Math.sin(e.aim)*L;
          const open = ext < REACH_EXT+REACH_HOLD;  // claw can only catch while reaching/held
          if(open && p.it<=0 && !p.da && overlap(hx-17,hy-17,34,34,p.x,p.y,p.w,p.h)){
            if(p.blk && p.sh>=1){
              // a charged shield bashes the claw away — no grab, shield goes on cooldown
              p.sh=0; p.it=0.3; gs.shake=Math.max(gs.shake,.15);
              spawnPts(gs,p.x+p.w/2,p.y+p.h*.45,12,C.shield,3.5); sfx.play('block');
              e.st='cooldown'; e.stT=0;
            } else {
              e.st='grab'; e.stT=0; p.grb=true; p.blk=false; p.da=false;
              gs.shake=Math.max(gs.shake,.18); sfx.play('bossattack');
            }
          } else if(ext>REACH_EXT+REACH_HOLD+REACH_RET){
            e.st='cooldown'; e.stT=0;                // whiffed — empty fist retracts
          }
        }
      } else if(e.st==='grab'){
        // CAUGHT — reel the player to the chest, crush, then hurl them away
        e.vx=0;
        const ox=e.x+e.w/2, oy=e.y+e.h/2-2;
        const L=grabLen(e.stT);
        const hx=ox+Math.cos(e.aim)*L, hy=oy+Math.sin(e.aim)*L;
        p.x=hx-p.w/2; p.y=hy-p.h/2; p.vx=0; p.vy=0;
        if(p.st!=='dead') p.st='hurt';
        spawnPts(gs,hx,hy,1,C.bssGl,2.5,2);                 // the player thrashes — embers
        if(e.stT-dt<GRAB_REEL && e.stT>=GRAB_REEL){          // the instant the fist closes: crush
          p.hp=Math.max(0,p.hp-GRAB_CRUSH_DMG);
          spawnPts(gs,hx,hy,14,C.part1,4); gs.shake=Math.max(gs.shake,.26); sfx.play('bosshit');
          if(p.hp<=0){ p.st='dead'; sfx.play('death'); }
        }
        if(e.stT>GRAB_REEL) gs.shake=Math.max(gs.shake,.12);
        if(e.stT>GRAB_REEL+GRAB_CRUSH){                      // THROW
          p.grb=false;
          const dir=(Math.cos(e.aim)>=0?-1:1) as 1|-1;       // hurl back the way the arm came
          applyDmgToPlr(gs,GRAB_THROW_DMG,e.x+e.w/2);
          p.vx=dir*440; p.vy=-300; p.it=INV; p.f=dir;
          if(p.hp>0) p.st='hurt';
          gs.shake=Math.max(gs.shake,.34); sfx.play('bosslaunch');
          e.st='cooldown'; e.stT=0;
        }
      }
      if(!p.grb && overlap(e.x,e.y,e.w,e.h,p.x,p.y,p.w,p.h)){ sfx.play('bossattack'); applyDmgToPlr(gs,22,e.x+e.w/2); }

      // ── boss physics: the arena is a flat box to the boss ──
      // It collides ONLY with the floor and the two side walls. The thin player ledges,
      // the high perch and the hanging ceiling decor are ignored — otherwise a slam can
      // pop the boss onto a ledge above the camera (it "disappears") or wedge it mid-arena.
      e.x += e.vx*dt;
      e.y += e.vy*dt;
      e.og = false;
      if(e.y+e.h >= ARENA_FLOOR_Y){ e.y=ARENA_FLOOR_Y-e.h; e.vy=0; e.og=true; }   // land on the floor
      else if(e.y < 50){ e.y=50; if(e.vy<0) e.vy=0; }                              // soft ceiling — never leaves the top of view
      // hard containment — boss can NEVER leave the arena, whatever the physics do
      const lo=ARENA_X0+24, hi=ARENA_X1-56-e.w;   // stay inside the left gate / right wall
      if(e.x<lo){ e.x=lo; if(e.vx<0) e.vx=0; }
      if(e.x>hi){ e.x=hi; if(e.vx>0) e.vx=0; }
      if(e.og && Math.abs(e.vx)>30) sfx.play('bossstep');   // heavy stomping while walking
    }

    // spikes kill enemies too (boss is contained to its arena, so it's exempt)
    if(e.k!=='boss' && e.hp>0 && e.y+e.h>SPIKE_TOP){
      e.hp=0;
      spawnPts(gs,e.x+e.w/2,SPIKE_TOP,12,C.part1,4);
      sfx.play('enemydeath');
    }
  }
}

/* ══════════ UPDATE — PROJECTILES + PARTICLES ══════════ */
function updateProjs(gs:GS, dt:number){
  const p=gs.plr;
  gs.prjs=gs.prjs.filter(pr=>{
    pr.x+=pr.vx*dt; pr.y+=pr.vy*dt; pr.life-=dt;
    if(pr.foe && overlap(pr.x-pr.r,pr.y-pr.r,pr.r*2,pr.r*2,p.x,p.y,p.w,p.h)){
      applyDmgToPlr(gs,18,pr.x); return false;
    }
    return pr.life>0;
  });
  gs.pts=gs.pts.filter(pt=>{
    pt.x+=pt.vx*dt; pt.y+=pt.vy*dt;
    pt.vy+=300*dt; pt.life-=dt; return pt.life>0;
  });
  gs.floats=gs.floats.filter(ft=>{
    ft.y+=ft.vy*dt; ft.vy*=0.9; ft.life-=dt; return ft.life>0;   // rise, ease, fade
  });
}

/* ══════════ UPDATE — PUZZLES (level 2) ══════════ */
function updatePuzzles(gs:GS, dt:number){
  if(gs.level<2) return;
  const f=gs.flags;

  // levers drive their flag directly
  for(const lv of gs.levers){ if(lv.cd>0) lv.cd-=dt; f[lv.flag]=lv.on; }

  // a crystal group's flag is set once every crystal in it is lit
  const groups=new Set(gs.crystals.map(c=>c.group));
  for(const g of groups){
    if(!f[g] && gs.crystals.filter(c=>c.group===g).every(c=>c.lit)){ f[g]=true; sfx.play('checkpoint'); }
  }

  // combat zones: flag set when no living enemy remains in the span
  for(const z of gs.czones){
    if(f[z.flag]) continue;
    if(z.flag==='boss2' && !f.boss2Started) continue;
    const any=gs.ens.some(e=>e.hp>0 && e.k!=='boss' && e.x+e.w/2>=z.x0 && e.x+e.w/2<=z.x1);
    if(!any) f[z.flag]=true;
  }

  // combined requirement: gate 4 needs both the lever and the second crystal set
  f['g4'] = !!f['l2'] && !!f['cz2'];

  // ease the gates open/closed and slide the pillar accordingly
  for(const ga of gs.gates){
    const target=f[ga.flag]?1:0;
    ga.open += (target-ga.open)*Math.min(1,dt*3.5);
    if(Math.abs(target-ga.open)<0.002) ga.open=target;
    ga.plat.y = ga.baseY - ga.open*(ga.plat.h+260);
    if(target===1 && !ga.opened){ ga.opened=true; gs.shake=Math.max(gs.shake,.14); sfx.play('bossstep'); }
  }

  // move the platforms (sine path); record the per-frame delta so riders can be carried
  for(const m of gs.movers){
    const s=(Math.sin((gs.t/m.period + m.phase)*Math.PI*2)+1)/2;
    const nx=m.x0+(m.x1-m.x0)*s, ny=m.y0+(m.y1-m.y0)*s;
    m.dx=nx-m.plat.x; m.dy=ny-m.plat.y;
    m.plat.x=nx; m.plat.y=ny;
  }
}

/* ══════════ UPDATE — CAMERA ══════════ */
function updateCam(gs:GS){
  const p=gs.plr;
  const tx=p.x-VW/2+p.w/2, ty=p.y-VH*.45;
  gs.cx+=(tx-gs.cx)*.1;
  gs.cy+=(ty-gs.cy)*.08;
  gs.cx=clamp(gs.cx,0,gs.ww-VW);
  gs.cy=clamp(gs.cy,-100,400);
  if(gs.shake>0){
    gs.cx+=Math.sin(Date.now()*.05)*6*gs.shake;
    gs.cy+=Math.cos(Date.now()*.07)*4*gs.shake;
    gs.shake-=.04;
  }
}

/* ══════════ DRAW — PUZZLE PROPS ══════════ */
function drawGates(ctx:CanvasRenderingContext2D, gates:Gate[], camX:number, camY:number){
  for(const ga of gates){
    const pl=ga.plat, sx=pl.x-camX, sy=pl.y-camY;
    if(sx>VW+40||sx+pl.w<-40||sy>VH+40) continue;
    // iron portcullis — dark bars with rivets, lit edges
    ctx.fillStyle='#15151f'; ctx.fillRect(sx-2,sy,pl.w+4,pl.h);
    ctx.fillStyle='#3a3a52';
    for(let by=4; by<pl.h; by+=20){ ctx.fillRect(sx,sy+by,pl.w,3); }     // horizontal rungs
    ctx.fillStyle='#2a2a40'; ctx.fillRect(sx+3,sy,4,pl.h); ctx.fillRect(sx+pl.w-7,sy,4,pl.h);
    ctx.fillStyle='#55557a';
    for(let by=4; by<pl.h; by+=20){ ctx.fillRect(sx+3,sy+by,2,2); ctx.fillRect(sx+pl.w-5,sy+by,2,2); }
    // spiked bottom tips of the bars
    ctx.fillStyle='#1a1a26';
    ctx.beginPath(); ctx.moveTo(sx,sy+pl.h); ctx.lineTo(sx+pl.w/2,sy+pl.h+10); ctx.lineTo(sx+pl.w,sy+pl.h); ctx.closePath(); ctx.fill();
  }
}

function drawLevers(ctx:CanvasRenderingContext2D, levers:Lever[], camX:number, camY:number){
  for(const lv of levers){
    const sx=lv.x-camX, sy=lv.y-camY;
    if(sx<-40||sx>VW+40) continue;
    // base block
    ctx.fillStyle='#2a2014'; ctx.fillRect(sx-7,sy-6,14,6);
    ctx.fillStyle='#3a2c1a'; ctx.fillRect(sx-7,sy-6,14,2);
    // handle — swings left (off) / right (on)
    const ang = lv.on ? 0.7 : -0.7;
    ctx.save(); ctx.translate(sx,sy-6); ctx.rotate(ang);
    ctx.strokeStyle='#776655'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-20); ctx.stroke();
    ctx.save(); ctx.shadowColor=lv.on?C.lanternG:'#334'; ctx.shadowBlur=lv.on?10:0;
    ctx.fillStyle=lv.on?C.lanternG:'#445'; ctx.beginPath(); ctx.arc(0,-22,4,0,Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}

function drawCrystals(ctx:CanvasRenderingContext2D, crystals:Crystal[], camX:number, camY:number, t:number){
  for(const cr of crystals){
    const sx=cr.x-camX, sy=cr.y-camY;
    if(sx<-40||sx>VW+40) continue;
    const pulse=0.6+Math.sin(t*3+cr.x)*0.25;

    // ── carved temple pedestal: a stepped sandstone plinth from the crystal down to the floor ──
    const pTop=sy+8, pBot=cr.baseY-camY;          // column spans under the crystal to its surface
    if(pBot>pTop){
      // contact shadow pooled on the floor
      ctx.save(); ctx.globalAlpha=.4; ctx.fillStyle='#000';
      ctx.beginPath(); ctx.ellipse(sx,pBot,18,4,0,0,Math.PI*2); ctx.fill(); ctx.restore();
      // shaft
      const g=ctx.createLinearGradient(sx-9,0,sx+9,0);
      g.addColorStop(0,C.tStoneSh); g.addColorStop(.5,C.tStone); g.addColorStop(1,C.tStoneSh);
      ctx.fillStyle=g; ctx.fillRect(sx-8,pTop,16,pBot-pTop);
      // base slab (wider footing on the ground)
      ctx.fillStyle=C.tStoneL; ctx.fillRect(sx-13,pBot-6,26,6);
      ctx.fillStyle=C.tStoneSh; ctx.fillRect(sx-13,pBot-2,26,2);
      // capital + gold trim where the crystal rests
      ctx.fillStyle=C.tStoneL; ctx.fillRect(sx-11,pTop,22,4);
      ctx.fillStyle=C.tGold;   ctx.fillRect(sx-11,pTop,22,2);
      // faint glyph notch on the shaft face
      ctx.fillStyle=C.tGlyph;  ctx.fillRect(sx-2,pTop+10,4,Math.max(0,pBot-pTop-16));
    }

    if(cr.lit){
      ctx.save(); ctx.globalAlpha=0.5*pulse;
      const g=ctx.createRadialGradient(sx,sy,1,sx,sy,30);
      g.addColorStop(0,C.soulG); g.addColorStop(1,'transparent');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,sy,30,0,Math.PI*2); ctx.fill(); ctx.restore();
    }
    ctx.save();
    ctx.shadowColor=cr.lit?C.soulG:'#223'; ctx.shadowBlur=cr.lit?14*pulse:3;
    ctx.fillStyle=cr.lit?C.soul:'#2c3050';
    ctx.beginPath();
    ctx.moveTo(sx,sy-13); ctx.lineTo(sx+7,sy-2); ctx.lineTo(sx+5,sy+12);
    ctx.lineTo(sx-5,sy+12); ctx.lineTo(sx-7,sy-2); ctx.closePath(); ctx.fill();
    ctx.fillStyle=cr.lit?'#cfeaff':'#3a3f64';
    ctx.beginPath(); ctx.moveTo(sx,sy-13); ctx.lineTo(sx+3,sy-2); ctx.lineTo(sx,sy+4); ctx.lineTo(sx-3,sy-2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function drawChests(ctx:CanvasRenderingContext2D, chests:Chest[], flags:Record<string,boolean>, camX:number, camY:number, t:number){
  for(const ch of chests){
    const sx=ch.x-camX, sy=ch.y-camY;
    if(sx<-70||sx>VW+70) continue;
    const unlocked=!!flags[ch.flag];
    const glow=0.55+Math.sin(t*4+ch.x)*0.22;

    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(sx,sy+2,28,6,0,0,Math.PI*2); ctx.fill();

    if(unlocked && !ch.opened){
      const aura=ctx.createRadialGradient(sx,sy-18,2,sx,sy-18,52);
      aura.addColorStop(0,`rgba(119,204,255,${0.26+glow*0.12})`);
      aura.addColorStop(1,'rgba(119,204,255,0)');
      ctx.fillStyle=aura;
      ctx.beginPath(); ctx.arc(sx,sy-18,52,0,Math.PI*2); ctx.fill();
    }

    const lidY=ch.opened ? sy-32 : sy-28;
    ctx.fillStyle=ch.opened?'#6c4a22':'#8a5a24';
    ctx.fillRect(sx-24,sy-24,48,24);
    ctx.fillStyle=ch.opened?'#b68b45':'#d8a84c';
    ctx.fillRect(sx-24,sy-24,48,5);
    ctx.fillStyle='#3a2412';
    ctx.fillRect(sx-26,sy-19,52,4);
    ctx.fillStyle=C.tGoldD;
    ctx.fillRect(sx-4,sy-24,8,24);
    ctx.strokeStyle='#2a180c';
    ctx.lineWidth=2;
    ctx.strokeRect(sx-24,sy-24,48,24);

    ctx.save();
    ctx.translate(sx,lidY);
    ctx.rotate(ch.opened?-0.32:0);
    ctx.fillStyle=ch.opened?'#9a642b':'#a66b2b';
    ctx.fillRect(-26,-10,52,12);
    ctx.fillStyle=C.tGold;
    ctx.fillRect(-24,-10,48,3);
    ctx.strokeStyle='#2a180c';
    ctx.strokeRect(-26,-10,52,12);
    ctx.restore();

    if(ch.opened){
      ctx.save();
      ctx.shadowColor=C.soulG; ctx.shadowBlur=15;
      ctx.fillStyle=C.soul;
      ctx.beginPath();
      ctx.moveTo(sx,sy-42); ctx.lineTo(sx+8,sy-25); ctx.lineTo(sx,sy-16); ctx.lineTo(sx-8,sy-25);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle='#dff7ff';
      ctx.fillRect(sx-2,sy-37,4,14);
      ctx.restore();
    } else if(!unlocked){
      ctx.fillStyle='#151515';
      ctx.fillRect(sx-7,sy-18,14,12);
      ctx.strokeStyle=C.tGold;
      ctx.beginPath(); ctx.arc(sx,sy-18,7,Math.PI,0); ctx.stroke();
    }

    ctx.restore();
  }
}

function drawPortal(ctx:CanvasRenderingContext2D, portal:Portal, camX:number, camY:number, t:number){
  const sx=portal.x-camX, sy=portal.y-camY;
  if(sx<-120||sx>VW+120) return;
  const swirl=portal.t*2;
  // outer glow
  ctx.save();
  const g=ctx.createRadialGradient(sx,sy,4,sx,sy,70);
  const col=portal.kind==='win'?'#ffcc66':'#9a6cff';
  g.addColorStop(0,col); g.addColorStop(0.4,portal.kind==='win'?'rgba(255,150,40,0.5)':'rgba(110,60,255,0.5)'); g.addColorStop(1,'transparent');
  ctx.globalAlpha=0.55+Math.sin(t*3)*0.12;
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,sy,70,0,Math.PI*2); ctx.fill();
  ctx.restore();
  // spiralling ring
  ctx.save(); ctx.translate(sx,sy);
  for(let r=0;r<5;r++){
    ctx.globalAlpha=0.8-r*0.13;
    ctx.strokeStyle=portal.kind==='win'?'#ffe6a0':'#c9b0ff'; ctx.lineWidth=3-r*0.4;
    ctx.beginPath();
    for(let a=0;a<=Math.PI*2;a+=0.25){
      const rad=(18+r*8)+Math.sin(a*3+swirl+r)*4;
      const x=Math.cos(a+swirl*0.5)*rad, y=Math.sin(a+swirl*0.5)*rad*1.25;
      a===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.stroke();
  }
  // bright core
  ctx.globalAlpha=1; ctx.shadowColor=col; ctx.shadowBlur=20;
  ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.ellipse(0,0,9,12,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

/* ══════════ FULL RENDER ══════════ */
/* ══════════ DRAW — FLOATING HIT MARKERS ══════════ */
function drawFloats(ctx:CanvasRenderingContext2D, floats:FloatTxt[], camX:number, camY:number){
  for(const ft of floats){
    const sx=ft.x-camX, sy=ft.y-camY;
    if(sx<-40||sx>VW+40) continue;
    const k=ft.life/ft.ml;                 // 1 → 0
    const pop=1.35-0.35*k;                 // small grow as it rises
    ctx.save();
    ctx.globalAlpha=Math.min(1,k*1.6);     // hold, then fade near the end
    ctx.translate(sx,sy); ctx.scale(pop,pop);
    ctx.font='900 13px monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,0.7)'; ctx.strokeText(ft.txt,0,0);
    ctx.shadowColor=ft.col; ctx.shadowBlur=8; ctx.fillStyle=ft.col; ctx.fillText(ft.txt,0,0);
    ctx.restore();
  }
}

function render(canvas:HTMLCanvasElement, gs:GS){
  const ctx=canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled=false;
  const {cx,cy,t}=gs;

  drawBG(ctx,cx,t,gs.level);
  if(gs.level===1) drawArena(ctx,cx,cy,t);   // dramatic backdrop inside the boss chamber
  drawWardenArena(ctx,gs);
  drawEscapeFX(ctx,gs);
  drawBedrock(ctx,cy,gs.level);               // solid rock below the floor — no void beneath ground/pits
  drawSpikes(ctx,cx,cy);
  drawPlats(ctx,gs.plats,cx,cy,t,gs.level);
  drawCeiling(ctx,gs.plats,cx,cy,t,gs.level);

  // puzzle props (level 2)
  drawGates(ctx,gs.gates,cx,cy);
  drawCrystals(ctx,gs.crystals,cx,cy,t);
  drawLevers(ctx,gs.levers,cx,cy);
  drawChests(ctx,gs.chests,gs.flags,cx,cy,t);

  // warm lights (lanterns, embers, god-rays) wash over the rock
  drawLights(ctx,cx,cy,t,gs.lanterns,gs.embernooks,gs.shafts);

  // checkpoints
  for(const cp of gs.cps) drawCP(ctx,cp,cx,cy,t);

  // portal (boss-arena exit / level-2 goal)
  if(gs.portal) drawPortal(ctx,gs.portal,cx,cy,t);

  // drifting dust motes
  drawMotes(ctx,cx,t,gs.shafts);

  // particles behind entities
  for(const pt of gs.pts){
    const alpha=pt.life/pt.ml;
    ctx.save(); ctx.globalAlpha=alpha;
    ctx.fillStyle=pt.col;
    ctx.beginPath(); ctx.arc(pt.x-cx,pt.y-cy,pt.sz,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // enemies
  for(const e of gs.ens){
    if(e.hp<=0 && e.k!=='boss') continue;
    if(e.k==='crawler')   drawCrawler(ctx,e,cx,cy,t);
    else if(e.k==='flyer') drawFlyer(ctx,e,cx,cy,t);
    else if(e.k==='jumper') drawJumper(ctx,e,cx,cy);
    else if(e.k==='sentinel') drawSentinel(ctx,e,cx,cy);
    else if(e.k==='charger') drawCharger(ctx,e,cx,cy,t);
    else if(e.k==='warden') drawWarden(ctx,e,cx,cy,t);
    else if(e.k==='boss')  drawBoss(ctx,e,cx,cy,t);
  }

  // projectiles
  for(const pr of gs.prjs) drawProj(ctx,pr,cx,cy);

  // player
  drawPlayer(ctx,gs.plr,cx,cy,t);

  // floating hit markers (CRIT!) above the fray
  drawFloats(ctx,gs.floats,cx,cy);

  // soft cave vignette frames everything (screen-space), then HUD on top
  drawVignette(ctx);
  drawHUD(ctx,gs);
}

/* ══════════ UPGRADE SHOP DATA ══════════ */
const SHOP_ITEMS = [
  {id:'hp',    label:'+30 Max HP',      cost:30, apply:(p:Plr)=>{ p.mhp+=30; p.hp=Math.min(p.hp+30,p.mhp); }},
  {id:'dmg',   label:'+12 Attack Dmg',  cost:40, apply:(p:Plr)=>{ p.dmg+=12; }},
  {id:'shield',label:'Unlock: Shield',  cost:55, apply:(p:Plr)=>{ p.hShield=true; p.sh=1; }},
  {id:'heal',  label:'Full HP Restore', cost:25, apply:(p:Plr)=>{ p.hp=p.mhp; }},
  {id:'dj',    label:'+1 Jump Charge',  cost:35, apply:(p:Plr)=>{ p.mj=Math.min(p.mj+1,3); p.jl=p.mj; }},
];

/* ══════════ REACT COMPONENT ══════════ */
export function HollowGame({userEmail,onExit}:{userEmail:string;onExit?:()=>void}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef     = useRef<GS>(initGS());
  const keysRef   = useRef<Record<string,boolean>>({});
  const rafRef    = useRef(0);
  const wrapRef   = useRef<HTMLDivElement>(null);   // element put into fullscreen
  const pausedRef = useRef(false);   // true while a menu (shop/dead/win) is up
  const activeRef = useRef(false);   // enemies stay frozen until the player makes their first move

  const [phase,  setPhase]  = useState<'play'|'dead'|'win'|'shop'|'portal'|'escape'>('play');
  const [souls,  setSouls]  = useState(0);
  const [muted,  setMuted]  = useState(false);

  // Single persistent game loop — never duplicated; pausing is a flag, not a new loop
  useEffect(()=>{
    let last=performance.now();
    function loop(now:number){
      rafRef.current=requestAnimationFrame(loop);   // always keep exactly one loop alive

      // while paused, just keep the clock current so dt can't explode on resume
      if(pausedRef.current){ last=now; return; }

      const dt=Math.min((now-last)/1000,.033); last=now;   // clamp hard — no tunnelling
      const gs=gsRef.current;
      gs.t+=dt;

      updatePuzzles(gs,dt);
      updatePlayer(gs,keysRef.current,dt);
      // enemies (and their projectiles) hold completely still until the player starts playing
      if(activeRef.current){
        updateEnemies(gs,dt);
        updateProjs(gs,dt);
        gs.ens=gs.ens.filter(e=>e.hp>0||e.k==='boss');
      }
      if(gs.portal) gs.portal.t+=dt;
      updateCam(gs);

      const canvas=canvasRef.current;
      if(canvas) render(canvas,gs);

      // phase transitions — pause the sim, don't kill the loop
      const p=gs.plr;
      if(p.st==='dead'){ pausedRef.current=true; setPhase('dead'); return; }

      // boss slain (level 1) → open the portal to the deeper cave instead of ending
      if(gs.level===1){
        const boss=gs.ens.find(e=>e.k==='boss');
        // wait out the full defeat animation before the portal rises
        if(boss && boss.hp<=0 && (boss.dyT??0)>=BOSS_DEATH_DUR && !gs.portal){
          gs.portal={x:10550,y:300,kind:'next',t:0};
          gs.shake=Math.max(gs.shake,.3);
        }
      }

      // stepped into a portal → transition (next cave) or victory (final exit)
      if(gs.enterPortal){
        const kind=gs.enterPortal.kind;
        gs.enterPortal=null; pausedRef.current=true;
        if(kind==='win'){ sfx.play('win'); setPhase('win'); }
        else if(kind==='escape'){ sfx.play('win'); setPhase('escape'); }
        else setPhase('portal');
        return;
      }

      if(gs.cpIdx>=0){
        gs.cpIdx=-1; pausedRef.current=true;
        setSouls(p.souls); setPhase('shop');
      }
    }
    rafRef.current=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[]);

  // Keyboard — also unlocks the AudioContext on the first key (autoplay policy)
  useEffect(()=>{
    // Use e.code (physical key), NOT e.key, so controls work on any layout (e.g. Cyrillic)
    const norm=(e:KeyboardEvent):string|null=>{
      const c=e.code;
      if(c.startsWith('Key')) return c.slice(3).toLowerCase();   // KeyJ → 'j'
      if(c==='Space') return ' ';
      if(c==='ShiftLeft'||c==='ShiftRight') return 'Shift';
      if(c.startsWith('Arrow')) return c;                        // ArrowUp, …
      return null;
    };
    let combo='';   // secret cheat: type "skip" to skip the current stage
    const down=(e:KeyboardEvent)=>{
      const k=norm(e); if(k===null) return;
      sfx.init(); sfx.resume(); sfx.startAmbience(gsRef.current.level);   // unlock audio + ambient bed
      sfx.startMusic(gsRef.current.level>=2?'temple':'cave');
      activeRef.current=true; keysRef.current[k]=true; e.preventDefault();
      if(k==='h' && !e.repeat) usePotion(gsRef.current);
      if(k.length===1){
        combo=(combo+k).slice(-4);
        if(combo==='skip'){ combo=''; skipStage(); }
      }
    };
    const up  =(e:KeyboardEvent)=>{ const k=norm(e); if(k!==null) keysRef.current[k]=false; };
    window.addEventListener('keydown',down);
    window.addEventListener('keyup',up);
    return ()=>{ window.removeEventListener('keydown',down); window.removeEventListener('keyup',up); };
  },[]);

  // silence the ambient bed when the game unmounts (e.g. back to the main menu)
  useEffect(()=>()=>{ sfx.stopAmbience(); sfx.stopMusic(); },[]);

  // Mouse — LEFT CLICK attacks, RIGHT CLICK raises the shield (hold either). Unlocks audio too.
  useEffect(()=>{
    const canvas=canvasRef.current;
    const down=(e:MouseEvent)=>{
      activeRef.current=true;
      sfx.init(); sfx.resume(); sfx.startAmbience(gsRef.current.level);   // unlock audio + ambient bed
      sfx.startMusic(gsRef.current.level>=2?'temple':'cave');
      if(e.button===0){ keysRef.current['attack']=true; e.preventDefault(); }
      else if(e.button===2){ keysRef.current['block']=true; e.preventDefault(); }
    };
    const up=(e:MouseEvent)=>{
      if(e.button===0) keysRef.current['attack']=false;
      else if(e.button===2) keysRef.current['block']=false;
    };
    const ctxMenu=(e:MouseEvent)=>e.preventDefault();   // no browser right-click menu over the game
    canvas?.addEventListener('mousedown',down);
    window.addEventListener('mouseup',up);
    canvas?.addEventListener('contextmenu',ctxMenu);
    return ()=>{
      canvas?.removeEventListener('mousedown',down);
      window.removeEventListener('mouseup',up);
      canvas?.removeEventListener('contextmenu',ctxMenu);
    };
  },[]);

  function restart(){
    sfx.setMusicTheme('cave');
    gsRef.current=initGS();
    keysRef.current={};
    pausedRef.current=false;
    activeRef.current=false;   // freeze enemies again until the player makes the first move
    sfx.startAmbience(1);      // back to the level-1 ambient track
    sfx.startMusic('cave');
    setPhase('play');
  }

  // portal transition finished → carry the player's progress into the deeper cave (level 2)
  function goLevel2(){
    sfx.setMusicTheme('temple');
    const prev=gsRef.current.plr;
    const gs=initLevel(2);
    // keep the upgrades / souls the player earned in level 1
    const np=gs.plr;
    np.mhp=prev.mhp; np.hp=prev.mhp; np.dmg=prev.dmg; np.mj=prev.mj; np.jl=prev.mj;
    np.hShield=prev.hShield; np.sh=1; np.souls=prev.souls; np.potions=[...prev.potions];
    gsRef.current=gs;
    keysRef.current={};
    pausedRef.current=false;
    activeRef.current=false;
    sfx.startAmbience(2);   // switch to the deeper-cave ambient track
    sfx.startMusic('temple');
    setPhase('play');
  }

  function goLevel3(){
    sfx.setMusicTheme('temple');
    const prev=gsRef.current.plr;
    const gs=initLevel(3);
    const np=gs.plr;
    np.mhp=prev.mhp; np.hp=prev.hp; np.dmg=prev.dmg; np.mj=prev.mj; np.jl=prev.mj;
    np.hShield=prev.hShield; np.sh=1; np.souls=prev.souls; np.potions=[...prev.potions];
    gsRef.current=gs;
    keysRef.current={};
    pausedRef.current=false;
    activeRef.current=false;
    sfx.startAmbience(3);
    sfx.startMusic('temple');
    setPhase('play');
  }

  // Secret cheat: skip the current stage. Level 1 → deeper cave (level 2); level 2 → victory.
  function skipStage(){
    if(pausedRef.current) return;           // ignore while in a menu / cutscene
    if(gsRef.current.level===1) goLevel2();
    else if(gsRef.current.level===2) goLevel3();
    else { pausedRef.current=true; sfx.play('win'); setPhase('win'); }
  }

  function buyUpgrade(item:typeof SHOP_ITEMS[0]){
    const p=gsRef.current.plr;
    if(p.souls<item.cost) return;
    p.souls-=item.cost;
    item.apply(p);
    setSouls(p.souls);
    sfx.play('buy');
  }

  function leaveShop(){
    settleOnGround(gsRef.current);   // re-plant before resuming
    keysRef.current={};              // drop any keys held while in the menu
    pausedRef.current=false;         // unpause the persistent loop
    setPhase('play');
  }

  function wakeGameAudio(){
    activeRef.current=true;
    sfx.init();
    sfx.resume();
    sfx.startAmbience(gsRef.current.level);
    sfx.startMusic(gsRef.current.level>=2?'temple':'cave');
  }

  function pressMobileKey(key:string, e:PointerEvent<HTMLButtonElement>){
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    wakeGameAudio();
    keysRef.current[key]=true;
    if(key==='h') usePotion(gsRef.current);
  }

  function releaseMobileKey(key:string, e:PointerEvent<HTMLButtonElement>){
    e.preventDefault();
    if(e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    keysRef.current[key]=false;
  }

  const mobileHold = (key:string) => ({
    onPointerDown: (e:PointerEvent<HTMLButtonElement>) => pressMobileKey(key,e),
    onPointerUp: (e:PointerEvent<HTMLButtonElement>) => releaseMobileKey(key,e),
    onPointerCancel: (e:PointerEvent<HTMLButtonElement>) => releaseMobileKey(key,e),
    onContextMenu: (e:PointerEvent<HTMLButtonElement>) => e.preventDefault(),
  });

  return (
    <div style={{position:'fixed',inset:0,zIndex:40,background:'#000',
      display:'flex',flexDirection:'column',gap:6,padding:6,boxSizing:'border-box',touchAction:'none'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flex:'0 0 auto'}}>
        <span style={{fontSize:13,color:'var(--soft)',fontFamily:'monospace'}}>
          {userEmail.split('@')[0]} — Void Knight
        </span>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:11,color:'var(--soft)',fontFamily:'monospace'}}>
            L-Click=Attack (↑+Click=up)  R-Click=Shield  H=Potion  K=Dash  Q=Dodge  W/Space=Jump  A/D=Move
          </span>
          <button
            onClick={()=>{ const m=!muted; setMuted(m); sfx.init(); sfx.resume(); sfx.startMusic(gsRef.current.level>=2?'temple':'cave'); sfx.setEnabled(!m); }}
            title={muted?'Включить звук':'Выключить звук'}
            style={{padding:'4px 8px',fontFamily:'monospace',fontSize:12,background:'#0a0a28',
              color:muted?'#666688':'#6688ff',border:'1px solid #2244aa',borderRadius:6,cursor:'pointer'}}>
            {muted?'SND OFF':'SND ON'}
          </button>
        </div>
      </div>

      <div ref={wrapRef} style={{position:'relative',lineHeight:0,flex:'1 1 auto',minHeight:0,
        display:'flex',alignItems:'center',justifyContent:'center',background:'#000'}}>
        <canvas ref={canvasRef} width={VW} height={VH}
          style={{display:'block',width:'100%',height:'100%',objectFit:'cover',
            borderRadius:0,border:'none',touchAction:'none'}}/>

        {phase==='play'&&(
          <div className="mobile-controls" aria-label="Mobile game controls">
            <div className="mobile-pad">
              <div />
              <button className="mobile-control" aria-label="Aim up" {...mobileHold('w')}>UP</button>
              <div />
              <button className="mobile-control" aria-label="Move left" {...mobileHold('a')}>LEFT</button>
              <button className="mobile-control mobile-control-dim" aria-label="Aim down" {...mobileHold('s')}>DOWN</button>
              <button className="mobile-control" aria-label="Move right" {...mobileHold('d')}>RIGHT</button>
            </div>

            <div className="mobile-actions">
              <button className="mobile-control mobile-control-main" aria-label="Attack" {...mobileHold('attack')}>ATK</button>
              <button className="mobile-control mobile-control-main" aria-label="Jump" {...mobileHold(' ')}>JUMP</button>
              <button className="mobile-control" aria-label="Dash" {...mobileHold('k')}>DASH</button>
              <button className="mobile-control" aria-label="Dodge" {...mobileHold('q')}>ROLL</button>
              <button className="mobile-control" aria-label="Shield" {...mobileHold('block')}>BLOCK</button>
              <button className="mobile-control mobile-control-dim" aria-label="Heal" {...mobileHold('h')}>HEAL</button>
            </div>
          </div>
        )}

        {/* DEATH */}
        {phase==='dead'&&(
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.82)',display:'flex',flexDirection:'column',
            alignItems:'center',justifyContent:'center',gap:12,borderRadius:8}}>
            <div style={{fontSize:18,fontWeight:900,color:'#cc2222',fontFamily:'monospace',letterSpacing:4}}>
              YOU DIED
            </div>
            <div style={{color:'#886666',fontSize:13,fontFamily:'monospace'}}>
              The darkness claimed you
            </div>
            <div style={{display:'flex',gap:10,marginTop:8}}>
              <button onClick={restart} style={{fontFamily:'monospace',letterSpacing:2}}>
                TRY AGAIN
              </button>
              {onExit&&(
                <button onClick={onExit}
                  style={{fontFamily:'monospace',letterSpacing:2,background:'#15152e',color:'#8fb4ff',border:'1px solid #2244aa'}}>
                  В ГЛАВНОЕ МЕНЮ
                </button>
              )}
            </div>
          </div>
        )}

        {/* PORTAL TRANSITION → deeper cave */}
        {phase==='portal'&&(
          <PortalCutscene onDone={goLevel2}/>
        )}

        {phase==='escape'&&(
          <EscapeCutscene onDone={goLevel3}/>
        )}

        {/* WIN — the deeper cave cleared */}
        {phase==='win'&&(
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.82)',display:'flex',flexDirection:'column',
            alignItems:'center',justifyContent:'center',gap:12,borderRadius:8}}>
            <div style={{fontSize:16,fontWeight:900,color:'#ffcc66',fontFamily:'monospace',letterSpacing:3}}>
              ГЛУБИННАЯ ПЕЩЕРА ПРОЙДЕНА
            </div>
            <div style={{color:'#aabbff',fontSize:13,fontFamily:'monospace'}}>
              Все загадки разгаданы. Свет возвращается в глубины.
            </div>
            <div style={{color:'#44aaff',fontFamily:'monospace',fontSize:13}}>
              Souls collected: {gsRef.current.plr.souls}
            </div>
            <div style={{display:'flex',gap:10,marginTop:8}}>
              <button onClick={restart} style={{fontFamily:'monospace',letterSpacing:2,background:'#442200',color:'#ffcc88'}}>
                PLAY AGAIN
              </button>
              {onExit&&(
                <button onClick={onExit}
                  style={{fontFamily:'monospace',letterSpacing:2,background:'#15152e',color:'#8fb4ff',border:'1px solid #2244aa'}}>
                  В ГЛАВНОЕ МЕНЮ
                </button>
              )}
            </div>
          </div>
        )}

        {/* SHOP */}
        {phase==='shop'&&(
          <div style={{position:'absolute',inset:0,background:'rgba(2,2,18,.88)',display:'flex',flexDirection:'column',
            alignItems:'center',justifyContent:'center',gap:10,borderRadius:8}}>
            <div style={{color:'#4488ff',fontFamily:'monospace',fontWeight:900,fontSize:15,letterSpacing:3,marginBottom:4}}>
              — CHECKPOINT —
            </div>
            <div style={{color:'#33aaff',fontFamily:'monospace',fontSize:13,marginBottom:8}}>
              Souls: {souls}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,width:420}}>
              {SHOP_ITEMS.map(item=>{
                const p=gsRef.current.plr;
                const canAfford=p.souls>=item.cost;
                const owned=(item.id==='dash'&&p.hDash)||(item.id==='wj'&&p.hWJ)||(item.id==='shield'&&p.hShield);
                return (
                  <button key={item.id}
                    onClick={()=>buyUpgrade(item)}
                    disabled={!canAfford||!!owned}
                    style={{
                      fontFamily:'monospace',fontSize:12,letterSpacing:1,
                      background:owned?'#0a1a0a':canAfford?'#0a0a2e':'#0a0a14',
                      color:owned?'#44aa44':canAfford?'#aabbff':'#444466',
                      border:`1px solid ${owned?'#226622':canAfford?'#2244aa':'#1a1a30'}`,
                      padding:'10px 8px',borderRadius:6,
                    }}>
                    {owned?'[OWNED] ':''}
                    {item.label}
                    {!owned&&<><br/><span style={{color:'#3366ff'}}>{item.cost} souls</span></>}
                  </button>
                );
              })}
            </div>
            <button onClick={leaveShop}
              style={{marginTop:12,fontFamily:'monospace',letterSpacing:3,background:'#0a0a28',color:'#6688ff',
                border:'1px solid #2244aa',padding:'8px 32px',borderRadius:6}}>
              CONTINUE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
