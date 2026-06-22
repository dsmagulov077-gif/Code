import { useEffect, useRef, useState } from 'react';

// Анимированная вступительная катсцена (canvas) с субтитрами:
// мир поглощает тьма → выковывают Рыцаря Пустоты → его отправляют в пещеру →
// он спускается во мрак и истребляет тьму.
const CW = 800, CH = 450;

const SCENES: { dur: number; sub: string }[] = [
  { dur: 4.0, sub: 'Тьма поглотила земли. Свет угас, и пустота заполнила всё живое.' },
  { dur: 4.0, sub: 'Против мрака выковали последнюю надежду — Рыцаря Пустоты.' },
  { dur: 4.5, sub: 'Его снаряжают и отправляют в глубокую пещеру под миром…' },
  { dur: 5.0, sub: '…чтобы спуститься во тьму и уничтожить её до последней тени.' },
];
const TOTAL = SCENES.reduce((a, s) => a + s.dur, 0);

/* ── компактный рыцарь (в духе игрового спрайта), рисуется в локальных координатах ── */
function drawKnight(ctx: CanvasRenderingContext2D, t: number, walk: boolean) {
  const leg = walk ? Math.sin(t * 12) * 0.32 : 0;
  // аура
  const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
  aura.addColorStop(0, 'rgba(102,204,255,0.30)'); aura.addColorStop(1, 'rgba(102,204,255,0)');
  ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
  // плащ
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
  // ноги
  for (const s of [-1, 1]) {
    const off = s < 0 ? leg * 6 : -leg * 6;
    ctx.save(); ctx.translate(s * 4.5, 5 + off);
    ctx.fillStyle = '#2f6fe0'; ctx.fillRect(-3.5, 0, 7, 12);
    ctx.fillStyle = '#0a0a14'; ctx.beginPath();
    ctx.moveTo(-3.5, 11); ctx.lineTo(5, 11); ctx.lineTo(5, 15); ctx.lineTo(-3.5, 15); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // торс
  const bg = ctx.createLinearGradient(0, -10, 0, 14);
  bg.addColorStop(0, '#bcd8ff'); bg.addColorStop(.45, '#5aa9ff'); bg.addColorStop(1, '#2f6fe0');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(8, -8); ctx.lineTo(9, 6);
  ctx.quadraticCurveTo(0, 14, -9, 6); ctx.closePath(); ctx.fill();
  // наплечники
  for (const s of [-1, 1]) {
    ctx.fillStyle = s > 0 ? '#5aa9ff' : '#2f6fe0';
    ctx.beginPath(); ctx.ellipse(s * 8.5, -7, 4.5, 3.4, 0, 0, Math.PI * 2); ctx.fill();
  }
  // шлем
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
  ctx.fillStyle = '#0a1428'; ctx.fillRect(-8, hy - 1, 16, 5);          // визор
  ctx.save(); ctx.shadowColor = '#eaf4ff'; ctx.shadowBlur = 6;
  ctx.fillStyle = '#eaf4ff'; ctx.fillRect(-6, hy + 0.4, 12, 2);        // светящаяся прорезь
  ctx.restore();
  // гребень
  ctx.fillStyle = '#2f6fe0';
  ctx.beginPath(); ctx.moveTo(-2, hy - 9); ctx.lineTo(2, hy - 9); ctx.lineTo(1, hy - 15); ctx.lineTo(-1, hy - 15); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.shadowColor = '#66ccff'; ctx.shadowBlur = 8; ctx.fillStyle = '#66ccff';
  ctx.beginPath(); ctx.arc(0, hy - 15, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawRaisedSword(ctx: CanvasRenderingContext2D, glow: number) {
  ctx.save();
  ctx.shadowColor = '#8fb4ff'; ctx.shadowBlur = 8 + glow * 22;
  const by = -20, len = 30;
  ctx.fillStyle = '#cfe2ff';
  ctx.beginPath();
  ctx.moveTo(-2.5, by); ctx.lineTo(-2.5, by - len + 7); ctx.lineTo(0, by - len);
  ctx.lineTo(2.5, by - len + 7); ctx.lineTo(2.5, by); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#9a8444'; ctx.fillRect(-7, by - 1, 14, 4);   // гарда
  ctx.fillStyle = '#66ccff'; ctx.beginPath(); ctx.arc(0, by + 4, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* ── отрисовка сцены idx с прогрессом p (0..1) и глобальным временем gt ── */
function drawScene(ctx: CanvasRenderingContext2D, idx: number, p: number, gt: number) {
  ctx.clearRect(0, 0, CW, CH);

  if (idx === 0) {
    // мир, который поглощает тьма
    const g = ctx.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, '#0a1230'); g.addColorStop(1, '#05050f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
    // гаснущий свет наверху
    ctx.save(); ctx.globalAlpha = (1 - p) * 0.7;
    const lo = ctx.createRadialGradient(CW / 2, 130, 8, CW / 2, 130, 210);
    lo.addColorStop(0, 'rgba(160,190,255,0.8)'); lo.addColorStop(1, 'transparent');
    ctx.fillStyle = lo; ctx.beginPath(); ctx.arc(CW / 2, 130, 210, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // силуэт холмов
    ctx.fillStyle = '#0c1430';
    ctx.beginPath(); ctx.moveTo(0, CH);
    for (let x = 0; x <= CW; x += 28) ctx.lineTo(x, 332 + Math.sin(x * 0.011) * 30 + Math.sin(x * 0.04) * 12);
    ctx.lineTo(CW, CH); ctx.closePath(); ctx.fill();
    // наползающая тьма с обоих краёв
    const cover = p * CW * 0.62;
    let gl = ctx.createLinearGradient(0, 0, cover, 0);
    gl.addColorStop(0, '#000'); gl.addColorStop(.7, '#000'); gl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, cover, CH);
    let gr = ctx.createLinearGradient(CW, 0, CW - cover, 0);
    gr.addColorStop(0, '#000'); gr.addColorStop(.7, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(CW - cover, 0, cover, CH);
    // щупальца мрака
    ctx.strokeStyle = `rgba(40,10,60,${0.5 + p * 0.4})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1;
      const baseX = side < 0 ? cover : CW - cover;
      const len = 40 + p * 120;
      const y = 90 + i * 55;
      ctx.beginPath(); ctx.moveTo(baseX, y);
      ctx.quadraticCurveTo(baseX - side * len * 0.6, y + Math.sin(gt * 2 + i) * 16, baseX - side * len, y + 10);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(0,0,0,${p * 0.45})`; ctx.fillRect(0, 0, CW, CH);

  } else if (idx === 1) {
    // выковывают Рыцаря Пустоты
    ctx.fillStyle = '#04040c'; ctx.fillRect(0, 0, CW, CH);
    const rg = ctx.createRadialGradient(CW / 2, CH / 2 + 30, 10, CW / 2, CH / 2 + 30, 260);
    rg.addColorStop(0, `rgba(40,70,160,${0.25 + p * 0.2})`); rg.addColorStop(1, 'transparent');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, CW, CH);
    // искры ковки в начале
    if (p < 0.6) {
      ctx.save();
      for (let i = 0; i < 16; i++) {
        const a = i * 0.9 + gt * 6, r = 30 + (i % 5) * 16;
        ctx.globalAlpha = (0.6 - p) * (0.5 + 0.5 * Math.sin(gt * 10 + i));
        ctx.fillStyle = i % 2 ? '#9fc4ff' : '#ffe9a0';
        ctx.beginPath(); ctx.arc(CW / 2 + Math.cos(a) * r, CH / 2 + 10 + Math.sin(a) * r * 0.6, 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    // рыцарь проявляется и поднимается
    const a = Math.min(1, p * 1.7);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(CW / 2, CH / 2 + 30 + (1 - a) * 30);
    ctx.scale(3.0, 3.0);
    drawKnight(ctx, gt, false);
    if (p > 0.55) drawRaisedSword(ctx, (p - 0.55) / 0.45);
    ctx.restore();

  } else if (idx === 2) {
    // его отправляют в пещеру
    const g = ctx.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, '#0a0a1c'); g.addColorStop(1, '#06040e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
    // земля
    ctx.fillStyle = '#1c1c36'; ctx.fillRect(0, 360, CW, CH - 360);
    ctx.fillStyle = '#28285a'; ctx.fillRect(0, 360, CW, 4);
    // скальная масса вокруг входа
    ctx.fillStyle = '#16110d';
    ctx.beginPath(); ctx.moveTo(520, 360); ctx.lineTo(520, 230);
    ctx.quadraticCurveTo(650, 120, 780, 230); ctx.lineTo(780, 360); ctx.closePath(); ctx.fill();
    // тёмный зев пещеры
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.moveTo(560, 360); ctx.lineTo(560, 250);
    ctx.quadraticCurveTo(650, 175, 740, 250); ctx.lineTo(740, 360); ctx.closePath(); ctx.fill();
    // сталактиты в зеве
    ctx.fillStyle = '#241a16';
    for (let k = 0; k < 6; k++) {
      const x = 575 + k * 28, len = 10 + (k % 3) * 8;
      ctx.beginPath(); ctx.moveTo(x - 6, 250 + (k % 2) * 8); ctx.lineTo(x + 6, 250 + (k % 2) * 8); ctx.lineTo(x, 250 + (k % 2) * 8 + len); ctx.closePath(); ctx.fill();
    }
    // фонарь у входа
    ctx.save(); ctx.shadowColor = '#ffaa44'; ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffcc66'; ctx.beginPath(); ctx.arc(520, 250, 4 + Math.sin(gt * 4) * 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // рыцарь идёт к пещере
    const kx = 150 + p * 470;
    const enter = p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1;   // тает, входя во мрак
    ctx.save();
    ctx.globalAlpha = enter;
    ctx.translate(kx, 360 - 19 * 1.7);
    ctx.scale(1.7, 1.7);
    drawKnight(ctx, gt, true);
    ctx.restore();

  } else {
    // спуск и истребление тьмы
    ctx.fillStyle = '#040208'; ctx.fillRect(0, 0, CW, CH);
    // сужающиеся стены пещеры
    ctx.fillStyle = '#0d0a14';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(170, 0); ctx.lineTo(90, CH); ctx.lineTo(0, CH); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(CW, 0); ctx.lineTo(CW - 170, 0); ctx.lineTo(CW - 90, CH); ctx.lineTo(CW, CH); ctx.closePath(); ctx.fill();
    // глаза тьмы по краям, отступают к концу
    const eyeFade = p > 0.6 ? Math.max(0, 1 - (p - 0.6) / 0.35) : 1;
    ctx.save();
    const eyes: [number, number][] = [[120, 110], [690, 150], [150, 300], [660, 330], [95, 210], [710, 250]];
    eyes.forEach(([ex, ey], i) => {
      const fl = 0.5 + 0.5 * Math.sin(gt * 5 + i);
      ctx.globalAlpha = eyeFade * (0.5 + 0.5 * fl);
      ctx.fillStyle = '#ff2233';
      ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex + 11, ey + 2, 4, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
    // рыцарь спускается, меч поднят и разгорается
    ctx.save();
    ctx.translate(CW / 2, 170 + Math.sin(gt * 1.5) * 6 + p * 70);
    ctx.scale(2.6, 2.6);
    drawKnight(ctx, gt, false);
    drawRaisedSword(ctx, 0.4 + 0.6 * Math.min(1, p * 1.3));
    ctx.restore();
    // вспышка света, отбрасывающая тьму
    if (p > 0.6) {
      const b = (p - 0.6) / 0.4;
      const fg = ctx.createRadialGradient(CW / 2, 220, 10, CW / 2, 220, 60 + b * 460);
      fg.addColorStop(0, `rgba(200,225,255,${0.85 * b})`);
      fg.addColorStop(0.5, `rgba(102,160,255,${0.4 * b})`);
      fg.addColorStop(1, 'transparent');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, CW, CH);
    }
  }

  // кинематографические чёрные полосы
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CW, 26);
  ctx.fillRect(0, CH - 26, CW, 26);
}

export function Cutscene({ onDone }: { onDone: () => void }) {
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: '#000', lineHeight: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        style={{ display: 'block', height: '100%', width: 'auto', maxWidth: '100%', maxHeight: '100%', background: '#000' }}
      />

      {/* субтитры */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: '7%',
          display: 'flex', justifyContent: 'center', pointerEvents: 'none', padding: '0 24px',
        }}
      >
        <p
          key={subIdx}
          className="cutscene-line"
          style={{
            maxWidth: 560, textAlign: 'center', fontFamily: 'monospace', fontSize: 15, lineHeight: 1.5,
            color: '#dce8ff', textShadow: '0 2px 6px #000', background: 'rgba(2,2,12,0.45)',
            padding: '8px 16px', borderRadius: 8,
          }}
        >
          {SCENES[subIdx].sub}
        </p>
      </div>

      {/* пропуск */}
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
