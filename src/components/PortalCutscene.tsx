import { useEffect, useRef, useState } from 'react';

// Короткая катсцена-переход: победив босса, Рыцарь входит в портал
// и оказывается в более глубокой, древней пещере, полной загадок.
const CW = 800, CH = 450;

const SCENES: { dur: number; sub: string }[] = [
  { dur: 3.6, sub: 'Повелитель Пустоты повержен. В глубине арены раскрывается портал…' },
  { dur: 3.8, sub: 'Рыцарь шагает в водоворот света — мир вокруг растворяется.' },
  { dur: 4.2, sub: 'Он выходит в иную пещеру — древнюю, бескрайнюю, полную ловушек и загадок.' },
];
const TOTAL = SCENES.reduce((a, s) => a + s.dur, 0);

/* ── компактный рыцарь (в духе игрового спрайта) ── */
function drawKnight(ctx: CanvasRenderingContext2D, t: number, walk: boolean) {
  const leg = walk ? Math.sin(t * 12) * 0.32 : 0;
  const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
  aura.addColorStop(0, 'rgba(102,204,255,0.30)'); aura.addColorStop(1, 'rgba(102,204,255,0)');
  ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
  const sway = walk ? Math.sin(t * 12) * 3 : Math.sin(t * 2) * 1.4;
  const cg = ctx.createLinearGradient(0, -10, 0, 20);
  cg.addColorStop(0, '#3a5cff'); cg.addColorStop(1, '#1d2a63');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(-7, -9); ctx.lineTo(5, -8);
  ctx.quadraticCurveTo(1, 6, -3 + sway * 0.4, 14);
  ctx.quadraticCurveTo(-7 + sway, 19, -11 + sway, 16);
  ctx.quadraticCurveTo(-8 + sway * 0.4, 8, -11, -1);
  ctx.closePath(); ctx.fill();
  for (const s of [-1, 1]) {
    const off = s < 0 ? leg * 6 : -leg * 6;
    ctx.save(); ctx.translate(s * 4.5, 5 + off);
    ctx.fillStyle = '#2f6fe0'; ctx.fillRect(-3.5, 0, 7, 12);
    ctx.fillStyle = '#0a0a14'; ctx.beginPath();
    ctx.moveTo(-3.5, 11); ctx.lineTo(5, 11); ctx.lineTo(5, 15); ctx.lineTo(-3.5, 15); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  const bg = ctx.createLinearGradient(0, -10, 0, 14);
  bg.addColorStop(0, '#bcd8ff'); bg.addColorStop(.45, '#5aa9ff'); bg.addColorStop(1, '#2f6fe0');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(8, -8); ctx.lineTo(9, 6);
  ctx.quadraticCurveTo(0, 14, -9, 6); ctx.closePath(); ctx.fill();
  for (const s of [-1, 1]) {
    ctx.fillStyle = s > 0 ? '#5aa9ff' : '#2f6fe0';
    ctx.beginPath(); ctx.ellipse(s * 8.5, -7, 4.5, 3.4, 0, 0, Math.PI * 2); ctx.fill();
  }
  const hy = -12;
  const hg = ctx.createLinearGradient(0, hy - 10, 0, hy + 8);
  hg.addColorStop(0, '#cfe6ff'); hg.addColorStop(.5, '#5aa9ff'); hg.addColorStop(1, '#2f6fe0');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.moveTo(-8, hy + 6); ctx.lineTo(-8, hy - 2);
  ctx.quadraticCurveTo(-8, hy - 10, 0, hy - 10);
  ctx.quadraticCurveTo(8, hy - 10, 8, hy - 2);
  ctx.lineTo(8, hy + 6); ctx.quadraticCurveTo(0, hy + 9, -8, hy + 6);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0a1428'; ctx.fillRect(-8, hy - 1, 16, 5);
  ctx.save(); ctx.shadowColor = '#eaf4ff'; ctx.shadowBlur = 6;
  ctx.fillStyle = '#eaf4ff'; ctx.fillRect(-6, hy + 0.4, 12, 2);
  ctx.restore();
  ctx.fillStyle = '#2f6fe0';
  ctx.beginPath(); ctx.moveTo(-2, hy - 9); ctx.lineTo(2, hy - 9); ctx.lineTo(1, hy - 15); ctx.lineTo(-1, hy - 15); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.shadowColor = '#66ccff'; ctx.shadowBlur = 8; ctx.fillStyle = '#66ccff';
  ctx.beginPath(); ctx.arc(0, hy - 15, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* ── вихревой портал в точке (cx,cy) ── */
function drawPortal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, gt: number) {
  ctx.save();
  ctx.translate(cx, cy);
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, r * 1.6);
  glow.addColorStop(0, 'rgba(180,150,255,0.85)');
  glow.addColorStop(0.4, 'rgba(110,60,255,0.45)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2); ctx.fill();
  for (let ring = 0; ring < 6; ring++) {
    ctx.globalAlpha = 0.85 - ring * 0.11;
    ctx.strokeStyle = '#c9b0ff'; ctx.lineWidth = 3 - ring * 0.35;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.22) {
      const rad = (r * 0.25 + ring * r * 0.12) + Math.sin(a * 3 + gt * 2 + ring) * (r * 0.05);
      const x = Math.cos(a + gt) * rad, y = Math.sin(a + gt) * rad * 1.15;
      a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.shadowColor = '#b89cff'; ctx.shadowBlur = 22;
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.16, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, idx: number, p: number, gt: number) {
  ctx.clearRect(0, 0, CW, CH);

  if (idx === 0) {
    // арена после боя — портал раскрывается
    const g = ctx.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, '#0a0612'); g.addColorStop(1, '#04020a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = '#1c1c36'; ctx.fillRect(0, 360, CW, CH - 360);
    ctx.fillStyle = '#28285a'; ctx.fillRect(0, 360, CW, 4);
    const r = 20 + p * 90;
    drawPortal(ctx, CW / 2, 250, r, gt);
    ctx.save(); ctx.translate(CW / 2 - 150, 360 - 19 * 1.7); ctx.scale(1.7, 1.7);
    drawKnight(ctx, gt, false); ctx.restore();

  } else if (idx === 1) {
    // шаг в портал — рыцарь приближается и растворяется
    ctx.fillStyle = '#06030f'; ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = '#1c1c36'; ctx.fillRect(0, 360, CW, CH - 360);
    drawPortal(ctx, CW / 2, 250, 110, gt);
    const kx = CW / 2 - 150 + p * 150;
    const sc = 1.7 * (1 - p * 0.5);
    ctx.save(); ctx.globalAlpha = 1 - p * 0.9;
    ctx.translate(kx, 360 - 19 * sc - p * 90); ctx.scale(sc, sc);
    drawKnight(ctx, gt, true); ctx.restore();
    if (p > 0.6) {
      const b = (p - 0.6) / 0.4;
      const fg = ctx.createRadialGradient(CW / 2, 250, 10, CW / 2, 250, 60 + b * 520);
      fg.addColorStop(0, `rgba(220,205,255,${0.9 * b})`);
      fg.addColorStop(0.5, `rgba(130,80,255,${0.4 * b})`);
      fg.addColorStop(1, 'transparent');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, CW, CH);
    }

  } else {
    // выход в новую, более глубокую пещеру
    const fadeIn = Math.min(1, p * 2.2);
    ctx.fillStyle = '#04030a'; ctx.fillRect(0, 0, CW, CH);
    // вспышка затухает
    if (p < 0.4) { ctx.fillStyle = `rgba(220,205,255,${(0.4 - p) / 0.4})`; ctx.fillRect(0, 0, CW, CH); }
    ctx.save(); ctx.globalAlpha = fadeIn;
    // далёкие своды новой пещеры
    ctx.fillStyle = '#0c0a1a';
    for (let i = 0; i < 10; i++) {
      const bx = (i * 90 + 20) % CW, bh = 50 + (i * 53 % 70);
      ctx.beginPath(); ctx.moveTo(bx - 26, 26); ctx.lineTo(bx + 26, 26); ctx.lineTo(bx, 26 + bh); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#161228'; ctx.fillRect(0, 360, CW, CH - 360);
    ctx.fillStyle = '#2a2348'; ctx.fillRect(0, 360, CW, 4);
    // светящиеся кристаллы вдалеке (намёк на загадки)
    const cz: [number, number][] = [[160, 330], [380, 320], [600, 335], [700, 300]];
    cz.forEach(([x, y], i) => {
      ctx.save(); ctx.shadowColor = '#33aaff'; ctx.shadowBlur = 10;
      ctx.globalAlpha = fadeIn * (0.6 + 0.4 * Math.sin(gt * 3 + i));
      ctx.fillStyle = '#5aa9ff';
      ctx.beginPath();
      ctx.moveTo(x, y - 12); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 12); ctx.lineTo(x - 6, y); ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    // рыцарь выходит вперёд
    ctx.save(); ctx.translate(150 + p * 120, 360 - 19 * 1.7); ctx.scale(1.7, 1.7);
    drawKnight(ctx, gt, true); ctx.restore();
    ctx.restore();
  }

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CW, 26);
  ctx.fillRect(0, CH - 26, CW, 26);
}

export function PortalCutscene({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const idxRef = useRef(0);
  const [subIdx, setSubIdx] = useState(0);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let start: number | undefined;
    const frame = (now: number) => {
      if (start === undefined) start = now;
      const gt = (now - start) / 1000;
      if (gt >= TOTAL) { doneRef.current(); return; }
      let acc = 0, idx = 0, p = 0;
      for (let k = 0; k < SCENES.length; k++) {
        if (gt < acc + SCENES[k].dur) { idx = k; p = (gt - acc) / SCENES[k].dur; break; }
        acc += SCENES[k].dur;
      }
      if (idx !== idxRef.current) { idxRef.current = idx; setSubIdx(idx); }
      drawScene(ctx, idx, p, gt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', borderRadius: 8, overflow: 'hidden', lineHeight: 0 }}>
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
      />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: '7%', display: 'flex', justifyContent: 'center', pointerEvents: 'none', padding: '0 24px' }}>
        <p
          key={subIdx}
          className="cutscene-line"
          style={{
            maxWidth: 580, textAlign: 'center', fontFamily: 'monospace', fontSize: 15, lineHeight: 1.5,
            color: '#dce8ff', textShadow: '0 2px 6px #000', background: 'rgba(2,2,12,0.45)',
            padding: '8px 16px', borderRadius: 8,
          }}
        >
          {SCENES[subIdx].sub}
        </p>
      </div>
      <button
        onClick={() => doneRef.current()}
        style={{
          position: 'absolute', bottom: 12, right: 14,
          background: 'rgba(10,10,40,.55)', color: '#8fb4ff', fontFamily: 'monospace', fontSize: 12,
          padding: '5px 12px', border: '1px solid #2244aa', borderRadius: 6, cursor: 'pointer',
        }}
      >
        Пропустить ⏭
      </button>
    </div>
  );
}
